/* ==========================================================================
   VOYARA VIEW: HOME / DISCOVER
   Editorial featured horizons, compact search & currency integration
   ========================================================================== */

const DiscoverView = {
  render() {
    this.renderFeaturedCards();
    this.setupQuickSearch();

    // Hero GSAP animations
    if (window.VoyaraAnimations) {
      VoyaraAnimations.initHero();
    }
  },

  renderFeaturedCards() {
    const container = document.getElementById('featured-destinations-row');
    if (!container) return;

    // Pick top 3 rated destinations
    const featured = voyaraState.destinations.slice(0, 3);

    container.innerHTML = featured.map(dest => `
      <div class="destination-card" onclick="voyaraRouter.navigate('detail?id=${dest.id}')">
        <div class="card-media">
          <img src="${dest.image_url}" alt="${dest.name}" class="card-img" loading="lazy">
          <div class="card-gradient-overlay"></div>
          <span class="badge badge-teal card-badge-top-left">${dest.best_travel_months}</span>
          <button class="card-favorite-btn ${voyaraState.isFavorite(dest.id) ? 'active' : ''}" 
                  onclick="event.stopPropagation(); DiscoverView.toggleFav(${dest.id}, this);"
                  title="Save to Horizons"
                  aria-label="Save ${dest.name} to Horizons">
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
            <span class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); voyaraState.createTripForDestination(${dest.id}); voyaraRouter.navigate('builder');">Plan Journey &rarr;</span>
          </div>
        </div>
      </div>
    `).join('');
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

  setupQuickSearch() {
    const searchForm = document.getElementById('hero-quick-search-form');
    if (!searchForm || searchForm.dataset.bound) return;

    searchForm.dataset.bound = "true";
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = document.getElementById('hero-search-query').value.trim();
      const season = document.getElementById('hero-search-season').value;
      const budget = document.getElementById('hero-search-budget').value;

      // Navigate to explore view with parameters
      voyaraRouter.navigate(`destinations?q=${encodeURIComponent(query)}&season=${season}&budget=${budget}`);
    });
  }
};
