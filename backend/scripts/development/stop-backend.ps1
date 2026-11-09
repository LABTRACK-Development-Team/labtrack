<#
.SYNOPSIS
    LabTrack Local Backend & Infrastructure Stop Script
.DESCRIPTION
    Gracefully stops the LabTrack Docker Compose stack (PostgreSQL, .NET API, AI engine, Nginx)
    and terminates any active local .NET backend processes.
.NOTES
    Target: .NET 8 Backend API & Docker Stack
    Dependencies: Docker Compose
#>

[CmdletBinding()]
param(
    [switch]$RemoveVolumes = $false
)

# Enforce strict error handling
$ErrorActionPreference = "Stop"

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Stopping LabTrack Development Environment..."

try {
    # 1. Check Docker availability and stop containers
    if (Get-Command "docker" -ErrorAction SilentlyContinue) {
        Write-Host "Stopping Docker Compose containers..."
        if ($RemoveVolumes) {
            docker compose down -v
            Write-Host "Containers and persistent volumes removed." -ForegroundColor Yellow
        } else {
            docker compose stop
            Write-Host "Containers stopped successfully."
        }
    } else {
        Write-Host "Docker CLI not found; skipping container shutdown." -ForegroundColor Yellow
    }

    # 2. Terminate local .NET backend processes if running natively
    $DotNetProcesses = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue
    if ($DotNetProcesses) {
        foreach ($proc in $DotNetProcesses) {
            try {
                $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
                if ($cmdLine -like "*LabTrack*") {
                    Write-Host "Stopping local LabTrack .NET process (PID: $($proc.Id))..."
                    Stop-Process -Id $proc.Id -Force
                }
            } catch {
                # Ignore processes where command line inspection fails due to permissions
            }
        }
    }

    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] LabTrack development environment successfully stopped."
}
catch {
    Write-Error "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] STOP SCRIPT FAILED: $_"
    exit 1
}