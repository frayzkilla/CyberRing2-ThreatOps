param(
    [switch]$Rebuild
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

Write-Host "Stopping compose stack and deleting named volumes..." -ForegroundColor Cyan
docker compose down --volumes --remove-orphans

if ($LASTEXITCODE -ne 0) {
    throw "docker compose down failed with exit code $LASTEXITCODE"
}

Write-Host "Service state has been reset." -ForegroundColor Green
Write-Host "Deleted volumes: pg_data, minio_data" -ForegroundColor Yellow

if ($Rebuild) {
    Write-Host "Rebuilding and starting services..." -ForegroundColor Cyan
    docker compose up -d --build

    if ($LASTEXITCODE -ne 0) {
        throw "docker compose up failed with exit code $LASTEXITCODE"
    }

    Write-Host "Services are running again." -ForegroundColor Green
}
