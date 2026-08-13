<#
  check-ai-ts.ps1
  ----------------
  Shows the actual current content of ai.ts around the apiKey/baseURL
  lines, so we can see exactly why apply-ai-baseurl-fix.ps1 didn't match.
#>

$targetFile = "artifacts\api-server\src\routes\ai.ts"

if (-not (Test-Path $targetFile)) {
    Write-Host "Could not find $targetFile from this location." -ForegroundColor Red
    Write-Host "Run this from C:\Users\PC\Desktop\2torconnect2026" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== Lines 1-35 of ai.ts, with line numbers ===" -ForegroundColor Cyan
Get-Content $targetFile | Select-Object -First 35 | ForEach-Object -Begin { $i = 1 } -Process {
    Write-Host ("{0,3}: {1}" -f $i, $_)
    $i++
}

Write-Host ""
Write-Host "=== Any uncommitted local changes to this file ===" -ForegroundColor Cyan
git diff -- $targetFile
git status -- $targetFile

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan