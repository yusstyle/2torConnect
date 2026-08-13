<#
  confirm-real-otp-v6.ps1
  ------------------------
  Same as v5, but defaults to the CONFIRMED real domain (www.2torconnect.com)
  instead of the wrong 2torconnect1.vercel.app guess. Offers the direct
  deployment URL as a fallback in case the custom domain's SSL cert is
  still provisioning.
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== 2torConnect: Confirm Real OTP (v6) ===" -ForegroundColor Cyan
Write-Host "Running from: $(Get-Location)" -ForegroundColor DarkGray

# ---------- 1. Check env vars are set on Vercel ----------
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "Vercel CLI not found. Skipping env var check." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Checking Vercel Production env vars..." -ForegroundColor Cyan

    $envList = vercel env ls production 2>&1
    Write-Host $envList

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

# ---------- 2. Hit the live endpoint for real ----------
Write-Host ""
Write-Host "--- Live send-otp test ---" -ForegroundColor Cyan
Write-Host "Option 1 (recommended first): direct deployment URL, works immediately" -ForegroundColor DarkGray
Write-Host "  2torconnect-2026-9behsklhi-yusstyle-s-projects.vercel.app" -ForegroundColor DarkGray
Write-Host "Option 2: your real custom domain, may still be provisioning SSL" -ForegroundColor DarkGray
Write-Host "  www.2torconnect.com" -ForegroundColor DarkGray
Write-Host ""
$domainInput = Read-Host "Domain to test, no https:// (press Enter to use the direct deployment URL)"
if ([string]::IsNullOrWhiteSpace($domainInput)) {
    $domain = "2torconnect-2026-9behsklhi-yusstyle-s-projects.vercel.app"
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
        Write-Host "NOT CONFIRMED: emailConfigured is still false on this domain." -ForegroundColor Red
        Write-Host "If you tested the custom domain and got this, try the direct deployment URL instead -" -ForegroundColor Yellow
        Write-Host "the custom domain may still be pointing at an older deployment during SSL setup." -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "If you used www.2torconnect.com, try the direct deployment URL instead - SSL may still be provisioning." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
