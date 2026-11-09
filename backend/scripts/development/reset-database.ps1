<#
.SYNOPSIS
    LabTrack Local Development Database Reset Script
.DESCRIPTION
    Drops the existing LabTrack database, recreates it within the PostgreSQL 16 container,
    applies all Entity Framework Core migrations, and verifies schema deployment integrity.
.NOTES
    Target: PostgreSQL 16 (Multi-Schema Instance)
    Dependencies: Docker, .NET 8 SDK / EF Core CLI (`dotnet-ef`)
#>

[CmdletBinding()]
param(
    [string]$ContainerName = "labtrack-postgres-1",
    [string]$DatabaseName = "labtrack_db",
    [string]$DatabaseUser = "postgres",
    [string]$ProjectFolder = "$PSScriptRoot\..\..\src\LabTrack.Infrastructure",
    [string]$StartupProject = "$PSScriptRoot\..\..\src\LabTrack.Api",
    [string]$ConnectionString = "Host=localhost;Database=labtrack_db;Username=postgres;Password=postgres"
)

# Enforce strict error handling
$ErrorActionPreference = "Stop"

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting LabTrack Database Reset Utility..."
Write-Host "Target Container: $ContainerName \vert{} Database:$DatabaseName"

try {
    # Check if Docker CLI is available
    if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
        throw "Docker CLI is not available on the host machine."
    }

    $ContainerRunning = (docker ps --filter "name=$ContainerName" --format "{{.Names}}") -eq $ContainerName
    if (-not $ContainerRunning) {
        Write-Host "PostgreSQL container '$ContainerName' is not running. Attempting to start via docker compose..." -ForegroundColor Yellow
        docker compose up -d postgres
        Start-Sleep -Seconds 5
    }

    Write-Host "Dropping and recreating database '$DatabaseName'..."
    docker exec -t $ContainerName psql -U$DatabaseUser -d postgres -c "REVOKE CONNECT ON DATABASE $DatabaseName FROM public; SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DatabaseName';" -ErrorAction SilentlyContinue
    docker exec -t $ContainerName psql -U$DatabaseUser -d postgres -c "DROP DATABASE IF EXISTS $DatabaseName;"
    docker exec -t $ContainerName psql -U$DatabaseUser -d postgres -c "CREATE DATABASE $DatabaseName;"

    # Brief pause to ensure DB is fully ready for connection
    Start-Sleep -Seconds 2

    Write-Host "Applying Entity Framework Core migrations..."
    Push-Location $StartupProject
    dotnet ef database update --project $ProjectFolder --startup-project $StartupProject --connection$ConnectionString
    Pop-Location

    Write-Host "Verifying database schema deployment and structural object counts..."
    $VerificationSql = "SELECT * FROM public.fn_verify_labtrack_schema_deployment();"
    docker exec -t $ContainerName psql -U$DatabaseUser -d $DatabaseName -c "$VerificationSql"

    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Database reset, migration, and verification completed successfully."
}
catch {
    Write-Error "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] DATABASE RESET FAILED:$_"
    if ((Get-Location).Path -ne $PSScriptRoot) { Pop-Location -ErrorAction SilentlyContinue }
    exit 1
}