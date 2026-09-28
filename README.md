# GitHub Repository Explorer

A responsive React and TypeScript interface for exploring a GitHub user's public repositories. Search by username, browse repository cards, and move through paginated results using GitHub's public REST API.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Getting started

Install dependencies and start the local development server:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, then enter a GitHub username such as `octocat`.

## Verification

Run the automated tests:

```bash
npm test
```

Create a production build:

```bash
npm run build
```

The app uses GitHub's unauthenticated public API. GitHub rate limits can affect requests, especially when making many searches in a short period.
