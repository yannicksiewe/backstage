# Incident Response - ERPNext ${{ values.name }}

Maps to ISO 27001 **A.5.24 - A.5.28** (information security incident management).

## Severity matrix
| Sev | Definition | Response time |
|-----|------------|---------------|
| SEV1 | Site down, data loss, confirmed breach | 15 min |
| SEV2 | Degraded (login fails, slow >10s) | 1 h |
| SEV3 | Single feature broken, no data risk | next business day |

## First responder checklist
1. Acknowledge in PagerDuty / on-call channel.
2. Open incident channel `#inc-${{ values.name }}-<date>`.
3. Snapshot: `kubectl -n ${{ values.name }} get all,events`.
4. Check Grafana dashboard linked from Backstage entity.
5. If suspected data exposure → escalate to DPO immediately (do not restart).
6. Apply mitigation from runbook.
7. Post-mortem within 5 working days; attach to this repo as `docs/postmortems/<date>.md`.

## Evidence preservation
For any SEV1 with suspected breach:
- `kubectl -n ${{ values.name }} cp $POD:/home/frappe/frappe-bench/sites/${{ values.siteName }}/logs ./evidence/`
- Snapshot the MariaDB PVC before any restart.
- Hand off to security team; do not delete for **${{ values.dataRetentionDays }} days minimum**.
