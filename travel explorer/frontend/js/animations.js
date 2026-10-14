/* ==========================================================================
   VOYARA ANIMATION CONTROLLER (GSAP & Vanilla Fallbacks)
   Cinematic hero reveal, smooth scroll triggers, and card hover physics
   ========================================================================== */

const VoyaraAnimations = {
  initHero() {
    // If GSAP is loaded via CDN/vendor
    if (window.gsap) {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      
      tl.from(".hero-badge-pill", { opacity: 0, y: -20, duration: 0.8, delay: 0.2 })
        .from(".hero-title", { opacity: 0, y: 30, duration: 1, letterSpacing: "0.25em" }, "-=0.5")
        .from(".hero-tagline", { opacity: 0, y: 20, duration: 0.8 }, "-=0.6")
        .from(".hero-description", { opacity: 0, y: 20, duration: 0.8 }, "-=0.6")
        .from(".hero-search-glass", { opacity: 0, y: 40, scale: 0.96, duration: 0.9 }, "-=0.5")
        .from(".hero-stat-card", { opacity: 0, y: 25, stagger: 0.15, duration: 0.7 }, "-=0.5");

      // Subtle parallax on hero background
      window.addEventListener("scroll", () => {
        const scrolled = window.scrollY;
        const bg = document.querySelector(".hero-background");
        if (bg && scrolled < window.innerHeight) {
          bg.style.transform = `scale(1) translateY(${scrolled * 0.25}px)`;
        }
      }, { passive: true });
    }
  },

  animateCards(selector = ".destination-card") {
    if (window.gsap) {
      gsap.from(selector, {
        opacity: 0,
        y: 35,
        stagger: 0.08,
        duration: 0.6,
        ease: "power2.out"
      });
    }
  },

  pulseElement(el) {
    if (window.gsap && el) {
      gsap.fromTo(el, { scale: 1 }, { scale: 1.15, duration: 0.2, yoyo: true, repeat: 1, ease: "power1.inOut" });
    }
  }
};
