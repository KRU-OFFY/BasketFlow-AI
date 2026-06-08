# Tooling and plugin status

This repository includes repeatable, read-only diagnostic scripts for checking the local development environment, Codex MCP configuration, GitHub CLI, VS Code CLI, Docker, and network reachability:

- Windows PowerShell: `scripts/check_environment.ps1`
- Linux, macOS, WSL, or Git Bash: `scripts/check_environment.sh`

## Findings from this Windows workstation

Checked on 2026-06-08 in `D:\งาน CODEX AI`, with the `KRU-OFFY/AI` repository cloned at `D:\งาน CODEX AI\AI`.

| Area | Status | Notes |
| --- | --- | --- |
| Repository checkout | OK | `KRU-OFFY/AI` is cloned locally, on branch `kux98m-codex/analyze-installed-tools-and-plugins`, tracking `origin/kux98m-codex/analyze-installed-tools-and-plugins`. |
| Repository remote | OK | `origin` uses `https://github.com/KRU-OFFY/AI.git` for fetch and push. |
| Git | OK | `git version 2.54.0.windows.1` is installed. Global identity is configured as `KRU-OFFY <248393795+KRU-OFFY@users.noreply.github.com>`. |
| GitHub CLI | OK | `gh version 2.93.0` is installed and authenticated to `github.com` as `KRU-OFFY` with repo-capable scopes. Git operations are configured for HTTPS and `gh auth setup-git` has been run. |
| Pull requests | OK | `gh pr view 4 --repo KRU-OFFY/AI` works. PR #4 is open, mergeable, and has no failing status checks. |
| GitHub SSH | Not used | SSH authentication currently returns `Permission denied (publickey)`. HTTPS Git operations are configured instead, so PR checkout/push can still work through GitHub CLI credentials. |
| Codex CLI | OK | `codex-cli 0.137.0-alpha.4` is installed on PATH. |
| Codex MCP | Mostly OK | `MCP_DOCKER`, `node_repl`, `openai-api-key-local-confirmation`, and `xcodebuildmcp` are enabled. `cloudflare-api` is disabled because the `cloudflare-api` command is not installed or not on PATH. |
| Computer Use plugin | OK | The Windows automation bridge responds to `list_apps`; it can see running apps including Docker Desktop, Chrome, File Explorer, and Visual Studio Code. |
| VS Code CLI | OK | `code 1.123.0` is installed on PATH. Relevant extensions include `openai.chatgpt`, `github.vscode-pull-request-github`, `ms-azuretools.vscode-docker`, and Python tooling. |
| Node tooling | OK | `node v24.13.0`, `npm 11.6.2`, and `pnpm 11.5.2` are installed. |
| Python tooling | OK | `Python 3.12.10` is installed and available through both `python` and `py`. |
| Docker | OK | Docker Desktop is running. Client and server are both `29.5.2`, using the `desktop-linux` context. |
| Codex workspace hooks | OK | `D:\งาน CODEX AI\.codex\hooks.json` now points to the real `npm_test_guard.py` path and the hook returns `{"continue": true}` when no JavaScript edit is pending. |
| Network to GitHub | OK | `gh api user`, `gh api rate_limit`, and HTTPS GitHub repository queries succeed. |

## Remaining notes

1. The root folder `D:\งาน CODEX AI` is a workspace folder, not a Git repository. The actual local repository for this PR is `D:\งาน CODEX AI\AI`.
2. Cloudflare's plugin entry is enabled in Codex config, but its standalone MCP server remains disabled until a valid `cloudflare-api` command is installed or configured.
3. SSH-based GitHub operations will need the local `id_ed25519.pub` key added to GitHub before `ssh -T git@github.com` succeeds. HTTPS is already configured and working, so this is not blocking normal PR work.
