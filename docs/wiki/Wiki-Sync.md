# Wiki Sync

The GitHub Wiki is generated from `docs/wiki`.

## Workflow

`.github/workflows/sync-wiki.yaml` runs when:

- A push to `main` changes `docs/wiki/**`.
- The workflow is started manually through `workflow_dispatch`.

## What It Does

1. Checks out the repository.
2. Configures the GitHub Actions bot as the Git author.
3. Clones `<owner>/<repo>.wiki.git`.
4. Copies `docs/wiki/` into the wiki repository with `rsync --delete`.
5. Commits and pushes only when files changed.

## First-Time Setup

GitHub does not create the wiki Git repository until the wiki is initialized.

Before the first sync:

1. Enable Wiki in the repository settings.
2. Create one initial page through the GitHub Wiki UI.
3. Run the `Sync docs to GitHub Wiki` workflow manually or push a docs change to `main`.

## Naming Rules

- `Home.md` becomes the wiki landing page.
- Use hyphenated file names for page titles, for example `Adapter-Configuration.md`.
- Link to pages without `.md`, for example `[Adapter Configuration](Adapter-Configuration)`.

## Deleting Pages

The sync deletes wiki pages that are removed from `docs/wiki`. This keeps the wiki identical to the repository docs and prevents stale pages from staying published.
