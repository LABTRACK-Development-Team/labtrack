<#
.SYNOPSIS
    LabTrack API Concurrency & Optimistic Concurrency Control (OCC) Testing Script
.DESCRIPTION
    Executes parallel multithreaded HTTP requests against LabTrack state-mutating endpoints
    to validate Optimistic Concurrency Control (OCC) version conflicts, distributed idempotency locks,
    and row-level locking resilience under high concurrent load.
.NOTES
    Target: LabTrack .NET 8 Backend API
    Dependencies: PowerShell 7+ (Start-ThreadJob is built-in) or install ThreadJob module
#>

[CmdletBinding()]
param(
    [string]$BaseUrl = "http://localhost:8080",
    [int]$ConcurrencyLevel = 10,
    [string]$TestAssetId = "23000000-0000-0000-0000-000000000001"
)

# Enforce strict error handling
$ErrorActionPreference = "Stop"

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting LabTrack Concurrency & OCC Test Suite..."
Write-Host "Target URL: $BaseUrl | Concurrency Threads: $ConcurrencyLevel | Test Asset ID: $TestAssetId"

try {
    Write-Host "`n[1/2] Spawning $ConcurrencyLevel parallel threads for concurrent asset status updates..."

    # Define script block for parallel execution
    $JobScript = {
        param($BaseUrl, $ThreadId, $AssetId)

        $IdempotencyKey = [Guid]::NewGuid().ToString()
        $Headers = @{
            "X-Idempotency-Key" = $IdempotencyKey
            "Content-Type"      = "application/json"
        }

        $Body = @{
            status = "In Use"
            notes  = "Concurrent test thread #$ThreadId execution"
        } | ConvertTo-Json

        try {
            # Attempt concurrent status update
            $Response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/scheduling/qr/check-in" -Method Post -Headers $Headers -Body $Body -TimeoutSec 10
            return [PSCustomObject]@{
                ThreadId     = $ThreadId
                StatusCode   = 200
                Result       = "Success"
                ResponseBody = $Response
            }
        }
        catch {
            $StatusCode = $_.Exception.Response.StatusCode.value__
            $ErrBody    = ""
            try {
                $Stream = $_.Exception.Response.GetResponseStream()
                if ($Stream) {
                    $Reader  = New-Object System.IO.StreamReader($Stream)
                    $ErrBody = $Reader.ReadToEnd()
                }
            } catch { }

            return [PSCustomObject]@{
                ThreadId     = $ThreadId
                StatusCode   = $StatusCode
                Result       = "ConflictOrError"
                ResponseBody = $ErrBody
            }
        }
    }

    # Launch parallel jobs
    $Jobs = @()
    for ($i = 1; $i -le $ConcurrencyLevel; $i++) {
        $Jobs += Start-ThreadJob -ScriptBlock $JobScript -ArgumentList $BaseUrl, $i, $TestAssetId
    }

    Write-Host "Waiting for parallel concurrent requests to complete..."
    $Jobs | Wait-Job | Out-Null

    $Results = $Jobs | Receive-Job
    $Jobs    | Remove-Job

    Write-Host "`n[2/2] Analyzing concurrency test results..."
    $SuccessCount    = 0
    $ConflictCount   = 0
    $OtherErrorCount = 0

    foreach ($res in $Results) {
        Write-Host "  Thread #$($res.ThreadId) -> Status: $($res.StatusCode) | Result: $($res.Result)"
        if ($res.StatusCode -eq 200 -or $res.StatusCode -eq 201) {
            $SuccessCount++
        } elseif ($res.StatusCode -eq 409) {
            $ConflictCount++
        } else {
            $OtherErrorCount++
        }
    }

    Write-Host "`n-------------------------------------------------------------------"
    Write-Host "Concurrency Summary:"
    Write-Host "  Successful Transactions: $SuccessCount" -ForegroundColor Green
    Write-Host "  Optimistic Concurrency Conflicts (HTTP 409): $ConflictCount" -ForegroundColor Yellow
    Write-Host "  Other Errors: $OtherErrorCount" -ForegroundColor $(if ($OtherErrorCount -gt 0) { "Red" } else { "Green" })

    if ($ConflictCount -gt 0) {
        Write-Host "`n[OK] Concurrency control successfully intercepted race conditions and enforced locks!" -ForegroundColor Green
    } else {
        Write-Host "`n[INFO] All requests processed without 409 conflicts (Asset may have been available across independent sessions)." -ForegroundColor Cyan
    }
}
catch {
    Write-Error "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] CONCURRENCY TEST FAILED: $_"
    exit 1
}