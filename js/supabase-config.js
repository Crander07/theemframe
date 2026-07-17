/* ==========================================================================
   supabase-config.js — connection settings for your Supabase project
   --------------------------------------------------------------------------
   1. Create a free project at https://supabase.com
   2. Go to Project Settings → API Keys
   3. Copy your "Project URL" and "Publishable key" (sb_publishable_...)
      into the two lines below
   4. See README.md for the full setup guide (database table, storage
      bucket, RLS policies, and creating your admin login).

   The publishable key is SAFE to expose in client-side code — it only
   grants the permissions your Row Level Security policies allow (public
   read, and authenticated-only write/delete). Never put your "Secret key"
   (sb_secret_...) here or anywhere in this repo.
   ========================================================================== */
var SUPABASE_URL = "https://rrbgalroabzjngioejjk.supabase.co";
var SUPABASE_ANON_KEY = "sb_publishable_Hn7uCeiPoQXmVCMKQaFmUg_X9Fb59lO";

var supabaseClient =
  SUPABASE_URL.indexOf("YOUR_") !== 0 && window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

if (!supabaseClient) {
  console.warn(
    "Supabase isn't configured yet — photo uploads and the portfolio grid " +
    "will show sample images only until you add your Project URL and " +
    "publishable key to js/supabase-config.js. See README.md."
  );
}
