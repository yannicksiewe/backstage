# ERPNext - ${{ values.name }}

| Field | Value |
|---|---|
| Site | https://${{ values.siteName }} |
| Environment | ${{ values.environment }} |
| Owner | ${{ values.owner }} |
| Frappe version | ${{ values.frappeVersion }} |
| Data classification | ${{ values.dataClassification }} |
| Criticality | ${{ values.criticality }} |
| Contains PII | ${{ values.containsPII }} |
| Backup retention | ${{ values.dataRetentionDays }} days |
| Vault path | `${{ values.vaultPath }}` |

This instance is provisioned via the Backstage `erpnext-deployment` template
and reconciled by ArgoCD from this repository.

See the [runbook](runbook.md) for day-2 operations and
[compliance](compliance.md) for ISO 27001 control mapping.
