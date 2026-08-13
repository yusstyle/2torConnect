<#
  check-otp-error.ps1
  --------------------
  v7's log pull came back empty, likely because 'vercel logs' needs the
  specific hashed deployment URL, not the alias domain. This version
  targets that directly and shows everything, unfiltered.
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== Check OTP Send Error ===" -ForegroundColor Cyan

# Step 1: trigger a fresh send so there's something recent in the logs
Write-Host ""
Write-Host "Sending a fresh test OTP first, so the error is recent..." -ForegroundColor Cyan
$testEmail = Read-Host "Real email address that exists in your users table"
$uri = "https://2torconnect1.vercel.app/api/auth/send-otp"
$body = @{ email = $testEmail } | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json" -Body $body
    Write-Host "Triggered. emailSent = $($response.emailSent)" -ForegroundColor DarkGray
} catch {
    Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 2: pull logs from the actual hashed deployment URL
Write-Host ""
Write-Host "Fetching logs from the specific deployment (this only works for a short window after the request)..." -ForegroundColor Cyan
$deploymentUrl = "2torconnect-2026-9behsklhi-yusstyle-s-projects.vercel.app"
$logs = vercel logs $deploymentUrl 2>&1
Write-Host ""
Write-Host "--- Full log output ---" -ForegroundColor Yellow
Write-Host $logs

if (-not $logs -or ($logs -join "") -match "^\s*$") {
    Write-Host ""
    Write-Host "Empty or no output. 'vercel logs' only captures a live tail for a short time -" -ForegroundColor Yellow
    Write-Host "it may have already rolled past the window between the request and this fetch." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Most reliable fallback: check the dashboard directly, right after sending a test OTP:" -ForegroundColor Cyan
    Write-Host "  https://vercel.com/yusstyle-s-projects/2torconnect-2026/logs" -ForegroundColor Green
    Write-Host "Filter by 'Runtime Logs', trigger a send-otp request, and watch it appear live." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
