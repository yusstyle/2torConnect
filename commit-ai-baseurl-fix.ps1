<#
  commit-ai-baseurl-fix.ps1
  --------------------------
  The OPENAI_BASE_URL patch is already applied to ai.ts on disk (confirmed
  via check-ai-ts.ps1). This just commits and pushes it, since the earlier
  script run may have exited before reaching that step.
#>

$targetFile = "artifacts\api-server\src\routes\ai.ts"

Write-Host ""
Write-Host "=== Commit + push ai.ts patch ===" -ForegroundColor Cyan

Write-Host ""
Write-Host "--- git status ---" -ForegroundColor Cyan
git status -- $targetFile

Write-Host ""
Write-Host "--- git diff --stat ---" -ForegroundColor Cyan
git diff --stat -- $targetFile

Write-Host ""
$confirm = Read-Host "Commit and push this file now? (y/n)"
if ($confirm -eq 'y') {
    git add $targetFile
    git commit -m "ai: support OPENAI_BASE_URL for OpenAI-compatible providers"
    git push
    Write-Host "Pushed." -ForegroundColor Green
} else {
    Write-Host "Not committed." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan