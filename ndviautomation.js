var map = new L.Map('map', {
    center:[46.53584966676345,6.626950549641442],
    // maxBounds: [[44.8, 8.2], [47.5, 9]],
    minZoom: 2,
    maxZoom: 20,
    zoom: 3
});

// Define tile layers
var osmLayer = L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
});
var esriImagery = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: '&copy; <a href="http://www.esri.com">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

osmLayer.addTo(map);

// Define base layers
var baseLayers = {
  "OpenStreetMap": osmLayer,
  "Photos aériennes ESRI": esriImagery,
};


