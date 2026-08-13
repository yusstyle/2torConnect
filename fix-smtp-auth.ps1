<#
  fix-smtp-auth.ps1
  ------------------
  Confirmed via Vercel logs: Gmail is rejecting the current SMTP_PASS with
  EAUTH / "Username and Password not accepted". This almost always means
  it wasn't a valid App Password (either 2-Step Verification isn't truly
  on, or the regular Gmail password got used by mistake).

  This script walks through regenerating it correctly, replaces SMTP_PASS
  on Vercel, redeploys, and re-tests.
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== Fix SMTP Auth (EAUTH / Invalid login) ===" -ForegroundColor Cyan

Write-Host ""
Write-Host "STEP 1: Confirm 2-Step Verification is ON" -ForegroundColor Cyan
Write-Host "Open this in your browser and check the account you used (yusufhussaini0904@gmail.com):" -ForegroundColor DarkGray
Write-Host "  https://myaccount.google.com/security" -ForegroundColor Green
Write-Host "Under 'How you sign in to Google', it must say '2-Step Verification: On'." -ForegroundColor DarkGray
Write-Host "If it says Off, turn it on first (you'll need your phone) before continuing." -ForegroundColor Yellow
$step1 = Read-Host "Type 'y' once 2-Step Verification shows as ON"
if ($step1 -ne 'y') {
    Write-Host "Stopped. Turn on 2-Step Verification first, then re-run this script." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "STEP 2: Generate a FRESH App Password" -ForegroundColor Cyan
Write-Host "Any old app passwords for this account may be stale or were never valid - generate a new one:" -ForegroundColor DarkGray
Write-Host "  https://myaccount.google.com/apppasswords" -ForegroundColor Green
Write-Host "App name: 2torConnect  ->  Create" -ForegroundColor DarkGray
Write-Host "Copy the 16-character password shown. Ignore the spaces in the display - just copy all 16 letters." -ForegroundColor DarkGray
Write-Host ""

$smtpUser = Read-Host "Confirm the Gmail address (should match what you generated the App Password for)"
$smtpPassSecure = Read-Host "Paste the NEW 16-character App Password (input hidden)" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($smtpPassSecure)
$smtpPassPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
$smtpPassPlain = $smtpPassPlain -replace '\s', ''

if ($smtpPassPlain.Length -ne 16) {
    Write-Host ""
    Write-Host "Warning: that's $($smtpPassPlain.Length) characters after removing spaces, not 16." -ForegroundColor Red
    Write-Host "A real Google App Password is exactly 16 characters. Double check what you pasted." -ForegroundColor Red
    $proceed = Read-Host "Continue anyway? (y/n)"
    if ($proceed -ne 'y') { exit }
}

# ---------- Replace SMTP_USER and SMTP_PASS ----------
Write-Host ""
Write-Host "Removing old SMTP_USER / SMTP_PASS..." -ForegroundColor Cyan
vercel env rm SMTP_USER production --yes 2>&1 | Write-Host
vercel env rm SMTP_PASS production --yes 2>&1 | Write-Host

Write-Host ""
Write-Host "Adding fresh values..." -ForegroundColor Cyan
$smtpUser | vercel env add SMTP_USER production
$smtpPassPlain | vercel env add SMTP_PASS production
$smtpPassPlain = $null

# ---------- Redeploy ----------
Write-Host ""
Write-Host "Redeploying so the new App Password takes effect..." -ForegroundColor Cyan
vercel --prod

Write-Host ""
Write-Host "Deployment triggered - wait for 'Ready' in the Vercel dashboard, about 1-3 minutes." -ForegroundColor Yellow
Read-Host "Press Enter once it shows Ready"

# ---------- Re-test ----------
Write-Host ""
Write-Host "Re-testing send-otp..." -ForegroundColor Cyan
$testEmail = Read-Host "Real email address that exists in your users table"
$uri = "https://2torconnect1.vercel.app/api/auth/send-otp"
$body = @{ email = $testEmail } | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json" -Body $body
    $response | Format-List
    if ($response.emailConfigured -eq $true -and $response.emailSent -eq $true) {
        Write-Host "CONFIRMED: email actually sent this time. Check $testEmail." -ForegroundColor Green
    } else {
        Write-Host "Still not sending. Run check-otp-error.ps1 again to see the latest error." -ForegroundColor Red
    }
} catch {
    Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
