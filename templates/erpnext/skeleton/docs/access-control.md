# Access Control - ERPNext ${{ values.name }}

ISO 27001 **A.5.15 / A.5.18** - documented who can do what.

| Role | Identity source | Permissions |
|---|---|---|
| Owner team | `${{ values.owner }}` (Backstage Group / GitHub team) | Approve PRs, run deploy workflow, read secrets in Vault path |
| Platform admins | `platform-team` | Cluster-wide; break-glass only, audited |
| ERPNext System Manager | Frappe role inside the app | Full ERPNext admin |
| End users | SSO via Frappe OAuth (configure post-deploy) | Per-role inside ERPNext |

## Vault policy (example)
Path: `${{ values.vaultPath }}`
- `${{ values.owner }}` → `read`
- `platform-team` → `read, update` (rotation)
- All other → denied

## Quarterly access review (A.5.18)
1. Export GitHub team members → attach to `docs/reviews/<YYYY-Qn>.md`.
2. Export Frappe users: `bench --site ${{ values.siteName }} list-users`.
3. Owner signs off; commit the file. The PR is the audit trail.
