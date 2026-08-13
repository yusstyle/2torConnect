<#
  reset-super-admin-v6.ps1
  --------------------------
  Fix: v5 still got "ENOTFOUND base" even with a different (11-char,
  truncated) DATABASE_URL value, which means something else - likely a
  local .env or .env.local file that dotenv auto-loads - was silently
  overriding what we set via $env:. This version:
    1. Checks for and shows any local .env* files that could interfere
    2. Passes the connection string directly as a CLI ARGUMENT instead
       of an environment variable, so nothing can override it
    3. Shows the FULL raw DATABASE_URL line from the Vercel pull (since
       an 11-character value clearly isn't a real secret worth hiding)
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== Reset Super Admin Password (v6) ===" -ForegroundColor Cyan

$scriptPath = "lib\db\reset-admin-password-v3.ts"
if (-not (Test-Path $scriptPath)) {
    Write-Host "Could not find $scriptPath" -ForegroundColor Red
    Write-Host "Create it first with notepad lib\db\reset-admin-password-v3.ts" -ForegroundColor Yellow
    exit 1
}

# ---------- Step 0: check for local .env files that could be interfering ----------
Write-Host ""
Write-Host "Checking for local .env files in this folder that could override things..." -ForegroundColor Cyan
$envFiles = Get-ChildItem -Filter ".env*" -File -ErrorAction SilentlyContinue
if ($envFiles) {
    foreach ($f in $envFiles) {
        Write-Host "Found: $($f.Name) ($($f.Length) bytes)" -ForegroundColor Yellow
        $dbLine = Select-String -Path $f.FullName -Pattern "DATABASE_URL" -ErrorAction SilentlyContinue
        if ($dbLine) {
            Write-Host "  Contains a DATABASE_URL line:" -ForegroundColor Yellow
            $dbLine | ForEach-Object { Write-Host "  $($_.Line)" -ForegroundColor Yellow }
        }
    }
} else {
    Write-Host "No local .env files found in this folder." -ForegroundColor Green
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

# ---------- Step 2: extract DATABASE_URL, show it in FULL (it's clearly not a real secret if short) ----------
$dbUrl = $null
$lines = Get-Content $tempEnvFile
foreach ($line in $lines) {
    if ($line.StartsWith("DATABASE_URL=")) {
        $value = $line.Substring("DATABASE_URL=".Length).Trim()
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

Write-Host ""
Write-Host "DATABASE_URL length: $($dbUrl.Length) characters" -ForegroundColor DarkGray
if ($dbUrl.Length -lt 50) {
    Write-Host "FULL value (short enough that it's clearly not a usable secret as-is): $dbUrl" -ForegroundColor Yellow
} else {
    Write-Host "Starts with: $($dbUrl.Substring(0, 20))" -ForegroundColor DarkGray
    Write-Host "Ends with: $($dbUrl.Substring([Math]::Max(0, $dbUrl.Length - 30)))" -ForegroundColor DarkGray
}

if ($dbUrl.Length -lt 30) {
    Write-Host ""
    Write-Host "This is too short to be a real Neon connection string." -ForegroundColor Red
    Write-Host "The DATABASE_URL value on Vercel Production itself may be broken/truncated." -ForegroundColor Red
    Write-Host "Check https://vercel.com/yusstyle-s-projects/2torconnect-2026/settings/environment-variables" -ForegroundColor Yellow
    Write-Host "and verify DATABASE_URL has a full, real value (starts with postgres:// or postgresql://" -ForegroundColor Yellow
    Write-Host "and includes a real host like ...neon.tech in it)." -ForegroundColor Yellow
    $proceed = Read-Host "Continue anyway with this value? (y/n)"
    if ($proceed -ne 'y') {
        Remove-Item $tempEnvFile -Force -ErrorAction SilentlyContinue
        exit 1
    }
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

# ---------- Step 4: run with connection string + password as ARGUMENTS, not env vars ----------
Write-Host ""
Write-Host "Updating password in the production database..." -ForegroundColor Cyan
pnpm exec tsx $scriptPath $dbUrl $newPassword 2>&1 | Write-Host
$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "Exit code from the script: $exitCode" -ForegroundColor DarkGray

# ---------- Step 5: clean up ----------
$newPassword = $null
$dbUrl = $null
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