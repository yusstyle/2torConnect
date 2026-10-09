<#
  update-vercel-smtp.ps1
  -----------------------
  Safely updates Vercel Production environment variables to use
  Smartweb Business Email (support@2torconnect.com) instead of Gmail.

  DO NOT run this until test-smartweb-smtp.ps1 has succeeded and you have
  confirmed receipt of the test email in your inbox!
#>

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== Configure Smartweb SMTP on Vercel Production ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will configure the following Vercel Production environment variables:" -ForegroundColor Yellow
Write-Host "  SMTP_HOST  = us2.smtp.mailhostbox.com"
Write-Host "  SMTP_PORT  = 587"
Write-Host "  SMTP_USER  = support@2torconnect.com"
Write-Host "  EMAIL_FROM = support@2torconnect.com"
Write-Host "  SMTP_PASS  = (your mailbox password, entered securely)"
Write-Host ""

$confirm = Read-Host "Have you successfully verified real email delivery using test-smartweb-smtp.ps1? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "Aborted. Please run test-smartweb-smtp.ps1 first to verify delivery." -ForegroundColor Yellow
    exit 0
}

$smtpPassSecure = Read-Host "Enter the mailbox password for support@2torconnect.com (input hidden)" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($smtpPassSecure)
$smtpPassPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

if ([string]::IsNullOrWhiteSpace($smtpPassPlain)) {
    Write-Host "Password cannot be empty. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Applying environment variables via Vercel CLI (or npx vercel)..." -ForegroundColor Cyan

# Determine vercel command
$vercelCmd = "vercel"
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    $vercelCmd = "npx vercel"
}

function Set-VercelEnv($name, $value) {
    Write-Host "Setting $name..." -ForegroundColor DarkGray
    # Remove old variable if present
    Invoke-Expression "$vercelCmd env rm $name production --yes 2>&1" | Out-Null
    # Add new variable
    $value | Invoke-Expression "$vercelCmd env add $name production" | Out-Null
}

Set-VercelEnv "SMTP_HOST" "us2.smtp.mailhostbox.com"
Set-VercelEnv "SMTP_PORT" "587"
Set-VercelEnv "SMTP_USER" "support@2torconnect.com"
Set-VercelEnv "EMAIL_FROM" "support@2torconnect.com"
Set-VercelEnv "SMTP_PASS" $smtpPassPlain

$smtpPassPlain = $null

Write-Host ""
Write-Host "Environment variables updated successfully in Vercel Production." -ForegroundColor Green
Write-Host ""
Write-Host "Next step: Trigger a redeployment so the new environment variables take effect:" -ForegroundColor Yellow
Write-Host "  git add ."
Write-Host "  git commit -m 'Update SMTP configuration for support@2torconnect.com'"
Write-Host "  git push"
Write-Host "or run: vercel --prod"
Write-Host ""

