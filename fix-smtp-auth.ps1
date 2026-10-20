<#
  fix-smtp-auth.ps1
  ------------------
  Restores Gmail SMTP credentials for yusufhussaini0904@gmail.com
  on Vercel Production and redeploys.
#>

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=== Restore Gmail SMTP (yusufhussaini0904@gmail.com) ===" -ForegroundColor Cyan
Write-Host ""

$smtpUser = "yusufhussaini0904@gmail.com"

Write-Host "Make sure you have a 16-character Google App Password from:" -ForegroundColor DarkGray
Write-Host "  https://myaccount.google.com/apppasswords" -ForegroundColor Green
Write-Host ""

$smtpPassSecure = Read-Host "Paste your 16-character Google App Password (input hidden)" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($smtpPassSecure)
$smtpPassPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
$smtpPassPlain = $smtpPassPlain -replace '\s', ''

if ([string]::IsNullOrWhiteSpace($smtpPassPlain)) {
    Write-Host "Password cannot be empty. Exiting." -ForegroundColor Red
    exit 1
}

$scope = "yusstyle-s-projects"
$project = "2torconnect-2026"

Write-Host ""
Write-Host "Updating SMTP_USER and SMTP_PASS on Vercel Production..." -ForegroundColor Cyan

# Remove old
npx --yes vercel env rm SMTP_USER production --scope $scope --project $project --yes 2>$null | Out-Null
npx --yes vercel env rm SMTP_PASS production --scope $scope --project $project --yes 2>$null | Out-Null

# Add fresh
$smtpUser | npx --yes vercel env add SMTP_USER production --scope $scope --project $project 2>$null | Out-Null
$smtpPassPlain | npx --yes vercel env add SMTP_PASS production --scope $scope --project $project 2>$null | Out-Null
$smtpPassPlain = $null

Write-Host "Environment variables saved successfully." -ForegroundColor Green

Write-Host ""
Write-Host "Triggering redeployment..." -ForegroundColor Cyan
npx --yes vercel redeploy 2torconnect1.vercel.app --scope $scope --no-wait 2>$null | Out-Null

Write-Host ""
Write-Host "Deployment triggered! Waiting 40 seconds for it to become ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 40

Write-Host ""
Write-Host "=== Done! Test sending an OTP on https://www.2torconnect.com ===" -ForegroundColor Green
