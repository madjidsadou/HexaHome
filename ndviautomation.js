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

// D3 projection (create once, reuse)
const projection = d3.geoTransform({
  point: function (x, y) {
    const point = map.latLngToLayerPoint([y, x]);
    this.stream.point(point.x, point.y);
  }
});
const path = d3.geoPath().projection(projection);
const hex = d3.hexbin().radius(30);

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

// Project and draw hexagons for selected cantons only
function projectHexes() {
  if (selectedKantonNum.length === 0) return;

  const allBins = [];
  
  selectedKantonNum.forEach(cantonNum => {
    const cantonData = precomputedData[cantonNum];
    if (!cantonData) return;

    const projected = cantonData.hexCenters.map(([lon, lat]) => {
      const pt = map.latLngToLayerPoint([lat, lon]);
      return [pt.x, pt.y];
    });

    const bins = hex(projected);
    bins.forEach(bin => {
      bin.cantonNum = cantonNum;
    });
    allBins.push(...bins);
  });

  const hexPaths = g.selectAll("path.hex")
    .data(allBins, d => `${d.cantonNum}-${d.x}-${d.y}`);

  hexPaths.exit().remove();

  hexPaths.enter()
    .append("path")
    .attr("class", "hex")
    .attr("fill", "#69b3a2")
    .attr("stroke", "#000")
    .attr("stroke-width", 0.3)
    .attr("fill-opacity", 0.5)
    .merge(hexPaths)
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

// Load precomputed data and GeoJSON
Promise.all([
  d3.json("./kanton.geojson"),
  d3.json("./hexdata_res1.0.json") // Your precomputed file
]).then(function ([geoData, precompData]) {
  swissData = geoData;
  hexRadiusDeg = precompData.resolution;
  
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
  
  console.log("✅ Ready! Data loaded instantly.");

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
  console.log("Make sure hexdata_res1.8.json exists in the same directory!");
});


// 1️⃣ Define the UTM Zone 32N projection globally in proj4
proj4.defs("EPSG:2056", "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.4,15.1,405.3,0,0,0,0 +units=m +no_defs");


// 3️⃣ Async function to load the GeoTIFF
async function loadGeoTIFF() {
  try {
    // Must be served via localhost or a web server
    const response = await fetch("air_wgs84.tif");
    const arrayBuffer = await response.arrayBuffer();
    
    // Parse GeoTIFF
    const georaster = await parseGeoraster(arrayBuffer);

    console.log("GeoTIFF info:", georaster);

    // 4️⃣ Create GeoRasterLayer
    const layer = new GeoRasterLayer({
      georaster,
      opacity: 0.8,
      pixelValuesToColorFn: val => {
        if (val<1 || val>22) return null;
        if (val < 5) return "#43ec21ff";
        if (val < 15) return "#f5e31eff";
        if (val < 24.2) return "#ff0000ff";
        return "#1a9850";
      }
    });

    // 5️⃣ Add to map
    layer.addTo(map);

    // Fit map to the raster bounds
    map.fitBounds(layer.getBounds());

    console.log("✅ GeoTIFF loaded successfully");
  } catch (error) {
    console.error("❌ Could not load GeoTIFF:", error);
  }
}

// 6️⃣ Call the function
loadGeoTIFF();
