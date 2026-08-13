<#
  do-super-admin-reset.ps1
  --------------------------
  1. Copies admin-reset-temp.ts into artifacts/api-server/src/routes/
  2. Registers it in routes/index.ts (adds one import + one router.use line)
  3. Generates a random secret, sets RESET_ADMIN_SECRET on Vercel
     (write-only is fine here - we choose the value, no need to read it back)
  4. Commits, pushes, redeploys
  5. Calls the endpoint once with your new password
  6. Removes the route file, un-registers it, commits/pushes the removal,
     and removes RESET_ADMIN_SECRET from Vercel - leaving nothing behind

  Run from C:\Users\PC\Desktop\2torconnect2026 (repo root).
  Requires admin-reset-temp.ts to be downloaded/created at the repo root
  first (see instructions).
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== Super Admin Password Reset (via live endpoint) ===" -ForegroundColor Cyan

$sourceFile = "admin-reset-temp.ts"
$targetFile = "artifacts\api-server\src\routes\admin-reset-temp.ts"
$indexFile = "artifacts\api-server\src\routes\index.ts"

if (-not (Test-Path $sourceFile)) {
    Write-Host "Could not find $sourceFile in this folder." -ForegroundColor Red
    Write-Host "Create it first with notepad admin-reset-temp.ts and paste the content Claude provided." -ForegroundColor Yellow
    exit 1
}

# ---------- Step 1: copy route file into place ----------
Copy-Item $sourceFile $targetFile -Force
Write-Host "Copied route to $targetFile" -ForegroundColor Green

# ---------- Step 2: register it in routes/index.ts ----------
$indexContent = Get-Content $indexFile -Raw

if ($indexContent -notmatch "adminResetTempRouter") {
    $importLine = 'import adminResetTempRouter from "./admin-reset-temp";'
    $useLine = 'router.use("/admin-reset-temp", adminResetTempRouter);'

    # Add import after the last existing import line
    $indexContent = $indexContent -replace '(import groupsRouter from "\./groups";)', "`$1`r`n$importLine"
    # Add router.use after an existing router.use line
    $indexContent = $indexContent -replace '(router\.use\("/sponsorship-requests", sponsorshipRouter\);)', "`$1`r`n$useLine"

    Set-Content -Path $indexFile -Value $indexContent -NoNewline -Encoding UTF8
    Write-Host "Registered route in routes/index.ts" -ForegroundColor Green
} else {
    Write-Host "Route already registered in routes/index.ts" -ForegroundColor Yellow
}

# ---------- Step 3: generate secret, set on Vercel ----------
$secretBytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($secretBytes)
$secret = [Convert]::ToBase64String($secretBytes) -replace '[+/=]', ''

Write-Host ""
Write-Host "Setting RESET_ADMIN_SECRET on Vercel Production..." -ForegroundColor Cyan
vercel env rm RESET_ADMIN_SECRET production --yes 2>&1 | Out-Null
$secret | vercel env add RESET_ADMIN_SECRET production

# ---------- Step 4: commit, push, deploy ----------
Write-Host ""
Write-Host "Committing and pushing..." -ForegroundColor Cyan
git add $targetFile $indexFile
git commit -m "temp: add one-time super admin password reset endpoint"
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
    Write-Host "Deploy failed after retries. Run 'vercel --prod' manually, then re-run this script's later steps by hand." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Deployed. Waiting for it to be Ready before calling the endpoint." -ForegroundColor Yellow
Read-Host "Press Enter once the Vercel dashboard shows this deployment as Ready"

# ---------- Step 5: get new password and call the endpoint ----------
Write-Host ""
$pwSecure = Read-Host "New super admin password (input hidden, at least 8 characters)" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pwSecure)
$newPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

if ([string]::IsNullOrWhiteSpace($newPassword) -or $newPassword.Length -lt 8) {
    Write-Host "Password too short. Exiting - route/secret are still live, re-run this script's later steps manually if needed." -ForegroundColor Red
    exit 1
}

$body = @{ secret = $secret; newPassword = $newPassword; email = "admin@2torconnect.com" } | ConvertTo-Json
$domain = "2torconnect1.vercel.app"

Write-Host ""
Write-Host "Calling reset endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "https://$domain/api/admin-reset-temp" -Method Post -ContentType "application/json" -Body $body
    $response | Format-List
    if ($response.success -eq $true) {
        Write-Host "SUCCESS. Password reset for $($response.user.email)" -ForegroundColor Green
    }
} catch {
    Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
    $errBody = $_.ErrorDetails.Message
    if ($errBody) { Write-Host $errBody -ForegroundColor Red }
}

$newPassword = $null

# ---------- Step 6: clean up - remove route, secret, redeploy ----------
Write-Host ""
$cleanup = Read-Host "Clean up now? Removes the temp route + secret and redeploys (y/n)"
if ($cleanup -eq 'y') {
    Remove-Item $targetFile -Force -ErrorAction SilentlyContinue
    $indexContent = Get-Content $indexFile -Raw
    $indexContent = $indexContent -replace [regex]::Escape('import adminResetTempRouter from "./admin-reset-temp";') + "`r`n", ""
    $indexContent = $indexContent -replace [regex]::Escape('router.use("/admin-reset-temp", adminResetTempRouter);') + "`r`n", ""
    Set-Content -Path $indexFile -Value $indexContent -NoNewline -Encoding UTF8

    vercel env rm RESET_ADMIN_SECRET production --yes 2>&1 | Write-Host

    git add $targetFile $indexFile
    git commit -m "temp: remove one-time super admin password reset endpoint"
    git push
    vercel --prod

    Write-Host "Cleaned up and redeployed." -ForegroundColor Green
} else {
    Write-Host "Skipped cleanup - remember to remove the route and RESET_ADMIN_SECRET manually later." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan