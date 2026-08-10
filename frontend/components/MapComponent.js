'use client';
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapComponent() {
  // Centered on Melbourne CBD
  const melbourneCenter = [-37.8136, 144.9631];

  // Hardcoded Primary Route (Flinders St to State Library)
  const primaryRoute = [
    [-37.8183, 144.9671], 
    [-37.8145, 144.9660], 
    [-37.8098, 144.9652]
  ];

  return (
    <MapContainer center={melbourneCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {/* This draws your route in Red to simulate a High Sensory Load */}
      {/* Updated Route Line to match the purple UI theme */}
{/* The Route Line */}
      <Polyline 
        positions={primaryRoute} 
        color="#6D28D9" 
        weight={8} 
        opacity={0.8} 
        lineCap="round" 
        lineJoin="round" 
      />

      {/* Starting Location Dot */}
      <CircleMarker 
        center={primaryRoute[0]} 
        radius={7} 
        pathOptions={{ color: '#6D28D9', fillColor: 'white', fillOpacity: 1, weight: 4 }} 
      />

      {/* Destination Dot */}
      <CircleMarker 
        center={primaryRoute[primaryRoute.length - 1]} 
        radius={7} 
        pathOptions={{ color: '#6D28D9', fillColor: 'white', fillOpacity: 1, weight: 4 }} 
      />

    </MapContainer>
  );
}