# GitHub Pages: blank-page repair

26 October 2026. Investigation and local source repair only. No commit, push, workflow execution, deployment, browser runtime test or production build was performed in this task.

## Verified cause

- `https://xuandang2604.github.io/TOEIC990/` returned HTTP 200, but its HTML still contained `<script type="module" src="/src/main.tsx">` and an otherwise empty React root. This is the repository's source entry, not Vite's built output.
- The script URL actually requested by that HTML, `https://xuandang2604.github.io/src/main.tsx`, returned **404**. The file under `/TOEIC990/src/main.tsx` returned **200, application/octet-stream**. Publishing the TSX source at a different URL would still not compile it for browsers.
- The latest public run [pages build and deployment](https://github.com/xuandang2604/TOEIC990/actions/runs/40303968255) reported success for commit `a7f6bd9daf05ebe4379e6b5f4d8b1c4fcd710e4a`. The raw source HTML proves that this successful Pages publication did not publish the required Vite artifact.
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

Vite's [GitHub Pages guide](https://vite.dev/guide/static-deploy.html#github-pages) requires building the app and publishing `dist`, with the project base path. In the canonical repository choose **Settings → Pages → Build and deployment → Source: GitHub Actions**, once the intended workflow is approved and added. See [GitHub's publishing-source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

The draft below reads `base_path` from GitHub's [configure-pages action](https://github.com/actions/configure-pages/blob/main/action.yml); this avoids hardcoding the old repository spelling and also supports a root/custom-domain site. It uploads only the built site, excluding source and the development Content Studio.

## Reviewable workflow proposal, not installed

Automatic approval review rejected adding an active push-triggered deployment workflow because of the existing no-deployment/hosting instructions. There is no active workflow added by this repair. The narrower proposal below runs **only when the owner chooses Run workflow**; it still requires explicit approval before being placed at `.github/workflows/pages.yml`.

```yaml
name: Publish STUDY 990 to Pages

on:
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: read
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7
        with:
          node-version: '24'
          cache: npm
      - uses: actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6
        id: pages
      - run: npm ci
      - run: npm run build
        env:
          STUDY990_BASE_PATH: ${{ steps.pages.outputs.base_path }}/
      - run: npm run audit:build
      - uses: actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346 # v5
        id: deployment
```

After approval, adding the workflow alone will not publish this proposal: its only trigger is `workflow_dispatch`. Commit/push and actually running it remain separate actions. No account token or API key belongs in frontend code.

After a deliberately approved deployment, inspect the published HTML: the module entry must be a built `/TOEIC990/assets/...js` URL, never `/src/main.tsx`. Confirm the JS/CSS, manifest, icons, photographs and worker return the correct files and content types. Then manually accept startup, practice and PWA updates in the browser. A green upload/deployment run alone does not verify the application.

Keep learner IndexedDB data. Changing a repository path on the same origin does not require renaming the database; clearing all site data is not the repair for this failure.

## Validation actually performed

Public HTTP HTML/script requests and workflow metadata were inspected. `npm run check` exited 0 after the repair. Changed code/configuration files were formatted, and the diff was reviewed for scope and asset consumers. No automated tests were created, modified or run. No production bundle, browser test, GitHub configuration write, commit, push or deployment was performed. The production pipeline and repaired live site remain unverified until a deliberately authorized build/publication.
