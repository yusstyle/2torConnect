# run-cleanup-v2.ps1
# Same as run-cleanup.ps1, but reads DATABASE_URL from a text file instead of
# a live prompt -- pasting long connection strings directly into Read-Host has
# been truncating/corrupting them in this terminal.
#
# STEP 1: notepad db-url.txt
#   -> paste ONLY your Neon connection string (nothing else) -> save -> close
# STEP 2: notepad run-cleanup-v2.ps1
#   -> paste this whole script -> save -> close
# STEP 3: powershell -ExecutionPolicy Bypass -File .\run-cleanup-v2.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== Broken Media Cleanup (v2 - file-based DB URL) ===" -ForegroundColor Cyan

$dbUrlFile = Read-Host "Full path to db-url.txt (e.g. C:\Users\PC\Desktop\2torconnect2026\db-url.txt)"
$scriptPath = Read-Host "Full path to cleanup-broken-media.mjs (e.g. C:\Users\PC\Downloads\cleanup-broken-media.mjs)"
$repoRoot = Read-Host "Full path to your 2torConnect repo root (press Enter if you're already in it)"
if ([string]::IsNullOrWhiteSpace($repoRoot)) { $repoRoot = Get-Location }

if (-not (Test-Path $dbUrlFile)) {
    Write-Host "Can't find $dbUrlFile" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $scriptPath)) {
    Write-Host "Can't find $scriptPath" -ForegroundColor Red
    exit 1
}

$dbUrl = (Get-Content $dbUrlFile -Raw).Trim()

if ($dbUrl -notmatch "^postgres(ql)?://") {
    Write-Host "WARNING: this doesn't look like a valid connection string." -ForegroundColor Red
    Write-Host "It should start with postgres:// or postgresql:// -- got:"
    Write-Host $dbUrl.Substring(0, [Math]::Min(40, $dbUrl.Length)) + "..."
    $proceed = Read-Host "Continue anyway? (y/n)"
    if ($proceed -ne "y") { exit 1 }
}

Write-Host "Loaded connection string (length: $($dbUrl.Length) chars, starts with: $($dbUrl.Substring(0,[Math]::Min(20,$dbUrl.Length)))...)" -ForegroundColor Green

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

Remove-Item $targetScript -ErrorAction SilentlyContinue

Write-Host "`nReminder: delete db-url.txt when you're done, it has your DB password in plain text:" -ForegroundColor Yellow
Write-Host "  Remove-Item `"$dbUrlFile`""