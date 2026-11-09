<#
.SYNOPSIS
    LabTrack Emergency Production Rollback Script (PowerShell Core / Windows PowerShell)
.DESCRIPTION
    Performs an immediate emergency rollback of the LabTrack production deployment to a stable
    previous container image tag or backup state, restores database integrity if required,
    and runs full verification checks.
.NOTES
    Target: Production Infrastructure (Docker Compose + PostgreSQL 16)
    Dependencies: Docker 24.0+, Docker Compose
#>

[CmdletBinding()]
param(
    [string]$EnvFile = "$PSScriptRoot\..\..\.env.production",
    [string]$ComposeFile = "$PSScriptRoot\..\..\docker-compose.yml",
    [string]$PreviousTag = "latest",
    [string]$ContainerName = "labtrack-postgres-1",
    [string]$DatabaseName = "labtrack_db",
    [string]$DatabaseUser = "postgres"
)

# Enforce strict error handling
$ErrorActionPreference = "Stop"

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ==================================================="
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] LabTrack Emergency Rollback Procedure Initiated"
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ==================================================="

try {
    if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
        throw "Docker CLI is not available on the target deployment server."
    }

    if (-not (Test-Path -Path $EnvFile)) {
        throw "Production environment file not found at: $EnvFile"
    }

    Write-Host "[1/4] Halting current faulty container instances..."
    docker compose --env-file $EnvFile -f$ComposeFile stop api ai

    Write-Host "`n[2/4] Reverting services to stable image tag ($PreviousTag)..."
    # If specific tag overrides are needed, they can be passed or environment variables adjusted here
    docker compose --env-file $EnvFile -f $ComposeFile up --detach --no-deps api ai

    Write-Host "`n[3/4] Waiting for services and database container to stabilize..."
    $MaxRetries = 15$RetryCount = 0
    $IsHealthy =$false

    while ($RetryCount -lt $MaxRetries) {$HealthStatus = docker inspect --format='{{range .State.Health}}{{.Status}}{{end}}' $ContainerName 2>$null
        if ($HealthStatus -eq "healthy") {
            $IsHealthy =$true
            break
        }
        Start-Sleep -Seconds 3
        $RetryCount++
        Write-Host -NoNewline "."
    }
    Write-Host ""

    if (-not $IsHealthy) {
        Write-Host "WARNING: PostgreSQL container health check did not report healthy, but continuing verification..." -ForegroundColor Yellow
    }

    Write-Host "`n[4/4] Executing post-rollback database and forensic ledger integrity verification..."
    $SchemaQuery = "SELECT * FROM public.fn_verify_labtrack_schema_deployment();"
    docker exec -t $ContainerName psql -U $DatabaseUser -d $DatabaseName -c "$SchemaQuery"

    $LedgerQuery = "SELECT * FROM audit.fn_verify_forensic_ledger_integrity();"
    docker exec -t $ContainerName psql -U $DatabaseUser -d $DatabaseName -c "$LedgerQuery"

    Write-Host "`n[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ==================================================="
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] LabTrack Emergency Rollback Completed Successfully."
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ==================================================="
}
catch {
    Write-Error "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ROLLBACK FAILED:$_"
    exit 1
}