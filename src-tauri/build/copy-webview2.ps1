# Copy WebView2Loader.dll into src-tauri root for packaging
# Usage: run from repository root (PowerShell)

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
$targetRelease = Join-Path $repoRoot "src-tauri\target\release"
$dest = Join-Path $repoRoot "src-tauri\WebView2Loader.dll"

Write-Host "Looking for WebView2Loader.dll in target release folders..."

# Common arch subfolders produced by webview2-com-sys build
$archs = @("x86","x64","arm64")
$found = $false
foreach ($arch in $archs) {
    $candidate = Join-Path $targetRelease (Join-Path ("build") "webview2-com-sys-*")
}

# Search recursively for any WebView2Loader.dll under src-tauri/target/release
$matches = Get-ChildItem -Path $targetRelease -Recurse -Filter WebView2Loader.dll -ErrorAction SilentlyContinue
if ($matches -and $matches.Count -gt 0) {
    # Prefer x64 if present
    $preferred = $matches | Where-Object { $_.FullName -match "\\x64\\" } | Select-Object -First 1
    if (-not $preferred) { $preferred = $matches | Select-Object -First 1 }
    Copy-Item -Path $preferred.FullName -Destination $dest -Force
    Write-Host "Copied $($preferred.FullName) -> $dest"
    $found = $true
} else {
    Write-Host "No WebView2Loader.dll found under $targetRelease.\nIf you built with cargo, ensure webview2-com-sys crate produced the DLLs. The DLL may be in your cargo registry cache under .cargo\\registry\\src." -ForegroundColor Yellow
}

if (-not $found) { exit 1 } else { exit 0 }
