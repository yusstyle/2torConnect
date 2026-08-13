<#
  confirm-real-otp.ps1
  ---------------------
  Standalone check - use this any time you just want to CONFIRM the OTP
  email setup is working, without re-running the full setup script.

  Does two things:
    1. Lists your Vercel Production env vars and checks SMTP_USER / SMTP_PASS
       are present (values are never shown, just whether they exist)
    2. Calls your live /api/auth/send-otp endpoint with a real test email
       and tells you plainly whether the email actually configured + sent

  HOW TO RUN (Notepad method, since long pastes can break PSReadLine):
    1. In PowerShell:  notepad confirm-real-otp.ps1
    2. Paste this whole file in, save, close Notepad
    3. Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
    4. .\confirm-real-otp.ps1
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== 2torConnect: Confirm Real OTP ===" -ForegroundColor Cyan

# ---------- 1. Check env vars are set on Vercel ----------
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "Vercel CLI not found. Skipping env var check - install with 'npm install -g vercel' if you want this step." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Checking Vercel Production env vars..." -ForegroundColor Cyan
    $whoami = vercel whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Not logged in. Run 'vercel login' first if you want this check." -ForegroundColor Yellow
    } else {
        if (-not (Test-Path ".vercel/project.json")) {
            Write-Host "This folder isn't linked to a Vercel project. Run 'vercel link' first, or cd into the right folder." -ForegroundColor Yellow
        } else {
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
    }
}

# ---------- 2. Hit the live endpoint for real ----------
Write-Host ""
Write-Host "--- Live send-otp test ---" -ForegroundColor Cyan
$domain = Read-Host "Your live domain, no https:// (e.g. 2torconnect-2026.vercel.app or your custom domain)"
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

    if ($response.emailConfigured -eq $true -and $response.emailSent -eq $true) {
        Write-Host ""
        Write-Host "CONFIRMED: real OTP email sent. Check the inbox (and spam folder) of $testEmail." -ForegroundColor Green
    } elseif ($response.emailConfigured -eq $false) {
        Write-Host ""
        Write-Host "NOT CONFIRMED: emailConfigured is false. SMTP_USER/SMTP_PASS are not visible to this deployment yet. Re-check they are saved under Production and that you redeployed after adding them." -ForegroundColor Red
    } else {
        Write-Host ""
        Write-Host "NOT CONFIRMED: vars are set but the send itself failed. Check your Vercel function logs for the 'Email send failed:' line, usually a bad App Password." -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Double check the domain is correct and reachable." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan