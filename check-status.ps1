# check-status.ps1
# Read-only check. Doesn't touch your database, doesn't ask you anything.
# Just tells you what's already in place so we know what to do next.
#
# Run with: notepad check-status.ps1  -> paste -> save -> then:
# powershell -ExecutionPolicy Bypass -File .\check-status.ps1

Write-Host "=== 2torConnect Status Check ===" -ForegroundColor Cyan

$searchDirs = @(
    (Get-Location).Path,
    "$env:USERPROFILE\Desktop",
    "$env:USERPROFILE\Desktop\2torconnect2026",
    "$env:USERPROFILE\Downloads"
) | Select-Object -Unique

function Find-File($name) {
    foreach ($dir in $searchDirs) {
        $candidate = Join-Path $dir $name
        if (Test-Path $candidate) { return $candidate }
    }
    foreach ($root in @("$env:USERPROFILE\Desktop", "$env:USERPROFILE\Downloads")) {
        if (Test-Path $root) {
            $found = Get-ChildItem -Path $root -Filter $name -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) { return $found.FullName }
        }
    }
    return $null
}

Write-Host "`n--- Are you in the right folder? ---" -ForegroundColor Yellow
$repoRoot = (Get-Location).Path
Write-Host "Current folder: $repoRoot"
$dbPackageDir = Join-Path $repoRoot "lib\db"
if (Test-Path $dbPackageDir) {
    Write-Host "[OK] This looks like the 2torConnect repo (found lib\db)" -ForegroundColor Green
} else {
    Write-Host "[NO] This doesn't look like the repo root -- 'cd' into your 2torconnect2026 folder first" -ForegroundColor Red
}

Write-Host "`n--- db-url.txt (your Neon connection string) ---" -ForegroundColor Yellow
$dbUrlFile = Find-File "db-url.txt"
if ($dbUrlFile) {
    Write-Host "[FOUND] $dbUrlFile" -ForegroundColor Green
    $content = (Get-Content $dbUrlFile -Raw).Trim()
    if ($content -match "^postgres(ql)?://") {
        Write-Host "        Looks like a valid connection string (starts correctly)." -ForegroundColor Green
    } else {
        Write-Host "        WARNING: doesn't start with postgres:// -- may be empty or wrong content." -ForegroundColor Red
    }
} else {
    Write-Host "[NOT FOUND] You still need to create this one." -ForegroundColor Red
    Write-Host "  1. Go to console.neon.tech, log in, open your project, copy the Connection String"
    Write-Host "  2. Run: notepad db-url.txt"
    Write-Host "  3. Click Yes to create it, paste ONLY the connection string, save, close"
}

Write-Host "`n--- cleanup-broken-media.mjs ---" -ForegroundColor Yellow
$scriptPath = Find-File "cleanup-broken-media.mjs"
if ($scriptPath) {
    Write-Host "[FOUND] $scriptPath" -ForegroundColor Green
} else {
    Write-Host "[NOT FOUND] Download it from the chat again (I can resend it if needed)." -ForegroundColor Red
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
if ($dbUrlFile -and $scriptPath -and (Test-Path $dbPackageDir)) {
    Write-Host "Everything's in place. You're ready to run run-cleanup-v3.ps1." -ForegroundColor Green
} else {
    Write-Host "Something's missing -- follow the [NOT FOUND] instructions above, then re-run this check." -ForegroundColor Yellow
}