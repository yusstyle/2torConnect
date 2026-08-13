<#
  add-smtp-vars.ps1
  ------------------
  Confirmed via 'vercel env ls production': SMTP_USER and SMTP_PASS do not
  exist yet on yusstyle-s-projects/2torconnect-2026. This script adds them
  and redeploys so OTP emails can actually send.

  Run this from C:\Users\PC\Desktop\2torconnect2026 (already linked).
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== Add SMTP_USER / SMTP_PASS to Vercel Production ===" -ForegroundColor Cyan
Write-Host "Running from: $(Get-Location)" -ForegroundColor DarkGray

# ---------- Sanity check: confirm which domains this project actually serves ----------
Write-Host ""
Write-Host "Checking which domains this linked project serves..." -ForegroundColor Cyan
vercel domains ls 2>&1 | Write-Host
Write-Host ""
Write-Host "If 2torconnect1.vercel.app is NOT listed above, stop and tell Claude -" -ForegroundColor Yellow
Write-Host "it means your live site is a DIFFERENT Vercel project than the one linked here." -ForegroundColor Yellow
$confirm = Read-Host "Type 'y' to continue adding vars to THIS linked project, anything else to stop"
if ($confirm -ne 'y') {
    Write-Host "Stopped. No changes made." -ForegroundColor Yellow
    exit
}

# ---------- Collect Gmail credentials ----------
Write-Host ""
Write-Host "--- Gmail App Password required ---" -ForegroundColor Cyan
Write-Host "Generate one at: myaccount.google.com/apppasswords" -ForegroundColor DarkGray
Write-Host "(needs 2-Step Verification turned on for that Gmail account first)" -ForegroundColor DarkGray
Write-Host ""

$smtpUser = Read-Host "Gmail address to send OTPs from (e.g. 2torconnect@gmail.com)"

$smtpPassSecure = Read-Host "16-character App Password (input hidden)" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($smtpPassSecure)
$smtpPassPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
$smtpPassPlain = $smtpPassPlain -replace '\s', ''

if ([string]::IsNullOrWhiteSpace($smtpUser) -or [string]::IsNullOrWhiteSpace($smtpPassPlain)) {
    Write-Host "Both values are required. Exiting." -ForegroundColor Red
    exit 1
}

# ---------- Add to Vercel Production ----------
Write-Host ""
Write-Host "Adding SMTP_USER..." -ForegroundColor Cyan
$smtpUser | vercel env add SMTP_USER production

Write-Host "Adding SMTP_PASS..." -ForegroundColor Cyan
$smtpPassPlain | vercel env add SMTP_PASS production

$smtpPassPlain = $null

Write-Host ""
Write-Host "Vars added. Verifying..." -ForegroundColor Cyan
$verify = vercel env ls production 2>&1
Write-Host $verify

if ($verify -match "SMTP_USER" -and $verify -match "SMTP_PASS") {
    Write-Host "Both vars confirmed present in Production." -ForegroundColor Green
} else {
    Write-Host "One or both vars did not save correctly. Re-run this script." -ForegroundColor Red
    exit 1
}

# ---------- Redeploy ----------
Write-Host ""
Write-Host "Redeploying to production so the new vars take effect..." -ForegroundColor Cyan
vercel --prod

Write-Host ""
Write-Host "Deployment triggered - this can take 1-3 minutes." -ForegroundColor Yellow
Write-Host "Once it shows 'Ready' in the Vercel dashboard, run confirm-real-otp-v5.ps1 again to verify a real email sends." -ForegroundColor Yellow
Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
