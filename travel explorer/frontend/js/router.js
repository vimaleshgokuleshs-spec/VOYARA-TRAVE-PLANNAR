/* ==========================================================================
   VOYARA CLIENT ROUTER
   Seamless hash-based navigation across 6 main screens + Sign In / Sign Up
   ========================================================================== */

class VoyaraRouter {
  constructor() {
    this.routes = {
      'discover': () => voyaraViews.discover.render(),
      'destinations': () => voyaraViews.destinations.render(),
      'detail': (params) => voyaraViews.detail.render(params.get('id')),
      'builder': () => voyaraViews.builder.render(),
      'budget': () => voyaraViews.budget.render(),
      'trips': () => voyaraViews.profile.render(),
      'signin': () => voyaraViews.auth.renderSignIn(),
      'signup': () => voyaraViews.auth.renderSignUp()
    };

    window.addEventListener('hashchange', () => this.handleRoute());
  }

  init() {
    this.handleRoute();
  }

  navigate(path) {
    window.location.hash = path;
  }

  handleRoute() {
    const rawHash = window.location.hash.slice(1) || 'discover';
    const [pathPart, queryPart] = rawHash.split('?');
    const routeName = pathPart.toLowerCase() || 'discover';
    const params = new URLSearchParams(queryPart || '');

    // Highlight active navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
      const targetHash = link.getAttribute('href') ? link.getAttribute('href').replace('#', '') : '';
      if (targetHash === routeName || (routeName === 'detail' && targetHash === 'destinations')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Hide all view screens
    document.querySelectorAll('.view-screen').forEach(screen => {
      screen.classList.remove('active');
      screen.style.display = 'none';
    });

    // Show matching screen container
    const activeScreen = document.getElementById(`view-${routeName}`);
    if (activeScreen) {
      activeScreen.style.display = 'block';
      setTimeout(() => activeScreen.classList.add('active'), 20);
    }

    // Execute route handler
    if (this.routes[routeName]) {
      this.routes[routeName](params);
    } else {
      this.routes['discover']();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update state
    voyaraState.currentView = routeName;
  }
}

const voyaraRouter = new VoyaraRouter();
window.voyaraRouter = voyaraRouter;
