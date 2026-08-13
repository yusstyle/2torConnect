<#
  test-openai-key-verbose.ps1
  -----------------------------
  fix-ai-key.ps1's test failed with no visible error body, unlike the
  AgentRouter test which showed a clear message. This version prints
  every piece of diagnostic info available: HTTP status, headers,
  raw response body, and the raw exception message, so nothing is
  hidden this time.
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== Verbose OpenAI Key Test ===" -ForegroundColor Cyan

$keySecure = Read-Host "Paste your OpenAI API key (input hidden)" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($keySecure)
$apiKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
$apiKey = $apiKey.Trim()

Write-Host ""
Write-Host "Key length after trim: $($apiKey.Length) characters" -ForegroundColor DarkGray
Write-Host "Key starts with: $($apiKey.Substring(0, [Math]::Min(10, $apiKey.Length)))..." -ForegroundColor DarkGray

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host "No key entered. Exiting." -ForegroundColor Red
    exit 1
}

$testBody = @{
    model = "gpt-4o-mini"
    messages = @(@{ role = "user"; content = "Say OK" })
    max_tokens = 5
} | ConvertTo-Json

Write-Host ""
Write-Host "Sending request to https://api.openai.com/v1/chat/completions ..." -ForegroundColor Cyan

try {
    $resp = Invoke-WebRequest -Uri "https://api.openai.com/v1/chat/completions" `
        -Method Post `
        -Headers @{ "Authorization" = "Bearer $apiKey" } `
        -ContentType "application/json" `
        -Body $testBody `
        -TimeoutSec 20 `
        -ErrorAction Stop

    Write-Host ""
    Write-Host "SUCCESS - Status $($resp.StatusCode)" -ForegroundColor Green
    Write-Host $resp.Content -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "=== Full error diagnostics ===" -ForegroundColor Red

    $ex = $_.Exception
    Write-Host "Exception type: $($ex.GetType().FullName)" -ForegroundColor Yellow
    Write-Host "Exception message: $($ex.Message)" -ForegroundColor Yellow

    if ($ex.Response) {
        $statusCode = [int]$ex.Response.StatusCode
        Write-Host "HTTP status code: $statusCode" -ForegroundColor Yellow

        try {
            $stream = $ex.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $rawBody = $reader.ReadToEnd()
            Write-Host "Raw response body:" -ForegroundColor Yellow
            Write-Host $rawBody -ForegroundColor Yellow
        } catch {
            Write-Host "(Could not read response body stream: $($_.Exception.Message))" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "No HTTP response object at all - this points to a network-level failure" -ForegroundColor Yellow
        Write-Host "(DNS, firewall, proxy, TLS, or no internet route to api.openai.com)," -ForegroundColor Yellow
        Write-Host "rather than OpenAI rejecting the key." -ForegroundColor Yellow
    }

    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host "ErrorDetails.Message:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan