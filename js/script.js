// ===== Site Utilities & Interactions =====
(function () {
  // --- Set current year ---
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // --- Reveal elements on scroll ---
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const io = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    reveals.forEach(r => io.observe(r));
  }

  // --- Hero title parallax on scroll ---
  const title = document.querySelector('.title-stack');
  if (title) {
    window.addEventListener('scroll', () => {
      const sc = window.scrollY;
      const scale = Math.max(0.6, 1 - sc / 1200);
      title.style.transform = `scale(${scale})`;
      // (portrait removed) title keeps the parallax/scale behavior
    });

    // (Removed playWipe helper) use click nav behavior for transitions
  }

  // --- Mouse-parallax tilt for cards (hover-capable devices only) ---
  (function () {
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!canHover || reduce) return;

    const cards = document.querySelectorAll('.card');
    const MAX_TILT = 8; // degrees

    function handleMove(e) {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (cy - e.clientY) / (rect.height / 2);
      const rx = Math.max(-1, Math.min(1, dy)) * MAX_TILT;
      const ry = Math.max(-1, Math.min(1, dx)) * MAX_TILT;

      // include the hover-y lift to match CSS hover translate
      const lift = -8; // px
      el.style.transform = `perspective(900px) translateY(${lift}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.01)`;
    }

    function handleEnter(e) {
      const el = e.currentTarget;
      el.style.transition = 'transform 160ms ease-out';
      // prime a tiny scale to pop while tilting
      el.style.willChange = 'transform';
    }

    function handleLeave(e) {
      const el = e.currentTarget;
      // smooth return to resting state
      el.style.transition = 'transform 300ms cubic-bezier(.2,.9,.2,1)';
      el.style.transform = '';
      // clear will-change after transition
      setTimeout(() => { el.style.willChange = ''; el.style.transition = ''; }, 350);
    }

    cards.forEach(c => {
      c.addEventListener('pointermove', handleMove);
      c.addEventListener('pointerenter', handleEnter);
      c.addEventListener('pointerleave', handleLeave);
    });
  })();

  // --- Image-track pointer drag + wheel support ---
  (function () {
    const tracks = document.querySelectorAll('.image-track');
    if (!tracks.length) return;

    tracks.forEach(track => {
      let isDown = false, startX = 0, startY = 0, scrollLeft = 0, moved = false;

      track.addEventListener('pointerdown', (e) => {
        isDown = true;
        moved = false;
        track.setPointerCapture(e.pointerId);
        startX = e.clientX;
        startY = e.clientY;
        scrollLeft = track.scrollLeft;
        track.classList.add('is-dragging');
      });

      track.addEventListener('pointermove', (e) => {
        if (!isDown) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (!moved && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) moved = true;
        track.scrollLeft = scrollLeft - dx;
      });

      track.addEventListener('pointerup', (e) => {
        // if it was a tap (no movement) try to open underlying image
        if (!moved) {
          const el = document.elementFromPoint(e.clientX, e.clientY);
          const img = el && el.closest ? el.closest('img') : null;
          if (img && img.closest('.image-track')) {
            const trackCard = img.closest('.card');
            const titleEl = trackCard ? trackCard.querySelector('.track-title') : null;
            const label = titleEl ? `${titleEl.textContent} — ${img.alt || ''}` : img.alt || '';
            if (window.openLightboxPreview) window.openLightboxPreview(img.getAttribute('src'), img.getAttribute('alt') || '', label);
          }
        }

        isDown = false; moved = false;
        try { track.releasePointerCapture(e.pointerId); } catch {}
        track.classList.remove('is-dragging');
      });

      track.addEventListener('pointercancel', () => { isDown = false; moved = false; track.classList.remove('is-dragging'); });

      //Make wheel scroll horizontally when over track
      track.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) > 0) {
          e.preventDefault();
          track.scrollLeft += e.deltaY + e.deltaX;
        }
      }, { passive: false });
    });
  })();

  // --- Journal carousel (center card focus) ---
  (function () {
    const carousel = document.querySelector('.journal-carousel');
    if (!carousel) return;
    const track = carousel.querySelector('.carousel-track');
    const items = Array.from(track.querySelectorAll('.carousel-item'));
    let center = Math.floor(items.length / 2);

    function update() {
      items.forEach((it, i) => {
        it.classList.remove('center', 'mid');
        const d = i - center;
        if (d === 0) it.classList.add('center');
        else if (Math.abs(d) === 1) it.classList.add('mid');

        // compute translate to keep center visually centered
        const offset = d * 140;
        const rot = d * -8;
        const scale = 1 - Math.min(0.18, Math.abs(d) * 0.08);
        it.style.transform = `translateX(${offset}px) translateZ(0px) scale(${scale}) rotateY(${rot}deg)`;
        it.style.opacity = `${1 - Math.min(0.6, Math.abs(d) * 0.18)}`;
      });
    }

    function clamp(i) { return (i + items.length) % items.length; }

    carousel.querySelector('.carousel-prev').addEventListener('click', () => { center = clamp(center - 1); update(); });
    carousel.querySelector('.carousel-next').addEventListener('click', () => { center = clamp(center + 1); update(); });

    items.forEach((it, i) => {
      it.addEventListener('click', () => { center = clamp(i); update(); });
      it.setAttribute('tabindex', '0');
      it.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); center = clamp(i); update(); } });
    });

    // keyboard navigation
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { center = clamp(center - 1); update(); }
      if (e.key === 'ArrowRight') { center = clamp(center + 1); update(); }
    });

    // initial layout
    update();
  })();

  // --- Journal stack (thumbnail grid with caption) ---
  (function () {
    const stack = document.querySelector('.journal-stack');
    if (!stack) return;

    const inner = stack.querySelector('.stack-inner');
    const items = Array.from(inner.querySelectorAll('.stack-item'));
    const prev = stack.querySelector('.stack-prev');
    const next = stack.querySelector('.stack-next');
    const titleEl = stack.querySelector('.stack-title');
    const descEl = stack.querySelector('.stack-desc');

    if (!items.length) return;

    let index = 0;

    function update() {
      items.forEach((it, i) => {
        it.classList.toggle('active', i === index);
        it.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
      const cur = items[index];
      titleEl.textContent = cur.dataset.title || '';
      descEl.textContent = cur.dataset.desc || '';
    }

    // make items interactive
    items.forEach((it, i) => {
      it.setAttribute('tabindex', '0');
      it.addEventListener('click', (e) => {
        // if clicked image, open lightbox
        const img = it.querySelector('img');
        if (img && e.target === img && window.openLightboxPreview) {
          const label = `${it.dataset.title || ''} — ${img.alt || ''}`.trim();
          window.openLightboxPreview(img.getAttribute('src'), img.getAttribute('alt') || '', label);
          return;
        }
        index = i; update();
      });
      it.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); it.click(); }
      });
    });

    if (prev) prev.addEventListener('click', () => { index = (index - 1 + items.length) % items.length; update(); });
    if (next) next.addEventListener('click', () => { index = (index + 1) % items.length; update(); });

    // set initial caption
    update();
  })();

  // --- Lightbox for certificate preview ---
  (function () {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    const img = lightbox.querySelector('.lightbox-img');
    const caption = lightbox.querySelector('.lightbox-caption');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    let lastFocused = null;

    function openLightbox(src, alt, label) {
      lastFocused = document.activeElement;
      img.src = src;
      img.alt = alt || label || '';
      caption.textContent = label || '';
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      if (document.body.inert !== undefined) document.querySelector('main').inert = true;
      closeBtn.focus();
      document.addEventListener('keydown', onKeyDown);
    }

    // allow other handlers to open the lightbox programmatically
    window.openLightboxPreview = openLightbox;

    function closeLightbox() {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      if (document.body.inert !== undefined) document.querySelector('main').inert = false;
      img.src = '';
      caption.textContent = '';
      document.removeEventListener('keydown', onKeyDown);
      // clear any lingering drag state on tracks so auto-scroll resumes
      document.querySelectorAll('.image-track.is-dragging').forEach(t => t.classList.remove('is-dragging'));

      // If the element that opened the lightbox was inside an image-track,
      // avoid focusing it (that would pause auto-scroll via :focus-within).
      if (lastFocused) {
        const insideTrack = lastFocused.closest && lastFocused.closest('.image-track');
        if (!insideTrack) lastFocused.focus();
        else {
          const fallback = document.querySelector('header nav a');
          if (fallback) fallback.focus();
        }
      }
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') { /* optional: browse */ }
    }

    // open when clicking a cert card
    document.querySelectorAll('.cert-card').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        const thumb = el.querySelector('.cert-thumb');
        const label = el.querySelector('span') ? el.querySelector('span').textContent : '';
        const src = thumb ? thumb.getAttribute('src') : null;
        if (!src) return;
        openLightbox(src, thumb.getAttribute('alt') || '', label);
      });
    });

    // also open when clicking images inside image tracks
    // direct bindings (keeps keyboard support)
    document.querySelectorAll('.track-item img').forEach(imgEl => {
      imgEl.addEventListener('click', (e) => {
        const track = imgEl.closest('.card');
        const titleEl = track ? track.querySelector('.track-title') : null;
        const label = titleEl ? `${titleEl.textContent} — ${imgEl.alt || ''}` : imgEl.alt || '';
        openLightbox(imgEl.getAttribute('src'), imgEl.getAttribute('alt') || '', label);
      });

      // keyboard activation
      imgEl.setAttribute('tabindex', '0');
      imgEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          imgEl.click();
        }
      });
    });

    // also delegation fallback: open lightbox when clicking any img inside a track (helps when animation interferes)
    document.addEventListener('click', (e) => {
      const imgEl = e.target.closest && e.target.closest('.image-track img');
      if (!imgEl) return;
      const track = imgEl.closest('.card');
      const titleEl = track ? track.querySelector('.track-title') : null;
      const label = titleEl ? `${titleEl.textContent} — ${imgEl.alt || ''}` : imgEl.alt || '';
      openLightbox(imgEl.getAttribute('src'), imgEl.getAttribute('alt') || '', label);
    });

    closeBtn.addEventListener('click', closeLightbox);
    // click outside to close
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  })();

  // --- Keyboard shortcut: toggle reduced motion ---
  let reduced = false;
  window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'p') {
      reduced = !reduced;
      document.body.style.transition = reduced ? 'none' : '';
      alert(reduced ? 'Reduced motion ON' : 'Reduced motion OFF');
    }
  });

  // --- Preloader: ensure all images + window load before hiding (with fallback) ---
  (function () {
    const pre = document.getElementById('preloader');
    if (!pre) return;

    function hidePreloader() {
      if (!pre) return;
      pre.classList.add('preloader--hidden');
      pre.setAttribute('aria-hidden', 'true');
      pre.addEventListener('transitionend', () => {
        if (pre && pre.parentNode) pre.parentNode.removeChild(pre);
      }, { once: true });
    }

    function preloadAllImages(timeout = 8000) {
      const urls = new Set();
      // <img> tags
      Array.from(document.images).forEach(img => {
        const src = img.currentSrc || img.src || '';
        if (src && !src.startsWith('data:')) urls.add(src);
      });

      // background images (computed styles)
      const all = Array.from(document.querySelectorAll('*'));
      all.forEach(el => {
        const bg = getComputedStyle(el).backgroundImage;
        if (!bg || bg === 'none') return;
        const matches = [...bg.matchAll(/url\((?:"|'|)(.*?)(?:"|'|)\)/g)];
        matches.forEach(m => {
          const u = m[1];
          if (u && !u.startsWith('data:')) urls.add(u);
        });
      });

      if (urls.size === 0) return Promise.resolve();

      return new Promise(resolve => {
        let remaining = urls.size;
        let done = false;
        const timer = setTimeout(() => { if (!done) { done = true; resolve(); } }, timeout);
        urls.forEach(u => {
          const img = new Image();
          img.onload = img.onerror = () => {
            remaining -= 1;
            if (!done && remaining <= 0) {
              clearTimeout(timer);
              done = true;
              resolve();
            }
          };
          try { img.src = u; } catch (e) {
            remaining -= 1;
            if (!done && remaining <= 0) { clearTimeout(timer); done = true; resolve(); }
          }
        });
      });
    }

    const windowLoad = new Promise(res => {
      if (document.readyState === 'complete') res();
      else window.addEventListener('load', res);
    });

    // Try to use an animated GIF loader if present. This runs in parallel and does
    // not block waiting for other resources — it simply swaps the spinner for the GIF
    // as soon as it becomes available.
    (function tryGif() {
      const gifEl = document.querySelector('.preloader-gif');
      const spinnerEl = document.querySelector('.spinner');
      if (!gifEl) return;
      const probe = new Image();
      probe.onload = () => {
        // show gif and hide spinner
        gifEl.style.display = 'block';
        gifEl.classList.add('preloader-gif-visible');
        if (spinnerEl) spinnerEl.style.display = 'none';
      };
      probe.onerror = () => {
        // leave the spinner as-is
      };
      probe.src = gifEl.getAttribute('src');
    })();

    Promise.all([preloadAllImages(8000), windowLoad]).then(() => {
      setTimeout(hidePreloader, 300);
    });

    // Global fallback: don't block forever
    setTimeout(() => {
      if (document.getElementById('preloader')) hidePreloader();
    }, 12000);
  })();

  // ===== Page Wipe Navigation =====
  (function () {
    const DURATION = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--wipe-duration')
    ) || 200;

    let firstClickDone = false; // Track first click for immediate navigation

    // Check if reduced motion is preferred
    const supportsReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Check if a URL is same-origin
    const isSameOrigin = url => {
      try {
        const u = new URL(url, location.href);
        return u.origin === location.origin;
      } catch {
        return false;
      }
    };

    // Determine if link should trigger wipe animation
    const shouldHandleLink = el => {
      if (el.dataset && (el.dataset.flip === 'false' || el.dataset.wipe === 'false')) return false;
      const href = el.getAttribute('href');
      if (!href) return false;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;
      if (el.target === '_blank') return false;
      if (href.startsWith('#')) return true; // internal anchor
      return isSameOrigin(href);
    };

    document.addEventListener('click', ev => {
      const el = ev.target.closest && ev.target.closest('a');
      if (!el || !shouldHandleLink(el)) return;

      ev.preventDefault();
      const href = el.getAttribute('href');

      // ----- First click: override animation, navigate immediately -----
      if (!firstClickDone) {
        firstClickDone = true;

        // Remove any ongoing wipe classes
        const main = document.querySelector('main');
        if (main) main.classList.remove('is-wiping');

        // Navigate immediately
        if (href.startsWith('#')) {
          location.hash = href;
        } else {
          location.href = href;
        }
        return; // Skip further wipe handling
      }

      // ----- Reduced motion: skip animation -----
      if (supportsReducedMotion()) {
        if (href.startsWith('#')) location.hash = href;
        else location.href = href;
        return;
      }

      // ----- Short navigation transition -----
      const main = document.querySelector('main');
      if (main) main.classList.add('is-wiping');

      // Trigger reflow to ensure any transition applies
      requestAnimationFrame(() => requestAnimationFrame(() => {}));

      // Navigate after transition
      setTimeout(() => {
        if (href.startsWith('#')) {
          location.hash = href;
          setTimeout(() => {
            if (main) main.classList.remove('is-wiping');
          }, 80);
        } else {
          location.href = href;
        }
      }, DURATION);
    });
  })();
})();
