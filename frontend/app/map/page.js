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
    const [activeRouteType, setActiveRouteType] = useState('quietest');
  const [fastestRouteGeom, setFastestRouteGeom] = useState([]);
  const [quietestRouteGeom, setQuietestRouteGeom] = useState([]);
  const searchParams = useSearchParams();
  
  const initialStart = searchParams.get('start') || 'Flinders Street Station';
  const initialDest = searchParams.get('dest') || 'State Library of Victoria';

  const [startInput, setStartInput] = useState(initialStart);
  const [destInput, setDestInput] = useState(initialDest);
  
  const [startCoords, setStartCoords] = useState([-37.8183, 144.9671]);
  const [destCoords, setDestCoords] = useState([-37.8098, 144.9652]);
  
  const [routeGeometry, setRouteGeometry] = useState([]);
  const [routeColor, setRouteColor] = useState('#6D28D9');
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [selectedTime, setSelectedTime] = useState(0); // 0 = Now, 20, 40, 60
  const [forecastStatus, setForecastStatus] = useState('Low'); // Placeholder for backend data
  // Add this right under your other useState declarations
  const [refuges, setRefuges] = useState([]);

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
    // Added &alternatives=true to request multiple physical paths
    const url = `https://router.project-osrm.org/route/v1/foot/${start[1]},${start[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson&alternatives=true`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      // Route 0 is always the fastest/most direct
      const fastCoords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
      setFastestRouteGeom(fastCoords);
      
      // If OSRM provides an alternative route, use it for the Quietest path
      if (data.routes.length > 1) {
        const quietCoords = data.routes[1].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        setQuietestRouteGeom(quietCoords);
      } else {
        // Fallback if no alternative exists
        setQuietestRouteGeom(fastCoords);
      }
      
      // Default to the quietest route when a new search runs
      setActiveRouteType('quietest');
    }
  };

// 3. Backend Sensory Data Integration (Hitting Navia's Live API)
  const fetchSensoryData = async () => {
    try {
      // Using the exact Render URL provided by the backend team
      const backendUrl = `https://ta27-pathease-backend.onrender.com/api/traffic`;
      
      const response = await fetch(backendUrl);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const hasHigh = data.some(reading => 
          String(reading.traffic_level).toLowerCase() === 'high'
        );
        const hasMedium = data.some(reading => 
          String(reading.traffic_level).toLowerCase() === 'medium'
        );

        // Dynamically set the route color based on the Python data
        if (hasHigh) {
          setRouteColor('#B91C1C'); // Tailwind red-700
        } else if (hasMedium) {
          setRouteColor('#CA8A04'); // Tailwind yellow-600
        } else {
          setRouteColor('#15803D'); // Tailwind green-700
        }
      } else {
        // Fallback if data is empty
        setRouteColor('#15803D'); 
      }
      
    } catch (error) {
      console.error("Failed to fetch live traffic data from Python backend", error);
      setRouteColor('#6D28D9'); // Fallback to purple on error
    }
  };

  // AC 2.1.1: Fetch Refuge Data
  const fetchRefuges = async () => {
    try {
      const response = await fetch('https://ta27-pathease-backend.onrender.com/api/refuges');
      const data = await response.json();
      setRefuges(data);
    } catch (error) {
      console.error("Failed to fetch refuges from Python backend", error);
    }
  };

  // Ensure refuges are loaded when the page first loads
  useEffect(() => {
    fetchRefuges();
  }, []);

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
      await fetchSensoryData();
      
    } catch (err) {
      setErrorMessage('Could not find one of the locations. Please try a clearer landmark in Melbourne.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Fetch Predictive Forecast for the Destination (AC 2.2.1 & 2.2.3)
  const handleTimeSelect = async (offset) => {
    setSelectedTime(offset);
    
    if (offset === 0) {
      // "Now" just displays the live status of the route
      setForecastStatus('Live');
      return;
    }

    try {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + offset);
      const formattedTime = futureDate.toISOString().replace('T', ' ').substring(0, 16) + ':00';

      const backendUrl = `https://ta27-pathease-backend.onrender.com/api/forecast?target_time=${encodeURIComponent(formattedTime)}`;
      
      const response = await fetch(backendUrl);
      const data = await response.json();
      
      if (data && data.length > 0) {
        // Haversine formula to find the forecast sensor closest to the destination
        const toRad = (value) => (value * Math.PI) / 180;
        let closestSensor = null;
        let minDistance = Infinity;

        data.forEach(sensor => {
          const R = 6371; // Earth radius in km
          const dLat = toRad(sensor.latitude - destCoords[0]);
          const dLon = toRad(sensor.longitude - destCoords[1]);
          const lat1 = toRad(destCoords[0]);
          const lat2 = toRad(sensor.latitude);

          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          if (distance < minDistance) {
            minDistance = distance;
            closestSensor = sensor;
          }
        });

        // Update the UI with the specific predicted level for the destination area
        if (closestSensor) {
          // Navia's forecast backend uses 'predicted_level' based on the Python code
          const destForecast = closestSensor.predicted_level || 'Low';
          setForecastStatus(destForecast);
        } else {
          setForecastStatus('Low');
        }
      } else {
        setForecastStatus('Low');
      }
      
    } catch (error) {
      console.error("Failed to fetch forecast from Python backend", error);
      setForecastStatus('Low');
    }
  };

  // Run search on initial load if URL parameters exist
  useEffect(() => {
    if (searchParams.get('start') && searchParams.get('dest')) {
      handleSearch();
    }
  }, [searchParams]);

// AC 2.1.4: Spatial Calculation to route to the nearest refuge
  const handleFindRefuge = () => {
    if (!refuges || refuges.length === 0) {
      alert("Refuges are still loading, please wait a moment.");
      return;
    }

    // Haversine formula to calculate distance on a sphere (Earth)
    const toRad = (value) => (value * Math.PI) / 180;
    let closestRefuge = null;
    let minDistance = Infinity;

    refuges.forEach(refuge => {
      const R = 6371; // Earth radius in km
      const dLat = toRad(refuge.latitude - startCoords[0]);
      const dLon = toRad(refuge.longitude - startCoords[1]);
      const lat1 = toRad(startCoords[0]);
      const lat2 = toRad(refuge.latitude);

      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      if (distance < minDistance) {
        minDistance = distance;
        closestRefuge = refuge;
      }
    });

    if (closestRefuge) {
      const destCoord = [closestRefuge.latitude, closestRefuge.longitude];
      const destName = closestRefuge.facility_name;
      
      // 1. Update the UI Input
      setDestInput(destName);
      // 2. Update the map coordinates
      setDestCoords(destCoord);
      
      // 3. Force OSRM to generate an immediate route to the quiet space
      fetchStreetRoute(startCoords, destCoord, startInput, destName);
      fetchSensoryData();
    }
  };

  // DEMO TOOL: Instantly load the hardcoded sensory detour presentation
  const handleSimulateDemo = () => {
    // 1. Move the map pins to the demo locations
    setStartCoords([-37.811015, 144.964295]); // Melbourne Central
    setDestCoords([-37.818300, 144.967100]);  // Flinders St Station

    // 2. Load the FASTEST ROUTE: Straight down Elizabeth St (Hits "High" sensors)
    setFastestRouteGeom([
      [-37.811015, 144.964295],
      [-37.812585, 144.962578],
      [-37.813746, 144.962762],
      [-37.815124, 144.963720],
      [-37.817980, 144.965034],
      [-37.818300, 144.967100]
    ]);

    // 3. Load the QUIETEST ROUTE: The physical detour down quieter side streets
    setQuietestRouteGeom([
      [-37.811015, 144.964295],
      [-37.811219, 144.966568],
      [-37.814880, 144.966088],
      [-37.816848, 144.965598],
      [-37.817940, 144.966167],
      [-37.818300, 144.967100]
    ]);

    // 4. Force the active color to Red to simulate the crowd spike on Elizabeth St
    setRouteColor('#B91C1C');

    // 5. Default to the fastest route first so the judges see the "Problem" (Red line)
    setActiveRouteType('fastest');
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-[#F4F4F6] font-sans overflow-hidden">
      
      {/* LEFT SIDEBAR - COMPACT VERSION */}
      <aside className="w-full md:w-[380px] bg-white border-r border-gray-200 flex flex-col h-full z-10 shadow-xl flex-shrink-0">
        
        {/* Header */}
        <div className="p-3 border-b border-gray-100 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2 text-purple-700 font-bold text-lg cursor-pointer">
            <Leaf className="w-5 h-5" />
            <span>PathEase</span>
          </Link>
          <div className="text-xs font-semibold text-purple-700 border-b-2 border-purple-700 pb-1">Destinations</div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="p-4 bg-gray-50 border-b border-gray-200 space-y-3">
          <div className="relative">
            <Target className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              placeholder="Current Location"
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-800"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={destInput}
              onChange={(e) => setDestInput(e.target.value)}
              placeholder="Destination" 
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-800"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium py-2 rounded-lg flex justify-center items-center space-x-2 transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Find Route</span>
              </>
            )}
          </button>
        </form>

        {/* Route Selection - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Recommended Routes</h3>
          </div>
          
          <div className="space-y-3">
            {/* CARD 1: Quietest Path (Forced Low Traffic) */}
            <div 
              onClick={() => setActiveRouteType('quietest')}
              className={`relative rounded-xl p-3 cursor-pointer transition-all ${
                activeRouteType === 'quietest' 
                  ? 'border-2 border-purple-700 bg-purple-50 shadow-sm' 
                  : 'border border-gray-200 bg-white hover:border-purple-300'
              }`}
            >
              {activeRouteType === 'quietest' && (
                <div className="absolute top-0 right-0 bg-purple-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-lg">
                  Active
                </div>
              )}
              <h4 className="text-base font-bold text-gray-900 mb-1">Quietest Path</h4>
              <div className="flex items-center space-x-3 text-xs text-gray-600 mb-2">
                <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> 24 min</span>
              </div>
              <span className="inline-flex items-center text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-md">
                <Leaf className="w-3 h-3 mr-1" /> Low Traffic
              </span>
            </div>

            {/* CARD 2: Fastest Path */}
            <div 
              onClick={() => setActiveRouteType('fastest')}
              className={`relative rounded-xl p-3 cursor-pointer transition-all ${
                activeRouteType === 'fastest' 
                  ? 'border-2 border-purple-700 bg-purple-50 shadow-sm' 
                  : 'border border-gray-200 bg-white hover:border-purple-300'
              }`}
            >
              {activeRouteType === 'fastest' && (
                <div className="absolute top-0 right-0 bg-purple-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-lg">
                  Active
                </div>
              )}
              <h4 className="text-base font-bold text-gray-900 mb-1">Fastest Path</h4>
              <div className="flex items-center space-x-3 text-xs text-gray-600 mb-2">
                <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> 16 min</span>
              </div>
              <span className="inline-flex items-center text-[10px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-md">
                <Users className="w-3 h-3 mr-1" /> High Crowds
              </span>
            </div>
          </div>
        </div>

        {/* Destination Crowd Forecast Panel */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            {/* NEW: Updated label for clarity */}
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Destination Forecast</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              forecastStatus === 'High' ? 'bg-red-100 text-red-700' :
              forecastStatus === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {forecastStatus === 'Live' ? 'Live Data' : `${forecastStatus} Traffic`}
            </span>
          </div>
          
          <div className="flex space-x-2">
            {[0, 20, 40, 60].map((offset) => (
              <button
                key={offset}
                onClick={() => handleTimeSelect(offset)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedTime === offset
                    ? 'bg-purple-700 text-white shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-500'
                }`}
              >
                {offset === 0 ? 'Now' : `+${offset}m`}
              </button>
            ))}
          </div>
        </div>

        {/* DEMO TOOLS PANEL */}
        <div className="p-4 border-t border-gray-200 bg-red-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-bold text-red-900 uppercase tracking-wider">Presentation Tools</h3>
          </div>
          <button 
            onClick={handleSimulateDemo}
            className="w-full bg-white border border-red-700 text-red-700 hover:bg-red-700 hover:text-white font-bold py-2 rounded-lg transition-colors shadow-sm text-sm"
          >
            Simulate Sensory Detour
          </button>
        </div>

      </aside>

      {/* RIGHT MAIN AREA: Map */}
      <main className="flex-1 relative h-full bg-gray-200 z-0">
        <SafeMap 
          startCoords={startCoords} 
          destCoords={destCoords} 
          routeGeometry={activeRouteType === 'fastest' ? fastestRouteGeom : quietestRouteGeom} 
          routeColor={activeRouteType === 'fastest' ? routeColor : '#15803D'} 
          refuges={refuges} // Pass the data to the Leaflet component!
        />
        
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