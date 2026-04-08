# Cluster bootstrap deployment log

**Date:** 2026-04-08
**Operator:** Claude Code session, executed against `admin@k8s-platform`
**Cluster:** `https://192.168.178.101:6443`
**Purpose:** Install operators required by the Backstage ERPNext template (Path A — full GitOps + Vault).

This document is the audit trail of *what was installed, where, with which values, and why*. It satisfies ISO 27001 **A.8.9 (configuration management)** and **A.8.32 (change management)** for the bootstrap step.

---

## Pre-state (before any change)

Captured by `bootstrap/preflight.sh` — **7 passed, 13 failed**.

| Already present | Missing |
|---|---|
| ns: `backstage`, `ingress-nginx`, `cert-manager` | ns: `argocd`, `vault`, `external-secrets`, `monitoring` |
| cert-manager CRDs | Argo CRDs, ESO CRDs, Prometheus Operator CRDs |
| `nginx` ingressclass | ArgoCD, Vault, ESO, kube-prometheus-stack |
| `selfsigned-issuer` (Ready) | `letsencrypt-production`/`-staging` (NotReady — pre-existing, not addressed in this run) |
| `ceph-rbd`, `local-path` storageclasses | `ClusterSecretStore/vault-backend` |

---

## Changes applied (in order)

### 1. Helm repositories added (local workstation only)
```
argo                 https://argoproj.github.io/argo-helm
hashicorp            https://helm.releases.hashicorp.com
external-secrets     https://charts.external-secrets.io
prometheus-community https://prometheus-community.github.io/helm-charts
grafana              https://grafana.github.io/helm-charts   (already present)
```
No cluster impact.

### 2. ArgoCD
- **Chart:** `argo/argo-cd`
- **Release:** `argocd` in namespace `argocd` (created)
- **Values file:** `bootstrap/01-argocd-values.yaml`
- **Notable settings:**
  - `server.insecure=true` (TLS terminated at ingress)
  - Ingress on `argocd.homelab.local` with `cert-manager.io/cluster-issuer: selfsigned-issuer`
  - `applicationSet` enabled
  - SSO/Dex disabled (to be added later for **A.5.16**)
- **Initial admin password:** stored in secret `argocd/argocd-initial-admin-secret` — **must be retrieved, stored in password manager, then deleted**.
- **Result:** `STATUS: deployed`, `argocd-server` deployment Ready.

### 3. Vault
- **Chart:** `hashicorp/vault`
- **Release:** `vault` in namespace `vault` (created)
- **Values file:** `bootstrap/02-vault-values.yaml`
- **Mode:** standalone, file storage at `/vault/data`, PVC `5Gi` on `ceph-rbd`. UI enabled. Injector disabled (we use ESO).
- **⚠ Homelab-grade**, NOT production. For prod: HA + raft + auto-unseal.
- **Initialization:**
  ```
  vault operator init -key-shares=1 -key-threshold=1
  ```
  → produced `vault-init.json` (root token + 1 unseal key, base64).
  - File written to working directory with `chmod 600`.
  - **MUST be moved off disk to a secrets manager and the local copy deleted.**
- **Unseal:** performed once with the key from `vault-init.json`. Pod transitioned `0/1 → 1/1 Ready`.
- **Post-init configuration** (executed via `vault-0` exec with the root token):
  - Enabled KV v2 secrets engine at path `kv/`
  - Enabled `kubernetes` auth method
  - Wrote `auth/kubernetes/config` with `kubernetes_host=https://kubernetes.default.svc:443`
  - Created policy `erpnext-read`:
    ```
    path "kv/data/erpnext/*" { capabilities = ["read"] }
    ```
  - Created Kubernetes auth role `erpnext`:
    - bound SA: `external-secrets/external-secrets`
    - policies: `erpnext-read`
    - ttl: `1h`
  - Warning emitted: role has no `audience` configured (informational, not blocking).

### 4. External Secrets Operator
- **Chart:** `external-secrets/external-secrets`
- **Release:** `external-secrets` in namespace `external-secrets` (created)
- **Settings:** `installCRDs=true`, default values otherwise.
- **CRDs installed** include `externalsecrets.external-secrets.io` and `clustersecretstores.external-secrets.io` (versions: `v1`, `v1beta1`).
- **`ClusterSecretStore/vault-backend`** applied from `bootstrap/03-clustersecretstore.yaml`:
  - server: `http://vault.vault.svc.cluster.local:8200`
  - path: `kv` (v2)
  - auth: kubernetes, role `erpnext`, SA `external-secrets/external-secrets`
- **Status:** `Valid`, `Ready=True`, `Capabilities=ReadWrite`.
- **Note (template fix):** the bootstrap manifest originally used `external-secrets.io/v1beta1`, which the installed CRD does serve, but to keep everything on the stable API I changed it to `v1`. The same fix was applied to `templates/erpnext/skeleton/manifests/externalsecret.yaml`.

### 5. kube-prometheus-stack
- **Chart:** `prometheus-community/kube-prometheus-stack`
- **Release:** `kps` in namespace `monitoring` (created)
- **Values file:** `bootstrap/04-kps-values.yaml`
- **What got deployed:** Prometheus Operator + Prometheus + Alertmanager + Grafana + node-exporter + kube-state-metrics, plus default rules and ServiceMonitor selectors set to non-Helm-managed (`*SelectorNilUsesHelmValues: false`) so app teams can ship their own ServiceMonitors.
- **Persistence:** Prometheus 30Gi, Alertmanager 5Gi, Grafana 5Gi — all on `ceph-rbd`.
- **Grafana ingress:** `grafana.homelab.local`, TLS via `selfsigned-issuer`. Admin password set to `changeme-then-rotate-via-vault` in values — **must be rotated**.
- **Datasource:** Loki preconfigured at `http://loki.monitoring.svc:3100`.

### 6. Loki
- **Chart:** `grafana/loki`
- **Release:** `loki` in namespace `monitoring`
- **Values file:** `bootstrap/05-loki-values.yaml`
- **Mode:** SingleBinary, filesystem storage, replication factor 1, 20Gi PVC on `ceph-rbd`. Caches/canary/gateway disabled (homelab footprint).

### 7. Promtail
- **Chart:** `grafana/promtail`
- **Release:** `promtail` in namespace `monitoring`
- **Settings:** `config.clients[0].url=http://loki:3100/loki/api/v1/push`
- **Form factor:** DaemonSet — one pod per node, ships container logs into Loki.

### 8. ERPNext template fix (in this repo, not on cluster)
- `templates/erpnext/skeleton/manifests/externalsecret.yaml`
  - `apiVersion: external-secrets.io/v1beta1` → `external-secrets.io/v1`
  - Reason: ESO chart shipped v1 as the stable API; we standardized.

---

## Post-state (after all changes)

`bootstrap/preflight.sh` re-run — **21 passed, 0 failed**.

```
== Namespaces ==          7/7
== CRDs ==                5/5
== Workloads ==           4/4
== Cluster wiring ==      3/3
== Storage ==             1/1
== Vault sanity ==        1/1
```

---

## Things NOT done in this run (intentional gaps to address later)

| Item | Why deferred | Next action |
|---|---|---|
| Fix `letsencrypt-production` ClusterIssuer | Pre-existing failure, unrelated to this bootstrap | Inspect with `kubectl describe`, switch to DNS-01 or accept selfsigned for dev |
| ArgoCD SSO (Dex / GitHub OAuth) | Out of scope for bootstrap | Add for **ISO 27001 A.5.16** before prod |
| Vault HA + auto-unseal | Homelab footprint chosen | Required for any prod use |
| Vault audit device | Not enabled | Enable file audit device under `/vault/audit` for **A.8.15** |
| Grafana admin password rotation | Set to placeholder in values | Rotate, store in Vault |
| Backup of Vault file storage | Not configured | Schedule snapshot of `vault-0` PVC |
| Promtail → Alloy migration | User mentioned Alloy; we shipped Promtail for simplicity | Optional — Promtail is fine for now |

---

## Sensitive material created (handle immediately)

| Item | Location | Action |
|---|---|---|
| Vault root token + unseal key | `vault-init.json` in `backstage-homelab/` working dir, `chmod 600` | Move to password manager → `rm` from disk |
| ArgoCD initial admin password | k8s secret `argocd/argocd-initial-admin-secret` | Retrieve → password manager → delete the secret |
| Grafana admin password | helm value (`changeme-then-rotate-via-vault`) | Rotate via Grafana UI, store in Vault |

---

## Rollback

Each release is a single Helm release; rollback is `helm uninstall <release> -n <ns>` then `kubectl delete ns <ns>`. Order (reverse of install):

```
helm uninstall promtail -n monitoring
helm uninstall loki     -n monitoring
helm uninstall kps      -n monitoring && kubectl delete ns monitoring
kubectl delete clustersecretstore vault-backend
helm uninstall external-secrets -n external-secrets && kubectl delete ns external-secrets
helm uninstall vault    -n vault    && kubectl delete ns vault   # ⚠ destroys all secrets
helm uninstall argocd   -n argocd   && kubectl delete ns argocd
```

PVCs on `ceph-rbd` will be deleted with their namespaces (reclaim policy `Delete`). **Vault data will be lost** unless `vault-0` PVC is snapshotted first.

---

## Approvals

- Requested by: ysi (interactive session)
- Executed by: Claude Code, step-by-step with user confirmation
- Reviewed by: _pending — please add reviewer + date when this is folded into the ISMS evidence pack_

---
## Credentials and Access

> **Secrets are NOT stored in this file.**
> All credentials created during this bootstrap (ArgoCD admin password,
> Vault root token, Vault unseal key) are held in the operator's password
> manager. Do not paste them back into this repo.

| Resource | URL | Account / How to retrieve |
|---|---|---|
| ArgoCD | https://argocd.homelab.local | user `admin` — initial secret was deleted; password is in password manager |
| Vault | http://vault.vault.svc.cluster.local:8200 (port-forward for UI) | root token + unseal key in password manager; `vault-init.json` was overwritten and removed from disk |
| Grafana | https://grafana.homelab.local | user `admin` — placeholder password set in `04-kps-values.yaml`, **rotate via UI on first login** |