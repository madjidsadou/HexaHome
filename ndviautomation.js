const map = L.map('map', {
  center: [46.5358, 8.2],
  zoom: 8,
  minZoom: 2,
  maxZoom: 20
});

L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

L.svg().addTo(map);
const svg = d3.select(map.getPanes().overlayPane).select("svg");
const g = svg.append("g").attr("class", "leaflet-zoom-hide");

// Load Switzerland boundaries
d3.json("geowgs.geojson").then(function (swissData) {

  // Draw boundary
  const path = d3.geoPath().projection(d3.geoTransform({
    point: function (x, y) {
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

  // === H3 Section ===
  const h3Index = h3.latLngToCell(46.5358, 8.2, 6);
  console.log("H3 index:", h3Index);

  const hexCenterCoordinates = h3.cellToLatLng(h3Index);
  console.log("Hex center:", hexCenterCoordinates);

  const hexBoundary = h3.cellToBoundary(h3Index);
  console.log("Hex boundary:", hexBoundary);

  const disk = h3.gridDisk(h3Index, 6);
  console.log("Neighbors:", disk);

  // === Polygon from GeoJSON ===
  const geoJsonFeature = swissData.features[1];

  let polygonCoords = [];
  if (geoJsonFeature.geometry.type === "Polygon") {
    polygonCoords = geoJsonFeature.geometry.coordinates[0].map(([lon, lat]) => [lat, lon]);
  } else if (geoJsonFeature.geometry.type === "MultiPolygon") {
    polygonCoords = geoJsonFeature.geometry.coordinates[0][0].map(([lon, lat]) => [lat, lon]);
  }

  console.log("Polygon coordinates for H3:", polygonCoords);

  const hexagons = h3.polygonToCells(polygonCoords, 5);
  console.log("Hexagons in polygon:", hexagons);

  const hexMultiPolygon = h3.cellsToMultiPolygon(hexagons, true);

  // ✅ Flip coordinates for Leaflet [lng, lat] → [lat, lng]
  const flippedHexMultiPolygon = {
    type: "Feature",
    geometry: {
      type: "MultiPolygon",
      coordinates: hexMultiPolygon.map(polygon =>
        polygon.map(ring =>
          ring.map(([lng, lat]) => [lng, lat])
        )
      )
    }
  };

  console.log("to display", flippedHexMultiPolygon);

  // Create a Leaflet GeoJSON layer
  const hexLayer = L.geoJSON(flippedHexMultiPolygon, {
    style: {
      color: "#c12727ff",
      weight: 1,
      fillOpacity: 0.3,
      stroke: "#000000ff"
    }
  }).addTo(map);
});
