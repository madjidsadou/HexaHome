var map = L.map('map', {
  center: [46.5358, 8.2],
  zoom: 8,
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

// Load Swiss GeoJSON
d3.json("geowgs.geojson").then(function(swissData) {

  // 1️⃣ Draw Switzerland boundaries
  const path = d3.geoPath().projection(d3.geoTransform({
    point: function(x, y) {
      const point = map.latLngToLayerPoint([y, x]); // Leaflet expects [lat, lon]
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

  // 2️⃣ Generate hexbin covering Switzerland
  const hex = d3.hexbin().radius(30);

  function generateHex() {
    // Compute bounding box in LatLng
    const bounds = d3.geoBounds(swissData); // [[minLon, minLat],[maxLon,maxLat]]
    const [min, max] = bounds;

    // Convert bounds to layer points
    const tl = map.latLngToLayerPoint([max[1], min[0]]); // top-left
    const br = map.latLngToLayerPoint([min[1], max[0]]); // bottom-right

    // Generate grid points in pixel space
    let points = [];
    for (let x = tl.x; x <= br.x; x += hex.radius()) {
      for (let y = tl.y; y <= br.y; y += hex.radius() * Math.sqrt(3)/2) {
        points.push([x, y]);
      }
    }

    // Compute hex bins
    let bins = hex(points);

    // Keep only hexes inside Switzerland
    bins = bins.filter(bin => {
      const latlng = map.layerPointToLatLng([bin.x, bin.y]);
      return d3.geoContains(swissData, [latlng.lng, latlng.lat]);
    });

    // Bind data and draw hexes
    const hexPaths = g.selectAll("path.hex").data(bins);

    hexPaths.enter()
      .append("path")
      .attr("class", "hex")
      .merge(hexPaths)
      .attr("d", d => hex.hexagon())
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .attr("fill", "#69b3a2")
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5)
      .attr("fill-opacity", 0.5);

    hexPaths.exit().remove();
  }

  generateHex();
  map.on("zoom viewreset move", generateHex); // update hexes on zoom/pan

});
