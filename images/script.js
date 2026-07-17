/* ==========================================================================
   script.js — shared behavior across all public pages
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  if (typeof renderPartials === "function") renderPartials(); // inject shared header/footer first
  setFooterYear();
  highlightActiveNavLink();
  initScrollReveal();
  initPortfolioGrid();      // no-ops if the page has no #portfolio-grid
  initFeaturedGrid();       // no-ops if the page has no #featured-grid (home)
  initTestimonialsGrid();   // no-ops if the page has no [data-testimonials]
  initContactForm();        // no-ops if the page has no #contact-form
  initLightbox();
});

/* ---- Footer year ---------------------------------------------------- */
function setFooterYear() {
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
}

/* ---- Nav active link -------------------------------------------------- */
function highlightActiveNavLink() {
  var current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".site-navbar .nav-link").forEach(function (link) {
    var href = link.getAttribute("href");
    if (href === current) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });
}

/* ---- Scroll reveal ------------------------------------------------------ */
function initScrollReveal() {
  var items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  items.forEach(function (el) { observer.observe(el); });
}

/* ---- Portfolio grid (portfolio.html) ------------------------------------ */
function initPortfolioGrid() {
  var grid = document.getElementById("portfolio-grid");
  if (!grid || typeof CATEGORIES === "undefined") return;

  var activeFilter = "all";

  async function render() {
    grid.innerHTML = '<p class="text-muted col-12">Loading photos…</p>';
    var cards = [];

    for (var i = 0; i < CATEGORIES.length; i++) {
      var cat = CATEGORIES[i];
      if (activeFilter !== "all" && activeFilter !== cat.slug) continue;
      var images = await getAllImages(cat.slug);
      images.forEach(function (img) {
        cards.push(photoCardMarkup(img, cat.label, cat.slug));
      });
    }

    grid.innerHTML = cards.join("") || '<p class="text-muted col-12">No photos in this album yet.</p>';
    // (re)attach lightbox handlers for the freshly rendered cards
    attachLightboxHandlers();
  }

  document.querySelectorAll(".filter-pill").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".filter-pill").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      activeFilter = btn.dataset.filter;
      render();
    });
  });

  render();
}

function photoCardMarkup(img, categoryLabel, slug) {
  return (
    '<div class="col-6 col-md-4 col-lg-3">' +
      '<div class="photo-card" tabindex="0" data-bs-toggle="modal" data-bs-target="#lightboxModal" ' +
        'data-src="' + img.src + '" data-alt="' + escapeHtml(img.alt) + '" ' +
        'data-meta="' + escapeHtml(img.meta) + '" data-cat="' + escapeHtml(categoryLabel) + '">' +
        '<img src="' + img.src + '" alt="' + escapeHtml(img.alt) + '" loading="lazy">' +
        '<div class="exif-strip"><span>' + escapeHtml(img.meta) + '</span><span class="exif-cat">' + escapeHtml(categoryLabel) + '</span></div>' +
      '</div>' +
    '</div>'
  );
}

function escapeHtml(str) {
  var div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

/* ---- Featured grid (index.html teaser) ---------------------------------- */
async function initFeaturedGrid() {
  var grid = document.getElementById("featured-grid");
  if (!grid || typeof CATEGORIES === "undefined") return;

  for (var i = 0; i < CATEGORIES.length; i++) {
    var cat = CATEGORIES[i];
    var images = await getAllImages(cat.slug);
    if (!images.length) continue;
    var cover = images[0];
    grid.insertAdjacentHTML(
      "beforeend",
      '<div class="col-6 col-lg-4">' +
        '<a href="portfolio.html?category=' + cat.slug + '" class="text-decoration-none">' +
          '<div class="photo-card">' +
            '<img src="' + cover.src + '" alt="' + escapeHtml(cover.alt) + '" loading="lazy">' +
            '<div class="exif-strip"><span>View album</span><span class="exif-cat">' + escapeHtml(cat.label) + '</span></div>' +
          '</div>' +
        '</a>' +
      '</div>'
    );
  }
}

/* ---- Testimonials grid ---------------------------------------------------- */
function initTestimonialsGrid() {
  var grid = document.querySelector("[data-testimonials]");
  if (!grid || typeof TESTIMONIALS === "undefined") return;

  var limit = parseInt(grid.getAttribute("data-limit") || "0", 10);
  var list = limit ? TESTIMONIALS.slice(0, limit) : TESTIMONIALS;

  list.forEach(function (t) {
    var stars = "★★★★★".slice(0, t.rating) + "☆☆☆☆☆".slice(0, 5 - t.rating);
    grid.insertAdjacentHTML(
      "beforeend",
      '<div class="col-md-6 col-lg-4">' +
        '<div class="testimonial-card">' +
          '<span class="quote-mark">&ldquo;</span>' +
          '<div class="stars">' + stars + '</div>' +
          '<p class="mb-0 text-black">' + escapeHtml(t.quote) + '</p>' +
          '<footer>' + escapeHtml(t.name) + ' &middot; ' + escapeHtml(t.session) + '</footer>' +
        '</div>' +
      '</div>'
    );
  });
}

/* ---- Lightbox (Bootstrap modal populated from clicked card) -------------- */
function initLightbox() {
  attachLightboxHandlers();
}

function attachLightboxHandlers() {
  document.querySelectorAll(".photo-card[data-bs-toggle='modal']").forEach(function (card) {
    card.addEventListener("click", function () {
      var modalImg = document.getElementById("lightboxImage");
      var modalCaption = document.getElementById("lightboxCaption");
      if (!modalImg) return;
      modalImg.src = card.dataset.src;
      modalImg.alt = card.dataset.alt;
      if (modalCaption) {
        modalCaption.textContent = card.dataset.meta + "  ·  " + card.dataset.cat;
      }
    });
    // keyboard support
    card.addEventListener("keypress", function (e) {
      if (e.key === "Enter" || e.key === " ") card.click();
    });
  });
}

/* ---- Contact form --------------------------------------------------------
   Uses EmailJS (https://www.emailjs.com) so the form can send a real email
   without a custom backend. You MUST create a free EmailJS account and
   replace the three placeholder values below. See README.md for the
   step-by-step. Until configured, the form will show a friendly error
   instead of silently failing.
   ========================================================================== */
var EMAILJS_PUBLIC_KEY = "YOUR_EMAILJS_PUBLIC_KEY";
var EMAILJS_SERVICE_ID = "YOUR_EMAILJS_SERVICE_ID";
var EMAILJS_TEMPLATE_ID = "YOUR_EMAILJS_TEMPLATE_ID";

function initContactForm() {
  var form = document.getElementById("contact-form");
  if (!form) return;

  // Pre-fill the "package" field from a ?package= query param (used by
  // the "Book this package" buttons on services.html)
  var params = new URLSearchParams(window.location.search);
  var pkg = params.get("package");
  var pkgField = document.getElementById("packageInterest");
  if (pkg && pkgField) {
    Array.from(pkgField.options).forEach(function (opt) {
      if (opt.value === pkg) opt.selected = true;
    });
  }

  var statusBox = document.getElementById("form-status");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    var submitBtn = form.querySelector("button[type='submit']");
    var originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    var configured =
      typeof emailjs !== "undefined" &&
      EMAILJS_PUBLIC_KEY.indexOf("YOUR_") !== 0;

    if (!configured) {
      // EmailJS hasn't been set up yet — tell the developer/owner clearly
      // instead of pretending the email sent.
      showStatus(
        statusBox,
        "danger",
        "Email sending isn't configured yet. Add your EmailJS keys in js/script.js (see README.md). " +
        "Your message wasn't lost — please email me directly for now."
      );
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
      return;
    }

    var templateParams = {
      from_name: form.name.value,
      from_email: form.email.value,
      phone: form.phone.value,
      package_interest: pkgField ? pkgField.value : "",
      message: form.message.value,
    };

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY)
      .then(function () {
        showStatus(statusBox, "success", "Thanks! Your message is on its way — I'll reply within 1–2 business days.");
        form.reset();
        form.classList.remove("was-validated");
      })
      .catch(function (err) {
        showStatus(statusBox, "danger", "Something went wrong sending your message. Please try again or email me directly.");
        console.error("EmailJS error:", err);
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      });
  });
}

function showStatus(box, type, message) {
  if (!box) return;
  box.className = "alert alert-" + type + " mt-3";
  box.textContent = message;
  box.classList.remove("d-none");
}
