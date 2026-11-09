<#
.SYNOPSIS
    LabTrack Automated Database Backup Script (PowerShell Core / Windows PowerShell)
.DESCRIPTION
    Executes a compressed schema-aware backup of the PostgreSQL 16 database instance,
    encrypts the archive, and rotates old snapshots according to retention policies.
.NOTES
    Target: PostgreSQL 16 (Multi-Schema Instance)
    Dependencies: Docker, OpenSSL
#>

[CmdletBinding()]
param(
    [string]$BackupDir = "C:\LabTrack\Backups",
    [string]$ContainerName = "labtrack-postgres-1",
    [string]$DatabaseName = "labtrack_db",
    [string]$DatabaseUser = "postgres",
    [int]$RetentionDays = 30
)

# Enforce strict error handling
$ErrorActionPreference = "Stop"

# Retrieve encryption key from environment variable
$EncryptionKey = $env:BACKUP_BACKEND_ENCRYPTION_KEY
if (-not $EncryptionKey) {
    Write-Error "CRITICAL: The BACKUP_BACKEND_ENCRYPTION_KEY environment variable is not set."
    exit 1
}

# Ensure backup directory exists
if (-not (Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFileRaw = Join-Path $BackupDir "labtrack_backup_$Timestamp.dump"
$BackupFileEnc = "$BackupFileRaw.enc"

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting LabTrack backup for database: $DatabaseName..."

try {
    # Execute pg_dump inside container and stream custom-format compressed output to host
    Write-Host "Executing pg_dump from container '$ContainerName'..."
    docker exec -t $ContainerName pg_dump -U $DatabaseUser -d $DatabaseName --format=custom --compress=9 --blobs > $BackupFileRaw

    if (-not (Test-Path -Path $BackupFileRaw) -or (Get-Item $BackupFileRaw).Length -eq 0) {
        throw "Backup dump file generation failed or resulted in an empty file."
    }

    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Backup successfully created: $BackupFileRaw"

    # Encrypt backup archive using OpenSSL AES-256-CBC
    Write-Host "Encrypting backup archive..."
    $OpenSslArgs = @(
        "enc", "-aes-256-cbc", "-salt",
        "-in", $BackupFileRaw,
        "-out", $BackupFileEnc,
        "-k", $EncryptionKey
    )
    & openssl @OpenSslArgs

    # Remove unencrypted dump
    Remove-Item -Path $BackupFileRaw -Force
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Encryption complete: $BackupFileEnc"

    # Prune backups older than retention period
    Write-Host "Pruning backup archives older than $RetentionDays days..."
    Get-ChildItem -Path $BackupDir -Filter "labtrack_backup_*.dump.enc" | 
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) } | 
        ForEach-Object {
            Remove-Item $_.FullName -Force
            Write-Host "Pruned old archive: $($_.Name)"
        }

    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Backup and rotation routine completed successfully."
}
catch {
    Write-Error "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR during backup execution: $_"
    if (Test-Path -Path $BackupFileRaw) { Remove-Item -Path $BackupFileRaw -Force }
    exit 1
}