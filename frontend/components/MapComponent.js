'use client';

import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';


function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

// NEW: Added routeColor as a prop
export default function MapComponent({ startCoords, destCoords, routeGeometry, routeColor, refuges }) {
  const defaultStart = startCoords || [-37.8183, 144.9671]; 
  const defaultDest = destCoords || [-37.8098, 144.9652];   
  
  const pathPositions = routeGeometry && routeGeometry.length > 0 ? routeGeometry : [defaultStart, defaultDest];

  // Default to Tailwind's purple-700 if no color is provided by the API
  const activeColor = routeColor || "#6D28D9";

  return (
    <MapContainer center={defaultStart} zoom={15} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      <RecenterMap center={defaultStart} />

{/* Dynamic Route Line using the API color - FIXED RE-RENDER */}
      <Polyline 
        key={activeColor + pathPositions.length} // This forces React to redraw the line when the color or route changes!
        positions={pathPositions} 
        pathOptions={{
          color: activeColor,
          weight: 8,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round'
        }}
      />

      <CircleMarker 
        center={defaultStart} 
        radius={8} 
        pathOptions={{ color: activeColor, fillColor: 'white', fillOpacity: 1, weight: 4 }} 
      />

      <CircleMarker 
        center={defaultDest} 
        radius={8} 
        pathOptions={{ color: activeColor, fillColor: 'white', fillOpacity: 1, weight: 4 }} 
      />

      {refuges && refuges.map((refuge, idx) => (
        <CircleMarker 
          key={idx}
          center={[refuge.latitude, refuge.longitude]} 
          radius={7} 
          pathOptions={{ color: '#2563EB', fillColor: '#3B82F6', fillOpacity: 0.9, weight: 2 }} // Tailwind Blue for Refuges
        >
          <Popup>
            <div className="font-sans">
              <strong className="text-blue-700 block mb-1">{refuge.facility_name}</strong>
              <span className="text-xs text-gray-600 block">{refuge.facility_type}</span>
            </div>
          </Popup>
        </CircleMarker>
      ))}
      
    </MapContainer>
  );
}