/* ==========================================================================
   VOYARA VIEW: MY TRIPS & PROFILE
   User expedition catalog, saved horizons, cover photos & currency support
   ========================================================================== */

const ProfileView = {
  activeTab: 'trips', // 'trips', 'favorites'

  render() {
    const container = document.getElementById('view-trips');
    if (!container) return;

    if (voyaraState.currentUser) {
      const now = Date.now();
      if (!this._lastRefresh || (now - this._lastRefresh > 5000)) {
        this._lastRefresh = now;
        voyaraState.loadUserTrips();
        voyaraState.loadUserFavorites();
      }
    }

    const trips = voyaraState.trips || [];
    const favorites = voyaraState.getFavoriteDestinations();

    const currentUser = voyaraState.currentUser;
    const displayName = currentUser ? currentUser.full_name : 'Voyara Explorer';
    const displayEmail = currentUser ? currentUser.email : 'explorer@voyara.com';
    const initial = displayName.charAt(0).toUpperCase();

    container.innerHTML = `
      <div class="container profile-header-area">
        <!-- Profile Hero Card with Cinematic Travel Backdrop -->
        <div class="profile-hero-backdrop">
          <div class="profile-hero-overlay">
            <div class="profile-user-info">
              <div class="profile-avatar-large">${initial}</div>
              <div>
                <div class="profile-name">${displayName}</div>
                <div class="profile-meta">${displayEmail}</div>
                <div style="margin-top: 6px; display:flex; gap:var(--space-2); align-items:center;">
                  <span class="badge ${currentUser ? 'badge-teal' : 'badge-gold'}">${currentUser ? 'Verified Explorer' : 'Guest Session'}</span>
                  ${currentUser ? '<button class="btn btn-outline-teal btn-xs" onclick="AuthView.handleSignOut()" style="font-size:0.7rem; padding:0.2rem 0.65rem;">Sign Out</button>' : '<a href="#signin" class="btn btn-primary btn-xs" style="font-size:0.7rem; padding:0.2rem 0.65rem; text-decoration:none;">Sign In</a>'}
                </div>
              </div>
            </div>

            <div class="profile-stats-chips">
              <div class="profile-stat-pill">
                <strong id="profile-stat-trips">${trips.length}</strong>
                <span>Planned Expeditions</span>
              </div>
              <div class="profile-stat-pill">
                <strong id="profile-stat-favs">${favorites.length}</strong>
                <span>Saved Horizons</span>
              </div>
              <div class="profile-stat-pill">
                <strong>${trips.reduce((acc, t) => acc + (t.days_count || (t.days ? t.days.length : 0)), 0)}</strong>
                <span>Total Days</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Profile Tabs -->
        <div class="profile-nav-tabs">
          <button class="profile-tab-link ${this.activeTab === 'trips' ? 'active' : ''}" 
                  onclick="ProfileView.switchTab('trips')">
            Expeditions & Journeys (${trips.length})
          </button>
          <button class="profile-tab-link ${this.activeTab === 'favorites' ? 'active' : ''}" 
                  onclick="ProfileView.switchTab('favorites')">
            Saved Horizons Wishlist (${favorites.length})
          </button>
        </div>

        <!-- Tab Content -->
        <div id="profile-tab-content">
          ${this.activeTab === 'trips' ? this.renderTripsList(trips) : this.renderFavoritesList(favorites)}
        </div>
      </div>
    `;
  },

  switchTab(tab) {
    this.activeTab = tab;
    this.render();
  },

  renderTripsList(trips) {
    if (trips.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">🏖️</div>
          <h3 class="empty-state-title">No Expeditions Planned Yet</h3>
          <p class="empty-state-desc">You haven't scheduled any journeys yet. Pick from our curated paradises to begin building.</p>
          <button class="btn btn-primary" onclick="voyaraRouter.navigate('destinations')">Discover Horizons</button>
        </div>
      `;
    }

    return `
      <div class="profile-trips-list">
        ${trips.map(trip => {
          let statusClass = 'status-draft';
          if (trip.status === 'Confirmed') statusClass = 'status-confirmed';
          if (trip.status === 'Completed') statusClass = 'status-completed';

          return `
            <div class="trip-card-item">
              <div class="trip-card-thumb">
                <img src="${trip.destination_img || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'}" alt="${trip.title}" loading="lazy">
                <div class="trip-card-overlay"></div>
                <span class="trip-status-pill ${statusClass}">${trip.status || 'Draft'}</span>
              </div>
              <div class="trip-card-details">
                <h3 class="trip-card-title">${trip.title}</h3>
                <div class="trip-card-dates">📅 ${trip.start_date || 'Flexible Dates'} &bull; ${trip.days_count || (trip.days ? trip.days.length : 5)} Days</div>
                
                <div class="trip-card-stats-row">
                  <div>
                    <span style="color:var(--color-text-dim); display:block; font-size:0.65rem;">TRAVELERS</span>
                    <strong>${trip.travellers || 2} Persons</strong>
                  </div>
                  <div>
                    <span style="color:var(--color-text-dim); display:block; font-size:0.65rem;">TOTAL BUDGET</span>
                    <strong style="color:var(--accent-champagne);">${VoyaraCurrency.format(trip.budget || 3000)}</strong>
                  </div>
                </div>

                <div class="trip-card-actions">
                  <button class="btn btn-primary btn-sm" style="flex:1;" onclick="ProfileView.openTripInBuilder(${trip.id})">
                    Open Builder
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="ProfileView.openTripInBudget(${trip.id})">
                    Budget
                  </button>
                  <button class="btn btn-danger btn-sm" onclick="ProfileView.deleteTrip(${trip.id})" title="Delete Trip">
                    ✕
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderFavoritesList(favorites) {
    if (favorites.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">🤍</div>
          <h3 class="empty-state-title">Your Wishlist is Empty</h3>
          <p class="empty-state-desc">Click the heart icon on any destination card to bookmark your dream horizons.</p>
          <button class="btn btn-primary" onclick="voyaraRouter.navigate('destinations')">Browse Horizons</button>
        </div>
      `;
    }

    return `
      <div class="destinations-grid">
        ${favorites.map(dest => `
          <div class="destination-card" onclick="voyaraRouter.navigate('detail?id=${dest.id}')">
            <div class="card-media">
              <img src="${dest.image_url}" alt="${dest.name}" class="card-img" loading="lazy">
              <div class="card-gradient-overlay"></div>
              <span class="badge badge-teal card-badge-top-left">${dest.best_travel_months}</span>
              <button class="card-favorite-btn active" 
                      onclick="event.stopPropagation(); ProfileView.removeFav(${dest.id});"
                      title="Remove from Horizons"
                      aria-label="Remove ${dest.name} from Horizons">
                ♥
              </button>
            </div>
            <div class="card-body">
              <div class="card-country-row">
                <span class="card-country">${dest.country}</span>
                <span class="card-season">★ ${dest.rating}</span>
              </div>
              <h3 class="card-title">${dest.name}</h3>
              <p class="card-desc">${dest.description}</p>
              <div class="card-footer">
                <div class="card-price-wrap">
                  <span class="card-price-label">Estimated Pace</span>
                  <span class="card-price-value">${VoyaraCurrency.format(dest.estimated_daily_cost)} <small>/ day</small></span>
                </div>
                <span class="btn btn-primary btn-sm" onclick="event.stopPropagation(); voyaraState.createTripForDestination(${dest.id}); voyaraRouter.navigate('builder');">Plan Journey &rarr;</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  openTripInBuilder(tripId) {
    voyaraState.setActiveTripById(tripId);
    VoyaraToast.show('Loaded trip in builder', 'info');
    voyaraRouter.navigate('builder');
  },

  openTripInBudget(tripId) {
    voyaraState.setActiveTripById(tripId);
    voyaraRouter.navigate('budget');
  },

  async deleteTrip(tripId) {
    if (confirm("Are you sure you want to remove this expedition?")) {
      await voyaraState.deleteTrip(tripId);
      this.render();
      VoyaraToast.show('Expedition deleted', 'info');
    }
  },

  async removeFav(destId) {
    await voyaraState.toggleFavorite(destId);
    this.render();
    VoyaraToast.show('Removed from Saved Horizons', 'info');
  }
};
