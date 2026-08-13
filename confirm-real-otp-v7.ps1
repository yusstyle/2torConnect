<#
  confirm-real-otp-v7.ps1
  ------------------------
  Fix: v6 incorrectly reported CONFIRMED based on emailConfigured alone.
  The real pass condition is emailConfigured AND emailSent both true.
  This version checks both, and if emailSent is false, pulls recent
  Vercel function logs so you can see the actual SMTP error.
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== 2torConnect: Confirm Real OTP (v7) ===" -ForegroundColor Cyan
Write-Host "Running from: $(Get-Location)" -ForegroundColor DarkGray

Write-Host ""
Write-Host "--- Live send-otp test ---" -ForegroundColor Cyan
Write-Host "Using the direct deployment URL (avoids any custom-domain SSL delay)." -ForegroundColor DarkGray
$domainInput = Read-Host "Domain to test, no https:// (press Enter to use 2torconnect1.vercel.app)"
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

    if ($response.emailConfigured -eq $true -and $response.emailSent -eq $true) {
        Write-Host ""
        Write-Host "CONFIRMED: SMTP configured AND the email actually sent." -ForegroundColor Green
        Write-Host "Check the inbox (and spam folder) of $testEmail." -ForegroundColor Green
    } elseif ($response.emailConfigured -eq $true -and $response.emailSent -eq $false) {
        Write-Host ""
        Write-Host "NOT CONFIRMED: SMTP_USER/SMTP_PASS are visible to the deployment, but the actual send to Gmail failed." -ForegroundColor Red
        Write-Host "Pulling recent Vercel logs to find the real error..." -ForegroundColor Yellow
        Write-Host ""

        $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
        if ($vercelInstalled) {
            Write-Host "--- Recent production logs (filtered for email/SMTP lines) ---" -ForegroundColor Cyan
            $logs = vercel logs $domain 2>&1
            $relevantLogs = $logs | Select-String -Pattern "Email send failed|SMTP|nodemailer|EAUTH|Invalid login"
            if ($relevantLogs) {
                $relevantLogs | ForEach-Object { Write-Host $_.Line -ForegroundColor Yellow }
            } else {
                Write-Host "No matching lines found in the recent log window. Try again right after sending," -ForegroundColor Yellow
                Write-Host "or check manually at: vercel.com/yusstyle-s-projects/2torconnect-2026 -> Logs" -ForegroundColor Yellow
                Write-Host "Full recent log output:" -ForegroundColor DarkGray
                Write-Host $logs
            }
        } else {
            Write-Host "Vercel CLI not found - check logs manually in the Vercel dashboard under Logs." -ForegroundColor Yellow
        }

        Write-Host ""
        Write-Host "Common causes once you see the real error:" -ForegroundColor Cyan
        Write-Host " - 'Invalid login' / EAUTH: wrong App Password, or 2-Step Verification not actually on for that Gmail account" -ForegroundColor DarkGray
        Write-Host " - 'Less secure app' type errors: make sure you used an App Password, not the normal Gmail password" -ForegroundColor DarkGray
        Write-Host " - Extra spaces in the App Password when it was entered" -ForegroundColor DarkGray
    } else {
        Write-Host ""
        Write-Host "NOT CONFIRMED: emailConfigured is false. The env vars are not visible to this deployment/domain." -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
