<#
  confirm-real-otp-v5.ps1
  ------------------------
  Fix: your repo uses Vercel's monorepo linking format (.vercel/repo.json),
  not the older single-project format (.vercel/project.json). This version
  stops guessing from file presence and just asks the Vercel CLI directly
  whether env vars exist - the CLI itself knows how it's linked.
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== 2torConnect: Confirm Real OTP (v5) ===" -ForegroundColor Cyan
Write-Host "Running from: $(Get-Location)" -ForegroundColor DarkGray

# ---------- 1. Check env vars are set on Vercel ----------
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "Vercel CLI not found. Skipping env var check - install with 'npm install -g vercel' if you want this step." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Checking Vercel Production env vars..." -ForegroundColor Cyan

    $envList = vercel env ls production 2>&1
    $envExitCode = $LASTEXITCODE

    Write-Host $envList

    if ($envExitCode -ne 0) {
        Write-Host ""
        Write-Host "The 'vercel env ls production' command itself failed (see output above)." -ForegroundColor Red
        Write-Host "This usually means: not logged in, wrong project selected, or need to pick a specific sub-project in this monorepo." -ForegroundColor Yellow
        Write-Host "Try running 'vercel env ls production' by itself to see the raw error." -ForegroundColor Yellow
    } else {
        if ($envList -match "SMTP_USER") {
            Write-Host "SMTP_USER: found in Production" -ForegroundColor Green
        } else {
            Write-Host "SMTP_USER: NOT found in Production" -ForegroundColor Red
        }

        if ($envList -match "SMTP_PASS") {
            Write-Host "SMTP_PASS: found in Production" -ForegroundColor Green
        } else {
            Write-Host "SMTP_PASS: NOT found in Production" -ForegroundColor Red
        }
    }
}

# ---------- 2. Hit the live endpoint for real ----------
Write-Host ""
Write-Host "--- Live send-otp test ---" -ForegroundColor Cyan
$domainInput = Read-Host "Your live domain, no https:// (press Enter to use 2torconnect1.vercel.app)"
if ([string]::IsNullOrWhiteSpace($domainInput)) {
    $domain = "2torconnect1.vercel.app"
} else {
    $domain = $domainInput
}
$testEmail = Read-Host "A real email address that exists in your users table"

$uri = "https://$domain/api/auth/send-otp"
$body = @{ email = $testEmail } | ConvertTo-Json

Write-Host ""
Write-Host "Calling $uri ..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json" -Body $body
    Write-Host ""
    Write-Host "--- Response ---" -ForegroundColor Green
    $response | Format-List

    if ($response.emailConfigured -eq $true) {
        Write-Host ""
        Write-Host "CONFIRMED: SMTP is configured on the live deployment and a real email was sent." -ForegroundColor Green
        Write-Host "Check the inbox (and spam folder) of $testEmail." -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "NOT CONFIRMED: emailConfigured is false. Note that emailSent can read true even when nothing was emailed - your email.ts dev fallback returns true after only logging to the console, so emailConfigured is the field that actually matters here." -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Double check the domain is correct and reachable." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
