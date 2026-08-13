# run-cleanup.ps1
# Runs cleanup-broken-media.mjs against your Neon database: first as a dry run
# (shows what would change, nothing is touched), then asks if you want to
# actually apply it.
#
# BEFORE RUNNING:
# 1. Download "cleanup-broken-media.mjs" from the chat if you haven't already.
# 2. Have your Neon DATABASE_URL connection string ready (same one from your
#    Vercel env vars -- Settings -> Environment Variables -> DATABASE_URL).
#
# Run with: notepad run-cleanup.ps1  -> paste -> save -> then:
# powershell -ExecutionPolicy Bypass -File .\run-cleanup.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== Broken Media Cleanup ===" -ForegroundColor Cyan

$scriptPath = Read-Host "Full path to the downloaded cleanup-broken-media.mjs (e.g. C:\Users\PC\Downloads\cleanup-broken-media.mjs)"
$repoRoot = Read-Host "Full path to your 2torConnect repo root (press Enter if you're already in it)"
if ([string]::IsNullOrWhiteSpace($repoRoot)) { $repoRoot = Get-Location }

$dbUrl = Read-Host "Paste your DATABASE_URL (Neon connection string)"

if (-not (Test-Path $scriptPath)) {
    Write-Host "Can't find $scriptPath -- check the path." -ForegroundColor Red
    exit 1
}

# pg is a dependency of lib/db in this monorepo, so run the script from there
# so Node can resolve the "pg" package.
$dbPackageDir = Join-Path $repoRoot "lib\db"
if (-not (Test-Path $dbPackageDir)) {
    Write-Host "Can't find $dbPackageDir -- is repoRoot correct?" -ForegroundColor Red
    exit 1
}

$targetScript = Join-Path $dbPackageDir "cleanup-broken-media.mjs"
Copy-Item -Path $scriptPath -Destination $targetScript -Force

$env:DATABASE_URL = $dbUrl
Set-Location $dbPackageDir

Write-Host "`n--- DRY RUN (no changes yet) ---" -ForegroundColor Yellow
node cleanup-broken-media.mjs

Write-Host "`n--------------------------------" -ForegroundColor Yellow
$confirm = Read-Host "Does the list above look correct? Type YES to actually clear these broken references"
if ($confirm -eq "YES") {
    Write-Host "`n--- APPLYING ---" -ForegroundColor Yellow
    node cleanup-broken-media.mjs --apply
    Write-Host "`nDone. Broken references cleared." -ForegroundColor Green
} else {
    Write-Host "`nSkipped -- nothing was changed. Re-run this script anytime to apply." -ForegroundColor Cyan
}

# cleanup the copied script (optional, comment out if you want to keep it)
Remove-Item $targetScript -ErrorAction SilentlyContinue