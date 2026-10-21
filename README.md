# Bugbrief

A local-first bug ticket helper built with React, TypeScript, and Vite.

## Run locally

Use Node.js 22.12+ (or a newer supported Node.js version).

```sh
npm install
npm run dev
```

Open the local URL printed by Vite.

```sh
npm run test
npm run lint
npm run build
npm run preview
```

## Host on GitHub Pages

The [deployment workflow](.github/workflows/deploy-pages.yml) tests, lints, builds, and deploys this static app on every push to `main`. It can also be started manually from the repository's **Actions** tab.

1. In [repository settings](https://github.com/JamieAinsworth/bug-reporter/settings/pages), open **Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**. No `gh-pages` branch is needed.
3. Configure the authenticated package registry as described below.
4. Commit and push the deployment workflow and this documentation to `main`.
5. In **Actions**, open **Deploy to GitHub Pages** and wait for the build and deployment jobs to succeed.
6. Open **https://jamieainsworth.github.io/bug-reporter/**. The deployment job also displays the published URL.

GitHub Pages must be available for the repository under your GitHub plan. Actions must be enabled, and repository or organization policies must permit the actions used by the workflow. If prompted, approve deployment to the `github-pages` environment.

### Authenticated dependency registry

The dependency lockfile uses an authenticated registry. Keep its pinned package versions and integrity hashes; configure GitHub Actions to access that registry:

1. Open **Settings > Secrets and variables > Actions** in the repository.
2. Under **Variables**, add `NPM_REGISTRY_URL` with the registry URL used by your local installation, including its path and trailing slash. Run `npm config get registry` locally to find it. Do not include credentials in this URL.
3. Under **Secrets**, add `NPM_TOKEN` with a registry-issued token authorized to download these packages. Use read-only access and the minimum necessary scope. This is a package-registry credential, not a GitHub personal access token.
4. Make sure registry policy permits access from GitHub-hosted runners. If the registry requires an internal network or a different authentication scheme, the workflow needs a compatible runner or registry-specific setup.
5. After adding the variable and secret, run **Actions > Deploy to GitHub Pages > Run workflow** on `main`.

The workflow explicitly checks that both values exist and passes the token only to registry validation and dependency installation. It is not added to source files or Vite client variables. Never paste the token into a ticket, chat, or commit.

### Repository asset path

The workflow reads the base path from GitHub Pages and passes it to Vite when building, so assets resolve under `/bug-reporter/` rather than the domain root. Local development keeps Vite's normal root path. To check the repository-path build locally:

```sh
npm run build -- --base /bug-reporter/
npm run preview -- --base /bug-reporter/
```

Open the preview server's `/bug-reporter/` URL. GitHub Pages serves the compiled `dist` artifact over HTTPS; it does not run the Vite development server. Changes appear after the next successful deployment.

The hosted app retains the same in-memory-only draft behavior. Reports and selected file contents are not sent to GitHub by the application. GitHub still serves and logs ordinary website requests. A future Jira integration will require a separately hosted backend for OAuth secrets, sessions, and tokens; GitHub Pages cannot run that backend.

## Version 1

- Required summary (maximum 255 characters), environment, reproduction steps, expected result, actual result, frequency, and user impact.
- One reproduction step per line; existing numeric step prefixes are normalized on export.
- Explicit validation, including whitespace-only answers. Unknown frequency is an explicit choice, not an inferred value.
- Live completeness checklist and a review screen with an Edit details action that retains every answer.
- Plain-text Markdown copy and download, with escaped user content and explicit export errors.
- Optional file references. Only filenames are used; file contents are not read or uploaded. Add evidence files manually to your eventual ticket.
- Clear-draft confirmation.

Drafts exist only in the current tab's memory. Refreshing or closing the tab loses the draft. Download or copy before leaving. No application server, account, analytics, or browser storage is used. Avoid entering secrets or sensitive information.

## Jira scope

This version exports Markdown for manual use; it does **not** connect to Jira, submit issues, or claim Jira compatibility for project-specific fields. The integration label is a roadmap indicator, not a connection control.

The next phase needs a server-side Atlassian OAuth 2.0 (3LO) integration: secure per-user sessions and token storage, state-validated callbacks, refresh/revocation handling, site/project/issue-type discovery, dynamic create-field metadata and required-field validation, Atlassian Document Format conversion, issue creation, and separate evidence upload. Never put OAuth secrets or user tokens in Vite client environment variables. Jira's editor may require manual formatting when pasting Markdown; the downloaded file is standard Markdown, not Atlassian Document Format.
