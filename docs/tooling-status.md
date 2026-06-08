# Tooling and plugin status

This repository now includes a repeatable, read-only diagnostic script at `scripts/check_environment.sh` for checking the local development environment, Codex MCP configuration, GitHub CLI, VS Code CLI, and network reachability.

## Findings from this container

Checked on 2026-06-08 in `/workspace/AI`.

| Area | Status | Notes |
| --- | --- | --- |
| Git | OK | `git` is installed (`2.43.0`) and the repository is on branch `work`. Git identity is configured as `Codex <codex@openai.com>`. |
| Repository remote | Needs setup | No Git remote is configured, so pushes and GitHub PR edits cannot be performed from this checkout until an `origin` remote is added. |
| Codex CLI | Partially OK | `/opt/codex/bin/codex` exists and reports `codex-cli 0.124.0`, but `codex` is not currently on `PATH`. Add `/opt/codex/bin` to `PATH` if interactive shell access is required. |
| Codex MCP | OK | `/opt/codex/config.toml` configures the `make_pr` MCP server, and `/opt/codex/bin/codex mcp list` reports it as enabled. |
| GitHub CLI | Missing | `gh` is not installed, so GitHub authentication and PR editing through the CLI cannot be verified. |
| VS Code CLI | Missing | `code` is not installed or not on `PATH`, so VS Code extensions and CLI integration cannot be verified. |
| Node tooling | OK | `node`, `npm`, `pnpm`, and `yarn` are installed through nvm. |
| Python tooling | OK | `python3` and `pip3` are available through pyenv. |
| Docker | Missing | `docker` is not installed in this container. |
| Network to GitHub | Blocked | `curl` requests to `https://github.com` and `https://api.github.com` fail with proxy `403 Forbidden`, so live GitHub operations cannot be verified from this environment. |

## Recommended setup actions

1. Add Codex CLI to shell startup if you need the `codex` command directly:

   ```bash
   export PATH="/opt/codex/bin:$PATH"
   ```

2. Configure a Git remote before attempting pushes or PR edits:

   ```bash
   git remote add origin <repository-url>
   ```

3. Install and authenticate GitHub CLI in environments where package installation and outbound GitHub access are permitted:

   ```bash
   gh auth login
   gh auth status
   ```

4. Install VS Code CLI or add it to `PATH` if VS Code integration is required:

   ```bash
   code --version
   code --list-extensions
   ```

5. Re-run the diagnostic script after setup changes:

   ```bash
   ./scripts/check_environment.sh
   ```
