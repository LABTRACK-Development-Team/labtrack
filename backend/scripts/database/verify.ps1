<#
.SYNOPSIS
    LabTrack Database Verification Script (PowerShell Core / Windows PowerShell)
.DESCRIPTION
    Verifies that the LabTrack database deployment is complete and that the
    SHA-256 forensic audit ledger has not been tampered with. Runs two
    SQL verification functions inside the PostgreSQL 16 container:
      - public.fn_verify_labtrack_schema_deployment()
      - audit.fn_verify_forensic_ledger_integrity()
.NOTES
    Target: PostgreSQL 16 (Multi-Schema Instance)
    Dependencies: Docker
#>

[CmdletBinding()]
param(
    [string]$ContainerName = "labtrack-postgres-1",
    [string]$DatabaseName  = "labtrack_db",
    [string]$DatabaseUser  = "postgres"
)

# Enforce strict error handling
$ErrorActionPreference = "Stop"

function Invoke-Psql {
    param(
        [Parameter(Mandatory = $true)][string]$Sql
    )
    & docker exec -t $ContainerName psql -U $DatabaseUser -d $DatabaseName -v ON_ERROR_STOP=1 -c $Sql
    if ($LASTEXITCODE -ne 0) {
        throw "psql failed with exit code $LASTEXITCODE for: $Sql"
    }
}

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting LabTrack database verification..." -ForegroundColor Cyan
Write-Host "  Container : $ContainerName"
Write-Host "  Database  : $DatabaseName"
Write-Host "  User      : $DatabaseUser"

try {
    # 1. Sanity check — container is reachable
    Write-Host ""
    Write-Host "Checking container connectivity..." -ForegroundColor Cyan
    & docker exec -t $ContainerName pg_isready -U $DatabaseUser -d $DatabaseName
    if ($LASTEXITCODE -ne 0) {
        throw "PostgreSQL container '$ContainerName' is not ready or not reachable."
    }

    # 2. Schema deployment verification
    Write-Host ""
    Write-Host "Verifying schema deployment..." -ForegroundColor Cyan
    Invoke-Psql -Sql "SELECT * FROM public.fn_verify_labtrack_schema_deployment();"

    # 3. Forensic ledger integrity (SHA-256 block chain)
    Write-Host ""
    Write-Host "Verifying forensic ledger integrity (SHA-256 chain)..." -ForegroundColor Cyan
    Invoke-Psql -Sql "SELECT * FROM audit.fn_verify_forensic_ledger_integrity();"

    Write-Host ""
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Verification completed successfully." -ForegroundColor Green
}
catch {
    Write-Error "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR during verification: $_"
    exit 1
}