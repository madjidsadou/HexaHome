var map = L.map('map', {
  center: [46.8, 8.3],
  zoom: 8,
  minZoom: 7,
  maxZoom: 15,
  maxBounds: [
    [45.0, 4.0],
    [48.5, 12.5]
  ]
});

const toggle = document.getElementById("toggle-cantons");
const cantonList = document.getElementById("cantons-list");

toggle.addEventListener("click", () => {
  if (cantonList.style.display === "none" || cantonList.style.display === "") {
    cantonList.style.display = "block";
    toggle.querySelector('.toggle-arrow').textContent = '▴';
  } else {
    cantonList.style.display = "none";
    toggle.querySelector('.toggle-arrow').textContent = '▾';
  }
});

const toggleOpacity = document.getElementById("toggle-opacity");
const opacityContainer = document.getElementById("opacity-container");

toggleOpacity.addEventListener("click", () => {
  if (opacityContainer.style.display === "none" || opacityContainer.style.display === "") {
    opacityContainer.style.display = "block";
    toggleOpacity.querySelector('.toggle-arrow').textContent = '▴';
  } else {
    opacityContainer.style.display = "none";
    toggleOpacity.querySelector('.toggle-arrow').textContent = '▾';
  }
});

setTimeout(() => {
  const opacitySlider = document.getElementById('hexagon-opacity-slider');
  const opacityValue = document.getElementById('hexagon-opacity-value');
  
  if (opacitySlider && opacityValue) {
    opacitySlider.addEventListener('input', (e) => {
      hexOpacity = parseFloat(e.target.value);
      opacityValue.textContent = hexOpacity.toFixed(2);
      g.selectAll("path.hex").attr("fill-opacity", hexOpacity);
    });
  }
}, 100);

const toggleFacilities = document.getElementById("toggle-facilities");
const facilitiesList = document.getElementById("facilities-list");

toggleFacilities.addEventListener("click", () => {
  if (facilitiesList.style.display === "none" || facilitiesList.style.display === "") {
    facilitiesList.style.display = "block";
    toggleFacilities.querySelector('.toggle-arrow').textContent = '▴';
  } else {
    facilitiesList.style.display = "none";
    toggleFacilities.querySelector('.toggle-arrow').textContent = '▾';
  }
});

const toggleind = document.getElementById("index");
const listind = document.getElementById("sliders-container");

toggleind.addEventListener("click", () => {
  if (listind.style.display === "none" || listind.style.display === "") {
    listind.style.display = "block";
    toggleind.querySelector('.toggle-arrow').textContent = '▴';
  } else {
    listind.style.display = "none";
    toggleind.querySelector('.toggle-arrow').textContent = '▾';
  }
});

const infoIcons = document.querySelectorAll('.info-icon');

if (infoIcons.length) {
  const tooltipEl = document.createElement('div');
  tooltipEl.className = 'menu-tooltip';
  tooltipEl.setAttribute('role', 'tooltip');
  tooltipEl.setAttribute('aria-hidden', 'true');
  tooltipEl.setAttribute('data-placement', 'top');
  document.body.appendChild(tooltipEl);

  let tooltipVisible = false;
  let activeInfoIcon = null;
  let lastPointerType = null;

  const spacing = 12;
  const viewportPadding = 16;

  const hideTooltip = () => {
    if (!tooltipVisible) return;
    tooltipVisible = false;
    delete tooltipEl.dataset.visible;
    tooltipEl.setAttribute('aria-hidden', 'true');
    tooltipEl.style.top = '-9999px';
    tooltipEl.style.left = '-9999px';
    activeInfoIcon = null;
  };

  const positionTooltip = (icon) => {
    if (!tooltipVisible || !icon) return;

    const rect = icon.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.top - tooltipRect.height - spacing;
    let placement = 'top';

    if (top < viewportPadding) {
      placement = 'bottom';
      top = rect.bottom + spacing;
    }

    if (placement === 'bottom' && top + tooltipRect.height > window.innerHeight - viewportPadding) {
      top = Math.max(viewportPadding, window.innerHeight - viewportPadding - tooltipRect.height);
    }

    if (placement === 'top' && top < viewportPadding) {
      top = viewportPadding;
    }

    if (left < viewportPadding) {
      left = viewportPadding;
    }

    if (left + tooltipRect.width > window.innerWidth - viewportPadding) {
      left = window.innerWidth - viewportPadding - tooltipRect.width;
    }

    tooltipEl.setAttribute('data-placement', placement);
    tooltipEl.style.top = `${top}px`;
    tooltipEl.style.left = `${left}px`;
  };

  const showTooltip = (event) => {
    const icon = event.currentTarget;
    const text = icon.getAttribute('data-tooltip');
    if (!text) return;

    activeInfoIcon = icon;
    tooltipEl.textContent = text;
    tooltipEl.style.top = '-9999px';
    tooltipEl.style.left = '-9999px';
    tooltipEl.setAttribute('data-placement', 'top');
    tooltipEl.dataset.visible = 'true';
    tooltipEl.setAttribute('aria-hidden', 'false');
    tooltipVisible = true;

    requestAnimationFrame(() => {
      positionTooltip(icon);
    });
  };

  infoIcons.forEach((icon) => {
    icon.addEventListener('pointerdown', (ev) => {
      lastPointerType = ev.pointerType;
    });

    icon.addEventListener('mouseenter', (event) => {
      if (lastPointerType === 'touch' || lastPointerType === 'pen') return;
      showTooltip(event);
    });

    icon.addEventListener('focus', (event) => {
      if (lastPointerType === 'mouse' || lastPointerType === 'touch' || lastPointerType === 'pen') return;
      showTooltip(event);
    });

    icon.addEventListener('mouseleave', hideTooltip);
    icon.addEventListener('blur', hideTooltip);

    icon.addEventListener('mousemove', () => {
      if (tooltipVisible && activeInfoIcon === icon) {
        positionTooltip(icon);
      }
    });

    icon.addEventListener('click', (event) => {
      if (lastPointerType !== 'touch' && lastPointerType !== 'pen') return;
      event.preventDefault();
      if (tooltipVisible && activeInfoIcon === icon) {
        hideTooltip();
      } else {
        showTooltip(event);
      }
    });
  });

  window.addEventListener('scroll', () => {
    if (tooltipVisible && activeInfoIcon) {
      positionTooltip(activeInfoIcon);
    }
  }, true);

  window.addEventListener('resize', () => {
    if (tooltipVisible && activeInfoIcon) {
      positionTooltip(activeInfoIcon);
    }
  });

  const menuInner = document.querySelector('.menu-inner');
  if (menuInner) {
    menuInner.addEventListener('scroll', () => {
      if (tooltipVisible) {
        hideTooltip();
      }
    }, { passive: true });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideTooltip();
    }
    if (event.key === 'Tab') {
      lastPointerType = 'keyboard';
    }
  });

  document.addEventListener('click', (event) => {
    if (!tooltipVisible) return;
    if (activeInfoIcon && (event.target === activeInfoIcon || activeInfoIcon.contains(event.target))) {
      return;
    }
    hideTooltip();
  });
}

// Base layer
L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// SVG overlay for D3
L.svg().addTo(map);
const svg = d3.select(map.getPanes().overlayPane).select("svg");
const g = svg.append("g").attr("class", "leaflet-zoom-hide");

let activePopup = null;
let popupCloseTimeout = null;

function cancelPopupClose() {
  if (popupCloseTimeout) {
    clearTimeout(popupCloseTimeout);
    popupCloseTimeout = null;
  }
}

function schedulePopupClose() {
  cancelPopupClose();
  popupCloseTimeout = setTimeout(() => {
    if (activePopup) {
      map.closePopup(activePopup);
      activePopup = null;
    }
  }, 200);
}

const handlePopupMouseEnter = () => cancelPopupClose();
const handlePopupMouseLeave = () => schedulePopupClose();

map.on('popupopen', (e) => {
  activePopup = e.popup;
  cancelPopupClose();
  const popupEl = e.popup.getElement();
  if (popupEl) {
    popupEl.addEventListener('mouseenter', handlePopupMouseEnter);
    popupEl.addEventListener('mouseleave', handlePopupMouseLeave);
  }
});

map.on('popupclose', (e) => {
  const popupEl = e.popup.getElement();
  if (popupEl) {
    popupEl.removeEventListener('mouseenter', handlePopupMouseEnter);
    popupEl.removeEventListener('mouseleave', handlePopupMouseLeave);
  }
  cancelPopupClose();
  activePopup = null;
});

let selectedKantonNum = [];
let swissData = null;
let hexRadiusDeg = 0.0018;
let precomputedData = {};
let schoolLocations = [];
let supermarketLocations = [];
let restoLocations = [];
let accessRoads = [];
let apartmentData = [];
let hexOpacity = 0.7;
let apartmentToHexagonMap = new Map(); // Maps apartment ID to hexagon ID
const compareColors = ['#1f77b4', '#ff7f0e'];
let compareMode = false;
let compareSelections = [];
let compareUi = {
  toggleButton: null,
  panel: null,
  status: null,
  selection: null,
  summary: null,
  chart: null,
  reset: null
};

const cantonNameMap = {
  1: "Zürich",
  2: "Bern",
  3: "Luzern",
  4: "Uri",
  5: "Schwyz",
  6: "Obwalden",
  7: "Nidwalden",
  8: "Glarus",
  9: "Zug",
  10: "Fribourg",
  11: "Solothurn",
  12: "Basel-Stadt",
  13: "Basel-Landschaft",
  14: "Schaffhausen",
  15: "Appenzell Ausserrhoden",
  16: "Appenzell Innerrhoden",
  17: "St. Gallen",
  18: "Graubünden",
  19: "Aargau",
  20: "Thurgau",
  21: "Ticino",
  22: "Vaud",
  23: "Valais",
  24: "Neuchâtel",
  25: "Geneva",
  26: "Jura"
};

const cantonAliasLookup = new Map();

const knownPlaces = [
  { name: 'Lausanne', lat: 46.5197, lon: 6.6323, aliases: ['lausanne'] },
  { name: 'EPFL', lat: 46.5191, lon: 6.5668, aliases: ['epfl', 'ecole polytechnique federale de lausanne', 'ecole polytechnique federale', 'ecole polytechnique fédérale', 'epfl campus'] },
  { name: 'Geneva', lat: 46.2044, lon: 6.1432, aliases: ['geneva', 'geneve', 'genève'] },
  { name: 'Zurich', lat: 47.3769, lon: 8.5417, aliases: ['zurich', 'zürich'] },
  { name: 'Bern', lat: 46.9481, lon: 7.4474, aliases: ['bern', 'berne'] },
  { name: 'Basel', lat: 47.5596, lon: 7.5886, aliases: ['basel', 'basle'] },
  { name: 'Lugano', lat: 46.0037, lon: 8.9511, aliases: ['lugano'] }
];

const placeLookup = new Map();
const geocodeCache = new Map();
const geocodeInFlight = new Map();
const geocodeQueue = [];
let geocodeProcessing = false;

function processGeocodeQueue() {
  if (geocodeProcessing) return;
  if (!geocodeQueue.length) return;

  geocodeProcessing = true;
  if (typeof fetch !== 'function') {
    geocodeQueue.length = 0;
    geocodeProcessing = false;
    return;
  }

  const { normalizedKey, query, resolve, displayName, options } = geocodeQueue.shift();

  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=1&countrycodes=ch&q=${encodeURIComponent(query)}`;

  fetch(url, {
    headers: {
      Accept: 'application/json'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Geocode error ${response.status}`);
      }
      return response.json();
    })
    .then(results => {
      if (Array.isArray(results) && results.length) {
        const best = results[0];
        const lat = parseFloat(best.lat);
        const lon = parseFloat(best.lon);
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          const label = best.display_name ? best.display_name.split(',')[0] : query;
          const aliases = [normalizedKey];
          if (displayName && displayName !== normalizedKey) {
            aliases.push(displayName);
          }
          if (label && !aliases.includes(label)) {
            aliases.push(label);
          }
          const place = {
            name: label,
            lat,
            lon,
            source: 'nominatim',
            aliases
          };
          geocodeCache.set(normalizedKey, place);
          registerPlace(place, place.aliases);
          const result = options && typeof options.radiusKm === 'number'
            ? { ...place, radiusKm: options.radiusKm }
            : place;
          resolve(result);
          return;
        }
      }
      geocodeCache.set(normalizedKey, null);
  resolve(null);
    })
    .catch(error => {
      console.warn('Geocode lookup failed for', query, error);
      geocodeCache.set(normalizedKey, null);
      resolve(null);
    })
    .finally(() => {
      geocodeInFlight.delete(normalizedKey);
      setTimeout(() => {
        geocodeProcessing = false;
        processGeocodeQueue();
      }, 1200);
    });
}

function queueDynamicPlaceLookup(normalizedKey, rawQuery, options = {}) {
  if (!normalizedKey) return null;
  if (placeLookup.has(normalizedKey)) return null;
  if (geocodeCache.has(normalizedKey)) {
    const cached = geocodeCache.get(normalizedKey);
    if (cached) {
      registerPlace(cached, cached.aliases || []);
    }
    return null;
  }

  if (geocodeInFlight.has(normalizedKey)) {
    return geocodeInFlight.get(normalizedKey);
  }

  if (typeof fetch !== 'function') {
    return null;
  }

  const trimmedRaw = rawQuery && rawQuery.trim() ? rawQuery.trim() : '';
  const query = trimmedRaw ? `${trimmedRaw}, Switzerland` : normalizedKey;

  let resolver = null;
  const promise = new Promise(resolve => {
    resolver = resolve;
  });

  geocodeQueue.push({ normalizedKey, query, resolve: resolver, displayName: trimmedRaw || normalizedKey, options });
  geocodeInFlight.set(normalizedKey, promise);
  processGeocodeQueue();

  return promise;
}

function registerPlace(place, extraAliases = []) {
  if (!place || place.lat == null || place.lon == null) return;
  const aliases = Array.isArray(extraAliases) ? extraAliases.slice() : [];
  if (!aliases.includes(place.name)) {
    aliases.push(place.name);
  }

  aliases.forEach(alias => {
    const normalizedAlias = normalizePlaceToken(alias);
    if (!normalizedAlias) return;
    placeLookup.set(normalizedAlias, place);
    const noSpace = normalizedAlias.replace(/\s+/g, '');
    placeLookup.set(noSpace, place);
  });
}

function normalizeCantonToken(value) {
  if (!value) return "";
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

Object.entries(cantonNameMap).forEach(([num, name]) => {
  const normalized = normalizeCantonToken(name);
  cantonAliasLookup.set(normalized, { num: parseInt(num, 10), name });
  const lowerNoSpaces = normalized.replace(/\s+/g, "");
  cantonAliasLookup.set(lowerNoSpaces, { num: parseInt(num, 10), name });
});

function normalizePlaceToken(value) {
  if (!value) return '';
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

knownPlaces.forEach(place => {
  registerPlace(place, place.aliases);
});

[
  [25, ["geneve", "genf"]],
  [22, ["lausanne", "waadt"]],
  [23, ["valais", "wallis"]],
  [17, ["st gallen", "st.gallen", "sankt gallen"]],
  [12, ["basel", "basle"]],
  [13, ["baselland"]],
  [10, ["fribourg", "freiburg"]],
  [3, ["lucerne"]],
  [1, ["zurich"]],
  [2, ["bern", "berne"]],
  [19, ["argovia"]],
  [21, ["ticino", "tesin", "ticinese"]],
  [24, ["neuchatel"]]
].forEach(([num, aliases]) => {
  aliases.forEach(alias => {
    const normalized = normalizeCantonToken(alias);
    if (!normalized) return;
    cantonAliasLookup.set(normalized, { num, name: cantonNameMap[num] });
    cantonAliasLookup.set(normalized.replace(/\s+/g, ""), { num, name: cantonNameMap[num] });
  });
});

const numberFormatter = new Intl.NumberFormat('de-CH');
const currencyFormatter = new Intl.NumberFormat('de-CH', {
  style: 'currency',
  currency: 'CHF',
  maximumFractionDigits: 0
});

let apartmentInsights = [];
let cantonStats = {};
let countryStats = null;
let rastersReady = false;
let insightsReady = false;
let insightsBuilding = false;
let pendingChatQueue = [];
let chatElements = null;
let chatHasGreeted = false;
const chatbotState = {
  lastIntent: null,
  lastFilters: null,
  waitingForData: false,
  pendingGeocodeFollowups: []
};

const GEMINI_MODEL = 'gemini-1.5-flash-latest';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_TIMEOUT_MS = 9000;
const GEMINI_INTENT_CANON = {
  greeting: 'greeting',
  greet: 'greeting',
  hello: 'greeting',
  gratitude: 'gratitude',
  thanks: 'gratitude',
  help: 'help',
  support: 'help',
  guidance: 'help',
  stats: 'basicStats',
  basic_stats: 'basicStats',
  basicstats: 'basicStats',
  summary: 'basicStats',
  overview: 'basicStats',
  insight: 'basicStats',
  recommend: 'goodSpots',
  recommendation: 'goodSpots',
  suggest: 'goodSpots',
  shortlist: 'goodSpots',
  housing: 'goodSpots',
  reset: 'reset',
  restart: 'reset'
};
let geminiMissingKeyWarned = false;

function getGeminiApiKey() {
  if (typeof window === 'undefined') return null;
  if (window.GEMINI_API_KEY && typeof window.GEMINI_API_KEY === 'string' && window.GEMINI_API_KEY.trim()) {
    return window.GEMINI_API_KEY.trim();
  }
  const bodyDatasetKey = document.body && document.body.dataset ? document.body.dataset.geminiKey : null;
  if (bodyDatasetKey && bodyDatasetKey.trim()) return bodyDatasetKey.trim();
  const metaTag = document.querySelector('meta[name="gemini-api-key"]');
  if (metaTag && metaTag.content && metaTag.content.trim()) return metaTag.content.trim();
  try {
    const stored = window.localStorage ? window.localStorage.getItem('GEMINI_API_KEY') : null;
    if (stored && stored.trim()) return stored.trim();
  } catch (err) {
    /* ignore */
  }
  return null;
}

function toFiniteNumber(value) {
  if (value == null) return null;
  const numeric = typeof value === 'string' ? parseFloat(value.replace(/[^\d.,-]/g, '').replace(',', '.')) : Number(value);
  if (!Number.isFinite(numeric)) return null;
  return numeric;
}

function normalizePreferenceLabel(value) {
  if (!value) return null;
  const lower = value.toString().trim().toLowerCase();
  if (['cheap', 'cheapest', 'budget', 'affordable', 'low'].includes(lower)) return 'cheapest';
  if (['luxury', 'expensive', 'premium', 'highend', 'high-end'].includes(lower)) return 'luxury';
  if (['worst', 'avoid', 'low', 'lowscore'].includes(lower)) return 'worst';
  if (['best', 'top', 'optimal', 'ideal', 'highscore'].includes(lower)) return 'best';
  return null;
}

function normalizeEnvironmentLabel(value) {
  if (!value) return null;
  const lower = value.toString().trim().toLowerCase();
  if (['quiet', 'calm', 'silence', 'silent', 'low-noise', 'low noise'].includes(lower)) return 'quiet';
  if (['green', 'vegetation', 'nature', 'park', 'parks'].includes(lower)) return 'green';
  return null;
}

function normalizeFacilityLabel(value) {
  if (!value) return null;
  const lower = value.toString().trim().toLowerCase();
  if (['school', 'schools', 'education', 'campus'].includes(lower)) return 'schools';
  if (['transport', 'transit', 'public transport', 'bus', 'train', 'mobility'].includes(lower)) return 'transport';
  if (['shops', 'amenities', 'grocery', 'retail', 'shopping', 'stores'].includes(lower)) return 'amenities';
  return null;
}

function mapGeminiIntent(intent, fallbackIntent) {
  if (!intent) return fallbackIntent || 'fallback';
  const lower = intent.toString().trim().toLowerCase();
  if (GEMINI_INTENT_CANON[lower]) {
    return GEMINI_INTENT_CANON[lower];
  }
  if (lower.startsWith('stat')) return 'basicStats';
  if (lower.startsWith('suggest') || lower.startsWith('recommend')) return 'goodSpots';
  if (lower.startsWith('help')) return 'help';
  if (lower.startsWith('greet')) return 'greeting';
  if (lower.startsWith('thank')) return 'gratitude';
  if (lower.startsWith('reset') || lower.startsWith('restart')) return 'reset';
  return fallbackIntent || 'fallback';
}

function cloneFilterState(baseFilters) {
  const clone = {
    cantons: [],
    budget: baseFilters && baseFilters.budget != null ? baseFilters.budget : null,
    rooms: baseFilters && baseFilters.rooms != null ? baseFilters.rooms : null,
    preference: baseFilters && baseFilters.preference ? baseFilters.preference : null,
    environmentFocus: baseFilters && baseFilters.environmentFocus ? baseFilters.environmentFocus : null,
    facilityFocus: baseFilters && baseFilters.facilityFocus ? baseFilters.facilityFocus : null,
    proximityTargets: Array.isArray(baseFilters?.proximityTargets) ? baseFilters.proximityTargets.slice() : [],
    pendingGeocodes: Array.isArray(baseFilters?.pendingGeocodes) ? baseFilters.pendingGeocodes.slice() : [],
    pendingPlaceNames: Array.isArray(baseFilters?.pendingPlaceNames) ? baseFilters.pendingPlaceNames.slice() : [],
    searchRadiusKm: baseFilters && typeof baseFilters.searchRadiusKm === 'number' ? baseFilters.searchRadiusKm : null,
    priorities: Array.isArray(baseFilters?.priorities) ? baseFilters.priorities.slice() : []
  };
  if (Array.isArray(baseFilters?.cantons) && baseFilters.cantons.length) {
    clone.cantons = baseFilters.cantons.slice();
  }
  return clone;
}

function dedupeArray(items, keyFn) {
  if (!Array.isArray(items) || !items.length) return [];
  const seen = new Set();
  const output = [];
  items.forEach(item => {
    const key = keyFn(item);
    if (!key || seen.has(key)) return;
    seen.add(key);
    output.push(item);
  });
  return output;
}

function resolveGeminiProximityTargets(names) {
  if (!Array.isArray(names) || !names.length) {
    return { matches: [], pending: [], missing: [] };
  }
  const matches = [];
  const pending = [];
  const missing = [];
  const seen = new Set();

  names.forEach(entry => {
    const label = typeof entry === 'string'
      ? entry
      : entry && (entry.name || entry.label || entry.title || entry.value || entry.place);
    if (!label) return;
    const trimmed = label.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const normalized = normalizePlaceToken(trimmed);
    if (!normalized) return;

    const radiusCandidates = [];
    if (entry && typeof entry === 'object') {
      ['radius', 'radiusKm', 'radius_km', 'distance', 'maxDistance', 'distanceKm', 'distance_km'].forEach(prop => {
        if (entry[prop] != null) {
          const val = toFiniteNumber(entry[prop]);
          if (val != null) {
            const propName = prop.toLowerCase();
            if (propName.includes('meter')) {
              radiusCandidates.push(val / 1000);
            } else {
              radiusCandidates.push(val);
            }
          }
        }
      });
    }
    const radiusKm = radiusCandidates.length ? Math.min(...radiusCandidates.filter(v => v > 0.01)) : null;

    let canonical = placeLookup.get(normalized) || placeLookup.get(normalized.replace(/\s+/g, ''));

    if (!canonical && entry && typeof entry === 'object') {
      const latCandidate = toFiniteNumber(entry.lat ?? entry.latitude ?? (entry.coordinates && entry.coordinates.lat));
      const lonCandidate = toFiniteNumber(entry.lon ?? entry.lng ?? entry.long ?? entry.longitude ?? (entry.coordinates && (entry.coordinates.lon ?? entry.coordinates.lng ?? entry.coordinates.long)));
      if (Number.isFinite(latCandidate) && Number.isFinite(lonCandidate)) {
        canonical = {
          name: trimmed,
          lat: latCandidate,
          lon: lonCandidate,
          source: 'gemini-hint'
        };
        registerPlace(canonical, [trimmed]);
      }
    }

    if (canonical) {
      matches.push(radiusKm != null ? { ...canonical, radiusKm } : canonical);
    } else {
      const lookupPromise = queueDynamicPlaceLookup(normalized, trimmed, { radiusKm });
      if (lookupPromise) {
        pending.push({ promise: lookupPromise, radiusKm, name: trimmed });
      }
      missing.push(trimmed);
    }
  });

  return { matches, pending, missing };
}

function mergeGeminiFilters(geminiPayload, fallbackFilters) {
  const merged = cloneFilterState(fallbackFilters || {});
  const payload = geminiPayload && typeof geminiPayload === 'object' ? geminiPayload : {};
  const structuredIntent = payload.search_intent || payload.search || payload.searchIntent || null;

  let baseFilters = {};
  if (structuredIntent && structuredIntent.filters && typeof structuredIntent.filters === 'object') {
    baseFilters = structuredIntent.filters;
  } else if (payload && payload.filters && typeof payload.filters === 'object') {
    baseFilters = payload.filters;
  } else if (payload && typeof payload === 'object' && (
    'cantons' in payload ||
    'budget' in payload ||
    'rooms' in payload ||
    'preference' in payload ||
    'environmentFocus' in payload ||
    'facilityFocus' in payload ||
    'proximity' in payload ||
    'nearby' in payload ||
    'places' in payload
  )) {
    baseFilters = payload;
  } else {
    baseFilters = {};
  }

  const filtersObject = (baseFilters && typeof baseFilters === 'object') ? baseFilters : {};
  const targetText = structuredIntent && typeof structuredIntent.target === 'string' ? structuredIntent.target : '';
  const spatialConstraintText = structuredIntent && typeof structuredIntent.spatial_constraint === 'string' ? structuredIntent.spatial_constraint : '';
  const sortByText = structuredIntent && typeof structuredIntent.sort_by === 'string' ? structuredIntent.sort_by : '';
  const referenceLocationRaw = structuredIntent ? structuredIntent.reference_location : null;

  const referenceLocations = [];
  const ingestReference = (value) => {
    if (!value) return;
    if (typeof value === 'string') {
      if (value.trim().length) referenceLocations.push(value.trim());
      return;
    }
    if (typeof value === 'object') {
      if (typeof value.name === 'string' && value.name.trim().length) referenceLocations.push(value.name.trim());
      else if (typeof value.label === 'string' && value.label.trim().length) referenceLocations.push(value.label.trim());
      else if (typeof value.description === 'string' && value.description.trim().length) referenceLocations.push(value.description.trim());
    }
  };

  if (Array.isArray(referenceLocationRaw)) {
    referenceLocationRaw.forEach(ingestReference);
  } else {
    ingestReference(referenceLocationRaw);
  }

  if (Array.isArray(filtersObject.cantons) && filtersObject.cantons.length) {
    const resolvedCantons = filtersObject.cantons
      .map(entry => {
        if (typeof entry === 'number') return entry;
        if (typeof entry === 'string') return entry;
        if (entry && typeof entry.name === 'string') return entry.name;
        if (entry && typeof entry.code === 'string') return entry.code;
        return null;
      })
      .filter(Boolean)
      .map(value => resolveCantonFromText(value) || (typeof value === 'number' ? { num: value, name: cantonNameMap[value] } : null))
      .filter(canton => canton && canton.num && canton.name);
    if (resolvedCantons.length) {
      merged.cantons = dedupeArray(resolvedCantons, canton => canton.num);
    }
  }

  const budgetCandidates = [];
  const budgetKeys = [
    'budget', 'budgetMax', 'budget_max', 'budgetUpper', 'budget_upper',
    'price', 'priceMax', 'price_max', 'priceUpper', 'price_upper', 'max_price', 'maxPrice',
    'rentMax', 'rent_max', 'maxRent', 'max_rent', 'upper', 'upperBound', 'upper_bound', 'cap', 'maximum', 'max'
  ];

  budgetKeys.forEach(key => {
    if (filtersObject[key] != null) {
      const num = toFiniteNumber(filtersObject[key]);
      if (num != null) budgetCandidates.push(num);
    }
  });

  ['budget', 'price', 'rent', 'cost'].forEach(key => {
    const block = filtersObject[key];
    if (!block || typeof block !== 'object') return;
    ['max', 'maximum', 'upper', 'upperBound', 'upper_bound', 'cap', 'value', 'amount'].forEach(prop => {
      if (block[prop] != null) {
        const num = toFiniteNumber(block[prop]);
        if (num != null) budgetCandidates.push(num);
      }
    });
  });

  if (budgetCandidates.length) {
    const chosen = Math.min(...budgetCandidates.filter(val => Number.isFinite(val)));
    if (Number.isFinite(chosen)) {
      merged.budget = chosen;
    }
  }

  const roomCandidates = [];
  const roomKeys = ['rooms', 'roomCount', 'room_count', 'rooms_min', 'min_rooms', 'minimumRooms', 'bedrooms', 'bedrooms_min', 'minBedrooms'];
  roomKeys.forEach(key => {
    if (filtersObject[key] != null) {
      const num = toFiniteNumber(filtersObject[key]);
      if (num != null && num > 0) roomCandidates.push(num);
    }
  });
  ['rooms', 'bedrooms'].forEach(key => {
    const block = filtersObject[key];
    if (!block || typeof block !== 'object') return;
    ['min', 'minimum', 'lower', 'atLeast'].forEach(prop => {
      if (block[prop] != null) {
        const num = toFiniteNumber(block[prop]);
        if (num != null && num > 0) roomCandidates.push(num);
      }
    });
  });
  if (roomCandidates.length) {
    merged.rooms = roomCandidates.sort((a, b) => a - b)[0];
  }

  const preference = normalizePreferenceLabel(
    filtersObject.preference ||
    filtersObject.priority ||
    filtersObject.goal
  );
  if (preference) {
    merged.preference = preference;
  }

  const environment = normalizeEnvironmentLabel(
    filtersObject.environmentFocus ||
    filtersObject.environment ||
    filtersObject.vibe ||
    filtersObject.ambience
  );
  if (environment) {
    merged.environmentFocus = environment;
  }

  const facility = normalizeFacilityLabel(
    filtersObject.facilityFocus ||
    filtersObject.facilities ||
    filtersObject.amenities ||
    filtersObject.transport
  );
  if (facility) {
    merged.facilityFocus = facility;
  }

  const radiusCandidates = [];
  const radiusSource = filtersObject.radius ?? filtersObject.radiusKm ?? filtersObject.radius_km ?? filtersObject.distance ?? filtersObject.distanceKm ?? filtersObject.searchRadius;
  const radiusArray = Array.isArray(radiusSource) ? radiusSource : (radiusSource != null ? [radiusSource] : []);
  radiusArray.forEach(value => {
    const numeric = toFiniteNumber(value);
    if (numeric != null) {
      const normalized = String(value).toLowerCase().includes('m') ? numeric / 1000 : numeric;
      if (normalized > 0.01) radiusCandidates.push(normalized);
    }
  });

  ['radius', 'distance', 'searchRadius'].forEach(key => {
    const block = filtersObject[key];
    if (!block || typeof block !== 'object') return;
    ['value', 'max', 'upper', 'km', 'radiusKm', 'meters', 'metres'].forEach(prop => {
      if (block[prop] != null) {
        const numeric = toFiniteNumber(block[prop]);
        if (numeric != null) {
          const needsConversion = prop.toLowerCase().includes('m');
          radiusCandidates.push(needsConversion ? numeric / 1000 : numeric);
        }
      }
    });
  });

  if (radiusCandidates.length) {
    const positiveRadius = radiusCandidates.filter(val => val > 0.01);
    if (positiveRadius.length) {
      const selectedRadius = Math.min(...positiveRadius);
      if (Number.isFinite(selectedRadius)) {
        merged.searchRadiusKm = selectedRadius;
      }
    }
  }

  if (Array.isArray(filtersObject.priorities) && filtersObject.priorities.length) {
    const normalizedPriorities = filtersObject.priorities
      .map(item => (typeof item === 'string' ? item : (item && item.label ? item.label : null)))
      .filter(Boolean)
      .map(label => label.toString().trim().toLowerCase())
      .map(label => {
        if (['near', 'closest', 'close', 'proche', 'près', 'nearby'].includes(label)) return 'closest';
        if (['cheap', 'cheapest', 'affordable', 'budget', 'low'].includes(label)) return 'cheapest';
        if (['luxury', 'expensive', 'premium'].includes(label)) return 'luxury';
        if (['best', 'top', 'optimal', 'ideal'].includes(label)) return 'best';
        if (['worst', 'avoid', 'low'].includes(label)) return 'worst';
        if (['quiet', 'calm', 'silence'].includes(label)) return 'quiet';
        if (['green', 'nature', 'park'].includes(label)) return 'green';
        if (['schools', 'education', 'school'].includes(label)) return 'schools';
        if (['transport', 'transit', 'mobility'].includes(label)) return 'transport';
        if (['amenities', 'shops', 'shopping', 'grocery'].includes(label)) return 'amenities';
        if (['farthest', 'furthest'].includes(label)) return 'farthest';
        return label;
      })
      .filter(Boolean);
    if (normalizedPriorities.length) {
      merged.priorities = dedupeArray(merged.priorities.concat(normalizedPriorities), key => key);
    }
  }

  const legacyProximitySource = filtersObject.proximity || filtersObject.places || filtersObject.nearby || filtersObject.near;
  const legacyProximityArray = Array.isArray(legacyProximitySource) ? legacyProximitySource : (legacyProximitySource ? [legacyProximitySource] : []);
  if (legacyProximityArray.length) {
    const proximityResult = resolveGeminiProximityTargets(legacyProximityArray);
    if (proximityResult.matches.length) {
      merged.proximityTargets = merged.proximityTargets.concat(proximityResult.matches);
      const radiusFromMatches = proximityResult.matches
        .map(item => item && item.radiusKm)
        .filter(val => typeof val === 'number' && val > 0.01);
      if (radiusFromMatches.length) {
        const minRadius = Math.min(...radiusFromMatches);
        if (Number.isFinite(minRadius)) {
          if (merged.searchRadiusKm == null || minRadius < merged.searchRadiusKm) {
            merged.searchRadiusKm = minRadius;
          }
        }
      }
    }
    if (proximityResult.pending.length) {
      merged.pendingGeocodes = merged.pendingGeocodes.concat(proximityResult.pending);
    }
    if (proximityResult.missing.length) {
      merged.pendingPlaceNames = merged.pendingPlaceNames.concat(proximityResult.missing);
    }
  }

  // Structured intent enrichment
  if (targetText) {
    const inferredPreference = detectPreference(targetText);
    if (!merged.preference && inferredPreference) {
      merged.preference = inferredPreference;
    }
    if (!merged.environmentFocus) {
      const inferredEnv = detectEnvironmentFocus(targetText);
      if (inferredEnv) merged.environmentFocus = inferredEnv;
    }
    if (!merged.facilityFocus) {
      const inferredFacility = detectFacilityFocus(targetText);
      if (inferredFacility) merged.facilityFocus = inferredFacility;
    }
    const targetPriorities = extractPriorityKeywords(targetText);
    if (targetPriorities.length) {
      merged.priorities = dedupeArray(merged.priorities.concat(targetPriorities), key => key);
    }
  }

  if (spatialConstraintText) {
    const spatialPriorities = extractPriorityKeywords(spatialConstraintText);
    if (spatialPriorities.length) {
      merged.priorities = dedupeArray(merged.priorities.concat(spatialPriorities), key => key);
    }
    const radiusFromSpatial = detectRadiusInKm(spatialConstraintText);
    if (radiusFromSpatial && (merged.searchRadiusKm == null || radiusFromSpatial < merged.searchRadiusKm)) {
      merged.searchRadiusKm = radiusFromSpatial;
    }
  }

  if (Array.isArray(referenceLocations) && referenceLocations.length) {
    const syntheticLocationText = referenceLocations.map(name => `near ${name}`).join('. ');
    const proximityResult = extractProximityTargets([syntheticLocationText, spatialConstraintText].filter(Boolean).join('. '));
    if (proximityResult.matches.length) {
      merged.proximityTargets = merged.proximityTargets.concat(proximityResult.matches);
    }
    if (proximityResult.pending.length) {
      merged.pendingGeocodes = merged.pendingGeocodes.concat(proximityResult.pending);
    }
    if (proximityResult.missing.length) {
      merged.pendingPlaceNames = merged.pendingPlaceNames.concat(proximityResult.missing);
    }
  }

  if (sortByText) {
    const normalizedSort = sortByText.toLowerCase();
    const priorityHints = [];
    if (normalizedSort === 'distance_asc') priorityHints.push('closest');
    if (normalizedSort === 'distance_desc') priorityHints.push('farthest');
    if (normalizedSort.includes('price') && normalizedSort.includes('asc')) priorityHints.push('cheapest');
    if (normalizedSort.includes('price') && normalizedSort.includes('desc')) priorityHints.push('luxury');
    if (normalizedSort.includes('score') && normalizedSort.includes('desc')) priorityHints.push('best');
    if (normalizedSort.includes('score') && normalizedSort.includes('asc')) priorityHints.push('worst');
    if (priorityHints.length) {
      merged.priorities = dedupeArray(merged.priorities.concat(priorityHints), key => key);
    }
  }

  merged.proximityTargets = dedupeArray(merged.proximityTargets, item => `${item.lat}|${item.lon}|${item.name || ''}|${item.radiusKm || 'na'}`);
  merged.pendingGeocodes = dedupeArray(merged.pendingGeocodes, item => item && item.promise ? item.promise : item);
  merged.pendingPlaceNames = dedupeArray(merged.pendingPlaceNames, item => (item && typeof item === 'string') ? item.toLowerCase() : null);

  return merged;
}

function buildGeminiPrompt(message, fallback) {
  const fallbackIntent = fallback && fallback.fallbackIntent ? fallback.fallbackIntent : 'fallback';
  const fallbackFilters = fallback && fallback.fallbackFilters ? fallback.fallbackFilters : null;
  const fallbackSummary = fallbackFilters ? {
    cantons: Array.isArray(fallbackFilters.cantons) ? fallbackFilters.cantons.map(c => c && c.name ? c.name : c).filter(Boolean) : [],
    budget: fallbackFilters.budget ?? null,
    rooms: fallbackFilters.rooms ?? null,
    preference: fallbackFilters.preference ?? null,
    environmentFocus: fallbackFilters.environmentFocus ?? null,
    facilityFocus: fallbackFilters.facilityFocus ?? null,
    proximityNames: Array.isArray(fallbackFilters.proximityTargets) ? fallbackFilters.proximityTargets.map(p => p && p.name).filter(Boolean) : []
  } : null;

  const instructions = [
    'You are a House Search Assistant integrated into an interactive map.',
    'Your job is to parse any housing or spatial request and emit structured JSON that downstream code can execute without guesswork.',
    'Responsibilities:',
    '- Interpret vague or incomplete phrasing and resolve the user\'s true target (houses, apartments, listings, schools, landmarks, neighbourhoods, etc.).',
    '- Detect spatial intent (closest, farthest, within distances, near/around/beside, inside/outside, between points).',
    '- Extract attribute filters (price ranges, size, bedrooms, amenities, scores, property type, year built).',
    '- Capture any reference locations (schools, universities, landmarks, cities, addresses, coordinates, "my location").',
    'Output format:',
    '- Return strictly valid JSON with top-level keys: intent, normalized_prompt, notes, search_intent.',
    '- search_intent must include: target, spatial_constraint, filters, sort_by, limit, reference_location.',
    '- Use empty strings, empty objects, or null when a field is missing.',
    '- Place canonical filter fields inside search_intent.filters (price_min, price_max, rooms_min, rooms_max, amenities, property_type, etc.).',
    'Rules:',
    '- For "closest" queries set search_intent.sort_by = "distance_asc" and search_intent.limit = 1.',
    '- For "farthest" queries set search_intent.sort_by = "distance_desc" and search_intent.limit = 1.',
    '- For list/browse requests leave search_intent.limit empty.',
    '- Normalize any mentioned place into search_intent.reference_location.',
    '- If the request is ambiguous, describe the needed clarification in notes instead of inventing data.',
    '- Never include commentary outside JSON.'
  ].join('\n');

  const contextLines = [
    instructions,
    `Heuristic intent guess: ${fallbackIntent}`,
    fallbackSummary ? `Heuristic filters: ${JSON.stringify(fallbackSummary)}` : 'Heuristic filters: {}',
    'User message:',
    '<<USER_MESSAGE>>',
    message,
    '<<END_USER_MESSAGE>>'
  ];

  return {
    systemInstruction: {
      role: 'system',
      parts: [{ text: 'You output compact JSON payloads for downstream parsers.' }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: contextLines.join('\n') }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 512,
      responseMimeType: 'application/json'
    }
  };
}

function extractGeminiJsonText(data) {
  if (!data || !Array.isArray(data.candidates) || !data.candidates.length) return null;
  const candidate = data.candidates.find(item => item && item.content && Array.isArray(item.content.parts));
  if (!candidate) return null;
  const textPart = candidate.content.parts.find(part => typeof part.text === 'string' && part.text.trim().length);
  return textPart ? textPart.text.trim() : null;
}

async function normalizeChatQueryWithGemini(message, fallback = {}) {
  if (typeof fetch !== 'function') return null;
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    if (!geminiMissingKeyWarned) {
      console.warn('Gemini API key not found. Skipping Gemini normalization.');
      geminiMissingKeyWarned = true;
    }
    return null;
  }

  const body = buildGeminiPrompt(message, fallback);
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS) : null;

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller ? controller.signal : undefined
    });
    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('Gemini response not OK:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    const jsonText = extractGeminiJsonText(data);
    if (!jsonText) {
      console.warn('Gemini returned empty payload.');
      return null;
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      console.warn('Gemini payload parsing failed:', err, jsonText);
      return null;
    }

    const resolvedIntent = mapGeminiIntent(parsed.intent, fallback.fallbackIntent);
    const mergedFilters = mergeGeminiFilters(parsed, fallback.fallbackFilters);
    const normalizedPrompt = typeof parsed.normalized_prompt === 'string' ? parsed.normalized_prompt.trim() : null;
    const notesRaw = Array.isArray(parsed.notes) ? parsed.notes : (parsed.notes ? [parsed.notes] : []);
    const notes = notesRaw.map(item => item && item.toString().trim()).filter(Boolean);
    return {
      intent: resolvedIntent,
      filters: mergedFilters,
      normalizedPrompt,
      notes,
      raw: parsed
    };
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn('Gemini request timed out.');
    } else {
      console.warn('Gemini request failed:', error);
    }
    return null;
  }
}

// Layer groups for facility markers
let schoolMarkers = L.layerGroup();
let apartmentMarkers = L.layerGroup();
let restaurantMarkers = L.layerGroup();
let supermarketMarkers = L.layerGroup();

// Raster data storage
let rasterData = {
  railNight: null,
  railDay: null,
  airNoise: null,
  vegetation: null,
  roadDay: null,
  roadNight: null
};

// Weights for each index (adjustable via sliders)
let weights = {
  schools: 0.15,
  supermarkets: 0.15,
  restaurants: 0.10,
  accessRoads: 0.10,
  railNight: 0.10,
  railDay: 0.05,
  airNoise: 0.10,
  vegetation: 0.10,
  roadDay: 0.05,
  roadNight: 0.10,
  apartmentCost: 1 // Informational only, not part of composite by default
};

// D3 projection
const projection = d3.geoTransform({
  point: function (x, y) {
    const point = map.latLngToLayerPoint([y, x]);
    this.stream.point(point.x, point.y);
  }
});
const path = d3.geoPath().projection(projection);
const hex = d3.hexbin().radius(30);

// Calculate minimum distance to facilities of a specific type
function getMinDistanceToFacilities(lat, lon, facilities) {
  if (!facilities || facilities.length === 0) return null;

  const hexCenter = L.latLng(lat, lon);
  let minDistance = Infinity;
  
  // Early exit if we find a very close facility
  const veryCloseThreshold = 100; // 100 meters

  for (let i = 0; i < facilities.length; i++) {
    const facility = facilities[i];
    if (!facility || facility.lat == null || facility.lon == null) continue;
    
    // Quick distance check using simpler math for initial filtering
    const latDiff = Math.abs(facility.lat - lat);
    const lonDiff = Math.abs(facility.lon - lon);
    
    // Skip if obviously too far (rough approximation: 1 degree ≈ 111km)
    if (latDiff > 0.5 || lonDiff > 0.5) continue;
    
    const facilityLatLng = L.latLng(facility.lat, facility.lon);
    const dist = map.distance(hexCenter, facilityLatLng);
    
    if (dist < minDistance) {
      minDistance = dist;
      // Early exit if very close
      if (minDistance < veryCloseThreshold) break;
    }
  }

  return minDistance === Infinity ? null : minDistance;
}

// Convert distance to a normalized score (0-1, where 1 is best)
function distanceToScore(distance) {
  if (distance === null) return 0;
  const maxDistance = 5000; // 5km reference
  return Math.exp(-distance / maxDistance);
}

function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'N/A';
  return currencyFormatter.format(Math.round(value));
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${Math.round(value * 100)}%`;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return value
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildFilterSummaryMessage(filters) {
  if (!filters || typeof filters !== 'object') return null;
  const parts = [];

  if (Array.isArray(filters.cantons) && filters.cantons.length) {
    const cantonNames = Array.from(new Set(filters.cantons.map(canton => {
      if (!canton) return null;
      if (typeof canton === 'string') return canton.trim();
      if (typeof canton.name === 'string') return canton.name.trim();
      if (typeof canton.code === 'string') return canton.code.trim();
      if (typeof canton.num === 'number' && cantonNameMap[canton.num]) return cantonNameMap[canton.num];
      return null;
    }).filter(Boolean)));
    if (cantonNames.length) {
      parts.push(`focus on ${cantonNames.join(', ')}`);
    }
  }

  if (filters.budget != null && Number.isFinite(filters.budget)) {
    parts.push(`budget cap ${formatCurrency(filters.budget)}`);
  }

  if (filters.rooms != null && Number.isFinite(filters.rooms)) {
    parts.push(`at least ${filters.rooms} room${filters.rooms === 1 ? '' : 's'}`);
  }

  if (filters.preference) {
    parts.push(`preference ${filters.preference}`);
  }

  if (filters.environmentFocus) {
    parts.push(`environment focus ${filters.environmentFocus}`);
  }

  if (filters.facilityFocus) {
    parts.push(`facility focus ${filters.facilityFocus}`);
  }

  if (Array.isArray(filters.priorities) && filters.priorities.length) {
  parts.push(`priorities ${filters.priorities.join(' -> ')}`);
  }

  const placeNames = new Set();
  if (Array.isArray(filters.proximityTargets)) {
    filters.proximityTargets.forEach(target => {
      if (target && typeof target.name === 'string') {
        placeNames.add(target.name);
      }
    });
  }
  if (Array.isArray(filters.pendingPlaceNames)) {
    filters.pendingPlaceNames.forEach(name => {
      if (typeof name === 'string' && name.trim()) {
        placeNames.add(name.trim());
      }
    });
  }
  if (placeNames.size) {
    parts.push(`places ${Array.from(placeNames).join(', ')}`);
  }

  if (filters.searchRadiusKm != null && Number.isFinite(filters.searchRadiusKm) && filters.searchRadiusKm > 0) {
    parts.push(`radius ${filters.searchRadiusKm.toFixed(1)} km`);
  }

  if (!parts.length) return null;
  return `Here is what I picked up: ${parts.join('; ')}.`;
}

function median(values) {
  if (!values || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function getCantonLabel(num) {
  return cantonNameMap[num] || 'Unknown canton';
}

function resolveCantonFromText(raw) {
  if (!raw) return null;
  const normalized = normalizeCantonToken(raw);
  if (!normalized) return null;
  if (cantonAliasLookup.has(normalized)) {
    return cantonAliasLookup.get(normalized);
  }
  const noSpaces = normalized.replace(/\s+/g, '');
  if (cantonAliasLookup.has(noSpaces)) {
    return cantonAliasLookup.get(noSpaces);
  }
  return null;
}

function extractCantonsFromText(text) {
  if (!text) return [];
  const matches = new Map();
  const tokens = text.split(/[,;\/]|\band\b|\bet\b|\bund\b/i);
  tokens.forEach(token => {
    const canton = resolveCantonFromText(token);
    if (canton) {
      matches.set(canton.num, canton);
    }
  });
  if (matches.size) {
    return Array.from(matches.values());
  }

  const words = text.split(/\s+/);
  for (let length = 3; length >= 1; length -= 1) {
    for (let i = 0; i <= words.length - length; i += 1) {
      const slice = words.slice(i, i + length).join(' ');
      const canton = resolveCantonFromText(slice);
      if (canton) {
        matches.set(canton.num, canton);
      }
    }
    if (matches.size) {
      break;
    }
  }

  return Array.from(matches.values());
}

// Sample raster value at a lat/lon point
function sampleRaster(georaster, lat, lon) {
  if (!georaster) return null;
  
  // Quick bounds check before expensive calculations
  if (lon < georaster.xmin || lon > georaster.xmax || 
      lat < georaster.ymin || lat > georaster.ymax) {
    return null;
  }
  
  try {
    // Get pixel coordinates
    const x = (lon - georaster.xmin) / georaster.pixelWidth;
    const y = (georaster.ymax - lat) / georaster.pixelHeight;
    
    const pixelX = Math.floor(x);
    const pixelY = Math.floor(y);
    
    // Check bounds
    if (pixelX < 0 || pixelX >= georaster.width || pixelY < 0 || pixelY >= georaster.height) {
      return null;
    }
    
    // Get value from first band
    const value = georaster.values[0][pixelY][pixelX];
    return value;
  } catch (e) {
    return null;
  }
}

// Convert noise values to score (lower noise = better)
// For air quality: higher values = better quality
function noiseToScore(noiseValue, isAirQuality = false) {
  if (noiseValue === null || noiseValue === undefined || noiseValue < 0) return 0.5;
  
  if (isAirQuality) {
    // Air quality: higher is better (assuming 0-100 scale or similar)
    // Adjust ranges based on your actual data
    const minQuality = 0;
    const maxQuality = 100;
    const normalized = (noiseValue - minQuality) / (maxQuality - minQuality);
    return Math.max(0, Math.min(1, normalized));
  }
  
  // Noise: lower is better
  const minNoise = 30;
  const maxNoise = 80;
  const normalized = (noiseValue - minNoise) / (maxNoise - minNoise);
  const clamped = Math.max(0, Math.min(1, normalized));
  
  return 1 - clamped; // Invert so lower noise = higher score
}

// Convert vegetation to score (more vegetation = better)
function vegetationToScore(vegValue) {
  if (vegValue === null || vegValue === undefined || vegValue < 0) return 0.5;
  
  // Assuming NDVI or similar, range 0-1 or 0-255
  if (vegValue > 1) vegValue = vegValue / 255; // Normalize if 0-255
  
  return Math.max(0, Math.min(1, vegValue));
}

// Create hexagon polygon geometry from SVG hex center and radius
function createHexagonPolygon(hexCenterX, hexCenterY, hexRadiusPixels) {
  try {
    // D3 hexbin creates hexagons with these vertices
    // We need to match the EXACT path that D3 uses
    const vertices = [];
    
    // D3 hexagon vertices - check d3-hexbin source
    // Pointy-top orientation starting from top
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i; // 60 degrees apart
      const vertexPt = L.point(
        hexCenterX + hexRadiusPixels * Math.cos(angle),
        hexCenterY + hexRadiusPixels * Math.sin(angle)
      );
      const vertexLatLng = map.layerPointToLatLng(vertexPt);
      vertices.push([vertexLatLng.lng, vertexLatLng.lat]); // [lon, lat] for GeoJSON
    }
    
    // Close the polygon
    vertices.push(vertices[0]);
    
    // Create polygon
    const polygon = turf.polygon([vertices]);
    
    return polygon;
  } catch (e) {
    console.error("Error creating hexagon polygon:", e);
    return null;
  }
}

// Calculate if point is inside hexagon using cached polygon geometry
function isPointInHexagonPolygon(pointLat, pointLon, hexagonPolygon) {
  try {
    if (!hexagonPolygon) return false;
    
    const point = turf.point([pointLon, pointLat]);
    return turf.booleanPointInPolygon(point, hexagonPolygon);
  } catch (e) {
    console.error("Error in isPointInHexagonPolygon:", e);
    return false;
  }
}

// Calculate average apartment cost per room in hexagon (visual containment)
function getApartmentCostInHex(lat, lon, hexRadiusPixels, hexId, hexagonPolygon) {
  if (!apartmentData || apartmentData.length === 0 || !map) return null;
  
  try {
    // Create hexagon polygon if not provided
    if (!hexagonPolygon) {
      const hexCenter = map.latLngToLayerPoint([lat, lon]);
      hexagonPolygon = createHexagonPolygon(hexCenter.x, hexCenter.y, hexRadiusPixels);
    }
    
    if (!hexagonPolygon) return null;
    
    // Quick bounding box filter using approximate pixel-to-degree conversion
    const hexCenter = map.latLngToLayerPoint([lat, lon]);
    const hexBounds = L.bounds(
      L.point(hexCenter.x - hexRadiusPixels * 1.5, hexCenter.y - hexRadiusPixels * 1.5),
      L.point(hexCenter.x + hexRadiusPixels * 1.5, hexCenter.y + hexRadiusPixels * 1.5)
    );
    
    const boundsLatLng = L.latLngBounds(
      map.layerPointToLatLng(hexBounds.getBottomLeft()),
      map.layerPointToLatLng(hexBounds.getTopRight())
    );
    
    let totalPricePerRoom = 0;
    let count = 0;
    const apartments = [];
    
    for (let i = 0; i < apartmentData.length; i++) {
      const apt = apartmentData[i];
      
      // Validate apartment data
      if (!apt || !apt.lat || !apt.lon || !apt.price || !apt.rooms) continue;
      
      // Quick bounding box check first
      if (!boundsLatLng.contains([apt.lat, apt.lon])) {
        continue;
      }
      
      // Calculate pixel distance for more reliable containment
      const aptPixelPt = map.latLngToLayerPoint([apt.lat, apt.lon]);
      const hexPixelPt = map.latLngToLayerPoint([lat, lon]);
      const pixelDistance = Math.sqrt(
        Math.pow(aptPixelPt.x - hexPixelPt.x, 2) + 
        Math.pow(aptPixelPt.y - hexPixelPt.y, 2)
      );
      
      // Use distance-based containment with generous threshold
      // Hexagons have radius R, so use slightly more to catch visually inside apartments
      const isInHexagon = pixelDistance <= hexRadiusPixels * 1.15;
      
      if (isInHexagon) {
        const pricePerRoom = apt.price / apt.rooms;
        totalPricePerRoom += pricePerRoom;
        count++;
        apartments.push({
          pricePerRoom: pricePerRoom,
          price: apt.price,
          rooms: apt.rooms,
          address: apt.address || 'N/A',
          url: apt.url || '#',
          lat: apt.lat,
          lon: apt.lon
        });
      }
    }
    
    // Debug logging
    if (count > 0) {
      const centerPoint = turf.point([lon, lat]);
      
      // Check for apartments at same location (same building, multiple units)
      const uniqueLocations = new Set(apartments.map(apt => `${apt.lat},${apt.lon}`));
      const buildingCount = uniqueLocations.size;
      
      console.log(`✅ Hexagon at (${lat.toFixed(4)}, ${lon.toFixed(4)}): ${count} apartments in ${buildingCount} building(s)`);
      console.log(`   Radius: ${hexRadiusPixels.toFixed(1)}px (threshold: ${(hexRadiusPixels * 1.15).toFixed(1)}px)`);
      
      if (count <= 8) {
        apartments.forEach((apt, idx) => {
          const aptPoint = turf.point([apt.lon, apt.lat]);
          const distance = turf.distance(centerPoint, aptPoint, {units: 'meters'});
          const aptPx = map.latLngToLayerPoint([apt.lat, apt.lon]);
          const hexPx = map.latLngToLayerPoint([lat, lon]);
          const pxDist = Math.sqrt(Math.pow(aptPx.x - hexPx.x, 2) + Math.pow(aptPx.y - hexPx.y, 2));
          console.log(`   ${idx+1}. ${apt.rooms}rm ${apt.price}CHF @ ${distance.toFixed(0)}m (${pxDist.toFixed(1)}px)`);
        });
      } else {
        console.log(`   (Too many to list individually - showing summary)`);
        console.log(`   Avg price/room: ${(totalPricePerRoom / count).toFixed(0)} CHF`);
      }
    } else {
      // Log when no apartments found to help debug
      const nearbyCount = apartmentData.filter(apt => {
        if (!apt || !apt.lat || !apt.lon) return false;
        if (!boundsLatLng.contains([apt.lat, apt.lon])) return false;
        const aptPx = map.latLngToLayerPoint([apt.lat, apt.lon]);
        const hexPx = map.latLngToLayerPoint([lat, lon]);
        const dist = Math.sqrt(Math.pow(aptPx.x - hexPx.x, 2) + Math.pow(aptPx.y - hexPx.y, 2));
        return dist <= hexRadiusPixels * 1.5;
      }).length;
      
      if (nearbyCount > 0) {
        console.log(`⚠️ Hexagon at (${lat.toFixed(4)}, ${lon.toFixed(4)}): 0 apartments inside, but ${nearbyCount} nearby (within 1.5x radius)`);
      }
    }
    
    if (count === 0) return null;
    
    return {
      avgPricePerRoom: totalPricePerRoom / count,
      count: count,
      apartments: apartments
    };
  } catch (e) {
    console.error("Error in getApartmentCostInHex:", e);
    return null;
  }
}

// Convert apartment cost to score (lower cost = better, but this is informational)
function apartmentCostToScore(costData) {
  if (!costData) return 0.5;
  
  // Assuming typical range 500-2000 CHF per room
  const minCost = 500;
  const maxCost = 2000;
  const normalized = (costData.avgPricePerRoom - minCost) / (maxCost - minCost);
  const clamped = Math.max(0, Math.min(1, normalized));
  
  return 1 - clamped; // Lower cost = higher score
}

// Calculate composite score for a hexagon
function calculateCompositeScore(lat, lon, hexRadiusPixels = 30, hexId = null, hexagonPolygon = null) {
  // Create cache key based on position AND current weights
  const weightsKey = Object.values(weights).map(w => w.toFixed(2)).join(',');
  const cacheKey = `${lat.toFixed(5)},${lon.toFixed(5)},${hexRadiusPixels.toFixed(1)},${weightsKey}`;
  
  // Check cache first
  if (scoreCache.has(cacheKey)) {
    const cached = scoreCache.get(cacheKey);
    return cached;
  }
  
  // Log when we're doing a fresh calculation (not from cache)
  if (!scoreCache.has(cacheKey) && Math.random() < 0.01) { // Log 1% of calculations to avoid spam
    console.log(`🔄 Calculating score for (${lat.toFixed(4)}, ${lon.toFixed(4)}) - cache miss`);
  }
  
  // Create hexId if not provided
  if (!hexId) {
    hexId = cacheKey;
  }
  
  // Create hexagon polygon if not provided (for accurate apartment containment)
  if (!hexagonPolygon) {
    const hexCenter = map.latLngToLayerPoint([lat, lon]);
    hexagonPolygon = createHexagonPolygon(hexCenter.x, hexCenter.y, hexRadiusPixels);
  }
  
  // Distance-based scores
  const schoolDist = getMinDistanceToFacilities(lat, lon, schoolLocations);
  const supermarketDist = getMinDistanceToFacilities(lat, lon, supermarketLocations);
  const restaurantDist = getMinDistanceToFacilities(lat, lon, restoLocations);
  const accessRoadDist = getMinDistanceToFacilities(lat, lon, accessRoads);

  const schoolScore = distanceToScore(schoolDist);
  const supermarketScore = distanceToScore(supermarketDist);
  const restaurantScore = distanceToScore(restaurantDist);
  const accessRoadScore = distanceToScore(accessRoadDist);

  // Raster-based scores
  const railNightValue = sampleRaster(rasterData.railNight, lat, lon);
  const railDayValue = sampleRaster(rasterData.railDay, lat, lon);
  const airNoiseValue = sampleRaster(rasterData.airNoise, lat, lon);
  const vegetationValue = sampleRaster(rasterData.vegetation, lat, lon);
  const roadDayValue = sampleRaster(rasterData.roadDay, lat, lon);
  const roadNightValue = sampleRaster(rasterData.roadNight, lat, lon);

  const railNightScore = noiseToScore(railNightValue);
  const railDayScore = noiseToScore(railDayValue);
  const airNoiseScore = noiseToScore(airNoiseValue, true); // Air quality
  const vegetationScore = vegetationToScore(vegetationValue);
  const roadDayScore = noiseToScore(roadDayValue);
  const roadNightScore = noiseToScore(roadNightValue);

  // Apartment cost - pass hexagon polygon for accurate containment
  const apartmentCostData = getApartmentCostInHex(lat, lon, hexRadiusPixels, hexId, hexagonPolygon);
  const apartmentCostScore = apartmentCostToScore(apartmentCostData);

  // Weighted average (including apartment cost in composite)
  const totalWeight = 
    weights.schools + weights.supermarkets + weights.restaurants + weights.accessRoads +
    weights.railNight + weights.railDay + weights.airNoise + weights.vegetation +
    weights.roadDay + weights.roadNight + weights.apartmentCost;

  const compositeScore = totalWeight > 0 ? (
    schoolScore * weights.schools +
    supermarketScore * weights.supermarkets +
    restaurantScore * weights.restaurants +
    accessRoadScore * weights.accessRoads +
    railNightScore * weights.railNight +
    railDayScore * weights.railDay +
    airNoiseScore * weights.airNoise +
    vegetationScore * weights.vegetation +
    roadDayScore * weights.roadDay +
    roadNightScore * weights.roadNight +
    apartmentCostScore * weights.apartmentCost
  ) / totalWeight : 0;

  const result = {
    composite: compositeScore,
    schools: schoolScore,
    supermarkets: supermarketScore,
    restaurants: restaurantScore,
    accessRoads: accessRoadScore,
    railNight: railNightScore,
    railDay: railDayScore,
    airNoise: airNoiseScore,
    vegetation: vegetationScore,
    roadDay: roadDayScore,
    roadNight: roadNightScore,
    apartmentCost: apartmentCostScore,
    distances: {
      schools: schoolDist,
      supermarkets: supermarketDist,
      restaurants: restaurantDist,
      accessRoads: accessRoadDist
    },
    rasterValues: {
      railNight: railNightValue,
      railDay: railDayValue,
      airNoise: airNoiseValue,
      vegetation: vegetationValue,
      roadDay: roadDayValue,
      roadNight: roadNightValue
    },
    apartmentData: apartmentCostData
  };
  
  // Cache the result (cache key now includes weights, so it will recalculate when weights change)
  scoreCache.set(cacheKey, result);
  
  // Limit cache size to prevent memory issues
  if (scoreCache.size > 10000) {
    const firstKey = scoreCache.keys().next().value;
    scoreCache.delete(firstKey);
  }
  
  return result;
}

// Get color based on a normalized percentile value (0-1)
function getColorByScore(normalized) {
  if (normalized === null || normalized === undefined || Number.isNaN(normalized)) {
    normalized = 0.5;
  }

  normalized = Math.max(0, Math.min(1, normalized));
  
  // Color stops: Red -> Orange -> Yellow -> Green
  const colors = [
    { pos: 0.0, r: 255, g: 0, b: 0 },      // Red
    { pos: 0.2, r: 255, g: 64, b: 0 },     // Red-Orange
    { pos: 0.4, r: 255, g: 128, b: 0 },    // Orange
    { pos: 0.5, r: 255, g: 191, b: 0 },    // Yellow-Orange
    { pos: 0.6, r: 255, g: 255, b: 0 },    // Yellow
    { pos: 0.7, r: 191, g: 255, b: 0 },    // Yellow-Green
    { pos: 0.8, r: 127, g: 255, b: 0 },    // Light Green
    { pos: 1.0, r: 0, g: 255, b: 0 }       // Green
  ];
  
  // Find the two color stops to interpolate between
  let lower = colors[0];
  let upper = colors[colors.length - 1];
  
  for (let i = 0; i < colors.length - 1; i++) {
    if (normalized >= colors[i].pos && normalized <= colors[i + 1].pos) {
      lower = colors[i];
      upper = colors[i + 1];
      break;
    }
  }
  
  // Interpolate between the two colors
  const span = upper.pos - lower.pos;
  const t = span === 0 ? 0 : (normalized - lower.pos) / span;
  
  const r = Math.round(lower.r + (upper.r - lower.r) * t);
  const g = Math.round(lower.g + (upper.g - lower.g) * t);
  const b = Math.round(lower.b + (upper.b - lower.b) * t);
  
  return `rgb(${r}, ${g}, ${b})`;
}

function getHexIdentifierFromBin(bin) {
  if (!bin) return null;
  const cantonPart = bin.cantonNum != null ? bin.cantonNum : 'na';
  const xValue = typeof bin.x === 'number' ? bin.x.toFixed(1) : (typeof bin.svgX === 'number' ? bin.svgX.toFixed(1) : '0');
  const yValue = typeof bin.y === 'number' ? bin.y.toFixed(1) : (typeof bin.svgY === 'number' ? bin.svgY.toFixed(1) : '0');
  return `${cantonPart}-${xValue}-${yValue}`;
}

function getCompareSlotIndex(hexId) {
  if (!hexId) return -1;
  return compareSelections.findIndex(selection => selection && selection.id === hexId);
}

function getCompareStrokeColor(slotIndex) {
  return compareColors[slotIndex] || '#343a40';
}

function getSelectionLetter(index) {
  return String.fromCharCode(65 + index);
}

function formatScorePercent(value) {
  if (value == null || Number.isNaN(value)) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
}

function getSelectionLabel(selection, index) {
  const cantonName = selection && selection.cantonNum ? getCantonLabel(selection.cantonNum) : 'Unknown canton';
  return `${getSelectionLetter(index)} · ${cantonName}`;
}

function refreshSelectionScores() {
  if (!compareSelections.length) return;
  compareSelections.forEach(selection => {
    if (!selection || selection.lat == null || selection.lon == null) return;
    const radius = selection.hexRadiusPixels != null ? selection.hexRadiusPixels : hex.radius();
    const layerPoint = map.latLngToLayerPoint([selection.lat, selection.lon]);
    const polygon = createHexagonPolygon(layerPoint.x, layerPoint.y, radius);
    selection.scores = calculateCompositeScore(selection.lat, selection.lon, radius, selection.id, polygon);
  });
}

function applyCompareSelectionStyles() {
  if (!g) return;
  const selection = g.selectAll('path.hex');
  if (!selection.size()) return;

  selection.each(function(d) {
    const hexId = getHexIdentifierFromBin(d);
    const slotIndex = getCompareSlotIndex(hexId);
    const element = d3.select(this);
    if (slotIndex >= 0) {
      element
        .classed('hex-compare-selected', true)
        .attr('data-compare-slot', slotIndex + 1)
        .attr('stroke', getCompareStrokeColor(slotIndex))
        .attr('stroke-width', element.classed('hex-hovering') ? 4 : 3);
    } else {
      element
        .classed('hex-compare-selected', false)
        .attr('data-compare-slot', null);
      if (!element.classed('hex-hovering')) {
        element
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 0.5);
      }
    }
  });
}

function buildComparisonSummaryText() {
  if (!compareSelections.length) {
    return 'No hexagons selected yet.';
  }

  refreshSelectionScores();

  if (compareSelections.length === 1) {
    const first = compareSelections[0];
    return `${getSelectionLabel(first, 0)} scores ${formatScorePercent(first.scores ? first.scores.composite : null)}. Pick another hexagon to unlock the dashboard.`;
  }

  const [first, second] = compareSelections;
  const compositeA = first.scores ? first.scores.composite : null;
  const compositeB = second.scores ? second.scores.composite : null;
  const diff = (compositeB ?? 0) - (compositeA ?? 0);
  const leaderIndex = diff >= 0 ? 1 : 0;
  const leader = compareSelections[leaderIndex];
  const trailing = compareSelections[leaderIndex === 0 ? 1 : 0];
  const diffText = `${diff >= 0 ? '+' : ''}${(Math.abs(diff) * 100).toFixed(1)} pts`;
  let summary = `${getSelectionLabel(leader, leaderIndex)} leads composite by ${diffText} (${formatScorePercent(leader.scores ? leader.scores.composite : null)} vs ${formatScorePercent(trailing.scores ? trailing.scores.composite : null)}).`;

  const metricDefs = [
    { key: 'schools', label: 'Schools' },
    { key: 'supermarkets', label: 'Supermarkets' },
    { key: 'restaurants', label: 'Restaurants' },
    { key: 'accessRoads', label: 'Access Roads' },
    { key: 'vegetation', label: 'Vegetation' },
    { key: 'airNoise', label: 'Air Quality' },
    { key: 'railNight', label: 'Rail Noise (Night)' },
    { key: 'roadNight', label: 'Road Noise (Night)' },
    { key: 'apartmentCost', label: 'Affordability' }
  ];

  let standout = null;
  metricDefs.forEach(def => {
    const a = first.scores ? first.scores[def.key] : null;
    const b = second.scores ? second.scores[def.key] : null;
    if (a == null || b == null) return;
    const delta = (b - a) * 100;
    const absDelta = Math.abs(delta);
    if (standout === null || absDelta > standout.absDelta) {
      standout = {
        label: def.label,
        delta,
        absDelta,
        winnerIndex: delta > 0 ? 1 : delta < 0 ? 0 : -1
      };
    }
  });

  if (standout && standout.absDelta >= 0.5 && standout.winnerIndex !== -1) {
    const winner = compareSelections[standout.winnerIndex];
    summary += ` Biggest gap: ${getSelectionLabel(winner, standout.winnerIndex)} outperforms in ${standout.label} by ${standout.delta >= 0 ? '+' : ''}${standout.delta.toFixed(1)} pts.`;
  }

  return summary;
}

function renderComparisonChart() {
  if (!compareUi.chart) return;
  compareUi.chart.innerHTML = '';

  if (compareSelections.length < 2) {
    compareUi.chart.innerHTML = '<div class="compare-empty">Pick two hexagons to unlock the analytics dashboard.</div>';
    return;
  }

  refreshSelectionScores();

  const [first, second] = compareSelections;
  const metrics = [
    { key: 'composite', label: 'Composite' },
    { key: 'schools', label: 'Schools' },
    { key: 'supermarkets', label: 'Supermarkets' },
    { key: 'restaurants', label: 'Restaurants' },
    { key: 'accessRoads', label: 'Access Roads' },
    { key: 'vegetation', label: 'Vegetation' },
    { key: 'airNoise', label: 'Air Quality' },
    { key: 'railNight', label: 'Rail Noise (Night)' },
    { key: 'roadNight', label: 'Road Noise (Night)' },
    { key: 'apartmentCost', label: 'Affordability' }
  ];

  const chartData = metrics.map(metric => ({
    metric: metric.label,
    key: metric.key,
    firstValue: first.scores ? first.scores[metric.key] : null,
    secondValue: second.scores ? second.scores[metric.key] : null
  }));

  const containerWidth = compareUi.chart.clientWidth || 320;
  const width = Math.max(containerWidth, 320);
  const margin = { top: 56, right: 24, bottom: 32, left: 150 };
  const rowHeight = 32;
  const height = margin.top + margin.bottom + chartData.length * rowHeight;

  const svg = d3.select(compareUi.chart)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const x = d3.scaleLinear()
    .domain([0, 1])
    .range([margin.left, width - margin.right]);

  const y = d3.scaleBand()
    .domain(chartData.map(d => d.metric))
    .range([margin.top, height - margin.bottom])
    .padding(0.25);

  const series = [
    { key: 'firstValue', slotIndex: 0 },
    { key: 'secondValue', slotIndex: 1 }
  ];

  const y1 = d3.scaleBand()
    .domain(series.map(item => item.key))
    .range([0, y.bandwidth()])
    .padding(0.15);

  const axisBottom = d3.axisBottom(x)
    .tickFormat(d => `${Math.round(d * 100)}%`)
    .ticks(5)
    .tickSizeOuter(0);

  svg.append('g')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .attr('class', 'compare-axis compare-axis-x')
    .call(axisBottom)
    .selectAll('text')
    .style('font-size', '11px');

  svg.append('g')
    .attr('class', 'compare-axis compare-axis-y')
    .attr('transform', `translate(${margin.left - 12}, 0)`)
    .call(d3.axisLeft(y).tickSize(0))
    .selectAll('text')
    .style('font-size', '12px');

  const legend = svg.append('g')
    .attr('class', 'compare-legend')
    .attr('transform', `translate(${margin.left}, ${margin.top - 32})`);

  compareSelections.forEach((selection, index) => {
    const legendItem = legend.append('g')
      .attr('transform', `translate(${index * 160}, 0)`);

    legendItem.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('rx', 2)
      .attr('fill', getCompareStrokeColor(index));

    legendItem.append('text')
      .attr('x', 18)
      .attr('y', 10)
      .attr('fill', '#212529')
      .attr('font-size', 12)
      .text(getSelectionLabel(selection, index));
  });

  const groups = svg.append('g')
    .selectAll('g')
    .data(chartData)
    .enter()
    .append('g')
    .attr('transform', d => `translate(0, ${y(d.metric) || margin.top})`);

  groups.selectAll('rect')
    .data(d => series.map(item => ({
      seriesKey: item.key,
      slotIndex: item.slotIndex,
      value: d[item.key],
      metric: d.metric
    })))
    .enter()
    .append('rect')
    .attr('x', () => x(0))
    .attr('y', datum => y1(datum.seriesKey) || 0)
    .attr('height', Math.max(0, y1.bandwidth()))
    .attr('width', datum => {
      if (datum.value == null || Number.isNaN(datum.value)) return 0;
      return Math.max(0, x(datum.value) - x(0));
    })
    .attr('rx', 3)
    .attr('fill', datum => getCompareStrokeColor(datum.slotIndex));

  groups.selectAll('text')
    .data(d => series.map(item => ({
      seriesKey: item.key,
      slotIndex: item.slotIndex,
      value: d[item.key],
      metric: d.metric
    })))
    .enter()
    .append('text')
    .attr('x', datum => {
      const barEnd = datum.value == null ? x(0) : x(datum.value);
      return barEnd + 6;
    })
    .attr('y', datum => {
      const base = y1(datum.seriesKey) || 0;
      return base + (y1.bandwidth() / 2);
    })
    .attr('fill', '#212529')
    .attr('font-size', 11)
    .attr('dominant-baseline', 'middle')
    .text(datum => datum.value == null ? 'N/A' : formatScorePercent(datum.value));
}

function updateCompareDisplay() {
  if (!compareMode || !compareUi.panel) return;

  compareUi.panel.hidden = false;

  const selectionCount = compareSelections.length;
  if (compareUi.status) {
    if (selectionCount === 0) {
      compareUi.status.textContent = 'Select two hexagons on the map to compare.';
    } else if (selectionCount === 1) {
      compareUi.status.textContent = 'One hexagon locked in. Pick another to unlock the dashboard.';
    } else {
      compareUi.status.textContent = 'Comparing A and B. Click Reset to start over.';
    }
  }

  if (compareUi.selection) {
    if (!selectionCount) {
      compareUi.selection.innerHTML = '<div class="compare-empty">No hexagons selected yet. Click two hexagons on the map.</div>';
    } else {
      const items = compareSelections.map((selection, index) => {
        const scoreText = formatScorePercent(selection.scores ? selection.scores.composite : null);
        const coordsText = (selection.lat != null && selection.lon != null)
          ? `${selection.lat.toFixed(3)}, ${selection.lon.toFixed(3)}`
          : 'Coordinates unavailable';
        return `
          <div class="compare-selection-item" data-compare-id="${selection.id}">
            <div class="compare-selection-header">
              <div class="compare-selection-name">${escapeHtml(getSelectionLabel(selection, index))}</div>
              <button type="button" class="compare-remove" data-compare-remove="${selection.id}">Remove</button>
            </div>
            <div class="compare-selection-meta">
              <span>Score ${escapeHtml(scoreText)}</span>
              <span>${escapeHtml(coordsText)}</span>
            </div>
          </div>
        `;
      });
      compareUi.selection.innerHTML = items.join('');
    }
  }

  if (compareUi.summary) {
    compareUi.summary.textContent = buildComparisonSummaryText();
  }

  renderComparisonChart();
  applyCompareSelectionStyles();
}

function clearCompareSelections(options = {}) {
  compareSelections.length = 0;
  applyCompareSelectionStyles();
  if (!options.silent) {
    if (compareUi.status) {
      compareUi.status.textContent = 'Select two hexagons on the map to compare.';
    }
    if (compareUi.summary) {
      compareUi.summary.textContent = '';
    }
    if (compareUi.selection) {
      compareUi.selection.innerHTML = '<div class="compare-empty">No hexagons selected yet. Click two hexagons on the map.</div>';
    }
    if (compareUi.chart) {
      compareUi.chart.innerHTML = '<div class="compare-empty">Pick two hexagons to unlock the analytics dashboard.</div>';
    }
  }
}

function setCompareMode(enabled) {
  compareMode = !!enabled;
  if (compareUi.toggleButton) {
    compareUi.toggleButton.classList.toggle('active', compareMode);
  }
  if (compareUi.panel) {
    compareUi.panel.hidden = !compareMode;
  }
  if (compareMode) {
    updateCompareDisplay();
  } else {
    clearCompareSelections({ silent: false });
  }
}

function handleCompareSelection({ bin, hexId, scores, hexRadiusPixels }) {
  if (!compareMode) return;

  const existingIndex = compareSelections.findIndex(selection => selection.id === hexId);
  if (existingIndex >= 0) {
    compareSelections.splice(existingIndex, 1);
    applyCompareSelectionStyles();
    updateCompareDisplay();
    return;
  }

  let replaced = false;
  if (compareSelections.length >= 2) {
    compareSelections.shift();
    replaced = true;
  }

  compareSelections.push({
    id: hexId,
    lat: bin.lat,
    lon: bin.lon,
    cantonNum: bin.cantonNum,
    hexRadiusPixels: hexRadiusPixels,
    scores: scores || null
  });

  applyCompareSelectionStyles();
  updateCompareDisplay();

  if (compareUi.status && replaced) {
    compareUi.status.textContent = 'Oldest selection replaced. Comparing the latest two hexagons.';
  }
}

function refreshCompareAnalysis() {
  if (!compareMode || !compareSelections.length) return;
  updateCompareDisplay();
}

function initCompareControls() {
  compareUi = {
    toggleButton: document.getElementById('compare-toggle'),
    panel: document.getElementById('compare-panel'),
    status: document.getElementById('compare-status'),
    selection: document.getElementById('compare-selection'),
    summary: document.getElementById('compare-summary'),
    chart: document.getElementById('compare-chart'),
    reset: document.getElementById('compare-reset')
  };

  if (compareUi.status) {
    compareUi.status.textContent = 'Select two hexagons on the map to compare.';
  }

  if (compareUi.selection) {
    compareUi.selection.innerHTML = '<div class="compare-empty">No hexagons selected yet. Click two hexagons on the map.</div>';
  }

  if (compareUi.toggleButton) {
    compareUi.toggleButton.addEventListener('click', () => {
      setCompareMode(!compareMode);
    });
  }

  if (compareUi.reset) {
    compareUi.reset.addEventListener('click', () => {
      clearCompareSelections();
      if (compareUi.status) {
        compareUi.status.textContent = 'Select two hexagons on the map to compare.';
      }
    });
  }

  if (compareUi.selection) {
    compareUi.selection.addEventListener('click', (event) => {
      const removeBtn = event.target.closest('[data-compare-remove]');
      if (!removeBtn) return;
      const hexId = removeBtn.getAttribute('data-compare-remove');
      if (!hexId) return;
      compareSelections = compareSelections.filter(selection => selection.id !== hexId);
      applyCompareSelectionStyles();
      updateCompareDisplay();
    });
  }

  if (compareUi.chart) {
    compareUi.chart.innerHTML = '<div class="compare-empty">Pick two hexagons to unlock the analytics dashboard.</div>';
  }
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function scheduleIdleWork(work) {
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(work, { timeout: 120 });
    return () => window.cancelIdleCallback(id);
  }

  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    const id = window.requestAnimationFrame(() => work({ timeRemaining: () => 16, didTimeout: false }));
    return () => window.cancelAnimationFrame(id);
  }

  const fallbackId = setTimeout(() => work({ timeRemaining: () => 0, didTimeout: true }), 16);
  return () => clearTimeout(fallbackId);
}

let hexRenderRequestId = 0;
let cancelOngoingHexProcessing = null;

function cancelHexProcessing() {
  if (typeof cancelOngoingHexProcessing === 'function') {
    cancelOngoingHexProcessing();
    cancelOngoingHexProcessing = null;
  }
}

function processHexBinsAsync(allBins, requestId) {
  return new Promise(resolve => {
    let index = 0;
    let cancelChunk = null;
    let resolved = false;
    const chunkSize = 120;

    const finish = (result) => {
      if (resolved) return;
      resolved = true;
      if (cancelChunk) {
        cancelChunk();
        cancelChunk = null;
      }
      cancelOngoingHexProcessing = null;
      resolve(result);
    };

    cancelOngoingHexProcessing = () => finish(false);

    const runChunk = (deadline = { timeRemaining: () => 0, didTimeout: true }) => {
      if (resolved) return;
      if (requestId !== hexRenderRequestId) {
        finish(false);
        return;
      }

      const chunkStart = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      let processedInChunk = 0;

      while (index < allBins.length) {
        const bin = allBins[index];

        try {
          const latLngCenter = map.layerPointToLatLng(L.point(bin.x, bin.y));
          bin.lat = latLngCenter.lat;
          bin.lon = latLngCenter.lng;

          const hexRadiusPixels = bin.hexRadiusPixels || hex.radius();
          const hexId = `${bin.cantonNum}-${bin.x.toFixed(1)}-${bin.y.toFixed(1)}`;

          const polygon = createHexagonPolygon(bin.x, bin.y, hexRadiusPixels);
          bin.scores = calculateCompositeScore(bin.lat, bin.lon, hexRadiusPixels, hexId, polygon);
        } catch (error) {
          console.error("Error processing hexagon bin:", error);
        } finally {
          index++;
          processedInChunk++;
        }

        const timeRemaining = deadline && typeof deadline.timeRemaining === 'function' ? deadline.timeRemaining() : 0;
        const elapsed = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - chunkStart;
        if (processedInChunk >= chunkSize || (timeRemaining <= 1 && elapsed > 18)) {
          break;
        }
      }

      if (index >= allBins.length) {
        finish(true);
        return;
      }

      if (requestId !== hexRenderRequestId) {
        finish(false);
        return;
      }

      cancelChunk = scheduleIdleWork(runChunk);
    };

    cancelChunk = scheduleIdleWork(runChunk);
  });
}

const debouncedProjectHexesOnZoom = debounce(() => {
  scoreCache.clear();
  projectHexes();
}, 120);

const debouncedProjectHexesOnMove = debounce(() => {
  projectHexes();
}, 160);

const debouncedDrawMarkersOnMove = debounce(() => {
  drawFacilityMarkers();
}, 180);

// Project and draw hexagons with composite scoring
async function projectHexes() {
  cancelHexProcessing();

  if (selectedKantonNum.length === 0) {
    renderHexPaths([]);
    return;
  }

  const requestId = ++hexRenderRequestId;
  const allBins = [];

  const hexRadiusPixels = hex.radius();
  const viewBounds = map.getBounds();
  const bufferedBounds = viewBounds.pad(0.2);

  selectedKantonNum.forEach(cantonNum => {
    const cantonData = precomputedData[cantonNum];
    if (!cantonData) return;

    const projected = cantonData.hexCenters
      .filter(([lon, lat]) => bufferedBounds.contains([lat, lon]))
      .map(([lon, lat]) => {
        const pt = map.latLngToLayerPoint([lat, lon]);
        return [pt.x, pt.y, lon, lat];
      });

    if (projected.length === 0) return;

    const bins = hex(projected);
    bins.forEach(bin => {
      bin.cantonNum = cantonNum;
      bin.hexRadiusPixels = hexRadiusPixels;
      bin.lat = null;
      bin.lon = null;
      bin.scores = null;
      allBins.push(bin);
    });
  });

  if (allBins.length === 0) {
    renderHexPaths([]);
    return;
  }

  const completed = await processHexBinsAsync(allBins, requestId);
  if (!completed || requestId !== hexRenderRequestId) {
    return;
  }

  renderHexPaths(allBins);
}

function renderHexPaths(allBins) {
  const attachHexEvents = (selection) => {
    return selection
      .on("mouseover", function(event, d) {
        cancelPopupClose();
        const hexId = getHexIdentifierFromBin(d);
        const slotIndex = getCompareSlotIndex(hexId);
        d3.select(this)
          .classed('hex-hovering', true)
          .transition()
          .duration(200)
          .attr("stroke-width", slotIndex >= 0 ? 4 : 2.5)
          .attr("stroke", slotIndex >= 0 ? getCompareStrokeColor(slotIndex) : "#ffffff");
      })
      .on("mouseout", function(event, d) {
        const nextTarget = event.relatedTarget;
        const hexId = getHexIdentifierFromBin(d);
        const slotIndex = getCompareSlotIndex(hexId);
        d3.select(this)
          .classed('hex-hovering', false)
          .transition()
          .duration(200)
          .attr("stroke-width", slotIndex >= 0 ? 3 : 0.5)
          .attr("stroke", slotIndex >= 0 ? getCompareStrokeColor(slotIndex) : "#ffffff");
        if (!nextTarget || typeof nextTarget.closest !== 'function' || !nextTarget.closest('.leaflet-popup')) {
          schedulePopupClose();
        }
      });
  };

  const scoreValues = allBins
    .map(bin => (bin && bin.scores ? bin.scores.composite : null))
    .filter(value => typeof value === 'number' && !Number.isNaN(value));

  let sortedScores = [];
  const percentileLookup = new Map();

  if (scoreValues.length > 0) {
    sortedScores = [...scoreValues].sort((a, b) => a - b);
    const n = sortedScores.length;
    const denominator = n > 1 ? n - 1 : 1;

    let i = 0;
    while (i < n) {
      const value = sortedScores[i];
      let j = i;
      while (j + 1 < n && Math.abs(sortedScores[j + 1] - value) < 1e-9) {
        j++;
      }

      const percentile = n === 1 ? 0.5 : ((i + j) / 2) / denominator;
      percentileLookup.set(value, Math.max(0, Math.min(1, percentile)));

      i = j + 1;
    }
  }

  const getPercentile = (score) => {
    if (score === null || score === undefined || Number.isNaN(score)) {
      return 0.5;
    }

    const direct = percentileLookup.get(score);
    if (direct !== undefined) {
      return direct;
    }

    if (!sortedScores.length) {
      return 0.5;
    }

    const n = sortedScores.length;
    if (n === 1) {
      return 0.5;
    }

    let low = 0;
    let high = n - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midVal = sortedScores[mid];
      if (Math.abs(midVal - score) < 1e-9) {
        return mid / (n - 1);
      }
      if (midVal < score) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const denominator = n - 1;
    const percentile = denominator > 0 ? low / denominator : 0.5;
    return Math.max(0, Math.min(1, percentile));
  };

  const computeFill = d => {
    if (!d || !d.scores) return "#69b3a2";
    const percentile = getPercentile(d.scores.composite);
    return getColorByScore(percentile);
  };

  const hexPaths = g.selectAll("path.hex")
    .data(allBins, d => getHexIdentifierFromBin(d));

  hexPaths.exit().remove();

  const enteredPaths = hexPaths.enter()
    .append("path")
    .attr("class", "hex")
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 0.5)
    .attr("fill-opacity", hexOpacity)
    .style("pointer-events", "auto")
    .attr("cursor", "pointer");

  const mergedPaths = enteredPaths.merge(hexPaths);

  const onHexClick = function(event, d) {
    event.stopPropagation();
    if (!d || !d.lat || !d.lon) return;

    const containerPoint = map.mouseEventToContainerPoint(event);
    const latlng = map.containerPointToLatLng(containerPoint);

    const hexRadiusPixels = d.hexRadiusPixels || hex.radius();
    const hexId = getHexIdentifierFromBin(d);
    const hexagonPolygon = createHexagonPolygon(d.x, d.y, hexRadiusPixels);
    const freshScores = calculateCompositeScore(d.lat, d.lon, hexRadiusPixels, hexId, hexagonPolygon);

    if (compareMode) {
      map.closePopup();
      handleCompareSelection({
        bin: d,
        hexId,
        scores: freshScores,
        latlng,
        hexRadiusPixels
      });
      return;
    }

    if (!freshScores) return;

    cancelPopupClose();
    let content = `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 350px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px; margin: -10px -10px 10px -10px; border-radius: 5px 5px 0 0;">
          <h3 style="margin: 0; font-size: 18px;">📊 Area Overview</h3>
          <div style="font-size: 24px; font-weight: bold; margin-top: 8px;">
            Score: ${(freshScores.composite * 100).toFixed(1)}%
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
          <h4 style="margin: 0 0 8px 0; color: #495057; font-size: 14px;">🏢 Facility Access</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
            <div><strong>Schools:</strong> ${(freshScores.schools * 100).toFixed(0)}%</div>
            <div style="color: #6c757d;">${freshScores.distances.schools ? (freshScores.distances.schools/1000).toFixed(2) + ' km' : 'N/A'}</div>
            <div><strong>Supermarkets:</strong> ${(freshScores.supermarkets * 100).toFixed(0)}%</div>
            <div style="color: #6c757d;">${freshScores.distances.supermarkets ? (freshScores.distances.supermarkets/1000).toFixed(2) + ' km' : 'N/A'}</div>
            <div><strong>Restaurants:</strong> ${(freshScores.restaurants * 100).toFixed(0)}%</div>
            <div style="color: #6c757d;">${freshScores.distances.restaurants ? (freshScores.distances.restaurants/1000).toFixed(2) + ' km' : 'N/A'}</div>
            <div><strong>Access Roads:</strong> ${(freshScores.accessRoads * 100).toFixed(0)}%</div>
            <div style="color: #6c757d;">${freshScores.distances.accessRoads ? (freshScores.distances.accessRoads/1000).toFixed(2) + ' km' : 'N/A'}</div>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
          <h4 style="margin: 0 0 8px 0; color: #495057; font-size: 14px;">🌿 Environmental Quality</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
            <div><strong>Vegetation:</strong> ${(freshScores.vegetation * 100).toFixed(0)}%</div>
            <div style="color: #6c757d;">${freshScores.rasterValues.vegetation !== null ? freshScores.rasterValues.vegetation.toFixed(2) : 'N/A'}</div>
            <div><strong>Air Quality:</strong> ${(freshScores.airNoise * 100).toFixed(0)}%</div>
            <div style="color: #6c757d;">${freshScores.rasterValues.airNoise !== null ? freshScores.rasterValues.airNoise.toFixed(1) : 'N/A'}</div>
            <div><strong>Rail Noise (Night):</strong> ${(freshScores.railNight * 100).toFixed(0)}%</div>
            <div style="color: #6c757d;">${freshScores.rasterValues.railNight !== null ? freshScores.rasterValues.railNight.toFixed(1) + ' dB' : 'N/A'}</div>
            <div><strong>Road Noise (Night):</strong> ${(freshScores.roadNight * 100).toFixed(0)}%</div>
            <div style="color: #6c757d;">${freshScores.rasterValues.roadNight !== null ? freshScores.rasterValues.roadNight.toFixed(1) + ' dB' : 'N/A'}</div>
          </div>
        </div>
    `;

    if (freshScores.apartmentData && freshScores.apartmentData.count > 0) {
      const uniqueLocations = new Set(freshScores.apartmentData.apartments.map(apt => `${apt.lat},${apt.lon}`));
      const buildingCount = uniqueLocations.size;

      content += `
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 10px; border-radius: 5px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px;">🏠 Housing in this Hexagon</h4>
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 5px;">
            ${freshScores.apartmentData.avgPricePerRoom.toFixed(0)} CHF/room
          </div>
          <div style="font-size: 13px; opacity: 0.95; margin-bottom: 8px;">
            ${freshScores.apartmentData.count} apartment${freshScores.apartmentData.count > 1 ? 's' : ''} in ${buildingCount} building${buildingCount > 1 ? 's' : ''}
          </div>
          <div style="font-size: 13px; opacity: 0.9; margin-bottom: 8px;">
            Affordability: ${(freshScores.apartmentCost * 100).toFixed(0)}%
          </div>
          <details style="font-size: 12px; opacity: 0.9; cursor: pointer;">
            <summary style="margin-bottom: 5px;">Show apartment details</summary>
            <div style="max-height: 150px; overflow-y: auto; margin-top: 5px;">
      
      `;

      freshScores.apartmentData.apartments.slice(0, 10).forEach((apt, idx) => {
        const safeUrl = apt.url && apt.url !== '#'
          ? apt.url
          : null;

        const detailText = `${idx + 1}. ${apt.rooms} rooms - ${apt.price} CHF (${apt.pricePerRoom.toFixed(0)} CHF/room)`;

        content += `
            <div style="padding: 4px 0; border-top: 1px solid rgba(255,255,255,0.2);">
              ${safeUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener" style="color: inherit; text-decoration: underline;">${detailText}</a>` : detailText}
            </div>
          `;
      });

      if (freshScores.apartmentData.count > 10) {
        content += `<div style="padding: 4px 0; font-style: italic;">... and ${freshScores.apartmentData.count - 10} more</div>`;
      }

      content += `
            </div>
          </details>
        </div>
      `;
    } else {
      content += `
        <div style="background: #e9ecef; padding: 10px; border-radius: 5px; text-align: center; color: #6c757d;">
          <div style="font-size: 14px;">🏠 No apartments in this hexagon</div>
          <div style="font-size: 11px; margin-top: 4px; opacity: 0.8;">
            Center: (${d.lat?.toFixed(4) ?? 'N/A'}, ${d.lon?.toFixed(4) ?? 'N/A'})<br>
            Radius: ${hexRadiusPixels.toFixed(1)}px<br>
            SVG Position: (${d.x.toFixed(1)}, ${d.y.toFixed(1)})
          </div>
        </div>
      `;
    }

    content += `</div>`;

    L.popup()
      .setLatLng(latlng)
      .setContent(content)
      .openOn(map);
  };

  attachHexEvents(mergedPaths);

  mergedPaths
    .on("click", onHexClick)
    .attr("fill", computeFill)
    .attr("fill-opacity", hexOpacity)
    .attr("d", hex.hexagon())
    .attr("transform", d => `translate(${d.x},${d.y})`);

  applyCompareSelectionStyles();
  if (compareMode && compareSelections.length) {
    updateCompareDisplay();
  }
}

// Update boundary positions
function updateBoundaries() {
  g.selectAll("path.boundary").attr("d", path);
}

// Update visible elements
function updateDisplay() {
  map.off("zoom", updateBoundaries);
  map.off("viewreset", updateBoundaries);
  map.off("zoomend", debouncedProjectHexesOnZoom);
  map.off("moveend", debouncedProjectHexesOnMove);
  map.off("moveend", debouncedDrawMarkersOnMove);

  cancelHexProcessing();

  map.closePopup();
  g.selectAll("path.boundary").remove();
  g.selectAll("path.hex").remove();

  schoolMarkers.clearLayers();
  apartmentMarkers.clearLayers();
  restaurantMarkers.clearLayers();
  supermarketMarkers.clearLayers();

  if (selectedKantonNum.length === 0) {
    scoreCache.clear();
    map.setView([46.8, 8.3], 8);
    renderHexPaths([]);
    return;
  }

  scoreCache.clear();

  const cantonFeatures = selectedKantonNum
    .map(num => precomputedData[num]?.feature)
    .filter(f => f);

  if (cantonFeatures.length === 0) return;

  g.selectAll("path.boundary")
    .data(cantonFeatures)
    .enter()
    .append("path")
    .attr("class", "boundary")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1.2)
    .attr("d", path);

  // Update boundaries on zoom/viewreset, but not on every move (for performance)
  map.on("zoom", updateBoundaries);
  map.on("viewreset", updateBoundaries);
  map.on("zoomend", debouncedProjectHexesOnZoom);
  map.on("moveend", debouncedProjectHexesOnMove);
  map.on("moveend", debouncedDrawMarkersOnMove);

  projectHexes();
  drawFacilityMarkers();

  const allBounds = selectedKantonNum
    .map(num => precomputedData[num]?.bounds)
    .filter(b => b);
    
  if (allBounds.length > 0) {
    const minLon = Math.min(...allBounds.map(b => b[0][0]));
    const minLat = Math.min(...allBounds.map(b => b[0][1]));
    const maxLon = Math.max(...allBounds.map(b => b[1][0]));
    const maxLat = Math.max(...allBounds.map(b => b[1][1]));

    map.once("moveend", () => {
      projectHexes();
      drawFacilityMarkers();
    });

    map.fitBounds([
      [minLat, minLon],
      [maxLat, maxLon]
    ], {
      padding: [50, 50],
      maxZoom: 13,
      animate: true,
      duration: 0.8
    });
  }
}

// Draw facility markers
function drawFacilityMarkers() {
  if (!map) return;
  
  const bounds = map.getBounds().pad(0.3);
  
  // Clear existing markers
  schoolMarkers.clearLayers();
  apartmentMarkers.clearLayers();
  restaurantMarkers.clearLayers();
  supermarketMarkers.clearLayers();
  
  // Draw schools
  const showSchools = document.getElementById('show-schools');
  if (showSchools && showSchools.checked) {
    schoolLocations.filter(loc => bounds.contains([loc.lat, loc.lon])).forEach(loc => {
      L.circleMarker([loc.lat, loc.lon], {
        radius: 4,
        fillColor: '#4CAF50',
        color: '#fff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      }).bindPopup('<b>🏫 School</b>').addTo(schoolMarkers);
    });
  }
  
  // Draw apartments
  const showApartments = document.getElementById('show-apartments');
  if (showApartments && showApartments.checked && apartmentData.length > 0) {
    apartmentData.filter(apt => apt && apt.lat && apt.lon && bounds.contains([apt.lat, apt.lon])).forEach(apt => {
      const pricePerRoom = (apt.price / apt.rooms).toFixed(0);
      L.circleMarker([apt.lat, apt.lon], {
        radius: 3,
        fillColor: '#FF6B6B',
        color: '#fff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      }).bindPopup(`
        <b>🏠 ${apt.address || 'Apartment'}</b><br>
        Price: ${apt.price} CHF/month<br>
        Rooms: ${apt.rooms}<br>
        Price per room: ${pricePerRoom} CHF
      `).addTo(apartmentMarkers);
    });
  }
  
  // Draw restaurants
  const showRestaurants = document.getElementById('show-restaurants');
  if (showRestaurants && showRestaurants.checked) {
    restoLocations.filter(loc => bounds.contains([loc.lat, loc.lon])).forEach(loc => {
      L.circleMarker([loc.lat, loc.lon], {
        radius: 4,
        fillColor: '#FF9800',
        color: '#fff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      }).bindPopup('<b>🍽️ Restaurant</b>').addTo(restaurantMarkers);
    });
  }
  
  // Draw supermarkets
  const showSupermarkets = document.getElementById('show-supermarkets');
  if (showSupermarkets && showSupermarkets.checked) {
    supermarketLocations.filter(loc => bounds.contains([loc.lat, loc.lon])).forEach(loc => {
      L.circleMarker([loc.lat, loc.lon], {
        radius: 4,
        fillColor: '#2196F3',
        color: '#fff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      }).bindPopup('<b>🛒 Supermarket</b>').addTo(supermarketMarkers);
    });
  }
}

// Create weight sliders
function createWeightSliders() {
  const container = document.getElementById('sliders-container');
  if (!container) return;

  const indices = [
    { key: 'schools', label: 'Schools' },
    { key: 'supermarkets', label: 'Supermarkets' },
    { key: 'restaurants', label: 'Restaurants' },
    { key: 'accessRoads', label: 'Access Roads' },
    { key: 'railNight', label: 'Rail Noise (Night)' },
    { key: 'railDay', label: 'Rail Noise (Day)' },
    { key: 'airNoise', label: 'Air Quality' },
    { key: 'roadDay', label: 'Road Noise (Day)' },
    { key: 'roadNight', label: 'Road Noise (Night)' },
    { key: 'vegetation', label: 'Vegetation' },
    { key: 'apartmentCost', label: 'Apartment Affordability' }
  ];
  
  indices.forEach(index => {
    const slider = document.createElement('div');
    slider.innerHTML = `
      <label>
        ${index.label}: <span id="${index.key}-value">${weights[index.key].toFixed(2)}</span>
      </label>
      <input type="range" id="${index.key}-slider" min="0" max="1" step="0.01" value="${weights[index.key]}" style="width: 100%;">
    `;
    container.appendChild(slider);

    const sliderElement = document.getElementById(`${index.key}-slider`);
    if (sliderElement) {
      sliderElement.addEventListener('input', (e) => {
        const newValue = parseFloat(e.target.value);
        weights[index.key] = newValue;
        
        // Update displayed value
        const valueSpan = document.getElementById(`${index.key}-value`);
        if (valueSpan) {
          valueSpan.textContent = newValue.toFixed(2);
        }
        
        // Clear cache and redraw immediately (no debounce for instant feedback)
        console.log(`🎚️ Weight changed: ${index.label} = ${newValue.toFixed(2)}`);
        scoreCache.clear();
        projectHexes();
        refreshCompareAnalysis();
      });
    }
  });
}

// Load GeoTIFF files
async function loadGeoTIFF(filename, storageKey) {
  try {
    const response = await fetch(filename);
    const arrayBuffer = await response.arrayBuffer();
    const georaster = await parseGeoraster(arrayBuffer);
    
    rasterData[storageKey] = georaster;
    console.log(`✅ GeoTIFF "${filename}" loaded successfully`);
    return georaster;
  } catch (error) {
    console.error(`❌ Could not load GeoTIFF "${filename}":`, error);
    return null;
  }
}

// Store apartment markers layer and cache
let apartmentMarkersLayer = null;
let apartmentZoomHandler = null;
let scoreCache = new Map();

// function drawApartmentMarkers() {
//   // Remove existing markers and event handler
//   if (apartmentMarkersLayer) {
//     map.removeLayer(apartmentMarkersLayer);
//   }
//   if (apartmentZoomHandler) {
//     map.off('zoom', apartmentZoomHandler);
//   }

//   // Create a layer group for all apartment markers
//   apartmentMarkersLayer = L.layerGroup();

//   // Base marker radius configuration
//   const baseZoom = 8;
//   const baseRadius = 3;

//   // Helper: radius that adapts to zoom with min/max constraints
//   function getRadius(zoom) {
//     const zoomFactor = Math.pow(1.5, zoom - baseZoom);
//     const radius = baseRadius * zoomFactor;
//     return Math.min(Math.max(radius, 2), 15);
//   }

//   const currentZoom = map.getZoom();
//   const currentRadius = getRadius(currentZoom);

//   // Only render apartments visible in current viewport + buffer
//   const bounds = map.getBounds();
//   const bufferedBounds = bounds.pad(0.5); // 50% buffer
  
//   const visibleApartments = apartmentData.filter(apt => 
//     bufferedBounds.contains([apt.lat, apt.lon])
//   );

//   visibleApartments.forEach(apt => {
//     const pricePerRoom = (apt.price / apt.rooms).toFixed(0);

//     const marker = L.circleMarker([apt.lat, apt.lon], {
//       radius: currentRadius,
//       fillColor: '#FF6B6B',
//       color: '#000',
//       weight: 1,
//       opacity: 0.8,
//       fillOpacity: 0.6
//     });

//     marker.bindPopup(`
//       <b>${apt.address}</b><br>
//       Price: ${apt.price} CHF/month<br>
//       Rooms: ${apt.rooms}<br>
//       Price per room: ${pricePerRoom} CHF<br>
//       Canton: ${apt.canton}<br>
//       <a href="${apt.url}" target="_blank">View listing</a>
//     `);

//     marker.addTo(apartmentMarkersLayer);
//   });

  // // Add the layer to the map
  // apartmentMarkersLayer.addTo(map);

  // console.log(`✅ Drew ${visibleApartments.length}/${apartmentData.length} apartment markers`);

  // // Update all marker sizes dynamically when zoom changes
  // apartmentZoomHandler = debounce(() => {
  //   const newZoom = map.getZoom();
  //   const radius = getRadius(newZoom);
  //   apartmentMarkersLayer.eachLayer(marker => {
  //     marker.setRadius(radius);
  //   });
  // }, 100);
  
  // map.on('zoom', apartmentZoomHandler);
  
//   // Redraw markers when map moves significantly
//   map.on('moveend', debounce(drawApartmentMarkers, 300));
// }

function getCantonNumbersFromFilters(filters) {
  const allCantonNums = Object.keys(cantonNameMap).map(num => parseInt(num, 10));
  if (filters && Array.isArray(filters.cantons) && filters.cantons.length) {
    const unique = new Set();
    filters.cantons.forEach(item => {
      if (!item) return;
      if (typeof item === 'number') {
        unique.add(item);
      } else if (item.num) {
        unique.add(item.num);
      }
    });
    if (unique.size) {
      return Array.from(unique);
    }
  }
  if (selectedKantonNum && selectedKantonNum.length) {
    return Array.from(new Set(selectedKantonNum));
  }
  return allCantonNums;
}

function describeCantonList(cantonNums) {
  const totalCantons = Object.keys(cantonNameMap).length;
  if (!cantonNums || cantonNums.length === 0 || cantonNums.length === totalCantons) {
    return 'Switzerland';
  }
  const names = cantonNums.map(getCantonLabel);
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function detectBudget(text) {
  if (!text) return null;
  const numericFromMatch = (value) => {
    if (!value) return null;
    let cleaned = value.toString().trim();
    const multiplierMatch = cleaned.match(/(\d+(?:[.,]\d+)?)\s*(k|kchf|k\s*chf|k\s*fr|k\s*sfr)/i);
    if (multiplierMatch) {
      const base = parseFloat(multiplierMatch[1].replace(',', '.'));
      if (!Number.isNaN(base)) {
        return Math.round(base * 1000);
      }
    }

    cleaned = cleaned.replace(/[^0-9.,']/g, '');
    cleaned = cleaned.replace(/[',\s]/g, '');
    if (!cleaned) return null;
    const numeric = parseInt(cleaned, 10);
    if (Number.isNaN(numeric)) return null;
    return numeric;
  };

  const patterns = [
    /(\d[\d'\s]{2,})\s*(?:chf|fr|sfr|\.-)/i,
    /(budget|rent|price|under|below|max|moins|moins de|unter|prix)[^\d]{0,6}(\d[\d'\s]{2,})/i,
    /(\d[\d'\s]{2,})[^\d]{0,6}(?:chf|fr|sfr)/i,
    /(\d+(?:[.,]\d+)?)\s*(k|kchf|k\s*chf|k\s*fr|k\s*sfr)/i
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      const candidate = pattern === patterns[3] ? match[0] : match[1] || match[2];
      const numeric = numericFromMatch(candidate);
      if (numeric != null && numeric >= 300 && numeric <= 20000) {
        return numeric;
      }
    }
  }

  return null;
}

function detectRooms(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  const roomPattern = /(\d+(?:[.,]\d+)?)\s*(?:room|rooms|bedroom|bedrooms|piece|pieces|pièce|pièces|zimmer|zimmern)/i;
  const match = roomPattern.exec(lower);
  if (match && match[1]) {
    const value = parseFloat(match[1].replace(',', '.'));
    if (!Number.isNaN(value) && value > 0) {
      return value;
    }
  }
  if (lower.includes('studio')) return 1;
  if (lower.includes('family')) return 3;
  return null;
}

function detectRoomsFromWords(text) {
  if (!text) return null;
  const mapping = {
    one: 1,
    une: 1,
    eins: 1,
    two: 2,
    deux: 2,
    zwei: 2,
    three: 3,
    trois: 3,
    drei: 3,
    four: 4,
    quatre: 4,
    vier: 4,
    five: 5,
    cinq: 5,
    fünf: 5,
    six: 6,
    sechs: 6,
    sieben: 7,
    sept: 7,
    seven: 7,
    acht: 8,
    huit: 8,
    eight: 8,
    neun: 9,
    neuf: 9,
    nine: 9,
    single: 1,
    double: 2,
    triple: 3,
    studio: 1
  };
  const lower = text.toLowerCase();
  return Object.entries(mapping).reduce((found, [word, value]) => {
    if (found) return found;
    if (lower.includes(`${word} room`) || lower.includes(`${word}-room`) || lower.includes(`${word} bedroom`)) {
      return value;
    }
    if (lower.includes(`${word} pièce`) || lower.includes(`${word} pieces`) || lower.includes(`${word} pi`)) {
      return value;
    }
    return null;
  }, null);
}

function detectPreference(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (/cheapest|low budget|most affordable|affordable|cheap|tight budget|low-cost|low cost/i.test(lower)) return 'cheapest';
  if (/luxury|high-end|high end|most expensive|expensive|premium|upper class/i.test(lower)) return 'luxury';
  if (/worst|avoid|bad option|least desirable/i.test(lower)) return 'worst';
  if (/best|top|great|good|nicest|ideal/i.test(lower)) return 'best';
  return null;
}

function detectEnvironmentFocus(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (/quiet|calm|low noise|silent|peaceful|tranquil|calme|ruhig/i.test(lower)) return 'quiet';
  if (/green|park|vegetation|nature|trees|environment|enviro|air quality|clean air/i.test(lower)) return 'green';
  return null;
}

function detectFacilityFocus(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (/school|university|college|campus|ecole|école|uni|schule|hochschule|bibliothèque/i.test(lower)) return 'schools';
  if (/transport|transit|public transport|bus|train|tram|metro|bahn|gare|station|sbb|cff|vligne|métro|tramway/i.test(lower)) return 'transport';
  if (/shopping|supermarket|grocery|stores|amenities|magasin|courses|commerce|shopping center|mall|laden|geschäfte/i.test(lower)) return 'amenities';
  return null;
}

const PLACE_STOPWORDS = new Set([
  'i', 'im', "i'm", 'we', "we're", 'you', "you're", 'they', "they're", 'he', 'she', 'it', 'hello',
  'hi', 'hey', 'thanks', 'thank', 'please', 'budget', 'looking', 'looking for', 'searching', 'search',
  'need', 'needs', 'find', 'want', 'wants', 'would', 'could', 'should', 'help', 'show', 'give', 'recommend',
  'suggest', 'idea', 'ideas', 'plan', 'plans', 'good', 'spot', 'spots', 'home', 'housing', 'apartment',
  'apartments', 'flat', 'flats', 'place', 'places', 'option', 'options', 'swiss', 'switzerland', 'rent',
  'rental', 'guide', 'map', 'data', 'analysis', 'info', 'information'
]);

function detectStandalonePlaceMentions(text) {
  if (!text) return [];
  const matches = new Map();
  const candidatePattern = /\b([A-Z][A-Za-z\u00C0-\u024F\-']*(?:\.[A-Za-z\u00C0-\u024F\-']*)?(?:\s+[A-Z][A-Za-z\u00C0-\u024F\-']*(?:\.[A-Za-z\u00C0-\u024F\-']*)?)*)\b/g;
  let match;
  while ((match = candidatePattern.exec(text)) !== null) {
    const raw = match[1] ? match[1].trim() : '';
    const cleaned = raw.replace(/\.(?=\s|$)/g, '').trim();
    if (!cleaned || cleaned.length < 3) continue;
    const lower = cleaned.toLowerCase();
    if (PLACE_STOPWORDS.has(lower)) continue;
    const lettersOnly = cleaned.replace(/[^A-Za-z\u00C0-\u024F]/g, '');
    if (!lettersOnly) continue;
    if (/^[A-Z]{2,}$/.test(lettersOnly) && lettersOnly.length <= 4) continue;
    const normalized = normalizePlaceToken(cleaned);
    if (!normalized) continue;
    matches.set(normalized, cleaned);
  }
  return Array.from(matches.values());
}

function detectRadiusInKm(text) {
  if (!text) return null;
  const radiusPattern = /(within|rayon|radius|inside|umkreis|perimeter|distance of|dans un rayon de|im umkreis von)\s*(\d+(?:[.,]\d+)?)\s*(km|kilometer|kilometers|kilometre|kilometres|kms|m|meter|meters|metre|metres)/gi;
  let match;
  const candidates = [];
  while ((match = radiusPattern.exec(text)) !== null) {
    const rawValue = match[2];
    const unit = match[3].toLowerCase();
    const value = parseFloat(rawValue.replace(',', '.'));
    if (!Number.isFinite(value)) continue;
    if (unit.startsWith('m') && !unit.startsWith('mi')) {
      candidates.push(value / 1000);
    } else {
      candidates.push(value);
    }
  }
  if (!candidates.length) return null;
  const positive = candidates.filter(val => val > 0.025);
  if (!positive.length) return null;
  const min = Math.min(...positive);
  return Number.isFinite(min) ? min : null;
}

function extractPriorityKeywords(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const priorities = [];
  const pushUnique = (value) => {
    if (!value) return;
    if (!priorities.includes(value)) priorities.push(value);
  };

  if (/(closest|nearest|shortest|proche|près|nahe|closest to|nearby)/i.test(lower)) pushUnique('closest');
  if (/(farthest|furthest|weitest|plus loin|loin)/i.test(lower)) pushUnique('farthest');
  if (/(cheapest|cheap|affordable|low cost|budget|moins cher|günstig)/i.test(lower)) pushUnique('cheapest');
  if (/(luxury|expensive|premium|haut de gamme|teuer)/i.test(lower)) pushUnique('luxury');
  if (/(best|top|greatest|ideal|optimal|meilleur|beste)/i.test(lower)) pushUnique('best');
  if (/(worst|avoid|moins bon|schlecht)/i.test(lower)) pushUnique('worst');
  if (/(quiet|calm|silent|peaceful|ruhig|calme)/i.test(lower)) pushUnique('quiet');
  if (/(green|vegetation|park|nature|verdant|vert|grün)/i.test(lower)) pushUnique('green');
  if (/(school|university|college|campus|école|schule)/i.test(lower)) pushUnique('schools');
  if (/(transport|transit|bus|train|tram|metro|gare|bahn|sbb|cff)/i.test(lower)) pushUnique('transport');
  if (/(shop|shopping|supermarket|grocery|store|commerce|amenities|magasin|laden)/i.test(lower)) pushUnique('amenities');

  return priorities;
}

const intentKeywordSets = {
  greeting: [
    /\b(?:hi|hello|hey|yo|salut|bonjour|bonsoir|grüezi|hoi|hallo|ciao|servus|buongiorno|guten\s*(?:morgen|tag|abend)|bon matin)\b/i,
    /good\s*(?:morning|evening|afternoon)/i
  ],
  gratitude: [
    /(thank you|thanks|merci|danke|gracias|grazie|much appreciated|thx|dankeschön|merci beaucoup)/i
  ],
  help: [
    /(help|aide|hilfe|support|what can you do|how do i|guide me|usage|explain what you do|que peux-tu faire|wie funktioniert)/i
  ],
  goodSpots: [
    /(recommend|suggest|good spot|best place|where should|ideas|tips|spot|find me|looking for|cherche|suche|advisor|show me|propose|empfiehl)/i
  ],
  basicStats: [
    /(stat|statistic|average|median|overview|summary|information|figures|data|analyse|analysis|price level|rent level|trend|distribution|insight)/i
  ],
  reset: [
    /(clear chat|reset|restart|nouvelle requête|neustart)/i
  ]
};

const housingTermPattern = /(apartment|appartement|appartment|flat|studio|housing|home|logement|wohnung|immobilier|location|rental|renting|maison|house)/i;
const statsTermPattern = /(stat|average|median|mean|figures|analyse|analysis|trend|distribution|data|metrics|insight|overview|statistique|statistik)/i;

function extractProximityTargets(text) {
  if (!text) {
    return {
      matches: [],
      pending: [],
      missing: []
    };
  }

  const normalized = normalizePlaceToken(text);
  const results = new Map();
  const pending = [];
  const missingNames = new Set();
  const radiusHints = new Map();

  const radiusPlacePattern = /within\s+(\d+(?:[.,]\d+)?)\s*(km|kilometer|kilometers|kilometre|kilometres|kms|m|meter|meters|metre|metres)\s+(?:of|from|around|near)\s+([^.,;]+)/gi;
  let radiusMatch;
  while ((radiusMatch = radiusPlacePattern.exec(text)) !== null) {
    const rawValue = radiusMatch[1];
    const unit = radiusMatch[2].toLowerCase();
    const placeRaw = radiusMatch[3].trim();
    const value = parseFloat(rawValue.replace(',', '.'));
    if (!Number.isFinite(value) || !placeRaw) continue;
    const kmValue = unit.startsWith('m') && !unit.startsWith('mi') ? value / 1000 : value;
    if (!Number.isFinite(kmValue)) continue;
    const key = normalizePlaceToken(placeRaw);
    if (key) {
      radiusHints.set(key, kmValue);
      radiusHints.set(key.replace(/\s+/g, ''), kmValue);
    }
  }

  const proximityPattern = /(closest|near|close to|around|nearby|by|proche de|près de|autour de|vers)\s+([^.,;]+)/gi;
  let match;

  while ((match = proximityPattern.exec(text)) !== null) {
    const rawCandidate = match[2] ? match[2].trim() : '';
    const candidate = rawCandidate ? normalizePlaceToken(rawCandidate) : '';
    if (!candidate) continue;

    const place = placeLookup.get(candidate) || placeLookup.get(candidate.replace(/\s+/g, ''));
    if (place) {
      const radiusKm = radiusHints.get(candidate) || radiusHints.get(candidate.replace(/\s+/g, '')) || null;
      const placeEntry = radiusKm != null ? { ...place, radiusKm } : place;
      results.set(`${placeEntry.name}-${radiusKm != null ? radiusKm : 'any'}`, placeEntry);
      continue;
    }

    const lookupPromise = queueDynamicPlaceLookup(candidate, rawCandidate, { radiusKm: radiusHints.get(candidate) || radiusHints.get(candidate.replace(/\s+/g, '')) || null });
    if (lookupPromise) {
      pending.push({ name: rawCandidate, promise: lookupPromise, radiusKm: radiusHints.get(candidate) || radiusHints.get(candidate.replace(/\s+/g, '')) || null });
      missingNames.add(rawCandidate);
    }
  }

  placeLookup.forEach((place, key) => {
    if (normalized.includes(key)) {
      const radiusKm = radiusHints.get(key) || radiusHints.get(key.replace(/\s+/g, '')) || null;
      const placeEntry = radiusKm != null ? { ...place, radiusKm } : place;
      results.set(`${placeEntry.name}-${radiusKm != null ? radiusKm : 'any'}`, placeEntry);
    }
  });

  // If no explicit proximity keyword but the message ends with a place name
  if (!results.size) {
    const trailingPlacePattern = /(?:in|at|around|near|close to|vers|proche de)\s+([^.,;]+)$/i;
    const trailingMatch = trailingPlacePattern.exec(text);
    if (trailingMatch && trailingMatch[1]) {
      const raw = trailingMatch[1].trim();
      const candidate = normalizePlaceToken(raw);
      if (candidate) {
        const place = placeLookup.get(candidate) || placeLookup.get(candidate.replace(/\s+/g, ''));
        if (place) {
          const radiusKm = radiusHints.get(candidate) || radiusHints.get(candidate.replace(/\s+/g, '')) || null;
          const placeEntry = radiusKm != null ? { ...place, radiusKm } : place;
          results.set(`${placeEntry.name}-${radiusKm != null ? radiusKm : 'any'}`, placeEntry);
        } else {
          const lookupPromise = queueDynamicPlaceLookup(candidate, raw, { radiusKm: radiusHints.get(candidate) || radiusHints.get(candidate.replace(/\s+/g, '')) || null });
          if (lookupPromise) {
            pending.push({ name: raw, promise: lookupPromise, radiusKm: radiusHints.get(candidate) || radiusHints.get(candidate.replace(/\s+/g, '')) || null });
            missingNames.add(raw);
          }
        }
      }
    }
  }

  const looseMentions = detectStandalonePlaceMentions(text);
  looseMentions.forEach(raw => {
    const candidate = normalizePlaceToken(raw);
    if (!candidate) return;
    const existing = Array.from(results.values()).some(item => item && item.name && normalizePlaceToken(item.name) === candidate);
    if (existing) return;
    const alreadyPending = pending.some(item => item && item.name && normalizePlaceToken(item.name) === candidate);
    if (alreadyPending) return;

    const place = placeLookup.get(candidate) || placeLookup.get(candidate.replace(/\s+/g, ''));
    if (place) {
      const radiusKm = radiusHints.get(candidate) || radiusHints.get(candidate.replace(/\s+/g, '')) || null;
      const placeEntry = radiusKm != null ? { ...place, radiusKm } : place;
      results.set(`${placeEntry.name}-${radiusKm != null ? radiusKm : 'any'}`, placeEntry);
      return;
    }

    const lookupPromise = queueDynamicPlaceLookup(candidate, raw, { radiusKm: radiusHints.get(candidate) || radiusHints.get(candidate.replace(/\s+/g, '')) || null });
    if (lookupPromise) {
      pending.push({ name: raw, promise: lookupPromise, radiusKm: radiusHints.get(candidate) || radiusHints.get(candidate.replace(/\s+/g, '')) || null });
      missingNames.add(raw);
    }
  });

  return {
    matches: Array.from(results.values()),
    pending,
    missing: Array.from(missingNames)
  };
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some(val => val == null || Number.isNaN(val))) {
    return null;
  }
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  return R * c;
}

function average(values) {
  if (!Array.isArray(values) || !values.length) return null;
  const valid = values.filter(v => v != null && !Number.isNaN(v));
  if (!valid.length) return null;
  const sum = valid.reduce((acc, val) => acc + val, 0);
  return sum / valid.length;
}

function ensureComparable(value, direction = 'asc') {
  if (value == null || Number.isNaN(value)) {
    return direction === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  }
  return value;
}

function compareNumeric(aValue, bValue, direction = 'asc') {
  const a = ensureComparable(aValue, direction);
  const b = ensureComparable(bValue, direction);
  if (a < b) return direction === 'asc' ? -1 : 1;
  if (a > b) return direction === 'asc' ? 1 : -1;
  return 0;
}

function formatDistanceKm(distanceKm) {
  if (distanceKm == null || Number.isNaN(distanceKm)) return null;
  if (distanceKm < 0.2) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  }
  return `${Math.round(distanceKm)} km`;
}

function extractFiltersFromMessage(message) {
  const roomsFromWords = detectRoomsFromWords(message);
  const preference = detectPreference(message);
  let environmentFocus = detectEnvironmentFocus(message);
  let facilityFocus = detectFacilityFocus(message);
  const proximityInfo = extractProximityTargets(message);
  const radiusKm = detectRadiusInKm(message);
  const priorityKeywords = extractPriorityKeywords(message);

  if (!environmentFocus) {
    if (priorityKeywords.includes('quiet')) environmentFocus = 'quiet';
    else if (priorityKeywords.includes('green')) environmentFocus = 'green';
  }

  if (!facilityFocus) {
    if (priorityKeywords.includes('schools')) facilityFocus = 'schools';
    else if (priorityKeywords.includes('transport')) facilityFocus = 'transport';
    else if (priorityKeywords.includes('amenities')) facilityFocus = 'amenities';
  }

  return {
    cantons: extractCantonsFromText(message),
    budget: detectBudget(message),
    rooms: detectRooms(message) || roomsFromWords,
    preference,
    environmentFocus,
    facilityFocus,
    proximityTargets: proximityInfo.matches,
    pendingGeocodes: proximityInfo.pending,
    pendingPlaceNames: proximityInfo.missing,
    searchRadiusKm: radiusKm,
    priorities: priorityKeywords
  };
}

function determineIntent(message, filters = {}) {
  const lower = message.toLowerCase();
  const scores = {
    greeting: 0,
    gratitude: 0,
    help: 0,
    goodSpots: 0,
    basicStats: 0,
    reset: 0,
    fallback: 0
  };

  Object.entries(intentKeywordSets).forEach(([intent, patterns]) => {
    patterns.forEach(pattern => {
      if (pattern.test(lower)) {
        scores[intent] += 1;
      }
    });
  });

  if (housingTermPattern.test(lower)) {
    scores.goodSpots += 2;
  }

  if (statsTermPattern.test(lower)) {
    scores.basicStats += 1;
  }

  if (/(price|rent|cost|afford|prix|coût|kosten)/i.test(lower)) {
    scores.basicStats += 1;
  }

  if (filters) {
    if (filters.budget != null) scores.goodSpots += 1;
    if (filters.rooms != null) scores.goodSpots += 1;
    if (filters.preference) scores.goodSpots += 1;
    if (filters.environmentFocus || filters.facilityFocus) scores.goodSpots += 1;
    if (filters.proximityTargets && filters.proximityTargets.length) scores.goodSpots += 2;
    if (filters.priorities && filters.priorities.length) scores.goodSpots += 1;
  }

  const wordCount = lower.trim().split(/\s+/).filter(Boolean).length;

  const priorityOrder = ['reset', 'gratitude', 'greeting', 'help', 'basicStats', 'goodSpots'];

  const bestIntent = priorityOrder.reduce((chosen, intent) => {
    if (!chosen) {
      return scores[intent] > 0 ? intent : null;
    }
    const currentScore = scores[intent];
    const chosenScore = scores[chosen];
    if (currentScore > chosenScore) {
      return intent;
    }
    return chosen;
  }, null);

  if (bestIntent && scores[bestIntent] > 0) {
    if ((bestIntent === 'greeting' || bestIntent === 'gratitude') && scores.goodSpots + scores.basicStats + scores.help === 0 && wordCount <= 6) {
      return bestIntent;
    }
    if (bestIntent === 'reset' && scores.reset > 0) {
      return 'reset';
    }
  }

  if (scores.help >= Math.max(scores.goodSpots, scores.basicStats) && scores.help > 0) {
    return 'help';
  }
  if (scores.basicStats >= scores.goodSpots && scores.basicStats > 0) {
    return 'basicStats';
  }
  if (scores.goodSpots > 0) {
    return 'goodSpots';
  }
  if (scores.greeting > 0 && scores.greeting >= scores.gratitude) {
    return 'greeting';
  }
  if (scores.gratitude > 0) {
    return 'gratitude';
  }

  return 'fallback';
}

function intentRequiresInsights(intent) {
  return intent === 'basicStats' || intent === 'goodSpots';
}

function appendChatMessage(role, text, options = {}) {
  if (!chatElements || !chatElements.messages) return;
  const wrapper = document.createElement('div');
  wrapper.className = `chat-message chat-${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';

  if (text) {
    text
      .split(/\n+/)
      .map(line => line.trim())
      .filter(Boolean)
      .forEach(line => {
        const paragraph = document.createElement('p');
        paragraph.textContent = line;
        bubble.appendChild(paragraph);
      });
  }

  if (Array.isArray(options.details) && options.details.length) {
    const detailsWrap = document.createElement('div');
    detailsWrap.className = 'chat-details';
    options.details.forEach(detail => {
      const span = document.createElement('span');
      span.textContent = detail;
      detailsWrap.appendChild(span);
    });
    bubble.appendChild(detailsWrap);
  }

  if (Array.isArray(options.suggestions) && options.suggestions.length) {
    const suggestionsWrap = document.createElement('div');
    suggestionsWrap.className = 'chat-suggestions';

    options.suggestions.forEach((suggestion, idx) => {
      const card = document.createElement('div');
      card.className = 'chat-suggestion-card';

      const title = document.createElement('strong');
      title.textContent = `${idx + 1}. ${suggestion.title}`;
      card.appendChild(title);

      if (Array.isArray(suggestion.meta) && suggestion.meta.length) {
        const metaWrap = document.createElement('div');
        metaWrap.className = 'chat-suggestion-meta';
        suggestion.meta.forEach(metaItem => {
          const span = document.createElement('span');
          span.textContent = metaItem;
          metaWrap.appendChild(span);
        });
        card.appendChild(metaWrap);
      }

      const actions = document.createElement('div');
      actions.className = 'chat-suggestion-actions';

      if (suggestion.lat != null && suggestion.lon != null) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chat-suggestion-btn';
        btn.dataset.lat = suggestion.lat;
        btn.dataset.lon = suggestion.lon;
        if (suggestion.price != null) btn.dataset.price = suggestion.price;
        if (suggestion.rooms != null) btn.dataset.rooms = suggestion.rooms;
        if (suggestion.address) btn.dataset.address = suggestion.address;
        if (suggestion.score != null) btn.dataset.score = suggestion.score;
        if (suggestion.url) btn.dataset.url = suggestion.url;
        btn.textContent = 'View on map';
        actions.appendChild(btn);
      }

      if (suggestion.url) {
        const link = document.createElement('a');
        link.href = suggestion.url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.className = 'chat-suggestion-link';
        link.textContent = 'Open listing';
        actions.appendChild(link);
      }

      if (actions.children.length) {
        card.appendChild(actions);
      }

      suggestionsWrap.appendChild(card);
    });

    bubble.appendChild(suggestionsWrap);
  }

  wrapper.appendChild(bubble);
  chatElements.messages.appendChild(wrapper);
  chatElements.messages.scrollTop = chatElements.messages.scrollHeight;
}

function respondWithHelp() {
  appendChatMessage('assistant', 'Here\'s how I can help:', {
    details: [
      '"Show me rent stats for Vaud" — get averages and ranges.',
      '"Suggest good spots in Zurich under 2000 CHF" — see top apartments.',
      'Mention a canton, budget, or rooms to narrow the search.'
    ]
  });
}

function respondWithGreeting() {
  appendChatMessage('assistant', 'Salut! Grüezi! Hello! Tell me what kind of Swiss home you\'re after and I will pull stats or suggestions. Ask for "help" anytime for examples.');
}

function respondWithGratitude() {
  appendChatMessage('assistant', 'Happy to help! Let me know if you want more options or fresh stats.');
}

function respondWithReset() {
  chatbotState.lastIntent = null;
  chatbotState.lastFilters = null;
  pendingChatQueue = [];
  appendChatMessage('assistant', 'Starting fresh. Ask me for stats or housing suggestions and I will tailor a new plan.');
}

function respondWithFallback() {
  appendChatMessage('assistant', 'I\'m not sure I follow. Try something like "quiet 2 room apartment near Lausanne under 2k", "rent stats for Zurich", or say "help" for a quick cheat sheet. Mention budgets, rooms, quiet/green vibes, transport, or a place you like.');
}

function createSuggestionPayload(entry) {
  const titleBase = entry.address ? entry.address : `${entry.cantonName || 'Apartment'} ${formatCurrency(entry.price)}`;
  const meta = [];
  if (entry.price != null) meta.push(`${formatCurrency(entry.price)} total`);
  if (entry.pricePerRoom != null) meta.push(`${formatCurrency(entry.pricePerRoom)} per room`);
  if (entry.rooms != null) meta.push(`${entry.rooms} room${entry.rooms === 1 ? '' : 's'}`);
  if (entry.score != null) meta.push(`score ${formatPercent(entry.score)}`);
  if (entry.recommendationContext && Array.isArray(entry.recommendationContext.highlights)) {
    entry.recommendationContext.highlights.forEach(highlight => {
      if (highlight && !meta.includes(highlight)) {
        meta.push(highlight);
      }
    });
  }
  return {
    title: titleBase,
    meta,
    lat: entry.lat,
    lon: entry.lon,
    url: entry.url,
    price: entry.price,
    rooms: entry.rooms,
    address: entry.address || entry.cantonName || '',
    score: entry.score,
    cantonName: entry.cantonName
  };
}

function respondWithStats(filters) {
  if (!insightsReady) {
    appendChatMessage('assistant', 'Housing stats are still loading. I will share details in a moment.');
    return;
  }

  const cantonNums = getCantonNumbersFromFilters(filters);
  const uniqueNums = Array.from(new Set(cantonNums));
  const statsList = uniqueNums
    .map(num => cantonStats[num])
    .filter(Boolean);

  if (!statsList.length) {
    if (countryStats) {
      statsList.push(countryStats);
    } else {
      appendChatMessage('assistant', 'I do not have statistics for that area yet. Try another canton.');
      return;
    }
  }

  const areaLabel = describeCantonList(uniqueNums);
  const intro = `Here\'s a quick snapshot for ${areaLabel}. Ask for suggestions if you want specific apartments.`;
  const details = statsList.map(stats => {
    const parts = [];
    parts.push(`${stats.name}:`);
    if (stats.avgPricePerRoom != null) {
      parts.push(`${formatCurrency(stats.avgPricePerRoom)} per room (avg)`);
    }
    if (stats.medianPricePerRoom != null) {
      parts.push(`median ${formatCurrency(stats.medianPricePerRoom)}`);
    }
    if (stats.avgScore != null) {
      parts.push(`score ${formatPercent(stats.avgScore)}`);
    }
    parts.push(`${numberFormatter.format(stats.count)} listing${stats.count === 1 ? '' : 's'}`);
    return parts.join(' • ');
  });

  appendChatMessage('assistant', intro, { details });
}

function annotateEntryForFilters(entry, filters) {
  const details = entry.scoreDetails || {};
  const distances = details.distances || {};

  const noiseScores = [details.railNight, details.railDay, details.roadNight, details.roadDay];
  const quietScore = average(noiseScores);
  const greenScore = details.vegetation != null ? details.vegetation : null;

  const facilityDistancesKm = {
    schools: distances.schools != null ? distances.schools / 1000 : null,
    transport: distances.accessRoads != null ? distances.accessRoads / 1000 : null,
    amenities: null
  };

  const amenityDistances = [];
  if (distances.supermarkets != null) amenityDistances.push(distances.supermarkets);
  if (distances.restaurants != null) amenityDistances.push(distances.restaurants);
  if (amenityDistances.length) {
    facilityDistancesKm.amenities = Math.min(...amenityDistances) / 1000;
  }

  let proximityDistanceKm = null;
  let proximityName = null;
  const proximityTargets = Array.isArray(filters?.proximityTargets) ? filters.proximityTargets : [];
  const globalRadiusKm = typeof filters?.searchRadiusKm === 'number' ? filters.searchRadiusKm : null;
  const proximityDetails = [];
  let withinRadius = false;

  proximityTargets.forEach(target => {
    if (!target || target.lat == null || target.lon == null) return;
    const dist = haversineDistanceKm(entry.lat, entry.lon, target.lat, target.lon);
    if (dist == null || Number.isNaN(dist)) return;
    const targetRadiusKm = typeof target.radiusKm === 'number' ? target.radiusKm : null;
    const withinTargetRadius = targetRadiusKm != null && dist <= targetRadiusKm;
    if (withinTargetRadius) withinRadius = true;
    proximityDetails.push({
      name: target.name || null,
      distanceKm: dist,
      radiusKm: targetRadiusKm,
      withinRadius: withinTargetRadius
    });
    if (proximityDistanceKm == null || dist < proximityDistanceKm) {
      proximityDistanceKm = dist;
      proximityName = target.name || null;
    }
  });

  if (!withinRadius && globalRadiusKm != null && proximityDistanceKm != null && proximityDistanceKm <= globalRadiusKm) {
    withinRadius = true;
  }

  const highlights = [];
  if (proximityName && proximityDistanceKm != null) {
    const distanceLabel = formatDistanceKm(proximityDistanceKm);
    if (distanceLabel) {
      const radiusLabel = (() => {
        const targetDetail = proximityDetails.find(item => item.name === proximityName && item.radiusKm);
        if (targetDetail && targetDetail.radiusKm != null) {
          return `≤ ${targetDetail.radiusKm.toFixed(1)} km`;
        }
        if (globalRadiusKm != null) {
          return `within ${globalRadiusKm.toFixed(1)} km`;
        }
        return null;
      })();
      highlights.push(`Near ${proximityName} (${distanceLabel}${radiusLabel ? `, ${radiusLabel}` : ''})`);
    }
  }

  if (filters?.environmentFocus === 'quiet' && quietScore != null) {
    highlights.push(`Low noise score ${formatPercent(quietScore)}`);
  } else if (filters?.environmentFocus === 'green' && greenScore != null) {
    highlights.push(`Green coverage score ${formatPercent(greenScore)}`);
  }

  if (filters?.facilityFocus) {
    const focus = filters.facilityFocus;
    const distanceKm = facilityDistancesKm[focus];
    if (distanceKm != null) {
      const labels = {
        schools: 'closest school',
        transport: 'transport access',
        amenities: 'shops & food'
      };
      const distanceLabel = formatDistanceKm(distanceKm);
      if (distanceLabel && labels[focus]) {
        highlights.push(`${distanceLabel} to ${labels[focus]}`);
      }
    }
  }

  return {
    quietScore,
    greenScore,
    facilityDistancesKm,
    proximityDistanceKm,
    proximityName,
    highlights,
    proximityDetails,
    withinRadius,
    globalRadiusKm
  };
}

function compareAnnotatedEntries(a, b, filters) {
  const priorityChain = Array.isArray(filters?.priorities) ? filters.priorities : [];
  if (priorityChain.length) {
    for (const priority of priorityChain) {
      switch (priority) {
        case 'closest': {
          const cmp = compareNumeric(a.metrics.proximityDistanceKm, b.metrics.proximityDistanceKm, 'asc');
          if (cmp !== 0) return cmp;
          break;
        }
        case 'cheapest': {
          const cmp = compareNumeric(a.entry.pricePerRoom, b.entry.pricePerRoom, 'asc');
          if (cmp !== 0) return cmp;
          break;
        }
        case 'luxury': {
          const cmp = compareNumeric(a.entry.pricePerRoom, b.entry.pricePerRoom, 'desc');
          if (cmp !== 0) return cmp;
          break;
        }
        case 'best': {
          const cmp = compareNumeric(a.entry.score, b.entry.score, 'desc');
          if (cmp !== 0) return cmp;
          break;
        }
        case 'worst': {
          const cmp = compareNumeric(a.entry.score, b.entry.score, 'asc');
          if (cmp !== 0) return cmp;
          break;
        }
        case 'quiet': {
          const cmp = compareNumeric(a.metrics.quietScore, b.metrics.quietScore, 'desc');
          if (cmp !== 0) return cmp;
          break;
        }
        case 'green': {
          const cmp = compareNumeric(a.metrics.greenScore, b.metrics.greenScore, 'desc');
          if (cmp !== 0) return cmp;
          break;
        }
        case 'schools': {
          const cmp = compareNumeric(a.metrics.facilityDistancesKm?.schools, b.metrics.facilityDistancesKm?.schools, 'asc');
          if (cmp !== 0) return cmp;
          break;
        }
        case 'transport': {
          const cmp = compareNumeric(a.metrics.facilityDistancesKm?.transport, b.metrics.facilityDistancesKm?.transport, 'asc');
          if (cmp !== 0) return cmp;
          break;
        }
        case 'amenities': {
          const cmp = compareNumeric(a.metrics.facilityDistancesKm?.amenities, b.metrics.facilityDistancesKm?.amenities, 'asc');
          if (cmp !== 0) return cmp;
          break;
        }
        default:
          break;
      }
    }
  }

  if (filters?.proximityTargets && filters.proximityTargets.length) {
    const cmp = compareNumeric(a.metrics.proximityDistanceKm, b.metrics.proximityDistanceKm, 'asc');
    if (cmp !== 0) return cmp;
  }

  if (filters?.environmentFocus === 'quiet') {
    const cmp = compareNumeric(a.metrics.quietScore, b.metrics.quietScore, 'desc');
    if (cmp !== 0) return cmp;
  } else if (filters?.environmentFocus === 'green') {
    const cmp = compareNumeric(a.metrics.greenScore, b.metrics.greenScore, 'desc');
    if (cmp !== 0) return cmp;
  }

  if (filters?.facilityFocus) {
    const focus = filters.facilityFocus;
    const distanceA = a.metrics.facilityDistancesKm ? a.metrics.facilityDistancesKm[focus] : null;
    const distanceB = b.metrics.facilityDistancesKm ? b.metrics.facilityDistancesKm[focus] : null;
    const cmp = compareNumeric(distanceA, distanceB, 'asc');
    if (cmp !== 0) return cmp;
  }

  const preference = filters?.preference;
  if (preference === 'cheapest') {
    const cmpPrice = compareNumeric(a.entry.pricePerRoom, b.entry.pricePerRoom, 'asc');
    if (cmpPrice !== 0) return cmpPrice;
    const cmpScore = compareNumeric(a.entry.score, b.entry.score, 'desc');
    if (cmpScore !== 0) return cmpScore;
  } else if (preference === 'luxury') {
    const cmpPrice = compareNumeric(a.entry.pricePerRoom, b.entry.pricePerRoom, 'desc');
    if (cmpPrice !== 0) return cmpPrice;
    const cmpScore = compareNumeric(a.entry.score, b.entry.score, 'desc');
    if (cmpScore !== 0) return cmpScore;
  } else if (preference === 'worst') {
    const cmpScore = compareNumeric(a.entry.score, b.entry.score, 'asc');
    if (cmpScore !== 0) return cmpScore;
    const cmpPrice = compareNumeric(a.entry.pricePerRoom, b.entry.pricePerRoom, 'desc');
    if (cmpPrice !== 0) return cmpPrice;
  } else {
    const cmpScore = compareNumeric(a.entry.score, b.entry.score, 'desc');
    if (cmpScore !== 0) return cmpScore;
    const cmpPrice = compareNumeric(a.entry.pricePerRoom, b.entry.pricePerRoom, 'asc');
    if (cmpPrice !== 0) return cmpPrice;
  }

  return compareNumeric(a.entry.price, b.entry.price, 'asc');
}

function getSuggestions(filters) {
  const context = {
    hadProximityTargets: !!(filters?.proximityTargets && filters.proximityTargets.length),
    usedProximityFilter: false,
    proximityFallback: false,
    budgetFallback: false,
    roomsFallback: false,
    usedRadius: false,
    radiusFallback: false,
    radiusRequested: typeof filters?.searchRadiusKm === 'number' && filters.searchRadiusKm > 0
  };

  if (!apartmentInsights.length) {
    return { items: [], context };
  }

  const cantonNums = getCantonNumbersFromFilters(filters);
  const totalCantons = Object.keys(cantonNameMap).length;
  let dataset = apartmentInsights;

  if (cantonNums.length && cantonNums.length < totalCantons) {
    const cantonSet = new Set(cantonNums);
    dataset = dataset.filter(item => item.cantonNum != null && cantonSet.has(item.cantonNum));
  }

  const datasetAfterCantons = dataset;

  let appliedBudget = false;
  if (filters && filters.budget) {
    appliedBudget = true;
    dataset = dataset.filter(item => item.price != null && item.price <= filters.budget);
    if (!dataset.length) {
      dataset = datasetAfterCantons;
      context.budgetFallback = true;
    }
  }

  let appliedRooms = false;
  if (filters && filters.rooms) {
    appliedRooms = true;
    dataset = dataset.filter(item => item.rooms != null && item.rooms >= (filters.rooms - 0.25));
    if (!dataset.length) {
      dataset = datasetAfterCantons;
      if (appliedBudget && !context.budgetFallback && filters.budget) {
        dataset = dataset.filter(item => item.price != null && item.price <= filters.budget);
      }
      context.roomsFallback = true;
    }
  }

  if (!dataset.length) {
    dataset = apartmentInsights;
  }

  const annotated = dataset.map(entry => ({
    entry,
    metrics: annotateEntryForFilters(entry, filters)
  }));

  const comparator = (a, b) => compareAnnotatedEntries(a, b, filters || {});

  const proximityLimitKm = 40;
  let activeList = annotated;
  if (context.hadProximityTargets) {
    const radiusProvided = typeof filters?.searchRadiusKm === 'number' && filters.searchRadiusKm > 0.01;
    const targetRadiusProvided = filters?.proximityTargets?.some(target => target && typeof target.radiusKm === 'number' && target.radiusKm > 0.01);
    const hasRadiusCriteria = radiusProvided || targetRadiusProvided;

    if (targetRadiusProvided) {
      context.radiusRequested = true;
    }

    const satisfiesCustomRadius = (item) => {
      const metrics = item.metrics;
      if (!metrics) return false;
      if (radiusProvided && metrics.proximityDistanceKm != null && metrics.proximityDistanceKm <= filters.searchRadiusKm) {
        return true;
      }
      if (metrics.proximityDetails && metrics.proximityDetails.some(detail => detail.withinRadius)) {
        return true;
      }
      return false;
    };

    if (hasRadiusCriteria) {
      const withinCustomRadius = annotated.filter(satisfiesCustomRadius);
      if (withinCustomRadius.length) {
        activeList = withinCustomRadius;
        context.usedProximityFilter = true;
        context.usedRadius = true;
      } else {
        context.radiusFallback = true;
      }
    }

    if (!context.usedProximityFilter) {
      const proximityLimitKm = filters?.proximityTargets && filters.proximityTargets.length > 1 ? 60 : 40;
      const withinLimit = annotated.filter(item => item.metrics.proximityDistanceKm != null && item.metrics.proximityDistanceKm <= proximityLimitKm);
      if (withinLimit.length) {
        activeList = withinLimit;
        context.usedProximityFilter = true;
      } else if (!context.radiusFallback) {
        context.proximityFallback = true;
      }
    }
  }

  const ranked = activeList.length ? activeList.slice().sort(comparator) : annotated.slice().sort(comparator);
  const limited = ranked.slice(0, 3);
  const ascendingPrice = limited.slice().sort((a, b) => {
    const primaryA = a.entry.price != null ? a.entry.price : a.entry.pricePerRoom;
    const primaryB = b.entry.price != null ? b.entry.price : b.entry.pricePerRoom;
    const cmpPrimary = compareNumeric(primaryA, primaryB, 'asc');
    if (cmpPrimary !== 0) return cmpPrimary;
    return compareNumeric(a.entry.pricePerRoom, b.entry.pricePerRoom, 'asc');
  });
  const topEntries = ascendingPrice.map(item => ({
    ...item.entry,
    recommendationContext: item.metrics
  }));

  return {
    items: topEntries,
    context
  };
}

function respondWithSuggestions(filters) {
  if (!insightsReady) {
    appendChatMessage('assistant', 'Still crunching the housing data. I will share suggestions shortly.');
    return;
  }

  const { items: suggestions, context: suggestionContext } = getSuggestions(filters || {});
  const cantonNums = getCantonNumbersFromFilters(filters);
  const areaLabel = describeCantonList(cantonNums);

  if (!suggestions.length) {
    if (filters && filters.budget) {
      appendChatMessage('assistant', `I could not find apartments in ${areaLabel} under ${formatCurrency(filters.budget)}. Try raising the budget or removing filters.`);
    } else {
      appendChatMessage('assistant', `I could not find suitable apartments in ${areaLabel} right now. Try another canton or adjust your filters.`);
    }
    const pendingNames = Array.isArray(filters?.pendingPlaceNames)
      ? Array.from(new Set(filters.pendingPlaceNames.filter(name => typeof name === 'string' && name.trim().length)))
      : [];
    if (pendingNames.length) {
      const nameQueue = [...pendingNames];
      const lastName = nameQueue.pop();
      const nameText = nameQueue.length ? `${nameQueue.join(', ')}, and ${lastName}` : lastName;
      appendChatMessage('assistant', `I am still fetching coordinates for ${nameText} via OpenStreetMap. I will refresh the shortlist once that data arrives.`);
    }
    return;
  }

  const introParts = [`Here are some promising spots in ${areaLabel}.`];
  if (filters && filters.budget) {
    introParts.push(`Budget cap: ${formatCurrency(filters.budget)}.`);
    if (suggestionContext && suggestionContext.budgetFallback) {
      introParts.push('No listings were strictly under that limit, so I surfaced the closest matches.');
    }
  }
  if (filters && filters.rooms) {
    introParts.push(`Minimum rooms: ${filters.rooms}.`);
    if (suggestionContext && suggestionContext.roomsFallback) {
      introParts.push('Room count was relaxed to show nearby options.');
    }
  }

  if (filters && typeof filters.searchRadiusKm === 'number' && filters.searchRadiusKm > 0) {
    introParts.push(`Applying search radius: ${filters.searchRadiusKm.toFixed(1)} km.`);
  } else if (suggestionContext && suggestionContext.radiusRequested) {
    introParts.push('Honouring per-place radius constraints where provided.');
  }

  if (filters && filters.preference) {
    const preferenceMessages = {
      cheapest: 'Prioritizing the most affordable choices.',
      luxury: 'Highlighting premium, higher-priced listings.',
      best: 'Surfacing the top composite scores.',
      worst: 'Showing the lower-scoring outliers as requested.'
    };
    if (preferenceMessages[filters.preference]) {
      introParts.push(preferenceMessages[filters.preference]);
    }
  }

  if (filters && filters.environmentFocus) {
    if (filters.environmentFocus === 'quiet') {
      introParts.push('Focusing on calmer, low-noise areas.');
    } else if (filters.environmentFocus === 'green') {
      introParts.push('Emphasizing greener surroundings.');
    }
  }

  if (filters && filters.facilityFocus) {
    const facilityMessages = {
      schools: 'Preferring places close to schools and campuses.',
      transport: 'Favoring quick transport access.',
      amenities: 'Keeping daily amenities within easy reach.'
    };
    if (facilityMessages[filters.facilityFocus]) {
      introParts.push(facilityMessages[filters.facilityFocus]);
    }
  }

  if (Array.isArray(filters?.priorities) && filters.priorities.length) {
    const prettyPriority = filters.priorities
  .map(priority => priority.charAt(0).toUpperCase() + priority.slice(1))
  .join(' -> ');
    introParts.push(`Ranking priorities: ${prettyPriority}.`);
  }

  const pendingPlaceNames = Array.isArray(filters?.pendingPlaceNames)
    ? filters.pendingPlaceNames.filter(name => typeof name === 'string' && name.trim().length)
    : [];
  if (pendingPlaceNames.length) {
    const uniquePending = Array.from(new Set(pendingPlaceNames.map(name => name.trim())));
    if (uniquePending.length) {
      const lastName = uniquePending.pop();
      const prefix = uniquePending.length ? `${uniquePending.join(', ')}, and ${lastName}` : lastName;
      introParts.push(`Fetching coordinates for ${prefix} via OpenStreetMap; I'll refine the shortlist as soon as those arrive.`);
    }
  }

  if (suggestionContext && suggestionContext.hadProximityTargets) {
    const names = (filters?.proximityTargets || [])
      .map(place => place && place.name ? place.name : null)
      .filter(Boolean);
    if (names.length) {
      if (suggestionContext.usedRadius && typeof filters?.searchRadiusKm === 'number' && filters.searchRadiusKm > 0) {
        introParts.push(`Staying within ${filters.searchRadiusKm.toFixed(1)} km of ${names.join(', ')} where possible.`);
      } else if (suggestionContext.usedRadius) {
        introParts.push(`Respecting per-place radius constraints around ${names.join(', ')}.`);
      } else if (suggestionContext.usedProximityFilter) {
        introParts.push(`Staying within roughly 40 km of ${names.join(', ')}.`);
      } else if (suggestionContext.radiusFallback) {
        introParts.push(`No listings fell inside the requested radius around ${names.join(', ')}, so I broadened the search.`);
      } else if (suggestionContext.proximityFallback) {
        introParts.push(`No listings fell within immediate reach of ${names.join(', ')}, so I returned the closest matches I have.`);
      }
    }
  }

  appendChatMessage('assistant', introParts.join(' '), {
    suggestions: suggestions.map(createSuggestionPayload)
  });
}

function respondForIntent(intent, filters) {
  chatbotState.lastIntent = intent;
  if (filters) {
    const stored = { ...filters };
    if (stored.pendingGeocodes) {
      delete stored.pendingGeocodes;
    }
    chatbotState.lastFilters = stored;
  } else {
    chatbotState.lastFilters = null;
  }

  if (intent === 'reset') {
    respondWithReset();
    return;
  }

  if (intent === 'greeting') {
    respondWithGreeting();
    return;
  }

  if (intent === 'gratitude') {
    respondWithGratitude();
    return;
  }

  if (intent === 'help') {
    respondWithHelp();
    return;
  }

  if (intent === 'basicStats') {
    respondWithStats(filters);
    return;
  }

  if (intent === 'goodSpots') {
    respondWithSuggestions(filters);
    return;
  }

  respondWithFallback();
}

async function handleChatInput(rawInput) {
  if (!rawInput) return;
  const message = rawInput.trim();
  if (!message) return;
  appendChatMessage('user', message);
  const fallbackFilters = extractFiltersFromMessage(message);
  let filters = fallbackFilters;
  let intent = determineIntent(message, fallbackFilters);
  let geminiInterpretation = null;

  try {
    geminiInterpretation = await normalizeChatQueryWithGemini(message, {
      fallbackIntent: intent,
      fallbackFilters
    });
  } catch (error) {
    console.warn('Gemini normalization threw:', error);
  }

  if (geminiInterpretation && geminiInterpretation.filters) {
    filters = geminiInterpretation.filters;
  }
  if (geminiInterpretation && geminiInterpretation.intent) {
    intent = geminiInterpretation.intent;
  }

  if (geminiInterpretation && geminiInterpretation.normalizedPrompt && geminiInterpretation.normalizedPrompt.length && geminiInterpretation.normalizedPrompt !== message) {
    console.log('Gemini normalized prompt:', geminiInterpretation.normalizedPrompt);
  }
  if (geminiInterpretation && geminiInterpretation.notes && geminiInterpretation.notes.length) {
    console.log('Gemini notes:', geminiInterpretation.notes);
  }

  const filterSummaryMessage = buildFilterSummaryMessage(filters);

  const pendingGeocodeJobs = Array.isArray(filters.pendingGeocodes)
    ? filters.pendingGeocodes.filter(job => job && job.promise && typeof job.promise.then === 'function')
    : [];
  const pendingGeocodePromises = pendingGeocodeJobs.map(job => job.promise);
  const pendingPlaceNames = Array.isArray(filters.pendingPlaceNames)
    ? Array.from(new Set(filters.pendingPlaceNames.filter(name => typeof name === 'string' && name.trim().length)))
    : [];

  if (intentRequiresInsights(intent) && !insightsReady) {
    if (filterSummaryMessage) {
      appendChatMessage('assistant', filterSummaryMessage);
    }
    pendingChatQueue.push({ intent, filters });
    if (!chatbotState.waitingForData) {
      appendChatMessage('assistant', 'Housing layers are still loading; I will reply with details shortly.');
      chatbotState.waitingForData = true;
    }
    return;
  }

  if (filterSummaryMessage) {
    appendChatMessage('assistant', filterSummaryMessage);
  }

  chatbotState.waitingForData = false;
  respondForIntent(intent, filters);

  if (pendingGeocodePromises.length) {
    const followupToken = {
      message,
      intent,
      initialTargetNames: Array.isArray(filters.proximityTargets)
        ? filters.proximityTargets.map(place => place && place.name).filter(Boolean)
        : [],
      pendingNames: pendingPlaceNames,
      pendingJobs: pendingGeocodeJobs,
      baseFilters: filters
    };
    chatbotState.pendingGeocodeFollowups.push(followupToken);

    Promise.allSettled(pendingGeocodePromises).then(results => {
      chatbotState.pendingGeocodeFollowups = chatbotState.pendingGeocodeFollowups.filter(token => token !== followupToken);

      const successfulPlaces = results
        .filter(item => item.status === 'fulfilled' && item.value && item.value.name)
        .map(item => item.value.name);

      if (followupToken.pendingJobs && Array.isArray(followupToken.pendingJobs)) {
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value && typeof result.value === 'object') {
            const job = followupToken.pendingJobs[index];
            if (job && typeof job.radiusKm === 'number' && result.value && result.value.radiusKm == null) {
              result.value.radiusKm = job.radiusKm;
            }
          }
        });
      }

      const refreshedFilters = extractFiltersFromMessage(message);
      const newTargets = Array.isArray(refreshedFilters.proximityTargets) ? refreshedFilters.proximityTargets : [];
      const initialSet = new Set(followupToken.initialTargetNames);
      const addedTargets = newTargets.filter(target => target && !initialSet.has(target.name));
      const addedNames = addedTargets.map(target => target.name).filter(Boolean);
      const uniqueNewNames = Array.from(new Set([...successfulPlaces, ...addedNames]));
      const shouldRefresh = intentRequiresInsights(intent);

      if (!uniqueNewNames.length) {
        if (followupToken.pendingNames.length) {
          const pendingList = [...followupToken.pendingNames];
          const last = pendingList.pop();
          const nameText = pendingList.length ? `${pendingList.join(', ')}, and ${last}` : last;
          appendChatMessage('assistant', `I could not locate ${nameText} via OpenStreetMap. Try refining the place name or adding a canton.`);
        }
        return;
      }

      const nameList = [...uniqueNewNames];
      const lastName = nameList.pop();
      const nameText = nameList.length ? `${nameList.join(', ')}, and ${lastName}` : lastName;
      if (shouldRefresh) {
        appendChatMessage('assistant', `I located ${nameText} via OpenStreetMap. Updating the plan with that context.`);
        respondForIntent(intent, refreshedFilters);
      } else {
        appendChatMessage('assistant', `I located ${nameText} via OpenStreetMap. I will keep it in mind for your next housing request.`);
      }
    });
  }
}

function processPendingChatQueue() {
  if (!insightsReady || !pendingChatQueue.length) return;
  const queue = [...pendingChatQueue];
  pendingChatQueue = [];
  chatbotState.waitingForData = false;
  queue.forEach(item => {
    respondForIntent(item.intent, item.filters);
  });
}

function focusOnSuggestion(button) {
  const lat = parseFloat(button.dataset.lat);
  const lon = parseFloat(button.dataset.lon);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return;

  const zoom = Math.max(map.getZoom(), 12);
  map.flyTo([lat, lon], zoom, { duration: 0.8 });

  const address = button.dataset.address ? escapeHtml(button.dataset.address) : 'Suggested location';
  const price = button.dataset.price ? formatCurrency(parseFloat(button.dataset.price)) : null;
  const rooms = button.dataset.rooms ? parseFloat(button.dataset.rooms) : null;
  const score = button.dataset.score ? Number(button.dataset.score) : null;
  const url = button.dataset.url ? escapeHtml(button.dataset.url) : null;

  const parts = [`<strong>${address}</strong>`];
  const meta = [];
  if (price) meta.push(`Rent: ${escapeHtml(price)}`);
  if (!Number.isNaN(rooms) && rooms) meta.push(`${escapeHtml(rooms)} room${rooms === 1 ? '' : 's'}`);
  if (!Number.isNaN(score) && score !== null) meta.push(`Score: ${escapeHtml(formatPercent(score))}`);
  if (meta.length) {
    parts.push(`<div>${meta.join(' • ')}</div>`);
  }
  if (url) {
    parts.push(`<div style="margin-top:6px;"><a href="${url}" target="_blank" rel="noopener">Open listing</a></div>`);
  }

  L.popup()
    .setLatLng([lat, lon])
    .setContent(`<div style="font-family: 'Inter', 'Segoe UI', sans-serif; font-size: 13px;">${parts.join('')}</div>`)
    .openOn(map);
}

function setupChatbot() {
  const toggle = document.getElementById('chatbot-toggle');
  const panel = document.getElementById('chatbot-panel');
  const closeBtn = document.getElementById('chatbot-close');
  const form = document.getElementById('chatbot-form');
  const input = document.getElementById('chatbot-input');
  const messages = document.getElementById('chatbot-messages');

  if (!toggle || !panel || !form || !input || !messages) {
    return;
  }

  chatElements = { toggle, panel, closeBtn, form, input, messages };

  const openPanel = () => {
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    setTimeout(() => input.focus(), 120);
    if (!chatHasGreeted) {
      appendChatMessage('assistant', 'Hi! I\'m your Swiss housing guide. Ask for stats or say "suggest good spots in Zurich under 2000 CHF".');
      chatHasGreeted = true;
    }
  };

  const closePanel = () => {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    if (panel.hidden) openPanel(); else closePanel();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closePanel);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value;
    input.value = '';
    handleChatInput(value).catch(error => {
      console.error('Chat handling failed:', error);
      appendChatMessage('assistant', 'I ran into a processing error. Please try again in a moment.');
    });
  });

  messages.addEventListener('click', (event) => {
    const button = event.target.closest('.chat-suggestion-btn');
    if (button) {
      focusOnSuggestion(button);
    }
  });
}

function buildStatsFromBucket(bucket) {
  if (!bucket || !bucket.count) return null;
  const avgPricePerRoom = bucket.sumPricePerRoom / bucket.count;
  const medianPrice = median(bucket.prices);
  const minPricePerRoom = bucket.minPricePerRoom !== Infinity ? bucket.minPricePerRoom : null;
  const maxPricePerRoom = bucket.maxPricePerRoom !== -Infinity ? bucket.maxPricePerRoom : null;
  const minRent = bucket.minRent !== Infinity ? bucket.minRent : null;
  const maxRent = bucket.maxRent !== -Infinity ? bucket.maxRent : null;
  const topQuality = bucket.apartments
    .filter(ap => ap.score != null)
    .slice()
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 5);
  const topAffordable = bucket.apartments
    .slice()
    .sort((a, b) => (a.pricePerRoom ?? Infinity) - (b.pricePerRoom ?? Infinity))
    .slice(0, 5);

  return {
    name: bucket.name,
    num: bucket.num,
    count: bucket.count,
    avgPricePerRoom,
    medianPricePerRoom: medianPrice,
    minPricePerRoom,
    maxPricePerRoom,
    minRent,
    maxRent,
    avgScore: bucket.scoreCount ? bucket.scoreSum / bucket.scoreCount : null,
    topQuality,
    topAffordable
  };
}

function finalizeApartmentInsights(entries, buckets, countryBucket) {
  apartmentInsights = entries;
  const stats = {};
  buckets.forEach(bucket => {
    if (bucket.num == null) return;
    const summary = buildStatsFromBucket(bucket);
    if (summary) {
      stats[bucket.num] = summary;
    }
  });

  cantonStats = stats;
  countryStats = buildStatsFromBucket(countryBucket);
  insightsReady = true;
  insightsBuilding = false;
  chatbotState.waitingForData = false;
  processPendingChatQueue();
}

function buildApartmentInsights() {
  if (!apartmentData || !apartmentData.length) {
    insightsReady = false;
    return;
  }

  const entries = [];
  const buckets = new Map();
  const allBucket = {
    name: 'Switzerland',
    num: null,
    count: 0,
    sumPricePerRoom: 0,
    prices: [],
    minPricePerRoom: Infinity,
    maxPricePerRoom: -Infinity,
    minRent: Infinity,
    maxRent: -Infinity,
    apartments: [],
    scoreSum: 0,
    scoreCount: 0
  };

  let index = 0;
  const total = apartmentData.length;
  const hexRadius = hex.radius();

  const processChunk = () => {
    const batchSize = 25;
    let processed = 0;

    while (index < total && processed < batchSize) {
      const apt = apartmentData[index];
      index += 1;
      processed += 1;
      if (!apt) continue;

      const pricePerRoom = (apt.price && apt.rooms) ? apt.price / apt.rooms : null;
      let compositeScore = null;
      let scoreDetails = null;
      try {
        const computedScores = calculateCompositeScore(apt.lat, apt.lon, hexRadius, `apt-${index}`, null);
        if (computedScores && typeof computedScores.composite === 'number' && !Number.isNaN(computedScores.composite)) {
          compositeScore = computedScores.composite;
        }
        if (computedScores) {
          scoreDetails = computedScores;
        }
      } catch (error) {
        console.warn('Unable to compute composite score for apartment', apt, error);
      }

      const cantonMatch = resolveCantonFromText(apt.canton) || null;
      const cantonNum = cantonMatch ? cantonMatch.num : null;
      const cantonName = cantonMatch ? cantonMatch.name : (apt.canton || 'Switzerland');

      const entry = {
        lat: apt.lat,
        lon: apt.lon,
        price: apt.price,
        rooms: apt.rooms,
        pricePerRoom,
        score: compositeScore,
        cantonNum,
        cantonName,
        address: apt.address || '',
        url: apt.url || '',
        source: apt,
        scoreDetails
      };

      entries.push(entry);

      const bucketKey = cantonNum != null ? cantonNum : cantonName;
      let bucket = buckets.get(bucketKey);
      if (!bucket) {
        bucket = {
          name: cantonName,
          num: cantonNum,
          count: 0,
          sumPricePerRoom: 0,
          prices: [],
          minPricePerRoom: Infinity,
          maxPricePerRoom: -Infinity,
          minRent: Infinity,
          maxRent: -Infinity,
          apartments: [],
          scoreSum: 0,
          scoreCount: 0
        };
        buckets.set(bucketKey, bucket);
      }

      bucket.count += 1;
      allBucket.count += 1;

      if (pricePerRoom != null && !Number.isNaN(pricePerRoom)) {
        bucket.sumPricePerRoom += pricePerRoom;
        bucket.prices.push(pricePerRoom);
        bucket.minPricePerRoom = Math.min(bucket.minPricePerRoom, pricePerRoom);
        bucket.maxPricePerRoom = Math.max(bucket.maxPricePerRoom, pricePerRoom);

        allBucket.sumPricePerRoom += pricePerRoom;
        allBucket.prices.push(pricePerRoom);
        allBucket.minPricePerRoom = Math.min(allBucket.minPricePerRoom, pricePerRoom);
        allBucket.maxPricePerRoom = Math.max(allBucket.maxPricePerRoom, pricePerRoom);
      }

      if (apt.price != null && !Number.isNaN(apt.price)) {
        bucket.minRent = Math.min(bucket.minRent, apt.price);
        bucket.maxRent = Math.max(bucket.maxRent, apt.price);

        allBucket.minRent = Math.min(allBucket.minRent, apt.price);
        allBucket.maxRent = Math.max(allBucket.maxRent, apt.price);
      }

      if (compositeScore != null) {
        bucket.scoreSum += compositeScore;
        bucket.scoreCount += 1;

        allBucket.scoreSum += compositeScore;
        allBucket.scoreCount += 1;
      }

      bucket.apartments.push(entry);
      allBucket.apartments.push(entry);
    }

    if (index < total) {
      scheduleIdleWork(processChunk);
    } else {
      finalizeApartmentInsights(entries, buckets, allBucket);
    }
  };

  scheduleIdleWork(processChunk);
}

function maybeBuildApartmentInsights() {
  if (insightsReady || insightsBuilding) return;
  if (!rastersReady) return;
  if (!apartmentData || !apartmentData.length) {
    insightsReady = true;
    processPendingChatQueue();
    return;
  }
  insightsBuilding = true;
  buildApartmentInsights();
}

initCompareControls();
setupChatbot();

async function initializeData() {
  const baseDataPromise = Promise.all([
    d3.json("./kanton1.geojson"),
    d3.json("./hexdata_res1.0.json"),
    d3.json("./schools.geojson"),
    d3.json("./supermarket.geojson"),
    d3.json("./retaurants.geojson"),
    d3.json("./acessroad.geojson")
  ]);

  const rasterPromises = [
    loadGeoTIFF('railnight.tif', 'railNight'),
    loadGeoTIFF('railday_lowres.tif', 'railDay'),
    loadGeoTIFF('air_wgs84.tif', 'airNoise'),
    loadGeoTIFF('vegetation_wgs84_lowres50.tif', 'vegetation'),
    loadGeoTIFF('roadday_lowres.tif', 'roadDay'),
    loadGeoTIFF('roadnacht_lowres.tif', 'roadNight')
  ];

  const apartmentsPromise = d3.dsv(';', "./apartmentslink.csv").catch(err => {
    console.error("⚠️ Could not load apartment data:", err);
    return [];
  });

  let geoData, precompData, schoolsData, supermarket, restaurants, access;
  try {
    [geoData, precompData, schoolsData, supermarket, restaurants, access] = await baseDataPromise;
  } catch (error) {
    console.error("Error loading data:", error);
    return;
  }

  swissData = geoData;
  hexRadiusDeg = precompData.resolution;

  function extractCoords(feature) {
    if (!feature || !feature.geometry) return null;
    let coords;
    const geom = feature.geometry;
    if (geom.type === "Point") coords = geom.coordinates;
    else if (geom.type === "Polygon") coords = geom.coordinates[0][0];
    else if (geom.type === "MultiPolygon") coords = geom.coordinates[0][0][0];
    else if (geom.type === "LineString") coords = geom.coordinates[0];
    return coords ? { lon: coords[0], lat: coords[1] } : null;
  }

  accessRoads = access.features.map(extractCoords).filter(Boolean);
  console.log(`✅ Loaded ${accessRoads.length} access roads`);

  supermarketLocations = supermarket.features.map(extractCoords).filter(Boolean);
  console.log(`✅ Loaded ${supermarketLocations.length} supermarkets`);

  restoLocations = restaurants.features.map(extractCoords).filter(Boolean);
  console.log(`✅ Loaded ${restoLocations.length} restaurants`);

  schoolLocations = schoolsData.features.map(extractCoords).filter(Boolean);
  console.log(`✅ Loaded ${schoolLocations.length} schools`);

  Object.keys(precompData.data).forEach(cantonNum => {
    const savedData = precompData.data[cantonNum];
    const feature = swissData.features.find(
      f => f.properties.KANTONSNUM === parseInt(cantonNum)
    );

    if (feature) {
      precomputedData[cantonNum] = {
        hexCenters: savedData.hexCenters,
        bounds: savedData.bounds,
        feature: feature
      };
    }
  });

  console.log("✅ Base data loaded. Raster tiles and apartments now loading in parallel...");

  Promise.allSettled(rasterPromises).then(results => {
    const failedCount = results.filter(result => {
      if (result.status !== 'fulfilled') return true;
      return !result.value;
    }).length;

    if (failedCount === 0) {
      console.log("✅ All raster data loaded!");
    } else {
      console.warn(`⚠️ ${failedCount} raster dataset(s) failed to load.`);
    }

    rastersReady = true;
    maybeBuildApartmentInsights();

    setTimeout(() => {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        if (failedCount === 0) {
          console.log("✅ Loading screen hidden");
        }
      }
    }, 500);

    projectHexes();
  });

  apartmentsPromise.then(apartmentsCSV => {
    if (!Array.isArray(apartmentsCSV) || apartmentsCSV.length === 0) {
      console.warn("⚠️ Apartment dataset is empty.");
      return;
    }

    apartmentData = apartmentsCSV.map(row => {
      const lat = parseFloat(row.lat);
      const lon = parseFloat(row.lon);
      const price = parseFloat(row.price);
      const rooms = parseFloat(row.rooms);

      if (isNaN(lat) || isNaN(lon) || isNaN(price) || isNaN(rooms) || rooms === 0) {
        return null;
      }

      return {
        lat,
        lon,
        price,
        rooms,
        address: row.address,
        canton: row.canton,
        url: row.url
      };
    }).filter(Boolean);

    const uniqueApartments = new Set(apartmentData.map(apt => `${apt.lat},${apt.lon},${apt.price},${apt.rooms}`));
    const hasDuplicatesInData = uniqueApartments.size !== apartmentData.length;

    console.log(`✅ Loaded ${apartmentData.length} apartments from CSV ${hasDuplicatesInData ? '⚠️ (contains duplicates!)' : '(all unique)'}`);
    if (apartmentData.length > 0) {
      console.log(`   Sample apartment:`, apartmentData[0]);
    }

    maybeBuildApartmentInsights();

    scoreCache.clear();
    projectHexes();
  });

  createWeightSliders();

  schoolMarkers.addTo(map);
  apartmentMarkers.addTo(map);
  restaurantMarkers.addTo(map);
  supermarketMarkers.addTo(map);

  document.querySelectorAll('.facility-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', drawFacilityMarkers);
  });

  const cantonListEl = document.getElementById('cantons-list');
  if (cantonListEl) {
    cantonListEl.addEventListener('change', (e) => {
      if (e.target && e.target.type === 'checkbox') {
        selectedKantonNum = Array.from(
          document.querySelectorAll('#cantons-list input[type="checkbox"]:checked')
        ).map(cb => parseInt(cb.value));

        updateDisplay();
      }
    });
  }
}

initializeData().catch(error => {
  console.error("Unexpected initialization error:", error);
});