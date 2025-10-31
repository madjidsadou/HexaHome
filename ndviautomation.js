var map = L.map('map', {
  center: [46.8, 8.3],
  zoom: 8,
  minZoom: 8,
  maxZoom: 15
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

d3.json("./kanton.geojson").then(function (swissData) {

  // 🟠 Event listener: when checkbox selection changes
  document.getElementById('cantons-list').addEventListener('click', async () => {
    selectedKantonNum = Array.from(
      document.querySelectorAll('#cantons-list input[type="checkbox"]:checked')
    ).map(cb => parseInt(cb.value));

    await updateMap(); // refresh visualization
  });

  async function updateMap() {
    // remove old paths and hexes
    g.selectAll("path.boundary").remove();
    g.selectAll("path.hex").remove();

    // filter selected cantons
    const cantonFeatures = swissData.features.filter(f =>
      selectedKantonNum.includes(f.properties.KANTONSNUM)
    );

      if (cantonFeatures.length === 0) {
    map.off("zoomend"); // make sure no hex redraw on zoom
    return;
  }
;

    // D3 projection linked to Leaflet
    const path = d3.geoPath().projection(d3.geoTransform({
      point: function (x, y) {
        const point = map.latLngToLayerPoint([y, x]);
        this.stream.point(point.x, point.y);
      }
    }));

    // Draw canton borders
    const feature = g.selectAll("path.boundary")
      .data(cantonFeatures)
      .enter()
      .append("path")
      .attr("class", "boundary")
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1.2);

    function resetBoundary() {
      feature.attr("d", path);
    }

    map.on("zoom viewreset move", resetBoundary);
    resetBoundary();

map.off("zoomend");

// Then for each selected canton
cantonFeatures.forEach(cantonFeature => {
  const bounds = d3.geoBounds(cantonFeature);
  const [min, max] = bounds;
  const hexRadiusDeg = 0.01;
  const hex = d3.hexbin().radius(40);

  let hexCenters = [];
  for (let lon = min[0]; lon <= max[0]; lon += hexRadiusDeg) {
    for (let lat = min[1]; lat <= max[1]; lat += hexRadiusDeg * Math.sqrt(3) / 2) {
      if (d3.geoContains(cantonFeature, [lon, lat])) {
        hexCenters.push([lon, lat]);
      }
    }
  }

  function projectHexes() {
    const projected = hexCenters.map(([lon, lat]) => {
      const pt = map.latLngToLayerPoint([lat, lon]);
      return [pt.x, pt.y];
    });

    const bins = hex(projected);

    const hexPaths = g.selectAll(`path.hex-${cantonFeature.properties.KANTONSNUM}`)
      .data(bins, d => d.x + "," + d.y);

    hexPaths.enter()
      .append("path")
      .attr("class", `hex hex-${cantonFeature.properties.KANTONSNUM}`)
      .merge(hexPaths)
      .attr("d", hex.hexagon())
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .attr("fill", "#69b3a2")
      .attr("stroke", "#000")
      .attr("stroke-width", 0.3)
      .attr("fill-opacity", 0.5);

    hexPaths.exit().remove();
  }

  projectHexes();
  map.on("zoomend", projectHexes); 

});
  }})