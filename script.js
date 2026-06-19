/* =============================================
   BLOOMLAAND — LANDING PAGE JAVASCRIPT
   Features:
   - Sticky navbar with scroll behavior
   - Mobile menu toggle
   - Scroll reveal animations
   - Flow step staggered animations
   - Animated waitlist counter
   - Form submission handler (Formspree)
   - Smooth scroll for anchor links
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ─── NAVBAR: Scroll Detection ─── */
  const navbar = document.getElementById('navbar');

  function handleNavbarScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll(); // Run on load


  /* ─── MOBILE MENU TOGGLE ─── */
  const navToggle = document.getElementById('navToggle');
  const navMobile = document.getElementById('navMobile');
  const navOverlay = document.getElementById('navOverlay');

  function openMenu() {
    navMobile.classList.add('open');
    navOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    navToggle.setAttribute('aria-expanded', 'true');
    const spans = navToggle.querySelectorAll('span');
    spans[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
  }

  function closeMenu() {
    navMobile.classList.remove('open');
    navOverlay.classList.remove('open');
    document.body.style.overflow = '';
    navToggle.setAttribute('aria-expanded', 'false');
    const spans = navToggle.querySelectorAll('span');
    spans[0].style.transform = '';
    spans[1].style.opacity = '';
    spans[2].style.transform = '';
  }

  if (navToggle && navMobile) {
    navToggle.addEventListener('click', () => {
      navMobile.classList.contains('open') ? closeMenu() : openMenu();
    });

    // Close on overlay click
    if (navOverlay) navOverlay.addEventListener('click', closeMenu);

    // Close button inside drawer
    const navClose = document.getElementById('navClose');
    if (navClose) navClose.addEventListener('click', closeMenu);

    // Close when a link is clicked
    navMobile.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }


  /* ─── SCROLL REVEAL: General Elements ─── */
  const revealElements = document.querySelectorAll(
    '.problem-card, .sol-card, .coming-soon, .founder__wrapper, .flow-mobile__item'
  );

  // Add reveal class to elements we want to animate
  revealElements.forEach((el) => {
    el.classList.add('reveal');
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger cards in grids
        const delay = entry.target.closest('.problem__grid, .solution__cards') 
          ? Array.from(entry.target.parentElement.children).indexOf(entry.target) * 100 
          : 0;

        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);

        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));


  /* ─── FLOW STEPS: Staggered Animation ─── */
  const flowSteps = [
    document.getElementById('flowStep1'),
    document.getElementById('flowArrow1'),
    document.getElementById('flowStep2'),
    document.getElementById('flowArrow2'),
    document.getElementById('flowStep3'),
  ];

  const validFlowSteps = flowSteps.filter(Boolean);

  if (validFlowSteps.length > 0) {
    const flowObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          validFlowSteps.forEach((step, i) => {
            setTimeout(() => {
              step.classList.add('visible');
            }, i * 160);
          });
          flowObserver.disconnect();
        }
      });
    }, { threshold: 0.2 });

    flowObserver.observe(validFlowSteps[0]);
  }


  /* ─── WAITLIST COUNT ANIMATION ─── */
  const countEl = document.getElementById('waitlistCount');
  let countAnimated = false;

  function animateCount(target, duration = 2000) {
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      countEl.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        countEl.textContent = target.toLocaleString();
      }
    }

    requestAnimationFrame(update);
  }

  if (countEl) {
    const countObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !countAnimated) {
        countAnimated = true;
        // Simulate a growing waitlist number (replace with real API call if you have one)
        animateCount(247);
        countObserver.disconnect();
      }
    }, { threshold: 0.3 });

    countObserver.observe(countEl);
  }


  /* ─── WAITLIST FORM SUBMISSION ─── */
  const waitlistForm = document.getElementById('waitlistForm');
  const formSuccess = document.getElementById('formSuccess');

  if (waitlistForm) {
    waitlistForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = waitlistForm.querySelector('.btn--submit');
      const btnText = submitBtn.querySelector('.btn-text');
      const originalText = btnText.textContent;

      // Loading state
      btnText.textContent = 'Submitting...';
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';

      const formData = new FormData(waitlistForm);
      const action = waitlistForm.getAttribute('action');

      try {
        // Check if it's a real Formspree endpoint (not the placeholder)
        if (action.includes('your-form-id')) {
          // Demo mode: simulate success after a brief delay
          await new Promise(resolve => setTimeout(resolve, 1200));
          showSuccess();
        } else {
          // Real Formspree submission
          const response = await fetch(action, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
          });

          if (response.ok) {
            showSuccess();
          } else {
            throw new Error('Form submission failed');
          }
        }
      } catch (error) {
        console.error('Form error:', error);
        btnText.textContent = 'Something went wrong. Try again.';
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.background = '#c0392b';

        setTimeout(() => {
          btnText.textContent = originalText;
          submitBtn.style.background = '';
        }, 3000);
      }
    });

    function showSuccess() {
      if (formSuccess) {
        formSuccess.classList.add('show');
        // Increment display count
        if (countEl) {
          const current = parseInt(countEl.textContent.replace(/,/g, ''), 10) || 247;
          animateCount(current + 1, 500);
        }
      }
    }
  }


  /* ─── SMOOTH SCROLL FOR ANCHOR LINKS ─── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const navHeight = navbar ? navbar.offsetHeight : 80;
        const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;

        window.scrollTo({ top: targetTop, behavior: 'smooth' });
      }
    });
  });


  /* ─── ORBIT: Pause on Hover ─── */
  const orbitSystem = document.getElementById('orbitSystem');
  if (orbitSystem) {
    orbitSystem.addEventListener('mouseenter', () => {
      const rings = orbitSystem.querySelectorAll('.orbit-ring');
      rings.forEach(r => r.style.animationPlayState = 'paused');
    });

    orbitSystem.addEventListener('mouseleave', () => {
      const rings = orbitSystem.querySelectorAll('.orbit-ring');
      rings.forEach(r => r.style.animationPlayState = 'running');
    });
  }


  /* ─── SECTION EYEBROW LABEL REVEAL ─── */
  const sectionLabels = document.querySelectorAll('.section-label, .section-title, .section-intro');

  const labelObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        labelObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  sectionLabels.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    labelObserver.observe(el);
  });


  /* ─── ACTIVE NAV LINK HIGHLIGHTING ─── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__links a');

  function updateActiveNav() {
    const scrollY = window.scrollY + 120;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.style.color = '';
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.style.color = 'var(--gold)';
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });

});