<#
  finish-super-admin-reset.ps1
  ------------------------------
  Fix: the original script generated RESET_ADMIN_SECRET but never showed
  it to you, so there was no way to re-enter it later. This version does
  everything in one run: generates a new secret, sets it, redeploys, and
  immediately calls the endpoint - nothing to remember in between.

  Assumes the route (upsert version) is already deployed at
  /api/admin-reset-temp (confirmed by your last successful deploy).
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== Finish Super Admin Reset ===" -ForegroundColor Cyan

# ---------- Step 1: generate a fresh secret ----------
$secretBytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($secretBytes)
$secret = [Convert]::ToBase64String($secretBytes) -replace '[+/=]', ''

Write-Host ""
Write-Host "Setting a fresh RESET_ADMIN_SECRET on Vercel..." -ForegroundColor Cyan
vercel env rm RESET_ADMIN_SECRET production --yes 2>&1 | Out-Null
$secret | vercel env add RESET_ADMIN_SECRET production

# ---------- Step 2: redeploy so the new secret takes effect ----------
Write-Host ""
$maxAttempts = 4
$deployed = $false
for ($i = 1; $i -le $maxAttempts; $i++) {
    Write-Host "Deploy attempt $i of $maxAttempts..." -ForegroundColor Cyan
    vercel --prod 2>&1 | Tee-Object -Variable deployOutput | Write-Host
    if ($deployOutput -match "Error:") {
        Write-Host "Retrying in 10s..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    } else {
        $deployed = $true
        break
    }
}

if (-not $deployed) {
    Write-Host "Deploy failed after retries. Try running 'vercel --prod' by itself, then re-run this script." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Deployed." -ForegroundColor Yellow
Read-Host "Press Enter once the Vercel dashboard shows this deployment as Ready"

# ---------- Step 3: get new password, call endpoint immediately (secret still in memory) ----------
Write-Host ""
$pwSecure = Read-Host "New super admin password (input hidden, at least 8 characters)" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pwSecure)
$newPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

if ([string]::IsNullOrWhiteSpace($newPassword) -or $newPassword.Length -lt 8) {
    Write-Host "Password too short. Exiting - secret is still live on Vercel, re-run this script to retry." -ForegroundColor Red
    exit 1
}

$targetEmail = "yusstyle13@gmail.com"
$body = @{ secret = $secret; newPassword = $newPassword; email = $targetEmail } | ConvertTo-Json
$domain = "2torconnect1.vercel.app"

Write-Host ""
Write-Host "Calling reset endpoint for $targetEmail..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "https://$domain/api/admin-reset-temp" -Method Post -ContentType "application/json" -Body $body
    $response | Format-List
    if ($response.success -eq $true) {
        Write-Host "SUCCESS ($($response.action)). $($response.user.email) is now an admin with your new password." -ForegroundColor Green
    }
} catch {
    Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
    $errBody = $_.ErrorDetails.Message
    if ($errBody) { Write-Host $errBody -ForegroundColor Red }
}

$secret = $null
$newPassword = $null

# ---------- Step 4: cleanup ----------
Write-Host ""
$cleanup = Read-Host "Clean up now? Removes the temp route + secret and redeploys (y/n)"
if ($cleanup -eq 'y') {
    $targetFile = "artifacts\api-server\src\routes\admin-reset-temp.ts"
    $indexFile = "artifacts\api-server\src\routes\index.ts"

    Remove-Item $targetFile -Force -ErrorAction SilentlyContinue
    $indexContent = Get-Content $indexFile -Raw
    $indexContent = $indexContent -replace [regex]::Escape('import adminResetTempRouter from "./admin-reset-temp";') + "`r`n", ""
    $indexContent = $indexContent -replace [regex]::Escape('router.use("/admin-reset-temp", adminResetTempRouter);') + "`r`n", ""
    Set-Content -Path $indexFile -Value $indexContent -NoNewline -Encoding UTF8

    vercel env rm RESET_ADMIN_SECRET production --yes 2>&1 | Write-Host

    git add $targetFile $indexFile
    git commit -m "temp: remove super admin reset endpoint"
    git push
    vercel --prod

    Write-Host "Cleaned up and redeployed." -ForegroundColor Green
} else {
    Write-Host "Skipped cleanup - remember to remove it manually later (route file + index.ts registration + RESET_ADMIN_SECRET env var)." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan