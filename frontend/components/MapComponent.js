'use client';

import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

// Helper component to smoothly re-center map when search coordinates change
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function MapComponent({ startCoords, destCoords, routeGeometry }) {
  const defaultStart = startCoords || [-37.8183, 144.9671]; 
  const defaultDest = destCoords || [-37.8098, 144.9652];   
  
  // If we have a calculated street route, use it. Otherwise, fallback to a straight line.
  const pathPositions = routeGeometry && routeGeometry.length > 0 ? routeGeometry : [defaultStart, defaultDest];

  return (
    <MapContainer center={defaultStart} zoom={15} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      <RecenterMap center={defaultStart} />

      {/* Dynamic Route Line */}
      <Polyline 
        positions={pathPositions} 
        color="#6D28D9" 
        weight={8} 
        opacity={0.8} 
        lineCap="round" 
        lineJoin="round" 
      />

      {/* Starting Location Dot */}
      <CircleMarker 
        center={defaultStart} 
        radius={8} 
        pathOptions={{ color: '#6D28D9', fillColor: 'white', fillOpacity: 1, weight: 4 }} 
      />

      {/* Destination Location Dot */}
      <CircleMarker 
        center={defaultDest} 
        radius={8} 
        pathOptions={{ color: '#6D28D9', fillColor: 'white', fillOpacity: 1, weight: 4 }} 
      />
    </MapContainer>
  );
}