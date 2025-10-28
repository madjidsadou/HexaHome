var map = L.map('map', {
  center: [46.5358, 6.6269],
  zoom: 8,
  maxBounds: [[44.8, 8.2], [47.5, 9]],
  minZoom: 2,
  maxZoom: 20
});

// Add base layer
L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Add Leaflet SVG overlay
L.svg().addTo(map);
const svg = d3.select(map.getPanes().overlayPane).select("svg");
const g = svg.append("g").attr("class", "leaflet-zoom-hide");

d3.json("geowgs.geojson").then(function(data) {

  // D3 path generator using Leaflet projection
  const path = d3.geoPath().projection(d3.geoTransform({
    point: function(x, y) {
      const point = map.latLngToLayerPoint([y, x]); // Leaflet expects [lat, lon]
      this.stream.point(point.x, point.y);
    }
  }));

  const feature = g.selectAll("path")
    .data(data.features)
    .enter()
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "#000000ff")
    .attr("stroke-width", 1);

  function reset() {
    feature.attr("d", path);
  }

  // Redraw on map zoom/pan
  map.on("zoom viewreset move", reset);
  reset();
});


