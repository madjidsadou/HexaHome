from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import csv
import time
import re
import logging

# Suppress Selenium logging
logging.getLogger('selenium').setLevel(logging.WARNING)

# Swiss cantons for searching
CANTONS = [
    'berne','obwald', 'nidwald','Schwytz'
    'glaris', 'zoug', 'Soleure', 'Bâle-Ville', 'Bâle-Campagne',
    'Schaffhouse', 'Appenzell Rhodes-Intérieures', 'appenzell-innerrhoden', 
    'Saint-Gall', 'Grisons', 'Argovie', 'Thurgovie', 'Tessin'
]

def setup_driver(headless=True):
    """Setup Chrome driver with options"""
    chrome_options = Options()
    
    if headless:
        chrome_options.add_argument('--headless=new')
    
    # Core options
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--disable-software-rasterizer')
    chrome_options.add_argument('--disable-extensions')
    
    # Suppress all logging and errors
    chrome_options.add_argument('--disable-logging')
    chrome_options.add_argument('--log-level=3')
    chrome_options.add_argument('--silent')
    chrome_options.add_experimental_option('excludeSwitches', ['enable-logging', 'enable-automation'])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # Suppress GPU errors
    chrome_options.add_argument('--disable-features=WebGL')
    chrome_options.add_argument('--disable-features=WebGL2')
    chrome_options.add_argument('--disable-gpu-compositing')
    chrome_options.add_argument('--disable-accelerated-2d-canvas')
    chrome_options.add_argument('--disable-gpu-vsync')
    
    # Anti-detection
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    
    # Redirect logs to null
    import os
    log_path = 'NUL' if os.name == 'nt' else '/dev/null'
    service = Service(log_path=log_path)
    
    driver = webdriver.Chrome(options=chrome_options, service=service)
    driver.set_page_load_timeout(30)
    
    return driver

def scrape_listing(listing, apartment_id, canton):
    """Extract data from a single listing element using exact selectors"""
    try:
        # Extract coordinates from data-latlng attribute
        latlng = listing.get_attribute('data-latlng')
        lat = 'N/A'
        lon = 'N/A'
        
        if latlng:
            coords = latlng.split(',')
            if len(coords) == 2:
                lat = coords[0].strip()
                lon = coords[1].strip()
        
        # Extract price from strong.title
        price = 'N/A'
        try:
            price_elem = listing.find_element(By.CSS_SELECTOR, 'strong.title')
            price_text = price_elem.text.strip()
            # Extract number from "CHF 2'100.-/month"
            price_match = re.search(r"CHF\s*([\d']+)", price_text)
            if price_match:
                price = price_match.group(1).replace("'", "")
        except NoSuchElementException:
            pass
        
        # Extract rooms from object-type (e.g., "Furnished flat 1 room")
        rooms = 'N/A'
        try:
            type_elem = listing.find_element(By.CSS_SELECTOR, 'p.object-type')
            type_text = type_elem.text.strip()
            # Extract number before "room" or "rooms"
            rooms_match = re.search(r'(\d+\.?\d*)\s*room', type_text, re.IGNORECASE)
            if rooms_match:
                rooms = rooms_match.group(1)
            else:
                # Try to find in characteristic list (icon-plan)
                try:
                    rooms_elem = listing.find_element(By.CSS_SELECTOR, 'i.icon-plan')
                    # Get the text after the icon
                    parent = rooms_elem.find_element(By.XPATH, '..')
                    rooms_text = parent.text.strip()
                    if rooms_text:
                        rooms = rooms_text
                except:
                    pass
        except NoSuchElementException:
            pass
        
        # Extract address from the p tag after object-type
        address = 'N/A'
        try:
            # Find all p tags in filter-item-content
            content_div = listing.find_element(By.CSS_SELECTOR, 'div.filter-item-content')
            p_tags = content_div.find_elements(By.TAG_NAME, 'p')
            
            # The address is typically the second p tag (after object-type)
            if len(p_tags) >= 2:
                address = p_tags[1].text.strip()
            elif len(p_tags) == 1:
                # Sometimes there might be only address
                text = p_tags[0].text.strip()
                if 'room' not in text.lower():
                    address = text
        except NoSuchElementException:
            pass
        
        return {
            'id': apartment_id,
            'rooms': rooms,
            'address': address,
            'price': price,
            'lat': lat,
            'lon': lon,
            'canton': canton
        }
    
    except Exception as e:
        print(f"      Error extracting: {e}")
        return None

def scrape_immobilier(max_pages_per_canton=999, headless=True, test_mode=False):
    """Scrape apartment listings from immobilier.ch"""
    
    print("Initializing browser...")
    driver = setup_driver(headless=headless)
    apartments = []
    apartment_id = 1
    
    try:
        cantons_to_scrape = ['zurich'] if test_mode else CANTONS
        
        for canton in cantons_to_scrape:
            print(f"\n{'='*60}")
            print(f"Scraping: {canton.upper()}")
            print(f"{'='*60}")
            
            page = 1
            seen_ids = set()  # Track listing IDs we've already seen
            consecutive_duplicate_pages = 0
            
            while page <= max_pages_per_canton:
                url = f"https://www.immobilier.ch/en/rent/apartment/{canton}?page={page}"
                print(f"\nPage {page}: Loading...")
                
                try:
                    driver.get(url)
                    
                    # Wait for the filter items to load
                    wait = WebDriverWait(driver, 15)
                    
                    try:
                        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'div.filter-item')))
                    except TimeoutException:
                        print(f"  ✗ No listings found - end of pages for {canton}")
                        break
                    
                    # Give a moment for all elements to render
                    time.sleep(2)
                    
                    # Scroll to load any lazy content
                    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    time.sleep(1)
                    
                    # Find all listing divs with class "filter-item"
                    listings = driver.find_elements(By.CSS_SELECTOR, 'div.filter-item[data-latlng]')
                    
                    if not listings or len(listings) == 0:
                        print(f"  ✗ No listings found - end of pages for {canton}")
                        break
                    
                    print(f"  ✓ Found {len(listings)} listings")
                    
                    # Get IDs of listings on this page to detect duplicates
                    page_ids = set()
                    for listing in listings:
                        listing_id = listing.get_attribute('data-id')
                        if listing_id:
                            page_ids.add(listing_id)
                    
                    # Check if all listings on this page are duplicates
                    if page_ids and page_ids.issubset(seen_ids):
                        consecutive_duplicate_pages += 1
                        print(f"  ⚠ All listings are duplicates (duplicate page #{consecutive_duplicate_pages})")
                        
                        if consecutive_duplicate_pages >= 2:
                            print(f"  ✗ Reached end of pages for {canton} (duplicate pages detected)")
                            break
                    else:
                        consecutive_duplicate_pages = 0
                    
                    # Process each listing
                    extracted = 0
                    new_listings = 0
                    for i, listing in enumerate(listings, 1):
                        listing_id = listing.get_attribute('data-id')
                        
                        # Skip if we've seen this listing before
                        if listing_id and listing_id in seen_ids:
                            continue
                        
                        apt_data = scrape_listing(listing, apartment_id, canton)
                        
                        if apt_data:
                            apartments.append(apt_data)
                            extracted += 1
                            new_listings += 1
                            apartment_id += 1
                            
                            # Mark this listing as seen
                            if listing_id:
                                seen_ids.add(listing_id)
                            
                            # Show sample of first few
                            if extracted <= 3:
                                print(f"    {extracted}. {apt_data['rooms']} rooms | {apt_data['price']} CHF | {apt_data['address'][:40]}...")
                    
                    print(f"  ✓ Extracted {new_listings} new listings ({extracted} total on page)")
                    
                    if new_listings == 0:
                        print(f"  ✗ No new listings - end of pages for {canton}")
                        break
                    
                    page += 1
                    time.sleep(2)  # Rate limiting
                    
                except TimeoutException:
                    print(f"  ✗ Timeout - end of pages for {canton}")
                    break
                except Exception as e:
                    print(f"  ✗ Error: {str(e)[:100]}")
                    break
        
    finally:
        print("\n" + "="*60)
        print("Closing browser...")
        driver.quit()
    
    return apartments

def save_to_csv(apartments, filename='apartments1.csv'):
    """Save apartment data to CSV file"""
    if not apartments:
        print("\n⚠ No apartments to save!")
        return
    
    fieldnames = ['id', 'rooms', 'address', 'price', 'lat', 'lon', 'canton']
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(apartments)
    
    print(f"\n✓ Saved {len(apartments)} apartments to '{filename}'")

def print_statistics(apartments):
    """Print scraping statistics"""
    if not apartments:
        return
    
    print(f"\n{'='*60}")
    print("SCRAPING COMPLETE")
    print(f"{'='*60}")
    print(f"\nTotal apartments: {len(apartments)}")
    
    with_coords = sum(1 for apt in apartments if apt['lat'] != 'N/A' and apt['lon'] != 'N/A')
    with_price = sum(1 for apt in apartments if apt['price'] != 'N/A')
    with_rooms = sum(1 for apt in apartments if apt['rooms'] != 'N/A')
    with_address = sum(1 for apt in apartments if apt['address'] != 'N/A')
    
    total = len(apartments)
    print(f"\nData completeness:")
    print(f"  • Price:       {with_price}/{total} ({100*with_price//total if total else 0}%)")
    print(f"  • Rooms:       {with_rooms}/{total} ({100*with_rooms//total if total else 0}%)")
    print(f"  • Address:     {with_address}/{total} ({100*with_address//total if total else 0}%)")
    print(f"  • Coordinates: {with_coords}/{total} ({100*with_coords//total if total else 0}%)")
    
    # By canton
    cantons_count = {}
    for apt in apartments:
        cantons_count[apt['canton']] = cantons_count.get(apt['canton'], 0) + 1
    
    print(f"\nBy canton (top 10):")
    for canton, count in sorted(cantons_count.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  • {canton.capitalize()}: {count}")
    
    # Show samples
    print(f"\nSample apartments:")
    for i, apt in enumerate(apartments[:3], 1):
        print(f"\n  Apartment {i}:")
        print(f"    Rooms:   {apt['rooms']}")
        print(f"    Price:   CHF {apt['price']}")
        print(f"    Address: {apt['address']}")
        print(f"    Coords:  {apt['lat']}, {apt['lon']}")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("IMMOBILIER.CH APARTMENT SCRAPER")
    print("="*60)
    
    print("\nMode selection:")
    print("  1. Quick test (Zurich only, visible browser, all pages)")
    print("  2. Test mode (Zurich only, headless, all pages)")
    print("  3. Full scrape (all cantons, headless, all pages)")
    print("  4. Full scrape (all cantons, visible browser, all pages)")
    
    choice = input("\nSelect mode (1-4): ").strip()
    
    if choice == '1':
        test_mode, headless, pages = True, False, 999
    elif choice == '2':
        test_mode, headless, pages = True, True, 999
    elif choice == '4':
        test_mode, headless, pages = False, False, 999
    else:
        test_mode, headless, pages = False, True, 999
    
    print(f"\nConfiguration:")
    print(f"  • Mode: {'TEST (Zurich)' if test_mode else 'FULL (all cantons)'}")
    print(f"  • Browser: {'Headless' if headless else 'Visible'}")
    print(f"  • Pages per canton: All available pages")
    print()
    
    input("Press Enter to start...")
    
    apartments = scrape_immobilier(
        max_pages_per_canton=pages,
        headless=headless,
        test_mode=test_mode
    )
    
    if apartments:
        save_to_csv(apartments)
        print_statistics(apartments)
    else:
        print("\n⚠ No apartments were scraped!")
    
    print("\n" + "="*60)
    print("Done!")
    print("="*60 + "\n")