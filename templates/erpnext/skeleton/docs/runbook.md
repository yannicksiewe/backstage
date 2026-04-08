# Runbook - ERPNext ${{ values.name }}

All commands assume `kubectl` context is set to the cluster hosting `${{ values.name }}`.

## Identify the bench pod
```bash
NS=${{ values.name }}
POD=$(kubectl -n $NS get pod -l app.kubernetes.io/component=worker-default -o name | head -1)
```

## Restart the site
```bash
kubectl -n $NS rollout restart deploy -l app.kubernetes.io/instance=${{ values.name }}
```

## Reset administrator password
```bash
kubectl -n $NS exec -it $POD -- bench --site ${{ values.siteName }} set-admin-password
```
The new password must immediately be written back to Vault path
`${{ values.vaultPath }}` key `admin_password`.

## Manual backup (on-demand)
```bash
kubectl -n $NS exec -it $POD -- bench --site ${{ values.siteName }} backup --with-files
```
Backups land on the persistent volume; the scheduled job ships them off-cluster
every 6h with **${{ values.dataRetentionDays }}-day retention** (ISO 27001 A.8.13).

## Restore from backup
```bash
kubectl -n $NS exec -it $POD -- bench --site ${{ values.siteName }} \
  --force restore /home/frappe/frappe-bench/sites/${{ values.siteName }}/private/backups/<file>.sql.gz \
  --with-public-files <pub>.tar --with-private-files <priv>.tar
```

## Upgrade ERPNext
1. Bump `image.tag` in `helm/values.yaml`.
2. Open PR — CI runs `helm diff`.
3. Merge → ArgoCD syncs → `bench migrate` runs as a post-sync hook.
4. Verify: site loads, `bench --site ${{ values.siteName }} doctor` is clean.

## Logs
```bash
kubectl -n $NS logs -l app.kubernetes.io/instance=${{ values.name }} --tail=200 -f
```
Or via Loki: see "Logs (Loki)" link on the Backstage entity page.
