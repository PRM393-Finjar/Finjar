# Finjar mail diagnostic runner
# Usage (PowerShell):
#   cd "d:\User\Downloads\Finjar-main\Personal_Finance_App_Be-main\Personal_Finance_App_Be-main\Personal_Finance_Management\Personal_Finance_Management.Api"
#   ..\..\scripts\run-mail-diagnostic.ps1
# Or run this file directly.

$ErrorActionPreference = "Stop"
$apiDir = Join-Path $PSScriptRoot "..\Personal_Finance_Management\Personal_Finance_Management.Api" | Resolve-Path
Set-Location $apiDir

Write-Host "Free disk before run:"
Get-PSDrive -PSProvider FileSystem | Format-Table Name, @{N='FreeGB';E={[math]::Round($_.Free/1GB,2)}} -AutoSize

Write-Host "Starting API (watch for ===== .ENV LOAD ===== and ===== MAIL CONFIG =====)..."
$job = Start-Job -ScriptBlock {
  param($dir)
  Set-Location $dir
  dotnet run --urls http://localhost:5284 2>&1
} -ArgumentList $apiDir.Path

$deadline = (Get-Date).AddMinutes(3)
$ready = $false
while ((Get-Date) -lt $deadline) {
  Start-Sleep -Seconds 2
  $out = Receive-Job $job
  if ($out) { $out | ForEach-Object { Write-Host $_ } }
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:5284/health" -UseBasicParsing -TimeoutSec 2
    if ($r.StatusCode -eq 200) { $ready = $true; break }
  } catch {}
  if ((Get-Job $job).State -ne 'Running') { break }
}

if (-not $ready) {
  Write-Host "API did not become ready. Dumping remaining job output:"
  Receive-Job $job | ForEach-Object { Write-Host $_ }
  Stop-Job $job -ErrorAction SilentlyContinue
  Remove-Job $job -Force -ErrorAction SilentlyContinue
  exit 1
}

Write-Host "`nCalling GET /api/test/mail ..."
try {
  $mail = Invoke-RestMethod -Uri "http://localhost:5284/api/test/mail" -Method GET
  $mail | ConvertTo-Json -Depth 6
} catch {
  Write-Host "TEST MAIL FAILED:"
  Write-Host $_.Exception.Message
  if ($_.ErrorDetails) { Write-Host $_.ErrorDetails.Message }
}

Write-Host "`nStopping API job..."
Stop-Job $job -ErrorAction SilentlyContinue
Remove-Job $job -Force -ErrorAction SilentlyContinue
