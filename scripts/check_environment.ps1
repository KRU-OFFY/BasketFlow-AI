#!/usr/bin/env pwsh
[CmdletBinding()]
param()

$ErrorActionPreference = "Continue"
$script:Status = 0

function Write-Section {
    param([string]$Name)
    Write-Host ""
    Write-Host "== $Name =="
}

function Mark-Failed {
    $script:Status = 1
}

function Invoke-Tool {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [string[]]$VersionArgs = @("--version"),
        [switch]$Optional
    )

    $cmd = Get-Command $Name -ErrorAction SilentlyContinue
    $label = $Name.PadRight(16)
    if (-not $cmd) {
        if ($Optional) {
            Write-Host "$label OPTIONAL_MISSING"
        } else {
            Write-Host "$label MISSING"
            Mark-Failed
        }
        return $false
    }

    Write-Host "$label OK      $($cmd.Source)"
    if ($VersionArgs.Count -gt 0) {
        try {
            & $Name @VersionArgs 2>&1 | Select-Object -First 3 | ForEach-Object { "  $_" }
        } catch {
            "  version check failed: $($_.Exception.Message)"
            if (-not $Optional) {
                Mark-Failed
            }
        }
    }
    return $true
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)][scriptblock]$Command,
        [int]$First = 80,
        [switch]$Optional
    )

    try {
        $global:LASTEXITCODE = 0
        $output = & $Command 2>&1
        $exitCode = $LASTEXITCODE
        $output | Select-Object -First $First
        if ($exitCode -ne $null -and $exitCode -ne 0 -and -not $Optional) {
            Mark-Failed
        }
    } catch {
        $_.Exception.Message
        if (-not $Optional) {
            Mark-Failed
        }
    }
}

Write-Section "Operating system"
Get-ComputerInfo -Property OsName,OsVersion,OsArchitecture,CsProcessors,CsTotalPhysicalMemory |
    Format-List

Write-Section "Repository"
"path: $(Get-Location)"
Invoke-Checked { git status --short --branch } -First 20
Invoke-Checked { git remote -v } -First 20

Write-Section "Core CLIs"
Invoke-Tool git @("--version") | Out-Null
Invoke-Tool gh @("--version") | Out-Null
Invoke-Tool code @("--version") | Out-Null
Invoke-Tool node @("--version") | Out-Null
Invoke-Tool npm @("--version") | Out-Null
Invoke-Tool pnpm @("--version") | Out-Null
Invoke-Tool yarn @("--version") -Optional | Out-Null
Invoke-Tool python @("--version") | Out-Null
Invoke-Tool py @("--version") | Out-Null
Invoke-Tool rg @("--version") | Out-Null
Invoke-Tool curl.exe @("--version") | Out-Null
Invoke-Tool docker @("--version") | Out-Null
Invoke-Tool winget @("--version") -Optional | Out-Null

Write-Section "Codex CLI and MCP"
if (Invoke-Tool codex @("--version")) {
    Invoke-Checked { codex mcp list } -First 80
}

Write-Section "GitHub CLI auth"
if (Get-Command gh -ErrorAction SilentlyContinue) {
    Invoke-Checked { gh auth status } -First 80
    Invoke-Checked { gh api user --jq ".login" } -First 10
    Invoke-Checked { gh config get git_protocol --host github.com } -First 10
} else {
    "gh is not installed, so GitHub PR operations through gh cannot be verified."
    Mark-Failed
}

Write-Section "Docker daemon"
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Invoke-Checked { docker info --format "{{.ServerVersion}}" } -First 10
    Invoke-Checked { docker context ls } -First 20
}

Write-Section "VS Code extensions"
if (Get-Command code -ErrorAction SilentlyContinue) {
    Invoke-Checked { code --list-extensions } -First 120
} else {
    "code is not installed or is not on PATH."
    Mark-Failed
}

Write-Section "Codex workspace hooks"
$repoRoot = Split-Path -Parent $PSScriptRoot
$workspaceHookJson = Join-Path (Split-Path -Parent $repoRoot) ".codex\hooks.json"
if (Test-Path -LiteralPath $workspaceHookJson) {
    try {
        $hookConfig = Get-Content -LiteralPath $workspaceHookJson -Raw | ConvertFrom-Json
        foreach ($event in $hookConfig.hooks.PSObject.Properties) {
            foreach ($entry in @($event.Value)) {
                foreach ($hook in @($entry.hooks)) {
                    $commandWindows = [string]$hook.commandWindows
                    $match = [regex]::Match($commandWindows, '"(.+?)"')
                    if ($match.Success) {
                        $path = $match.Groups[1].Value
                        $exists = Test-Path -LiteralPath $path
                        "{0,-12} {1,-5} {2}" -f $event.Name, $exists, $path
                        if (-not $exists) {
                            Mark-Failed
                        }
                    }
                }
            }
        }
    } catch {
        "Unable to parse ${workspaceHookJson}: $($_.Exception.Message)"
        Mark-Failed
    }
} else {
    "No workspace hook config found at $workspaceHookJson"
}

Write-Section "Network reachability"
foreach ($url in @("https://github.com", "https://api.github.com")) {
    $url
    Invoke-Checked { curl.exe -sS -I -L --max-time 10 $url } -First 12
}

Write-Section "Result"
if ($script:Status -eq 0) {
    "All required checks passed."
} else {
    "One or more checks failed or could not be verified."
}

exit $script:Status
