<#
.SYNOPSIS
    LabTrack Automated Database Restoration Script (PowerShell Core / Windows PowerShell)
.DESCRIPTION
    Decrypts an encrypted PostgreSQL backup archive and restores it to the PostgreSQL 16
    LabTrack database instance, followed by automated schema and ledger integrity verification.
.NOTES
    Target: PostgreSQL 16 (Multi-Schema Instance)
    Dependencies: Docker, OpenSSL
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,
    [string]$ContainerName = "labtrack-postgres-1",
    [string]$DatabaseName = "labtrack_db",
    [string]$DatabaseUser = "postgres"
)

# Enforce strict error handling
$ErrorActionPreference = "Stop"

# Retrieve encryption key from environment variable
$EncryptionKey = $env:BACKUP_BACKEND_ENCRYPTION_KEY
if (-not $EncryptionKey) {
    Write-Error "CRITICAL: The BACKUP_BACKEND_ENCRYPTION_KEY environment variable is not set."
    exit 1
}

if (-not (Test-Path -Path $BackupFile)) {
    Write-Error "Backup file not found: $BackupFile"
    exit 1
}

$TempRestoreFile = [System.IO.Path]::GetTempFileName()
$DecryptedDumpFile = "$TempRestoreFile.dump"
Remove-Item -Path $TempRestoreFile -Force

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting LabTrack database restoration from: $BackupFile..."

try {
    # Decrypt backup archive using OpenSSL AES-256-CBC
    Write-Host "Decrypting backup archive..."
    $OpenSslArgs = @(
        "enc", "-aes-256-cbc", "-d",
        "-in", $BackupFile,
        "-out", $DecryptedDumpFile,
        "-k", $EncryptionKey
    )
    & openssl @OpenSslArgs

    if (-not (Test-Path -Path $DecryptedDumpFile) -or (Get-Item $DecryptedDumpFile).Length -eq 0) {
        throw "Decryption failed or resulted in an empty dump file."
    }

    Write-Host "Dropping and recreating database '$DatabaseName' in container '$ContainerName'..."
    docker exec -t $ContainerName psql -U $DatabaseUser -d postgres -c "DROP DATABASE IF EXISTS $DatabaseName;"
    docker exec -t $ContainerName psql -U $DatabaseUser -d postgres -c "CREATE DATABASE $DatabaseName;"

    Write-Host "Copying decrypted dump to container staging area..."
    docker cp $DecryptedDumpFile "${ContainerName}:/tmp/restore.dump"

    Write-Host "Restoring database from custom format dump..."
    docker exec -t $ContainerName pg_restore -U $DatabaseUser -d $DatabaseName --clean --if-exists /tmp/restore.dump

    Write-Host "Cleaning up container staging files..."
    docker exec -t $ContainerName rm /tmp/restore.dump

    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Database restoration completed successfully."

    # Post-restoration verification
    Write-Host "Verifying schema deployment and forensic ledger integrity..."
    docker exec -t $ContainerName psql -U $DatabaseUser -d $DatabaseName -c "SELECT * FROM public.fn_verify_labtrack_schema_deployment();"
    docker exec -t $ContainerName psql -U $DatabaseUser -d $DatabaseName -c "SELECT * FROM audit.fn_verify_forensic_ledger_integrity();"
}
catch {
    Write-Error "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR during database restoration: $_"
    exit 1
}
finally {
    if (Test-Path -Path $DecryptedDumpFile) {
        Remove-Item -Path $DecryptedDumpFile -Force
    }
}