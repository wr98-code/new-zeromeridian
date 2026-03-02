# copy_push136.ps1
# Jalankan dari D:\FILEK — klik kanan -> Run with PowerShell

$ROOT = "D:\FILEK\new-zeromeridian-main\src"

Write-Host "Mulai copy file push136..." -ForegroundColor Cyan

# TILES — dari D:\FILEK langsung ke src\components\tiles\
Copy-Item "D:\FILEK\HeatmapTile.tsx"      "$ROOT\components\tiles\HeatmapTile.tsx"      -Force
Copy-Item "D:\FILEK\TradingViewChart.tsx"  "$ROOT\components\tiles\TradingViewChart.tsx"  -Force
Copy-Item "D:\FILEK\NewsTickerTile.tsx"    "$ROOT\components\tiles\NewsTickerTile.tsx"    -Force

# SHARED — dari D:\FILEK langsung ke src\components\shared\
Copy-Item "D:\FILEK\OfflineIndicator.tsx" "$ROOT\components\shared\OfflineIndicator.tsx" -Force
Copy-Item "D:\FILEK\PWAInstallPrompt.tsx" "$ROOT\components\shared\PWAInstallPrompt.tsx" -Force
Copy-Item "D:\FILEK\XLogo.tsx"            "$ROOT\components\shared\XLogo.tsx"            -Force

# PAGES — dari D:\FILEK langsung ke src\pages\
Copy-Item "D:\FILEK\Converter.tsx"    "$ROOT\pages\Converter.tsx"    -Force
Copy-Item "D:\FILEK\Intelligence.tsx" "$ROOT\pages\Intelligence.tsx" -Force

Write-Host "Semua file berhasil dicopy!" -ForegroundColor Green
Write-Host ""
Write-Host "Sekarang jalankan:" -ForegroundColor Cyan
Write-Host '$env:GH_TOKEN = "ghp_XXXXXXX"' -ForegroundColor Yellow
Write-Host "node push136.mjs" -ForegroundColor White
Write-Host ""
Write-Host "Tekan Enter untuk keluar..."
Read-Host
