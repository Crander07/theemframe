/* ==========================================================================
   partials.js — shared header (navbar) and footer, injected on every page
   --------------------------------------------------------------------------
   Why plain JS instead of an <iframe> or fetch("header.html")?
   This site is opened directly from disk (file://) as well as from a
   server, and fetch() of local files is blocked by the browser's CORS
   rules under file://. Building the markup as JS strings works in both
   cases with no extra setup.

   To edit the nav links or footer content, change HEADER_HTML / FOOTER_HTML
   below — every page picks up the change automatically.
   ========================================================================== */

var HEADER_HTML =
  '<nav class="navbar navbar-expand-lg site-navbar sticky-top">' +
    '<div class="container">' +
      '<a class="navbar-brand" href="index.html">TheEmFrame</a>' +
      '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu" aria-label="Toggle navigation">' +
        '<span class="navbar-toggler-icon"></span>' +
      '</button>' +
      '<div class="collapse navbar-collapse justify-content-end" id="navMenu">' +
        '<ul class="navbar-nav">' +
          '<li class="nav-item"><a class="nav-link" href="index.html">Home</a></li>' +
          '<li class="nav-item"><a class="nav-link" href="portfolio.html">Portfolio</a></li>' +
          '<li class="nav-item"><a class="nav-link" href="services.html">Services</a></li>' +
          '<li class="nav-item"><a class="nav-link" href="testimonials.html">Testimonials</a></li>' +
          '<li class="nav-item"><a class="nav-link" href="faq.html">FAQ</a></li>' +
          '<li class="nav-item"><a class="nav-link" href="contact.html">Contact</a></li>' +
        '</ul>' +
      '</div>' +
    '</div>' +
  '</nav>';

// A stripped-down header for the private admin page: brand only, no public nav.
var HEADER_HTML_ADMIN =
  '<nav class="navbar navbar-expand-lg site-navbar sticky-top">' +
    '<div class="container">' +
      '<a class="navbar-brand" href="index.html">TheEmFrame</a>' +
      '<span class="nav-link mb-0">Admin</span>' +
    '</div>' +
  '</nav>';

var FOOTER_HTML =
  '<footer class="site-footer">' +
    '<div class="container">' +
      '<div class="row g-4">' +
        '<div class="col-md-4">' +
          '<h6>TheEmFrame</h6>' +
          '<p class="small mb-0">Freelance photography for couples, families, seniors, and events.</p>' +
        '</div>' +
        '<div class="col-md-4">' +
          '<h6>Explore</h6>' +
          '<ul class="list-unstyled small">' +
            '<li class="mb-1"><a href="portfolio.html">Portfolio</a></li>' +
            '<li class="mb-1"><a href="services.html">Services & Pricing</a></li>' +
            '<li class="mb-1"><a href="testimonials.html">Testimonials</a></li>' +
            '<li class="mb-1"><a href="faq.html">FAQ</a></li>' +
          '</ul>' +
        '</div>' +
        '<div class="col-md-4">' +
          '<h6>Contact</h6>' +
          '<ul class="list-unstyled small">' +
            '<li class="mb-1"><a href="contact.html">Send a message</a></li>' +
            '<li class="mb-1"><a href="mailto:hello@studioframe.example">hello@studioframe.example</a></li>' +
          '</ul>' +
        '</div>' +
      '</div>' +
      '<div class="footer-bottom text-center">' +
        '&copy; <span data-year></span> TheEmFrame Photography. All rights reserved.' +
      '</div>' +
    '</div>' +
  '</footer>';

function renderPartials() {
  var headerSlot = document.getElementById("site-header");
  var footerSlot = document.getElementById("site-footer");

  if (headerSlot) {
    headerSlot.outerHTML = headerSlot.hasAttribute("data-admin")
      ? HEADER_HTML_ADMIN
      : HEADER_HTML;
  }
  if (footerSlot) {
    footerSlot.outerHTML = FOOTER_HTML;
  }
}
