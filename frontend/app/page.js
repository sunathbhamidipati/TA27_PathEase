'use client';

import { Map, MapPin, Target, ArrowRight, Users, UserCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F4F4F6] font-sans flex flex-col">
      {/* HEADER */}
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center space-x-2 text-purple-700 font-bold text-xl">
          <Map className="w-6 h-6" />
          <span>PathEase</span>
        </div>
        
        <nav className="hidden md:flex space-x-8">
          <a href="#" className="text-purple-700 font-semibold border-b-2 border-purple-700 pb-1">
            Destinations
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          <button className="text-purple-700 font-medium hover:text-purple-800">Sign In</button>
          <UserCircle className="w-8 h-8 text-gray-400" />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow flex flex-col items-center justify-start pt-16 px-4">
        
        {/* HERO SECTION */}
        <div className="text-center max-w-2xl mb-10">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Navigate with peace of mind.
          </h1>
          <p className="text-lg text-gray-600">
            Discover routes tailored to your sensory preferences. Avoid crowds, minimize noise, and find calm paths to your destination.
          </p>
        </div>

        {/* SEARCH CARD */}
        <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-xl mb-16">
          <div className="space-y-4">
            
            {/* Current Location Input */}
            <div className="relative">
              <Target className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
              <input 
                type="text" 
                placeholder="Current Location" 
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 placeholder-gray-400"
              />
            </div>

            {/* Destination Input */}
            <div className="relative">
              <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
              <input 
                type="text" 
                placeholder="Enter destination..." 
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 placeholder-gray-400"
              />
            </div>

            {/* Submit Button */}
            <button className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium py-3 rounded-lg flex justify-center items-center space-x-2 transition-colors">
              <span>Find Route</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

      </main>

      {/* COMFORT ZONES SECTION */}
      <section className="bg-white w-full border-t border-gray-200 py-16 px-8 flex justify-center">
        <div className="max-w-4xl w-full">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Set your comfort zones</h2>
          <p className="text-gray-600 mb-8 max-w-2xl">
            Select the environmental factors you want to manage. We'll adjust your routes to create a more comfortable journey.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Crowd Levels Card */}
            <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer bg-gray-50">
              <div className="bg-gray-200 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-gray-700">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Crowd Levels</h3>
              <p className="text-gray-600 text-sm">
                Prioritize less congested areas and quiet streets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-6 px-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
        <p>PathEase. Accessible Navigation for Everyone.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-gray-900">Privacy Policy</a>
          <a href="#" className="hover:text-gray-900">Terms of Service</a>
          <a href="#" className="hover:text-gray-900">Accessibility Help</a>
        </div>
      </footer>
    </div>
  );
}