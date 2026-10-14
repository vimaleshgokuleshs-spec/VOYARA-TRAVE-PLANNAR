/* ==========================================================================
   VOYARA CURRENCY UTILITY
   Centralized, locale-aware currency switcher (INR ₹ / USD $)
   
   Configured Benchmark Exchange Rate:
   1 USD = 85.00 INR (Industry benchmark representative rate)
   Base currency: USD (All persistent trip & destination data is stored in USD)
   Default for first-time visitors: INR (₹)
   ========================================================================== */

const VoyaraCurrency = {
  // Exchange rates relative to base currency (USD)
  EXCHANGE_RATES: {
    USD: 1.0,
    INR: 85.0
  },

  currentCurrency: 'INR',

  init() {
    // Check localStorage for saved user preference, default to INR for new users
    try {
      const saved = localStorage.getItem('voyara_currency');
      if (saved === 'USD' || saved === 'INR') {
        this.currentCurrency = saved;
      } else {
        this.currentCurrency = 'INR';
        localStorage.setItem('voyara_currency', 'INR');
      }
    } catch (e) {
      this.currentCurrency = 'INR';
    }
    this.updateSelectorUI();
  },

  setCurrency(currencyCode) {
    if (currencyCode !== 'INR' && currencyCode !== 'USD') return;
    if (this.currentCurrency === currencyCode) {
      this.updateSelectorUI();
      return;
    }

    this.currentCurrency = currencyCode;
    try {
      localStorage.setItem('voyara_currency', currencyCode);
    } catch (e) {}

    this.updateSelectorUI();

    // Notify state subscribers if available
    const state = window.voyaraState || (typeof voyaraState !== 'undefined' ? voyaraState : null);
    if (state && typeof state.notify === 'function') {
      state.notify('currencyChanged', currencyCode);
    }

    // Re-render current active view to reflect updated prices immediately
    this.refreshCurrentView();

    if (window.VoyaraToast) {
      const label = currencyCode === 'INR' ? 'Indian Rupee (₹)' : 'US Dollar ($)';
      VoyaraToast.show(`Display currency switched to ${label}`, 'info', 2500);
    }
  },

  getCurrency() {
    return this.currentCurrency;
  },

  /**
   * Convert base USD amount to display currency without mutating original amount
   * @param {number|string} amountInUsd - Underlying base amount in USD
   * @param {string} [targetCurrency] - Optional currency override (defaults to current)
   * @returns {number} Converted amount
   */
  convert(amountInUsd, targetCurrency = this.currentCurrency) {
    if (amountInUsd === null || amountInUsd === undefined || amountInUsd === '' || isNaN(Number(amountInUsd))) {
      return 0;
    }
    const num = Number(amountInUsd);
    if (targetCurrency === 'INR') {
      return Math.round(num * this.EXCHANGE_RATES.INR);
    }
    return Math.round(num);
  },

  /**
   * Format base USD amount into localized display string with proper currency symbol
   * @param {number|string} amountInUsd - Underlying base amount in USD
   * @param {string} [targetCurrency] - Optional currency override
   * @returns {string} Formatted localized currency string, e.g. "₹25,000" or "$300"
   */
  format(amountInUsd, targetCurrency = this.currentCurrency) {
    if (amountInUsd === null || amountInUsd === undefined || amountInUsd === '' || isNaN(Number(amountInUsd))) {
      return targetCurrency === 'INR' ? '₹0' : '$0';
    }
    const converted = this.convert(amountInUsd, targetCurrency);

    try {
      if (targetCurrency === 'INR') {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
        }).format(converted);
      } else {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0
        }).format(converted);
      }
    } catch (e) {
      // Graceful fallback if Intl fails
      const symbol = targetCurrency === 'INR' ? '₹' : '$';
      return `${symbol}${converted.toLocaleString()}`;
    }
  },

  updateSelectorUI() {
    const inrBtns = document.querySelectorAll('.currency-opt-inr');
    const usdBtns = document.querySelectorAll('.currency-opt-usd');

    inrBtns.forEach(btn => {
      btn.classList.toggle('active', this.currentCurrency === 'INR');
      btn.setAttribute('aria-pressed', this.currentCurrency === 'INR');
    });

    usdBtns.forEach(btn => {
      btn.classList.toggle('active', this.currentCurrency === 'USD');
      btn.setAttribute('aria-pressed', this.currentCurrency === 'USD');
    });
  },

  refreshCurrentView() {
    const state = window.voyaraState || (typeof voyaraState !== 'undefined' ? voyaraState : null);
    const views = window.voyaraViews || {};

    let viewName = (state && state.currentView) ? state.currentView : '';
    if (!viewName) {
      const hash = window.location.hash.slice(1).split('?')[0].toLowerCase();
      viewName = hash || 'discover';
    }

    if (viewName === 'discover') {
      const disc = views.discover || (typeof DiscoverView !== 'undefined' ? DiscoverView : null);
      if (disc && typeof disc.renderFeaturedCards === 'function') {
        disc.renderFeaturedCards();
      }
    } else if (viewName === 'destinations') {
      const dest = views.destinations || (typeof DestinationsView !== 'undefined' ? DestinationsView : null);
      if (dest && typeof dest.filterAndRender === 'function') {
        dest.filterAndRender();
      }
    } else if (viewName === 'detail') {
      const det = views.detail || (typeof DestinationDetailView !== 'undefined' ? DestinationDetailView : null);
      if (det && typeof det.render === 'function') {
        const rawHash = window.location.hash.slice(1);
        const [, queryPart] = rawHash.split('?');
        const params = new URLSearchParams(queryPart || '');
        const id = params.get('id') || (state && state.activeDestinationId) || 1;
        det.render(id);
      }
    } else if (viewName === 'builder') {
      const bld = views.builder || (typeof BuilderView !== 'undefined' ? BuilderView : null);
      if (bld && typeof bld.render === 'function') {
        bld.render();
      }
    } else if (viewName === 'budget') {
      const bdg = views.budget || (typeof BudgetView !== 'undefined' ? BudgetView : null);
      if (bdg && typeof bdg.render === 'function') {
        bdg.render();
      }
    } else if (viewName === 'trips') {
      const prof = views.profile || (typeof ProfileView !== 'undefined' ? ProfileView : null);
      if (prof && typeof prof.render === 'function') {
        prof.render();
      }
    }
  }
};

// Explicit global attachment
window.VoyaraCurrency = VoyaraCurrency;
