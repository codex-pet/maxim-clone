import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

const LeafletMap = ({
  pickup,
  destination,
  driverLocation,
  onRouteCalculated
}) => {
  const webViewRef = useRef(null);

  // Generate HTML for Leaflet
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Maxim Prototype Map</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        .marker-label {
          background: white;
          border: 1px solid #ccc;
          padding: 2px 5px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([8.5884, 123.3404], 13); // Default to Dipolog City
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        var pickupMarker, dropoffMarker, driverMarker, routeLayer;

        window.updateMarkers = function(data) {
          const { pickup, destination, driver } = JSON.parse(data);

          if (pickup) {
            if (pickupMarker) map.removeLayer(pickupMarker);
            pickupMarker = L.marker([pickup.lat, pickup.lng]).addTo(map)
              .bindTooltip("Pickup", { permanent: true, direction: 'top' });
          }

          if (destination) {
            if (dropoffMarker) map.removeLayer(dropoffMarker);
            dropoffMarker = L.marker([destination.lat, destination.lng]).addTo(map)
              .bindTooltip("Drop-off", { permanent: true, direction: 'top' });
          }

          if (driver) {
            if (driverMarker) map.removeLayer(driverMarker);
            driverMarker = L.circleMarker([driver.lat, driver.lng], {
              color: 'blue',
              fillColor: '#30f',
              fillOpacity: 0.5,
              radius: 8
            }).addTo(map).bindTooltip("Driver", { permanent: true, direction: 'top' });
          }

          // If both pickup and destination exist, fetch route from OSRM
          if (pickup && destination) {
            const url = \`https://router.project-osrm.org/route/v1/driving/\${pickup.lng},\${pickup.lat};\${destination.lng},\${destination.lat}?overview=full&geometries=geojson\`;
            
            fetch(url)
              .then(res => res.json())
              .then(res => {
                if (res.routes && res.routes.length > 0) {
                  const route = res.routes[0];
                  if (routeLayer) map.removeLayer(routeLayer);
                  
                  routeLayer = L.geoJSON(route.geometry, {
                    style: { color: '#FFD600', weight: 5, opacity: 0.7 }
                  }).addTo(map);
                  
                  map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });

                  // Send data back to React Native
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'ROUTE_CALCULATED',
                    distance: route.distance / 1000, // km
                    duration: route.duration / 60 // minutes
                  }));
                }
              });
          }
        };
      </script>
    </body>
    </html>
  `;

  const injectData = () => {
    if (webViewRef.current) {
      try {
        const data = JSON.stringify({ pickup, destination, driver: driverLocation });
        webViewRef.current.injectJavaScript(`window.updateMarkers('${data}')`);
      } catch (err) {
        console.error('Map injection error:', err);
      }
    }
  };

  useEffect(() => {
    injectData();
  }, [pickup, destination, driverLocation]);

  const onMessage = (event) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'ROUTE_CALCULATED' && onRouteCalculated) {
      onRouteCalculated(data);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
        onMessage={onMessage}
        onLoad={injectData}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => <ActivityIndicator style={styles.loader} size="large" color="#FFD600" />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 350,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  map: {
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
  }
});

export default LeafletMap;
