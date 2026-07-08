(function () {
  "use strict";

  const header = document.getElementById("siteHeader");
  const navToggle = document.getElementById("navToggle");
  const nav = document.getElementById("primaryNav");
  const parallaxEls = Array.from(document.querySelectorAll("[data-parallax]"));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function onScrollHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  }

  function toggleNav() {
    const open = nav.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (navToggle) {
    navToggle.addEventListener("click", toggleNav);
    nav.querySelectorAll(".nav__link").forEach((link) =>
      link.addEventListener("click", () => {
        if (nav.classList.contains("is-open")) toggleNav();
      })
    );
  }

  let ticking = false;

  function applyParallax() {
    const scrollY = window.scrollY;
    const viewportH = window.innerHeight;
    parallaxEls.forEach((el) => {
      const speed = parseFloat(el.getAttribute("data-parallax-speed")) || 0.2;
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -viewportH || rect.top > viewportH * 2) return;
      el.style.transform = "translate3d(0, " + (scrollY * speed).toFixed(2) + "px, 0)";
    });
    ticking = false;
  }

  function requestParallax() {
    if (!ticking) {
      window.requestAnimationFrame(applyParallax);
      ticking = true;
    }
  }

  const rotator = document.querySelector("[data-rotator]");
  if (rotator) {
    const words = ["MODERN.", "LUXURY.", "AFFORDABLE."];
    let idx = 0;
    setInterval(function () {
      rotator.classList.add("is-out");
      setTimeout(function () {
        idx = (idx + 1) % words.length;
        rotator.textContent = words[idx];
        rotator.classList.remove("is-out");
        rotator.classList.add("is-prep");
        void rotator.offsetWidth;
        rotator.classList.remove("is-prep");
      }, 600);
    }, 2000);
  }

  const accordionHeaders = document.querySelectorAll(
    ".accordion__header:not(.accordion__header--soon)"
  );
  accordionHeaders.forEach(function (head) {
    head.addEventListener("click", function () {
      const item = head.closest(".accordion__item");
      const isOpen = item.classList.contains("is-open");
      document.querySelectorAll(".accordion__item.is-open").forEach(function (openItem) {
        openItem.classList.remove("is-open");
        const h = openItem.querySelector(".accordion__header");
        if (h) h.setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("is-open");
        head.setAttribute("aria-expanded", "true");
      }
    });
  });

  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const val = (n) => {
        const el = contactForm.elements[n];
        return el ? el.value.trim() : "";
      };
      const nama = val("nama");
      const email = val("email");
      const telp = val("telepon");
      const tipe = val("tipe");
      const pesan = val("pesan");

      let txt = "Halo Admin Neo Green Terrace, saya " + (nama || "(tanpa nama)") + ".";
      if (tipe) txt += " Saya tertarik dengan " + tipe + ".";
      if (pesan) txt += " " + pesan;
      const extra = [];
      if (email) extra.push("Email: " + email);
      if (telp) extra.push("Telp: " + telp);
      if (extra.length) txt += " (" + extra.join(", ") + ")";

      window.open(
        "https://api.whatsapp.com/send?phone=6281390007521&text=" + encodeURIComponent(txt),
        "_blank"
      );
    });
  }

  const galleryRoot = document.querySelector("[data-gallery]");
  if (galleryRoot) {
    const land = ["L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8"].map((n) => "assets/galeri/web/" + n + ".jpg");
    const port = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"].map((n) => "assets/galeri/web/" + n + ".jpg");
    const landRow2 = land.slice(4).concat(land.slice(0, 4));

    function buildRow(list, modifier) {
      const row = document.createElement("div");
      row.className = "gallery__row " + modifier;
      const track = document.createElement("div");
      track.className = "gallery__row-track";
      list.concat(list).forEach(function (src) {
        const fig = document.createElement("figure");
        fig.className = "gallery__item";
        const im = document.createElement("img");
        im.src = src;
        im.alt = "Galeri Neo Green Terrace";
        im.loading = "lazy";
        fig.appendChild(im);
        track.appendChild(fig);
      });
      row.appendChild(track);
      return row;
    }

    galleryRoot.appendChild(buildRow(land, "gallery__row--1"));
    galleryRoot.appendChild(buildRow(landRow2, "gallery__row--2"));
    galleryRoot.appendChild(buildRow(port, "gallery__row--3"));
  }

  document.querySelectorAll("[data-slider]").forEach(function (slider) {
    const track = slider.querySelector(".unit-slider__track");
    const slides = slider.querySelectorAll(".unit-slider__track img");
    const prev = slider.querySelector(".unit-slider__btn--prev");
    const next = slider.querySelector(".unit-slider__btn--next");
    const dotsWrap = slider.querySelector(".unit-slider__dots");
    let idx = 0;

    if (slides.length <= 1) {
      if (prev) prev.style.display = "none";
      if (next) next.style.display = "none";
      return;
    }

    slides.forEach(function (_, i) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "unit-slider__dot" + (i === 0 ? " is-active" : "");
      dot.setAttribute("aria-label", "Gambar " + (i + 1));
      dot.addEventListener("click", () => go(i));
      dotsWrap.appendChild(dot);
    });

    function go(n) {
      idx = (n + slides.length) % slides.length;
      track.style.transform = "translateX(" + (-idx * 100) + "%)";
      dotsWrap.querySelectorAll(".unit-slider__dot").forEach(function (d, i) {
        d.classList.toggle("is-active", i === idx);
      });
    }

    prev.addEventListener("click", () => go(idx - 1));
    next.addEventListener("click", () => go(idx + 1));
  });

  const facilityTabs = document.querySelectorAll(".facility-tab");
  const facilityPanels = document.querySelectorAll(".facility-panel");
  facilityTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      const idx = tab.getAttribute("data-facility");
      facilityTabs.forEach((t) => t.classList.remove("is-active"));
      facilityPanels.forEach((p) => p.classList.remove("is-active"));
      tab.classList.add("is-active");
      const panel = document.querySelector('.facility-panel[data-panel="' + idx + '"]');
      if (panel) panel.classList.add("is-active");
    });
  });

  function revealHero() {
    document.querySelectorAll(".hero__content > *").forEach((el, i) => {
      const delay = 0.15 + i * 0.12;
      el.style.opacity = "0";
      el.style.transform = "translateY(28px)";
      el.style.transition =
        "opacity .9s cubic-bezier(.22,1,.36,1) " + delay + "s, " +
        "transform .9s cubic-bezier(.22,1,.36,1) " + delay + "s";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        });
      });
    });
  }

  const vModal = document.getElementById("videoModal");
  const vFrame = document.getElementById("videoFrame");
  const vPlay = document.querySelector(".videoshow__play");
  if (vModal && vFrame && vPlay) {
    const YT = "https://www.youtube.com/embed/otPq0k5WrKQ?autoplay=1&rel=0";
    const openVideo = function () {
      vFrame.src = YT;
      vModal.hidden = false;
      document.body.style.overflow = "hidden";
    };
    const closeVideo = function () {
      vModal.hidden = true;
      vFrame.src = "";
      document.body.style.overflow = "";
    };
    vPlay.addEventListener("click", openVideo);
    vModal.querySelectorAll("[data-close]").forEach(function (el) {
      el.addEventListener("click", closeVideo);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !vModal.hidden) closeVideo();
    });
  }

  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  if (!prefersReducedMotion) {
    window.addEventListener("scroll", requestParallax, { passive: true });
    window.addEventListener("resize", requestParallax);
    applyParallax();
    revealHero();
  }
})();
