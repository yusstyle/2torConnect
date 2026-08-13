# diagnose-2torconnect.ps1
# Run with: notepad diagnose-2torconnect.ps1  -> paste -> save -> then in the same
# terminal: powershell -ExecutionPolicy Bypass -File .\diagnose-2torconnect.ps1
#
# You'll need a Vercel token: https://vercel.com/account/tokens
# and your project name (usually "2torconnect" unless you renamed it).

$ErrorActionPreference = "Stop"

Write-Host "=== 2torConnect Diagnostic ===" -ForegroundColor Cyan

# ---- 1. Ask for Vercel token + project ----
$vercelToken = Read-Host "Paste your Vercel API token (input hidden not supported in classic PS, just paste)"
$projectName = Read-Host "Vercel project name (press Enter for '2torconnect')"
if ([string]::IsNullOrWhiteSpace($projectName)) { $projectName = "2torconnect" }

$headers = @{ Authorization = "Bearer $vercelToken" }

# ---- 2. Check latest deployment + which commit it's on ----
Write-Host "`n--- Latest Deployments ---" -ForegroundColor Yellow
try {
    $deployments = Invoke-RestMethod -Uri "https://api.vercel.com/v6/deployments?limit=5&projectId=$projectName" -Headers $headers
    foreach ($d in $deployments.deployments) {
        $state = $d.state
        $sha = $d.meta.githubCommitSha
        $shaShort = if ($sha) { $sha.Substring(0,7) } else { "unknown" }
        $created = [DateTimeOffset]::FromUnixTimeMilliseconds($d.created).ToLocalTime()
        Write-Host "$created | state=$state | commit=$shaShort | url=$($d.url)"
    }
} catch {
    Write-Host "Could not fetch deployments. Check your token / project name." -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# ---- 3. Compare to latest GitHub commit ----
Write-Host "`n--- Latest GitHub commit (main branch) ---" -ForegroundColor Yellow
try {
    $ghCommit = Invoke-RestMethod -Uri "https://api.github.com/repos/yusstyle/2torConnect/commits/main"
    Write-Host "GitHub HEAD: $($ghCommit.sha.Substring(0,7)) - $($ghCommit.commit.message -split "`n" | Select-Object -First 1)"
    Write-Host "^ Compare this SHA to the 'commit' column above. If Vercel's latest READY deployment"
    Write-Host "  doesn't match this SHA, that's your problem -- trigger a manual redeploy."
} catch {
    Write-Host "Could not reach GitHub API." -ForegroundColor Red
}

# ---- 4. List env vars set on Vercel (names only, not values) ----
Write-Host "`n--- Environment Variables Configured on Vercel ---" -ForegroundColor Yellow
try {
    $envVars = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$projectName/env" -Headers $headers
    $required = @("DATABASE_URL","NEON_DATABASE_URL","BLOB_READ_WRITE_TOKEN","OPENAI_API_KEY","OPENAI_MODEL","VITE_API_URL")
    $present = $envVars.envs | Select-Object -ExpandProperty key
    foreach ($r in $required) {
        if ($present -contains $r) {
            Write-Host "  [OK]      $r is set" -ForegroundColor Green
        } else {
            Write-Host "  [MISSING] $r is NOT set" -ForegroundColor Red
        }
    }
    Write-Host "`n  Note: having DATABASE_URL is enough; NEON_DATABASE_URL is optional (it takes priority if both exist)."
} catch {
    Write-Host "Could not fetch env vars. Check your token has project access." -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# ---- 5. Hit the live API to see the real error ----
Write-Host "`n--- Live API Health Check ---" -ForegroundColor Yellow
$apiUrl = Read-Host "Paste your production URL (e.g. https://2torconnect.vercel.app), no trailing slash"
try {
    $resp = Invoke-WebRequest -Uri "$apiUrl/api/health" -UseBasicParsing -SkipHttpErrorCheck
    Write-Host "GET /api/health -> Status $($resp.StatusCode)"
    Write-Host $resp.Content
} catch {
    Write-Host "GET /api/health failed outright: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $resp2 = Invoke-WebRequest -Uri "$apiUrl/api/auth/login" -Method POST -Body '{}' -ContentType "application/json" -UseBasicParsing -SkipHttpErrorCheck
    Write-Host "`nPOST /api/auth/login (empty body) -> Status $($resp2.StatusCode)"
    Write-Host $resp2.Content
} catch {
    Write-Host "POST /api/auth/login failed outright: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan
Write-Host "Send me the output above -- especially any [MISSING] env vars, the commit SHA mismatch (if any),"
Write-Host "and the raw text from the /api/health and /api/auth/login calls. That will tell us exactly what's broken."