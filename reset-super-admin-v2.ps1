<#
  reset-super-admin-v2.ps1
  --------------------------
  Same as v1, but uses "pnpm exec tsx" instead of "npx tsx" - npx was
  trying to fetch a fresh, unrelated copy of tsx instead of using the one
  already installed in this pnpm workspace, and failed silently. pnpm
  exec resolves it correctly using the workspace's own node_modules.
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== Reset Super Admin Password (v2) ===" -ForegroundColor Cyan

$scriptPath = "lib\db\reset-admin-password.ts"
if (-not (Test-Path $scriptPath)) {
    Write-Host "Could not find $scriptPath" -ForegroundColor Red
    exit 1
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

# ---------- Step 2: load DATABASE_URL / NEON_DATABASE_URL into this session ----------
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

# ---------- Step 4: run the reset script with pnpm exec, full output visible ----------
Write-Host ""
Write-Host "Updating password in the production database (using pnpm exec tsx)..." -ForegroundColor Cyan
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
    Write-Host "Still failed - see the full output above for the real error message this time." -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan