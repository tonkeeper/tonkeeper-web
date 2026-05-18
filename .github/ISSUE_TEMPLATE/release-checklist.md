---
name: Release Checklist
about: Tracks QA sign-off, build verification, and package distribution for a release
title: 'Release v[VERSION]'
labels: release
assignees: ''
---

> **Docs:** [Release Process](../../CONTRIBUTING.md#release-process)
> **Pre-release:** `v[VERSION]-rc.1` · **Release:** `v[VERSION]`
> **GitHub release:** https://github.com/tonkeeper/tonkeeper-web/releases/tag/v[VERSION]

---

## Phase 1 — Pre-release

### Build Verification

**Web**
- [ ] Demo deploys successfully

**Desktop** — download from GitHub pre-release
- [ ] macOS Intel
- [ ] macOS ARM
- [ ] macOS Universal
- [ ] Windows
- [ ] Linux Intel
- [ ] Linux ARM

**Browser Extension** — download from GitHub pre-release
- [ ] Chrome extension installs and works
- [ ] Firefox extension installs and works

**iPad**
- [ ] Build available on TestFlight
- [ ] Smoke test on TestFlight

### QA Sign-off

**Tasks included in this release**
<!-- List tickets/PRs below. QA checks each one. -->
- [ ] <!-- task / PR link -->
- [ ] <!-- task / PR link -->
- [ ] <!-- task / PR link -->

**Testing**
- [ ] Regression testing completed

---

## Phase 2 — Release

### Release Build

- [ ] Release tag pushed (`v[VERSION]`)
- [ ] Release workflow completed successfully
- [ ] Web production deployed: https://wallet.tonkeeper.com
- [ ] GitHub release published and marked as latest

### Package Distribution

**Automated — verify after release workflow**
- [ ] Desktop auto-update available (existing installs receive the update)

**Chrome Web Store** — manual submission, review takes 1–7 days
- [ ] `tonkeeper_chrome_v[VERSION].zip` uploaded to Chrome Web Store
- [ ] Submitted for review
- [ ] Approved and live

**Firefox Add-ons** — manual submission, review takes 1–7 days
- [ ] `tonkeeper_firefox_v[VERSION].zip` uploaded to Firefox Add-ons
- [ ] Submitted for review
- [ ] Approved and live

**App Store (iPad)** — manual submission, Apple review takes 1–3 days
- [ ] Build submitted to App Store Connect
- [ ] Submitted for review
- [ ] Approved and live

---

## Post-release

- [ ] All store submissions approved and live
- [ ] Team notified
