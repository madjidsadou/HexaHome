var map = L.map('map', {
  center: [46.8, 8.3],
  zoom: 8,
  minZoom: 8,
  maxZoom: 15,
  maxBounds: [
    [45.7, 4.9],
    [47.9, 11.7]
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

// Calculate average apartment cost per room in hexagon
function getApartmentCostInHex(lat, lon, hexRadiusKm = 0.5) {
  if (!apartmentData || apartmentData.length === 0) return null;
  
  // Adapt hexagon radius based on zoom level
  const currentZoom = map.getZoom();
  // Scale radius with zoom: smaller radius at higher zoom levels
  const zoomFactor = Math.pow(0.8, currentZoom - 8); // Reduces radius as zoom increases
  const adjustedRadiusKm = hexRadiusKm * Math.max(0.5, Math.min(2, zoomFactor));
  
  // Hexagon radius in meters (approximate)
  const hexRadiusMeters = adjustedRadiusKm * 1000;
  const hexCenter = L.latLng(lat, lon);
  
  // Quick geographic filter first (much faster than distance calculation)
  const latDelta = adjustedRadiusKm / 111; // Approximate degrees
  const lonDelta = adjustedRadiusKm / (111 * Math.cos(lat * Math.PI / 180));
  
  let totalPricePerRoom = 0;
  let count = 0;
  const apartments = [];
  
  for (let i = 0; i < apartmentData.length; i++) {
    const apt = apartmentData[i];
    
    // Quick bounding box check first
    if (Math.abs(apt.lat - lat) > latDelta || Math.abs(apt.lon - lon) > lonDelta) {
      continue;
    }
    
    const aptLatLng = L.latLng(apt.lat, apt.lon);
    const dist = map.distance(hexCenter, aptLatLng);
    
    // Check if apartment is within the hexagon (approximate as circle)
    if (dist <= hexRadiusMeters) {
      const pricePerRoom = apt.price / apt.rooms;
      totalPricePerRoom += pricePerRoom;
      count++;
      apartments.push({
        pricePerRoom: pricePerRoom,
        price: apt.price,
        rooms: apt.rooms,
        address: apt.address
      });
    }
  }
  
  if (count === 0) return null;
  
  return {
    avgPricePerRoom: totalPricePerRoom / count,
    count: count,
    apartments: apartments,
    searchRadius: adjustedRadiusKm
  };
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
function calculateCompositeScore(lat, lon, hexRadiusKm = 0.5) {
  // Create cache key
  const cacheKey = `${lat.toFixed(5)},${lon.toFixed(5)},${hexRadiusKm.toFixed(4)}`;
  
  // Check cache first
  if (scoreCache.has(cacheKey)) {
    return scoreCache.get(cacheKey);
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

  // Apartment cost - pass hexagon radius
  const apartmentCostData = getApartmentCostInHex(lat, lon, hexRadiusKm);
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
  
  // Cache the result
  scoreCache.set(cacheKey, result);
  
  // Limit cache size to prevent memory issues
  if (scoreCache.size > 10000) {
    const firstKey = scoreCache.keys().next().value;
    scoreCache.delete(firstKey);
  }
  
  return result;
}

// Get color based on composite score (0-1)
function getColorByScore(score) {
  if (score > 0.8) return "#00ff00";  // Excellent
  if (score > 0.7) return "#7fff00";  // Very good
  if (score > 0.6) return "#bfff00";  // Good
  if (score > 0.5) return "#ffff00";  // Above average
  if (score > 0.4) return "#ffbf00";  // Average
  if (score > 0.3) return "#ff8000";  // Below average
  if (score > 0.2) return "#ff4000";  // Poor
  return "#ff0000";                    // Very poor
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

// Project and draw hexagons with composite scoring
function projectHexes() {
  if (selectedKantonNum.length === 0) return;

  const allBins = [];
  
  // Calculate hexagon radius in km from the D3 hexbin radius (in pixels)
  const bounds = map.getBounds();
  const center = map.getCenter();
  const point1 = map.latLngToLayerPoint(center);
  const point2 = L.point(point1.x + hex.radius(), point1.y);
  const latLng2 = map.layerPointToLatLng(point2);
  const hexRadiusKm = map.distance(center, latLng2) / 1000;
  
  // Get current viewport bounds for filtering
  const viewBounds = map.getBounds();
  const bufferedBounds = viewBounds.pad(0.2); // 20% buffer
  
  selectedKantonNum.forEach(cantonNum => {
    const cantonData = precomputedData[cantonNum];
    if (!cantonData) return;

    // Filter hex centers to only those in viewport
    const projected = cantonData.hexCenters
      .filter(([lon, lat]) => bufferedBounds.contains([lat, lon]))
      .map(([lon, lat]) => {
        const pt = map.latLngToLayerPoint([lat, lon]);
        return [pt.x, pt.y, lon, lat];
      });

    const bins = hex(projected);
    bins.forEach((bin, idx) => {
      bin.cantonNum = cantonNum;
      if (projected[idx]) {
        bin.lon = projected[idx][2];
        bin.lat = projected[idx][3];
        
        // Calculate composite score with actual hexagon radius
        bin.scores = calculateCompositeScore(bin.lat, bin.lon, hexRadiusKm);
      } else {
        bin.lon = null;
        bin.lat = null;
        bin.scores = null;
      }
    });
    allBins.push(...bins);
  });

  const hexPaths = g.selectAll("path.hex")
    .data(allBins, d => `${d.cantonNum}-${d.x}-${d.y}`);

  hexPaths.exit().remove();

  hexPaths.enter()
    .append("path")
    .attr("class", "hex")
    .attr("stroke", "#000")
    .attr("stroke-width", 0)
    .attr("fill-opacity", 0.7)
    .style("pointer-events", "auto")
    .attr("cursor", "pointer")
    .on("mouseover", function(event, d) {
      d3.select(this)
        .attr("fill-opacity", 1)
        .attr("stroke-width", 1.5);
    })
    .on("mouseout", function(event, d) {
      d3.select(this)
        .attr("fill-opacity", 0.7)
        .attr("stroke-width", 0.1);
      map.closePopup();
    })
    .on("click", function(event, d) {
      event.stopPropagation();
      const containerPoint = map.mouseEventToContainerPoint(event);
      const latlng = map.containerPointToLatLng(containerPoint);

      if (d.scores) {
        let content = `
          <b>Composite Score:</b> ${(d.scores.composite * 100).toFixed(1)}%<br>
          <hr>
          <b>Facility Access:</b><br>
          Schools: ${(d.scores.schools * 100).toFixed(1)}% (${d.scores.distances.schools ? (d.scores.distances.schools/1000).toFixed(2) + ' km' : 'N/A'})<br>
          Supermarkets: ${(d.scores.supermarkets * 100).toFixed(1)}% (${d.scores.distances.supermarkets ? (d.scores.distances.supermarkets/1000).toFixed(2) + ' km' : 'N/A'})<br>
          Restaurants: ${(d.scores.restaurants * 100).toFixed(1)}% (${d.scores.distances.restaurants ? (d.scores.distances.restaurants/1000).toFixed(2) + ' km' : 'N/A'})<br>
          Access Roads: ${(d.scores.accessRoads * 100).toFixed(1)}% (${d.scores.distances.accessRoads ? (d.scores.distances.accessRoads/1000).toFixed(2) + ' km' : 'N/A'})<br>
          <hr>
          <b>Environmental Quality:</b><br>
          Rail Noise (Night): ${(d.scores.railNight * 100).toFixed(1)}% (${d.scores.rasterValues.railNight !== null ? d.scores.rasterValues.railNight.toFixed(1) + ' dB' : 'N/A'})<br>
          Rail Noise (Day): ${(d.scores.railDay * 100).toFixed(1)}% (${d.scores.rasterValues.railDay !== null ? d.scores.rasterValues.railDay.toFixed(1) + ' dB' : 'N/A'})<br>
          Air Quality: ${(d.scores.airNoise * 100).toFixed(1)}% (${d.scores.rasterValues.airNoise !== null ? d.scores.rasterValues.airNoise.toFixed(1) : 'N/A'})<br>
          Road Noise (Day): ${(d.scores.roadDay * 100).toFixed(1)}% (${d.scores.rasterValues.roadDay !== null ? d.scores.rasterValues.roadDay.toFixed(1) + ' dB' : 'N/A'})<br>
          Road Noise (Night): ${(d.scores.roadNight * 100).toFixed(1)}% (${d.scores.rasterValues.roadNight !== null ? d.scores.rasterValues.roadNight.toFixed(1) + ' dB' : 'N/A'})<br>
          Vegetation: ${(d.scores.vegetation * 100).toFixed(1)}% (${d.scores.rasterValues.vegetation !== null ? d.scores.rasterValues.vegetation.toFixed(2) : 'N/A'})<br>
        `;
        
        if (d.scores.apartmentData) {
          content += `<hr>
          <b>Housing Cost:</b><br>
          Avg. Cost per Room: ${d.scores.apartmentData.avgPricePerRoom.toFixed(0)} CHF/month<br>
          Apartments in hexagon: ${d.scores.apartmentData.count}<br>
          Search radius: ${d.scores.apartmentData.searchRadius.toFixed(2)} km<br>
          Affordability Score: ${(d.scores.apartmentCost * 100).toFixed(1)}%`;
        } else {
          content += `<hr>
          <b>Housing Cost:</b><br>
          No apartments in this hexagon`;
        }
        
        L.popup()
          .setLatLng(latlng)
          .setContent(content)
          .openOn(map);
      }
    })
    .merge(hexPaths)
    .attr("fill", d => {
      if (!d.scores) return "#69b3a2";
      return getColorByScore(d.scores.composite);
    })
    .attr("d", hex.hexagon())
    .attr("transform", d => `translate(${d.x},${d.y})`);
}

// Update boundary positions
function updateBoundaries() {
  g.selectAll("path.boundary").attr("d", path);
}

// Update visible elements
function updateDisplay() {
  map.off("zoom viewreset move");
  map.off("zoomend");

  g.selectAll("path.boundary").remove();
  g.selectAll("path.hex").remove();

  if (selectedKantonNum.length === 0) return;

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

  map.on("zoom viewreset move", updateBoundaries);
  
  const debouncedProjectHexes = debounce(() => {
    scoreCache.clear(); // Clear cache when zoom changes to recalculate apartment data
    projectHexes();
  }, 100);
  map.on("zoomend", debouncedProjectHexes);
  
  // Also update hexagons on moveend (after panning) with longer debounce
  const debouncedProjectHexesMove = debounce(projectHexes, 300);
  map.on("moveend", debouncedProjectHexesMove);

  projectHexes();

  const allBounds = selectedKantonNum
    .map(num => precomputedData[num]?.bounds)
    .filter(b => b);
    
  if (allBounds.length > 0) {
    const minLon = Math.min(...allBounds.map(b => b[0][0]));
    const minLat = Math.min(...allBounds.map(b => b[0][1]));
    const maxLon = Math.max(...allBounds.map(b => b[1][0]));
    const maxLat = Math.max(...allBounds.map(b => b[1][1]));

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
    slider.style.marginBottom = '10px';
    slider.innerHTML = `
      <label style="display: block; margin-bottom: 3px;">
        ${index.label}: <span id="${index.key}-value" style="font-weight: bold;">${weights[index.key].toFixed(2)}</span>
      </label>
      <input type="range" id="${index.key}-slider" min="0" max="1" step="0.01" value="${weights[index.key]}" style="width: 100%;">
    `;
    container.appendChild(slider);

    const debouncedUpdate = debounce(() => {
      scoreCache.clear(); // Clear cache when weights change
      projectHexes(); // Redraw with new weights
    }, 200);
    
    document.getElementById(`${index.key}-slider`).addEventListener('input', (e) => {
      weights[index.key] = parseFloat(e.target.value);
      document.getElementById(`${index.key}-value`).textContent = weights[index.key].toFixed(2);
      debouncedUpdate();
    });
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

// Load all data - First load the base data, then load rasters and apartments separately
Promise.all([
  d3.json("./kanton1.geojson"),
  d3.json("./hexdata_res1.0.json"),
  d3.json("./schools.geojson"),
  d3.json("./supermarket.geojson"),
  d3.json("./retaurants.geojson"),
  d3.json("./acessroad.geojson")
]).then(function ([geoData, precompData, schoolsData, supermarket, restaurants, access]) {
  swissData = geoData;
  hexRadiusDeg = precompData.resolution;

  // Helper function to extract coordinates from various geometry types
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

  // Load access roads
  accessRoads = access.features.map(extractCoords).filter(Boolean);
  console.log(`✅ Loaded ${accessRoads.length} access roads`);

  // Load supermarkets
  supermarketLocations = supermarket.features.map(extractCoords).filter(Boolean);
  console.log(`✅ Loaded ${supermarketLocations.length} supermarkets`);

  // Load restaurants
  restoLocations = restaurants.features.map(extractCoords).filter(Boolean);
  console.log(`✅ Loaded ${restoLocations.length} restaurants`);

  // Load schools
  schoolLocations = schoolsData.features.map(extractCoords).filter(Boolean);
  console.log(`✅ Loaded ${schoolLocations.length} schools`);

  // Reconstruct precomputed data
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
  
  console.log("✅ Base data loaded. Loading raster data and apartments...");

  // Load raster data asynchronously
  Promise.all([
    loadGeoTIFF('railnight.tif', 'railNight'),
    loadGeoTIFF('railday_lowres.tif', 'railDay'),
    loadGeoTIFF('air_wgs84.tif', 'airNoise'),
    loadGeoTIFF('vegetation_wgs84_lowres50.tif', 'vegetation'),
    loadGeoTIFF('roadday_lowres.tif', 'roadDay'),
    loadGeoTIFF('roadnacht_lowres.tif', 'roadNight')
  ]).then(() => {
    console.log("✅ All raster data loaded!");
    projectHexes(); // Redraw with raster data
  }).catch(err => {
    console.error("⚠️ Some raster files failed to load:", err);
  });

  // Load apartment data asynchronously
  d3.dsv(';', "./apartmentslink.csv").then(apartmentsCSV => {
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
    console.log(`✅ Loaded ${apartmentData.length} apartments`);
    
    // Draw apartment markers on the map
    // drawApartmentMarkers();
    
    projectHexes(); // Redraw with apartment data
  }).catch(err => {
    console.error("⚠️ Could not load apartment data:", err);
  });

  // Create weight adjustment sliders
  createWeightSliders();

  // Canton selection listener
  document.getElementById('cantons-list').addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
      selectedKantonNum = Array.from(
        document.querySelectorAll('#cantons-list input[type="checkbox"]:checked')
      ).map(cb => parseInt(cb.value));
      
      updateDisplay();
    }
  });
}).catch(error => {
  console.error("Error loading data:", error);
});