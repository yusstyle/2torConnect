# apply-auth-blob-fix.ps1
# Applies the fixed auth.ts (avatar/school-ID/investor-ID uploads now go to
# Vercel Blob instead of ephemeral /tmp), commits, and pushes.
#
# BEFORE RUNNING:
# 1. Download "auth.ts" from the chat (separate download, not this script).
# 2. Note the folder you saved it to (e.g. C:\Users\you\Downloads).
#
# Run with: notepad apply-auth-blob-fix.ps1  -> paste -> save -> then:
# powershell -ExecutionPolicy Bypass -File .\apply-auth-blob-fix.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== Apply auth.ts Blob Storage Fix ===" -ForegroundColor Cyan

$downloadedAuthTs = Read-Host "Full path to the downloaded auth.ts (e.g. C:\Users\you\Downloads\auth.ts)"
$repoRoot = Read-Host "Full path to your 2torConnect repo root (press Enter if you're already in it)"
if ([string]::IsNullOrWhiteSpace($repoRoot)) { $repoRoot = Get-Location }

$targetPath = Join-Path $repoRoot "artifacts\api-server\src\routes\auth.ts"

if (-not (Test-Path $downloadedAuthTs)) {
    Write-Host "Can't find $downloadedAuthTs -- check the path and try again." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $targetPath)) {
    Write-Host "Can't find $targetPath -- is repoRoot correct?" -ForegroundColor Red
    exit 1
}

Write-Host "`nCopying fixed file into place..." -ForegroundColor Yellow
Copy-Item -Path $downloadedAuthTs -Destination $targetPath -Force
Write-Host "Copied to $targetPath" -ForegroundColor Green

Set-Location $repoRoot
Write-Host "`n--- git status ---" -ForegroundColor Yellow
git status --short

Write-Host "`nCommitting and pushing..." -ForegroundColor Yellow
git add artifacts/api-server/src/routes/auth.ts
git commit -m "fix: route avatar/school-id/investor-id uploads through Vercel Blob (were vanishing from ephemeral /tmp)"
git push origin main

Write-Host "`n=== Done ===" -ForegroundColor Cyan
Write-Host "Vercel should auto-deploy from this push. Watch your dashboard's Deployments tab."
Write-Host "Once it's READY, try uploading a new avatar -- it should now persist and load correctly."
Write-Host "NOTE: old avatars uploaded before this fix are still gone (never actually persisted) --"
Write-Host "users with a broken avatarUrl will need to re-upload once."