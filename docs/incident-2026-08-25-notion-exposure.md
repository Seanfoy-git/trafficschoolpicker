# Incident retro — private Notion content served on production

**Date:** 2026-08-25 · **Severity:** P0 · **Status:** Resolved
**Owners:** Sean (platform/Notion/Vercel), Claude Code (code fixes)

## Summary

After ~50 "Question Pages" rows were flipped to `Complete` and the site rebuilt, a
state-question route (`/north-carolina/does-traffic-school-remove-points`) rendered a
**private page from Sean's Notion workspace** (a personal recipe). A sibling route
rendered correctly at the same time, so the defect was per-route, not a wholesale
swap. The site was paused within hours. External-exposure checks (Google index, log
review) found the window was effectively Sean's own requests. Resolved by migrating
the CMS to a dedicated workspace behind a **scoped read-only token**, plus
defense-in-depth in the render path and CI gates.

## Root cause

**An over-broad Notion integration token** — shared at a level that granted read
access to the entire workspace (including a Credentials Vault and personal pages),
not just the CMS databases. That was the *necessary condition*: with a workspace-wide
token, any fetch that resolved to the wrong page id could surface private content.

The *trigger* was scale: at ~60 pages the build hit Notion 429s, and a rate-limited
`blocks.children.list` / `databases.query` returned another workspace page's data for
a valid route. The code path itself was scoped and fail-closed — no search endpoint,
no rewrite, single data source, rows lacking the CMS schema already dropped — so it
could not *intentionally* fetch a foreign page. Scale + a broad token turned a
transient API mis-serve into a private-content render.

## Timeline (abridged)

- Content team flips ~50 rows to Complete → rebuild.
- Recipe observed under a question route; broader exposure suspected.
- NC points row reverted to Draft; **project paused** (all builds stopped).
- Investigation: ruled out search/rewrite/multi-source; named the over-broad token.
- Fix wave 1: fail-closed fetch, parent-source guards (question **and** review
  bodies), route guard, extended to all page-body fetchers.
- **Pellucid CMS migration**: new workspace, new scoped `tsp-site-cms` integration
  shared only with the "SITE DATA" page; old token revoked.
- Env swap on Vercel; boundary CI gate added.
- Several failed deploys from **env-entry errors** (mangled DB ids, then the wrong
  `NOTION_TOKEN` — a *duplicate* `tsp-site-cms` integration). Fingerprint diagnostics
  pinpointed each. Boundary check hardened to validate every id + fail loudly.
- **Notion-link leak**: migrated CMS bodies linked cross-reference phrases to
  `app.notion.com` URLs; the renderer surfaced them → stripped at render.
- Green build behind the wall → live sweep clean (69 pages) → protection dropped.

## What went well

- **Fail-closed by default** meant every broken build *failed* rather than shipping
  bad content. No misconfiguration ever deployed.
- **Pausing fast** contained the window.
- **Diagnostics over guessing** — safe env fingerprints (length + sha, never the
  secret) turned an opaque "all 8 ids 404" into "the token is wrong," in one build.
- The route guard + boundary gate caught real problems (env slips) at build time.

## What went wrong / contributing factors

1. **Over-broad token** — the single structural cause. Sharing at a parent page
   cascaded access to siblings, including private data.
2. **A body-fetch renders whatever an id resolves to.** `blocks.children.list(id)`
   had no source validation, so a mis-served id rendered a foreign page.
3. **Scale untested.** The 10-page version ran for days; the 50-page rebuild was the
   first time 429 backpressure hit the content fetch.
4. **Env-entry fragility.** Hand-pasting 8 UUIDs + a token into Vercel produced a
   mangled id and a wrong (duplicate-integration) token — and the first boundary
   check *failed open* on "0 databases visible."
5. **Migration side effects.** Moving workspaces re-linked in-body cross-references
   to `app.notion.com`, which the renderer trusted.

## Lessons

- **Scope tokens to the minimum, always.** Share an integration with *databases*,
  never a parent page. A scoped token makes the entire bug class impossible.
- **Validate the source of any rendered content**, not just the query. Render a page
  body only after confirming its parent is the expected DB.
- **Fail closed AND fail loud.** Returning `[]`/404 is safe; a CI gate that *asserts
  the expected* (not just "no surprises") turns silent degradation into a red build.
- **Never trust hrefs from a CMS** on a public page — allowlist/strip external
  link targets (here: no `notion.*`).
- **Test at target scale** before flipping content en masse.

## Action items

- [x] Scoped read-only `tsp-site-cms` token; old token revoked. *(structural fix)*
- [x] Parent-source guards on all page-body fetchers (`pageBelongsTo`).
- [x] Boundary CI gate — validates every `NOTION_*_DB` id + old hub 404 (`prebuild`).
- [x] Route guard — emitted routes == Complete rows (`postbuild`).
- [x] `sanitizeHref` strips `notion.*` links from rendered content.
- [x] Live sweep script for post-deploy verification.
- [x] **Vercel token reconciled** — a stale/old token value (`d3dc228c`) was in Vercel vs
      the working one (`996637ea`); the correct token is now live. No duplicate
      integration was found on inspection (the two values just caused the confusion).
- [ ] **Rotate the `tsp-site-cms` token** (it was shared in a chat during response);
      update Vercel + `.env.local` when you do.
- [ ] Rotate Credentials Vault secrets (Sean's call; low real-world risk given the wall).
- [ ] Consider retrieving DB ids from `search` at build (title→id) to remove hand-entered id risk.
