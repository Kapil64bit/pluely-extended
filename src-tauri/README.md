Before building the Windows installer, ensure WebView2Loader.dll is included in the package.

1. Build the Rust side: `cargo build --release` (from `src-tauri`).
2. Run the helper script from repository root (PowerShell):

   ```powershell
   .\src-tauri\build\copy-webview2.ps1
   ```

This will copy a found `WebView2Loader.dll` from `src-tauri/target/release/**` into `src-tauri/` so it is picked up by Tauri's bundler (configured via `tauri.conf.json` resources). If your build produced multiple archs, the script prefers x64.
