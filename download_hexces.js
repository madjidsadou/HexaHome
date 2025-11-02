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
let hexRadiusDeg = 0.001;
let precomputedData = {}; // Store all precomputed hex centers

// D3 projection (create once, reuse)
const projection = d3.geoTransform({
  point: function (x, y) {
    const point = map.latLngToLayerPoint([y, x]);
    this.stream.point(point.x, point.y);
  }
});
const path = d3.geoPath().projection(projection);
const hex = d3.hexbin().radius(35);

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

// Precompute hex centers for a SINGLE canton (RASTERIZE POLYGON)
function precomputeCantonHexCenters(cantonFeature, radiusDeg) {
  const cantonNum = cantonFeature.properties.KANTONSNUM;
  const bounds = d3.geoBounds(cantonFeature);
  const [min, max] = bounds;
  const step = radiusDeg * Math.sqrt(3) / 2;
  
  const hexCenters = [];
  
  // Extract polygon coordinates
  const geometry = cantonFeature.geometry;
  let polygons = [];
  
  if (geometry.type === 'Polygon') {
    polygons = [geometry.coordinates];
  } else if (geometry.type === 'MultiPolygon') {
    polygons = geometry.coordinates;
  }
  
  // Create a grid to mark inside points
  const gridCols = Math.ceil((max[0] - min[0]) / radiusDeg) + 1;
  const gridRows = Math.ceil((max[1] - min[1]) / step) + 1;
  const grid = new Uint8Array(gridCols * gridRows); // 0 = outside, 1 = inside
  
  const lonToCol = lon => Math.round((lon - min[0]) / radiusDeg);
  const latToRow = lat => Math.round((lat - min[1]) / step);
  const colToLon = col => min[0] + col * radiusDeg;
  const rowToLat = row => min[1] + row * step;
  
  // Rasterize each polygon using scanline algorithm
  polygons.forEach(polyCoords => {
    const outerRing = polyCoords[0]; // First ring is outer boundary
    
    // Build edge table: for each edge, store where it intersects scanlines
    const edges = [];
    for (let i = 0; i < outerRing.length - 1; i++) {
      const [x1, y1] = outerRing[i];
      const [x2, y2] = outerRing[i + 1];
      
      if (y1 !== y2) { // Skip horizontal edges
        edges.push({
          yMin: Math.min(y1, y2),
          yMax: Math.max(y1, y2),
          x: y1 < y2 ? x1 : x2,
          slope: (x2 - x1) / (y2 - y1)
        });
      }
    }
    
    // For each scanline (latitude)
    for (let row = 0; row < gridRows; row++) {
      const lat = rowToLat(row);
      
      // Find all edge intersections with this scanline
      const intersections = [];
      edges.forEach(edge => {
        if (lat >= edge.yMin && lat <= edge.yMax) {
          const x = edge.x + (lat - edge.yMin) * edge.slope;
          intersections.push(x);
        }
      });
      
      // Sort intersections by x coordinate
      intersections.sort((a, b) => a - b);
      
      // Fill between pairs of intersections (inside polygon)
      for (let i = 0; i < intersections.length; i += 2) {
        if (i + 1 < intersections.length) {
          const startCol = Math.max(0, Math.ceil(lonToCol(intersections[i])));
          const endCol = Math.min(gridCols - 1, Math.floor(lonToCol(intersections[i + 1])));
          
          for (let col = startCol; col <= endCol; col++) {
            grid[row * gridCols + col] = 1;
          }
        }
      }
    }
    
    // Handle holes (inner rings)
    for (let h = 1; h < polyCoords.length; h++) {
      const holeRing = polyCoords[h];
      const holeEdges = [];
      
      for (let i = 0; i < holeRing.length - 1; i++) {
        const [x1, y1] = holeRing[i];
        const [x2, y2] = holeRing[i + 1];
        
        if (y1 !== y2) {
          holeEdges.push({
            yMin: Math.min(y1, y2),
            yMax: Math.max(y1, y2),
            x: y1 < y2 ? x1 : x2,
            slope: (x2 - x1) / (y2 - y1)
          });
        }
      }
      
      for (let row = 0; row < gridRows; row++) {
        const lat = rowToLat(row);
        const intersections = [];
        
        holeEdges.forEach(edge => {
          if (lat >= edge.yMin && lat <= edge.yMax) {
            const x = edge.x + (lat - edge.yMin) * edge.slope;
            intersections.push(x);
          }
        });
        
        intersections.sort((a, b) => a - b);
        
        // Remove points inside holes
        for (let i = 0; i < intersections.length; i += 2) {
          if (i + 1 < intersections.length) {
            const startCol = Math.max(0, Math.ceil(lonToCol(intersections[i])));
            const endCol = Math.min(gridCols - 1, Math.floor(lonToCol(intersections[i + 1])));
            
            for (let col = startCol; col <= endCol; col++) {
              grid[row * gridCols + col] = 0;
            }
          }
        }
      }
    }
  });
  
  // Convert grid to hex centers
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      if (grid[row * gridCols + col] === 1) {
        hexCenters.push([colToLon(col), rowToLat(row)]);
      }
    }
  }

  return {
    hexCenters: hexCenters,
    bounds: bounds,
    feature: cantonFeature
  };
}

// Precompute ALL cantons one by one with async breaks
async function precomputeAllHexCentersAsync(features, radiusDeg) {
  console.log(`Starting precomputation for ${features.length} cantons...`);
  const startTime = performance.now();
  const data = {};
  
  for (let i = 0; i < features.length; i++) {
    const cantonFeature = features[i];
    const cantonNum = cantonFeature.properties.KANTONSNUM;
    const cantonName = cantonFeature.properties.NAME || cantonNum;
    
    console.log(`Computing canton ${i + 1}/${features.length}: ${cantonName}`);
    
    data[cantonNum] = precomputeCantonHexCenters(cantonFeature, radiusDeg);
    
    // Yield to browser every canton to prevent freezings
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  const endTime = performance.now();
  console.log(`All cantons precomputed in ${(endTime - startTime).toFixed(0)}ms`);
  return data;
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
    }, 300);
  }
}

function downloadPrecomputedData() {
  const dataToSave = {
    resolution: hexRadiusDeg,
    timestamp: new Date().toISOString(),
    data: {}
  };

  Object.keys(precomputedData).forEach(cantonNum => {
    dataToSave.data[cantonNum] = {
      hexCenters: precomputedData[cantonNum].hexCenters,
      bounds: precomputedData[cantonNum].bounds
    };
  });

  const jsonStr = JSON.stringify(dataToSave);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `hexdata_res${(hexRadiusDeg * 1000).toFixed(1)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  console.log('✅ Precomputed data downloaded!');
}

// Load data and precompute everything
d3.json("./kanton.geojson").then(async function (data) {
  swissData = data;
  
  // PRECOMPUTE ALL HEX CENTERS ASYNCHRONOUSLY
  console.log('🔄 Starting asynchronous precomputation...');
  precomputedData = await precomputeAllHexCentersAsync(swissData.features, hexRadiusDeg);
  console.log("✅ Ready! All data precomputed.");
  
  // Auto-download after computation completes

  // Canton selection listener - just toggles display
  document.getElementById('cantons-list').addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
      selectedKantonNum = Array.from(
        document.querySelectorAll('#cantons-list input[type="checkbox"]:checked')
      ).map(cb => parseInt(cb.value));
      
      updateDisplay();
    }
  });
});