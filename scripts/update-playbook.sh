#!/usr/bin/env bash
# Only advance to an exact revision already approved by the project owner.
set -euo pipefail
if [[ $# -ne 1 || ! $1 =~ ^[a-f0-9]{40}$ ]]; then
  printf 'Usage: %s <approved-full-commit-sha>\nNo revision selected; nothing fetched or changed.\n' "$0" >&2
  exit 2
fi
PLAYBOOK_TARGET=$1
source "$(dirname "${BASH_SOURCE[0]}")/playbook-common.sh"
playbook_initialized || fail 'Initialize the pinned checkout with setup-playbook.sh first.'
verify_playbook "$PLAYBOOK_PIN"
if [[ "$PLAYBOOK_TARGET" == "$PLAYBOOK_PIN" ]]; then
  printf 'Already at the requested pin; no update required.\n'
  exit 0
fi
git submodule sync -- playbook
git -C playbook fetch origin "$PLAYBOOK_TARGET"
[[ $(git -C playbook rev-parse "$PLAYBOOK_TARGET^{commit}") == "$PLAYBOOK_TARGET" ]] || fail 'Target is not an exact commit.'
git -C playbook checkout --detach "$PLAYBOOK_TARGET"
configure_sparse
verify_playbook "$PLAYBOOK_TARGET"
printf 'Review the changed parent Gitlink and run project validation. No commit or staging was performed.\n'
