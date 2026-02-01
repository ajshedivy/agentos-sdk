# Releasing @worksofadam/agentos-sdk

This document describes the process for releasing new versions of the SDK.

## Overview

Releases are automated via GitHub Actions. When you push a version tag (e.g., `v0.1.0`), the publish workflow:

1. Checks out the code
2. Installs dependencies
3. Runs the full build
4. Validates the package (publint + attw)
5. Publishes to npm

### Local Setup

```bash
# Ensure you're on main branch and up to date
git checkout main
git pull origin main
```

## Release Process

### Step 1: Pre-release Checks

Run the full validation suite:

```bash
# Run all checks
npm run lint
npm run typecheck
npm test
npm run build
npm run validate
```

All checks must pass before proceeding.

### Step 2: Update Version

Update the version in `package.json`:

```bash
# For patch release (bug fixes): 0.1.0 → 0.1.1
npm version patch --no-git-tag-version

# For minor release (new features, backward compatible): 0.1.0 → 0.2.0
npm version minor --no-git-tag-version

# For major release (breaking changes): 0.1.0 → 1.0.0
npm version major --no-git-tag-version
```

Also update the version in `src/index.ts`:

```typescript
export const VERSION = "0.1.1"; // Update to match package.json
```

### Step 3: Update Changelog (Optional)

If you maintain a CHANGELOG.md, update it with the new version's changes.

### Step 4: Commit Version Bump

```bash
git add package.json package-lock.json src/client.ts
git commit -m "chore: bump version to X.Y.Z"
git push origin main
```

### Step 5: Create and Push Tag

```bash
# Create annotated tag
git tag -a vX.Y.Z -m "Release vX.Y.Z - Brief description"

# Push tag to trigger publish workflow
git push origin vX.Y.Z
```

### Step 6: Monitor Release

1. Go to: https://github.com/ajshedivy/agentos-sdk/actions
2. Watch the "Publish to npm" workflow
3. Verify all steps complete successfully

### Step 7: Verify on npm

```bash
# Check package info
npm view @worksofadam/agentos-sdk

# Verify specific version
npm view @worksofadam/agentos-sdk versions
```

Or visit: https://www.npmjs.com/package/@worksofadam/agentos-sdk

### Step 8: Create GitHub Release (Optional)

1. Go to: https://github.com/ajshedivy/agentos-sdk/releases
2. Click "Draft a new release"
3. Select the tag you just pushed
4. Add release notes
5. Publish release

## Versioning Guidelines

We follow [Semantic Versioning](https://semver.org/):

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Bug fixes, patches | PATCH | 0.1.0 → 0.1.1 |
| New features (backward compatible) | MINOR | 0.1.0 → 0.2.0 |
| Breaking changes | MAJOR | 0.1.0 → 1.0.0 |

### Pre-1.0.0 Versioning

While in 0.x.y versions:
- MINOR bumps may include breaking changes
- PATCH bumps should be backward compatible
- This allows rapid iteration before committing to stable API

## Troubleshooting

### Publish Failed: Authentication Error

- Verify `NPM_TOKEN` secret is set correctly
- Ensure token has publish permissions
- Check token hasn't expired

### Publish Failed: Version Already Exists

- npm doesn't allow republishing the same version
- Bump version and create a new tag

### Publish Failed: Validation Error

- Run `npm run validate` locally to see the issue
- Fix any publint or attw warnings before releasing

### Tag Already Exists

```bash
# Delete local tag
git tag -d vX.Y.Z

# Delete remote tag (if pushed)
git push origin :refs/tags/vX.Y.Z

# Recreate tag
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

## Quick Reference

```bash
# Full release flow (after version is updated)
npm run lint && npm run typecheck && npm test && npm run build && npm run validate
git add -A && git commit -m "chore: bump version to X.Y.Z"
git push origin main
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

## Related Files

- `.github/workflows/publish.yml` - Publish workflow
- `.github/workflows/ci.yml` - CI workflow (runs on PRs)
- `package.json` - Package configuration
- `src/client.ts` - Contains version constant
