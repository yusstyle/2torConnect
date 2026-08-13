<#
  reset-super-admin-v7.ps1
  --------------------------
  Fix: the Vercel CLI hit a network error right before the last pull
  ("Failed to fetch dist-tags from npm"), which likely caused a
  TRUNCATED .env file write (DATABASE_URL came through as only 11
  characters - just "postgres://" with nothing after it). This version
  retries the pull automatically until DATABASE_URL is a realistic
  length, instead of accepting a corrupted pull.
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== Reset Super Admin Password (v7) ===" -ForegroundColor Cyan

$scriptPath = "lib\db\reset-admin-password-v3.ts"
if (-not (Test-Path $scriptPath)) {
    Write-Host "Could not find $scriptPath" -ForegroundColor Red
    exit 1
}

$tempEnvFile = ".env.reset-admin-temp"
$dbUrl = $null
$maxAttempts = 6

for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    Write-Host ""
    Write-Host "Pull attempt $attempt of $maxAttempts..." -ForegroundColor Cyan

    Remove-Item $tempEnvFile -Force -ErrorAction SilentlyContinue
    vercel env pull $tempEnvFile --environment=production --yes 2>&1 | Write-Host

    if (-not (Test-Path $tempEnvFile)) {
        Write-Host "Pull did not produce a file. Retrying in 5s..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        continue
    }

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

    if ($dbUrl -and $dbUrl.Length -gt 80 -and $dbUrl.StartsWith("postgres")) {
        Write-Host "Got a realistic-length DATABASE_URL this time: $($dbUrl.Length) characters" -ForegroundColor Green
        break
    } else {
        $len = if ($dbUrl) { $dbUrl.Length } else { 0 }
        Write-Host "DATABASE_URL looks truncated again (length: $len). Retrying in 5s..." -ForegroundColor Yellow
        $dbUrl = $null
        Start-Sleep -Seconds 5
    }
}

if (-not $dbUrl) {
    Write-Host ""
    Write-Host "Could not get a valid-length DATABASE_URL after $maxAttempts attempts." -ForegroundColor Red
    Write-Host "Check your internet connection, or verify the value directly in the dashboard:" -ForegroundColor Yellow
    Write-Host "https://vercel.com/yusstyle-s-projects/2torconnect-2026/settings/environment-variables" -ForegroundColor Yellow
    Remove-Item $tempEnvFile -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "Starts with: $($dbUrl.Substring(0, 20))" -ForegroundColor DarkGray
try {
    $parsed = [System.Uri]$dbUrl
    Write-Host "Parsed host: $($parsed.Host)" -ForegroundColor DarkGray
} catch {
    Write-Host "Could not parse as URI, but length looks reasonable - proceeding." -ForegroundColor Yellow
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