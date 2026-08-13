<#
  apply-ai-baseurl-fix.ps1
  -------------------------
  Patches artifacts/api-server/src/routes/ai.ts so a custom OPENAI_BASE_URL
  env var can point the AI chat at any OpenAI-compatible provider (like
  AgentRouter), not just api.openai.com directly.

  Matches only the two functional code lines (not the comments above them,
  which contain punctuation that can get mangled on copy/paste) so this
  script is safe to move through Notepad if needed.

  Run this from C:\Users\PC\Desktop\2torconnect2026 (repo root).
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

$targetFile = "artifacts\api-server\src\routes\ai.ts"

Write-Host ""
Write-Host "=== Patch ai.ts for custom OPENAI_BASE_URL ===" -ForegroundColor Cyan

if (-not (Test-Path $targetFile)) {
    Write-Host "Could not find $targetFile from this location." -ForegroundColor Red
    Write-Host "Make sure you are running this from C:\Users\PC\Desktop\2torconnect2026" -ForegroundColor Yellow
    exit 1
}

$content = Get-Content $targetFile -Raw

$oldLine1 = 'const apiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;'
$oldLine2 = 'const baseURL = process.env.OPENAI_API_KEY ? undefined : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;'
$oldBlock = "$oldLine1`r`n$oldLine2"
$oldBlockLF = "$oldLine1`n$oldLine2"

$newBlock = @'
// NOTE: OPENAI_BASE_URL (if set) always wins, so this key/URL pair can point
// at any OpenAI-compatible provider (OpenAI itself, AgentRouter, OpenRouter,
// etc.) instead of only api.openai.com.
const apiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL || (process.env.OPENAI_API_KEY ? undefined : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL);
'@

if ($content -match [regex]::Escape($oldBlock)) {
    $newContent = $content -replace [regex]::Escape($oldBlock), $newBlock
} elseif ($content -match [regex]::Escape($oldBlockLF)) {
    $newContent = $content -replace [regex]::Escape($oldBlockLF), $newBlock
} else {
    Write-Host "The expected code lines were not found - the file may already be patched, or has changed." -ForegroundColor Yellow
    Write-Host "No changes made." -ForegroundColor Yellow
    exit 0
}

Set-Content -Path $targetFile -Value $newContent -NoNewline -Encoding UTF8

Write-Host "Patched successfully." -ForegroundColor Green
Write-Host ""
Write-Host "--- Verifying ---" -ForegroundColor Cyan
Select-String -Path $targetFile -Pattern "OPENAI_BASE_URL"

Write-Host ""
Write-Host "--- git diff --stat ---" -ForegroundColor Cyan
git diff --stat

Write-Host ""
$commit = Read-Host "Commit and push this change now? (y/n)"
if ($commit -eq 'y') {
    git add $targetFile
    git commit -m "ai: support OPENAI_BASE_URL for OpenAI-compatible providers"
    git push
    Write-Host "Pushed. Vercel should auto-deploy - if not, run vercel --prod manually." -ForegroundColor Green
} else {
    Write-Host "Not committed. Run git add / git commit / git push when ready." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan