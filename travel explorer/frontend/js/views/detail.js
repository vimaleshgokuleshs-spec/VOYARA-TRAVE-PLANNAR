/* ==========================================================================
   VOYARA VIEW: DESTINATION DETAILS
   Full-bleed photography, cost breakdown, gallery, and trip generator CTA
   ========================================================================== */

const DestinationDetailView = {
  render(id) {
    const destId = Number(id) || 1;
    const dest = voyaraState.destinations.find(d => d.id === destId) || voyaraState.destinations[0];
    const container = document.getElementById('view-detail');
    if (!container) return;

    const isFav = voyaraState.isFavorite(dest.id);

    container.innerHTML = `
      <div class="container">
        <!-- Hero Banner -->
        <div class="detail-hero-banner">
          <img src="${dest.image_url}" alt="${dest.name}" class="detail-hero-img">
          <div class="detail-hero-overlay">
            <div class="detail-breadcrumb">
              <span style="cursor:pointer;" onclick="voyaraRouter.navigate('destinations')">Destinations</span> / <span>${dest.country}</span>
            </div>
            <h1 class="detail-title">${dest.name}</h1>
            <div class="detail-meta-row">
              <span class="badge badge-teal">Best Window: ${dest.best_travel_months}</span>
              <span class="badge badge-gold">★ ${dest.rating} Rating</span>
              <span class="badge badge-azure">${dest.latitude.toFixed(2)}° N, ${dest.longitude.toFixed(2)}° E</span>
              <span class="badge badge-emerald">Ideal Stay: ${dest.ideal_days} Days</span>
            </div>
          </div>
        </div>

        <!-- Detail Grid Layout -->
        <div class="detail-grid">
          <!-- Left Column: Story, Highlights & Gallery -->
          <div>
            <div class="glass-panel" style="padding: var(--space-6); margin-bottom: var(--space-6);">
              <h2 style="font-size: var(--text-xl); margin-bottom: var(--space-3);">The Horizon Experience</h2>
              <p style="color: var(--color-text-secondary); line-height: 1.7; font-size: var(--text-sm); margin-bottom: var(--space-5);">
                ${dest.description} Imbued with captivating cultural heritage and breathtaking landscapes, this sanctuary offers travelers an unparalleled blend of adventure, culinary depth, and tranquil repose.
              </p>

              <h3 style="font-size: var(--text-sm); margin-bottom: var(--space-2); color: var(--accent-champagne);">Destination Tags</h3>
              <div style="display: flex; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-5);">
                ${(dest.tags || []).map(t => `<span class="badge badge-azure">#${t}</span>`).join('')}
              </div>

              <h3 style="font-size: var(--text-sm); margin-bottom: var(--space-2); color: var(--accent-champagne);">Curated Visual Gallery</h3>
              <div class="gallery-grid">
                ${(dest.gallery || []).map(img => `
                  <div class="gallery-thumb" onclick="window.open('${img}', '_blank')">
                    <img src="${img}" alt="${dest.name}" loading="lazy">
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Curated Sample Activities -->
            <div class="glass-panel" style="padding: var(--space-6);">
              <h3 style="font-size: var(--text-lg); margin-bottom: var(--space-4);">Signature Experiences</h3>
              <div style="display: flex; flex-direction: column; gap: var(--space-3);">
                ${(dest.sample_activities || []).map(act => `
                  <div style="display: flex; gap: var(--space-4); align-items: flex-start; padding: var(--space-3) var(--space-4); background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px solid var(--color-border-subtle);">
                    <span class="badge badge-teal">${act.time}</span>
                    <div style="flex:1;">
                      <div style="font-weight:700; color:#fff; font-size:var(--text-sm); margin-bottom:2px;">${act.title}</div>
                      <div style="font-size: 0.72rem; color: var(--color-text-muted);">${act.desc}</div>
                    </div>
                    <span style="color: var(--accent-emerald); font-weight:700; font-size: var(--text-xs);">${VoyaraCurrency.format(act.cost)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Right Column: Cost Breakdown & Plan CTA -->
          <div>
            <div class="glass-panel detail-sidebar-card" style="padding: var(--space-6);">
              <span class="text-uppercase-tracked" style="color: var(--accent-champagne);">Pace & Budget Estimates</span>
              <div style="margin: var(--space-3) 0 var(--space-1);">
                <span style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: #fff;">${VoyaraCurrency.format(dest.estimated_daily_cost)}</span>
                <span style="color: var(--color-text-muted); font-size: var(--text-xs);"> / day per traveler</span>
              </div>
              <p style="font-size: 0.72rem; color: var(--color-text-dim); margin-bottom: var(--space-5);">
                Includes standard boutique accommodation, curated dining, transit, and daily adventures.
              </p>

              <div class="cost-breakdown-list">
                <div class="cost-item-row">
                  <span>🏨 Boutique Stay</span>
                  <strong style="color: #fff;">${VoyaraCurrency.format(dest.estimated_daily_cost * 0.45)}</strong>
                </div>
                <div class="cost-item-row">
                  <span>🍷 Culinary & Dining</span>
                  <strong style="color: #fff;">${VoyaraCurrency.format(dest.estimated_daily_cost * 0.25)}</strong>
                </div>
                <div class="cost-item-row">
                  <span>🎟️ Curated Activities</span>
                  <strong style="color: #fff;">${VoyaraCurrency.format(dest.estimated_daily_cost * 0.20)}</strong>
                </div>
                <div class="cost-item-row">
                  <span>✈️ Island / Local Transit</span>
                  <strong style="color: #fff;">${VoyaraCurrency.format(dest.estimated_daily_cost * 0.10)}</strong>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-6);">
                <button class="btn btn-primary" style="width: 100%;" onclick="DestinationDetailView.startPlanning(${dest.id})">
                  Plan Trip to ${dest.name} &rarr;
                </button>
                <button class="btn btn-secondary" style="width: 100%;" onclick="DestinationDetailView.toggleFav(${dest.id}, this)">
                  ${isFav ? '♥ Saved in Horizons' : '♡ Save to Horizons'}
                </button>
                <button class="btn btn-outline-teal" style="width: 100%; margin-top: var(--space-1);" onclick="voyaraRouter.navigate('destinations')">
                  &larr; Back to Horizons
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  startPlanning(destId) {
    voyaraState.createTripForDestination(destId);
    VoyaraToast.show('Created new itinerary draft for this destination', 'success');
    voyaraRouter.navigate('builder');
  },

  async toggleFav(destId, btnEl) {
    const isFav = await voyaraState.toggleFavorite(destId);
    btnEl.textContent = isFav ? '♥ Saved in Horizons' : '♡ Save to Horizons';
    VoyaraToast.show(isFav ? 'Saved to Horizons' : 'Removed from Horizons', isFav ? 'success' : 'info');
  }
};
