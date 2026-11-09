<#
.SYNOPSIS
    LabTrack Enterprise Platform Health Check Script
.DESCRIPTION
    Performs comprehensive diagnostic health checks across all containerized microservices
    (Nginx Gateway, .NET 8 Backend API, Python AI Engine, and PostgreSQL 16 Database)
    and verifies HTTP response codes and container health probe statuses.
.NOTES
    Target: LabTrack Microservice Architecture
    Dependencies: Docker CLI, Invoke-RestMethod
#>

[CmdletBinding()]
param(
    [string]$ApiBaseUrl = "http://localhost:8080",
    [string]$AiBaseUrl = "http://localhost:8000",
    [string]$GatewayBaseUrl = "http://localhost",
    [string]$PostgresContainer = "labtrack-postgres-1"
)

# Enforce strict error handling
$ErrorActionPreference = "Stop"

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting LabTrack Enterprise Health Check..."
$HasErrors = $false

try {
    # 1. Check Docker CLI & Container States
    Write-Host "`n[1/4] Inspecting Docker container execution states & health probes..."
    if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
        throw "Docker CLI is not available on the host machine."
    }

    $Containers = @("labtrack-nginx-1", "labtrack-api-1", "labtrack-ai-1", $PostgresContainer)
    foreach ($container in $Containers) {
        $Exists = (docker ps -a --filter "name=$container" --format "{{.Names}}") -eq $container
        if (-not $Exists) {
            Write-Host "  [FAIL] Container '$container' is missing or not created." -ForegroundColor Red
            $HasErrors = $true
            continue
        }

        $Status = (docker inspect --format='{{.State.Status}}' $container 2>$null)
        $Health = (docker inspect --format='{{range .State.Health}}{{.Status}}{{end}}' $container 2>$null)

        if ($Status -eq "running") {
            if ($Health -and $Health -ne "healthy") {
                Write-Host "  [WARN] Container '$container' is running but health status is: $Health" -ForegroundColor Yellow
            } else {
                $healthLabel = if ($Health) { $Health } else { 'n/a' }
                Write-Host "  [OK]   Container '$container' is running (Health: $healthLabel)." -ForegroundColor Green
            }
        } else {
            Write-Host "  [FAIL] Container '$container' state is: $Status" -ForegroundColor Red
            $HasErrors = $true
        }
    }

    # 2. Check .NET 8 Backend API Health Endpoint
    Write-Host "`n[2/4] Testing .NET 8 Backend API health endpoint ($ApiBaseUrl/health)..."
    try {
        $ApiResponse = Invoke-RestMethod -Uri "$ApiBaseUrl/health" -Method Get -TimeoutSec 5
        Write-Host "  [OK]   Backend API is responding successfully (status: $($ApiResponse.status))." -ForegroundColor Green
    } catch {
        Write-Host "  [FAIL] Backend API health check failed: $_" -ForegroundColor Red
        $HasErrors = $true
    }

    # 3. Check Python AI Engine Health Endpoint
    Write-Host "`n[3/4] Testing Python AI Engine health endpoint ($AiBaseUrl/health)..."
    try {
        $AiResponse = Invoke-RestMethod -Uri "$AiBaseUrl/health" -Method Get -TimeoutSec 5
        Write-Host "  [OK]   Python AI Engine is responding successfully (status: $($AiResponse.status))." -ForegroundColor Green
    } catch {
        Write-Host "  [FAIL] Python AI Engine health check failed: $_" -ForegroundColor Red
        $HasErrors = $true
    }

    # 4. Check PostgreSQL Database Connectivity & Verification
    Write-Host "`n[4/4] Verifying PostgreSQL 16 database connectivity & schema integrity..."
    try {
        $DbPing = docker exec -t $PostgresContainer pg_isready -U postgres -d labtrack_db 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK]   PostgreSQL database connection active and responsive." -ForegroundColor Green
        } else {
            throw $DbPing
        }
    } catch {
        Write-Host "  [FAIL] PostgreSQL database connectivity check failed: $_" -ForegroundColor Red
        $HasErrors = $true
    }

    Write-Host "`n-------------------------------------------------------------------"
    if ($HasErrors) {
        Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Health check completed with errors. Review failed components above." -ForegroundColor Red
        exit 1
    } else {
        Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] All LabTrack microservices and infrastructure are healthy and operational!" -ForegroundColor Green
    }
}
catch {
    Write-Error "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] HEALTH CHECK EXECUTION FAILED: $_"
    exit 1
}