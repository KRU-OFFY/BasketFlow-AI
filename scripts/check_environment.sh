#!/usr/bin/env bash
set -u
set -o pipefail

# Check the local development tools used by this repository and Codex session.
# The script is intentionally read-only: it reports status without installing,
# authenticating, or changing user/system configuration.

status=0

print_section() {
  printf '\n== %s ==\n' "$1"
}

check_cmd() {
  local name="$1"
  local version_args="${2:---version}"
  printf '%-14s' "$name"
  if command -v "$name" >/dev/null 2>&1; then
    local path
    path="$(command -v "$name")"
    printf 'OK      %s\n' "$path"
    if [ -n "$version_args" ]; then
      # shellcheck disable=SC2086
      "$name" $version_args 2>&1 | sed 's/^/  /' | sed -n '1,3p'
    fi
  else
    printf 'MISSING\n'
    status=1
  fi
}

check_optional_path() {
  local label="$1"
  local path="$2"
  local version_args="${3:---version}"
  printf '%-14s' "$label"
  if [ -x "$path" ]; then
    printf 'OK      %s\n' "$path"
    # shellcheck disable=SC2086
    "$path" $version_args 2>&1 | sed 's/^/  /' | sed -n '1,3p'
  else
    printf 'MISSING %s\n' "$path"
    status=1
  fi
}

print_section "Operating system"
uname -a
if [ -r /etc/os-release ]; then
  sed -n '1,6p' /etc/os-release
fi

print_section "Repository"
printf 'path: %s\n' "$(pwd)"
git status --short --branch 2>&1 | sed -n '1,20p' || status=1
git remote -v 2>&1 | sed -n '1,20p' || status=1

print_section "Core CLIs"
check_cmd git --version
check_cmd gh --version
check_cmd code --version
check_cmd node --version
check_cmd npm --version
check_cmd pnpm --version
check_cmd yarn --version
check_cmd python3 --version
check_cmd pip3 --version
check_cmd jq --version
check_cmd rg --version
check_cmd curl --version
check_cmd docker --version

print_section "Codex CLI and MCP"
check_cmd codex --version
check_optional_path codex-bin /opt/codex/bin/codex --version
if [ -x /opt/codex/bin/codex ]; then
  /opt/codex/bin/codex mcp list 2>&1 | sed -n '1,40p' || status=1
fi
if [ -r /opt/codex/config.toml ]; then
  printf '\n/opt/codex/config.toml is readable.\n'
  sed -n '1,80p' /opt/codex/config.toml
else
  printf '\n/opt/codex/config.toml is not readable.\n'
  status=1
fi

print_section "GitHub CLI auth"
if command -v gh >/dev/null 2>&1; then
  gh auth status 2>&1 | sed -n '1,80p' || status=1
else
  printf 'gh is not installed, so GitHub PR operations through gh cannot be verified.\n'
fi

print_section "VS Code extensions"
if command -v code >/dev/null 2>&1; then
  code --list-extensions 2>&1 | sed -n '1,80p' || status=1
else
  printf 'code is not installed or is not on PATH.\n'
fi

print_section "Network reachability"
for url in https://github.com https://api.github.com; do
  printf '%s\n' "$url"
  if curl -I -L --max-time 10 "$url" 2>&1 | sed -n '1,12p'; then
    :
  else
    status=1
  fi
done

print_section "Result"
if [ "$status" -eq 0 ]; then
  printf 'All checked tools are available and reachable.\n'
else
  printf 'One or more checks failed or could not be verified in this environment.\n'
fi

exit "$status"
