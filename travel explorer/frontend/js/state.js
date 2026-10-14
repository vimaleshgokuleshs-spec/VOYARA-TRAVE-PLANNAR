/* ==========================================================================
   VOYARA APPLICATION STATE MANAGEMENT
   Reactive store for destinations, trips, builder state, and favorites
   Integrated with FastAPI backend and SQLite database
   ========================================================================== */

class VoyaraState {
  constructor() {
    this.destinations = [...VOYARA_DATA.destinations];
    this.trips = [...VOYARA_DATA.initial_trips];
    this.favorites = new Set([1, 2]); // default sample favorites for guest
    this.currentView = 'discover';
    this.activeDestinationId = null;
    this.currentUser = null;
    
    // Active trip being edited in the builder / viewed in budget
    this.activeTrip = JSON.parse(JSON.stringify(this.trips[0]));

    // Simulator adjustments for budget view
    this.budgetSimulator = {
      stayTier: "boutique", // luxury (1.6x), boutique (1.0x), cozy (0.6x)
      transitTier: "standard", // private (1.8x), standard (1.0x), transit (0.4x)
      diningTier: "balanced" // fine (1.7x), balanced (1.0x), local (0.5x)
    };

    // Listeners
    this.subscribers = new Map();
  }

  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event).push(callback);
  }

  notify(event, data) {
    if (this.subscribers.has(event)) {
      this.subscribers.get(event).forEach(cb => cb(data));
    }
  }

  // Initial load from backend
  async init() {
    await this.loadDestinationsFromBackend();
  }

  async loadDestinationsFromBackend() {
    try {
      const res = await fetch('/api/destinations');
      if (res.ok) {
        const backendDestinations = await res.json();
        if (backendDestinations && backendDestinations.length > 0) {
          // Merge backend destinations with rich client metadata (tags, gallery, sample activities)
          this.destinations = backendDestinations.map(bd => {
            const staticDest = VOYARA_DATA.destinations.find(sd => sd.id === bd.id) || {};
            return {
              ...staticDest,
              ...bd,
              // Ensure whole-dollar pricing is preserved
              estimated_daily_cost: bd.estimated_daily_cost || staticDest.estimated_daily_cost || 200,
              tags: staticDest.tags || ["Curated", "Sanctuary"],
              gallery: staticDest.gallery || [bd.image_url],
              sample_activities: staticDest.sample_activities || []
            };
          });
          this.notify('destinationsLoaded', this.destinations);
        }
      }
    } catch (e) {
      // Offline fallback: keep VOYARA_DATA.destinations
      console.warn("Using offline fallback destinations store:", e);
    }
  }

  async loadUserTrips() {
    if (!this.currentUser) return;
    try {
      const res = await fetch('/api/trips', { credentials: 'include' });
      if (res.ok) {
        const backendTrips = await res.json();
        if (backendTrips && backendTrips.length > 0) {
          this.trips = backendTrips;
          this.activeTrip = JSON.parse(JSON.stringify(this.trips[0]));
          this.notify('tripsChanged', this.trips);
          this.notify('activeTripChanged', this.activeTrip);
        }
      }
    } catch (e) {
      console.warn("Could not load user trips from backend:", e);
    }
  }

  async loadUserFavorites() {
    if (!this.currentUser) return;
    try {
      const res = await fetch('/api/favorites', { credentials: 'include' });
      if (res.ok) {
        const favs = await res.json();
        this.favorites = new Set(favs.map(f => f.destination_id));
        this.notify('favoritesChanged', { total: this.favorites.size });
      }
    } catch (e) {
      console.warn("Could not load user favorites from backend:", e);
    }
  }

  // Favorites
  async toggleFavorite(destinationId) {
    const id = Number(destinationId);
    let isFav = false;

    if (this.favorites.has(id)) {
      this.favorites.delete(id);
      isFav = false;
      if (this.currentUser) {
        try {
          await fetch(`/api/favorites/${id}`, { method: 'DELETE', credentials: 'include' });
        } catch (e) {}
      }
    } else {
      this.favorites.add(id);
      isFav = true;
      if (this.currentUser) {
        try {
          await fetch(`/api/favorites/${id}`, { method: 'POST', credentials: 'include' });
        } catch (e) {}
      }
    }

    this.notify('favoritesChanged', { id, isFav, total: this.favorites.size });
    return isFav;
  }

  isFavorite(destinationId) {
    return this.favorites.has(Number(destinationId));
  }

  getFavoriteDestinations() {
    return this.destinations.filter(d => this.favorites.has(d.id));
  }

  // Active Trip & Builder
  setActiveTripById(tripId) {
    const trip = this.trips.find(t => t.id === Number(tripId));
    if (trip) {
      this.activeTrip = JSON.parse(JSON.stringify(trip));
      this.notify('activeTripChanged', this.activeTrip);
    }
  }

  createTripForDestination(destId) {
    const dest = this.destinations.find(d => d.id === Number(destId)) || this.destinations[0];
    const newTrip = {
      id: Date.now(),
      title: `${dest.name} Horizon Expedition`,
      destination_id: dest.id,
      destination_name: `${dest.name}, ${dest.country}`,
      destination_img: dest.image_url,
      start_date: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      end_date: new Date(Date.now() + 86400000 * 35).toISOString().split('T')[0],
      days_count: dest.ideal_days || 5,
      travellers: 2,
      budget: dest.estimated_daily_cost * (dest.ideal_days || 5) * 2,
      status: "Draft",
      days: []
    };

    // Auto generate days
    for (let i = 1; i <= newTrip.days_count; i++) {
      newTrip.days.push({
        day_number: i,
        date: new Date(new Date(newTrip.start_date).getTime() + (i - 1) * 86400000).toISOString().split('T')[0],
        notes: `Day ${i} in ${dest.name}`,
        activities: i === 1 && dest.sample_activities ? JSON.parse(JSON.stringify(dest.sample_activities)) : []
      });
    }

    this.activeTrip = newTrip;
    this.trips.unshift(newTrip);
    this.notify('activeTripChanged', this.activeTrip);
    this.notify('tripsChanged', this.trips);
    return newTrip;
  }

  async saveActiveTripToBackend() {
    if (!this.activeTrip) return { saved: false, reason: "No active trip" };
    if (!this.currentUser) return { saved: false, reason: "unauthenticated" };

    try {
      const trip = this.activeTrip;
      const isExistingBackendTrip = trip.id && trip.id < 1000000000000;

      const payload = {
        title: trip.title,
        destination_id: trip.destination_id,
        start_date: trip.start_date || new Date().toISOString().split('T')[0],
        end_date: trip.end_date || new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
        travellers: trip.travellers || 2,
        budget: trip.budget || 2000,
        status: trip.status || "Draft",
        days: trip.days || []
      };

      let res;
      if (isExistingBackendTrip) {
        // Sync full hierarchy to existing trip
        res = await fetch(`/api/trips/${trip.id}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
      } else {
        // Create new trip on backend
        res = await fetch('/api/trips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        const savedData = await res.json();
        this.activeTrip = savedData;

        // Replace or add in this.trips
        const existingIdx = this.trips.findIndex(t => t.id === trip.id || t.id === savedData.id);
        if (existingIdx !== -1) {
          this.trips[existingIdx] = savedData;
        } else {
          this.trips.unshift(savedData);
        }

        this.notify('activeTripChanged', this.activeTrip);
        this.notify('tripsChanged', this.trips);
        return { saved: true, trip: savedData };
      } else {
        const err = await res.json().catch(() => ({}));
        return { saved: false, reason: err.detail || "Failed to save trip to backend" };
      }
    } catch (e) {
      return { saved: false, reason: "Connection to trip server failed" };
    }
  }

  async deleteTrip(tripId) {
    const id = Number(tripId);
    if (this.currentUser && id < 1000000000000) {
      try {
        await fetch(`/api/trips/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
      } catch (e) {
        console.warn("Could not delete trip from backend:", e);
      }
    }

    this.trips = this.trips.filter(t => t.id !== id);
    if (this.activeTrip && this.activeTrip.id === id) {
      this.activeTrip = this.trips[0] || null;
      this.notify('activeTripChanged', this.activeTrip);
    }
    this.notify('tripsChanged', this.trips);
    return true;
  }

  // Rule-based Smart Itinerary Generator (No paid AI APIs)
  generateRuleBasedItinerary(destinationId, daysCount, pace = "balanced") {
    const dest = this.destinations.find(d => d.id === Number(destinationId)) || this.destinations[0];
    const generatedDays = [];
    const activitiesPool = [
      ...(dest.sample_activities || []),
      { time: "09:00 AM", title: `Explore Historic Old Quarters of ${dest.name}`, category: "Culture", cost: 30, desc: "Guided heritage walk through cobblestone alleys and local markets." },
      { time: "11:30 AM", title: "Scenic Viewpoint & Photography Expedition", category: "Adventure", cost: 20, desc: "Trek to premier vistas capturing panoramic horizons." },
      { time: "01:00 PM", title: "Authentic Regional Culinary Feast", category: "Culinary", cost: 45, desc: "Sample seasonal specialties and locally sourced delicacies." },
      { time: "03:30 PM", title: "Coastal Lagoon or Thermal Bath Relaxation", category: "Relaxation", cost: 40, desc: "Unwind in restorative natural settings with azure vistas." },
      { time: "06:00 PM", title: "Sunset Harbor or Hilltop Drink", category: "Relaxation", cost: 25, desc: "Toast the golden hour with regional wines and hors d'oeuvres." },
      { time: "08:00 PM", title: "Starlight Dining Under Open Skies", category: "Culinary", cost: 70, desc: "Atmospheric dinner listening to native melodies." }
    ];

    const activitiesPerDay = pace === "relaxed" ? 2 : pace === "adventurous" ? 4 : 3;

    for (let d = 1; d <= daysCount; d++) {
      const dayActivities = [];
      const offset = (d - 1) % 3;
      for (let a = 0; a < activitiesPerDay; a++) {
        const item = activitiesPool[(offset + a) % activitiesPool.length];
        dayActivities.push({
          id: Date.now() + d * 100 + a,
          ...item
        });
      }

      generatedDays.push({
        day_number: d,
        date: new Date(Date.now() + (d - 1) * 86400000).toISOString().split('T')[0],
        notes: `Day ${d}: ${dest.name} curated ${pace} schedule`,
        activities: dayActivities
      });
    }

    if (this.activeTrip) {
      this.activeTrip.days = generatedDays;
      this.activeTrip.days_count = daysCount;
      this.notify('activeTripChanged', this.activeTrip);
    }

    return generatedDays;
  }

  // Budget Calculations
  calculateBudget() {
    if (!this.activeTrip) return null;

    const dest = this.destinations.find(d => d.id === this.activeTrip.destination_id) || this.destinations[0];
    const days = this.activeTrip.days_count || (this.activeTrip.days ? this.activeTrip.days.length : 5);
    const travellers = this.activeTrip.travellers || 2;

    // Total Activities cost from actual items in days
    let activitiesCost = 0;
    if (this.activeTrip.days) {
      this.activeTrip.days.forEach(day => {
        if (day.activities) {
          day.activities.forEach(act => {
            activitiesCost += (act.cost || 0) * travellers;
          });
        }
      });
    }

    // Baseline daily estimates adjusted by simulator
    let stayMultiplier = 1.0;
    if (this.budgetSimulator.stayTier === "luxury") stayMultiplier = 1.7;
    if (this.budgetSimulator.stayTier === "cozy") stayMultiplier = 0.6;

    let transitMultiplier = 1.0;
    if (this.budgetSimulator.transitTier === "private") transitMultiplier = 1.8;
    if (this.budgetSimulator.transitTier === "transit") transitMultiplier = 0.4;

    let diningMultiplier = 1.0;
    if (this.budgetSimulator.diningTier === "fine") diningMultiplier = 1.6;
    if (this.budgetSimulator.diningTier === "local") diningMultiplier = 0.5;

    const dailyPace = dest ? (dest.estimated_daily_cost || 250) : 250;
    const accommodationTotal = Math.round(dailyPace * 0.45 * stayMultiplier * days * travellers);
    const transitTotal = Math.round(dailyPace * 0.15 * transitMultiplier * days * travellers);
    const diningTotal = Math.round(dailyPace * 0.25 * diningMultiplier * days * travellers);
    const miscTotal = Math.round(dailyPace * 0.10 * days * travellers);

    const grandTotal = accommodationTotal + activitiesCost + transitTotal + diningTotal + miscTotal;
    const targetBudget = this.activeTrip.budget || grandTotal;
    const costPerPerson = Math.round(grandTotal / (travellers || 1));
    const costPerPersonPerDay = Math.round(costPerPerson / (days || 1));

    return {
      grandTotal,
      targetBudget,
      isUnderBudget: grandTotal <= targetBudget,
      percentOfBudget: Math.min(100, Math.round((grandTotal / targetBudget) * 100)),
      costPerPerson,
      costPerPersonPerDay,
      travellers,
      days,
      categories: [
        { name: "Accommodations", amount: accommodationTotal, pct: Math.round((accommodationTotal / grandTotal) * 100), colorClass: "dot-stay" },
        { name: "Curated Activities", amount: activitiesCost, pct: Math.round((activitiesCost / grandTotal) * 100), colorClass: "dot-activity" },
        { name: "Flights & Transit", amount: transitTotal, pct: Math.round((transitTotal / grandTotal) * 100), colorClass: "dot-transit" },
        { name: "Dining & Culinary", amount: diningTotal, pct: Math.round((diningTotal / grandTotal) * 100), colorClass: "dot-dining" },
        { name: "Miscellaneous & Buffer", amount: miscTotal, pct: Math.round((miscTotal / grandTotal) * 100), colorClass: "dot-stay" }
      ]
    };
  }
}

// Global state instance
const voyaraState = new VoyaraState();
window.voyaraState = voyaraState;
