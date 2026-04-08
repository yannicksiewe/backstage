#!/usr/bin/env bash
set -euo pipefail
F=catalog-info.yaml
required=(
  "compliance.iso27001/data-classification"
  "compliance.iso27001/criticality"
  "compliance.iso27001/contains-pii"
  "compliance.iso27001/retention-days"
  "compliance.iso27001/last-reviewed"
  "compliance.iso27001/controls"
)
fail=0
for k in "${required[@]}"; do
  if ! grep -q "$k" "$F"; then
    echo "::error::missing required ISO27001 field: $k"
    fail=1
  fi
done
exit $fail
