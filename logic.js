// Store our API endpoint inside queryUrl
String.prototype.format = function() {
  a = this;
  for (k in arguments) {
    a = a.replace("{" + k + "}", arguments[k])
  }
  return a
};

var dateFormat = d3.timeFormat("%Y-%m-%d");

function subtractDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

var today = new Date();
var oneWeekAgo = subtractDays(today, 6);

// Retrieve the earthquake data in the past 7 days
var queryUrl = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime={0}&endtime={1}".format(dateFormat(oneWeekAgo),dateFormat(today));

console.log(queryUrl);

function markerSize(mag) {
  return mag*5;
}

// Perform a GET request to the query URL
d3.json(queryUrl, function(data) {
  // Once we get a response, send the data.features object to the createFeatures function
  createFeatures(data.features);
});

function createFeatures(earthquakeData) {
  var mags=[];
  earthquakeData.forEach(function (d) {
      mags.push(d.properties.mag);
  });

  // var scale = chroma.scale(['#66ff99','#ffff66','#ffb366','#ff3300']).domain([0,2,5,10]);

  function scale(d) {
    return d < 1 ? '#99ff99' :
          d < 2  ? '#ccff99' :
          d < 3  ? '#ffff99' :
          d < 4  ? '#ffcc66' :
          d < 5  ? '#ff9933' :
                    '#ff3300';
  }

  // Define a function we want to run once for each feature in the features array
  // Give each feature a popup describing the place and time of the earthquake
  function onEachFeature(feature, layer) {
      layer.bindPopup("<h3>" + feature.properties.place +"</h3>"+
      "<hr><p><strong>Time:</strong> " + new Date(feature.properties.time) + "</p>"+
      "<p><strong>Magnitude:</strong> " + feature.properties.mag + "</p>");
  }

  // Create a GeoJSON layer containing the features array on the earthquakeData object
  // Run the onEachFeature function once for each piece of data in the array
  var earthquakes = L.geoJSON(earthquakeData, {

    onEachFeature: onEachFeature,
      pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, {
              radius: markerSize(feature.properties.mag),
              fillColor:scale(feature.properties.mag),
              color: "#000",
              weight: 1,
              // stroke-opacity: .5,
              opacity: .5,
              fillOpacity: 0.8
          });
    }
  });

  // Sending our earthquakes layer to the createMap function
  createMap(earthquakes);
}

function createMap(earthquakes) {

  // Define streetmap and darkmap layers
  var lightmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.light",
    accessToken: API_KEY
  });

  var darkmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.dark",
    accessToken: API_KEY
  });

  // Define a baseMaps object to hold our base layers
  var baseMaps = {
    "Street Map": lightmap,
    "Dark Map": darkmap
  };

  // Create overlay object to hold our overlay layer
  var overlayMaps = {
    Earthquakes: earthquakes
  };

  // Create our map, giving it the streetmap and earthquakes layers to display on load
  var myMap = L.map("map", {
    center: [
      37.09, -95.71
    ],
    zoom: 5,
    layers: [lightmap, earthquakes]
  });

  // Create a layer control
  // Pass in our baseMaps and overlayMaps
  // Add the layer control to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);

  // Setting up the legend
  var legend = L.control({ position: "bottomright" });
  legend.onAdd = function() {
      var div = L.DomUtil.create("div", "info legend");
      var limits = ['0-1','1-2','2-3','3-4','4-5','5+'];
      var colors = ['#99ff99','#ccff99','#ffff99','#ffcc66','#ff9933','#ff3300'];
      var labels = [];

      // Add min & max
      var legendInfo = ["<table><tr><th></th><th></th></tr>"];
          // "<div class=\"labels\">"];

      limits.forEach(function (limit, index) {
        legendInfo.push("<tr>");
        legendInfo.push("<td class='colorLabel' style=\"background-color: " + colors[index] + "\"></td>");
          legendInfo.push("<td>" + limit + "</td>");
          legendInfo.push("</tr>");
          // labels.push("<td style=\"background-color: " + colors[index] + "\"></td><em>"+limit+"</em>");
      });
      legendInfo.push("</table>");
      // console.log(legendInfo);
      div.innerHTML += legendInfo.join("");
      // div.innerHTML += "<ul>" + labels.join("") + "</ul>";
      return div;
  };

  // Adding legend to the map
  legend.addTo(myMap);
}
