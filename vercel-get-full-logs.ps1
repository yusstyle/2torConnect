$DeploymentUrl = "https://2torconnect-2026-50o1o6z83-yusstyle-s-projects.vercel.app"
$OutFile = "$PSScriptRoot\vercel-full-logs.txt"

try {
    $rawUI = $Host.UI.RawUI
    $newSize = $rawUI.BufferSize
    $newSize.Width = 500
    $rawUI.BufferSize = $newSize
} catch {
    Write-Host "Could not widen console buffer, continuing anyway." -ForegroundColor Yellow
}

Write-Host "Trying JSON output first (most reliable for full messages)...`n" -ForegroundColor Cyan

$jsonAttempt = vercel logs $DeploymentUrl --json 2>&1
if ($LASTEXITCODE -eq 0 -and $jsonAttempt -match "^\{") {
    $jsonAttempt | Out-File -FilePath $OutFile -Width 1000
    Write-Host "Saved JSON logs to $OutFile" -ForegroundColor Green
} else {
    Write-Host "JSON flag not available/failed, saving plain wide output instead...`n" -ForegroundColor Yellow
    vercel logs $DeploymentUrl | Out-File -FilePath $OutFile -Width 1000
    Write-Host "Saved plain logs to $OutFile" -ForegroundColor Green
}

Write-Host "`nOpening the log file now..." -ForegroundColor Cyan
notepad $OutFile