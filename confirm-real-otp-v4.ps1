<#
# VERSION MARKER: v4 - if you do not see this comment when you open the file in Notepad, the paste/copy was incomplete - redo it.
  confirm-real-otp-v3.ps1
  ------------------------
  Same as v2, plus:
    - Prints what's actually inside .vercel/ if the "linked" check fails,
      so we can see why it's not detecting the link
    - Defaults the domain prompt to your current live domain

  HOW TO RUN (Notepad method, since long pastes can break PSReadLine):
    1. In PowerShell:  notepad confirm-real-otp-v3.ps1
    2. Paste this whole file in, save, close Notepad
    3. Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
    4. .\confirm-real-otp-v3.ps1
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== 2torConnect: Confirm Real OTP ===" -ForegroundColor Cyan
Write-Host "Running from: $(Get-Location)" -ForegroundColor DarkGray

# ---------- 1. Check env vars are set on Vercel ----------
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "Vercel CLI not found. Skipping env var check - install with 'npm install -g vercel' if you want this step." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Checking Vercel Production env vars..." -ForegroundColor Cyan
    $whoami = vercel whoami 2>&1
    Write-Host "Logged in as: $whoami" -ForegroundColor DarkGray

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Not logged in. Run 'vercel login' first if you want this check." -ForegroundColor Yellow
    } else {
        $linked = Test-Path ".vercel/project.json"
        Write-Host "Looking for .vercel/project.json in $(Get-Location): $linked" -ForegroundColor DarkGray

        if (-not $linked) {
            Write-Host "This folder isn't linked to a Vercel project according to Test-Path." -ForegroundColor Yellow
            Write-Host "Here is what's actually inside .vercel (if it exists):" -ForegroundColor Yellow
            if (Test-Path ".vercel") {
                Get-ChildItem ".vercel" -Force | Format-Table Name, Length -AutoSize
            } else {
                Write-Host "  (.vercel folder does not exist at all in this location)" -ForegroundColor Red
            }
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
$domainInput = Read-Host "Your live domain, no https:// (press Enter to use 2torconnect1.vercel.app)"
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
