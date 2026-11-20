/**
 * POOKOYA THANGAL HOSPICE (PTH) - SAHACHARI
 * Modern JavaScript: Lenis Smooth Scroll + GSAP Animations
 */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 0. Initial Setup & Responsive Small Loading Spinner Dismissal
  // --------------------------------------------------------------------------
  const hidePreloader = () => {
    const loadingScreen = document.getElementById('pthLoadingScreen');
    document.body.classList.remove('loading-locked');
    document.documentElement.classList.remove('loading-locked');
    if (loadingScreen && !loadingScreen.classList.contains('fade-out')) {
      loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 400);
    }
  };

  // Dismiss smoothly once resources load, with quick fallback so user is never blocked
  if (document.readyState === 'complete') {
    hidePreloader();
  } else {
    window.addEventListener('load', hidePreloader);
    setTimeout(hidePreloader, 1200);
  }

  // Dynamic Copyright Year
  const currentFullYear = new Date().getFullYear();
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    yearEl.textContent = currentFullYear;
  }
  document.querySelectorAll('.current-year, [data-current-year]').forEach((el) => {
    el.textContent = currentFullYear;
  });

  // --------------------------------------------------------------------------
  // 1. Lenis Smooth Scroll Initialisation
  // --------------------------------------------------------------------------
  let lenis = null;

  try {
    if (typeof Lenis !== 'undefined') {
      lenis = new Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 0.95,
        touchMultiplier: 1.5,
        syncTouch: false,
        infinite: false,
        autoResize: true,
      });

      window.lenis = lenis;

      // GSAP ScrollTrigger Integration (Unified Single Ticker)
      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
          lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
      } else {
        function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
      }

      window.addEventListener('load', () => {
        if (lenis) lenis.resize();
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      });

      window.addEventListener('resize', () => {
        if (lenis) lenis.resize();
      }, { passive: true });

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          if (lenis) lenis.resize();
          if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        });
      }
    }
  } catch (err) {
    console.warn('Lenis Smooth Scroll init notice:', err);
  }

  // Smooth scroll for in-page anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#' && !this.getAttribute('data-bs-toggle')) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          const isServiceChip = this.classList.contains('service-pill-chip');
          const offsetVal = isServiceChip ? -95 : -80;

          if (lenis) {
            lenis.scrollTo(targetElement, {
              offset: offsetVal,
              duration: 1.15,
              easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
              immediate: false,
              lock: false,
            });
          } else {
            const targetPos = targetElement.getBoundingClientRect().top + window.pageYOffset + offsetVal;
            window.scrollTo({ top: targetPos, behavior: 'smooth' });
          }

          // Service Directory Chip Navigation Polish
          if (isServiceChip) {
            document.querySelectorAll('.service-pill-chip').forEach(c => c.classList.remove('is-active'));
            document.querySelectorAll(`.service-pill-chip[href="${targetId}"]`).forEach(c => c.classList.add('is-active'));

            const quickSlider = document.querySelector('.services-quick-slider');
            if (quickSlider) {
              quickSlider.classList.add('is-paused');
              setTimeout(() => {
                quickSlider.classList.remove('is-paused');
              }, 3000);
            }

            const card = targetElement.querySelector('.service-card') || targetElement;
            if (card) {
              card.classList.add('service-card-targeted');
              setTimeout(() => {
                card.classList.remove('service-card-targeted');
              }, 1600);
            }
          }

          // Nav Link Item Active State Polish
          if (this.classList.contains('nav-link-item')) {
            document.querySelectorAll('.pth-navbar .nav-link-item').forEach(l => l.classList.remove('active-home'));
            this.classList.add('active-home');
          }

          // Close mobile menu collapse if open
          const navCollapse = document.getElementById('mainNav');
          if (navCollapse && navCollapse.classList.contains('show') && typeof bootstrap !== 'undefined') {
            const bsCollapse = bootstrap.Collapse.getOrCreateInstance(navCollapse);
            if (bsCollapse) bsCollapse.hide();
          }
        }
      }
    });
  });

  // Quick Services Directory Slider Touch-Pause Support
  const quickSlider = document.querySelector('.services-quick-slider');
  if (quickSlider) {
    let touchResumeTimer = null;
    quickSlider.addEventListener('touchstart', () => {
      quickSlider.classList.add('is-paused');
      clearTimeout(touchResumeTimer);
    }, { passive: true });

    quickSlider.addEventListener('touchend', () => {
      touchResumeTimer = setTimeout(() => {
        quickSlider.classList.remove('is-paused');
      }, 2500);
    }, { passive: true });
  }

  // --------------------------------------------------------------------------
  // 2. Smart Fixed Navbar on Scroll Up & Reduced Logo Size on Scroll
  // --------------------------------------------------------------------------
  const navbar = document.querySelector('.pth-navbar-wrapper');
  const scrollProgressBar = document.getElementById('scrollProgressLine');
  const mainNav = document.getElementById('mainNav');

  let lastScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;

  const onScroll = () => {
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    const scrollDelta = scrollY - lastScrollY;
    const isMobileNavOpen = mainNav && mainNav.classList.contains('show');

    // Only fix & show navbar when scrolling UP (or at top of page)
    if (scrollY <= 20) {
      // At top of page: navbar in normal position, full size logo, transparent background
      navbar?.classList.remove('navbar-hidden');
      navbar?.classList.remove('scrolled');
    } else {
      if (isMobileNavOpen) {
        // Keep navbar visible while mobile menu is open
        navbar?.classList.remove('navbar-hidden');
        navbar?.classList.add('scrolled');
      } else if (scrollDelta > 4 && scrollY > 80) {
        // Scrolling DOWN: hide navbar smoothly to give full content view
        navbar?.classList.add('navbar-hidden');
      } else if (scrollDelta < -4) {
        // Scrolling UP: reveal fixed navbar with compact scrolled style & reduced logo
        navbar?.classList.remove('navbar-hidden');
        navbar?.classList.add('scrolled');
      } else if (!navbar?.classList.contains('navbar-hidden')) {
        // If stopped mid-page or on reload, ensure scrolled style is active
        navbar?.classList.add('scrolled');
      }
    }

    lastScrollY = scrollY <= 0 ? 0 : scrollY;

    // Top Reading Scroll Progress Line
    if (scrollProgressBar) {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
      scrollProgressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }

    // Dynamic Active Link State in Navbar on Scroll
    const navLinks = document.querySelectorAll('.pth-navbar .nav-link-item[href^="#"]');
    const scrollPos = scrollY + 120;
    navLinks.forEach((link) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
          const top = targetSection.getBoundingClientRect().top + scrollY;
          const height = targetSection.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            link.classList.add('active-home');
          } else {
            link.classList.remove('active-home');
          }
        }
      }
    });

    // Dynamic Active State for Quick Services Directory Chips on Scroll
    const serviceChips = document.querySelectorAll('.service-pill-chip');
    if (serviceChips.length > 0) {
      const serviceItems = document.querySelectorAll('.service-stream-item');
      let activeServiceId = null;

      serviceItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        if (rect.top <= 240 && rect.bottom >= 120) {
          activeServiceId = '#' + item.id;
        }
      });

      if (activeServiceId) {
        serviceChips.forEach((chip) => {
          if (chip.getAttribute('href') === activeServiceId) {
            chip.classList.add('is-active');
          } else {
            chip.classList.remove('is-active');
          }
        });
      }
    }

    // Dynamic Visibility for Floating Donation Button (Visible after Hero Section)
    const floatingDonateBtn = document.getElementById('pthFloatingDonate');
    const heroSection = document.getElementById('home') || document.querySelector('.pth-hero-container');
    if (floatingDonateBtn && heroSection) {
      const triggerThreshold = (heroSection.offsetTop + heroSection.offsetHeight) - 120;
      if (scrollY > triggerThreshold) {
        floatingDonateBtn.classList.add('is-visible');
      } else {
        floatingDonateBtn.classList.remove('is-visible');
      }
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  if (lenis) {
    lenis.on('scroll', onScroll);
  }
  onScroll();

  // --------------------------------------------------------------------------
  // 2b. Mobile Navbar Toggler State Sync & Outside Click Handling
  // --------------------------------------------------------------------------
  const pthNavCollapse = document.getElementById('mainNav');
  const pthNavToggler = document.querySelector('.pth-nav-toggler');

  if (pthNavCollapse && pthNavToggler) {
    pthNavCollapse.addEventListener('show.bs.collapse', () => {
      pthNavToggler.classList.remove('collapsed');
      pthNavToggler.setAttribute('aria-expanded', 'true');
    });

    pthNavCollapse.addEventListener('shown.bs.collapse', () => {
      pthNavToggler.classList.remove('collapsed');
      pthNavToggler.setAttribute('aria-expanded', 'true');
    });

    pthNavCollapse.addEventListener('hide.bs.collapse', () => {
      pthNavToggler.classList.add('collapsed');
      pthNavToggler.setAttribute('aria-expanded', 'false');
    });

    pthNavCollapse.addEventListener('hidden.bs.collapse', () => {
      pthNavToggler.classList.add('collapsed');
      pthNavToggler.setAttribute('aria-expanded', 'false');
    });

    // Close mobile navbar on tap outside
    document.addEventListener('click', (e) => {
      if (pthNavCollapse.classList.contains('show')) {
        if (!pthNavCollapse.contains(e.target) && !pthNavToggler.contains(e.target)) {
          if (typeof bootstrap !== 'undefined') {
            const bsCollapse = bootstrap.Collapse.getOrCreateInstance(pthNavCollapse);
            if (bsCollapse) bsCollapse.hide();
          }
        }
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && pthNavCollapse.classList.contains('show')) {
        if (typeof bootstrap !== 'undefined') {
          const bsCollapse = bootstrap.Collapse.getOrCreateInstance(pthNavCollapse);
          if (bsCollapse) bsCollapse.hide();
        }
        pthNavToggler.focus();
      }
    });

    // Automatically close mobile menu if resizing to desktop (>= 1200px)
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1200 && pthNavCollapse.classList.contains('show')) {
        if (typeof bootstrap !== 'undefined') {
          const bsCollapse = bootstrap.Collapse.getOrCreateInstance(pthNavCollapse);
          if (bsCollapse) bsCollapse.hide();
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // 3. GSAP Animations & Interactions (Hero Kinetic Typography & Scroll Triggers)
  // --------------------------------------------------------------------------
  let heroEntrancePlayed = false;

  // Kinetic Hero Typography Engine: Splits Malayalam into true grapheme clusters (aksharas)
  function splitIntoGraphemes(text) {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      try {
        const seg = new Intl.Segmenter('ml', { granularity: 'grapheme' });
        return Array.from(seg.segment(text), (s) => s.segment);
      } catch (e) {
        // Fallback to regex
      }
    }
    const matches = text.match(/[\u0D00-\u0D7F][\u0D3E-\u0D4D\u0D57\u0D62\u0D63]*|[^\u0D00-\u0D7F]/gu);
    return matches || Array.from(text);
  }

  function splitLineIntoCharSpans(el) {
    if (!el || el.dataset.letterSplitted === 'true') return;
    el.dataset.letterSplitted = 'true';

    const rawText = el.textContent.trim();
    if (!rawText) return;
    if (!el.getAttribute('aria-label')) {
      el.setAttribute('aria-label', rawText);
    }

    const words = rawText.split(/\s+/);
    const wordsHtml = words
      .map((word) => {
        const chars = splitIntoGraphemes(word);
        const charsHtml = chars
          .map((char) => `<span class="hero-char" aria-hidden="true">${char}</span>`)
          .join('');
        return `<span class="hero-word" aria-hidden="true">${charsHtml}</span>`;
      })
      .join('<span class="hero-space" aria-hidden="true">&nbsp;</span>');

    el.innerHTML = wordsHtml;
  }

  function splitBioIntoWordSpans(el) {
    if (!el || el.dataset.wordSplitted === 'true') return;
    el.dataset.wordSplitted = 'true';

    const rawText = el.textContent.trim();
    if (!rawText) return;
    if (!el.getAttribute('aria-label')) {
      el.setAttribute('aria-label', rawText);
    }

    const words = rawText.split(/\s+/);
    const wordsHtml = words
      .map((word) => `<span class="hero-bio-word" aria-hidden="true">${word}</span>`)
      .join(' ');

    el.innerHTML = wordsHtml;
  }

  function replayHeroLetterWave() {
    if (typeof gsap === 'undefined') return;
    const chars = document.querySelectorAll('.hero-script-heading .hero-char');
    if (!chars.length) return;

    gsap.killTweensOf(chars);
    gsap.fromTo(
      chars,
      {
        y: -14,
        scale: 1.18,
        rotate: (i) => (i % 2 === 0 ? -4 : 4),
        textShadow: (i, el) =>
          el.closest('.script-line-blue')
            ? '0 10px 24px rgba(0, 63, 148, 0.45)'
            : '0 10px 24px rgba(2, 123, 21, 0.45)',
      },
      {
        y: 0,
        scale: 1,
        rotate: 0,
        textShadow: '',
        duration: 0.65,
        stagger: {
          each: 0.03,
          from: 'start',
        },
        ease: 'elastic.out(1.2, 0.42)',
        clearProps: 'transform,textShadow',
      }
    );
  }

  function initHeroLetterTypography() {
    splitLineIntoCharSpans(document.querySelector('.script-line-blue'));
    splitLineIntoCharSpans(document.querySelector('.script-line-green'));
    splitBioIntoWordSpans(document.querySelector('.hero-bio-text'));

    // Interactive Replay: Clicking or tapping the hero heading re-ripples letters with a spring wave
    const heroHeading = document.querySelector('.hero-script-heading');
    if (heroHeading) {
      heroHeading.addEventListener('click', () => {
        replayHeroLetterWave();
      });
    }

    // Replay when clicking the HOME navigation link
    document.querySelectorAll('a[href="#home"]').forEach((homeLink) => {
      homeLink.addEventListener('click', () => {
        setTimeout(replayHeroLetterWave, 250);
      });
    });
  }

  // Pre-split the hero letters immediately upon script execution
  initHeroLetterTypography();

  // Play hero entrance immediately on first load
  playHeroEntrance();

  function playHeroEntrance() {
    if (heroEntrancePlayed || typeof gsap === 'undefined') return;
    heroEntrancePlayed = true;

    // Respect user's motion preferences
    const prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(
        '.hero-badge-pill, .hero-overline, .script-line-blue, .script-line-green, .hero-char, .hero-bio-word, .hero-bio-text, .hero-stat-chip, .btn, .hero-pure-img',
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          filter: 'none',
          clearProps: 'all',
        }
      );
      return;
    }

    // Navbar Entrance (Brand logo is always solid & visible, animate nav items cleanly)
    const navTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    navTl
      .fromTo(
        '.navbar-nav .nav-item',
        { y: -16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.05,
          clearProps: 'transform,opacity',
        }
      )
      .fromTo(
        '.nav-social-links a',
        { y: -12, opacity: 0, scale: 0.8 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.45,
          stagger: 0.05,
          ease: 'back.out(1.5)',
          clearProps: 'transform,opacity',
        },
        '-=0.25'
      );

    // Hero Elements Entrance Timeline
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // 1. Tagline Pill drops in
    heroTl.fromTo(
      '.hero-badge-pill, .hero-overline',
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.65, ease: 'power2.out', clearProps: 'transform,opacity' }
    );

    // 2. Line 1: "അതിരുകൾക്കപ്പുറം" Letter-by-Letter Kinetic Wave
    const blueChars = document.querySelectorAll('.script-line-blue .hero-char');
    if (blueChars.length) {
      heroTl.fromTo(
        blueChars,
        {
          y: 38,
          opacity: 0,
          scale: 0.76,
          rotateX: -45,
          filter: 'blur(7px)',
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          rotateX: 0,
          filter: 'blur(0px)',
          duration: 0.72,
          stagger: 0.04,
          ease: 'back.out(1.5)',
          clearProps: 'transform,opacity,filter',
        },
        '-=0.35'
      );
    } else {
      heroTl.fromTo(
        '.script-line-blue',
        { y: 35, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.4)', clearProps: 'transform,opacity' },
        '-=0.35'
      );
    }

    // 3. Line 2: "കരുതലിന്റെ കരങ്ങൾ" Letter-by-Letter Kinetic Wave
    const greenChars = document.querySelectorAll('.script-line-green .hero-char');
    if (greenChars.length) {
      heroTl.fromTo(
        greenChars,
        {
          y: 38,
          opacity: 0,
          scale: 0.76,
          rotateX: -45,
          filter: 'blur(7px)',
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          rotateX: 0,
          filter: 'blur(0px)',
          duration: 0.72,
          stagger: 0.04,
          ease: 'back.out(1.5)',
          clearProps: 'transform,opacity,filter',
        },
        '-=0.52'
      );
    } else {
      heroTl.fromTo(
        '.script-line-green',
        { y: 35, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.4)', clearProps: 'transform,opacity' },
        '-=0.52'
      );
    }

    // 4. Bio Text Paragraph: Word-by-Word Smooth Rise
    const bioWords = document.querySelectorAll('.hero-bio-text .hero-bio-word');
    if (bioWords.length) {
      heroTl.fromTo(
        bioWords,
        {
          y: 18,
          opacity: 0,
          filter: 'blur(5px)',
        },
        {
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 0.65,
          stagger: 0.065,
          ease: 'power2.out',
          clearProps: 'transform,opacity,filter',
        },
        '-=0.4'
      );
    } else {
      heroTl.fromTo(
        '.hero-bio-text',
        { y: 22, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.75, ease: 'power2.out', clearProps: 'transform,opacity' },
        '-=0.4'
      );
    }

    heroTl
      .fromTo(
        '.hero-stats-highlights .hero-stat-chip',
        { y: 18, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.55,
          stagger: 0.1,
          ease: 'back.out(1.4)',
          clearProps: 'transform,opacity',
        },
        '-=0.35'
      )
      .fromTo(
        '.hero-action-buttons .btn',
        { y: 18, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.55,
          stagger: 0.12,
          ease: 'back.out(1.5)',
          clearProps: 'transform,opacity',
        },
        '-=0.3'
      )
      .fromTo(
        '.hero-pure-img',
        { y: 25, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        },
        '-=0.5'
      );
  }

  // Trigger hero entrance immediately on first load
  playHeroEntrance();

  if (typeof gsap !== 'undefined') {
    // Number Counter Roll-Up Animation Helper
    function animateCounter(el, duration = 1.8) {
      if (!el || el.dataset.counterAnimated === 'true') return;
      el.dataset.counterAnimated = 'true';

      const originalText = el.textContent.trim();
      const match = originalText.match(/^([^\d]*)([\d,]+)([^\d]*)$/);
      if (!match) return;

      const prefix = match[1] || '';
      const rawNumberStr = match[2].replace(/,/g, '');
      const suffix = match[3] || '';
      const targetVal = parseInt(rawNumberStr, 10);
      if (isNaN(targetVal)) return;

      const hasLeadingZero = match[2].startsWith('0') && match[2].length > 1;
      const padLength = match[2].length;
      const hasCommas = match[2].includes(',');

      const obj = { val: 0 };
      gsap.to(obj, {
        val: targetVal,
        duration: duration,
        ease: 'power2.out',
        onUpdate: () => {
          const current = Math.floor(obj.val);
          let formatted;
          if (hasLeadingZero) {
            formatted = String(current).padStart(padLength, '0');
          } else if (hasCommas || targetVal >= 1000) {
            formatted = current.toLocaleString('en-US');
          } else {
            formatted = String(current);
          }
          el.textContent = prefix + formatted + suffix;
        },
        onComplete: () => {
          el.textContent = originalText;
        }
      });
    }

    // ScrollTrigger Choreography
    if (typeof ScrollTrigger !== 'undefined') {
      // 1. Generic Section Header Reveals (Harmonious Staggered Rhythm)
      const sectionHeaderConfigs = [
        '.pth-vision-mission-section',
        '.what-we-do-section',
        '.pth-where-we-are-section',
        '.pth-journey-section',
        '.pth-volunteers-section',
        '.pth-gallery-section'
      ];

      sectionHeaderConfigs.forEach((selector) => {
        const sec = document.querySelector(selector);
        if (!sec) return;
        const badge = sec.querySelector('.section-badge-pill, .where-badge-pill, .volunteers-badge-pill, .activities-badge-pill, .gallery-badge-pill');
        const heading = sec.querySelector('.section-main-heading, .where-heading, .volunteers-heading, .activities-heading, .gallery-heading');
        const sub = sec.querySelector('.section-sub-text, .where-desc, .volunteers-desc, .activities-sub-text, .gallery-sub-text');

        const targets = [badge, heading, sub].filter(Boolean);
        if (targets.length > 0) {
          gsap.from(targets, {
            scrollTrigger: {
              trigger: sec,
              start: 'top 82%',
              once: true,
            },
            y: 26,
            opacity: 0,
            duration: 0.75,
            stagger: 0.1,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
          });
        }
      });

      // 2. About Us Section Content & Photo
      gsap.from('.about-col-content > *', {
        scrollTrigger: {
          trigger: '.about-us-section',
          start: 'top 80%',
          once: true,
        },
        y: 24,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      gsap.from('.about-image-frame', {
        scrollTrigger: {
          trigger: '.about-us-section',
          start: 'top 80%',
          once: true,
        },
        x: 35,
        opacity: 0,
        scale: 0.96,
        duration: 0.95,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      // 3. Vision & Mission Cards Grid
      gsap.from('.pth-vision-mission-section .vm-col-card', {
        scrollTrigger: {
          trigger: '.pth-vision-mission-section .vm-col-card',
          start: 'top 82%',
          once: true,
        },
        y: 35,
        opacity: 0,
        scale: 0.98,
        duration: 0.85,
        stagger: 0.18,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      gsap.from('.vm-values-strip', {
        scrollTrigger: {
          trigger: '.vm-values-strip',
          start: 'top 88%',
          once: true,
        },
        y: 25,
        opacity: 0,
        duration: 0.75,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });

      // 4. What We Do Cards & Visual Anchor
      gsap.from('.what-we-do-visual-card', {
        scrollTrigger: {
          trigger: '.what-we-do-section',
          start: 'top 80%',
          once: true,
        },
        x: -35,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      gsap.from('.what-we-do-section .service-stream-item', {
        scrollTrigger: {
          trigger: '.scrolling-services-wrap',
          start: 'top 85%',
          once: true,
        },
        y: 35,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });

      gsap.from('.what-we-do-strip', {
        scrollTrigger: {
          trigger: '.what-we-do-strip',
          start: 'top 88%',
          once: true,
        },
        y: 20,
        opacity: 0,
        duration: 0.75,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });

      // 5. Where We Are Section
      gsap.from('.where-content-col', {
        scrollTrigger: {
          trigger: '.pth-where-we-are-section',
          start: 'top 80%',
          once: true,
        },
        x: -30,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      gsap.from('.district-tab-btn', {
        scrollTrigger: {
          trigger: '.district-nav-tabs',
          start: 'top 85%',
          once: true,
        },
        scale: 0.92,
        opacity: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: 'back.out(1.4)',
        clearProps: 'transform,opacity',
      });

      gsap.from('.where-visual-col', {
        scrollTrigger: {
          trigger: '.pth-where-we-are-section',
          start: 'top 80%',
          once: true,
        },
        x: 30,
        opacity: 0,
        scale: 0.97,
        duration: 0.95,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      // 6. Care Throughout The Journey
      gsap.from('.journey-col-item', {
        scrollTrigger: {
          trigger: '.pth-journey-section .journey-col-item',
          start: 'top 82%',
          once: true,
        },
        y: 35,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });

      gsap.from('.journey-assurance-strip', {
        scrollTrigger: {
          trigger: '.journey-assurance-strip',
          start: 'top 90%',
          once: true,
        },
        y: 25,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });

      // 7. Impact & People Section + Counter Triggers
      gsap.from('.impact-motto-wrapper', {
        scrollTrigger: {
          trigger: '.pth-impact-section',
          start: 'top 80%',
          once: true,
        },
        y: 22,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });

      gsap.from('.impact-block:first-of-type .row.align-items-end > *', {
        scrollTrigger: {
          trigger: '.impact-block:first-of-type',
          start: 'top 82%',
          once: true,
        },
        y: 20,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });

      gsap.from('.kpi-hero-card', {
        scrollTrigger: {
          trigger: '.pth-impact-section .kpi-hero-card',
          start: 'top 82%',
          once: true,
        },
        y: 35,
        opacity: 0,
        scale: 0.97,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });

      gsap.from('.people-hero-card', {
        scrollTrigger: {
          trigger: '.people-hero-card',
          start: 'top 85%',
          once: true,
        },
        y: 30,
        opacity: 0,
        scale: 0.97,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });

      gsap.from('.metric-strip-item', {
        scrollTrigger: {
          trigger: '.strip-card-people',
          start: 'top 88%',
          once: true,
        },
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.05,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });

      // Trigger Impact Numbers Animation
      ScrollTrigger.create({
        trigger: '.pth-impact-section',
        start: 'top 75%',
        once: true,
        onEnter: () => {
          document.querySelectorAll('.pth-impact-section .kpi-number, .pth-impact-section .people-kpi-number, .pth-impact-section .strip-stat-val').forEach((el) => {
            animateCounter(el, 1.8);
          });
        }
      });

      // 8. Wayanad Mega Homecare Drive
      gsap.from('.wayanad-col-content', {
        scrollTrigger: {
          trigger: '.pth-wayanad-section',
          start: 'top 80%',
          once: true,
        },
        x: -30,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      gsap.from('.wayanad-photo-wrapper', {
        scrollTrigger: {
          trigger: '.pth-wayanad-section',
          start: 'top 80%',
          once: true,
        },
        x: 30,
        opacity: 0,
        scale: 0.96,
        duration: 0.95,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      gsap.from('.wayanad-stat-item', {
        scrollTrigger: {
          trigger: '.wayanad-stats-strip',
          start: 'top 85%',
          once: true,
        },
        y: 25,
        opacity: 0,
        stagger: 0.1,
        duration: 0.75,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });

      // Trigger Wayanad Numbers Animation
      ScrollTrigger.create({
        trigger: '.pth-wayanad-section',
        start: 'top 75%',
        once: true,
        onEnter: () => {
          document.querySelectorAll('.pth-wayanad-section .stat-number').forEach((el) => {
            animateCounter(el, 1.6);
          });
        }
      });

      // 9. Volunteers Section
      gsap.from('.volunteer-col-content', {
        scrollTrigger: {
          trigger: '.pth-volunteers-section',
          start: 'top 80%',
          once: true,
        },
        x: -35,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      gsap.from('.volunteer-col-visual', {
        scrollTrigger: {
          trigger: '.pth-volunteers-section',
          start: 'top 80%',
          once: true,
        },
        x: 35,
        opacity: 0,
        scale: 0.96,
        duration: 0.95,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      // 10. Flag-off Milestone Section
      gsap.from('.flagoff-photo-container', {
        scrollTrigger: {
          trigger: '.pth-flagoff-section',
          start: 'top 82%',
          once: true,
        },
        x: -30,
        opacity: 0,
        scale: 0.96,
        duration: 0.9,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      gsap.from('.flagoff-content-col', {
        scrollTrigger: {
          trigger: '.pth-flagoff-section',
          start: 'top 82%',
          once: true,
        },
        x: 30,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });


      // 12. Gallery Section
      gsap.from('.gallery-card', {
        scrollTrigger: {
          trigger: '.pth-gallery-section',
          start: 'top 80%',
          once: true,
        },
        y: 30,
        opacity: 0,
        scale: 0.96,
        stagger: 0.06,
        duration: 0.8,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });

      // 13. Footer Section
      gsap.from('.footer-col-brand, .footer-col-links, .footer-col-contact', {
        scrollTrigger: {
          trigger: '.pth-footer',
          start: 'top 88%',
          once: true,
        },
        y: 25,
        opacity: 0,
        stagger: 0.12,
        duration: 0.8,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });

      // 14. Subtle Parallax Scrub on Ambient Glow Elements
      gsap.utils.toArray('.vm-ambient-glow, .impact-ambient-blob, .wayanad-ambient-glow, .flagoff-orb, .footer-ambient-glow').forEach((glow) => {
        if (glow.parentElement) {
          gsap.to(glow, {
            y: -35,
            ease: 'none',
            scrollTrigger: {
              trigger: glow.parentElement,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.5,
            }
          });
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // 4. District Filter Tabs Interaction (Where We Are Section)
  // --------------------------------------------------------------------------
  const districtTabs = document.querySelectorAll('.district-tab-btn');
  const districtItems = document.querySelectorAll('.district-accord-item');

  districtTabs.forEach((tab) => {
    tab.addEventListener('click', function () {
      districtTabs.forEach((t) => t.classList.remove('active'));
      this.classList.add('active');

      const targetDistrict = this.getAttribute('data-district');

      districtItems.forEach((item) => {
        const itemDistrict = item.getAttribute('data-district-card');
        const collapseEl = item.querySelector('.collapse');

        if (targetDistrict === 'all' || targetDistrict === itemDistrict) {
          item.style.display = 'block';
          if (targetDistrict !== 'all' && collapseEl && typeof bootstrap !== 'undefined') {
            const bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false });
            bsCollapse.show();
          }
        } else {
          item.style.display = 'none';
        }
      });
    });
  });


  // Gallery Lightbox Modal (Pure Photo - No Titles)
  const galleryModalEl = document.getElementById('galleryLightboxModal');
  const modalGalleryImg = document.getElementById('modalGalleryImg');

  if (galleryModalEl) {
    galleryModalEl.addEventListener('show.bs.modal', function (event) {
      if (lenis) lenis.stop();
      const trigger = event.relatedTarget;
      if (!trigger) return;

      const imgEl = trigger.querySelector('img');
      const imgSrc = trigger.getAttribute('data-img-src') || (imgEl ? imgEl.getAttribute('src') : null);
      const imgAlt = imgEl ? (imgEl.getAttribute('alt') || 'Enlarged gallery photograph') : 'Enlarged gallery photograph';
      if (modalGalleryImg && imgSrc) {
        modalGalleryImg.src = imgSrc;
        modalGalleryImg.alt = imgAlt;
      }
    });

    galleryModalEl.addEventListener('hidden.bs.modal', function () {
      if (modalGalleryImg) {
        modalGalleryImg.src = '';
        modalGalleryImg.alt = 'Enlarged gallery photograph';
      }
      if (lenis) lenis.start();
    });
  }

  // Universal Modal Scroll & Lenis Integration for ALL Modals
  document.querySelectorAll('.modal').forEach(function (modalEl) {
    modalEl.addEventListener('show.bs.modal', function () {
      if (lenis) lenis.stop();
      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');
    });
    modalEl.addEventListener('hidden.bs.modal', function () {
      setTimeout(function () {
        if (!document.querySelector('.modal.show')) {
          if (lenis) lenis.start();
          document.body.classList.remove('modal-open');
          document.documentElement.classList.remove('modal-open');
        }
      }, 50);
    });
  });

  // --------------------------------------------------------------------------
  // FAQ Sticky Note Memo Accordion (Screenshot-Style Interactive Toggling)
  // --------------------------------------------------------------------------
  const initFaqNotes = () => {
    const faqCards = document.querySelectorAll('.faq-note-card');
    if (!faqCards.length) return;

    faqCards.forEach((card) => {
      const toggleText = card.querySelector('.faq-toggle-text');

      const toggleCard = (e) => {
        // Prevent accidental toggle if clicking on any embedded links
        if (e.target.closest('a')) return;

        const isOpen = card.classList.contains('is-open');

        if (isOpen) {
          card.classList.remove('is-open');
          card.setAttribute('aria-expanded', 'false');
          if (toggleText) toggleText.textContent = 'click to see answer';
        } else {
          card.classList.add('is-open');
          card.setAttribute('aria-expanded', 'true');
          if (toggleText) toggleText.textContent = 'click to close';
        }

        // Notify smooth scrolling engines of height change
        if (window.lenis) {
          window.lenis.resize();
        }
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }
      };

      // Toggle on card click
      card.addEventListener('click', toggleCard);

      // Keyboard accessibility (Enter / Spacebar)
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleCard(e);
        }
      });
    });
  };

  initFaqNotes();
});

// Copy to Clipboard Utility for Donation Modal
window.copyToClipboard = function (text, btnElement) {
  function showCopied() {
    if (!btnElement) return;
    const origHtml = btnElement.innerHTML;
    btnElement.innerHTML = '<i class="bi bi-check2"></i> <span>Copied!</span>';
    btnElement.classList.add('text-success');
    setTimeout(function () {
      btnElement.innerHTML = origHtml;
      btnElement.classList.remove('text-success');
    }, 2000);
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(showCopied).catch(function () {
      fallbackCopy(text, showCopied);
    });
  } else {
    fallbackCopy(text, showCopied);
  }
};

function fallbackCopy(text, callback) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    if (callback) callback();
  } catch (err) {
    console.error('Copy failed:', err);
  }
}
