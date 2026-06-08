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

check_cmd_any() {
  local label="$1"
  local version_args="$2"
  shift 2
  local candidate
  printf '%-14s' "$label"
  for candidate in "$@"; do
    if command -v "$candidate" >/dev/null 2>&1; then
      local path
      path="$(command -v "$candidate")"
      local output
      # shellcheck disable=SC2086
      if output="$("$candidate" $version_args 2>&1)"; then
        printf 'OK      %s (%s)\n' "$path" "$candidate"
        printf '%s\n' "$output" | sed 's/^/  /' | sed -n '1,3p'
        return 0
      fi
    fi
  done
  printf 'MISSING\n'
  status=1
}

check_cmd_optional() {
  local name="$1"
  local version_args="${2:---version}"
  printf '%-14s' "$name"
  if command -v "$name" >/dev/null 2>&1; then
    local path
    path="$(command -v "$name")"
    printf 'OK      %s\n' "$path"
    if [ -n "$version_args" ]; then
      # shellcheck disable=SC2086
      if ! "$name" $version_args 2>&1 | sed 's/^/  /' | sed -n '1,3p'; then
        printf '  version check failed\n'
        status=1
      fi
    fi
  else
    printf 'OPTIONAL_MISSING\n'
  fi
}

check_path_optional() {
  local label="$1"
  local path="$2"
  local version_args="${3:---version}"
  printf '%-14s' "$label"
  if [ -x "$path" ]; then
    printf 'OK      %s\n' "$path"
    # shellcheck disable=SC2086
    "$path" $version_args 2>&1 | sed 's/^/  /' | sed -n '1,3p'
  else
    printf 'OPTIONAL_MISSING %s\n' "$path"
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
check_cmd_optional yarn --version
check_cmd_any python --version python3 python py
check_cmd_any pip --version pip3 pip
check_cmd_optional jq --version
check_cmd rg --version
check_cmd curl --version
check_cmd docker --version

print_section "Codex CLI and MCP"
codex_cmd=""
if command -v codex >/dev/null 2>&1; then
  check_cmd codex --version
  codex_cmd="$(command -v codex)"
elif [ -x /opt/codex/bin/codex ]; then
  check_path_optional codex-bin /opt/codex/bin/codex --version
  codex_cmd="/opt/codex/bin/codex"
else
  printf '%-14sMISSING\n' "codex"
  status=1
fi
if [ -n "$codex_cmd" ]; then
  "$codex_cmd" mcp list 2>&1 | sed -n '1,60p' || status=1
fi
if [ -r "$HOME/.codex/config.toml" ]; then
  printf '\n~/.codex/config.toml is readable.\n'
elif [ -r /opt/codex/config.toml ]; then
  printf '\n/opt/codex/config.toml is readable.\n'
else
  printf '\nNo Codex config file found at ~/.codex/config.toml or /opt/codex/config.toml.\n'
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
  if curl -sS -I -L --max-time 10 "$url" 2>&1 | sed -n '1,12p'; then
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
