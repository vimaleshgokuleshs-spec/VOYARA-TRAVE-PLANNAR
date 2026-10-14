/* ==========================================================================
   VOYARA VIEW: BUDGET & TRIP SUMMARY
   Visual category breakdown, target budget progress, currency integration
   ========================================================================== */

const BudgetView = {
  render() {
    const container = document.getElementById('view-budget');
    if (!container) return;

    const trip = voyaraState.activeTrip;
    if (!trip) {
      container.innerHTML = `
        <div class="container budget-header-area">
          <div class="empty-state">
            <div class="empty-state-icon">💳</div>
            <h3 class="empty-state-title">No Active Trip Summary Available</h3>
            <p class="empty-state-desc">Choose a destination and build an itinerary first to view full cost telemetry.</p>
            <button class="btn btn-primary" onclick="voyaraRouter.navigate('destinations')">Explore Horizons</button>
          </div>
        </div>
      `;
      return;
    }

    const calc = voyaraState.calculateBudget();
    const dest = voyaraState.destinations.find(d => d.id === trip.destination_id) || voyaraState.destinations[0];

    container.innerHTML = `
      <div class="container budget-header-area">
        <!-- Photographic Header Vignette Banner -->
        <div class="budget-hero-backdrop" style="background-image: url('${dest.image_url}');">
          <div class="budget-hero-overlay">
            <div>
              <span class="text-uppercase-tracked" style="color:var(--accent-champagne);">Financial Architecture & Summary</span>
              <h1 style="font-size: clamp(1.8rem, 3.2vw, 2.5rem); color: #fff; margin-bottom: 2px;">Trip Budget Breakdown</h1>
              <p style="color:var(--color-text-secondary); font-size: var(--text-xs);">
                ${trip.title} &bull; ${dest.name}, ${dest.country} &bull; ${calc.travellers} Travelers &bull; ${calc.days} Days
              </p>
            </div>
            <div style="display: flex; gap: var(--space-2);">
              <button class="btn btn-secondary btn-sm" onclick="voyaraRouter.navigate('builder')">
                ✏️ Edit in Builder
              </button>
              <button class="btn btn-primary btn-sm" onclick="window.print()">
                🖨️ Export Summary
              </button>
            </div>
          </div>
        </div>

        <!-- 3-Column Hero Metrics -->
        <div class="budget-grid-overview">
          <div class="budget-hero-metric-card featured">
            <div class="metric-tag">Grand Total Estimated</div>
            <div class="metric-number-lg" style="color: var(--accent-champagne);">${VoyaraCurrency.format(calc.grandTotal)}</div>
            <div class="metric-sub">Full comprehensive expedition cost</div>
          </div>

          <div class="budget-hero-metric-card">
            <div class="metric-tag">Cost Per Traveler</div>
            <div class="metric-number-lg">${VoyaraCurrency.format(calc.costPerPerson)}</div>
            <div class="metric-sub">Based on ${calc.travellers} total travelers</div>
          </div>

          <div class="budget-hero-metric-card">
            <div class="metric-tag">Daily Pace Per Person</div>
            <div class="metric-number-lg">${VoyaraCurrency.format(calc.costPerPersonPerDay)} <small style="font-size: 0.85rem; color: var(--color-text-muted);">/ day</small></div>
            <div class="metric-sub">Covers stays, dining, transit & daily activities</div>
          </div>
        </div>

        <!-- Budget Progress Bar -->
        <div class="budget-progress-box">
          <div class="budget-progress-labels">
            <span>
              Target Budget Allocation: <strong>${VoyaraCurrency.format(calc.targetBudget)}</strong>
            </span>
            <span style="font-weight: 700; color: ${calc.isUnderBudget ? 'var(--accent-emerald)' : 'var(--accent-coral)'};">
              ${calc.isUnderBudget ? '✓ On Track (Within Target)' : '⚠️ Exceeds Budget by ' + VoyaraCurrency.format(calc.grandTotal - calc.targetBudget)}
            </span>
          </div>
          <div class="budget-progress-bar-track">
            <div class="budget-progress-bar-fill ${calc.isUnderBudget ? '' : 'over-budget'}" 
                 style="width: ${calc.percentOfBudget}%;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top: var(--space-2); font-size: 0.7rem; color: var(--color-text-dim);">
            <span>${VoyaraCurrency.format(0)}</span>
            <span>Allocated: ${calc.percentOfBudget}% of target</span>
            <span>${VoyaraCurrency.format(calc.targetBudget)}</span>
          </div>
        </div>

        <!-- Category Breakdown & Simulator -->
        <div class="budget-categories-grid">
          <!-- Categories List -->
          <div class="category-breakdown-card">
            <h3 style="font-size: var(--text-lg); color: #fff; margin-bottom: var(--space-4);">Category Allocation</h3>
            <div class="categories-list">
              ${calc.categories.map(cat => `
                <div class="category-row-item">
                  <div class="category-info">
                    <span class="category-dot ${cat.colorClass}"></span>
                    <div>
                      <div class="category-name">${cat.name}</div>
                      <div class="category-pct">${cat.pct}% of expedition budget</div>
                    </div>
                  </div>
                  <div class="category-amount">${VoyaraCurrency.format(cat.amount)}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Simulator Controls -->
          <div class="simulator-panel">
            <h3 class="simulator-title">✨ Budget Simulator</h3>
            <p style="font-size: 0.72rem; color: var(--color-text-muted); margin-bottom: var(--space-4);">
              Adjust stay style and transport tier to see instant telemetry updates:
            </p>

            <div class="simulator-select-group">
              <label class="simulator-label">Accommodation Style</label>
              <select class="form-control" id="sim-stay-tier" onchange="BudgetView.updateSimulation()">
                <option value="luxury" ${voyaraState.budgetSimulator.stayTier === 'luxury' ? 'selected' : ''}>Luxury Villa / 5-Star Resort (1.7x)</option>
                <option value="boutique" ${voyaraState.budgetSimulator.stayTier === 'boutique' ? 'selected' : ''}>Boutique Hotel / Ocean Villa (1.0x)</option>
                <option value="cozy" ${voyaraState.budgetSimulator.stayTier === 'cozy' ? 'selected' : ''}>Cozy B&B / Authentic Homestay (0.6x)</option>
              </select>
            </div>

            <div class="simulator-select-group">
              <label class="simulator-label">Transit & Transfers</label>
              <select class="form-control" id="sim-transit-tier" onchange="BudgetView.updateSimulation()">
                <option value="private" ${voyaraState.budgetSimulator.transitTier === 'private' ? 'selected' : ''}>Private Chauffeur / Yacht / SUV (1.8x)</option>
                <option value="standard" ${voyaraState.budgetSimulator.transitTier === 'standard' ? 'selected' : ''}>Standard Ferries & Rental Cars (1.0x)</option>
                <option value="transit" ${voyaraState.budgetSimulator.transitTier === 'transit' ? 'selected' : ''}>Public Rail / Local Shuttles (0.4x)</option>
              </select>
            </div>

            <div class="simulator-select-group">
              <label class="simulator-label">Dining Style</label>
              <select class="form-control" id="sim-dining-tier" onchange="BudgetView.updateSimulation()">
                <option value="fine" ${voyaraState.budgetSimulator.diningTier === 'fine' ? 'selected' : ''}>Michelin / Clifftop Fine Dining (1.7x)</option>
                <option value="balanced" ${voyaraState.budgetSimulator.diningTier === 'balanced' ? 'selected' : ''}>Balanced Trattorias & Wine Bars (1.0x)</option>
                <option value="local" ${voyaraState.budgetSimulator.diningTier === 'local' ? 'selected' : ''}>Local Street Markets & Cafes (0.55x)</option>
              </select>
            </div>

            <div style="margin-top: var(--space-4);">
              <button class="btn btn-secondary btn-sm" style="width: 100%;" onclick="BudgetView.resetSimulation()">Reset Baseline</button>
            </div>
          </div>
        </div>

        <!-- Day-by-Day Cost Table -->
        <div class="summary-table-wrap">
          <h3 style="font-size: var(--text-lg); color: #fff; margin-bottom: var(--space-3);">Day-by-Day Schedule & Activity Outlay</h3>
          <table class="summary-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Date</th>
                <th>Scheduled Experiences</th>
                <th>Activities Total</th>
                <th>Estimated Day Outlay</th>
              </tr>
            </thead>
            <tbody>
              ${(trip.days || []).map(d => {
                let dayActCost = 0;
                (d.activities || []).forEach(a => dayActCost += (a.cost || 0) * calc.travellers);
                const dayGrand = dayActCost + Math.round((calc.grandTotal - (trip.days ? trip.days.length : 1)) / (trip.days ? trip.days.length : 1));
                return `
                  <tr>
                    <td><strong>Day ${d.day_number}</strong></td>
                    <td>${d.date || 'Flexible'}</td>
                    <td>${d.activities && d.activities.length > 0 ? d.activities.map(a => `<span class="badge badge-azure" style="margin-right:4px;">${a.title}</span>`).join('') : '<span style="color:var(--color-text-dim);">Free exploration</span>'}</td>
                    <td style="color:var(--accent-emerald); font-weight:700;">${VoyaraCurrency.format(dayActCost)}</td>
                    <td style="font-weight:700; color:#fff;">${VoyaraCurrency.format(dayGrand)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  updateSimulation() {
    const stay = document.getElementById('sim-stay-tier').value;
    const transit = document.getElementById('sim-transit-tier').value;
    const dining = document.getElementById('sim-dining-tier').value;

    voyaraState.budgetSimulator = {
      stayTier: stay,
      transitTier: transit,
      diningTier: dining
    };

    this.render();
    VoyaraToast.show('Recalculated simulation telemetry', 'info');
  },

  resetSimulation() {
    voyaraState.budgetSimulator = {
      stayTier: 'boutique',
      transitTier: 'standard',
      diningTier: 'balanced'
    };
    this.render();
    VoyaraToast.show('Reset to standard boutique baseline', 'info');
  }
};
