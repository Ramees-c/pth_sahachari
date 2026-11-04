/**
 * POOKOYA THANGAL HOSPICE (PTH) - SAHACHARI
 * Modern JavaScript: Lenis Smooth Scroll + GSAP Animations
 */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 0. Fullscreen Page Loading Screen (Spinner Only - Scroll Locked)
  // --------------------------------------------------------------------------
  const loadingScreen = document.getElementById('pthLoadingScreen');
  const loaderStartTime = Date.now();
  const MIN_SPINNER_DISPLAY_MS = 450;
  let isLoaderDismissed = false;

  const dismissLoadingScreen = () => {
    if (isLoaderDismissed) return;
    isLoaderDismissed = true;

    if (!loadingScreen) {
      document.body.classList.remove('loading-locked');
      document.documentElement.classList.remove('loading-locked');
      if (lenis) {
        lenis.start();
        lenis.resize();
      }
      return;
    }

    // Trigger smooth fade out transition
    loadingScreen.classList.add('fade-out');

    setTimeout(() => {
      // Re-enable background scrolling
      document.body.classList.remove('loading-locked');
      document.documentElement.classList.remove('loading-locked');
      loadingScreen.style.display = 'none';

      // Resume Lenis smooth scroll and refresh ScrollTrigger
      if (lenis) {
        lenis.start();
        lenis.resize();
      }
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    }, 450);
  };

  // Prevent background scroll interactions while loading screen is visible
  if (loadingScreen) {
    loadingScreen.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
    loadingScreen.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    loadingScreen.addEventListener('keydown', (e) => {
      // Block Arrow, PageUp, PageDown, Space, Home, End keys while loading
      if ([32, 33, 34, 35, 36, 37, 38, 39, 40].includes(e.keyCode)) {
        e.preventDefault();
      }
    });
  }

  const scheduleDismiss = () => {
    const elapsed = Date.now() - loaderStartTime;
    const remainingTime = Math.max(0, MIN_SPINNER_DISPLAY_MS - elapsed);
    setTimeout(dismissLoadingScreen, remainingTime);
  };

  if (document.readyState === 'complete') {
    scheduleDismiss();
  } else {
    window.addEventListener('load', scheduleDismiss);
  }

  // Safety fallback: maximum 2.5s in case any external widget or iframe hangs
  setTimeout(scheduleDismiss, 2500);

  // --------------------------------------------------------------------------
  // 1. Lenis Smooth Scroll Initialisation
  // --------------------------------------------------------------------------
  let lenis = null;

  try {
    if (typeof Lenis !== 'undefined') {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false,
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);

      // Stop Lenis while initial loading screen is active
      if (document.body.classList.contains('loading-locked')) {
        lenis.stop();
      }

      // GSAP ScrollTrigger Integration
      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
          lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
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
          if (lenis) {
            lenis.scrollTo(targetElement, { offset: -80, duration: 1.2 });
          } else {
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }

          // Close mobile menu collapse if open
          const navCollapse = document.getElementById('mainNav');
          if (navCollapse && navCollapse.classList.contains('show') && typeof bootstrap !== 'undefined') {
            const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
            if (bsCollapse) bsCollapse.hide();
          }
        }
      }
    });
  });

  // --------------------------------------------------------------------------
  // 2. Sticky Navbar Glass Effect & Top Progress Bar on Scroll
  // --------------------------------------------------------------------------
  const navbar = document.querySelector('.pth-navbar-wrapper');
  const scrollProgressBar = document.getElementById('scrollProgressLine');

  const onScroll = () => {
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    
    // Sticky Navbar
    if (scrollY > 20) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }

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
          const top = targetSection.offsetTop;
          const height = targetSection.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            link.classList.add('active-home');
          } else {
            link.classList.remove('active-home');
          }
        }
      }
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  if (lenis) {
    lenis.on('scroll', onScroll);
  }
  onScroll();

  // --------------------------------------------------------------------------
  // 3. GSAP Animations & Interactions
  // --------------------------------------------------------------------------
  if (typeof gsap !== 'undefined') {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Navbar Entrance
    tl.from('.brand-link', {
      y: -20,
      opacity: 0,
      duration: 0.7,
    })
    .from('.navbar-nav .nav-item', {
      y: -15,
      opacity: 0,
      duration: 0.5,
      stagger: 0.08,
    }, '-=0.4')
    .from('.btn-get-care', {
      scale: 0.85,
      opacity: 0,
      duration: 0.5,
      ease: 'back.out(1.7)',
    }, '-=0.3');

    // Hero Elements Entrance
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl.from('.hero-badge-pill, .hero-overline', {
      y: 15,
      opacity: 0,
      duration: 0.6,
    })
    .from('.script-line-blue', {
      y: 35,
      opacity: 0,
      duration: 0.8,
      ease: 'back.out(1.4)',
    }, '-=0.4')
    .from('.script-line-green', {
      y: 35,
      opacity: 0,
      duration: 0.8,
      ease: 'back.out(1.4)',
    }, '-=0.6')
    .from('.hero-bio-text', {
      y: 20,
      opacity: 0,
      duration: 0.7,
    }, '-=0.4')
    .from('.hero-stats-highlights .hero-stat-chip', {
      y: 15,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      clearProps: 'opacity,transform',
    }, '-=0.4')
    .from('.hero-action-buttons .btn', {
      y: 15,
      opacity: 0,
      duration: 0.5,
      stagger: 0.12,
      ease: 'back.out(1.6)',
      clearProps: 'all',
    }, '-=0.3')
    .from('.hero-pure-img', {
      y: 25,
      opacity: 0,
      duration: 1,
      ease: 'power2.out',
      clearProps: 'opacity,transform',
    }, '-=0.5');

    // ScrollTrigger Animation for About Us Section
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.from('.about-col-content', {
        scrollTrigger: {
          trigger: '.about-us-section',
          start: 'top 80%',
        },
        x: -30,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        clearProps: 'all',
      });

      gsap.from('.about-image-frame', {
        scrollTrigger: {
          trigger: '.about-us-section',
          start: 'top 80%',
        },
        x: 30,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        clearProps: 'all',
      });

      // ScrollTrigger Animation for What We Do Cards & Visual Anchor
      gsap.from('.what-we-do-visual-card', {
        scrollTrigger: {
          trigger: '.what-we-do-section',
          start: 'top 80%',
        },
        x: -40,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        clearProps: 'all',
      });

      gsap.from('.what-we-do-section .service-stream-item', {
        scrollTrigger: {
          trigger: '.scrolling-services-wrap',
          start: 'top 85%',
        },
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power2.out',
        clearProps: 'all',
      });

      gsap.from('.what-we-do-strip', {
        scrollTrigger: {
          trigger: '.what-we-do-strip',
          start: 'top 85%',
        },
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        clearProps: 'all',
      });

      // ScrollTrigger Animation for Where We Are Section
      gsap.from('.where-content-col', {
        scrollTrigger: {
          trigger: '.pth-where-we-are-section',
          start: 'top 80%',
        },
        x: -35,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        clearProps: 'all',
      });

      gsap.from('.where-visual-col', {
        scrollTrigger: {
          trigger: '.pth-where-we-are-section',
          start: 'top 80%',
        },
        x: 35,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        clearProps: 'all',
      });

      // ScrollTrigger Animation for Care Throughout The Journey Section
      gsap.from('.journey-col-item', {
        scrollTrigger: {
          trigger: '.pth-journey-section',
          start: 'top 80%',
        },
        y: 35,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out',
        clearProps: 'all',
      });

      gsap.from('.journey-assurance-strip', {
        scrollTrigger: {
          trigger: '.journey-assurance-strip',
          start: 'top 90%',
        },
        y: 25,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        clearProps: 'all',
      });

      // ScrollTrigger Animation for Impact & People Section
      gsap.from('.kpi-hero-card', {
        scrollTrigger: {
          trigger: '.pth-impact-section',
          start: 'top 80%',
        },
        y: 35,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power2.out',
        clearProps: 'all',
      });

      gsap.from('.people-hero-card', {
        scrollTrigger: {
          trigger: '.people-hero-card',
          start: 'top 85%',
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out',
        clearProps: 'all',
      });

      // ScrollTrigger Animation for Gallery Section
      gsap.from('.gallery-card', {
        scrollTrigger: {
          trigger: '.pth-gallery-section',
          start: 'top 80%',
        },
        y: 35,
        opacity: 0,
        stagger: 0.1,
        duration: 0.85,
        ease: 'power2.out',
        clearProps: 'all',
      });

      // ScrollTrigger Animation for Wayanad Mega Homecare Drive
      gsap.from('.wayanad-col-content', {
        scrollTrigger: {
          trigger: '.pth-wayanad-section',
          start: 'top 80%',
        },
        y: 30,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        clearProps: 'all',
      });

      gsap.from('.wayanad-photo-wrapper', {
        scrollTrigger: {
          trigger: '.pth-wayanad-section',
          start: 'top 80%',
        },
        y: 35,
        opacity: 0,
        scale: 0.96,
        duration: 1,
        ease: 'power3.out',
        clearProps: 'all',
      });

      gsap.from('.wayanad-stat-item', {
        scrollTrigger: {
          trigger: '.wayanad-stats-strip',
          start: 'top 85%',
        },
        y: 25,
        opacity: 0,
        stagger: 0.12,
        duration: 0.8,
        ease: 'power2.out',
        clearProps: 'all',
      });

      // ScrollTrigger Animation for Trained Volunteers Section
      gsap.from('.volunteer-col-content', {
        scrollTrigger: {
          trigger: '.pth-volunteers-section',
          start: 'top 80%',
        },
        x: -35,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        clearProps: 'all',
      });

      gsap.from('.volunteer-col-visual', {
        scrollTrigger: {
          trigger: '.pth-volunteers-section',
          start: 'top 80%',
        },
        x: 35,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        clearProps: 'all',
      });

      // ScrollTrigger Animation for Flag-off Milestone Section
      gsap.from('.flagoff-card-wrapper', {
        scrollTrigger: {
          trigger: '.pth-flagoff-section',
          start: 'top 85%',
        },
        y: 35,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        clearProps: 'all',
      });

      // ScrollTrigger Animation for Activities Section
      gsap.from('.activities-slider', {
        scrollTrigger: {
          trigger: '.pth-activities-section',
          start: 'top 80%',
        },
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        clearProps: 'all',
      });
    }

    // Continuous Gentle Floating Movement for Leaf Shapes
    gsap.to('.leaf-1', {
      y: -15,
      rotation: -10,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    gsap.to('.leaf-2', {
      y: 12,
      rotation: 12,
      duration: 3.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 0.4,
    });

    // Desktop Interactive Mouse Parallax on Panoramic Layer
    if (window.innerWidth > 992) {
      const heroSection = document.querySelector('.pth-hero-container');
      heroSection?.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const xOffset = (clientX / window.innerWidth - 0.5) * 16;
        const yOffset = (clientY / window.innerHeight - 0.5) * 12;

        gsap.to('.hero-panoramic-bg', {
          x: xOffset * 0.4,
          y: yOffset * 0.3,
          duration: 1.2,
          ease: 'power1.out',
        });

        gsap.to('.hero-floating-leaves', {
          x: -xOffset * 1.5,
          y: -yOffset * 1.5,
          duration: 1.2,
          ease: 'power1.out',
        });
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

  // --------------------------------------------------------------------------
  // 5. Activities Portrait Video Slider (Swiper) & Video Modal Handlers
  // --------------------------------------------------------------------------
  if (typeof Swiper !== 'undefined') {
    new Swiper('.activities-slider', {
      slidesPerView: 1.4,
      spaceBetween: 16,
      loop: true,
      speed: 800,
      autoplay: {
        delay: 3200,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      grabCursor: true,
      pagination: {
        el: '.activities-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.activities-next',
        prevEl: '.activities-prev',
      },
      breakpoints: {
        576: {
          slidesPerView: 2.2,
          spaceBetween: 18,
        },
        768: {
          slidesPerView: 3,
          spaceBetween: 20,
        },
        1024: {
          slidesPerView: 3.8,
          spaceBetween: 22,
        },
        1280: {
          slidesPerView: 4.3,
          spaceBetween: 24,
        },
      },
    });
  }

  // Facebook Video Modal Event Listeners
  const videoModalEl = document.getElementById('videoPlayerModal');
  const videoIframe = document.getElementById('modalVideoIframe');
  const videoTitleEl = document.getElementById('videoPlayerModalLabel');
  const videoFbLink = document.getElementById('modalFbDirectLink');

  if (videoModalEl) {
    videoModalEl.addEventListener('show.bs.modal', function (event) {
      const trigger = event.relatedTarget;
      if (!trigger) return;

      const videoUrl = trigger.getAttribute('data-video-url');
      const videoTitle = trigger.getAttribute('data-video-title');
      const fbUrl = trigger.getAttribute('data-fb-url');

      if (videoTitleEl && videoTitle) {
        videoTitleEl.textContent = videoTitle;
      }
      if (videoFbLink && fbUrl) {
        videoFbLink.setAttribute('href', fbUrl);
      }
      if (videoIframe && videoUrl) {
        videoIframe.setAttribute('src', videoUrl);
      }
    });

    videoModalEl.addEventListener('hidden.bs.modal', function () {
      if (videoIframe) {
        videoIframe.setAttribute('src', '');
      }
    });
  }
  // Gallery Lightbox Modal (Clean Fullscreen View)
  const galleryModalEl = document.getElementById('galleryLightboxModal');
  const modalGalleryImg = document.getElementById('modalGalleryImg');

  if (galleryModalEl) {
    galleryModalEl.addEventListener('show.bs.modal', function (event) {
      const trigger = event.relatedTarget;
      if (!trigger) return;

      const imgSrc = trigger.getAttribute('data-img-src');
      if (modalGalleryImg && imgSrc) {
        modalGalleryImg.src = imgSrc;
      }
    });

    galleryModalEl.addEventListener('hidden.bs.modal', function () {
      if (modalGalleryImg) {
        modalGalleryImg.src = '';
      }
    });
  }
});