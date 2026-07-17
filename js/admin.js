/* ==========================================================================
   admin.js — real login + photo upload manager for admin.html
   --------------------------------------------------------------------------
   Auth is handled by Supabase Auth (email + password). Create your one
   admin login in the Supabase dashboard under Authentication → Users →
   Add user — do NOT let people self-register. See README.md.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async function () {
  var gate = document.getElementById("admin-gate");
  var panel = document.getElementById("admin-panel");
  var form = document.getElementById("admin-login-form");
  var errorBox = document.getElementById("admin-login-error");

  if (!supabaseClient) {
    errorBox.textContent = "Supabase isn't configured yet — add your Project URL and anon key to js/supabase-config.js (see README.md).";
    errorBox.classList.remove("d-none");
    return;
  }

  async function unlock() {
    gate.classList.add("d-none");
    panel.classList.remove("d-none");
    renderCategorySelect();
    await renderAllThumbnails();
  }

  // Resume an existing session (Supabase keeps this in the browser for you)
  var initialSession = await supabaseClient.auth.getSession();
  if (initialSession.data.session) {
    unlock();
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var email = document.getElementById("admin-email").value;
    var password = document.getElementById("admin-password").value;
    var submitBtn = form.querySelector("button[type='submit']");

    submitBtn.disabled = true;
    submitBtn.textContent = "Signing in…";

    var result = await supabaseClient.auth.signInWithPassword({ email: email, password: password });

    submitBtn.disabled = false;
    submitBtn.textContent = "Unlock";

    if (result.error) {
      errorBox.textContent = result.error.message;
      errorBox.classList.remove("d-none");
    } else {
      errorBox.classList.add("d-none");
      unlock();
    }
  });

  var logoutBtn = document.getElementById("admin-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
      await supabaseClient.auth.signOut();
      window.location.reload();
    });
  }

  var uploadForm = document.getElementById("upload-form");
  if (uploadForm) {
    uploadForm.addEventListener("submit", handleUpload);
  }
});

function renderCategorySelect() {
  var select = document.getElementById("upload-category");
  if (!select || select.options.length) return;
  CATEGORIES.forEach(function (cat) {
    var opt = document.createElement("option");
    opt.value = cat.slug;
    opt.textContent = cat.label;
    select.appendChild(opt);
  });
}

async function handleUpload(e) {
  e.preventDefault();
  var category = document.getElementById("upload-category").value;
  var fileInput = document.getElementById("upload-file");
  var altInput = document.getElementById("upload-alt");
  var files = fileInput.files;
  var submitBtn = e.target.querySelector("button[type='submit']");

  if (!files || !files.length) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Uploading…";

  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    if (!file.type.startsWith("image/")) continue;
    try {
      await saveUploadedImage(category, file, altInput.value || file.name);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed: " + err.message);
    }
  }

  submitBtn.disabled = false;
  submitBtn.textContent = "Add to Portfolio";
  fileInput.value = "";
  altInput.value = "";
  await renderAllThumbnails();
}

async function renderAllThumbnails() {
  var container = document.getElementById("uploaded-thumbnails");
  if (!container) return;
  container.innerHTML = '<p class="text-muted">Loading…</p>';

  var sections = [];
  for (var i = 0; i < CATEGORIES.length; i++) {
    var cat = CATEGORIES[i];
    var uploads = await getUploadedImages(cat.slug);
    if (uploads.length) sections.push({ cat: cat, uploads: uploads });
  }

  if (!sections.length) {
    container.innerHTML = '<p class="text-muted">No uploaded photos yet. Add some above — they\'ll appear on the Portfolio page for every visitor, on every device.</p>';
    return;
  }

  container.innerHTML = sections
    .map(function (s) {
      var thumbs = s.uploads
        .map(function (img) {
          return (
            '<div class="col-6 col-md-3">' +
              '<div class="upload-thumb">' +
                '<img src="' + img.src + '" alt="">' +
                '<button type="button" class="remove-btn" data-id="' + img.id + '" data-path="' + (img.storage_path || "") + '" title="Remove">&times;</button>' +
              '</div>' +
            '</div>'
          );
        })
        .join("");
      return '<h6 class="mt-4 mb-2">' + s.cat.label + '</h6><div class="row g-3">' + thumbs + '</div>';
    })
    .join("");

  container.querySelectorAll(".remove-btn").forEach(function (btn) {
    btn.addEventListener("click", async function () {
      btn.disabled = true;
      await removeUploadedImage(btn.dataset.id, btn.dataset.path);
      await renderAllThumbnails();
    });
  });
}
