# Contributing to Shelf

Thanks for helping make Shelf better. Bug reports, focused feature proposals, documentation improvements, and code contributions are all welcome.

## Before you start

- Search existing issues before opening a new one.
- Open an issue before investing in a large feature or architectural change so the direction can be discussed early.
- Keep changes focused. A small pull request with a clear removal boundary is easier to review and maintain.

## Local setup

Shelf uses pnpm and WXT.

```bash
git clone https://github.com/<your-username>/Shelf.git
cd Shelf
corepack enable
pnpm install
pnpm dev
```

Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `.output/chrome-mv3-dev`.

## Checks

Run these before opening a pull request:

```bash
pnpm compile
pnpm test
pnpm build
```

Add tests for domain logic and regressions that can be expressed without a browser. For visual layout and browser-only interactions, describe the manual verification you performed in the pull request instead of adding brittle rendering tests.

## Pull requests

- Explain the user-facing problem and the chosen solution.
- Keep unrelated refactors out of the same change.
- Include screenshots or a short recording for visible interface changes.
- Call out permission or storage-format changes explicitly.
- Update the README when commands, architecture, permissions, or user-visible behavior change.

By contributing, you agree that your contributions will be licensed under the MIT License.
