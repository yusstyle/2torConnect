<#
  redo-super-admin-reset.ps1
  ----------------------------
  Replaces the reset route with the upsert version (creates the account
  if it doesn't exist, updates it if it does), redeploys, calls it for
  yusstyle13@gmail.com, then offers cleanup.

  Assumes do-super-admin-reset.ps1 already ran once (RESET_ADMIN_SECRET
  is already set on Vercel, route is already registered in index.ts) -
  this only replaces the route FILE content and redeploys.

  Requires admin-reset-temp-v2.ts to exist at the repo root first.
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== Redo Super Admin Reset (upsert version) ===" -ForegroundColor Cyan

$sourceFile = "admin-reset-temp-v2.ts"
$targetFile = "artifacts\api-server\src\routes\admin-reset-temp.ts"

if (-not (Test-Path $sourceFile)) {
    Write-Host "Could not find $sourceFile in this folder." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $targetFile)) {
    Write-Host "Could not find $targetFile - did do-super-admin-reset.ps1 run successfully first?" -ForegroundColor Red
    exit 1
}

# ---------- Replace route content ----------
Copy-Item $sourceFile $targetFile -Force
Write-Host "Replaced route with upsert version." -ForegroundColor Green

# ---------- Commit, push, deploy ----------
Write-Host ""
Write-Host "Committing and pushing..." -ForegroundColor Cyan
git add $targetFile
git commit -m "temp: upsert version of super admin reset endpoint"
git push

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
    Write-Host "Deploy failed after retries." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Deployed." -ForegroundColor Yellow
Read-Host "Press Enter once the Vercel dashboard shows this deployment as Ready"

# ---------- Get secret (re-enter it, since we don't store it between script runs) ----------
Write-Host ""
Write-Host "Enter the RESET_ADMIN_SECRET value from before (the random string do-super-admin-reset.ps1 generated)." -ForegroundColor Cyan
Write-Host "If you don't have it anymore, check: vercel env ls production (won't show the value, only confirms it exists)" -ForegroundColor DarkGray
$secretSecure = Read-Host "RESET_ADMIN_SECRET (input hidden)" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretSecure)
$secret = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

# ---------- Get new password ----------
$pwSecure = Read-Host "New super admin password (input hidden, at least 8 characters)" -AsSecureString
$bstr2 = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pwSecure)
$newPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr2)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr2)

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

# ---------- Cleanup ----------
Write-Host ""
$cleanup = Read-Host "Clean up now? Removes the temp route + secret and redeploys (y/n)"
if ($cleanup -eq 'y') {
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
    Write-Host "Skipped cleanup - remember to remove it manually later." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan