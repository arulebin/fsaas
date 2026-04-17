"use client";

import { useState, useEffect } from "react";

interface Factory {
  id: number;
  name: string;
  location: string;
  capacity: number;
  available: boolean;
  lat: number;
  lon: number;
}

interface Order {
  id: number;
  productName: string;
  quantity: number;
  status: string;
  clientLocation: { lat: number; lon: number };
  assignedFactoryId: number | null;
}

interface AppState {
  factories: Factory[];
  orders: Order[];
}

// For visual flair without extra dependencies
const FactoryIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function Home() {
  const [state, setState] = useState<AppState>({ factories: [], orders: [] });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchState = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/state");
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (e) {
      console.error("Failed to fetch state API. Is the backend running?", e);
    } finally {
      if (loading) {
        setLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchState();
    setTimeout(() => setIsRefreshing(false), 300);
  };

  useEffect(() => {
    let mounted = true;
    const initFetch = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/state");
        if (res.ok && mounted) {
          const data = await res.json();
          setState(data);
        }
      } catch (e) {
        console.error("Failed to fetch initial state", e);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    initFetch();
    
    return () => {
      mounted = false;
    };
  }, []);

  const createOrder = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: "Widget " + String.fromCharCode(65 + Math.floor(Math.random() * 26)),
          quantity: Math.floor(Math.random() * 40) + 10,
          clientLat: 40.7 + (Math.random() - 0.5),
          clientLon: -74.0 + (Math.random() - 0.5),
        }),
      });
      if (res.ok) fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  const assignOrder = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/orders/${id}/assign`, {
        method: "POST",
      });
      if (res.ok) {
        fetchState();
      } else {
        const err = await res.json();
        alert("Failed to allocate: " + err.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Connecting to Allocation Engine...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 font-sans p-4 sm:p-8">
      {/* Navbar section */}
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-center max-w-7xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <FactoryIcon />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Factory-as-a-Service</h1>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-0.5">Global Allocation Platform</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <button 
            onClick={handleRefresh}
            className={`p-2 rounded-full hover:bg-gray-100 transition-all ${isRefreshing ? 'animate-spin opacity-50' : ''}`}
            title="Refresh State"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-lg bg-gray-50">
            Active Nodes: {state.factories.length}
          </span>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {/* Factories Panel (The Supply) */}
        <section className="bg-white p-0 rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="bg-gray-50 border-b border-gray-200 p-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Production Grid</h2>
              <p className="text-sm text-gray-500 mt-1">Available manufacturing capacity</p>
            </div>
            <div className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
              Supply
            </div>
          </div>
          <div className="p-6 space-y-5 flex-1 overflow-y-auto">
            {state.factories.map((factory) => (
              <div key={factory.id} className="relative group p-5 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{factory.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <LocationIcon />
                      {factory.location} 
                      <span className="ml-2 text-xs opacity-60">
                        ({factory.lat.toFixed(2)}, {factory.lon.toFixed(2)})
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      factory.available ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"
                    }`}
                  >
                    {factory.available ? "Online" : "At Capacity"}
                  </span>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-600">Available Capacity</span>
                    <span className="font-bold text-gray-900">{factory.capacity} units</span>
                  </div>
                  {/* Visual capacity bar (Assuming 200 is absolute max for demo) */}
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-500 ${factory.capacity > 80 ? 'bg-blue-500' : factory.capacity > 20 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                      style={{ width: `${Math.min((factory.capacity / 200) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Orders Panel (The Demand) */}
        <section className="bg-white p-0 rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="bg-gray-50 border-b border-gray-200 p-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Incoming Orders</h2>
              <p className="text-sm text-gray-500 mt-1">Client production requests</p>
            </div>
            <button
              onClick={() => void createOrder()}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-black active:scale-95 transition-all flex items-center space-x-2"
            >
              <span>+</span>
              <span>New Order</span>
            </button>
          </div>
          <div className="p-6 space-y-5 flex-1 overflow-y-auto">
            {state.orders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 opacity-60">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-lg font-medium text-gray-600">No active requests</p>
                <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">Click &quot;New Order&quot; to simulate a client uploading product requirements.</p>
              </div>
            ) : (
              state.orders.map((order) => (
                <div key={order.id} className={`p-5 border rounded-xl transition-all duration-300 ${
                  order.status === 'assigned' ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
                }`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded">#{order.id}</span>
                        <h3 className="font-bold text-gray-900">{order.productName}</h3>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4M12 20V4" /></svg>
                          Req: {order.quantity} units
                        </span>
                        <span className="flex items-center truncate" title={`Lat: ${order.clientLocation.lat.toFixed(2)}, Lon: ${order.clientLocation.lon.toFixed(2)}`}>
                          <LocationIcon />
                          Client Loc
                        </span>
                      </div>
                    </div>
                    
                    <div className="shrink-0 w-full sm:w-auto">
                      {order.status === "pending" ? (
                        <button
                          onClick={() => void assignOrder(order.id)}
                          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-all text-center"
                        >
                          Auto-Assign Nearest
                        </button>
                      ) : (
                        <div className="flex items-center space-x-2 text-green-700 bg-green-100/50 px-4 py-2.5 rounded-lg text-sm font-medium border border-green-200">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          <span>Assigned to <span className="font-bold">Factory #{order.assignedFactoryId}</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

