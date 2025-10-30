// ⚡ Initialize map efficiently (disable animations, unnecessary events)
const map = L.map('map', {
  center: [46.8, 8.3],
  zoom: 8,
  minZoom: 2,
  maxZoom: 15,
  zoomAnimation: false,
  fadeAnimation: false,
  markerZoomAnimation: false
});

// ⚡ Constant object literal (no need to keep re-allocating)
const cantons = Object.freeze({
  1: "Zürich", 2: "Bern", 3: "Luzern", 4: "Uri", 5: "Schwyz", 6: "Obwalden",
  7: "Nidwalden", 8: "Glarus", 9: "Zug", 10: "Fribourg", 11: "Solothurn",
  12: "Basel-Stadt", 13: "Basel-Landschaft", 14: "Schaffhausen",
  15: "Appenzell Ausserrhoden", 16: "Appenzell Innerrhoden", 17: "St. Gallen",
  18: "Graubünden", 19: "Aargau", 20: "Thurgau", 21: "Ticino", 22: "Vaud",
  23: "Valais", 24: "Neuchâtel", 25: "Geneva", 26: "Jura"
});

// ⚡ Use fast, cached tile source
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  updateWhenIdle: true,
  keepBuffer: 3
}).addTo(map);

// ⚡ One static SVG layer for D3 overlay
L.svg({ pane: 'overlayPane' }).addTo(map);
const svg = d3.select(map.getPanes().overlayPane).select("svg");
const g = svg.append("g").attr("class", "leaflet-zoom-hide");

// ⚡ Pre-load GeoJSON asynchronously (avoid blocking)
d3.json("./kanton.geojson").then((swissData) => {
  const selectedKantonNum = 25; // change as needed
  const cantonFeature = swissData.features.find(
    f => f.properties.KANTONSNUM === selectedKantonNum
  );

  if (!cantonFeature) {
    console.error("❌ Canton not found:", selectedKantonNum);
    return;
  }

  // ⚡ Precompute D3 projection (fast binding)
  const path = d3.geoPath().projection(d3.geoTransform({
    point: function (x, y) {
      const point = map.latLngToLayerPoint([y, x]);
      this.stream.point(point.x, point.y);
    }
  }));

  // ⚡ Draw once
  const feature = g.append("path")
    .datum(cantonFeature)
    .attr("class", "boundary")
    .attr("fill", "none")
    .attr("stroke", "#111")
    .attr("stroke-width", 1.2);

  const updateBoundary = () => feature.attr("d", path);
  updateBoundary();

  // Only redraw on zoom or move end, not continuously
  map.on("zoomend moveend", updateBoundary);

  // ⚡ Precompute hex centers ONCE in geographic space
  const [min, max] = d3.geoBounds(cantonFeature);
  const hexRadiusDeg = 0.0018;
  const hexCenters = [];

  for (let lon = min[0]; lon <= max[0]; lon += hexRadiusDeg) {
    for (let lat = min[1]; lat <= max[1]; lat += hexRadiusDeg * Math.sqrt(3) / 2) {
      if (d3.geoContains(cantonFeature, [lon, lat])) {
        hexCenters.push([lon, lat]);
      }
    }
  }

  const hex = d3.hexbin().radius(40);

  // ⚡ Project hexes efficiently
  function projectHexes() {
    const projected = new Array(hexCenters.length);
    for (let i = 0; i < hexCenters.length; i++) {
      const [lon, lat] = hexCenters[i];
      const pt = map.latLngToLayerPoint([lat, lon]);
      projected[i] = [pt.x, pt.y];
    }

    const bins = hex(projected);
    const hexPaths = g.selectAll("path.hex").data(bins, d => d.x + "," + d.y);

    hexPaths.enter()
      .append("path")
      .attr("class", "hex")
      .attr("d", hex.hexagon())
      .attr("fill", "#69b3a2")
      .attr("fill-opacity", 0.5)
      .attr("stroke", "#000")
      .attr("stroke-width", 0.3)
      .merge(hexPaths)
      .attr("transform", d => `translate(${d.x},${d.y})`);

    hexPaths.exit().remove();
  }

  projectHexes();
  map.on("zoomend", projectHexes);
});
