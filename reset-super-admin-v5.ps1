<#
  reset-super-admin-v5.ps1
  --------------------------
  Fix: previous versions' regex-based .env parsing produced an unreliable
  DATABASE_URL. This version extracts it with simple string splitting
  (no regex), and the reset script itself (v2) now uses its own direct
  connection with DATABASE_URL only, bypassing the shared db/index.ts
  file that prefers the broken NEON_DATABASE_URL.

  Requires lib\db\reset-admin-password-v2.ts to exist (see instructions).
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== Reset Super Admin Password (v5) ===" -ForegroundColor Cyan

$scriptPath = "lib\db\reset-admin-password-v2.ts"
if (-not (Test-Path $scriptPath)) {
    Write-Host "Could not find $scriptPath" -ForegroundColor Red
    Write-Host "Create it first with notepad lib\db\reset-admin-password-v2.ts" -ForegroundColor Yellow
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

# ---------- Step 2: extract DATABASE_URL with simple string splitting, no regex ----------
[System.Environment]::SetEnvironmentVariable("NEON_DATABASE_URL", $null, "Process")

$dbUrl = $null
$lines = Get-Content $tempEnvFile
foreach ($line in $lines) {
    if ($line.StartsWith("DATABASE_URL=")) {
        $value = $line.Substring("DATABASE_URL=".Length)
        $value = $value.Trim()
        if ($value.StartsWith('"') -and $value.EndsWith('"') -and $value.Length -ge 2) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        $dbUrl = $value
        break
    }
}

if (-not $dbUrl) {
    Write-Host "Could not find a DATABASE_URL= line in the pulled file." -ForegroundColor Red
    Remove-Item $tempEnvFile -Force -ErrorAction SilentlyContinue
    exit 1
}

[System.Environment]::SetEnvironmentVariable("DATABASE_URL", $dbUrl, "Process")

Write-Host "DATABASE_URL length: $($dbUrl.Length) characters" -ForegroundColor DarkGray
Write-Host "DATABASE_URL starts with: $($dbUrl.Substring(0, [Math]::Min(20, $dbUrl.Length)))" -ForegroundColor DarkGray
Write-Host "DATABASE_URL ends with: $($dbUrl.Substring([Math]::Max(0, $dbUrl.Length - 30)))" -ForegroundColor DarkGray

try {
    $parsedUri = [System.Uri]$dbUrl
    Write-Host "Parsed host: $($parsedUri.Host)" -ForegroundColor DarkGray
} catch {
    Write-Host "Could not parse as URI: $($_.Exception.Message)" -ForegroundColor Yellow
}

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