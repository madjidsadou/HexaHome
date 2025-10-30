var map = L.map('map', {
  center: [46.8, 8.3],
  zoom: 8,
  minZoom: 8,
  maxZoom: 15
});

  const toggle = document.getElementById("toggle-cantons");
  const cantonList = document.getElementById("cantons-list");

  toggle.addEventListener("click", () => {
    if (cantonList.style.display === "none") {
      cantonList.style.display = "block";
      toggle.innerHTML = "Choose Canton(s) &#9650;"; // up arrow
    } else {
      cantonList.style.display = "none";
      toggle.innerHTML = "Choose Canton(s) &#9660;"; // down arrow
    }
  });

  

const cantons = {
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

// Base layer
L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// SVG overlay for D3
L.svg().addTo(map);
const svg = d3.select(map.getPanes().overlayPane).select("svg");
const g = svg.append("g").attr("class", "leaflet-zoom-hide");

// Load the GeoJSON file
d3.json("./kanton.geojson").then(function(swissData) {

  // ✅ Choose the canton number you want to display
  const selectedKantonNum = 50; // <-- change this number to another canton

  // ✅ Filter only the matching canton feature(s)
  const cantonFeature = swissData.features.filter(
    f => f.properties.KANTONSNUM === selectedKantonNum
  );

  if (cantonFeature.length === 0) {
    console.error("No canton found with KANTONSNUM =", selectedKantonNum);
    return;
  }

  // Define D3 projection linked to Leaflet map
  const path = d3.geoPath().projection(d3.geoTransform({
    point: function (x, y) {
      const point = map.latLngToLayerPoint([y, x]);
      this.stream.point(point.x, point.y);
    }
  }));

  // Draw the filtered canton
  const feature = g.selectAll("path.boundary")
    .data(cantonFeature)
    .enter()
    .append("path")
    .attr("class", "boundary")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1.5);



  // Function to reposition on zoom/move
  function resetBoundary() {
    feature.attr("d", path);
  }

  map.on("zoom viewreset move", resetBoundary);
  resetBoundary();

  // 🧭 Geo bounds of Switzerland
  const bounds = d3.geoBounds(cantonFeature[0]);
  const [min, max] = bounds;

  // 🟢 Generate lat/lng hex grid once
  const hexRadiusDeg = 0.0018 ; // controls hex size (≈ 8–10 km)
  const hex = d3.hexbin().radius(40); // used only for shape (not geo spacing)

  let hexCenters = [];
  for (let lon = min[0]; lon <= max[0]; lon += hexRadiusDeg) {
    for (let lat = min[1]; lat <= max[1]; lat += hexRadiusDeg * Math.sqrt(3) / 2) {
      if (d3.geoContains(cantonFeature[0], [lon, lat])) {
        hexCenters.push([lon, lat]);
      }
    }
  }

  // 🔄 Function to project and render
  function projectHexes() {
    const projected = hexCenters.map(([lon, lat]) => {
      const pt = map.latLngToLayerPoint([lat, lon]);
      return [pt.x, pt.y];
    });

    const bins = hex(projected);

    const hexPaths = g.selectAll("path.hex").data(bins);

    hexPaths.enter()
      .append("path")
      .attr("class", "hex")
      .merge(hexPaths)
      .attr("d", hex.hexagon())
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .attr("fill", "#69b3a2")
      .attr("stroke", "#000")
      .attr("stroke-width", 0.3)
      .attr("fill-opacity", 0.5);

    hexPaths.exit().remove();
  }

  // Render once and when zoom changes
  projectHexes();
  map.on("zoomend", projectHexes);
});