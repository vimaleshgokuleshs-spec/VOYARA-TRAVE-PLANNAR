/* ==========================================================================
   VOYARA VIEW: SMART ITINERARY BUILDER
   Photographic header backdrop, rule-based generator, currency-aware pricing
   ========================================================================== */

const BuilderView = {
  currentDayIndex: 0,

  render() {
    const container = document.getElementById('view-builder');
    if (!container) return;

    const trip = voyaraState.activeTrip;
    if (!trip) {
      container.innerHTML = `
        <div class="container builder-header-area">
          <div class="empty-state">
            <div class="empty-state-icon">🗺️</div>
            <h3 class="empty-state-title">No Active Itinerary Selected</h3>
            <p class="empty-state-desc">Select a destination from the horizons directory to begin crafting your journey.</p>
            <button class="btn btn-primary" onclick="voyaraRouter.navigate('destinations')">Explore Horizons</button>
          </div>
        </div>
      `;
      return;
    }

    const currentDest = voyaraState.destinations.find(d => d.id === trip.destination_id) || voyaraState.destinations[0];

    container.innerHTML = `
      <div class="container builder-header-area">
        <!-- Photographic Destination Header Banner -->
        <div class="builder-hero-backdrop" style="background-image: url('${currentDest.image_url}');">
          <div class="builder-hero-overlay">
            <div>
              <span class="text-uppercase-tracked" style="color:var(--accent-champagne);">Intelligent Trip Architect</span>
              <h1 style="font-size: clamp(1.8rem, 3.2vw, 2.5rem); color: #fff; margin-bottom: 2px;">${trip.title}</h1>
              <p style="color:var(--color-text-secondary); font-size: var(--text-xs);">
                ${trip.destination_name} &bull; ${trip.days_count || (trip.days ? trip.days.length : 5)} Days &bull; ${trip.travellers} Travelers
              </p>
            </div>
            <div style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
              <button class="btn btn-secondary btn-sm" onclick="voyaraRouter.navigate('budget')">
                📊 View Budget & Summary
              </button>
              <button class="btn btn-outline-teal btn-sm" id="builder-save-btn" onclick="BuilderView.saveTripToBackend()">
                💾 Save to Account
              </button>
              <button class="btn btn-primary btn-sm" onclick="BuilderView.triggerSmartGenerator()">
                ⚡ Auto-Generate Itinerary
              </button>
            </div>
          </div>
        </div>

        <!-- Trip Configuration Controls Bar -->
        <div class="trip-config-bar">
          <div class="config-item">
            <label class="config-label">Destination</label>
            <select class="form-control" id="builder-destination-select" onchange="BuilderView.updateDestination(this.value)">
              ${voyaraState.destinations.map(d => `
                <option value="${d.id}" ${d.id === trip.destination_id ? 'selected' : ''}>${d.name}, ${d.country}</option>
              `).join('')}
            </select>
          </div>

          <div class="config-item">
            <label class="config-label">Start Date</label>
            <input type="date" class="form-control" id="builder-start-date" value="${trip.start_date || '2026-06-15'}" onchange="BuilderView.updateDates()">
          </div>

          <div class="config-item">
            <label class="config-label">Travelers</label>
            <div style="display: flex; align-items: center; gap: var(--space-2);">
              <button class="btn btn-secondary btn-sm" onclick="BuilderView.adjustTravelers(-1)">-</button>
              <span id="builder-travellers-count" style="font-weight: 700; min-width: 25px; text-align: center; font-size:var(--text-xs);">${trip.travellers}</span>
              <button class="btn btn-secondary btn-sm" onclick="BuilderView.adjustTravelers(1)">+</button>
            </div>
          </div>

          <div class="config-item">
            <label class="config-label">Travel Pace</label>
            <select class="form-control" id="builder-pace-select">
              <option value="balanced" selected>Balanced (3 acts/day)</option>
              <option value="relaxed">Relaxed (2 acts/day)</option>
              <option value="adventurous">Adventurous (4 acts/day)</option>
            </select>
          </div>

          <div class="config-item">
            <button class="btn btn-outline-teal btn-sm" onclick="BuilderView.triggerSmartGenerator()" style="width: 100%;">
              Regenerate
            </button>
          </div>
        </div>

        <!-- Day Tabs Slider -->
        <div class="day-tabs-slider" id="builder-day-tabs">
          <!-- Rendered dynamically -->
        </div>

        <!-- Main Builder Layout: Timeline & Live Summary -->
        <div class="builder-layout">
          <!-- Left: Active Day Timeline -->
          <div class="day-board" id="builder-active-day-board">
            <!-- Rendered dynamically -->
          </div>

          <!-- Right: Summary Sidebar -->
          <div class="builder-sidebar">
            <div class="builder-summary-widget">
              <h3 style="font-size: var(--text-base); margin-bottom: var(--space-3); color: #fff;">Journey Metrics</h3>
              <div class="summary-metric">
                <span>Total Days</span>
                <span class="summary-metric-val" id="metric-total-days">${trip.days ? trip.days.length : 0} Days</span>
              </div>
              <div class="summary-metric">
                <span>Total Scheduled Activities</span>
                <span class="summary-metric-val" id="metric-total-activities">0</span>
              </div>
              <div class="summary-metric">
                <span>Estimated Activities Outlay</span>
                <span class="summary-metric-val" id="metric-total-act-cost" style="color:var(--accent-emerald);">${VoyaraCurrency.format(0)}</span>
              </div>
              <div class="summary-metric">
                <span>Target Trip Budget</span>
                <span class="summary-metric-val">${VoyaraCurrency.format(trip.budget || 3000)}</span>
              </div>

              <div style="margin-top: var(--space-4);">
                <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="voyaraRouter.navigate('budget')">
                  Open Budget Breakdown &rarr;
                </button>
              </div>
            </div>

            <!-- Suggestion Drawer -->
            <div class="builder-summary-widget">
              <h4 style="font-size: 0.72rem; margin-bottom: var(--space-2); color: var(--accent-champagne); text-transform: uppercase; letter-spacing: 0.08em;">
                Quick Suggestions
              </h4>
              <p style="font-size: 0.7rem; color: var(--color-text-muted); margin-bottom: var(--space-3);">
                Click to add instant signature experiences for ${currentDest.name}:
              </p>
              <div style="display:flex; flex-direction:column; gap:var(--space-2);" id="builder-suggestions-list">
                <!-- Rendered dynamically -->
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add / Edit Activity Modal (Compact & Elegant) -->
      <div class="modal-overlay" id="activity-modal">
        <div class="glass-panel modal-card">
          <div class="modal-header">
            <h3 style="color: #fff; font-size: var(--text-base);" id="activity-modal-title">Add Itinerary Experience</h3>
            <button class="modal-close" onclick="BuilderView.closeActivityModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="activity-form" onsubmit="BuilderView.saveActivity(event)">
              <div class="form-group">
                <label class="form-label">Activity Title *</label>
                <input type="text" class="form-control" id="act-form-title" placeholder="e.g. Sunset Clifftop Tasting" required>
                <div class="form-error" id="act-title-error">Please provide a valid activity title</div>
              </div>
              <div class="form-group">
                <label class="form-label">Category</label>
                <select class="form-control" id="act-form-category">
                  <option value="Adventure">Adventure 🏄‍♂️</option>
                  <option value="Culture" selected>Culture 🏛️</option>
                  <option value="Culinary">Culinary 🍷</option>
                  <option value="Relaxation">Relaxation 🌅</option>
                </select>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
                <div class="form-group">
                  <label class="form-label">Start Time</label>
                  <input type="text" class="form-control" id="act-form-time" placeholder="e.g. 10:00 AM" value="10:00 AM">
                </div>
                <div class="form-group">
                  <label class="form-label">Cost (USD Base Amount)</label>
                  <input type="number" class="form-control" id="act-form-cost" min="0" value="45">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Description / Notes</label>
                <textarea class="form-control" id="act-form-desc" rows="2" placeholder="Brief details, meeting spot or reservations..."></textarea>
              </div>
              <div class="modal-footer" style="padding: 0; margin-top: var(--space-4);">
                <button type="button" class="btn btn-secondary btn-sm" onclick="BuilderView.closeActivityModal()">Cancel</button>
                <button type="submit" class="btn btn-primary btn-sm">Save Experience</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    this.renderDayTabs();
    this.renderActiveDayBoard();
    this.updateMetrics();
    this.renderSuggestions();
  },

  renderDayTabs() {
    const container = document.getElementById('builder-day-tabs');
    if (!container) return;

    const days = voyaraState.activeTrip.days || [];
    container.innerHTML = `
      ${days.map((day, idx) => `
        <button class="day-tab-btn ${idx === this.currentDayIndex ? 'active' : ''}" onclick="BuilderView.selectDay(${idx})">
          Day ${day.day_number}
          <span>${day.activities ? day.activities.length : 0} items</span>
        </button>
      `).join('')}
      <button class="add-day-btn" onclick="BuilderView.addDay()">+ Add Day</button>
    `;
  },

  selectDay(index) {
    this.currentDayIndex = index;
    this.renderDayTabs();
    this.renderActiveDayBoard();
  },

  renderActiveDayBoard() {
    const container = document.getElementById('builder-active-day-board');
    if (!container) return;

    const days = voyaraState.activeTrip.days || [];
    const activeDay = days[this.currentDayIndex];

    if (!activeDay) {
      container.innerHTML = `<div class="empty-state"><p>No day selected.</p></div>`;
      return;
    }

    const activities = activeDay.activities || [];

    container.innerHTML = `
      <div class="day-board-header">
        <div>
          <span class="text-uppercase-tracked" style="color:var(--accent-champagne);">Scheduled Experiences</span>
          <h2 class="day-board-title">Day ${activeDay.day_number} &bull; ${activeDay.date || 'Flexible Date'}</h2>
          <p style="font-size: 0.72rem; color: var(--color-text-muted);">${activeDay.notes || 'Curated schedule for the day'}</p>
        </div>
        <button class="btn btn-outline-teal btn-sm" onclick="BuilderView.openActivityModal()">
          + Add Activity
        </button>
      </div>

      <div class="activity-timeline">
        ${activities.length === 0 ? `
          <div class="empty-state" style="padding: var(--space-6);">
            <div class="empty-state-icon" style="font-size: 2rem;">📝</div>
            <h4 style="color:#fff; margin-bottom: 0.25rem; font-size:var(--text-sm);">No Experiences Scheduled for Day ${activeDay.day_number}</h4>
            <p style="font-size: 0.72rem; color:var(--color-text-muted); margin-bottom: 0.85rem;">Add customized stops or click below to autofill with destination highlights.</p>
            <button class="btn btn-primary btn-sm" onclick="BuilderView.autofillDay(${this.currentDayIndex})">Autofill Day Plan</button>
          </div>
        ` : activities.map((act, idx) => `
          <div class="activity-item">
            <span class="activity-time-badge">${act.time || 'Flexible'}</span>
            <div class="activity-content">
              <span class="activity-category-tag">${act.category || 'Culture'}</span>
              <h4 class="activity-title">${act.title}</h4>
              <p class="activity-desc">${act.desc || 'No additional notes.'}</p>
              <div class="activity-meta-row">
                <span class="activity-cost">${VoyaraCurrency.format(act.cost || 0)} / person</span>
                <span>Order: #${idx + 1}</span>
              </div>
            </div>
            <div class="activity-actions">
              <button class="btn-icon-tiny" onclick="BuilderView.moveActivity(${idx}, -1)" title="Move earlier" ${idx === 0 ? 'disabled' : ''}>▲</button>
              <button class="btn-icon-tiny" onclick="BuilderView.moveActivity(${idx}, 1)" title="Move later" ${idx === activities.length - 1 ? 'disabled' : ''}>▼</button>
              <button class="btn-icon-tiny delete" onclick="BuilderView.deleteActivity(${idx})" title="Remove activity">✕</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderSuggestions() {
    const list = document.getElementById('builder-suggestions-list');
    if (!list) return;

    const dest = voyaraState.destinations.find(d => d.id === voyaraState.activeTrip.destination_id) || voyaraState.destinations[0];
    const samples = dest.sample_activities || [];

    list.innerHTML = samples.map(s => `
      <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-sm); padding: var(--space-2) var(--space-3); cursor: pointer;"
           onclick="BuilderView.addSuggestedActivity('${s.title.replace(/'/g, "\\'")}', '${s.category}', '${s.time}', ${s.cost}, '${s.desc.replace(/'/g, "\\'")}')">
        <div style="font-size: 0.72rem; font-weight: 700; color:#fff;">+ ${s.title}</div>
        <div style="font-size: 0.68rem; color: var(--accent-emerald);">${VoyaraCurrency.format(s.cost)} &bull; ${s.category}</div>
      </div>
    `).join('');
  },

  addSuggestedActivity(title, category, time, cost, desc) {
    const days = voyaraState.activeTrip.days;
    if (!days || !days[this.currentDayIndex]) return;

    if (!days[this.currentDayIndex].activities) {
      days[this.currentDayIndex].activities = [];
    }

    days[this.currentDayIndex].activities.push({
      id: Date.now(),
      title,
      category,
      time,
      cost,
      desc
    });

    this.renderDayTabs();
    this.renderActiveDayBoard();
    this.updateMetrics();
    VoyaraToast.show(`Added "${title}" to Day ${days[this.currentDayIndex].day_number}`, 'success');
  },

  addDay() {
    const days = voyaraState.activeTrip.days || [];
    const nextDayNum = days.length + 1;
    const lastDate = days.length > 0 ? new Date(days[days.length - 1].date) : new Date();
    const nextDate = new Date(lastDate.getTime() + 86400000).toISOString().split('T')[0];

    days.push({
      day_number: nextDayNum,
      date: nextDate,
      notes: `Day ${nextDayNum} Exploration`,
      activities: []
    });

    voyaraState.activeTrip.days_count = days.length;
    this.currentDayIndex = days.length - 1;
    this.renderDayTabs();
    this.renderActiveDayBoard();
    this.updateMetrics();
    VoyaraToast.show(`Day ${nextDayNum} added to itinerary`, 'info');
  },

  moveActivity(index, delta) {
    const activeDay = voyaraState.activeTrip.days[this.currentDayIndex];
    if (!activeDay || !activeDay.activities) return;

    const targetIdx = index + delta;
    if (targetIdx < 0 || targetIdx >= activeDay.activities.length) return;

    const temp = activeDay.activities[index];
    activeDay.activities[index] = activeDay.activities[targetIdx];
    activeDay.activities[targetIdx] = temp;

    this.renderActiveDayBoard();
  },

  deleteActivity(index) {
    const activeDay = voyaraState.activeTrip.days[this.currentDayIndex];
    if (!activeDay || !activeDay.activities) return;

    const removed = activeDay.activities.splice(index, 1);
    this.renderDayTabs();
    this.renderActiveDayBoard();
    this.updateMetrics();
    VoyaraToast.show(`Removed experience`, 'info');
  },

  openActivityModal() {
    const modal = document.getElementById('activity-modal');
    if (modal) {
      document.getElementById('activity-form').reset();
      document.getElementById('act-title-error').classList.remove('visible');
      modal.classList.add('active');
    }
  },

  closeActivityModal() {
    const modal = document.getElementById('activity-modal');
    if (modal) modal.classList.remove('active');
  },

  saveActivity(e) {
    e.preventDefault();
    const title = document.getElementById('act-form-title').value.trim();
    if (!title) {
      document.getElementById('act-title-error').classList.add('visible');
      return;
    }

    const category = document.getElementById('act-form-category').value;
    const time = document.getElementById('act-form-time').value.trim() || 'Flexible';
    const cost = parseFloat(document.getElementById('act-form-cost').value) || 0;
    const desc = document.getElementById('act-form-desc').value.trim();

    const activeDay = voyaraState.activeTrip.days[this.currentDayIndex];
    if (!activeDay.activities) activeDay.activities = [];

    activeDay.activities.push({
      id: Date.now(),
      title,
      category,
      time,
      cost,
      desc
    });

    this.closeActivityModal();
    this.renderDayTabs();
    this.renderActiveDayBoard();
    this.updateMetrics();
    VoyaraToast.show('Activity successfully saved', 'success');
  },

  triggerSmartGenerator() {
    const pace = document.getElementById('builder-pace-select') ? document.getElementById('builder-pace-select').value : 'balanced';
    const daysCount = voyaraState.activeTrip.days ? voyaraState.activeTrip.days.length : 5;

    voyaraState.generateRuleBasedItinerary(voyaraState.activeTrip.destination_id, daysCount, pace);
    this.renderDayTabs();
    this.renderActiveDayBoard();
    this.updateMetrics();
    VoyaraToast.show(`Intelligent ${pace} itinerary generated!`, 'success');
  },

  autofillDay(dayIdx) {
    const dest = voyaraState.destinations.find(d => d.id === voyaraState.activeTrip.destination_id) || voyaraState.destinations[0];
    const samples = dest.sample_activities || [];
    voyaraState.activeTrip.days[dayIdx].activities = JSON.parse(JSON.stringify(samples));
    this.renderDayTabs();
    this.renderActiveDayBoard();
    this.updateMetrics();
    VoyaraToast.show(`Day ${dayIdx + 1} autofilled with signature highlights`, 'success');
  },

  updateDestination(newDestId) {
    const dest = voyaraState.destinations.find(d => d.id === Number(newDestId));
    if (!dest) return;

    voyaraState.activeTrip.destination_id = dest.id;
    voyaraState.activeTrip.destination_name = `${dest.name}, ${dest.country}`;
    voyaraState.activeTrip.destination_img = dest.image_url;
    voyaraState.activeTrip.title = `${dest.name} Horizon Expedition`;

    this.render();
    VoyaraToast.show(`Destination switched to ${dest.name}`, 'info');
  },

  adjustTravelers(delta) {
    let count = (voyaraState.activeTrip.travellers || 2) + delta;
    if (count < 1) count = 1;
    if (count > 20) count = 20;

    voyaraState.activeTrip.travellers = count;
    const countEl = document.getElementById('builder-travellers-count');
    if (countEl) countEl.textContent = count;
    this.updateMetrics();
  },

  updateDates() {
    const dateInput = document.getElementById('builder-start-date');
    if (dateInput && dateInput.value) {
      voyaraState.activeTrip.start_date = dateInput.value;
      // Re-date days
      const days = voyaraState.activeTrip.days || [];
      const base = new Date(dateInput.value);
      days.forEach((day, idx) => {
        day.date = new Date(base.getTime() + idx * 86400000).toISOString().split('T')[0];
      });
      this.renderActiveDayBoard();
    }
  },

  updateMetrics() {
    const days = voyaraState.activeTrip.days || [];
    let actCount = 0;
    let actCost = 0;
    const travellers = voyaraState.activeTrip.travellers || 2;

    days.forEach(d => {
      if (d.activities) {
        actCount += d.activities.length;
        d.activities.forEach(a => {
          actCost += (a.cost || 0) * travellers;
        });
      }
    });

    const elDays = document.getElementById('metric-total-days');
    const elActs = document.getElementById('metric-total-activities');
    const elCost = document.getElementById('metric-total-act-cost');

    if (elDays) elDays.textContent = `${days.length} Days`;
    if (elActs) elActs.textContent = `${actCount} Experiences`;
    if (elCost) elCost.textContent = VoyaraCurrency.format(actCost);
  },

  async saveTripToBackend() {
    if (!voyaraState.currentUser) {
      VoyaraToast.show('Please sign in to save your expedition to your account.', 'warning');
      voyaraRouter.navigate('signin');
      return;
    }

    const saveBtn = document.getElementById('builder-save-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '⏳ Saving...';
    }

    try {
      const res = await voyaraState.saveActiveTripToBackend();
      if (res && res.saved) {
        VoyaraToast.show('Expedition & itinerary saved to your account!', 'success');
      } else {
        VoyaraToast.show((res && res.reason) || 'Failed to save expedition', 'error');
      }
    } catch (err) {
      VoyaraToast.show('Error saving expedition: ' + err.message, 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '💾 Save to Account';
      }
    }
  }
};
