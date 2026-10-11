#!/usr/bin/env bash
# Restore the parent HEAD pin; never track the latest upstream branch.
set -euo pipefail
[[ $# -eq 0 || ( $# -eq 1 && $1 == --check ) ]] || { printf 'Usage: %s [--check]\n' "$0" >&2; exit 2; }
source "$(dirname "${BASH_SOURCE[0]}")/playbook-common.sh"
if [[ ${1:-} == --check ]]; then
  playbook_initialized || fail 'Playbook is uninitialized; run scripts/setup-playbook.sh.'
  verify_playbook "$PLAYBOOK_PIN"
  exit 0
fi
if playbook_initialized; then require_clean_playbook; fi
git submodule sync -- playbook
git submodule update --init --checkout -- playbook
configure_sparse
verify_playbook "$PLAYBOOK_PIN"
