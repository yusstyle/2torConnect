# vercel-check-latest.ps1
$ErrorActionPreference = "Stop"

Write-Host "=== Recent deployments for this project ===" -ForegroundColor Cyan
vercel ls

Write-Host ""
Write-Host "=== Details of the current production deployment ===" -ForegroundColor Cyan
vercel inspect 2torconnect1.vercel.app

Write-Host ""
Write-Host "=== Pulling fresh logs from the STABLE production domain ===" -ForegroundColor Cyan
vercel logs 2torconnect1.vercel.app --json > vercel-latest-logs.txt
Write-Host "Saved to vercel-latest-logs.txt"
Get-Content .\vercel-latest-logs.txt