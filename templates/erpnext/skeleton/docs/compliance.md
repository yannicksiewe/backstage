# ISO 27001 Control Mapping - ERPNext ${{ values.name }}

This page is the **single source of truth** for how this instance satisfies
each Annex A control. Auditors should be linked here directly from Backstage.

| Control | How this deployment satisfies it | Evidence |
|---|---|---|
| **A.5.9** Inventory of assets | Backstage catalog entry (this repo's `catalog-info.yaml`) | Backstage UI |
| **A.5.2** Information security roles | `spec.owner` = `${{ values.owner }}`, enforced by CODEOWNERS | `catalog-info.yaml`, `.github/CODEOWNERS` |
| **A.5.12** Classification of information | `data-classification: ${{ values.dataClassification }}` annotation | `catalog-info.yaml` |
| **A.5.15** Access control | RBAC via Backstage Group + GitHub team + k8s RoleBindings | `manifests/rbac.yaml` (TBD) |
| **A.5.24-28** Incident management | `docs/incident-response.md` | TechDocs |
| **A.5.37** Documented operating procedures | `docs/runbook.md` | TechDocs |
| **A.8.9** Configuration management | All config in git, ArgoCD reconciles, no manual `kubectl` | `argocd/application.yaml` |
| **A.8.13** Information backup | Helm `jobs.backup` enabled, retention `${{ values.dataRetentionDays }}` days | `helm/values.yaml` |
| **A.8.15** Logging | Promtail → Loki, retained centrally | Grafana link on entity |
| **A.8.16** Monitoring | Prometheus + Alloy scraping ERPNext exporter | Grafana dashboard |
| **A.8.24** Use of cryptography | Secrets in Vault, TLS via cert-manager, encryption_key from Vault | `manifests/externalsecret.yaml` |
| **A.8.32** Change management | All changes via PR + required review (CODEOWNERS) + ArgoCD audit log | GitHub PR history |

## Data inventory
- **PII present:** ${{ values.containsPII }}
- **Categories:** employee records, customer contact info, invoices
- **Lawful basis:** contract performance + legal obligation (accounting)
- **Retention:** application data per business policy; backups **${{ values.dataRetentionDays }} days**

## Review cadence
This entry must be reviewed every **6 months**. Update the
`compliance.iso27001/last-reviewed` annotation in `catalog-info.yaml`.
The weekly drift workflow will fail if it falls behind.
