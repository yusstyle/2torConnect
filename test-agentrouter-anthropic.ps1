<#
  test-agentrouter-anthropic.ps1
  --------------------------------
  AgentRouter uses Anthropic's Messages API format (confirmed via the
  ANTHROPIC_AUTH_TOKEN / ANTHROPIC_BASE_URL / ANTHROPIC_MODEL env var
  pattern), not OpenAI's chat/completions format. This tests against
  the correct endpoint: POST {base}/v1/messages with an x-api-key header.
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== Test AgentRouter (Anthropic-compatible) ===" -ForegroundColor Cyan

$tokenSecure = Read-Host "Paste your AgentRouter API key / ANTHROPIC_AUTH_TOKEN (input hidden)" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($tokenSecure)
$token = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
$token = $token.Trim()

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "No key entered. Exiting." -ForegroundColor Red
    exit 1
}

$baseUrl = "https://agentrouter.org"
$modelName = Read-Host "Model name (press Enter to use claude-opus-4-6, as shown in your config)"
if ([string]::IsNullOrWhiteSpace($modelName)) { $modelName = "claude-opus-4-6" }

$uri = "$baseUrl/v1/messages"

$testBody = @{
    model = $modelName
    max_tokens = 20
    messages = @(@{ role = "user"; content = "Say OK" })
} | ConvertTo-Json

Write-Host ""
Write-Host "Calling $uri ..." -ForegroundColor Cyan

try {
    $resp = Invoke-RestMethod -Uri $uri `
        -Method Post `
        -Headers @{
            "x-api-key" = $token
            "anthropic-version" = "2023-06-01"
        } `
        -ContentType "application/json" `
        -Body $testBody `
        -TimeoutSec 20

    Write-Host ""
    Write-Host "SUCCESS. Response:" -ForegroundColor Green
    $resp | ConvertTo-Json -Depth 5 | Write-Host
} catch {
    Write-Host ""
    Write-Host "FAILED." -ForegroundColor Red
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "Status: $status" -ForegroundColor Red
    $errBody = $_.ErrorDetails.Message
    if ($errBody) { Write-Host $errBody -ForegroundColor Red }
    Write-Host ""
    Write-Host "If 401/403: key issue - double check it was copied in full." -ForegroundColor Yellow
    Write-Host "If 404: try adding a trailing path segment, or check AgentRouter's docs for the exact messages endpoint." -ForegroundColor Yellow
    Write-Host "If model not found: try a different model name from their dashboard/docs." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan