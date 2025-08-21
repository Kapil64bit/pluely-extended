<#
Creates a Start Menu shortcut for Pluely with a global hotkey so you can launch / restart the app
even when it is not running. Uses Windows Explorer's built-in shortcut hotkey mechanism (safe, no
background process needed).

Default hotkey: Ctrl+Alt+Shift+P (Windows may drop SHIFT; if so it becomes Ctrl+Alt+P automatically).

Run:
  powershell -ExecutionPolicy Bypass -File .\scripts\create-hotkey-shortcut.ps1

Optional parameters:
  -InstallPath "C:\\Users\\<YOU>\\AppData\\Local\\Pluely\\pluely.exe"
  -Hotkey "CTRL+ALT+SHIFT+P"   # or "CTRL+ALT+P"

#>
param(
  [string]$InstallPath = "$env:LOCALAPPDATA\Pluely\pluely.exe",
  [string]$Hotkey = "CTRL+ALT+SHIFT+P"
)

if (-not (Test-Path $InstallPath)) {
  Write-Warning "Pluely executable not found at '$InstallPath'. Use -InstallPath to specify manually.";
  exit 1
}

$shortcutDir = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'
if (-not (Test-Path $shortcutDir)) { New-Item -ItemType Directory -Path $shortcutDir | Out-Null }

$shortcutPath = Join-Path $shortcutDir 'Pluely (Hotkey Restart).lnk'

$wsh = New-Object -ComObject WScript.Shell
$sc = $wsh.CreateShortcut($shortcutPath)
$sc.TargetPath = $InstallPath
$sc.Arguments = '--restart'
$sc.WorkingDirectory = Split-Path $InstallPath
$sc.Description = 'Pluely launch / restart via global hotkey'
$sc.IconLocation = "$InstallPath,0"

try {
  $sc.Hotkey = $Hotkey
} catch {
  Write-Warning "Could not set hotkey '$Hotkey'. Windows may only accept CTRL+ALT+<Key>. You can edit it manually in shortcut properties.";
}

$sc.Save()

Write-Host "Created shortcut: $shortcutPath"
Write-Host "If the hotkey doesn't trigger, open the shortcut's Properties and re-enter the desired key combo." -ForegroundColor Yellow
