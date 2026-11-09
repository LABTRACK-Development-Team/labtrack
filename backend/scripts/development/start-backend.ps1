<#
.SYNOPSIS
    LabTrack Local Backend & Infrastructure Startup Script
.DESCRIPTION
    Orchestrates the local development environment by verifying Docker container health,
    spinning up supporting infrastructure (PostgreSQL 16), and launching the .NET 8 API backend.
.NOTES
    Target: .NET 8 Backend API & PostgreSQL 16
    Dependencies: Docker Compose, .NET 8 SDK
#>

[CmdletBinding()]
param(
    [string]$ApiProjectFolder = "$PSScriptRoot\..\..\src\LabTrack.Api",
    [string]$Environment = "Development",
    [int]$ApiPort = 5000
)

# Enforce strict error handling
$ErrorActionPreference = "Stop"

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting LabTrack Backend Development Environment..."

try {
    # 1. Check Docker & Docker Compose availability
    if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
        throw "Docker CLI is not available on the host machine."
    }

    Write-Host "[1/3] Ensuring supporting infrastructure (PostgreSQL 16) is running..."
    docker compose up -d postgres

    # Wait briefly for PostgreSQL health check
    Write-Host "Waiting for PostgreSQL container to become healthy..."
    $MaxRetries = 15
    $RetryCount = 0
    $IsHealthy = $false

    while ($RetryCount -lt $MaxRetries) {
        $HealthStatus = docker inspect --format='{{range .State.Health}}{{.Status}}{{end}}' labtrack-postgres-1 2>$null
        if ($HealthStatus -eq "healthy") {
            $IsHealthy = $true
            break
        }
        Start-Sleep -Seconds 2
        $RetryCount++
        Write-Host -NoNewline "."
    }
    Write-Host ""

    if (-not $IsHealthy) {
        throw "PostgreSQL container failed to report healthy status within the expected time window."
    }
    Write-Host "PostgreSQL container is online and healthy."

    # 2. Check .NET 8 SDK availability
    if (-not (Get-Command "dotnet" -ErrorAction SilentlyContinue)) {
        throw ".NET SDK is not installed or available in the system PATH."
    }

    $DotNetVersion = dotnet --version
    Write-Host "[2/3] Verified .NET SDK version: $DotNetVersion"

    # 3. Start .NET 8 Backend API Natively
    Write-Host "[3/3] Launching LabTrack.Api (.NET 8) in '$Environment' mode..."
    Push-Location $ApiProjectFolder

    # Set environment variables for local run
    $env:ASPNETCORE_ENVIRONMENT = $Environment
    $env:ASPNETCORE_URLS = "http://localhost:$ApiPort"

    Write-Host "API Swagger UI will be available at: http://localhost:$ApiPort/swagger"
    Write-Host "Press Ctrl+C to stop the backend service.`n"

    dotnet run --environment $Environment
}
catch {
    Write-Error "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] BACKEND STARTUP FAILED: $_"
    if ((Get-Location).Path -ne $PSScriptRoot) { Pop-Location -ErrorAction SilentlyContinue }
    exit 1
}
finally {
    if ((Get-Location).Path -ne $PSScriptRoot) { Pop-Location -ErrorAction SilentlyContinue }
}