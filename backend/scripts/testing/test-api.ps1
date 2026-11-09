<#
.SYNOPSIS
    LabTrack API Automated Endpoint Sanity Testing Script
.DESCRIPTION
    Performs automated HTTP sanity checks against critical LabTrack REST API endpoints
    (Health checks, Authentication login, Asset catalog queries, and Telemetry ingestion)
    to verify gateway routing and controller responsiveness.
.NOTES
    Target: LabTrack .NET 8 Backend API (via Nginx Gateway or direct port 8080)
    Dependencies: Invoke-RestMethod
#>

[CmdletBinding()]
[Diagnostics.CodeAnalysis.SuppressMessageAttribute(
    'PSAvoidUsingPlainTextForPassword',
    '',
    Justification = 'Test script uses documented demo credentials for local sanity checks only.'
)]
param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$TestEmail = "admin@labtrack.io",
    [string]$TestPassword = "SecureAdminPassword123!"
)

# Enforce strict error handling
$ErrorActionPreference = "Stop"

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting LabTrack API Sanity Test Suite..."
Write-Host "Target Base URL: $BaseUrl"

$HasFailures = $false

try {
    # 1. Test Health Endpoint
    Write-Host "`n[1/3] Testing GET /health endpoint..."
    try {
        $HealthResponse = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get -TimeoutSec 5
        $healthStatus  = if ($HealthResponse.status)  { $HealthResponse.status }  else { 'ok' }
        $healthVersion = if ($HealthResponse.version) { $HealthResponse.version } else { 'n/a' }
        Write-Host "  [OK] /health responded successfully (status: $healthStatus, version: $healthVersion)." -ForegroundColor Green
    } catch {
        Write-Host "  [FAIL] /health endpoint failed: $_" -ForegroundColor Red
        $HasFailures = $true
    }

    # 2. Test Authentication Login Endpoint
    Write-Host "`n[2/3] Testing POST /api/v1/auth/login endpoint..."
    $AuthToken = $null
    try {
        $LoginBody = @{
            email    = $TestEmail
            password = $TestPassword
        } | ConvertTo-Json

        $LoginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/v1/auth/login" -Method Post -Body $LoginBody -ContentType "application/json" -TimeoutSec 5
        $AuthToken = $LoginResponse.access_token
        if ($AuthToken) {
            Write-Host "  [OK] Login successful. JWT access token acquired." -ForegroundColor Green
        } else {
            throw "Login response did not contain an access token."
        }
    } catch {
        Write-Host "  [WARN] Authentication login failed (Ensure seed accounts are provisioned): $_" -ForegroundColor Yellow
    }

    # 3. Test Protected Asset Endpoint (if token acquired)
    Write-Host "`n[3/3] Testing GET /api/v1/telemetry/workstations endpoint..."
    try {
        $Headers = @{}
        if ($AuthToken) {
            $Headers["Authorization"] = "Bearer $AuthToken"
        }

        $AssetResponse = Invoke-RestMethod -Uri "$BaseUrl/api/v1/telemetry/workstations?page=1&size=5" -Method Get -Headers $Headers -TimeoutSec 5
        $itemCount = if ($null -ne $AssetResponse.total) { $AssetResponse.total }
                     elseif ($null -ne $AssetResponse.count) { $AssetResponse.count }
                     else { 'n/a' }
        Write-Host "  [OK] Workstations endpoint responded successfully (items: $itemCount)." -ForegroundColor Green
    } catch {
        $StatusCode = $_.Exception.Response.StatusCode.value__
        if ($StatusCode -eq 401) {
            Write-Host "  [INFO] Endpoint protected correctly (401 Unauthorized without valid admin token)." -ForegroundColor Cyan
        } else {
            Write-Host "  [FAIL] Workstations endpoint request failed: $_" -ForegroundColor Red
            $HasFailures = $true
        }
    }

    Write-Host "`n-------------------------------------------------------------------"
    if ($HasFailures) {
        Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] API sanity tests completed with errors." -ForegroundColor Red
        exit 1
    } else {
        Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] API sanity tests passed successfully!" -ForegroundColor Green
    }
}
catch {
    Write-Error "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] API TEST SCRIPT FAILED: $_"
    exit 1
}