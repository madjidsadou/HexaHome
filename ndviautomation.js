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
    toggle.innerHTML = "Choose Canton(s) &#9650;";
  } else {
    cantonList.style.display = "none";
    toggle.innerHTML = "Choose Canton(s) &#9660;";
  }
});

const toggleOpacity = document.getElementById("toggle-opacity");
const opacityContainer = document.getElementById("opacity-container");

toggleOpacity.addEventListener("click", () => {
  if (opacityContainer.style.display === "none" || opacityContainer.style.display === "") {
    opacityContainer.style.display = "block";
    toggleOpacity.innerHTML = "Hexagon Opacity &#9650;";
  } else {
    opacityContainer.style.display = "none";
    toggleOpacity.innerHTML = "Hexagon Opacity &#9660;";
  }
});

// Setup opacity slider immediately
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
    toggleFacilities.innerHTML = "Show Facilities &#9650;";
  } else {
    facilitiesList.style.display = "none";
    toggleFacilities.innerHTML = "Show Facilities &#9660;";
  }
});

const toggleind = document.getElementById("index");
const listind = document.getElementById("sliders-container");

toggleind.addEventListener("click", () => {
  if (listind.style.display === "none" || listind.style.display === "") {
    listind.style.display = "block";
    toggleind.innerHTML = "Adjust indexes &#9650;";
  } else {
    listind.style.display = "none";
    toggleind.innerHTML = "Adjust indexes &#9660;";
  }
});

// Base layer
L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// SVG overlay for D3
L.svg().addTo(map);
const svg = d3.select(map.getPanes().overlayPane).select("svg");
const g = svg.append("g").attr("class", "leaflet-zoom-hide");

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
    .data(allBins, d => `${d.cantonNum}-${d.x}-${d.y}`);

  hexPaths.exit().remove();

  const enteredPaths = hexPaths.enter()
    .append("path")
    .attr("class", "hex")
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 0.5)
    .attr("fill-opacity", hexOpacity)
    .style("pointer-events", "auto")
    .attr("cursor", "pointer");

  enteredPaths
    .on("mouseover", function(event) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("stroke-width", 2.5)
        .attr("stroke", "#ffffff");
    })
    .on("mouseout", function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("stroke-width", 0.5);
      map.closePopup();
    })
    .on("click", function(event, d) {
      event.stopPropagation();
      const containerPoint = map.mouseEventToContainerPoint(event);
      const latlng = map.containerPointToLatLng(containerPoint);

      if (d.lat && d.lon) {
        const hexRadiusPixels = hex.radius();
        const hexId = `${d.cantonNum}-${d.x.toFixed(1)}-${d.y.toFixed(1)}`;
        const hexagonPolygon = createHexagonPolygon(d.x, d.y, hexRadiusPixels);
        const freshScores = calculateCompositeScore(d.lat, d.lon, hexRadiusPixels, hexId, hexagonPolygon);

        if (freshScores) {
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
              content += `
              <div style="padding: 4px 0; border-top: 1px solid rgba(255,255,255,0.2);">
                ${idx + 1}. ${apt.rooms} rooms - ${apt.price} CHF (${apt.pricePerRoom.toFixed(0)} CHF/room)
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
        }
      }
    });

  enteredPaths
    .attr("fill", computeFill)
    .attr("fill-opacity", hexOpacity)
    .attr("d", hex.hexagon())
    .attr("transform", d => `translate(${d.x},${d.y})`);

  hexPaths
    .attr("fill", computeFill)
    .attr("fill-opacity", hexOpacity)
    .attr("d", hex.hexagon())
    .attr("transform", d => `translate(${d.x},${d.y})`);
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