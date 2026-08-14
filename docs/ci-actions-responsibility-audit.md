# GitHub Actions Responsibility Audit

## Exact baseline

- Audited base: `origin/main` at `e7daea9053a693a2c8d94f478e7b4c123605fc4e` on 2026-08-14.
- Repository-authored executable workflows before this change: 0.
- GitHub-managed workflows before this change: 1, `dynamic/pages/pages-build-deployment`.
- GitHub Pages source before this change: legacy branch publishing from `main` and `/`.
- Package manifests and lockfiles before this change: 0.
- Existing local verification owners before this change: 5 dependency-free Node scripts under `scripts/verify-*.js`.

## Workflow inventory before this change

| Workflow | Trigger | Paths | Jobs | Installs | Tests | External effect | Current responsibility |
| --- | --- | --- | ---: | ---: | --- | --- | --- |
| `dynamic/pages/pages-build-deployment` | GitHub-managed Pages event after `main` publication | Legacy Pages source: `/` | 3 observed checks (`build`, `report-build-status`, `deploy`) | GitHub-managed | Pages build | Publishes GitHub Pages | Existing production owner; unchanged by this CI-only change |

There were no old repository workflow files to move, no fixture or rehearsal workflow trigger to disable, and no audit that pins a workflow filename, workflow contents, or workflow SHA-256. Existing historical plans and specifications remain byte-unchanged.

## Repository-authored responsibilities after this change

| Workflow | Trigger | Paths | Jobs | Installs | Tests | External effect |
| --- | --- | --- | ---: | ---: | --- | --- |
| `PR validation` | `pull_request`: opened, synchronize, reopened, ready_for_review | No trigger filter; a fail-closed selector reads the exact base-to-head diff | 1 | 0 | Changed-file syntax ratchets and dependency-mapped existing verifiers | None; `contents: read`, no secrets |
| `Manual fixture validation` | `workflow_dispatch` only, with an allowlisted suite | N/A | 1 | 0 | Existing mock/runtime/design evidence verifiers | None; `contents: read`, no secrets |

The selector is the single owner for test selection. It uses exact 40-character base and head commit SHAs, the three-dot pull-request diff, NUL-delimited Git output, normalized repository-relative paths, and an explicit dependency map. Added, copied, modified, renamed, and deleted files are included. Unknown application/configuration changes fail toward the full local regression. Generic documentation and legacy fixture evidence do not start broad tests. `README.md` and the stage-map specification still run their lightweight existing contract owners because those verifiers read them directly.

JavaScript uses a changed-file-only `node --check` ratchet because this repository has no ESLint or package manager owner. Shell uses `bash -n`, JSON uses `JSON.parse`, YAML uses Psych syntax parsing, and inline HTML scripts use `vm.Script`. A lockfile-shaped change selects the full existing regression but does not invent an install step while the repository has no dependency manifest.

## Authority boundary

Both new workflows are validation-only. They pin the reviewed Node.js 24 checkout release and do not persist its credentials. They do not read secrets and contain no production, Pages, Cloudflare, Wrangler, VPS, SSH, database, environment mutation, notification, send, or deployment command. Fixture success proves only local contract conformity and does not grant publication or operational authority.

The GitHub-managed legacy Pages workflow is not stored in `.github/workflows/` and cannot be removed by reorganizing repository workflow files. Disabling or changing it requires a GitHub Pages setting change and would alter the existing public deployment owner, so this change leaves it untouched. Consequently, a merge to `main` may still create one GitHub-managed dynamic Pages run even though repository-authored push triggers are zero.
