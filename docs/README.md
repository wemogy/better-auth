# Documentation

This directory is the source of truth for repository documentation that should live in Git.

## Structure

- `wiki/` contains Markdown pages that are published to the GitHub Wiki.
- File names become wiki page names. For example, `wiki/Home.md` is the wiki landing page and `wiki/Getting-Started.md` becomes `Getting Started`.
- Keep wiki links extensionless, for example `[Getting Started](Getting-Started)`.

## GitHub Wiki Sync

The workflow in `.github/workflows/sync-wiki.yaml` syncs `docs/wiki` to the repository wiki:

- Triggered automatically when changes to `docs/wiki/**` land on `main`.
- Can be run manually with `workflow_dispatch`.
- Deletes wiki files that no longer exist in `docs/wiki`, because the sync uses `rsync --delete`.

Before the first run, enable the GitHub Wiki in repository settings and create one initial page in the GitHub UI. GitHub only exposes `<owner>/<repo>.wiki.git` after the wiki has been initialized.

## Editing Guidelines

- Put durable, user-facing documentation in `docs/wiki`.
- Keep implementation details tied to the current source. If adapter behavior changes, update the matching wiki page in the same pull request.
- Prefer concise examples that can be copied into a Better Auth server config.
- Do not document secrets with real values. Use placeholders for Cosmos DB keys and endpoints.
