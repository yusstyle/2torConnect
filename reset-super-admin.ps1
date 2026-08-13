<#
  reset-super-admin.ps1
  -----------------------
  Resets the super admin (admin@2torconnect.com) password directly in
  your production Neon database.

  How it works:
    1. Pulls your Production env vars into a TEMPORARY local file using
       the Vercel CLI (this includes DATABASE_URL, needed to connect)
    2. Asks you for a new password (hidden input)
    3. Runs reset-admin-password.ts against that database
    4. Deletes the temporary env file immediately after, so the
       production DB connection string doesn't sit on disk

  Run this from C:\Users\PC\Desktop\2torconnect2026 (repo root).
  Requires reset-admin-password.ts to already be at lib\db\reset-admin-password.ts
  (see instructions below if it's not there yet).
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== Reset Super Admin Password ===" -ForegroundColor Cyan

$scriptPath = "lib\db\reset-admin-password.ts"
if (-not (Test-Path $scriptPath)) {
    Write-Host "Could not find $scriptPath" -ForegroundColor Red
    Write-Host "Create it first with notepad lib\db\reset-admin-password.ts and paste the content Claude provided." -ForegroundColor Yellow
    exit 1
}

# ---------- Step 1: pull production env vars temporarily ----------
$tempEnvFile = ".env.reset-admin-temp"
Write-Host ""
Write-Host "Pulling Production env vars temporarily..." -ForegroundColor Cyan
vercel env pull $tempEnvFile --environment=production --yes 2>&1 | Write-Host

if (-not (Test-Path $tempEnvFile)) {
    Write-Host "Failed to pull env vars. Check you're linked to the right Vercel project." -ForegroundColor Red
    exit 1
}

# ---------- Step 2: load DATABASE_URL / NEON_DATABASE_URL from it into this session only ----------
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
    Write-Host "Could not find DATABASE_URL or NEON_DATABASE_URL in the pulled env file." -ForegroundColor Red
    Remove-Item $tempEnvFile -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "Database connection loaded for this session only (not saved anywhere)." -ForegroundColor Green

# ---------- Step 3: get new password ----------
Write-Host ""
$pwSecure = Read-Host "New super admin password (input hidden, choose something strong)" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pwSecure)
$newPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

if ([string]::IsNullOrWhiteSpace($newPassword) -or $newPassword.Length -lt 8) {
    Write-Host "Password must be at least 8 characters. Exiting without changes." -ForegroundColor Red
    Remove-Item $tempEnvFile -Force -ErrorAction SilentlyContinue
    exit 1
}

$env:NEW_ADMIN_PASSWORD = $newPassword

# ---------- Step 4: run the reset script ----------
Write-Host ""
Write-Host "Updating password in the production database..." -ForegroundColor Cyan
npx tsx $scriptPath

$exitCode = $LASTEXITCODE

# ---------- Step 5: clean up secrets from this session ----------
$env:NEW_ADMIN_PASSWORD = $null
$newPassword = $null
Remove-Item $tempEnvFile -Force -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "Temporary env file deleted." -ForegroundColor DarkGray

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "Done. Log in at www.2torconnect.com with admin@2torconnect.com and your new password." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "The reset script reported an error - see output above." -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan