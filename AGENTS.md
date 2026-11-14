<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- All backend calls go through `src/services/api.js`; endpoint paths, request field names and map layer sources stay `null` until the backend team confirms them, so the UI shows "pending" instead of guessing a contract.
- App code is JavaScript (`.jsx`) in `src/components`, `src/pages`, `src/services`; route files in `src/routes/*.tsx` are thin wrappers that render a page, and `src/App.jsx` is the shell rendered by `__root.tsx` (no `main.jsx` entry on this stack).
- Backend responses are rendered shape-tolerantly (`DataView`, `dataUtils.js`) and never transformed into derived scientific or route values in the frontend.
- The map uses Mars CRSs registered in `src/components/map/marsProjection.js` (view in IAU_2015:49910, GeoJSON read as IAU_2015:49900); never use OpenLayers' default Web Mercator, and load OpenLayers only on the client via `LazyMarsMap`.
