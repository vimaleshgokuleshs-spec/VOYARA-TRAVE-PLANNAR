/* ==========================================================================
   VOYARA DATA STORE - CURATED GLOBAL HORIZONS & SAMPLE ITINERARIES
   Realistic coordinates, seasonal windows, and monetary estimates
   ========================================================================== */

const VOYARA_DATA = {
  destinations: [
    {
      id: 1,
      name: "Bora Bora",
      country: "French Polynesia",
      region: "Oceania",
      description: "Turquoise lagoon paradise ringed by coral reefs and crowned by Mount Otemanu, featuring world-famous overwater villas and pristine atolls.",
      best_travel_months: "May - Oct",
      estimated_daily_cost: 380, // in USD
      latitude: -16.5004,
      longitude: -151.7415,
      image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      rating: 4.98,
      ideal_days: 6,
      tags: ["Tropical", "Luxury", "Islands", "Lagoon"],
      gallery: [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=800&q=80"
      ],
      sample_activities: [
        { time: "09:00 AM", title: "Private Lagoon Outrigger & Manta Ray Snorkel", category: "Adventure", cost: 140, desc: "Sail across crystal shallow waters and swim alongside majestic gentle rays." },
        { time: "01:00 PM", title: "Polynesian Motu Barbecue Lunch", category: "Culinary", cost: 65, desc: "Fresh mahi-mahi ceviche served on a secluded private islet." },
        { time: "05:30 PM", title: "Sunset Catamaran Cruise around Mt. Otemanu", category: "Relaxation", cost: 95, desc: "Champagne cruise with unobstructed twilight lagoon reflections." }
      ]
    },
    {
      id: 2,
      name: "Amalfi Coast",
      country: "Italy",
      region: "Europe",
      description: "Dramatic Mediterranean cliffs dotted with pastel villas, fragrant lemon terraces, and sparkling sapphire coastal waters.",
      best_travel_months: "Apr - Oct",
      estimated_daily_cost: 260,
      latitude: 40.6340,
      longitude: 14.6027,
      image_url: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
      rating: 4.92,
      ideal_days: 5,
      tags: ["Coastline", "Culture", "Culinary", "Scenic"],
      gallery: [
        "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=800&q=80"
      ],
      sample_activities: [
        { time: "08:30 AM", title: "Path of the Gods (Sentiero degli Dei) Hike", category: "Adventure", cost: 45, desc: "Spectacular clifftop trail above Positano with panoramic views." },
        { time: "01:30 PM", title: "Artisan Limoncello & Clifftop Trattoria Tasting", category: "Culinary", cost: 75, desc: "Handmade scialatielli pasta paired with cliffside organic lemons." },
        { time: "06:00 PM", title: "Private Wooden Gozzo Boat Tour to Capri", category: "Relaxation", cost: 160, desc: "Swim in emerald sea grottos and relax under the golden sunset." }
      ]
    },
    {
      id: 3,
      name: "Kyoto",
      country: "Japan",
      region: "Asia",
      description: "Ancient imperial sanctuaries, moss-carpeted Zen gardens, serene Arashiyama bamboo groves, and timeless geisha quarters.",
      best_travel_months: "Mar - May, Oct - Nov",
      estimated_daily_cost: 175,
      latitude: 35.0116,
      longitude: 135.7681,
      image_url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
      rating: 4.96,
      ideal_days: 5,
      tags: ["Heritage", "Temples", "Gardens", "Culinary"],
      gallery: [
        "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=800&q=80"
      ],
      sample_activities: [
        { time: "07:00 AM", title: "Early Morning Torii Gates at Fushimi Inari", category: "Culture", cost: 20, desc: "Peaceful walk through thousands of vermilion shrine gates without crowds." },
        { time: "11:30 AM", title: "Traditional Matcha Ceremony at Daitoku-ji", category: "Culture", cost: 50, desc: "Authentic meditative tea ritual led by a Japanese Zen tea master." },
        { time: "06:30 PM", title: "Kaiseki Multi-Course Dinner in Gion", category: "Culinary", cost: 120, desc: "Exquisite seasonal dishes highlighting Kyoto culinary heritage." }
      ]
    },
    {
      id: 4,
      name: "Banff & Lake Louise",
      country: "Canada",
      region: "Americas",
      description: "Electric turquoise glacial lakes, soaring Canadian Rocky peaks, alpine wildlife sanctuaries, and pristine pine wilderness.",
      best_travel_months: "Jun - Sep, Dec - Mar",
      estimated_daily_cost: 210,
      latitude: 51.1784,
      longitude: -115.5708,
      image_url: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=1200&q=80",
      rating: 4.95,
      ideal_days: 6,
      tags: ["Mountains", "Glacial", "Adventure", "Nature"],
      gallery: [
        "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80"
      ],
      sample_activities: [
        { time: "08:00 AM", title: "Sunrise Canoe on Lake Moraine", category: "Adventure", cost: 95, desc: "Paddle across glass-still neon cyan waters reflecting the Valley of the Ten Peaks." },
        { time: "01:00 PM", title: "Plain of Six Glaciers Teahouse Trek", category: "Adventure", cost: 35, desc: "Scenic alpine hike to a historic off-grid teahouse serving fresh pies." },
        { time: "05:00 PM", title: "Banff Upper Hot Springs Thermal Soak", category: "Relaxation", cost: 25, desc: "Rejuvenating 40°C mineral waters with panoramic mountain views." }
      ]
    },
    {
      id: 5,
      name: "Santorini",
      country: "Greece",
      region: "Europe",
      description: "Whitewashed cycladic architecture, cobalt blue domes, volcanic caldera panoramas, and iconic Aegean golden hour sunsets.",
      best_travel_months: "May - Oct",
      estimated_daily_cost: 245,
      latitude: 36.3932,
      longitude: 25.4615,
      image_url: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80",
      rating: 4.93,
      ideal_days: 4,
      tags: ["Islands", "Sunsets", "Romance", "Coastline"],
      gallery: [
        "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80"
      ],
      sample_activities: [
        { time: "10:00 AM", title: "Caldera Catamaran Cruise & Hot Springs", category: "Adventure", cost: 110, desc: "Sail inside the caldera crater with snorkeling at Red Beach and hot sulfur springs." },
        { time: "03:30 PM", title: "Assyrtiko Wine Tasting on Volcanic Terraces", category: "Culinary", cost: 65, desc: "Crisp minerality indigenous wine pairings overlooking the Aegean cliffs." },
        { time: "07:00 PM", title: "Oia Clifftop Sunset Experience", category: "Relaxation", cost: 40, desc: "Prime terrace view of the sun melting into the Mediterranean sea." }
      ]
    },
    {
      id: 6,
      name: "Reykjavik & Golden Circle",
      country: "Iceland",
      region: "Europe",
      description: "Land of living fire and ice: geothermal hot springs, thunderous waterfalls, black sand beaches, and dancing Aurora Borealis.",
      best_travel_months: "Jun - Aug (Midnight Sun), Sep - Mar (Northern Lights)",
      estimated_daily_cost: 290,
      latitude: 64.1466,
      longitude: -21.9426,
      image_url: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1200&q=80",
      rating: 4.94,
      ideal_days: 7,
      tags: ["Geothermal", "Aurora", "Waterfalls", "Adventure"],
      gallery: [
        "https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80"
      ],
      sample_activities: [
        { time: "09:00 AM", title: "Silfra Fissure Snorkel Between Continents", category: "Adventure", cost: 155, desc: "Float in 100-meter visibility glacial spring waters between tectonic plates." },
        { time: "02:00 PM", title: "Gullfoss Waterfall & Strokkur Geysir Expedition", category: "Adventure", cost: 70, desc: "Witness massive cascades and volcanic boiling geysers erupting every 6 minutes." },
        { time: "06:00 PM", title: "Blue Lagoon Luxury Geothermal Spa & Silica Mask", category: "Relaxation", cost: 115, desc: "Mineral-rich milky cyan thermal pools surrounded by volcanic lava fields." }
      ]
    },
    {
      id: 7,
      name: "Bali & Nusa Islands",
      country: "Indonesia",
      region: "Asia",
      description: "Tropical spiritual haven of emerald tiered rice terraces, sacred sea temples, world-class surf, and vibrant wellness retreats.",
      best_travel_months: "Apr - Oct",
      estimated_daily_cost: 95,
      latitude: -8.4095,
      longitude: 115.1889,
      image_url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
      rating: 4.89,
      ideal_days: 8,
      tags: ["Tropical", "Wellness", "Temples", "Culture"],
      gallery: [
        "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=800&q=80"
      ],
      sample_activities: [
        { time: "05:30 AM", title: "Mount Batur Sunrise Volcano Trek", category: "Adventure", cost: 55, desc: "Hike up the active caldera and watch the morning clouds break with volcanic steam." },
        { time: "11:00 AM", title: "Tegallalang Rice Terraces & Jungle Swing", category: "Adventure", cost: 30, desc: "Wander emerald hand-carved terraces and swing over the tropical canopy." },
        { time: "05:00 PM", title: "Uluwatu Clifftop Temple & Kecak Fire Dance", category: "Culture", cost: 25, desc: "Dramatic chant and fire performance against the setting Indian Ocean sun." }
      ]
    },
    {
      id: 8,
      name: "Cape Town",
      country: "South Africa",
      region: "Africa",
      description: "Where dramatic ocean peaks meet vibrant culture: Table Mountain cableways, penguin beaches, and scenic coastal winery drives.",
      best_travel_months: "Nov - Apr",
      estimated_daily_cost: 140,
      latitude: -33.9249,
      longitude: 18.4241,
      image_url: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1200&q=80",
      rating: 4.91,
      ideal_days: 6,
      tags: ["Coastline", "Mountains", "Wine", "Wildlife"],
      gallery: [
        "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80"
      ],
      sample_activities: [
        { time: "09:00 AM", title: "Table Mountain Aerial Cableway & Summit Walk", category: "Adventure", cost: 35, desc: "Ascend 1,086 meters above sea level for 360-degree views of the Cape Peninsula." },
        { time: "01:30 PM", title: "Boulders Beach African Penguin Colony", category: "Adventure", cost: 20, desc: "Boardwalk encounter with thousands of wild penguins nestled in granite coves." },
        { time: "05:00 PM", title: "Chapman's Peak Sunset Scenic Coastal Drive", category: "Relaxation", cost: 40, desc: "One of the world's most breathtaking marine cliff toll roads." }
      ]
    }
  ],

  // Sample trips for the current profile / workspace
  initial_trips: [
    {
      id: 101,
      title: "Mediterranean Horizon Odyssey",
      destination_id: 2,
      destination_name: "Amalfi Coast, Italy",
      destination_img: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
      start_date: "2026-06-15",
      end_date: "2026-06-20",
      days_count: 5,
      travellers: 2,
      budget: 3500,
      status: "Confirmed",
      days: [
        {
          day_number: 1,
          date: "2026-06-15",
          notes: "Arrival in Naples, private transfer along cliffside to Positano hotel",
          activities: [
            { id: 1, time: "02:00 PM", title: "Check-in at Cliffside Villa Hotel", category: "Relaxation", cost: 0, desc: "Settle into oceanfront balcony and unpack." },
            { id: 2, time: "04:30 PM", title: "Positano Village Stroll & Beachfront Gelato", category: "Culinary", cost: 25, desc: "Explore boutique shops and pebble shore." },
            { id: 3, time: "07:30 PM", title: "Welcome Seafood Dinner with Caldera Wine", category: "Culinary", cost: 110, desc: "Fresh catch of the day with sparkling prosecco." }
          ]
        },
        {
          day_number: 2,
          date: "2026-06-16",
          notes: "Hiking the legendary clifftops and artisan tastings",
          activities: [
            { id: 4, time: "08:30 AM", title: "Path of the Gods Clifftop Trail", category: "Adventure", cost: 45, desc: "Panoramic scenic mountain ridge hike overlooking the sea." },
            { id: 5, time: "01:00 PM", title: "Clifftop Trattoria Pasta Lunch in Nocelle", category: "Culinary", cost: 55, desc: "Rustic homemade ravioli capresi." },
            { id: 6, time: "05:00 PM", title: "Sunset Swim at Fornillo Beach", category: "Relaxation", cost: 15, desc: "Quiet secluded beach with crystalline clear water." }
          ]
        },
        {
          day_number: 3,
          date: "2026-06-17",
          notes: "Full day boat expedition around Capri & Faraglioni",
          activities: [
            { id: 7, time: "09:30 AM", title: "Private Wooden Gozzo Boat Charter", category: "Adventure", cost: 180, desc: "Sail past Amalfi cliffs and through the Faraglioni rock arches." },
            { id: 8, time: "02:00 PM", title: "Capri Island Piazzetta & Gardens of Augustus", category: "Culture", cost: 35, desc: "Stroll the floral terraces overlooking the Marina Piccola." },
            { id: 9, time: "07:00 PM", title: "Sunset Return with Limoncello Spritz", category: "Relaxation", cost: 30, desc: "Cruise into the golden twilight with coastal lights." }
          ]
        }
      ]
    },
    {
      id: 102,
      title: "Zen Sanctuaries & Bamboo Temples",
      destination_id: 3,
      destination_name: "Kyoto, Japan",
      destination_img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
      start_date: "2026-10-20",
      end_date: "2026-10-25",
      days_count: 5,
      travellers: 1,
      budget: 1800,
      status: "Draft",
      days: [
        {
          day_number: 1,
          date: "2026-10-20",
          notes: "Arrival at Kyoto Station, check into traditional machiya townhouse",
          activities: [
            { id: 10, time: "03:00 PM", title: "Machiya Townhouse Check-In", category: "Relaxation", cost: 0, desc: "Settle into tatami room and enjoy green tea." },
            { id: 11, time: "06:00 PM", title: "Evening Lantern Walk in Pontocho Alley", category: "Culture", cost: 45, desc: "Atmospheric cobblestone corridor lined with traditional izakayas." }
          ]
        }
      ]
    }
  ]
};
