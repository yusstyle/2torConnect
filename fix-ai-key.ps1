<#
  fix-ai-key.ps1
  ---------------
  1. Tests a NEW OpenAI API key directly against OpenAI's API (no deploy
     needed for this check - tells you in seconds if the key itself is
     valid, before touching Vercel at all).
  2. If valid, replaces OPENAI_API_KEY on Vercel Production.
  3. Redeploys (with retry, since 'fetch failed' has happened before).

  SECURITY NOTE: paste your key at the hidden prompt below, not in chat.
  If you've already shared a key anywhere outside this terminal, revoke
  and regenerate it after this is confirmed working.
#>

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Write-Host ""
Write-Host "=== Fix AI Chat: Set + Verify OpenAI API Key ===" -ForegroundColor Cyan

# ---------- Step 1: collect key securely ----------
Write-Host ""
$keySecure = Read-Host "Paste your OpenAI API key (input hidden)" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($keySecure)
$apiKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
$apiKey = $apiKey.Trim()

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host "No key entered. Exiting." -ForegroundColor Red
    exit 1
}

# ---------- Step 2: test the key directly against OpenAI ----------
Write-Host ""
Write-Host "Testing the key directly against api.openai.com (not through your app yet)..." -ForegroundColor Cyan

$testBody = @{
    model = "gpt-4o-mini"
    messages = @(@{ role = "user"; content = "Say OK" })
    max_tokens = 5
} | ConvertTo-Json

try {
    $testResponse = Invoke-RestMethod -Uri "https://api.openai.com/v1/chat/completions" `
        -Method Post `
        -Headers @{ "Authorization" = "Bearer $apiKey" } `
        -ContentType "application/json" `
        -Body $testBody

    Write-Host ""
    Write-Host "Key is VALID. OpenAI responded successfully:" -ForegroundColor Green
    Write-Host ($testResponse.choices[0].message.content) -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "Key test FAILED." -ForegroundColor Red
    $errBody = $_.ErrorDetails.Message
    if ($errBody) { Write-Host $errBody -ForegroundColor Red }
    Write-Host ""
    Write-Host "Common causes:" -ForegroundColor Yellow
    Write-Host " - Key is invalid, revoked, or mistyped" -ForegroundColor DarkGray
    Write-Host " - Key belongs to an account with no billing / no credits" -ForegroundColor DarkGray
    Write-Host " - Key is actually from a different provider (e.g. not OpenAI's own sk- key)" -ForegroundColor DarkGray
    $proceed = Read-Host "Set it on Vercel anyway? (y/n)"
    if ($proceed -ne 'y') { exit 1 }
}

# ---------- Step 3: replace on Vercel ----------
Write-Host ""
Write-Host "Removing old OPENAI_API_KEY from Production..." -ForegroundColor Cyan
vercel env rm OPENAI_API_KEY production --yes 2>&1 | Write-Host

Write-Host "Adding new OPENAI_API_KEY..." -ForegroundColor Cyan
$apiKey | vercel env add OPENAI_API_KEY production
$apiKey = $null

# ---------- Step 4: redeploy with retry ----------
$maxAttempts = 4
$deployed = $false
for ($i = 1; $i -le $maxAttempts; $i++) {
    Write-Host ""
    Write-Host "Deploy attempt $i of $maxAttempts..." -ForegroundColor Cyan
    vercel --prod 2>&1 | Tee-Object -Variable deployOutput | Write-Host
    if ($deployOutput -match "Error:") {
        Write-Host "Attempt $i failed, retrying in 10s..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    } else {
        $deployed = $true
        break
    }
}

if (-not $deployed) {
    Write-Host "Deploy kept failing. Run 'vercel --prod' manually once your connection is stable." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Deployed. Once it shows Ready, log into the live site and try the AI chat / study assistant feature for real." -ForegroundColor Green
Write-Host "=== Done ===" -ForegroundColor Cyan