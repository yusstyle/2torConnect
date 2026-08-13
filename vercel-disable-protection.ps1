# vercel-disable-protection.ps1
# Disables Deployment Protection (ssoProtection) on the 2torConnect Vercel project.

$Token = Read-Host "Paste your Vercel API token" -AsSecureString
$PlainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Token)
)

$ProjectId = "prj_ImmuzjY4Kq8Fo2qM5gvDWAPyvd5u"
$TeamId    = "team_JeRLVnQs8pUtgHdWsleQOSh1"

$Url = "https://api.vercel.com/v9/projects/$ProjectId`?teamId=$TeamId"

$Body = @{
    ssoProtection = $null
} | ConvertTo-Json

Write-Host "`nDisabling ssoProtection on project $ProjectId...`n" -ForegroundColor Cyan

try {
    $result = Invoke-RestMethod -Uri $Url -Headers @{ Authorization = "Bearer $PlainToken" } -Method PATCH -Body $Body -ContentType "application/json"
    Write-Host "SUCCESS. Current ssoProtection value:" -ForegroundColor Green
    $result.ssoProtection | ConvertTo-Json -Depth 5
}
catch {
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host $sr.ReadToEnd()
    }
}

Write-Host "`nIf this succeeded, re-run your login test script now - Vercel's auth wall should be gone.`n" -ForegroundColor Cyan