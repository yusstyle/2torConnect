<#
  reset-super-admin-v4.ps1
  --------------------------
  Fix: NEON_DATABASE_URL pulled from Vercel resolves to a bad host
  ("base"), and your code prefers it over DATABASE_URL when both are
  set. This version only ever sets DATABASE_URL for this process, and
  explicitly makes sure no NEON_DATABASE_URL leaks in to override it.
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== Reset Super Admin Password (v4) ===" -ForegroundColor Cyan

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

# ---------- Step 2: load ONLY DATABASE_URL, explicitly clear NEON_DATABASE_URL ----------
[System.Environment]::SetEnvironmentVariable("NEON_DATABASE_URL", $null, "Process")

$dbUrl = $null
Get-Content $tempEnvFile | ForEach-Object {
    if ($_ -match '^\s*DATABASE_URL\s*=\s*"?(.*?)"?\s*$') {
        $dbUrl = $matches[1]
    }
}

if (-not $dbUrl) {
    Write-Host "Could not find DATABASE_URL in the pulled env file." -ForegroundColor Red
    Remove-Item $tempEnvFile -Force -ErrorAction SilentlyContinue
    exit 1
}

[System.Environment]::SetEnvironmentVariable("DATABASE_URL", $dbUrl, "Process")

# Show just the host, to confirm it looks like a real Neon hostname this time
try {
    $parsedUri = [System.Uri]$dbUrl
    Write-Host "DATABASE_URL host resolved to: $($parsedUri.Host)" -ForegroundColor DarkGray
} catch {
    Write-Host "Could not parse DATABASE_URL as a URI - it may be malformed too." -ForegroundColor Yellow
}

Write-Host "Using DATABASE_URL only for this run (NEON_DATABASE_URL cleared)." -ForegroundColor Green

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