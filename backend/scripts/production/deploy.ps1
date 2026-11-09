<#
.SYNOPSIS
    LabTrack Enterprise Production Deployment Script (PowerShell Core / Windows PowerShell)
.DESCRIPTION
    Automates the secure zero-downtime production deployment of the LabTrack enterprise platform.
    Validates environment configurations, pulls container images, executes rolling updates,
    and runs comprehensive database schema and forensic ledger verification checks.
.NOTES
    Target: Production Infrastructure (Docker Compose + PostgreSQL 16)
    Dependencies: Docker 24.0+, Docker Compose, OpenSSL
#>

[CmdletBinding()]
param(
    [string]$EnvFile = "$PSScriptRoot\..\..\.env.production",
    [string]$ComposeFile = "$PSScriptRoot\..\..\docker-compose.yml",
    [string]$ContainerName = "labtrack-postgres-1",
    [string]$DatabaseName = "labtrack_db",
    [string]$DatabaseUser = "postgres"
)

# Enforce strict error handling
$ErrorActionPreference = "Stop"

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ==================================================="
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] LabTrack Enterprise Production Deployment Initiated"
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ==================================================="

try {
    # 1. Prerequisite Checks
    if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
        throw "Docker CLI is not available on the target deployment server."
    }

    if (-not (Test-Path -Path $EnvFile)) {
        throw "Production environment file not found at: $EnvFile. Please provision .env.production prior to deployment."
    }

    Write-Host "[1/5] Validating production environment configuration..."
    # Check for required secret keys in env file
    $EnvContent = Get-Content -Path$EnvFile -Raw
    if ($EnvContent -notmatch "BACKUP_BACKEND_ENCRYPTION_KEY" -or $EnvContent -notmatch "JWT_SECRET_KEY") {
        throw "Production environment file is missing required security secrets (JWT_SECRET_KEY or BACKUP_BACKEND_ENCRYPTION_KEY)."
    }

    # 2. Pull Latest Container Images & Build
    Write-Host "`n[2/5] Pulling latest container images and building services..."
    docker compose --env-file $EnvFile -f$ComposeFile pull
    docker compose --env-file $EnvFile -f$ComposeFile build --pull

    # 3. Rolling Container Deployment
    Write-Host "`n[3/5] Executing rolling container deployment..."
    docker compose --env-file $EnvFile -f $ComposeFile up --detach --remove-orphans

    # 4. Wait for Database Health Check
    Write-Host "`n[4/5] Waiting for PostgreSQL 16 database container to report healthy..."
    $MaxRetries = 20$RetryCount = 0
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
        throw "PostgreSQL container failed to achieve healthy status within the allocated timeout window."
    }
    Write-Host "Database container is online and fully healthy."

    # 5. Post-Deployment Integrity & Ledger Verification
    Write-Host "`n[5/5] Running post-deployment verification and forensic ledger integrity checks..."
    
    Write-Host "Verifying schema object counts..."
    $SchemaQuery = "SELECT * FROM public.fn_verify_labtrack_schema_deployment();"
    docker exec -t $ContainerName psql -U $DatabaseUser -d $DatabaseName -c "$SchemaQuery"

    Write-Host "Verifying SHA-256 cryptographic forensic audit ledger chain..."
    $LedgerQuery = "SELECT * FROM audit.fn_verify_forensic_ledger_integrity();"
    docker exec -t $ContainerName psql -U $DatabaseUser -d $DatabaseName -c "$LedgerQuery"

    Write-Host "`n[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ==================================================="
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] LabTrack Production Deployment Completed Successfully!"
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ==================================================="
}
catch {
    Write-Error "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] PRODUCTION DEPLOYMENT FAILED:$_"
    exit 1
}