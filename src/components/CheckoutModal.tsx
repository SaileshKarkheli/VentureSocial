import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Plane, Car, CreditCard, CheckCircle2, ChevronRight, Trash2, CheckSquare, Square, MapPin, Bed, Utensils, Camera, Clock } from 'lucide-react';
import { useApp } from '../AppContext';
import { getHaversineDistance } from '../utils/geo';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { cartItems, removeFromCart, flights, rentalCars, clearCart, customTripSpots, clearCustomTrip, toggleCustomSpot } = useApp();
  
  // Local state for selected add-ons per trip
  // Keyed by cartItem (post) ID
  const [selectedFlights, setSelectedFlights] = useState<Record<string, string>>({});
  const [selectedCars, setSelectedCars] = useState<Record<string, string>>({});
  const [deselectedInclusions, setDeselectedInclusions] = useState<Record<string, string[]>>({});
  const [travelersMap, setTravelersMap] = useState<Record<string, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSplitDays, setIsSplitDays] = useState(false);

  if (!isOpen) return null;

  const handleFlightSelect = (postId: string, flightId: string) => {
    setSelectedFlights(prev => ({
      ...prev,
      [postId]: prev[postId] === flightId ? '' : flightId
    }));
  };

  const handleCarSelect = (postId: string, carId: string) => {
    setSelectedCars(prev => ({
      ...prev,
      [postId]: prev[postId] === carId ? '' : carId
    }));
  };

  const handleInclusionToggle = (postId: string, inclusionId: string) => {
    setDeselectedInclusions(prev => {
      const current = prev[postId] || [];
      if (current.includes(inclusionId)) {
        return { ...prev, [postId]: current.filter(id => id !== inclusionId) };
      }
      return { ...prev, [postId]: [...current, inclusionId] };
    });
  };

  const calculateTotal = () => {
    let total = 0;
    
    // Add custom built trip
    if (customTripSpots.length > 0) {
      const customTravelers = travelersMap['custom-trip'] || 1;
      total += (customTripSpots.length * 150) * customTravelers; // Base tickets are linear
    }

    cartItems.forEach(item => {
      const deselected = deselectedInclusions[item.id] || [];
      const travelersCount = travelersMap[item.id] || 1;
      
      let hotelBase = item.price * 0.5;
      let ticketBase = item.price * 0.5;
      
      deselected.forEach(dId => {
        if (dId.startsWith('loc-')) {
          hotelBase -= (item.price * 0.1); 
          ticketBase -= (item.price * 0.1);
        } else if (dId.startsWith('act-')) {
          ticketBase -= (item.price * 0.1); 
        }
      });

      // Hotel Math: 1-2 people = 1 room. 3-4 = 2 rooms, etc.
      const hotelCost = Math.ceil(travelersCount / 2) * Math.max(0, hotelBase);
      // Tickets Math: Standard travelers * base_price
      const ticketCost = travelersCount * Math.max(0, ticketBase);
      total += hotelCost + ticketCost;

      const flightId = selectedFlights[item.id];
      if (flightId) {
        const flight = flights.find(f => f.id === flightId);
        if (flight) total += (flight.price * travelersCount);
      }

      const carId = selectedCars[item.id];
      if (carId) {
        const car = rentalCars.find(c => c.id === carId);
        if (car) {
          // Rentals: FIXED base price regardless of travelers
          total += (car.pricePerDay * 4); 
        }
      }
    });
    return total;
  };

  const handleCheckout = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      // Clean up after 2.5 seconds
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        clearCart();
        clearCustomTrip();
        setTravelersMap({});
        setSelectedFlights({});
        setSelectedCars({});
        setDeselectedInclusions({});
      }, 2500);
    }, 2000);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  // Content rendering based on state
  let content;

  if (isSuccess) {
    content = (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-green-500/20"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <h2 className="text-3xl font-display font-bold text-ink mb-2">Booking Confirmed!</h2>
        <p className="text-body max-w-sm">Your itinerary, flights, and car rentals are successfully booked. You're ready to go!</p>
      </div>
    );
  } else if (cartItems.length === 0 && customTripSpots.length === 0) {
    content = (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full">
        <div className="w-24 h-24 bg-cream rounded-full flex items-center justify-center text-muted mb-6">
          <ShoppingBag size={48} />
        </div>
        <h2 className="text-2xl font-display font-bold text-ink mb-2">Your Cart is Empty</h2>
        <p className="text-body max-w-sm mb-8">Browse the Discover feed to find your perfect itinerary.</p>
        <button onClick={onClose} className="px-8 py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 transition-colors shadow-lg">
          Start Exploring
        </button>
      </div>
    );
  } else {
    // Generating Contextual Clever Human Planner Path
    const DURATION_MAP: Record<string, number> = {
      'Hotel': 0, 'Restaurant': 1.5, 'Activity': 3, 'Transport': 0.5
    };

    let processedSpots = [...customTripSpots];
    let totalDuration = 0;

    if (processedSpots.length > 1) {
      const hotels = processedSpots.filter(s => (s as any).category === 'Hotel');
      const others = processedSpots.filter(s => (s as any).category !== 'Hotel');

      // Greedy Geographical Clustering for everything non-hotel
      for (let i = 0; i < others.length - 1; i++) {
        let closestIndex = i + 1;
        let minDistance = Infinity;
        const currentCoords = others[i].coordinates || { lat: 0, lng: 0 };
        for (let j = i + 1; j < others.length; j++) {
          const nextCoords = others[j].coordinates || { lat: 0, lng: 0 };
          const dist = getHaversineDistance(currentCoords.lat, currentCoords.lng, nextCoords.lat, nextCoords.lng);
          if (dist < minDistance) { minDistance = dist; closestIndex = j; }
        }
        const temp = others[i + 1]; others[i + 1] = others[closestIndex]; others[closestIndex] = temp;
      }

      processedSpots = [];
      // Executive Rule: Hotel must act as Terminal Bounds. Pin Start/End locations cleanly.
      if (hotels.length > 0) processedSpots.push(hotels[0]);
      processedSpots.push(...others);
      if (hotels.length > 1) processedSpots.push(hotels[1]);
    }

    // Temporal Calculation Sweep
    processedSpots.forEach(s => totalDuration += (DURATION_MAP[(s as any).category] || 3));
    if (processedSpots.length > 1) totalDuration += ((processedSpots.length - 1) * 0.5); // Average 30m travel buffer

    let dayMapping = [processedSpots];
    if (isSplitDays && processedSpots.length > 1) {
      const mid = Math.ceil(processedSpots.length / 2);
      dayMapping = [processedSpots.slice(0, mid), processedSpots.slice(mid)];
    }

    // Determine total
    const totalCost = calculateTotal();

    content = (
      <div className="flex flex-col md:flex-row h-full w-full overflow-hidden">
        {/* Left: Cart Items & Add-ons */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <div className="max-w-2xl mx-auto space-y-12 pb-24">
            
            {processedSpots.length > 0 && (
              <div className="space-y-8 pb-8 border-b-2 border-hairline border-dashed">
                <div className="bg-orange-500/10 border-2 border-orange-500 rounded-[2rem] p-6 flex flex-col items-start relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 text-orange-500 opacity-20 transform -translate-y-4 right-0 group-hover:scale-110 transition-transform"><CheckSquare size={120} /></div>
                  <h3 className="text-2xl font-display font-bold text-orange-500 mb-1 z-10">Remixed Journey</h3>
                  <p className="text-sm font-bold text-orange-600 mb-6 z-10">A custom curated auto-arranged itinerary.</p>
                  
                  <div className="flex items-center gap-2 bg-white rounded-full p-1 border border-orange-200 z-10 mb-4 shadow-sm">
                    <button onClick={() => setTravelersMap(prev => ({ ...prev, 'custom-trip': Math.max(1, (prev['custom-trip'] || 1) - 1) }))} className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold">-</button>
                    <span className="font-bold text-sm w-16 text-center text-orange-600">{travelersMap['custom-trip'] || 1} Travelers</span>
                    <button onClick={() => setTravelersMap(prev => ({ ...prev, 'custom-trip': (prev['custom-trip'] || 1) + 1 }))} className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold">+</button>
                  </div>

                  <button onClick={() => clearCustomTrip()} className="text-orange-600/70 hover:text-orange-600 font-bold text-sm flex items-center gap-1 z-10"><Trash2 size={16}/> Clear custom trip</button>

                  {/* Clever Human Planner Overstuffing Alert Container */}
                  {!isSplitDays && totalDuration > 9 && (
                    <div className="mt-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="bg-white border-2 border-ink p-4 flex flex-col md:flex-row items-center justify-between gap-4 z-10 shadow-lg relative" style={{ borderRadius: '0' }}>
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500"></div>
                        <div className="flex-1 px-4">
                          <h4 className="font-bold text-orange-600 uppercase tracking-widest text-xs flex items-center gap-1 mb-1">
                            <Clock size={12} className="text-orange-500" /> Clever Tip: Overstuffing Detected
                          </h4>
                          <p className="text-ink text-sm font-bold">This day is getting packed ({totalDuration} hrs estimated). Want to push the excess buffer to Day 2?</p>
                        </div>
                        <button 
                          onClick={() => setIsSplitDays(true)}
                          className="bg-ink text-white px-6 py-3 font-bold text-sm hover:bg-black transition-colors whitespace-nowrap shadow-md border border-transparent"
                          style={{ borderRadius: '0' }}
                        >
                          Split into Core Days
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Google Maps Visual Routing Component */}
                <div className="relative w-full h-[250px] rounded-[2rem] overflow-hidden border border-hairline shadow-inner bg-cream flex items-center justify-center group">
                  <iframe 
                    title="Google Maps Route Placeholder"
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    marginHeight={0} 
                    marginWidth={0} 
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(processedSpots[0].description)}&t=&z=10&ie=UTF8&iwloc=&output=embed`}
                    className="absolute inset-0 opacity-80 mix-blend-multiply filter grayscale contrast-125"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-ink shadow-md flex items-center gap-2 border border-hairline">
                    <MapPin size={14} className="text-orange-500" />
                    <span>Real-time Haversine Map Routing Active</span>
                  </div>
                </div>
                
                <div className="space-y-12">
                  {dayMapping.map((daySpots, dayIndex) => (
                    <div key={dayIndex} className="space-y-4">
                      <div className="flex items-center gap-2 text-ink ml-2">
                        <CheckSquare size={20} className="text-orange-500" />
                        <h4 className="font-bold text-lg">Proximity Sorted Travel Path {dayMapping.length > 1 ? `- Focus Day ${dayIndex + 1}` : ''}</h4>
                      </div>
                      <div className="relative flex flex-wrap gap-6 items-center content-center py-6">
                        {/* Linear Connection Path */}
                        {daySpots.length > 1 && (
                          <div className="absolute top-1/2 left-8 right-8 h-1 -translate-y-1/2 bg-transparent border-t-2 border-dashed border-orange-500/40 z-0 hidden md:block"></div>
                        )}
                        
                        {daySpots.map((spot, idx) => (
                          <div key={idx} className="p-4 rounded-2xl border-2 border-orange-500 bg-orange-500/5 shadow-md relative overflow-hidden group z-10 w-48 shrink-0 hover:scale-[1.02] transition-transform bg-white">
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleCustomSpot(spot); }}
                              className="absolute top-2 left-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white shadow-lg z-20 transition-all font-bold opacity-0 group-hover:opacity-100 border border-hairline"
                            >
                              <X size={14} />
                            </button>
                            <div className="absolute top-2 right-2 text-white font-bold bg-orange-500 rounded-lg px-2 py-0.5 text-xs z-10 shadow-sm border border-orange-600">
                              Stop {idx + 1}
                            </div>
                            <div className="h-24 mb-3 -mx-2 -mt-2 relative">
                              <img src={spot.url} className="w-full h-full object-cover rounded-t-xl" alt="Location" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                            </div>
                            <h5 className="font-bold text-sm mb-1 line-clamp-1 text-ink">{spot.description}</h5>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-orange-500 font-bold text-sm">{formatPrice(150)}</span>
                              {(spot as any).category && <span className="text-body text-[9px] font-bold uppercase tracking-widest bg-cream px-1.5 py-0.5 rounded-md border border-hairline">{(spot as any).category}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cartItems.map((item) => (
              <div key={item.id} className="space-y-8">
                {/* Trip Card */}
                <div className="bg-white border-2 border-hairline rounded-[2rem] p-6 flex flex-col md:flex-row gap-6 items-center md:items-start group">
                  <div className="w-full md:w-32 h-32 rounded-2xl overflow-hidden shrink-0 relative bg-cream">
                    <img src={item.images?.[0]?.url || item.avatar} alt="Trip" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-display font-bold text-ink">{item.location} Itinerary</h3>
                        <p className="text-sm text-body mb-2">Curated by {item.user}</p>
                        
                        {/* 4 Active Core Categories strictly enforced natively by visual logic */}
                        <div className="flex flex-wrap gap-2">
                          <span className="flex items-center gap-1 border border-hairline bg-white text-[10px] font-bold uppercase tracking-widest text-ink px-2 py-0.5 rounded-md"><Bed size={10} className="text-orange-500"/> Hotel</span>
                          <span className="flex items-center gap-1 border border-hairline bg-white text-[10px] font-bold uppercase tracking-widest text-ink px-2 py-0.5 rounded-md"><Utensils size={10} className="text-orange-500"/> Restaurant</span>
                          <span className="flex items-center gap-1 border border-hairline bg-white text-[10px] font-bold uppercase tracking-widest text-ink px-2 py-0.5 rounded-md"><Plane size={10} className="text-orange-500"/> Transport</span>
                          <span className="flex items-center gap-1 border border-hairline bg-white text-[10px] font-bold uppercase tracking-widest text-ink px-2 py-0.5 rounded-md"><Camera size={10} className="text-orange-500"/> Activity</span>
                        </div>
                      </div>
                      <div className="text-right hidden md:block">
                        <span className="font-bold text-xl text-ink">{formatPrice(item.price)} <span className="text-sm text-body font-medium">/ person</span></span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                      <div className="flex items-center gap-2 bg-cream rounded-full p-1 border border-hairline">
                        <button 
                          onClick={() => setTravelersMap(prev => ({ ...prev, [item.id]: Math.max(1, (prev[item.id] || 1) - 1) }))}
                          className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-body hover:text-orange-500 font-bold shadow-sm"
                        >-</button>
                        <span className="font-bold text-sm w-16 text-center">{travelersMap[item.id] || 1} Traveler{(travelersMap[item.id] || 1) !== 1 ? 's' : ''}</span>
                        <button 
                          onClick={() => setTravelersMap(prev => ({ ...prev, [item.id]: (prev[item.id] || 1) + 1 }))}
                          className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-body hover:text-orange-500 font-bold shadow-sm"
                        >+</button>
                      </div>
                      <span className="text-sm font-bold text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full">Base Trip Cost</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-muted hover:text-rose-500 flex items-center gap-1 text-sm font-medium transition-colors">
                        <Trash2 size={16} /> Remove Trip
                      </button>
                    </div>
                  </div>
                </div>

                {/* Locations (Days) Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-ink ml-2">
                    <CheckSquare size={20} className="text-orange-500" />
                    <h4 className="font-bold text-lg">Included Locations</h4>
                    <span className="text-xs font-bold text-muted ml-2 uppercase tracking-widest">(Deselect to Exclude)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(item.images || []).map((img, idx) => {
                      // Using the image description or fallback to "Location X"
                      const locName = img.description || `Location ${idx + 1}`;
                      const incId = `loc-${idx}`;
                      const isDeselected = (deselectedInclusions[item.id] || []).includes(incId);
                      const locPrice = item.price * 0.2; // Each location is worth 20% of base
                      
                      return (
                        <button
                          key={incId}
                          onClick={() => handleInclusionToggle(item.id, incId)}
                          className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${!isDeselected ? 'border-orange-500 bg-orange-500/5 shadow-md scale-[1.02]' : 'border-hairline hover:border-zinc-300 bg-white opacity-60'}`}
                        >
                          {!isDeselected ? (
                            <div className="absolute top-2 right-2 text-orange-500 z-10 bg-white rounded-full">
                              <CheckCircle2 size={18} className="fill-orange-500 text-white" />
                            </div>
                          ) : (
                            <div className="absolute top-2 right-2 text-zinc-300 z-10 bg-white rounded-full">
                              <Square size={18} className="text-zinc-300" />
                            </div>
                          )}
                          <div className="h-20 mb-3 -mx-2 -mt-2">
                            <img src={img.url} className="w-full h-full object-cover rounded-t-xl" alt="Location" />
                          </div>
                          <h5 className={`font-bold mb-1 line-clamp-1 ${isDeselected ? 'text-muted line-through' : 'text-ink'}`}>
                            {locName}
                          </h5>
                          <span className={`${isDeselected ? 'text-muted' : 'text-orange-500'} font-bold`}>{formatPrice(locPrice)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Activities Selection */}
                {item.activities && item.activities.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-ink ml-2">
                      <CheckSquare size={20} className="text-orange-500" />
                      <h4 className="font-bold text-lg">Included Activities</h4>
                      <span className="text-xs font-bold text-muted ml-2 uppercase tracking-widest">(Deselect to Exclude)</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {item.activities.map((activity, idx) => {
                        const incId = `act-${idx}`;
                        const isDeselected = (deselectedInclusions[item.id] || []).includes(incId);
                        const actPrice = item.price * 0.1; // Activities worth 10%
                        
                        return (
                          <button
                            key={incId}
                            onClick={() => handleInclusionToggle(item.id, incId)}
                            className={`p-3 rounded-xl border-2 text-center transition-all ${!isDeselected ? 'border-orange-500 bg-orange-500/5 shadow-md' : 'border-hairline hover:border-zinc-300 bg-white opacity-60'}`}
                          >
                            <h5 className={`font-bold text-sm mb-1 ${isDeselected ? 'text-muted line-through' : 'text-ink'}`}>
                              {activity}
                            </h5>
                            <span className={`${isDeselected ? 'text-muted' : 'text-orange-500'} font-bold text-xs`}>{formatPrice(actPrice)}</span>
                            <div className="mt-2 flex justify-center">
                              {!isDeselected ? <CheckCircle2 size={14} className="text-orange-500" /> : <Square size={14} className="text-zinc-300" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Flights Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-ink ml-2">
                    <Plane size={20} className="text-orange-500" />
                    <h4 className="font-bold text-lg">Add Flights</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {flights.map(flight => {
                      const isSelected = selectedFlights[item.id] === flight.id;
                      return (
                        <button
                          key={flight.id}
                          onClick={() => handleFlightSelect(item.id, flight.id)}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${isSelected ? 'border-orange-500 bg-orange-500/5 shadow-md scale-[1.02]' : 'border-hairline hover:border-zinc-300 bg-white'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-muted">{flight.airline}</span>
                            {isSelected && <CheckCircle2 size={16} className="text-orange-500" />}
                          </div>
                          <h5 className="font-bold text-ink mb-1">{flight.class}</h5>
                          <div className="flex items-end justify-between">
                            <span className="text-orange-500 font-bold">{formatPrice(flight.price)}</span>
                            <span className="text-xs text-body">{flight.duration}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Car Rental Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-ink ml-2">
                    <div className="flex items-center gap-2">
                      <Car size={20} className="text-orange-500" />
                      <h4 className="font-bold text-lg">Add Rental Car (4 Days)</h4>
                    </div>
                    {(travelersMap[item.id] || 1) > 4 && (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
                        Note: SUV/Van recommended for groups 5+
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {rentalCars.map(car => {
                      const isSelected = selectedCars[item.id] === car.id;
                      return (
                        <button
                          key={car.id}
                          onClick={() => handleCarSelect(item.id, car.id)}
                          className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${isSelected ? 'border-orange-500 bg-orange-500/5 shadow-md scale-[1.02]' : 'border-hairline hover:border-zinc-300 bg-white'}`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 text-orange-500 z-10">
                              <CheckCircle2 size={16} />
                            </div>
                          )}
                          <div className="h-16 mb-2 -mx-2 -mt-2 opacity-80 mix-blend-multiply">
                            <img src={car.image} className="w-full h-full object-cover rounded-t-xl" alt="Car" />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest text-muted">{car.company}</span>
                          <h5 className="font-bold text-ink mb-1">{car.type}</h5>
                          <p className="text-orange-500 font-bold">{formatPrice(car.pricePerDay)} <span className="text-xs font-medium text-body">/day</span></p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Order Summary Sidebar */}
        <div className="w-full md:w-96 bg-tint border-t md:border-t-0 md:border-l border-hairline p-6 md:p-8 flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] z-10">
          <h3 className="text-2xl font-display font-bold text-ink mb-8">Order Summary</h3>
          
          <div className="flex-1 space-y-6">
            {cartItems.map(item => {
              const flightsCount = travelersMap[item.id] || 1;
              const fId = selectedFlights[item.id];
              const flight = fId ? flights.find(f => f.id === fId) : null;
              
              const cId = selectedCars[item.id];
              const car = cId ? rentalCars.find(c => c.id === cId) : null;

              const deselected = deselectedInclusions[item.id] || [];
              let hotelBase = item.price * 0.5;
              let ticketBase = item.price * 0.5;
              
              deselected.forEach(dId => {
                if (dId.startsWith('loc-')) {
                  hotelBase -= (item.price * 0.1);
                  ticketBase -= (item.price * 0.1);
                } else if (dId.startsWith('act-')) {
                  ticketBase -= (item.price * 0.1);
                }
              });

              const hotelCost = Math.ceil(flightsCount / 2) * Math.max(0, hotelBase);
              const ticketCost = flightsCount * Math.max(0, ticketBase);
              const totalTripCost = hotelCost + ticketCost;
              const totalCarCost = car ? (car.pricePerDay * 4) : 0;

              return (
                <div key={`summary-${item.id}`} className="space-y-4 pb-6 border-b border-hairline last:border-0 p-4 bg-white rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-ink text-sm leading-tight pr-4">{item.location} Trip (x{flightsCount})</span>
                    <span className="font-bold text-body shrink-0">{formatPrice(totalTripCost)}</span>
                  </div>
                  {flight && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-body flex items-center gap-1.5"><Plane size={14}/> Flight (x{flightsCount})</span>
                      <span className="font-bold text-zinc-700">{formatPrice(flight.price * flightsCount)}</span>
                    </div>
                  )}
                  {car && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-body flex items-center gap-1.5"><Car size={14}/> Car (4 days)</span>
                      <span className="font-bold text-zinc-700">{formatPrice(totalCarCost)}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Custom Trip Summary Addition */}
            {processedSpots.length > 0 && (
              <div className="space-y-4 pb-6 border-b border-hairline p-4 bg-orange-50/50 rounded-2xl border border-orange-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-orange-600 text-sm leading-tight pr-4">Custom Remixed Journey (x{travelersMap['custom-trip'] || 1})</span>
                  <span className="font-bold text-orange-600 shrink-0">{formatPrice(processedSpots.length * 150 * (travelersMap['custom-trip'] || 1))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold text-orange-600/70 uppercase tracking-widest">{processedSpots.length} Checkpoints</div>
                  <div className="text-[10px] font-bold text-ink uppercase tracking-widest">{dayMapping.length} Days Assigned</div>
                </div>
              </div>
            )}

          </div>

          <div className="mt-8 pt-6 border-t-2 border-hairline space-y-6">
            <div className="flex justify-between items-end">
              <span className="text-body font-bold uppercase tracking-widest text-xs">Total Due</span>
              <span className="text-4xl font-display font-bold text-ink">{formatPrice(totalCost)}</span>
            </div>
            
            <button 
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full bg-ink text-white font-bold py-5 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 group shadow-xl shadow-black/10 disabled:opacity-70 disabled:cursor-wait"
            >
              {isProcessing ? (
                <span>Processing...</span>
              ) : (
                <>
                  <CreditCard size={20} />
                  <span>Complete Booking</span>
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <div className="text-center text-xs text-muted font-medium flex items-center justify-center gap-1">
              <CheckCircle2 size={12} /> Secure encrypted checkout
            </div>
          </div>
        </div>
      </div>
    );
  }

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-ink/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full h-full sm:h-[90vh] max-w-6xl bg-white sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header Bar */}
          <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-50">
             <button 
              onClick={onClose}
              className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-hairline text-body hover:text-rose-500 hover:bg-rose-50 transition-all font-bold"
            >
              <X size={20} />
            </button>
          </div>

          <div className="absolute top-6 sm:top-8 left-6 sm:left-8 z-40 hidden sm:flex items-center gap-3">
             <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
               <ShoppingBag size={20} />
             </div>
             <h1 className="text-xl font-display font-bold text-ink">Checkout</h1>
          </div>

          {/* Spacer for header on mobile */}
          <div className="h-20 sm:h-24 shrink-0 border-b border-hairline flex items-center px-6 sm:hidden">
            <div className="flex items-center gap-2">
               <ShoppingBag size={20} className="text-orange-500" />
               <h1 className="text-xl font-display font-bold text-ink">Checkout</h1>
            </div>
          </div>

          {content}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
