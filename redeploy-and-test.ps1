<#
  redeploy-and-test.ps1
  -----------------------
  fix-smtp-auth.ps1 succeeded at setting the fresh App Password, but the
  redeploy itself failed with "Error: fetch failed" (a transient network
  issue between the Vercel CLI and its servers). This script retries the
  deploy a few times, then re-tests send-otp once it's live.
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== Redeploy + Test ===" -ForegroundColor Cyan

$maxAttempts = 4
$deployed = $false

for ($i = 1; $i -le $maxAttempts; $i++) {
    Write-Host ""
    Write-Host "Deploy attempt $i of $maxAttempts..." -ForegroundColor Cyan
    vercel --prod 2>&1 | Tee-Object -Variable deployOutput | Write-Host

    if ($deployOutput -match "Error: fetch failed" -or $deployOutput -match "Error:") {
        Write-Host "Attempt $i failed. Waiting 10 seconds before retrying..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    } else {
        $deployed = $true
        break
    }
}

if (-not $deployed) {
    Write-Host ""
    Write-Host "Deploy kept failing after $maxAttempts attempts." -ForegroundColor Red
    Write-Host "Check your internet connection, then try running 'vercel --prod' by itself." -ForegroundColor Yellow
    Write-Host "If it keeps happening, it may be Vercel's API having issues - check https://www.vercel-status.com" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Deploy succeeded. Waiting for it to finish going live..." -ForegroundColor Green
Read-Host "Press Enter once the Vercel dashboard shows this deployment as 'Ready'"

# ---------- Re-test ----------
Write-Host ""
Write-Host "Testing send-otp with the fresh App Password..." -ForegroundColor Cyan
$testEmail = Read-Host "Real email address that exists in your users table"
$uri = "https://2torconnect1.vercel.app/api/auth/send-otp"
$body = @{ email = $testEmail } | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json" -Body $body
    Write-Host ""
    Write-Host "--- Response ---" -ForegroundColor Green
    $response | Format-List

    if ($response.emailConfigured -eq $true -and $response.emailSent -eq $true) {
        Write-Host "CONFIRMED: email actually sent. Check the inbox (and spam folder) of $testEmail." -ForegroundColor Green
    } else {
        Write-Host "Still not sending (emailConfigured=$($response.emailConfigured), emailSent=$($response.emailSent))." -ForegroundColor Red
        Write-Host "Run check-otp-error.ps1 again to pull the latest Gmail error." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
