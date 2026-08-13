# run-cleanup-v3.ps1
# No typing paths this time -- it searches your Desktop, Downloads, and the
# current folder automatically for the two files it needs.
#
# BEFORE RUNNING, just make sure these two files exist somewhere in
# Desktop, Downloads, or this folder (C:\Users\PC\Desktop\2torconnect2026):
#   - db-url.txt                (contains ONLY your Neon connection string)
#   - cleanup-broken-media.mjs  (downloaded from the chat)
#
# Run with: notepad run-cleanup-v3.ps1  -> paste -> save -> then:
# powershell -ExecutionPolicy Bypass -File .\run-cleanup-v3.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== Broken Media Cleanup (v3 - auto-discovery) ===" -ForegroundColor Cyan

$searchDirs = @(
    (Get-Location).Path,
    "$env:USERPROFILE\Desktop",
    "$env:USERPROFILE\Desktop\2torconnect2026",
    "$env:USERPROFILE\Downloads"
) | Select-Object -Unique

function Find-File($name) {
    foreach ($dir in $searchDirs) {
        $candidate = Join-Path $dir $name
        if (Test-Path $candidate) { return $candidate }
    }
    foreach ($root in @("$env:USERPROFILE\Desktop", "$env:USERPROFILE\Downloads")) {
        if (Test-Path $root) {
            $found = Get-ChildItem -Path $root -Filter $name -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) { return $found.FullName }
        }
    }
    return $null
}

Write-Host "Searching for db-url.txt and cleanup-broken-media.mjs..." -ForegroundColor Yellow

$dbUrlFile = Find-File "db-url.txt"
$scriptPath = Find-File "cleanup-broken-media.mjs"

if (-not $dbUrlFile) {
    Write-Host "`n[MISSING] db-url.txt not found anywhere in Desktop/Downloads/current folder." -ForegroundColor Red
    Write-Host "Create it first:"
    Write-Host "  1. Run: notepad db-url.txt"
    Write-Host "  2. Click Yes to create it"
    Write-Host "  3. Paste ONLY your Neon connection string (starts with postgres://)"
    Write-Host "  4. Save, close, then re-run this script."
    exit 1
}
Write-Host "[OK] Found db-url.txt at: $dbUrlFile" -ForegroundColor Green

if (-not $scriptPath) {
    Write-Host "`n[MISSING] cleanup-broken-media.mjs not found anywhere in Desktop/Downloads/current folder." -Foreground