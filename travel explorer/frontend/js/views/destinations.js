/* ==========================================================================
   VOYARA VIEW: EXPLORE DESTINATIONS
   Multi-filter exploration, keyword search, favorite wishlist, currency support
   ========================================================================== */

const DestinationsView = {
  currentFilter: {
    query: '',
    region: 'all',
    season: 'all',
    sort: 'popular'
  },

  render() {
    this.readUrlParams();
    this.setupListeners();
    this.filterAndRender();
  },

  readUrlParams() {
    const rawHash = window.location.hash.slice(1);
    const [, queryPart] = rawHash.split('?');
    if (queryPart) {
      const params = new URLSearchParams(queryPart);
      if (params.has('q')) this.currentFilter.query = params.get('q');
      if (params.has('season')) this.currentFilter.season = params.get('season');
      
      const searchInput = document.getElementById('destinations-search-input');
      if (searchInput) searchInput.value = this.currentFilter.query;
      
      const seasonSelect = document.getElementById('dest-filter-season');
      if (seasonSelect && this.currentFilter.season !== 'all') {
        seasonSelect.value = this.currentFilter.season;
      }
    }
  },

  setupListeners() {
    const searchInput = document.getElementById('destinations-search-input');
    if (searchInput && !searchInput.dataset.bound) {
      searchInput.dataset.bound = "true";
      searchInput.addEventListener('input', (e) => {
        this.currentFilter.query = e.target.value.trim().toLowerCase();
        this.filterAndRender();
      });
    }

    // Region Pills
    document.querySelectorAll('.filter-pill[data-region]').forEach(pill => {
      if (!pill.dataset.bound) {
        pill.dataset.bound = "true";
        pill.addEventListener('click', () => {
          document.querySelectorAll('.filter-pill[data-region]').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.currentFilter.region = pill.dataset.region;
          this.filterAndRender();
        });
      }
    });

    // Season Select
    const seasonSelect = document.getElementById('dest-filter-season');
    if (seasonSelect && !seasonSelect.dataset.bound) {
      seasonSelect.dataset.bound = "true";
      seasonSelect.addEventListener('change', (e) => {
        this.currentFilter.season = e.target.value;
        this.filterAndRender();
      });
    }

    // Sort Select
    const sortSelect = document.getElementById('dest-filter-sort');
    if (sortSelect && !sortSelect.dataset.bound) {
      sortSelect.dataset.bound = "true";
      sortSelect.addEventListener('change', (e) => {
        this.currentFilter.sort = e.target.value;
        this.filterAndRender();
      });
    }
  },

  filterAndRender() {
    const grid = document.getElementById('destinations-cards-grid');
    const countEl = document.getElementById('destinations-count-label');
    if (!grid) return;

    let filtered = voyaraState.destinations.filter(item => {
      // Query search
      if (this.currentFilter.query) {
        const q = this.currentFilter.query.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCountry = item.country.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchTags = item.tags && item.tags.some(t => t.toLowerCase().includes(q));
        if (!matchName && !matchCountry && !matchDesc && !matchTags) return false;
      }

      // Region filter
      if (this.currentFilter.region !== 'all') {
        if (item.region.toLowerCase() !== this.currentFilter.region.toLowerCase()) {
          // Check if tag matches (e.g., Tropical, Mountain)
          const hasTag = item.tags && item.tags.some(t => t.toLowerCase() === this.currentFilter.region.toLowerCase());
          if (!hasTag) return false;
        }
      }

      // Season filter
      if (this.currentFilter.season !== 'all') {
        const s = this.currentFilter.season.toLowerCase();
        const seasonMonths = {
          summer: ['jun', 'jul', 'aug'],
          spring: ['mar', 'apr', 'may'],
          autumn: ['sep', 'oct', 'nov'],
          winter: ['dec', 'jan', 'feb']
        };
        const months = seasonMonths[s] || [];
        const matchesSeason = months.some(m => item.best_travel_months.toLowerCase().includes(m));
        if (!matchesSeason) return false;
      }

      return true;
    });

    // Sorting
    if (this.currentFilter.sort === 'cost-asc') {
      filtered.sort((a, b) => a.estimated_daily_cost - b.estimated_daily_cost);
    } else if (this.currentFilter.sort === 'cost-desc') {
      filtered.sort((a, b) => b.estimated_daily_cost - a.estimated_daily_cost);
    } else if (this.currentFilter.sort === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    if (countEl) {
      countEl.textContent = `Displaying ${filtered.length} of ${voyaraState.destinations.length} curated horizons`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🧭</div>
          <h3 class="empty-state-title">No Horizons Found</h3>
          <p class="empty-state-desc">No destinations match your exact filter criteria. Try expanding your search or clearing current filters.</p>
          <button class="btn btn-outline-teal btn-sm" onclick="DestinationsView.resetFilters()">Reset All Filters</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(dest => `
      <div class="destination-card" onclick="voyaraRouter.navigate('detail?id=${dest.id}')">
        <div class="card-media">
          <img src="${dest.image_url}" alt="${dest.name}" class="card-img" loading="lazy">
          <div class="card-gradient-overlay"></div>
          <span class="badge badge-teal card-badge-top-left">${dest.best_travel_months}</span>
          <button class="card-favorite-btn ${voyaraState.isFavorite(dest.id) ? 'active' : ''}" 
                  onclick="event.stopPropagation(); DestinationsView.toggleFav(${dest.id}, this);"
                  title="Save to Horizons"
                  aria-label="Save ${dest.name} to Horizons">
            ♥
          </button>
        </div>
        <div class="card-body">
          <div class="card-country-row">
            <span class="card-country">${dest.country} &bull; ${dest.region}</span>
            <span class="card-season">★ ${dest.rating}</span>
          </div>
          <h3 class="card-title">${dest.name}</h3>
          <p class="card-desc">${dest.description}</p>
          <div class="card-footer">
            <div class="card-price-wrap">
              <span class="card-price-label">Estimated Pace</span>
              <span class="card-price-value">${VoyaraCurrency.format(dest.estimated_daily_cost)} <small>/ day</small></span>
            </div>
            <span class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); voyaraState.createTripForDestination(${dest.id}); voyaraRouter.navigate('builder');">Plan Trip &rarr;</span>
          </div>
        </div>
      </div>
    `).join('');

    if (window.VoyaraAnimations) {
      VoyaraAnimations.animateCards();
    }
  },

  async toggleFav(id, btnEl) {
    const isFav = await voyaraState.toggleFavorite(id);
    if (isFav) {
      btnEl.classList.add('active');
      VoyaraToast.show('Added to your Saved Horizons', 'success');
    } else {
      btnEl.classList.remove('active');
      VoyaraToast.show('Removed from Saved Horizons', 'info');
    }
  },

  resetFilters() {
    this.currentFilter = { query: '', region: 'all', season: 'all', sort: 'popular' };
    const searchInput = document.getElementById('destinations-search-input');
    if (searchInput) searchInput.value = '';
    const seasonSelect = document.getElementById('dest-filter-season');
    if (seasonSelect) seasonSelect.value = 'all';
    document.querySelectorAll('.filter-pill[data-region]').forEach(p => {
      p.classList.toggle('active', p.dataset.region === 'all');
    });
    this.filterAndRender();
  }
};
