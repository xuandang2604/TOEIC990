# GitHub Pages: blank-page repair

26 October 2026, follow-up after push 6e7e6d0. The missing automatic build/deploy workflow is now added at `.github/workflows/pages.yml`. No commit, push, workflow execution, deployment, browser runtime test or production build was performed by the agent.

## Verified cause

- `https://xuandang2604.github.io/TOEIC990/` returned HTTP 200, but its HTML still contained `<script type="module" src="/src/main.tsx">` and an otherwise empty React root. This is the repository's source entry, not Vite's built output.
- The script URL actually requested by that HTML, `https://xuandang2604.github.io/src/main.tsx`, returned **404**. The file under `/TOEIC990/src/main.tsx` returned **200, application/octet-stream**. Publishing the TSX source at a different URL would still not compile it for browsers.
- The public run [pages build and deployment](https://github.com/xuandang2604/TOEIC990/actions/runs/40308845654) reported success for pushed commit `6e7e6d0fb6c735e4e839c76fc398944370bf58b4`. The raw source HTML proves that this successful Pages publication did not publish the required Vite artifact.
- The local remote still spells `TOIEC990`, but GitHub's API redirects that repository to the canonical **`xuandang2604/TOEIC990`**. The user's `/TOEIC990/` site URL is correct; the spelling mismatch is not the confirmed cause. No remote was changed.
- Vite previously defaulted to root `/`, so even the existing local build referenced `/assets/...`. A project site needs `/TOEIC990/assets/...` instead. Media and manifest also needed the project path.

The unauthenticated Pages settings API returned 404, so the precise private Settings → Pages values were not inspected. The conclusions above come from public HTTP responses, public workflow metadata and the local configuration.

## Local repair

- Vite reads `STUDY990_BASE_PATH`; localhost retains `/` by default.
- HTML icons and the manifest use Vite's base. Built JS/CSS already receive Vite's base transformation.
- Photographs, exhibits and recording URLs apply the base at the renderer boundary. Bundled `/media/...` content references, stable IDs, fingerprints and learner records are unchanged.
- Manifest identity/start URL/scope/icons resolve relative to the manifest's own project directory.
- Service-worker registration already uses Vite's base. Project shell cache names now include the registration scope and are separate from legacy root-site cache names. Existing explicit-update behavior and IndexedDB ownership are retained.
- The artifact auditor accepts the now-relative local manifest icons.

The checked-in `dist` directory, if present locally, is an older output and was not rebuilt here. Do not publish it as the repaired artifact. The workflow must build fresh with the intended base.

## Publication method

Vite's [GitHub Pages guide](https://vite.dev/guide/static-deploy.html#github-pages) requires building the app and publishing `dist`, with the project base path. In the canonical repository choose **Settings → Pages → Build and deployment → Source: GitHub Actions**, before pushing the added workflow. See [GitHub's publishing-source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

The draft below reads `base_path` from GitHub's [configure-pages action](https://github.com/actions/configure-pages/blob/main/action.yml); this avoids hardcoding the old repository spelling and also supports a root/custom-domain site. It uploads only the built site, excluding source and the development Content Studio.

## Required GitHub setup and next push

The previous repair contained only a workflow proposal, so the push of commit 6e7e6d0 still ran the built-in `dynamic/pages/pages-build-deployment` publication. The attached browser screenshot still contains literal `%BASE_URL%` and `/src/main.tsx`, confirming that source is being served instead of compiled output.

The actual workflow now exists at [pages.yml](../.github/workflows/pages.yml). It runs automatically on pushes to `main`, with `workflow_dispatch` available for an intentional manual retry. It uses Node 24, installs the lockfile, reads Pages metadata, builds with `STUDY990_BASE_PATH`, checks the artifact and uploads only `dist`. Deploy permissions are restricted to the deploy job. The five pinned official action commits were checked against GitHub's public API and all exist; the lockfile includes the Linux x64 native dependencies used by Vite/Tailwind.

1. On **xuandang2604/TOEIC990**, open **Settings → Pages → Build and deployment** and choose **Source: GitHub Actions**. Do not continue publishing `main / (root)` as static source.
2. Commit and push the new `.github/workflows/pages.yml` and updated documentation to `main`. A push cannot include an uncommitted file; the earlier push did not contain this workflow.
3. In **Actions**, open **Build and deploy STUDY 990**. Both `build` and `deploy` must succeed. The older built-in **pages build and deployment** success alone is not evidence of a Vite build.
4. Open the deployment URL after that workflow finishes. A successful build must have replaced `%BASE_URL%` and `/src/main.tsx` with actual project URLs and hashed assets.

The workflow file is ready locally. The agent has not changed remote Pages settings, committed, pushed or run it. These GitHub steps remain for the owner. No account token or API key belongs in frontend code.

After a deliberately approved deployment, inspect the published HTML: the module entry must be a built `/TOEIC990/assets/...js` URL, never `/src/main.tsx`. Confirm the JS/CSS, manifest, icons, photographs and worker return the correct files and content types. Then manually accept startup, practice and PWA updates in the browser. A green upload/deployment run alone does not verify the application.

Keep learner IndexedDB data. Changing a repository path on the same origin does not require renaming the database; clearing all site data is not the repair for this failure.

## Validation actually performed

Public HTTP HTML/script requests and workflow metadata were inspected. `npm run check` exited 0 during the preceding source repair. This follow-up checked the workflow syntax/format, pinned official action references, Linux dependency entries and the diff. No automated tests were created, modified or run. No production bundle, browser test, GitHub configuration write, commit, push or deployment was performed. The production pipeline and repaired live site remain unverified until a deliberately authorized build/publication.
