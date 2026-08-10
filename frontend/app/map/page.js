'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
// Added TreePine for the refuge button icon
import { MapPin, Target, Navigation2, Clock, Activity, Leaf, Users, Search, Loader2, TreePine } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const SafeMap = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => <div className="flex-1 bg-gray-100 flex items-center justify-center font-semibold text-purple-700">Loading Map...</div>
});

export default function MapInterface() {
  const searchParams = useSearchParams();
  
  const initialStart = searchParams.get('start') || 'Flinders Street Station';
  const initialDest = searchParams.get('dest') || 'State Library of Victoria';

  const [startInput, setStartInput] = useState(initialStart);
  const [destInput, setDestInput] = useState(initialDest);
  
  const [startCoords, setStartCoords] = useState([-37.8183, 144.9671]);
  const [destCoords, setDestCoords] = useState([-37.8098, 144.9652]);
  
  const [routeGeometry, setRouteGeometry] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [selectedTime, setSelectedTime] = useState(0); // 0 = Now, 20, 40, 60
  const [forecastStatus, setForecastStatus] = useState('Low'); // Placeholder for backend data

  // 1. Geocoding helper (Nominatim)
  const geocodeAddress = async (query) => {
    const searchQuery = `${query}, Melbourne CBD, Victoria, Australia`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'PathEase-Sensory-Navigation-App' }
    });

    const data = await response.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    throw new Error(`Location not found in the CBD: ${query}`);
  };

  // 2. Dynamic Routing helper (OSRM API)
  const fetchStreetRoute = async (start, dest) => {
    const url = `https://router.project-osrm.org/route/v1/foot/${start[1]},${start[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const leafletCoords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
      setRouteGeometry(leafletCoords);
    }
  };

  // 3. Handle Search Execution
  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const startRes = await geocodeAddress(startInput);
      const destRes = await geocodeAddress(destInput);

      setStartCoords(startRes);
      setDestCoords(destRes);
      
      await fetchStreetRoute(startRes, destRes);
      
    } catch (err) {
      setErrorMessage('Could not find one of the locations. Please try a clearer landmark in Melbourne.');
    } finally {
      setLoading(false);
    }
  };

  // Run search on initial load if URL parameters exist
  useEffect(() => {
    if (searchParams.get('start') && searchParams.get('dest')) {
      handleSearch();
    }
  }, [searchParams]);

  // NEW: Placeholder for AC 2.1.4 (Spatial Calculation)
  const handleFindRefuge = () => {
    alert("Finding nearest quiet space... (Spatial routing to be implemented in AC 2.1.4)");
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-[#F4F4F6] font-sans overflow-hidden">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-full md:w-[420px] bg-white border-r border-gray-200 flex flex-col h-full z-10 shadow-xl flex-shrink-0">
        
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2 text-purple-700 font-bold text-xl cursor-pointer">
            <Leaf className="w-6 h-6" />
            <span>Find Calm Routes</span>
          </Link>
          <div className="text-sm font-semibold text-purple-700 border-b-2 border-purple-700 pb-1">Destinations</div>
        </div>

        <form onSubmit={handleSearch} className="p-6 bg-gray-50 border-b border-gray-200 space-y-4">
          <div className="relative">
            <Target className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              placeholder="Current Location"
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              value={destInput}
              onChange={(e) => setDestInput(e.target.value)}
              placeholder="Destination" 
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium py-3 rounded-lg flex justify-center items-center space-x-2 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Searching Locations...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Find Route</span>
              </>
            )}
          </button>

          {errorMessage && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">{errorMessage}</p>
          )}
        </form>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Route Selection</h2>
            <p className="text-gray-500 text-sm">Choose a route that fits your needs.</p>
          </div>

          <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Recommended Routes</h3>
          
          <div className="space-y-4">
            <div className="relative border-2 border-purple-700 rounded-xl p-4 bg-purple-50 cursor-pointer shadow-sm">
              <div className="absolute top-0 right-0 bg-purple-700 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                Recommended
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">Quietest Path</h4>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> 24 min</span>
                <span className="flex items-center"><Activity className="w-4 h-4 mr-1" /> 1.8 km</span>
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-md">
                <Leaf className="w-3 h-3 mr-1" /> Scenic
              </span>
            </div>

            <div className="border border-gray-200 rounded-xl p-4 bg-white hover:border-purple-300 hover:shadow-md transition-all cursor-pointer">
              <h4 className="text-lg font-bold text-gray-900 mb-1">Balanced Path</h4>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> 20 min</span>
                <span className="flex items-center"><Activity className="w-4 h-4 mr-1" /> 1.6 km</span>
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                <Users className="w-3 h-3 mr-1" /> Low Crowds
              </span>
            </div>

            <div className="border border-gray-200 rounded-xl p-4 bg-white hover:border-purple-300 hover:shadow-md transition-all cursor-pointer">
              <h4 className="text-lg font-bold text-gray-900 mb-1">Fastest Path</h4>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> 16 min</span>
                <span className="flex items-center"><Activity className="w-4 h-4 mr-1" /> 1.4 km</span>
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-md">
                <Users className="w-3 h-3 mr-1" /> Med Crowds
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-white">
          <button className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-4 rounded-xl flex justify-center items-center space-x-2 transition-colors">
            <span>Start Navigation</span>
            <Navigation2 className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN AREA: Map */}
      <main className="flex-1 relative h-full bg-gray-200 z-0">
        <SafeMap startCoords={startCoords} destCoords={destCoords} routeGeometry={routeGeometry} />
        
        {/* NEW: Find Nearest Refuge Floating Action Button overlaying the map */}
        <div className="absolute bottom-8 right-8 z-[1000]">
          <button
            onClick={handleFindRefuge}
            className="bg-white text-purple-700 shadow-xl rounded-full px-6 py-4 font-bold flex items-center space-x-2 hover:bg-purple-50 transition-colors border-2 border-purple-700"
          >
            <TreePine className="w-5 h-5" />
            <span>Find Nearest Refuge</span>
          </button>
        </div>
      </main>
      
    </div>
  );
}