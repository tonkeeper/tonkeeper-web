# Contributing to Tonkeeper Web

This document describes the development workflow and conventions used in this project.

## Branch Naming

```
feature/<description>     — new features
fix/<description>         — bug fixes
hotfix/<description>      — urgent production fixes
```

**Examples:**
- `feature/wallet-connect-v2`
- `fix/transaction-signing`
- `fix/PRO-123-popup-issue`
- `hotfix/critical-security-patch`

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>
```

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `chore` — maintenance (dependencies, release, etc.)
- `refactor` — code refactoring
- `docs` — documentation changes

**Scopes (optional):**
`desktop`, `extension`, `web`, `core`, `uikit`, `locales`, `mobile`, `twa`

**Examples:**
```
feat(extension): add Firefox manifest v3 support
fix(desktop): resolve crash on large NFT collections
fix(PRO-123): transaction signing error
chore: update dependencies
chore: release 4.3.4
```

## Development Workflow

### 1. Create a branch

```bash
git checkout main
git pull origin main
git checkout -b feature/my-feature
```

### 2. Make changes and commit

```bash
git add .
git commit -m "feat: add new feature"
```

### 3. Push and create a Pull Request

```bash
git push origin feature/my-feature
gh pr create --base main
```

Or create PR via GitHub UI.

### 4. CI Checks

When you open a PR, the following builds run automatically:
- Desktop (Linux, Windows, macOS)
- Web (preview deployment)
- Extension (Chrome, Firefox)
- iPad

### 5. Code Review and Merge

After approval, the PR is merged into `main` using merge commit.

## Release Process

The git tag is the single source of truth for versioning — no manual `package.json` bumps needed.

| Workflow | Trigger | What it does |
|---|---|---|
| **Pre-release** | `v*-*` tag (e.g. `v4.6.0-rc.1`) | Builds all packages, deploys demo to `rc`, publishes GitHub pre-release |
| **Release** | `v*` tag (e.g. `v4.6.0`) | Builds all packages, deploys to production, publishes GitHub release as latest |

### Tag convention

```
vMAJOR.MINOR.PATCH          # stable release
vMAJOR.MINOR.PATCH-rc.N     # release candidate
```

### Step-by-step

**1. Pre-release**

```bash
git tag v4.6.0-rc.1
git push origin v4.6.0-rc.1
```

**2. Release**

```bash
git tag v4.6.0
git push origin v4.6.0
```

Deploys web to production and publishes the GitHub release as latest. Desktop auto-update is available immediately.

**3. Manual store submissions**

| Package | Channel |
|---|---|
| Extension | Upload zip from GitHub release to Chrome Web Store and Firefox Add-ons |
| iPad | Submit TestFlight build to App Store via App Store Connect |

Both extension stores and the App Store require review (1–7 days for extensions, 1–3 days for App Store).

### Manual trigger

Both workflows support `workflow_dispatch` — useful for testing or re-running a failed build.

```bash
gh workflow run pre-release.yaml --ref main --field tag=v4.6.0-rc.1
gh workflow run release.yaml --ref main --field tag=v4.6.0
```

## Versioning

We use [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

- **PATCH** — bug fixes (4.3.4 → 4.3.5)
- **MINOR** — new features, backward compatible (4.3.4 → 4.4.0)
- **MAJOR** — breaking changes (4.3.4 → 5.0.0)

All apps (web, desktop, extension) share the same version number.

## Project Structure

```
tonkeeper-web/
├── apps/
│   ├── desktop/      — Electron desktop app
│   ├── extension/    — Browser extension (Chrome, Firefox)
│   ├── web/          — Web application
│   ├── mobile/       — Mobile/iPad app (Capacitor)
│   └── twa/          — Telegram Web App
├── packages/
│   ├── core/         — Core business logic
│   ├── uikit/        — UI components
│   └── locales/      — Translations
└── .github/
    └── workflows/    — CI/CD pipelines
```

## Useful Commands

```bash
# Install dependencies
yarn install

# Build all packages
yarn build:pkg

# Run web app locally
yarn start:web

# Build for production
yarn build:web
yarn build:desktop
yarn build:extension
```
