/* ==========================================================================
   data.js — shared content + storage layer for the whole site
   --------------------------------------------------------------------------
   This is a static HTML/CSS/JS site (no server of its own), so real,
   shared-across-all-visitors photo storage comes from Supabase: a free
   hosted Postgres database (photo metadata) + file storage (the actual
   images) + auth (real admin login). See README.md for one-time setup.
   ========================================================================== */

// ---- Category definitions -------------------------------------------------
const CATEGORIES = [
  { slug: "couples", label: "Couples" },
  { slug: "families", label: "Families & Groups" },
  { slug: "events", label: "Events" },
  { slug: "seniors", label: "Seniors" },
  { slug: "portraits", label: "Portraits & Branding" },
];

// ---- Default / sample portfolio images ------------------------------------
// Placeholder photography from picsum.photos, fixed IDs so they stay
// consistent between visits. Swap these src values for your own real work
// any time — or add more through the Admin page.
const DEFAULT_ALBUMS = {
  couples: [
    
  ],
  families: [
    
  ],
  events: [
    
  ],
  seniors: [
   
  ],
  portraits: [
  ],
};

// ---- Testimonials -----------------------------------------------------
const TESTIMONIALS = [
  { name: "Maria & Diego S.", session: "Couples Session", quote: "Our engagement photos feel like they were pulled straight out of a film — relaxed, warm, completely us. We didn't feel posed for a single frame.", rating: 5 },
  { name: "The Alvarez Family", session: "Family Session", quote: "Wrangling three kids under seven for photos sounded like a nightmare. It wasn't. Patient, quick, and the gallery made us tear up a little.", rating: 5 },
  { name: "Rachel P.", session: "Senior Portraits", quote: "My daughter is not a 'take a lot of photos' kind of person and she loved this shoot. The gallery captured exactly who she is right now.", rating: 5 },
  { name: "Hartwell & Co.", session: "Corporate Event", quote: "Unobtrusive during the event, and the turnaround was fast enough that we had highlight photos up before the after-party ended.", rating: 4 },
  { name: "Jordan T.", session: "Portraits & Branding", quote: "Needed new headshots I didn't hate. Got a full set I actually use everywhere now, from LinkedIn to my speaker bio.", rating: 5 },
  { name: "The Kim-Osei Family", session: "Family Session", quote: "Three generations, one park, zero meltdowns. That's the review. Also the photos are beautiful.", rating: 5 },
];

// ---- Supabase-backed helpers for admin-uploaded images ------------------
// Requires js/supabase-config.js to be loaded first (defines `supabaseClient`).
// See README.md for the one-time database + storage setup in Supabase.
const PHOTOS_TABLE = "photos";
const PHOTOS_BUCKET = "portfolio-photos";

/** Fetches admin-uploaded photos for a category from Supabase.
 *  Returns a Promise<Array<{id, src, alt, meta, storage_path}>> */
async function getUploadedImages(categorySlug) {
  if (!supabaseClient) return [];
  const { data, error } = await supabaseClient
    .from(PHOTOS_TABLE)
    .select("id, src, alt, meta, storage_path")
    .eq("category", categorySlug)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Supabase fetch error:", error);
    return [];
  }
  return data || [];
}

/** Uploads a File to Supabase Storage, then records it in the photos table.
 *  Returns the inserted row, or throws on failure. */
async function saveUploadedImage(categorySlug, file, alt) {
  if (!supabaseClient) {
    throw new Error("Supabase isn't configured yet — see js/supabase-config.js.");
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = categorySlug + "/" + crypto.randomUUID() + "." + ext;

  const { error: uploadError } = await supabaseClient.storage
    .from(PHOTOS_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabaseClient.storage.from(PHOTOS_BUCKET).getPublicUrl(path);

  const { data, error: insertError } = await supabaseClient
    .from(PHOTOS_TABLE)
    .insert({
      category: categorySlug,
      src: urlData.publicUrl,
      alt: alt || file.name,
      meta: "UPLOADED · " + new Date().toLocaleDateString(),
      storage_path: path,
    })
    .select()
    .single();
  if (insertError) throw insertError;

  return data;
}

/** Removes an uploaded photo: deletes the storage file, then the db row. */
async function removeUploadedImage(id, storagePath) {
  if (!supabaseClient) return;

  if (storagePath) {
    const { error: removeError } = await supabaseClient.storage
      .from(PHOTOS_BUCKET)
      .remove([storagePath]);
    if (removeError) console.error("Supabase storage remove error:", removeError);
  }

  const { error } = await supabaseClient.from(PHOTOS_TABLE).delete().eq("id", id);
  if (error) console.error("Supabase delete error:", error);
}

/** Combined default (sample) + real uploaded images for a category. */
async function getAllImages(categorySlug) {
  const defaults = DEFAULT_ALBUMS[categorySlug] || [];
  const uploaded = await getUploadedImages(categorySlug);
  return defaults.concat(uploaded);
}
