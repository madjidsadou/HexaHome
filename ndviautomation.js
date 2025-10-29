var map = L.map('map', {
  center: [46.5358, 8.2],
  zoom: 8,
  minZoom: 2,
  maxZoom: 20
});

// Base layer
L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// SVG overlay for D3
L.svg().addTo(map);
const svg = d3.select(map.getPanes().overlayPane).select("svg");
const g = svg.append("g").attr("class", "leaflet-zoom-hide");

// Load Switzerland GeoJSON
d3.json("geowgs.geojson").then(function(swissData) {

  // 🗺️ Draw Swiss border
  const path = d3.geoPath().projection(d3.geoTransform({
    point: function(x, y) {
      const point = map.latLngToLayerPoint([y, x]);
      this.stream.point(point.x, point.y);
    }
  }));

  const feature = g.selectAll("path.boundary")
    .data(swissData.features)
    .enter()
    .append("path")
    .attr("class", "boundary")
    .attr("fill", "none")
    .attr("stroke", "#000")
    .attr("stroke-width", 1);

  function resetBoundary() {
    feature.attr("d", path);
  }
  map.on("zoom viewreset move", resetBoundary);
  resetBoundary();

  // 🧭 Geo bounds of Switzerland
  const bounds = d3.geoBounds(swissData);
  const [min, max] = bounds;

  // 🟢 Generate lat/lng hex grid once
  const hexRadiusDeg = 0.1; // controls hex size (≈ 8–10 km)
  const hex = d3.hexbin().radius(30); // used only for shape (not geo spacing)

  let hexCenters = [];
  for (let lon = min[0]; lon <= max[0]; lon += hexRadiusDeg) {
    for (let lat = min[1]; lat <= max[1]; lat += hexRadiusDeg * Math.sqrt(3) / 2) {
      if (d3.geoContains(swissData, [lon, lat])) {
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
