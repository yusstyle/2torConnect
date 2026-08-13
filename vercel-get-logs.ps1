# vercel-get-logs.ps1
# Streams/fetches Vercel function logs for your production deployment.
# Run this, then IMMEDIATELY (in another PowerShell window) trigger a login attempt
# (via the test script or the actual website), so the crash shows up in the log output.

$DeploymentUrl = "https://2torconnect-2026-50o1o6z83-yusstyle-s-projects.vercel.app"

Write-Host "Streaming logs for $DeploymentUrl" -ForegroundColor Cyan
Write-Host "Leave this running, then trigger a login attempt in another window / the browser." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop once you see the crash.`n" -ForegroundColor Yellow

vercel logs $DeploymentUrl