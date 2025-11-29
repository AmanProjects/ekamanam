import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, Rectangle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issue in Leaflet with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

/**
 * LeafletMap Component
 * 
 * Renders interactive maps with markers, routes, and regions
 * 
 * Expected JSON format:
 * {
 *   "type": "leaflet",
 *   "center": [lat, lon],
 *   "zoom": 10,
 *   "markers": [
 *     {"position": [lat, lon], "label": "City Name", "popup": "Details"}
 *   ],
 *   "routes": [
 *     {"positions": [[lat1, lon1], [lat2, lon2]], "color": "#FF0000"}
 *   ],
 *   "circles": [
 *     {"center": [lat, lon], "radius": 50000, "color": "#0000FF"}
 *   ],
 *   "rectangles": [
 *     {"bounds": [[lat1, lon1], [lat2, lon2]], "color": "#00FF00"}
 *   ],
 *   "title": "Map Title"
 * }
 */
const LeafletMap = ({ mapData, title }) => {
  // Parse JSON if it's a string
  let data = typeof mapData === 'string' ? JSON.parse(mapData) : mapData;
  
  // Default values
  const center = data.center || [20.5937, 78.9629]; // India center
  const zoom = data.zoom || 5;
  const markers = data.markers || [];
  const routes = data.routes || data.polylines || [];
  const circles = data.circles || [];
  const rectangles = data.rectangles || [];
  const mapTitle = title || data.title || 'Interactive Map';

  return (
    <div style={{ width: '100%', marginBottom: '16px' }}>
      {mapTitle && (
        <div style={{ 
          textAlign: 'center', 
          fontWeight: 600, 
          marginBottom: '8px',
          fontSize: '14px',
          color: '#555'
        }}>
          {mapTitle}
        </div>
      )}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ 
          height: '400px', 
          width: '100%',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}
      >
        {/* OpenStreetMap tile layer (free, no API key needed!) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Markers (cities, locations, events) */}
        {markers.map((marker, idx) => (
          <Marker key={idx} position={marker.position}>
            {(marker.label || marker.popup) && (
              <Popup>
                <strong>{marker.label}</strong>
                {marker.popup && <div>{marker.popup}</div>}
              </Popup>
            )}
          </Marker>
        ))}
        
        {/* Routes/Paths (trade routes, migrations, etc.) */}
        {routes.map((route, idx) => (
          <Polyline
            key={idx}
            positions={route.positions}
            color={route.color || '#3388ff'}
            weight={route.weight || 3}
          />
        ))}
        
        {/* Circles (regions, influence zones) */}
        {circles.map((circle, idx) => (
          <Circle
            key={idx}
            center={circle.center}
            radius={circle.radius}
            color={circle.color || '#3388ff'}
            fillOpacity={circle.fillOpacity || 0.2}
          />
        ))}
        
        {/* Rectangles (territories, regions) */}
        {rectangles.map((rect, idx) => (
          <Rectangle
            key={idx}
            bounds={rect.bounds}
            color={rect.color || '#3388ff'}
            fillOpacity={rect.fillOpacity || 0.2}
          />
        ))}
      </MapContainer>
      
      {/* Legend or additional info */}
      {data.legend && (
        <div style={{ 
          marginTop: '8px', 
          fontSize: '12px', 
          color: '#666',
          padding: '8px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px'
        }}>
          <strong>Legend:</strong> {data.legend}
        </div>
      )}
    </div>
  );
};

export default LeafletMap;

