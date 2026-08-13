<#
  reset-super-admin-v8.ps1
  --------------------------
  Fix: 6 consecutive pulls confirm DATABASE_URL is genuinely just
  "postgres://" (11 chars) on Vercel Production - broken at the source,
  not a pull/network glitch. But db/index.ts prefers NEON_DATABASE_URL
  over DATABASE_URL, and the live app clearly works, so NEON_DATABASE_URL
  must be the real, valid one. This pulls THAT variable instead.
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== Reset Super Admin Password (v8) ===" -ForegroundColor Cyan

$scriptPath = "lib\db\reset-admin-password-v3.ts"
if (-not (Test-Path $scriptPath)) {
    Write-Host "Could not find $scriptPath" -ForegroundColor Red
    exit 1
}

$tempEnvFile = ".env.reset-admin-temp"
Write-Host ""
Write-Host "Pulling Production env vars..." -ForegroundColor Cyan
Remove-Item $tempEnvFile -Force -ErrorAction SilentlyContinue
vercel env pull $tempEnvFile --environment=production --yes 2>&1 | Write-Host

if (-not (Test-Path $tempEnvFile)) {
    Write-Host "Pull failed to produce a file." -ForegroundColor Red
    exit 1
}

# ---------- Extract NEON_DATABASE_URL specifically ----------
$dbUrl = $null
$lines = Get-Content $tempEnvFile
foreach ($line in $lines) {
    if ($line.StartsWith("NEON_DATABASE_URL=")) {
        $value = $line.Substring("NEON_DATABASE_URL=".Length).Trim()
        if ($value.StartsWith('"') -and $value.EndsWith('"') -and $value.Length -ge 2) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        $dbUrl = $value
        break
    }
}

if (-not $dbUrl) {
    Write-Host "Could not find a NEON_DATABASE_URL= line in the pulled file." -ForegroundColor Red
    Write-Host "Showing all variable names found, for reference:" -ForegroundColor Yellow
    $lines | ForEach-Object {
        if ($_ -match '^([A-Za-z_][A-Za-z0-9_]*)=') { Write-Host "  $($matches[1])" -ForegroundColor DarkGray }
    }
    Remove-Item $tempEnvFile -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host ""
Write-Host "NEON_DATABASE_URL length: $($dbUrl.Length) characters" -ForegroundColor DarkGray

if ($dbUrl.Length -lt 30) {
    Write-Host "This also looks too short to be real. Full value: $dbUrl" -ForegroundColor Red
    Remove-Item $tempEnvFile -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "Starts with: $($dbUrl.Substring(0, 20))" -ForegroundColor DarkGray
try {
    $parsed = [System.Uri]$dbUrl
    Write-Host "Parsed host: $($parsed.Host)" -ForegroundColor DarkGray
    if ($parsed.Host -notmatch "neon\.tech") {
        Write-Host "Warning: host doesn't look like a typical Neon hostname - double check before proceeding." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Could not parse as URI: $($_.Exception.Message)" -ForegroundColor Yellow
}

# ---------- Get new password ----------
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

# ---------- Run with connection string + password as arguments ----------
Write-Host ""
Write-Host "Updating password in the production database..." -ForegroundColor Cyan
pnpm exec tsx $scriptPath $dbUrl $newPassword 2>&1 | Write-Host
$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "Exit code: $exitCode" -ForegroundColor DarkGray

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