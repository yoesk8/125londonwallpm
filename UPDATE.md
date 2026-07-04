# Update: face-level tracking + list view + tap fix

## 1. Database (do this FIRST)
Supabase → SQL Editor → paste and run `supabase/migration-faces.sql`.
It rebuilds `floor_status` with a `face` column (North/East/South/West), copying
each floor's existing statuses to all four faces, and re-applies the security policies.

## 2. Code
Copy these files over your local project (same paths), replacing the old ones:

- lib/ui.js
- app/page.js
- components/Building3D.jsx
- components/BuildingView.jsx
- components/BuildingList.jsx   (new file)
- supabase/migration-faces.sql  (new, keep for reference)

Then:

    git add .
    git commit -m "Face-level tracking, list view, tap fix"
    git push

Vercel redeploys automatically.

## What changed
- **Tap fix**: pointer capture + a finger-friendly tap threshold based on net
  movement, so selecting works reliably after rotating, on desktop and mobile.
- **Faces**: every floor is now four separately tracked elevations. The 3D model
  shows four panels per floor, each tappable and coloured independently. An
  orange cone on the base marks north.
- **List view**: a "List" toggle above the model gives the text version —
  Floor 17 → West face → Cladding: In progress — with the same tap-to-cycle
  status pills, per-floor progress bars, and full keyboard/screen-reader
  friendliness. Great on phones on site.
