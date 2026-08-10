'use client';

import { MapPin, Target, Navigation2, Clock, Activity, Leaf, Users } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import the map to prevent Leaflet SSR crashes
const SafeMap = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => <div className="flex-1 bg-gray-100 flex items-center justify-center font-semibold text-purple-700">Loading Map...</div>
});

export default function MapInterface() {
  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-[#F4F4F6] font-sans overflow-hidden">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-full md:w-[420px] bg-white border-r border-gray-200 flex flex-col h-full z-10 shadow-xl flex-shrink-0">
        
        {/* Header / Logo */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2 text-purple-700 font-bold text-xl cursor-pointer">
            <Leaf className="w-6 h-6" />
            <span>PathEase</span>
          </Link>
          <div className="text-sm font-semibold text-purple-700 border-b-2 border-purple-700 pb-1">Destinations</div>
        </div>

        {/* Search Inputs (Ready for Geocoding API) */}
        <div className="p-6 bg-gray-50 border-b border-gray-200 space-y-4">
          <div className="relative">
            <Target className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              defaultValue="Your Location" 
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Destination" 
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
            />
          </div>
        </div>

        {/* Route Selection Panel */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Route Selection</h2>
            <p className="text-gray-500 text-sm">Choose a route that fits your needs.</p>
          </div>

          <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Recommended Routes</h3>
          
          <div className="space-y-4">
            {/* CARD 1: Quietest Path (Active State) */}
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

            {/* CARD 2: Balanced Path */}
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

            {/* CARD 3: Fastest Path */}
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

        {/* Start Navigation Button */}
        <div className="p-6 border-t border-gray-200 bg-white">
          <button className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-4 rounded-xl flex justify-center items-center space-x-2 transition-colors">
            <span>Start Navigation</span>
            <Navigation2 className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN AREA: The Map */}
      <main className="flex-1 relative h-full bg-gray-200 z-0">
        <SafeMap />
      </main>
      
    </div>
  );
}