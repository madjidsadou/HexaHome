var map = L.map('map', {
  center: [46.8, 8.3],
  zoom: 8,
  minZoom: 8,
  maxZoom: 16,
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
let schoolLocations = []; // Store school locations globally

// D3 projection (create once, reuse)
const projection = d3.geoTransform({
  point: function (x, y) {
    const point = map.latLngToLayerPoint([y, x]);
    this.stream.point(point.x, point.y);
  }
});
const path = d3.geoPath().projection(projection);
const hex = d3.hexbin().radius(30);

// // Calculate distance between two lat/lon points (in meters)
// function calculateDistance(lat1, lon1, lat2, lon2) {
//   const R = 6371e3; // Earth's radius in meters
//   const φ1 = lat1 * Math.PI / 180;
//   const φ2 = lat2 * Math.PI / 180;
//   const Δφ = (lat2 - lat1) * Math.PI / 180;
//   const Δλ = (lon2 - lon1) * Math.PI / 180;

//   const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//             Math.cos(φ1) * Math.cos(φ2) *
//             Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//   return R * c; // Distance in meters
// }

// Get color based on distance to nearest school
function getColorByDistance(distance) {
  if (distance < 500) return "#00ff00";      // Bright green - very close
  if (distance < 1000) return "#7fff00";     // Yellow-green
  if (distance < 1500) return "#ffff00";     // Yellow
  if (distance < 2000) return "#ffd700";     // Gold
  if (distance < 2500) return "#ffa500";     // Orange
  if (distance < 3000) return "#ff6347";     // Tomato
  if (distance < 4000) return "#ff4500";     // Orange-red
  return "#ff0000";                          // Red - far away
}

// Calculate minimum distance to any school
function getMinDistanceToSchool(lat, lon) {
  // Ensure we have schools loaded
  if (!schoolLocations || schoolLocations.length === 0) return null;

  // Convert hexagon center to a Leaflet LatLng object
  const hexCenter = L.latLng(lat, lon);

  let minDistance = Infinity;

  for (const school of schoolLocations) {
    if (!school || school.lat == null || school.lon == null) continue;

    // Compute geodesic distance (in meters) using Leaflet’s haversine formula
    const schoolLatLng = L.latLng(school.lat, school.lon);
    const dist = map.distance(hexCenter, schoolLatLng);

    if (dist < minDistance) minDistance = dist;
  }

  return minDistance === Infinity ? null : minDistance;
}

// Debounce function for performance
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

// Project and draw hexagons for selected cantons with school distance coloring
function projectHexes() {
  if (selectedKantonNum.length === 0) return;

  const allBins = [];
  
  selectedKantonNum.forEach(cantonNum => {
    const cantonData = precomputedData[cantonNum];
    if (!cantonData) return;

    const projected = cantonData.hexCenters.map(([lon, lat]) => {
      const pt = map.latLngToLayerPoint([lat, lon]);
      return [pt.x, pt.y, lon, lat]; // Include original coords
    });

    const bins = hex(projected);
    bins.forEach((bin, idx) => {
      bin.cantonNum = cantonNum;
      // Store original lat/lon for distance calculation
      if (projected[idx]) {
        bin.lon = projected[idx][2];
        bin.lat = projected[idx][3];
        
        // Calculate distance to nearest school
        bin.schoolDistance = getMinDistanceToSchool(bin.lat, bin.lon);
      } else {
        bin.lon = null;
        bin.lat = null;
        bin.schoolDistance = null;
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
        .attr("stroke-width", 0.1)
        L.popup()
        map.closePopup()

    })
    .on("click", function(event, d) {
      event.stopPropagation(); // Prevent map click event
      const [x, y] = [event.pageX, event.pageY];
      const containerPoint = map.mouseEventToContainerPoint(event);
      const latlng = map.containerPointToLatLng(containerPoint);

      L.popup()
        .setLatLng(latlng)
        .setContent(
          `<b>Distance to nearest school:</b><br>${(d.schoolDistance/1000).toFixed(2)} km`
        )
        .openOn(map);
    })

    .merge(hexPaths)
    .attr("fill", d => {
      if (d.schoolDistance === null) return "#69b3a2";
      return getColorByDistance(d.schoolDistance);
    })
    .attr("d", hex.hexagon())
    .attr("transform", d => `translate(${d.x},${d.y})`);
}


// Update boundary positions
function updateBoundaries() {
  g.selectAll("path.boundary").attr("d", path);
}

// Update visible elements based on selection
function updateDisplay() {
  // Remove all event listeners first
  map.off("zoom viewreset move");
  map.off("zoomend");

  // Clear old elements
  g.selectAll("path.boundary").remove();
  g.selectAll("path.hex").remove();

  if (selectedKantonNum.length === 0) {
    return;
  }

  // Get selected canton features
  const cantonFeatures = selectedKantonNum
    .map(num => precomputedData[num]?.feature)
    .filter(f => f);

  if (cantonFeatures.length === 0) {
    return;
  }

  // Draw canton borders
  g.selectAll("path.boundary")
    .data(cantonFeatures)
    .enter()
    .append("path")
    .attr("class", "boundary")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1.2)
    .attr("d", path);

  // Set up event listeners
  map.on("zoom viewreset move", updateBoundaries);
  
  const debouncedProjectHexes = debounce(projectHexes, 100);
  map.on("zoomend", debouncedProjectHexes);

  // Initial hex draw
  projectHexes();
  

  // Zoom to bounds of all selected cantons
  const allBounds = selectedKantonNum
    .map(num => precomputedData[num]?.bounds)
    .filter(b => b);
    
  if (allBounds.length > 0) {
    const minLon = Math.min(...allBounds.map(b => b[0][0]));
    const minLat = Math.min(...allBounds.map(b => b[0][1]));
    const maxLon = Math.max(...allBounds.map(b => b[1][0]));
    const maxLat = Math.max(...allBounds.map(b => b[1][1]));

    setTimeout(() => {
      map.flyToBounds([
        [minLat, minLon],
        [maxLat, maxLon]
      ], {
        padding: [40, 40],
        duration: 1
      });
    }, 1000);
  }
}

// Load precomputed data, GeoJSON, and schools
Promise.all([
  d3.json("./kanton1.geojson"),
  d3.json("./hexdata_res1.0.json"),
  d3.json("./schools.geojson")
]).then(function ([geoData, precompData, schoolsData]) {
  swissData = geoData;
  hexRadiusDeg = precompData.resolution;
  
  // Load schools
  schoolLocations = schoolsData.features.map(f => {
    let coords;
    if (f.geometry.type === "Polygon") coords = f.geometry.coordinates[0][0];
    else if (f.geometry.type === "MultiPolygon") coords = f.geometry.coordinates[0][0][0];
    else if (f.geometry.type === "Point") coords = f.geometry.coordinates;
    
    return coords ? { lon: coords[0], lat: coords[1] } : null;
  }).filter(Boolean);
  
  console.log(`✅ Loaded ${schoolLocations.length} schools`);
  
  console.log("Loading precomputed data...");
  
  // Reconstruct precomputedData with feature references
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
  
  console.log("✅ Ready! Data loaded - school distance heatmap active.");

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

// 1️⃣ Define the UTM Zone 32N projection globally in proj4
proj4.defs("EPSG:4326", "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.4,15.1,405.3,0,0,0,0 +units=m +no_defs");

function drawschools() {
  Promise.all([
    d3.json("./schools.geojson")
  ]).then(function ([data]) {
    // Prepare and flatten the features
    const schools = data.features.map(f => {
      if (f.geometry.type === "Polygon") return f.geometry.coordinates[0][0];
      if (f.geometry.type === "MultiPolygon") return f.geometry.coordinates[0][0][0];
      if (f.geometry.type === "Point") return f.geometry.coordinates;
      return null;
    }).filter(Boolean);
  })
  .catch(error => console.error(error));
}
drawschools()

async function loadGeoTIFF1(filename) {
  try {
    const response = await fetch(filename);
    const arrayBuffer = await response.arrayBuffer();

    const georaster = await parseGeoraster(arrayBuffer);
    console.log("GeoTIFF info:", georaster);

    const layer = new GeoRasterLayer({
      georaster,
      opacity: 0.8,
      pixelValuesToColorFn: val => {
        if (val < 0) return null;
        if (val > 1) return "#43ec21ff";
        if (val > 20) return "#cdec21ff";
        if (val > 50) return "#ec2121ff";
      }
    });

    layer.addTo(map);
    map.fitBounds(layer.getBounds());

    console.log(`✅ GeoTIFF "${filename}" loaded successfully`);
  } catch (error) {
    console.error(`❌ Could not load GeoTIFF "${filename}":`, error);
  }
}



// var map = L.map('map', {
//   center: [46.8, 8.3],
//   zoom: 8,
//   minZoom: 8,
//   maxZoom: 15,
//   maxBounds: [
//     [45.7, 4.9],
//     [47.9, 11.7]
//   ]
// });

// const toggle = document.getElementById("toggle-cantons");
// const cantonList = document.getElementById("cantons-list");

// toggle.addEventListener("click", () => {
//   if (cantonList.style.display === "none" || cantonList.style.display === "") {
//     cantonList.style.display = "block";
//     toggle.innerHTML = "Choose Canton(s) &#9650;";
//   } else {
//     cantonList.style.display = "none";
//     toggle.innerHTML = "Choose Canton(s) &#9660;";
//   }
// });

// const toggleind = document.getElementById("index");
// const listind = document.getElementById("sliders-container");

// toggleind.addEventListener("click", () => {
//   if (listind.style.display === "none" || listind.style.display === "") {
//     listind.style.display = "block";
//     toggleind.innerHTML = "Adjust indexes &#9650;";
//   } else {
//     listind.style.display = "none";
//     toggleind.innerHTML = "Adjust indexes &#9660;";
//   }
// });

// // Base layer
// L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
//   attribution: '&copy; OpenStreetMap contributors'
// }).addTo(map);

// // SVG overlay for D3
// L.svg().addTo(map);
// const svg = d3.select(map.getPanes().overlayPane).select("svg");
// const g = svg.append("g").attr("class", "leaflet-zoom-hide");

// let selectedKantonNum = [];
// let swissData = null;
// let hexRadiusDeg = 0.0018;
// let precomputedData = {};
// let schoolLocations = []; // Store school locations

// // D3 projection (create once, reuse)
// const projection = d3.geoTransform({
//   point: function (x, y) {
//     const point = map.latLngToLayerPoint([y, x]);
//     this.stream.point(point.x, point.y);
//   }
// });
// const path = d3.geoPath().projection(projection);
// const hex = d3.hexbin().radius(30);

// // ============ SCHOOL DISTANCE FUNCTIONS ============

// // Calculate distance between two lat/lon points (in meters)
// function calculateDistance(lat1, lon1, lat2, lon2) {
//   const R = 6371e3; // Earth's radius in meters
//   const φ1 = lat1 * Math.PI / 180;
//   const φ2 = lat2 * Math.PI / 180;
//   const Δφ = (lat2 - lat1) * Math.PI / 180;
//   const Δλ = (lon2 - lon1) * Math.PI / 180;

//   const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//             Math.cos(φ1) * Math.cos(φ2) *
//             Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//   return R * c; // Distance in meters
// }

// // Get color based on distance to nearest school
// function getColorByDistance(distance) {
//   if (distance < 500) return "#00ff00";      // Bright green - very close
//   if (distance < 1000) return "#7fff00";     // Yellow-green
//   if (distance < 1500) return "#ffff00";     // Yellow
//   if (distance < 2000) return "#ffd700";     // Gold
//   if (distance < 2500) return "#ffa500";     // Orange
//   if (distance < 3000) return "#ff6347";     // Tomato
//   if (distance < 4000) return "#ff4500";     // Orange-red
//   return "#ff0000";                          // Red - far away
// }

// // Calculate minimum distance to any school
// function getMinDistanceToSchool(lat, lon) {
//   if (schoolLocations.length === 0) return null;
  
//   let minDistance = Infinity;
//   schoolLocations.forEach(school => {
//     const dist = calculateDistance(lat, lon, school.lat, school.lon);
//     if (dist < minDistance) minDistance = dist;
//   });
//   return minDistance;
// }

// // ============ END SCHOOL DISTANCE FUNCTIONS ============

// // Debounce function for performance
// function debounce(func, wait) {
//   let timeout;
//   return function executedFunction(...args) {
//     const later = () => {
//       clearTimeout(timeout);
//       func(...args);
//     };
//     clearTimeout(timeout);
//     timeout = setTimeout(later, wait);
//   };
// }

// // Project and draw hexagons for selected cantons with school distance coloring
// function projectHexes() {
//   if (selectedKantonNum.length === 0) return;

//   const allBins = [];
  
//   selectedKantonNum.forEach(cantonNum => {
//     const cantonData = precomputedData[cantonNum];
//     if (!cantonData) return;

//     const projected = cantonData.hexCenters.map(([lon, lat]) => {
//       const pt = map.latLngToLayerPoint([lat, lon]);
//       return [pt.x, pt.y, lon, lat]; // Include original coords
//     });

//     const bins = hex(projected);
//     bins.forEach((bin, idx) => {
//       bin.cantonNum = cantonNum;
//       // Store original lat/lon for distance calculation
//       if (projected[idx]) {
//         bin.lon = projected[idx][2];
//         bin.lat = projected[idx][3];
        
//         // Calculate distance to nearest school
//         bin.schoolDistance = getMinDistanceToSchool(bin.lat, bin.lon);
//       } else {
//         bin.lon = null;
//         bin.lat = null;
//         bin.schoolDistance = null;
//       }
//     });
//     allBins.push(...bins);
//   });

//   const hexPaths = g.selectAll("path.hex")
//     .data(allBins, d => `${d.cantonNum}-${d.x}-${d.y}`);

//   hexPaths.exit().remove();

//   hexPaths.enter()
//     .append("path")
//     .attr("class", "hex")
//     .attr("stroke", "#000")
//     .attr("stroke-width", 0.3)
//     .attr("fill-opacity", 0.7)
//     .style("pointer-events", "auto")
//     .attr("cursor", "pointer")
//     .on("mouseover", function(event, d) {
//       if (d.schoolDistance !== null) {
//         const distKm = (d.schoolDistance / 1000).toFixed(2);
//         L.popup()
//           .setLatLng([d.lat, d.lon])
//           .setContent(`<b>Distance to nearest school:</b><br>${distKm} km (${Math.round(d.schoolDistance)} m)`)
//           .openOn(map);
//       }
//     })
//     .merge(hexPaths)
//     .attr("fill", d => {
//       if (d.schoolDistance === null) return "#69b3a2";
//       return getColorByDistance(d.schoolDistance);
//     })
//     .attr("d", hex.hexagon())
//     .attr("transform", d => `translate(${d.x},${d.y})`);
// }

// // Update boundary positions
// function updateBoundaries() {
//   g.selectAll("path.boundary").attr("d", path);
// }

// // Draw school markers on the map
// function drawSchoolMarkers() {
//   if (schoolLocations.length === 0) return;
  
//   // Remove old markers
//   g.selectAll("circle.school-marker").remove();
  
//   // Add school markers
//   const markers = g.selectAll("circle.school-marker")
//     .data(schoolLocations)
//     .enter()
//     .append("circle")
//     .attr("class", "school-marker")
//     .attr("r", 4)
//     .attr("fill", "#8B4513")
//     .attr("stroke", "white")
//     .attr("stroke-width", 2)
//     .style("pointer-events", "auto")
//     .attr("cursor", "pointer")
//     .on("mouseover", function(event, d) {
//       d3.select(this).attr("r", 7);
//       L.popup()
//         .setLatLng([d.lat, d.lon])
//         .setContent(`<b>🏫 School Location</b>`)
//         .openOn(map);
//     })
//     .on("mouseout", function() {
//       d3.select(this).attr("r", 4);
//     });
    
//   // Update marker positions
//   function updateMarkers() {
//     markers
//       .attr("cx", d => {
//         const pt = map.latLngToLayerPoint([d.lat, d.lon]);
//         return pt.x;
//       })
//       .attr("cy", d => {
//         const pt = map.latLngToLayerPoint([d.lat, d.lon]);
//         return pt.y;
//       });
//   }
  
//   updateMarkers();
//   map.on("zoom viewreset move", updateMarkers);
// }

// // Update visible elements based on selection
// function updateDisplay() {
//   // Remove all event listeners first
//   map.off("zoom viewreset move");
//   map.off("zoomend");

//   // Clear old elements
//   g.selectAll("path.boundary").remove();
//   g.selectAll("path.hex").remove();

//   if (selectedKantonNum.length === 0) {
//     return;
//   }

//   // Get selected canton features
//   const cantonFeatures = selectedKantonNum
//     .map(num => precomputedData[num]?.feature)
//     .filter(f => f);

//   if (cantonFeatures.length === 0) {
//     return;
//   }

//   // Draw canton borders
//   g.selectAll("path.boundary")
//     .data(cantonFeatures)
//     .enter()
//     .append("path")
//     .attr("class", "boundary")
//     .attr("fill", "none")
//     .attr("stroke", "black")
//     .attr("stroke-width", 1.2)
//     .attr("d", path);

//   // Set up event listeners
//   map.on("zoom viewreset move", updateBoundaries);
  
//   const debouncedProjectHexes = debounce(projectHexes, 100);
//   map.on("zoomend", debouncedProjectHexes);

//   // Initial hex draw
//   projectHexes();
  
//   // Draw school markers
//   setTimeout(() => drawSchoolMarkers(), 100);

//   // Zoom to bounds of all selected cantons
//   const allBounds = selectedKantonNum
//     .map(num => precomputedData[num]?.bounds)
//     .filter(b => b);
    
//   if (allBounds.length > 0) {
//     const minLon = Math.min(...allBounds.map(b => b[0][0]));
//     const minLat = Math.min(...allBounds.map(b => b[0][1]));
//     const maxLon = Math.max(...allBounds.map(b => b[1][0]));
//     const maxLat = Math.max(...allBounds.map(b => b[1][1]));

//     setTimeout(() => {
//       map.flyToBounds([
//         [minLat, minLon],
//         [maxLat, maxLon]
//       ], {
//         padding: [40, 40],
//         duration: 1
//       });
//     }, 1000);
//   }
// }

// // Load precomputed data, GeoJSON, and schools
// Promise.all([
//   d3.json("./kanton.geojson"),
//   d3.json("./hexdata_res1.0.json"),
//   d3.json("./schools.geojson")
// ]).then(function ([geoData, precompData, schoolsData]) {
//   swissData = geoData;
//   hexRadiusDeg = precompData.resolution;
  
//   // Load schools
//   schoolLocations = schoolsData.features.map(f => {
//     let coords;
//     if (f.geometry.type === "Polygon") coords = f.geometry.coordinates[0][0];
//     else if (f.geometry.type === "MultiPolygon") coords = f.geometry.coordinates[0][0][0];
//     else if (f.geometry.type === "Point") coords = f.geometry.coordinates;
    
//     return coords ? { lon: coords[0], lat: coords[1] } : null;
//   }).filter(Boolean);
  
//   console.log(`✅ Loaded ${schoolLocations.length} schools`);
  
//   console.log("Loading precomputed data...");
  
//   // Reconstruct precomputedData with feature references
//   Object.keys(precompData.data).forEach(cantonNum => {
//     const savedData = precompData.data[cantonNum];
//     const feature = swissData.features.find(
//       f => f.properties.KANTONSNUM === parseInt(cantonNum)
//     );
    
//     if (feature) {
//       precomputedData[cantonNum] = {
//         hexCenters: savedData.hexCenters,
//         bounds: savedData.bounds,
//         feature: feature
//       };
//     }
//   });
  
//   console.log("✅ Ready! Data loaded - school distance heatmap active.");

//   // Canton selection listener
//   document.getElementById('cantons-list').addEventListener('change', (e) => {
//     if (e.target.type === 'checkbox') {
//       selectedKantonNum = Array.from(
//         document.querySelectorAll('#cantons-list input[type="checkbox"]:checked')
//       ).map(cb => parseInt(cb.value));
      
//       updateDisplay();
//     }
//   });
// }).catch(error => {
//   console.error("Error loading data:", error);
// });