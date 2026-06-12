# Release Process

Releases are automated through `.github/workflows/release.yaml`.

## Trigger

Push to the `release` branch.

## Versioning

The `get-version` job uses `wemogy/get-release-version-action` in semantic mode. It creates a version tag with the `v` prefix and exposes the calculated version to later jobs.

## Package Release

The `release` job:

1. Checks out the repository.
2. Sets up Node and pnpm through `.github/actions/setup-node`.
3. Updates workspace package versions with `pnpm -r exec pnpm version`.
4. Builds the repository with `pnpm build`.
5. Publishes workspace packages with `pnpm publish -r --no-git-checks`.
6. Creates a GitHub release using the generated tag.

Publishing uses `GITHUB_TOKEN` for GitHub Packages.

## Container Release

The `docker-build` job delegates image build and push to `.github/actions/containers`.

The current workflow references an `apps/idp-backend` Dockerfile path. Confirm that path exists before relying on the container job for a release.

## Pull Request Checks

`.github/workflows/pr-code-style.yaml` runs on pull requests targeting `main`:

- Prettier check.
- ESLint check.
- TypeScript typecheck.
- Tests.
