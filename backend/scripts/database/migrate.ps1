<#
.SYNOPSIS
    LabTrack Database Migration Script (PowerShell Core / Windows PowerShell)
.DESCRIPTION
    Applies Entity Framework Core migrations or SQL schema updates to the PostgreSQL 16
    LabTrack database instance. Supports local development and automated CI/CD deployment pipelines.
.NOTES
    Target: PostgreSQL 16 (Multi-Schema Instance)
    Dependencies: .NET 8 SDK, EF Core CLI tools (`dotnet-ef`), Docker (optional for container checks)
#>

[CmdletBinding()]
param(
    [string]$ProjectFolder = "$PSScriptRoot\..\..\src\LabTrack.Infrastructure",
    [string]$StartupProject = "$PSScriptRoot\..\..\src\LabTrack.Api",
    [string]$ConnectionString = "Host=localhost;Database=labtrack_db;Username=postgres;Password=postgres",
    [string]$ContainerName = "labtrack-postgres-1",
    [ValidateSet("Update", "Drop", "List", "GenerateScript")]
    [string]$Action = "Update",
    [string]$MigrationName = "",
    [string]$OutputScriptPath = "$PSScriptRoot\migration_script.sql"
)

# Enforce strict error handling
$ErrorActionPreference = "Stop"

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting LabTrack Migration Utility..."
Write-Host "Action: $Action"
Write-Host "Target Database Connection: $ConnectionString"

# Check if dotnet-ef is available
if (-not (Get-Command "dotnet-ef" -ErrorAction SilentlyContinue)) {
    Write-Host "Warning: 'dotnet-ef' global tool not found. Attempting to install or run via dotnet tool..."
}

try {
    Push-Location $StartupProject

    switch ($Action) {
        "Update" {
            Write-Host "Applying pending database migrations..."
            if ($MigrationName) {
                dotnet ef database update $MigrationName --project$ProjectFolder --startup-project $StartupProject --connection$ConnectionString
            } else {
                dotnet ef database update --project $ProjectFolder --startup-project $StartupProject --connection$ConnectionString
            }
            Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Database migrations successfully applied."
        }

        "Drop" {
            Write-Host "WARNING: Dropping database schema..." -ForegroundColor Yellow
            dotnet ef database drop --force --project $ProjectFolder --startup-project $StartupProject --connection$ConnectionString
            Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Database dropped successfully."
        }

        "List" {
            Write-Host "Fetching applied and pending migrations..."
            dotnet ef migrations list --project $ProjectFolder --startup-project $StartupProject --connection$ConnectionString
        }

        "GenerateScript" {
            Write-Host "Generating SQL migration script to: $OutputScriptPath"
            dotnet ef migrations script --project $ProjectFolder --startup-project $StartupProject --output$OutputScriptPath
            Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] SQL script generated successfully."
        }
    }

    # Verify database deployment integrity if update was performed
    if ($Action -eq "Update") {
        Write-Host "Verifying database schema deployment..."
        $VerificationSql = "SELECT * FROM public.fn_verify_labtrack_schema_deployment();"
        
        if (Get-Command "docker" -ErrorAction SilentlyContinue) {
            $ContainerRunning = (docker ps --filter "name=$ContainerName" --format "{{.Names}}") -eq $ContainerName
            if ($ContainerRunning) {
                docker exec -t $ContainerName psql -U postgres -d labtrack_db -c "$VerificationSql"
            }
        }
    }
}
catch {
    Write-Error "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR during migration execution:$_"
    exit 1
}
finally {
    Pop-Location
}