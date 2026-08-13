<#
  cleanup-admin-reset.ps1
  -------------------------
  Standalone cleanup, in case the original script's cleanup prompt was
  already closed or skipped. Removes the temp reset route, un-registers
  it from routes/index.ts, deletes RESET_ADMIN_SECRET from Vercel, and
  redeploys clean. Safe to run even if some of this was already done -
  each step checks before acting.
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== Clean up super admin reset endpoint ===" -ForegroundColor Cyan

$targetFile = "artifacts\api-server\src\routes\admin-reset-temp.ts"
$indexFile = "artifacts\api-server\src\routes\index.ts"

# ---------- Remove route file ----------
if (Test-Path $targetFile) {
    Remove-Item $targetFile -Force
    Write-Host "Removed $targetFile" -ForegroundColor Green
} else {
    Write-Host "$targetFile already removed." -ForegroundColor DarkGray
}

# ---------- Un-register from index.ts ----------
if (Test-Path $indexFile) {
    $indexContent = Get-Content $indexFile -Raw
    if ($indexContent -match "adminResetTempRouter") {
        $indexContent = $indexContent -replace [regex]::Escape('import adminResetTempRouter from "./admin-reset-temp";') + "`r`n", ""
        $indexContent = $indexContent -replace [regex]::Escape('router.use("/admin-reset-temp", adminResetTempRouter);') + "`r`n", ""
        Set-Content -Path $indexFile -Value $indexContent -NoNewline -Encoding UTF8
        Write-Host "Un-registered route from index.ts" -ForegroundColor Green
    } else {
        Write-Host "index.ts already clean (no reference found)." -ForegroundColor DarkGray
    }
}

# ---------- Remove the secret from Vercel ----------
Write-Host ""
Write-Host "Removing RESET_ADMIN_SECRET from Vercel Production..." -ForegroundColor Cyan
vercel env rm RESET_ADMIN_SECRET production --yes 2>&1 | Write-Host

# ---------- Commit, push, redeploy ----------
Write-Host ""
Write-Host "Checking for changes to commit..." -ForegroundColor Cyan
git status --short

$changes = git status --porcelain
if ($changes) {
    git add -A
    git commit -m "temp: remove super admin reset endpoint"
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

    if ($deployed) {
        Write-Host ""
        Write-Host "Cleaned up and redeployed. The temp endpoint is now gone from production." -ForegroundColor Green
    } else {
        Write-Host "Deploy failed after retries - the code changes are pushed, run 'vercel --prod' manually to finish." -ForegroundColor Red
    }
} else {
    Write-Host "No file changes to commit - only the Vercel secret needed removing, which is done." -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan