#!/usr/bin/env bash
# Shared guards; source from setup/update helpers, not as an entry point.
set -euo pipefail
PLAYBOOK_ROOT=$(git -C "$(dirname "${BASH_SOURCE[0]}")/.." rev-parse --show-toplevel)
cd "$PLAYBOOK_ROOT"
fail() { printf '%s\n' "$*" >&2; exit 1; }
PLAYBOOK_PIN=$(git rev-parse HEAD:playbook)
[[ $(git ls-tree HEAD playbook) == '160000 commit '* ]] || fail 'playbook is not a committed Gitlink.'
[[ $(git rev-parse :playbook) == "$PLAYBOOK_PIN" ]] || fail 'A staged Playbook update exists; review it before running helpers.'
[[ $(git config -f .gitmodules --get submodule.playbook.path) == playbook ]] || fail 'Unexpected submodule path.'
[[ $(git config -f .gitmodules --get submodule.playbook.url) == https://github.com/marksav85/msd-projects-playbook.git ]] || fail 'Unexpected Playbook remote; review .gitmodules first.'
git diff --quiet -- .gitmodules || fail '.gitmodules has local changes; review them first.'
git diff --cached --quiet -- .gitmodules || fail '.gitmodules has staged changes; review them first.'
playbook_initialized() { [[ -f playbook/.git ]] && git -C playbook rev-parse --verify HEAD >/dev/null 2>&1; }
require_clean_playbook() {
  [[ -z $(git -C playbook status --porcelain --untracked-files=all) ]] || fail 'Playbook has local changes; preserve/review them before proceeding.'
}
configure_sparse() {
  git -C playbook sparse-checkout init --cone
  git -C playbook sparse-checkout set \
    docs/templates/0-ai \
    docs/templates/0-project-management \
    docs/templates/1-pre-development \
    docs/templates/2-development \
    docs/templates/3-post-development
}
verify_playbook() {
  local expected=$1 actual sparse
  actual=$(git -C playbook rev-parse HEAD)
  [[ "$actual" == "$expected" ]] || fail 'Playbook checkout differs from the expected revision.'
  require_clean_playbook
  sparse=$(git -C playbook sparse-checkout list)
  [[ "$sparse" == $'docs/templates/0-ai\ndocs/templates/0-project-management\ndocs/templates/1-pre-development\ndocs/templates/2-development\ndocs/templates/3-post-development' ]] || fail 'Unexpected sparse checkout; run setup after reviewing local changes.'
  [[ -f playbook/docs/templates/2-development/dev-1--project-setup/modules/playbook-integration/module--dev-1--playbook-submodule-integration.md ]] || fail 'Canonical integration module is missing.'
  printf 'Playbook revision: %s\n' "$actual"
}
