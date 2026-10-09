<#
  test-smartweb-smtp.ps1
  ----------------------
  Safely tests Smartweb Business Email (support@2torconnect.com) credentials
  and sends a real test email to an inbox of your choice to confirm delivery.
  
  Passwords are entered securely, never printed, and never saved to any file.
#>

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== Test Smartweb Business Email SMTP Delivery ===" -ForegroundColor Cyan
Write-Host "Host: us2.smtp.mailhostbox.com:587 (STARTTLS)" -ForegroundColor DarkGray
Write-Host "Sender: support@2torconnect.com" -ForegroundColor DarkGray
Write-Host ""

$smtpUser = "support@2torconnect.com"
$smtpHost = "us2.smtp.mailhostbox.com"
$smtpPort = "587"

$toEmail = Read-Host "Enter an email address to receive the test email (e.g. your personal Gmail)"
if ([string]::IsNullOrWhiteSpace($toEmail)) {
    Write-Host "Recipient email is required. Exiting." -ForegroundColor Red
    exit 1
}

$smtpPassSecure = Read-Host "Enter the mailbox password for support@2torconnect.com (input hidden)" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($smtpPassSecure)
$smtpPassPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

if ([string]::IsNullOrWhiteSpace($smtpPassPlain)) {
    Write-Host "Password cannot be empty. Exiting." -ForegroundColor Red
    exit 1
}

$env:TEST_SMTP_HOST = $smtpHost
$env:TEST_SMTP_PORT = $smtpPort
$env:TEST_SMTP_USER = $smtpUser
$env:TEST_SMTP_PASS = $smtpPassPlain
$env:TEST_EMAIL_TO  = $toEmail.Trim()
$env:TEST_EMAIL_FROM = "`"2torConnect Support`" <$smtpUser>"

# Run Node test script
node scripts/test-smtp-live.mjs
$exitCode = $LASTEXITCODE

# Securely clear credentials from process memory
$smtpPassPlain = $null
$env:TEST_SMTP_PASS = $null

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host " DELIVERY TEST PASSED!" -ForegroundColor Green
    Write-Host " Smartweb SMTP verified and test email was dispatched." -ForegroundColor Green
    Write-Host " Once you confirm receipt in your recipient inbox, you" -ForegroundColor Green
    Write-Host " can safely configure these environment variables on Vercel." -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Red
    Write-Host " DELIVERY TEST FAILED (Exit code: $exitCode)" -ForegroundColor Red
    Write-Host " Please check the error message above." -ForegroundColor Red
    Write-Host "==========================================================" -ForegroundColor Red
}

