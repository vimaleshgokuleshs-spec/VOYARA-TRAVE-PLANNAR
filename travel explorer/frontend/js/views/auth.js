/* ==========================================================================
   VOYARA VIEW: AUTHENTICATION (Sign In & Create Account)
   Secure UX, bcrypt password hashing, HTTP-only session cookies & API integration
   ========================================================================== */

const AuthView = {
  renderSignIn() {
    const container = document.getElementById('view-signin');
    if (!container) return;

    container.innerHTML = `
      <div class="auth-page-wrap">
        <div class="auth-glass-box">
          <div class="auth-header">
            <span class="auth-brand-logo">VOYARA</span>
            <h1 class="auth-title">Welcome Back</h1>
            <p class="auth-subtitle">Sign in to access your curated horizons & itineraries</p>
          </div>

          <div id="signin-server-alert" style="display:none; padding: 0.65rem 0.9rem; margin-bottom: var(--space-4); background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-sm); font-size: var(--text-xs); color: #fca5a5;"></div>

          <form id="signin-form" onsubmit="AuthView.handleSignIn(event)">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-control" id="signin-email" placeholder="name@domain.com" required autocomplete="email">
              <div class="form-error" id="signin-email-error">Please enter a valid email address.</div>
            </div>

            <div class="form-group">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <label class="form-label">Password</label>
                <a href="javascript:void(0)" onclick="VoyaraToast.show('To reset your credentials, please contact support@voyara.com', 'info')" style="font-size:0.72rem; color:var(--accent-teal-light); text-decoration:none;">Forgot password?</a>
              </div>
              <div class="password-input-wrap">
                <input type="password" class="form-control" id="signin-password" placeholder="Enter your password" required autocomplete="current-password">
                <button type="button" class="password-toggle-btn" onclick="AuthView.togglePassword('signin-password', this)" title="Show/Hide Password" aria-label="Toggle password visibility">
                  👁️
                </button>
              </div>
              <div class="form-error" id="signin-password-error">Password is required.</div>
            </div>

            <label class="checkbox-row" style="cursor:pointer;" onclick="const cb = document.getElementById('signin-remember'); cb.checked = !cb.checked; this.querySelector('.custom-checkbox').style.background = cb.checked ? 'var(--gradient-brand)' : 'rgba(7, 14, 28, 0.6)';">
              <input type="checkbox" id="signin-remember" style="display:none;" checked>
              <span class="custom-checkbox" style="background:var(--gradient-brand);">✓</span>
              <span class="checkbox-label">Remember my secure session for 30 days</span>
            </label>

            <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; margin-top: var(--space-2);" id="signin-submit-btn">
              Sign In to Voyara
            </button>
          </form>

          <div class="auth-footer">
            Don't have an explorer account? 
            <a href="#signup">Create an Account</a>
          </div>
        </div>
      </div>
    `;
  },

  renderSignUp() {
    const container = document.getElementById('view-signup');
    if (!container) return;

    container.innerHTML = `
      <div class="auth-page-wrap">
        <div class="auth-glass-box">
          <div class="auth-header">
            <span class="auth-brand-logo">VOYARA</span>
            <h1 class="auth-title">Create Account</h1>
            <p class="auth-subtitle">Join Voyara to craft and save bespoke world itineraries</p>
          </div>

          <div id="signup-server-alert" style="display:none; padding: 0.65rem 0.9rem; margin-bottom: var(--space-4); background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-sm); font-size: var(--text-xs); color: #fca5a5;"></div>

          <form id="signup-form" onsubmit="AuthView.handleSignUp(event)">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" class="form-control" id="signup-name" placeholder="Alexander Wright" required minlength="2">
              <div class="form-error" id="signup-name-error">Please enter your full name (minimum 2 characters).</div>
            </div>

            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-control" id="signup-email" placeholder="name@domain.com" required autocomplete="email">
              <div class="form-error" id="signup-email-error">Please enter a valid email address.</div>
            </div>

            <div class="form-group">
              <label class="form-label">Create Password</label>
              <div class="password-input-wrap">
                <input type="password" class="form-control" id="signup-password" placeholder="At least 8 characters..." required minlength="8" oninput="AuthView.evaluatePasswordStrength(this.value)">
                <button type="button" class="password-toggle-btn" onclick="AuthView.togglePassword('signup-password', this)" title="Show/Hide Password" aria-label="Toggle password visibility">
                  👁️
                </button>
              </div>
              
              <!-- Password Strength Meter -->
              <div class="password-strength-container" style="margin-top: 0.5rem;">
                <div class="strength-bars-row" id="strength-meter-bars">
                  <div class="strength-bar bar-1"></div>
                  <div class="strength-bar bar-2"></div>
                  <div class="strength-bar bar-3"></div>
                  <div class="strength-bar bar-4"></div>
                </div>
                <div class="strength-text">
                  <span id="strength-label">Password Strength: Minimum 8 characters</span>
                  <span id="strength-score"></span>
                </div>
              </div>
              <div class="form-error" id="signup-password-error">Password must contain at least 8 characters.</div>
            </div>

            <div class="form-group">
              <label class="form-label">Confirm Password</label>
              <div class="password-input-wrap">
                <input type="password" class="form-control" id="signup-confirm-password" placeholder="Re-enter your password" required>
                <button type="button" class="password-toggle-btn" onclick="AuthView.togglePassword('signup-confirm-password', this)" title="Show/Hide Password" aria-label="Toggle password visibility">
                  👁️
                </button>
              </div>
              <div class="form-error" id="signup-confirm-error">Passwords do not match.</div>
            </div>

            <label class="checkbox-row" style="cursor:pointer;" onclick="const cb = document.getElementById('signup-terms'); cb.checked = !cb.checked; this.querySelector('.custom-checkbox').style.background = cb.checked ? 'var(--gradient-brand)' : 'rgba(7, 14, 28, 0.6)';">
              <input type="checkbox" id="signup-terms" style="display:none;" required>
              <span class="custom-checkbox" id="terms-box">✓</span>
              <span class="checkbox-label">I accept the Terms of Service & Privacy Policy</span>
            </label>
            <div class="form-error" id="signup-terms-error" style="margin-top:-0.5rem; margin-bottom:1rem;">You must accept the terms to create an account.</div>

            <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; margin-top: var(--space-2);" id="signup-submit-btn">
              Create My Voyara Account
            </button>
          </form>

          <div class="auth-footer">
            Already have an account? 
            <a href="#signin">Sign In</a>
          </div>
        </div>
      </div>
    `;
  },

  togglePassword(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      btnEl.textContent = '🔒';
    } else {
      input.type = 'password';
      btnEl.textContent = '👁️';
    }
  },

  evaluatePasswordStrength(password) {
    const meter = document.getElementById('strength-meter-bars');
    const label = document.getElementById('strength-label');
    const scoreText = document.getElementById('strength-score');
    if (!meter || !label) return;

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    meter.className = 'strength-bars-row';

    if (password.length === 0) {
      label.textContent = 'Password Strength: Minimum 8 characters';
      scoreText.textContent = '';
      return;
    }

    if (score <= 1) {
      meter.classList.add('strength-weak');
      label.textContent = 'Strength: Weak';
      scoreText.textContent = 'Needs numbers & symbols';
    } else if (score === 2) {
      meter.classList.add('strength-fair');
      label.textContent = 'Strength: Fair';
      scoreText.textContent = 'Add uppercase & special chars';
    } else if (score === 3) {
      meter.classList.add('strength-good');
      label.textContent = 'Strength: Good';
      scoreText.textContent = 'Strong password';
    } else {
      meter.classList.add('strength-strong');
      label.textContent = 'Strength: Excellent';
      scoreText.textContent = 'Optimal security';
    }
  },

  async handleSignIn(e) {
    e.preventDefault();
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;
    const remember = document.getElementById('signin-remember') ? document.getElementById('signin-remember').checked : true;
    const btn = document.getElementById('signin-submit-btn');
    const alertBox = document.getElementById('signin-server-alert');

    if (alertBox) alertBox.style.display = 'none';

    // Email validation
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    document.getElementById('signin-email-error').classList.toggle('visible', !emailValid);
    document.getElementById('signin-password-error').classList.toggle('visible', !password);

    if (!emailValid || !password) return;

    // Loading feedback
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Signing in...`;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, remember })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = data.detail || 'Invalid email or password. Please try again.';
        if (alertBox) {
          alertBox.textContent = errorMsg;
          alertBox.style.display = 'block';
        }
        VoyaraToast.show(errorMsg, 'error');
        btn.disabled = false;
        btn.innerHTML = `Sign In to Voyara`;
        return;
      }

      // Success
      const user = data.user;
      voyaraState.currentUser = user;
      this.updateNavbarAuthUI(user);
      await Promise.all([
        voyaraState.loadUserTrips(),
        voyaraState.loadUserFavorites()
      ]);

      VoyaraToast.show(`Welcome back, ${user.full_name}!`, 'success', 3000);

      // Navigate to intended page or My Trips
      setTimeout(() => {
        voyaraRouter.navigate('trips');
      }, 500);

    } catch (err) {
      const msg = 'Unable to reach authentication server. Please ensure backend is running.';
      if (alertBox) {
        alertBox.textContent = msg;
        alertBox.style.display = 'block';
      }
      VoyaraToast.show(msg, 'error');
      btn.disabled = false;
      btn.innerHTML = `Sign In to Voyara`;
    }
  },

  async handleSignUp(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm-password').value;
    const terms = document.getElementById('signup-terms').checked;
    const btn = document.getElementById('signup-submit-btn');
    const alertBox = document.getElementById('signup-server-alert');

    if (alertBox) alertBox.style.display = 'none';

    let valid = true;

    if (name.length < 2) {
      document.getElementById('signup-name-error').classList.add('visible');
      valid = false;
    } else {
      document.getElementById('signup-name-error').classList.remove('visible');
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    document.getElementById('signup-email-error').classList.toggle('visible', !emailValid);
    if (!emailValid) valid = false;

    if (password.length < 8) {
      document.getElementById('signup-password-error').classList.add('visible');
      valid = false;
    } else {
      document.getElementById('signup-password-error').classList.remove('visible');
    }

    if (password !== confirm) {
      document.getElementById('signup-confirm-error').classList.add('visible');
      valid = false;
    } else {
      document.getElementById('signup-confirm-error').classList.remove('visible');
    }

    if (!terms) {
      document.getElementById('signup-terms-error').classList.add('visible');
      valid = false;
    } else {
      document.getElementById('signup-terms-error').classList.remove('visible');
    }

    if (!valid) return;

    // Loading feedback
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Creating Account...`;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ full_name: name, email, password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = data.detail || 'Registration failed. Please check your information.';
        if (alertBox) {
          alertBox.textContent = errorMsg;
          alertBox.style.display = 'block';
        }
        VoyaraToast.show(errorMsg, 'error');
        btn.disabled = false;
        btn.innerHTML = `Create My Voyara Account`;
        return;
      }

      // Success
      const user = data.user;
      voyaraState.currentUser = user;
      this.updateNavbarAuthUI(user);
      await Promise.all([
        voyaraState.loadUserTrips(),
        voyaraState.loadUserFavorites()
      ]);

      VoyaraToast.show(`Account created! Welcome to Voyara, ${user.full_name}.`, 'success', 3500);

      // Navigate to My Trips & profile
      setTimeout(() => {
        voyaraRouter.navigate('trips');
      }, 500);

    } catch (err) {
      const msg = 'Unable to reach registration server. Please ensure backend is running.';
      if (alertBox) {
        alertBox.textContent = msg;
        alertBox.style.display = 'block';
      }
      VoyaraToast.show(msg, 'error');
      btn.disabled = false;
      btn.innerHTML = `Create My Voyara Account`;
    }
  },

  async handleSignOut() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {}

    voyaraState.currentUser = null;
    voyaraState.trips = [...VOYARA_DATA.initial_trips];
    voyaraState.favorites = new Set([1, 2]);
    this.updateNavbarAuthUI(null);
    voyaraState.notify('favoritesChanged', { total: voyaraState.favorites.size });
    voyaraState.notify('tripsChanged', voyaraState.trips);
    VoyaraToast.show('You have signed out of Voyara.', 'info', 3000);

    if (voyaraState.currentView === 'trips') {
      if (window.voyaraViews && voyaraViews.profile) {
        voyaraViews.profile.render();
      }
    }
  },

  async initAuth() {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      });
      if (res.ok) {
        const user = await res.json();
        voyaraState.currentUser = user;
        this.updateNavbarAuthUI(user);
        await Promise.all([
          voyaraState.loadUserTrips(),
          voyaraState.loadUserFavorites()
        ]);
      } else {
        voyaraState.currentUser = null;
        this.updateNavbarAuthUI(null);
      }
    } catch (e) {
      voyaraState.currentUser = null;
      this.updateNavbarAuthUI(null);
    }
  },

  updateNavbarAuthUI(user) {
    const authBtn = document.getElementById('nav-auth-btn');
    if (!authBtn) return;

    if (user) {
      const firstName = user.full_name ? user.full_name.split(' ')[0] : 'Explorer';
      const initial = user.full_name ? user.full_name.charAt(0).toUpperCase() : 'V';
      authBtn.href = '#trips';
      authBtn.title = `Signed in as ${user.full_name} (${user.email})`;
      authBtn.innerHTML = `
        <div class="user-avatar-mini">${initial}</div>
        <span>${firstName}</span>
      `;
    } else {
      authBtn.href = '#signin';
      authBtn.title = 'Sign In to Voyara';
      authBtn.innerHTML = `
        <div class="user-avatar-mini">V</div>
        <span>Sign In</span>
      `;
    }
  }
};

window.AuthView = AuthView;
