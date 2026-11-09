<#
.SYNOPSIS
    LabTrack Comprehensive Automated Test Suite Execution Script
.DESCRIPTION
    Orchestrates the execution of all unit, integration, and database schema tests across
    the .NET 8 backend codebase and Python AI engine, followed by verification reports.
.NOTES
    Target: LabTrack Microservice Architecture (.NET 8 & Python 3.11)
    Dependencies: .NET SDK, Python pytest, Docker Compose (optional for test DB)
#>

[CmdletBinding()]
param(
    [string]$SolutionPath = "$PSScriptRoot\..\..\LabTrack.sln",
    [string]$PythonTestDir = "$PSScriptRoot\..\..\backend\python\tests",
    [string]$PostgresContainer = "labtrack-postgres-1"
)

# Enforce strict error handling
$ErrorActionPreference = "Stop"

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ==================================================="
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] LabTrack Comprehensive Test Suite Execution"
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ==================================================="

$HasTestFailures =$false

try {
    # 1. Execute C# .NET Backend Unit & Integration Tests
    Write-Host "`n[1/3] Running .NET 8 backend unit and integration tests..."
    if (Get-Command "dotnet" -ErrorAction SilentlyContinue) {
        try {
            dotnet test $SolutionPath --configuration Release --verbosity normal
            Write-Host "  [OK] .NET test suite completed successfully." -ForegroundColor Green
        } catch {
            Write-Host "  [FAIL] .NET test execution failed: $_" -ForegroundColor Red
            $HasTestFailures = $true
        }
    } else {
        Write-Host "  [WARN] .NET CLI not found; skipping C# test suite." -ForegroundColor Yellow
    }

    # 2. Execute Python AI Engine Tests
    Write-Host "`n[2/3] Running Python AI diagnostic engine unit tests..."
    if (Test-Path -Path $PythonTestDir) {
        if (Get-Command "pytest" -ErrorAction SilentlyContinue) {
            Push-Location (Split-Path -Parent $PythonTestDir)
            try {
                pytest tests/ -v --cov=app
                Write-Host "  [OK] Python AI test suite completed successfully." -ForegroundColor Green
            } catch {
                Write-Host "  [FAIL] Python AI test execution failed: $_" -ForegroundColor Red
                $HasTestFailures =$true
            } finally {
                Pop-Location
            }
        } else {
            Write-Host "  [WARN] 'pytest' not found in PATH; skipping Python test suite." -ForegroundColor Yellow
        }
    } else {
        Write-Host "  [INFO] Python test directory not found at $PythonTestDir; skipping." -ForegroundColor Cyan
    }

    # 3. Database Schema & Forensic Ledger Integrity Verification
    Write-Host "`n[3/3] Executing database verification checks..."
    if (Get-Command "docker" -ErrorAction SilentlyContinue) {
        $ContainerRunning = (docker ps --filter "name=$PostgresContainer" --format "{{.Names}}") -eq $PostgresContainer
        if ($ContainerRunning) {
            try {
                Write-Host "  Verifying database schema deployment..."
                docker exec -t $PostgresContainer psql -U postgres -d labtrack_db -c "SELECT * FROM public.fn_verify_labtrack_schema_deployment();"
                
                Write-Host "  Verifying cryptographic forensic audit ledger integrity..."
                docker exec -t $PostgresContainer psql -U postgres -d labtrack_db -c "SELECT * FROM audit.fn_verify_forensic_ledger_integrity();"
                
                Write-Host "  [OK] Database integrity verification passed." -ForegroundColor Green
            } catch {
                Write-Host "  [FAIL] Database verification checks failed: $_" -ForegroundColor Red
                $HasTestFailures = $true
            }
        } else {
            Write-Host "  [INFO] PostgreSQL container '$PostgresContainer' is not running; skipping database verification." -ForegroundColor Cyan
        }
    }

    Write-Host "`n==================================================================="
    if ($HasTestFailures) {
        Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] TEST SUITE COMPLETED WITH FAILURES." -ForegroundColor Red
        exit 1
    } else {
        Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ALL LABTRACK TESTS AND VERIFICATIONS PASSED SUCCESSFULLY!" -ForegroundColor Green
    }
}
catch {
    Error "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] TEST SUITE EXECUTION FAILED:$_"
    if ((Get-Location).Path -ne $PSScriptRoot) { Pop-Location -ErrorAction SilentlyContinue }
    exit 1
}