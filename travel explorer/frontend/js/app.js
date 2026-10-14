/* ==========================================================================
   VOYARA APPLICATION BOOTSTRAP & UTILITIES
   Toast notification system, header scroll effects, mobile drawer, state binding
   ========================================================================== */

// 1. Toast Notification System
const VoyaraToast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 4000) {
    if (!this.container) this.init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    if (type === 'warning') icon = '⚠️';
    if (type === 'error') icon = '✕';

    toast.innerHTML = `
      <span style="font-weight: 800; color: var(--accent-cyan); font-size: 1.1rem;">${icon}</span>
      <div style="flex: 1; line-height: 1.4;">${message}</div>
    `;

    this.container.appendChild(toast);

    // Trigger entrance animation
    setTimeout(() => toast.classList.add('show'), 20);

    // Auto dismiss
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }
};

// 2. View Controllers Registry
window.voyaraViews = {
  discover: DiscoverView,
  destinations: DestinationsView,
  detail: DestinationDetailView,
  builder: BuilderView,
  budget: BudgetView,
  profile: ProfileView,
  auth: AuthView
};

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Toast
  VoyaraToast.init();

  // Initialize State (fetches backend destinations from SQLite API)
  if (window.voyaraState) {
    voyaraState.init();
  }

  // Initialize Currency Switcher (INR default, persisted in localStorage)
  if (window.VoyaraCurrency) {
    VoyaraCurrency.init();
  }

  // Restore authenticated session if session cookie exists
  if (window.AuthView) {
    AuthView.initAuth();
  }

  // Header scroll appearance
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (header) {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  }, { passive: true });

  // Mobile Drawer Toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const mobileClose = document.getElementById('mobile-drawer-close');

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileDrawer.classList.add('open');
    });
  }

  if (mobileClose && mobileDrawer) {
    mobileClose.addEventListener('click', () => {
      mobileDrawer.classList.remove('open');
    });
  }

  // Close mobile drawer on link click
  document.querySelectorAll('.mobile-drawer .nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (mobileDrawer) mobileDrawer.classList.remove('open');
    });
  });

  // Update navbar favorites badge count
  const updateFavBadge = () => {
    const badge = document.getElementById('nav-fav-count');
    if (badge) {
      const count = voyaraState.favorites.size;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  };

  // State subscriptions for reactive views
  voyaraState.subscribe('favoritesChanged', () => {
    updateFavBadge();
    if (voyaraState.currentView === 'trips' && window.voyaraViews && voyaraViews.profile) {
      voyaraViews.profile.render();
    }
  });

  voyaraState.subscribe('tripsChanged', () => {
    if (voyaraState.currentView === 'trips' && window.voyaraViews && voyaraViews.profile) {
      voyaraViews.profile.render();
    }
  });

  voyaraState.subscribe('destinationsLoaded', () => {
    if (voyaraState.currentView === 'destinations' && window.voyaraViews && voyaraViews.destinations) {
      voyaraViews.destinations.render();
    } else if (voyaraState.currentView === 'discover' && window.voyaraViews && voyaraViews.discover) {
      voyaraViews.discover.render();
    }
  });

  updateFavBadge();

  // Initialize Router
  voyaraRouter.init();
});
