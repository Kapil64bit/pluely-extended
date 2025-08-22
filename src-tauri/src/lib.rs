// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod window;
use tauri::{Manager, Emitter};
use std::process::Command;

#[tauri::command]
fn restart_app() -> Result<(), String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    Command::new(&exe).spawn().map_err(|e| e.to_string())?;
    std::process::exit(0);
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
        // Second instance attempt: if --restart present, restart existing instance
        if args.iter().any(|a| a == "--restart") {
            let _ = app.emit("pluely://pre-restart", ());
            if let Ok(exe) = std::env::current_exe() {
                let _ = Command::new(exe).spawn();
                std::process::exit(0);
            }
        } else {
            // Bring window to front if just a normal second launch
            if let Some(win) = app.get_webview_window("main").or_else(|| app.get_webview_window("pluely")).or_else(|| app.webview_windows().values().next().cloned()) {
                let _ = win.show();
                let _ = win.set_focus();
            }
        }
    }))
        .invoke_handler(tauri::generate_handler![greet, get_app_version, restart_app])
        .setup(|app| {
            // Setup main window positioning
            window::setup_main_window(app).expect("Failed to setup main window");

            // On Windows, create (idempotently) a Start Menu shortcut with a global hotkey so user can relaunch
            // the app via Ctrl+Alt+Shift+P (Windows may degrade to Ctrl+Alt+P). This removes the need for an external script.
            #[cfg(target_os = "windows")]
            {
                use std::{path::PathBuf, fs};
                use windows::Win32::{
                    UI::Shell::{IShellLinkW, ShellLink},
                    System::Com::{CoInitializeEx, COINIT_APARTMENTTHREADED, CoCreateInstance, CLSCTX_INPROC_SERVER, IPersistFile},
                };
                use windows::core::{Interface, PCWSTR};
                use std::os::windows::ffi::OsStrExt;

                fn wide(s: &str) -> Vec<u16> { std::ffi::OsStr::new(s).encode_wide().chain(std::iter::once(0)).collect() }

                let mut start_menu = PathBuf::from(std::env::var("APPDATA").unwrap_or_default());
                if !start_menu.as_os_str().is_empty() {
                    for seg in ["Microsoft","Windows","Start Menu","Programs"] { start_menu.push(seg); }
                    let shortcut_path = start_menu.join("Pluely (Hotkey).lnk");
                    let marker = start_menu.join(".pluely_hotkey_created");
                    // Only attempt once (marker) or if shortcut missing.
                    if !marker.exists() || !shortcut_path.exists() {
                        if unsafe { CoInitializeEx(None, COINIT_APARTMENTTHREADED) }.is_ok() {
                            if let Ok(exe) = std::env::current_exe() {
                                // Create directory if missing
                                let _ = fs::create_dir_all(&start_menu);
                                unsafe {
                                    // Create ShellLink
                                    if let Ok(shell_link) = CoCreateInstance::<_, IShellLinkW>(&ShellLink, None, CLSCTX_INPROC_SERVER) {
                                        // Ensure Target is the executable only and Arguments is set separately to "--restart".
                                        let path_str = exe.as_os_str().to_string_lossy().into_owned();
                                        let args_str = "--restart";
                                        eprintln!("Pluely: creating shortcut target='{}' args='{}'", path_str, args_str);
                                        let path_w = wide(&path_str);
                                        let _ = shell_link.SetPath(PCWSTR(path_w.as_ptr()));
                                        let args_w = wide(args_str);
                                        let _ = shell_link.SetArguments(PCWSTR(args_w.as_ptr()));
                                        let desc_w = wide("Pluely launch / restart via global hotkey");
                                        let _ = shell_link.SetDescription(PCWSTR(desc_w.as_ptr()));
                                        // Attempt to set working directory
                                        if let Some(dir) = exe.parent() { let wd_w = wide(&dir.to_string_lossy()); let _ = shell_link.SetWorkingDirectory(PCWSTR(wd_w.as_ptr())); }
                                        // Set icon
                                        let _ = shell_link.SetIconLocation(PCWSTR(path_w.as_ptr()), 0);
                                        // Set hotkey: Windows expects LOWORD = key code, HIWORD = modifiers. Ctrl=0x02, Alt=0x04, Shift=0x01 per .lnk HOTKEYF flags.
                                        // We want Ctrl+Alt+Shift+P. Virtual key for P is 0x50.
                                        // Format: (modifiers << 8) | vk
                                        // Use Ctrl+Alt+P for the .lnk hotkey (Shift often gets dropped by Windows); set only the no-shift value.
                                        let no_shift: u16 = ((0x02 | 0x04) << 8) | 0x50; // Ctrl+Alt+P
                                        let _ = shell_link.SetHotkey(no_shift);
                                        // Persist to file
                                        if let Ok(persist) = shell_link.cast::<IPersistFile>() {
                                            let lnk_w = wide(&shortcut_path.to_string_lossy());
                                            if persist.Save(PCWSTR(lnk_w.as_ptr()), true).is_ok() {
                                                let _ = fs::write(&marker, b"created");
                                            } else {
                                                eprintln!("Pluely: failed to save shortcut");
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Existing toggle hotkey (Ctrl+Shift+L) retained. Add restart hotkey Ctrl+Alt+Shift+P.
            #[cfg(target_os = "windows")]
            {
                use std::thread;

                // Clone the AppHandle for the background thread
                let ah = app.handle().clone();

                thread::spawn(move || {
                    // Use winapi for Win32 API
                    use winapi::shared::windef::HWND;
                    use winapi::um::winuser::{RegisterHotKey, GetMessageW, MSG, WM_HOTKEY, UnregisterHotKey};

                    // Virtual-Key code for 'L'
                    const VK_L: u32 = 0x4C;

                    // Hotkeys:
                    // id 1: Ctrl+Shift+L (existing behavior toggle)
                    // id 2: Ctrl+Alt+P (restart or launch via second instance semantics)
                    // MOD_CONTROL = 0x0002, MOD_SHIFT = 0x0004, MOD_ALT = 0x0001
                    let _ = unsafe { RegisterHotKey(0 as HWND, 1, (0x0002 | 0x0004) as u32, VK_L) }; // toggle
                    let _ = unsafe { RegisterHotKey(0 as HWND, 2, (0x0002 | 0x0001) as u32, 'P' as u32) }; // restart

                    // Message loop to listen for WM_HOTKEY
                    let mut msg: MSG = unsafe { std::mem::zeroed() };
                    while unsafe { GetMessageW(&mut msg as *mut MSG, 0 as HWND, 0, 0) } > 0 {
                        if msg.message == WM_HOTKEY {
                            // wParam contains the hotkey id
                            let id = msg.wParam as usize;

                            if id == 1 {
                                // Toggle the main window (hide/restore)
                                if let Some(win) = ah.get_webview_window("main")
                                    .or_else(|| ah.get_webview_window("pluely"))
                                    .or_else(|| ah.webview_windows().values().next().cloned())
                                {
                                    // Instead of hide/show (which can cause compositor artifacts during screen sharing),
                                    // move the window off-screen to "hide" it, and move it back + force a redraw when showing.
                                    let hidden = match win.outer_position() {
                                        Ok(p) => p.x == -32000 && p.y == -32000,
                                        Err(_) => false,
                                    };

                                    if hidden {
                                        // currently off-screen -> restore
                                        let _ = window::position_window_top_center(&win, 54);
                                        let _ = win.show();
                                        std::thread::sleep(std::time::Duration::from_millis(80));
                                        let _ = win.eval("window.dispatchEvent(new Event('resize'))");
                                        let _ = win.set_focus();
                                    } else {
                                        // Move far off-screen (classic technique) instead of hiding
                                        let _ = win.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: -32000, y: -32000 }));
                                        let _ = win.set_skip_taskbar(true);
                                    }
                                    }
                            } else if id == 2 {
                                // Restart: spawn self with --restart (will trigger single-instance callback)
                                if let Ok(exe) = std::env::current_exe() {
                                    let _ = Command::new(exe).arg("--restart").spawn();
                                }
                }
                        }
                    }

            // Unregister hotkey when loop exits
            let _ = unsafe { UnregisterHotKey(0 as HWND, 1) };
            let _ = unsafe { UnregisterHotKey(0 as HWND, 2) };
                });
            }
            Ok(())
        });

    // Add macOS-specific permissions plugin
    #[cfg(target_os = "macos")]
    let builder = builder.plugin(tauri_plugin_macos_permissions::init());

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
