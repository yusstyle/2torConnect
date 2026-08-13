<#
  reset-super-admin-v3.ps1
  --------------------------
  Fix: tsx exists inside artifacts/api-server's own dependencies (that's
  how the Vercel build finds it), but "pnpm exec" from the repo root
  couldn't see it. This installs tsx as a dev dependency at the workspace
  root first, so pnpm exec can resolve it from anywhere in the repo.
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== Reset Super Admin Password (v3) ===" -ForegroundColor Cyan

$scriptPath = "lib\db\reset-admin-password.ts"
if (-not (Test-Path $scriptPath)) {
    Write-Host "Could not find $scriptPath" -ForegroundColor Red
    exit 1
}

# ---------- Step 0: make sure tsx is actually available at the workspace root ----------
Write-Host ""
Write-Host "Checking for tsx..." -ForegroundColor Cyan
pnpm exec tsx --version 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "tsx not found at workspace root - installing it now (pnpm add -D tsx -w)..." -ForegroundColor Yellow
    pnpm add -D tsx -w
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install tsx. Check the error above." -ForegroundColor Red
        exit 1
    }
    Write-Host "tsx installed." -ForegroundColor Green
} else {
    Write-Host "tsx already available." -ForegroundColor Green
}

# ---------- Step 1: pull production env vars temporarily ----------
$tempEnvFile = ".env.reset-admin-temp"
Write-Host ""
Write-Host "Pulling Production env vars temporarily..." -ForegroundColor Cyan
vercel env pull $tempEnvFile --environment=production --yes 2>&1 | Write-Host

if (-not (Test-Path $tempEnvFile)) {
    Write-Host "Failed to pull env vars." -ForegroundColor Red
    exit 1
}

# ---------- Step 2: load DATABASE_URL / NEON_DATABASE_URL ----------
Get-Content $tempEnvFile | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?(.*?)"?\s*$') {
        $name = $matches[1]
        $value = $matches[2]
        if ($name -eq "DATABASE_URL" -or $name -eq "NEON_DATABASE_URL") {
            [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

if (-not $env:DATABASE_URL -and -not $env:NEON_DATABASE_URL) {
    Write-Host "Could not find DATABASE_URL or NEON_DATABASE_URL." -ForegroundColor Red
    Remove-Item $tempEnvFile -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "Database connection loaded for this session only." -ForegroundColor Green

# ---------- Step 3: get new password ----------
Write-Host ""
$pwSecure = Read-Host "New super admin password (input hidden, at least 8 characters)" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pwSecure)
$newPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

if ([string]::IsNullOrWhiteSpace($newPassword) -or $newPassword.Length -lt 8) {
    Write-Host "Password too short. Exiting without changes." -ForegroundColor Red
    Remove-Item $tempEnvFile -Force -ErrorAction SilentlyContinue
    exit 1
}

$env:NEW_ADMIN_PASSWORD = $newPassword

# ---------- Step 4: run the reset script ----------
Write-Host ""
Write-Host "Updating password in the production database..." -ForegroundColor Cyan
pnpm exec tsx $scriptPath 2>&1 | Write-Host
$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "Exit code from the script: $exitCode" -ForegroundColor DarkGray

# ---------- Step 5: clean up ----------
$env:NEW_ADMIN_PASSWORD = $null
$newPassword = $null
Remove-Item $tempEnvFile -Force -ErrorAction SilentlyContinue
Write-Host "Temporary env file deleted." -ForegroundColor DarkGray

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "Done. Log in at www.2torconnect.com with admin@2torconnect.com and your new password." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Still failed - see the output above." -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan