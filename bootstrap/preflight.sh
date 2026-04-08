#!/usr/bin/env bash
## Pre-flight check for the ERPNext Backstage template.
## Read-only — does not modify the cluster.
set -u
CTX="${KUBECONFIG_CTX:-admin@k8s-platform}"
K="kubectl --context=$CTX"
PASS=0; FAIL=0
ok()   { echo "  ✅ $1"; PASS=$((PASS+1)); }
bad()  { echo "  ❌ $1"; FAIL=$((FAIL+1)); }

check_ns()  { $K get ns "$1" >/dev/null 2>&1 && ok "namespace $1" || bad "namespace $1 missing"; }
check_crd() { $K get crd "$1" >/dev/null 2>&1 && ok "CRD $1" || bad "CRD $1 missing"; }
check_dep() { $K -n "$1" get deploy "$2" >/dev/null 2>&1 && ok "$1/$2 deployment" || bad "$1/$2 deployment missing"; }

echo "== Namespaces =="
for ns in argocd vault external-secrets monitoring backstage ingress-nginx cert-manager; do check_ns "$ns"; done

echo; echo "== CRDs =="
check_crd applications.argoproj.io
check_crd externalsecrets.external-secrets.io
check_crd clustersecretstores.external-secrets.io
check_crd clusterissuers.cert-manager.io
check_crd servicemonitors.monitoring.coreos.com

echo; echo "== Workloads =="
check_dep argocd argocd-server
check_dep external-secrets external-secrets
$K -n vault get pod vault-0 >/dev/null 2>&1 && ok "vault/vault-0 pod" || bad "vault/vault-0 pod missing"
check_dep monitoring kps-grafana

echo; echo "== Cluster wiring =="
$K get ingressclass nginx >/dev/null 2>&1 && ok "ingressclass nginx" || bad "ingressclass nginx missing"
$K get clustersecretstore vault-backend >/dev/null 2>&1 && ok "ClusterSecretStore vault-backend" || bad "ClusterSecretStore vault-backend missing"
ISSUER_OK=$($K get clusterissuer -o jsonpath='{range .items[?(@.status.conditions[0].status=="True")]}{.metadata.name}{"\n"}{end}' 2>/dev/null)
[ -n "$ISSUER_OK" ] && ok "working ClusterIssuer(s): $(echo $ISSUER_OK | tr '\n' ' ')" || bad "no Ready ClusterIssuer"

echo; echo "== Storage =="
$K get sc ceph-rbd >/dev/null 2>&1 && ok "storageclass ceph-rbd" || bad "storageclass ceph-rbd missing"

echo; echo "== Vault sanity =="
if $K -n vault get pod vault-0 >/dev/null 2>&1; then
  SEALED=$($K -n vault exec vault-0 -- vault status -format=json 2>/dev/null | grep -o '"sealed": *[a-z]*' | awk '{print $2}')
  [ "$SEALED" = "false" ] && ok "vault unsealed" || bad "vault is sealed (or unreachable)"
fi

echo
echo "Result: $PASS passed, $FAIL failed."
[ $FAIL -eq 0 ] && exit 0 || exit 1
