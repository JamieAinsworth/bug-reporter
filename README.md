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
