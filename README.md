# AI

## Environment diagnostics

Use the included read-only diagnostic scripts to verify the repository workstation, CLI tools, Codex MCP setup, GitHub CLI, VS Code CLI, Docker, and network connectivity.

On Windows PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\check_environment.ps1
```

On Linux, macOS, WSL, or Git Bash:

```bash
./scripts/check_environment.sh
```

The latest workstation findings and remediation notes are documented in [`docs/tooling-status.md`](docs/tooling-status.md).
