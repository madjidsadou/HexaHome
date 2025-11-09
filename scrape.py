import pandas as pd
import numpy as np
import csv
import time
import re
import logging

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# ---------------------------
# Logging
# ---------------------------
logging.getLogger('selenium').setLevel(logging.WARNING)

# ---------------------------
# Cantons to scrape
# ---------------------------
CANTONS = [
    'Zurich',           # Zurich (ZH)
    'Berne',            # Bern (BE)
    'Lucerne',          # Luzern (LU)
    'Uri',              # UR
    'Schwytz',          # SZ
    'Obwald',           # OW
    'Nidwald',          # NW
    'Glaris',           # GL
    'Zoug',             # ZG
    'Fribourg',         # FR
    'Soleure',          # SO
    'Bâle-Ville',       # BS
    'Bâle-Campagne',    # BL
    'Schaffhouse',      # SH
    'Appenzell Rhodes-Extérieures',  # AR
    'Appenzell Rhodes-Intérieures',  # AI
    'Saint-Gall',       # SG
    'Grisons',          # GR
    'Argovie',          # AG
    'Thurgovie',        # TG
    'Tessin',           # TI
    'Vaud',             # VD
    'Valais',           # VS
    'Neuchatel',        # NE
    'Geneve',           # GE
    'Jura'              # JU
]


# ---------------------------
# Driver setup
# ---------------------------
def setup_driver(headless=True):
    chrome_options = Options()
    if headless:
        chrome_options.add_argument('--headless=new')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--disable-software-rasterizer')
    chrome_options.add_argument('--disable-extensions')
    chrome_options.add_argument('--disable-logging')
    chrome_options.add_argument('--log-level=3')
    chrome_options.add_argument('--silent')
    chrome_options.add_experimental_option('excludeSwitches', ['enable-logging','enable-automation'])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    
    import os
    log_path = 'NUL' if os.name == 'nt' else '/dev/null'
    service = Service(log_path=log_path)
    
    driver = webdriver.Chrome(options=chrome_options, service=service)
    driver.set_page_load_timeout(30)
    return driver

# ---------------------------
# Scrape single listing
# ---------------------------
def scrape_listing(listing, apartment_id, canton):
    try:
        # Coordinates
        latlng = listing.get_attribute('data-latlng')
        lat, lon = 'N/A', 'N/A'
        if latlng:
            coords = latlng.split(',')
            if len(coords) == 2:
                lat = coords[0].strip()
                lon = coords[1].strip()
        
        # Price
        price = 'N/A'
        try:
            price_elem = listing.find_element(By.CSS_SELECTOR, 'strong.title')
            price_text = price_elem.text.strip()
            price_match = re.search(r"CHF\s*([\d']+)", price_text)
            if price_match:
                price = price_match.group(1).replace("'", "")
        except NoSuchElementException:
            pass
        
        # Rooms
        rooms = 'N/A'
        try:
            type_elem = listing.find_element(By.CSS_SELECTOR, 'p.object-type')
            type_text = type_elem.text.strip()
            rooms_match = re.search(r'(\d+\.?\d*)\s*room', type_text, re.IGNORECASE)
            if rooms_match:
                rooms = rooms_match.group(1)
        except NoSuchElementException:
            pass
        
        # Address
        address = 'N/A'
        try:
            content_div = listing.find_element(By.CSS_SELECTOR, 'div.filter-item-content')
            p_tags = content_div.find_elements(By.TAG_NAME, 'p')
            if len(p_tags) >= 2:
                address = p_tags[1].text.strip()
            elif len(p_tags) == 1:
                text = p_tags[0].text.strip()
                if 'room' not in text.lower():
                    address = text
        except NoSuchElementException:
            pass
        
        # Link
        url = 'N/A'
        try:
            link_elem = listing.find_element(By.CSS_SELECTOR, 'a')
            url = link_elem.get_attribute('href')
        except NoSuchElementException:
            pass
        
        return {
            'id': apartment_id,
            'rooms': rooms,
            'address': address,
            'price': price,
            'lat': lat,
            'lon': lon,
            'canton': canton,
            'url': url
        }
    
    except Exception as e:
        print(f"      Error extracting: {e}")
        return None

# ---------------------------
# Scrape all listings
# ---------------------------
def scrape_immobilier(max_pages_per_canton=999, headless=True, test_mode=False):
    driver = setup_driver(headless=headless)
    apartments = []
    apartment_id = 1
    
    try:
        cantons_to_scrape = ['zurich'] if test_mode else CANTONS
        
        for canton in cantons_to_scrape:
            print(f"\n{'='*60}\nScraping: {canton.upper()}\n{'='*60}")
            
            page = 1
            seen_ids = set()
            consecutive_duplicate_pages = 0
            
            while page <= max_pages_per_canton:
                url = f"https://www.immobilier.ch/en/rent/apartment/{canton}?page={page}"
                print(f"\nPage {page}: Loading...")
                
                try:
                    driver.get(url)
                    wait = WebDriverWait(driver, 15)
                    try:
                        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'div.filter-item')))
                    except TimeoutException:
                        print(f"  ✗ No listings found - end of pages for {canton}")
                        break
                    
                    time.sleep(2)
                    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    time.sleep(1)
                    
                    listings = driver.find_elements(By.CSS_SELECTOR, 'div.filter-item[data-latlng]')
                    if not listings:
                        print(f"  ✗ No listings found - end of pages for {canton}")
                        break
                    
                    print(f"  ✓ Found {len(listings)} listings")
                    
                    page_ids = set()
                    for listing in listings:
                        listing_id = listing.get_attribute('data-id')
                        if listing_id:
                            page_ids.add(listing_id)
                    if page_ids and page_ids.issubset(seen_ids):
                        consecutive_duplicate_pages += 1
                        if consecutive_duplicate_pages >= 2:
                            break
                    else:
                        consecutive_duplicate_pages = 0
                    
                    new_listings = 0
                    for listing in listings:
                        listing_id = listing.get_attribute('data-id')
                        if listing_id and listing_id in seen_ids:
                            continue
                        
                        apt_data = scrape_listing(listing, apartment_id, canton)
                        if apt_data:
                            apartments.append(apt_data)
                            new_listings += 1
                            apartment_id += 1
                            if listing_id:
                                seen_ids.add(listing_id)
                    
                    if new_listings == 0:
                        break
                    
                    page += 1
                    time.sleep(2)
                
                except TimeoutException:
                    break
                except Exception as e:
                    print(f"  ✗ Error: {str(e)[:100]}")
                    break
    finally:
        print("\nClosing browser...")
        driver.quit()
    
    return apartments

# ---------------------------
# Save to CSV
# ---------------------------
def save_to_csv(apartments, filename='apartmentslink.csv'):
    if not apartments:
        print("⚠ No apartments to save!")
        return
    fieldnames = ['id', 'rooms', 'address', 'price', 'lat', 'lon', 'canton', 'url']
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(apartments)
    print(f"✓ Saved {len(apartments)} apartments to '{filename}'")

# ---------------------------
# Print statistics
# ---------------------------
def print_statistics(apartments):
    if not apartments:
        return
    print(f"\n{'='*60}\nSCRAPING COMPLETE\n{'='*60}")
    print(f"Total apartments: {len(apartments)}")
    
    with_coords = sum(1 for apt in apartments if apt['lat'] != 'N/A' and apt['lon'] != 'N/A')
    with_price = sum(1 for apt in apartments if apt['price'] != 'N/A')
    with_rooms = sum(1 for apt in apartments if apt['rooms'] != 'N/A')
    with_address = sum(1 for apt in apartments if apt['address'] != 'N/A')
    
    total = len(apartments)
    print(f"\nData completeness:")
    print(f"  • Price:       {with_price}/{total} ({100*with_price//total}%)")
    print(f"  • Rooms:       {with_rooms}/{total} ({100*with_rooms//total}%)")
    print(f"  • Address:     {with_address}/{total} ({100*with_address//total}%)")
    print(f"  • Coordinates: {with_coords}/{total} ({100*with_coords//total}%)")
    
    print("\nSample apartments:")
    for i, apt in enumerate(apartments[:3], 1):
        print(f"  Apartment {i}: {apt['rooms']} rooms | CHF {apt['price']} | {apt['address']} | {apt['url']}")

# ---------------------------
# Main
# ---------------------------
if __name__ == "__main__":
    print("\nIMMOBILIER.CH APARTMENT SCRAPER")
    choice = input("Select mode (1=Quick Test, 2=Test headless, 3=Full headless, 4=Full visible): ").strip()
    
    if choice == '1':
        test_mode, headless = True, False
    elif choice == '2':
        test_mode, headless = True, True
    elif choice == '4':
        test_mode, headless = False, False
    else:
        test_mode, headless = False, True
    
    apartments = scrape_immobilier(max_pages_per_canton=999, headless=headless, test_mode=test_mode)
    if apartments:
        save_to_csv(apartments)
        print_statistics(apartments)
    else:
        print("⚠ No apartments were scraped!")
