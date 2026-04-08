# Cluster bootstrap for ERPNext (Path A)

One-time install of the operators the ERPNext template depends on.
Run **in order**. Each step is idempotent (`helm upgrade --install`).

Target context: `admin@k8s-platform`

```bash
export KUBECONFIG_CTX=admin@k8s-platform
alias k="kubectl --context=$KUBECONFIG_CTX"
alias h="helm --kube-context=$KUBECONFIG_CTX"
```

## 0. Helm repos
```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo add external-secrets https://charts.external-secrets.io
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

## 1. ArgoCD
```bash
h upgrade --install argocd argo/argo-cd \
  -n argocd --create-namespace \
  -f 01-argocd-values.yaml
```
Get initial admin password:
```bash
k -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath='{.data.password}' | base64 -d; echo
```

## 2. Vault (dev/homelab mode — single replica, file storage)
```bash
h upgrade --install vault hashicorp/vault \
  -n vault --create-namespace \
  -f 02-vault-values.yaml
```
Initialize + unseal (one time):
```bash
k -n vault exec vault-0 -- vault operator init -key-shares=1 -key-threshold=1 \
  -format=json > vault-init.json
chmod 600 vault-init.json     # KEEP THIS FILE SAFE — contains root token + unseal key
UNSEAL=$(jq -r '.unseal_keys_b64[0]' vault-init.json)
ROOT=$(jq -r '.root_token'           vault-init.json)
k -n vault exec vault-0 -- vault operator unseal "$UNSEAL"
```
Enable KV v2 + a policy + a Kubernetes auth role:
```bash
k -n vault exec vault-0 -- sh -c "
  export VAULT_TOKEN=$ROOT
  vault secrets enable -path=kv -version=2 kv || true
  vault auth enable kubernetes || true
  vault write auth/kubernetes/config \
    kubernetes_host=https://kubernetes.default.svc:443
  vault policy write erpnext-read - <<EOF
path \"kv/data/erpnext/*\" { capabilities = [\"read\"] }
EOF
  vault write auth/kubernetes/role/erpnext \
    bound_service_account_names=external-secrets \
    bound_service_account_namespaces=external-secrets \
    policies=erpnext-read ttl=1h
"
```

## 3. External Secrets Operator
```bash
h upgrade --install external-secrets external-secrets/external-secrets \
  -n external-secrets --create-namespace \
  --set installCRDs=true
```
Create the `ClusterSecretStore` pointing at Vault:
```bash
k apply -f 03-clustersecretstore.yaml
k get clustersecretstore vault-backend     # should show STATUS=Valid
```

## 4. kube-prometheus-stack (Prometheus + Grafana + Alertmanager)
```bash
h upgrade --install kps prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  -f 04-kps-values.yaml
```

## 5. Promtail → Loki (you said Alloy+Promtail; minimal Loki for log links)
```bash
h upgrade --install loki grafana/loki -n monitoring -f 05-loki-values.yaml
h upgrade --install promtail grafana/promtail -n monitoring \
  --set "config.clients[0].url=http://loki:3100/loki/api/v1/push"
```

## 6. Fix the broken Let's Encrypt ClusterIssuer
`letsencrypt-production` is currently `READY=False`. Check why:
```bash
k describe clusterissuer letsencrypt-production
```
Most common cause in homelab: ACME HTTP-01 can't reach you from the internet.
Use DNS-01 or stick with `selfsigned-issuer` for `dev`. The ERPNext template
defaults to whatever your ingress controller picks; explicitly set
`cert-manager.io/cluster-issuer: selfsigned-issuer` for dev.

## 7. Verify before deploying ERPNext
```bash
./preflight.sh
```

## 8. Seed the ERPNext Vault path
For each instance you'll create from Backstage:
```bash
INSTANCE=erpnext-acme
k -n vault exec vault-0 -- sh -c "
  export VAULT_TOKEN=$ROOT
  vault kv put kv/erpnext/dev/$INSTANCE \
    admin_password='$(openssl rand -base64 24)' \
    db_root_password='$(openssl rand -base64 24)' \
    encryption_key='$(openssl rand -base64 32)'
"
```
Now you can click **Create → Deploy ERPNext** in Backstage.
