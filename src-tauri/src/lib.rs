// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod window;
mod screenshot;
use tauri::{Manager, Emitter};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::process::Command;

#[tauri::command]
fn restart_app() -> Result<(), String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    Command::new(&exe).spawn().map_err(|e| e.to_string())?;
    std::process::exit(0);
}

#[tauri::command]
fn hide_window(app: tauri::AppHandle) -> Result<(), String> {
    // Get the main window and hide it completely
    if let Some(window) = app.get_webview_window("main")
        .or_else(|| app.get_webview_window("pluely"))
        .or_else(|| app.webview_windows().values().next().cloned())
    {
        // Move window completely off-screen and hide it
        window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: -32000, y: -32000 }))
            .map_err(|e| e.to_string())?;
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn show_window(app: tauri::AppHandle) -> Result<(), String> {
    // Get the main window and show it
    if let Some(window) = app.get_webview_window("main")
        .or_else(|| app.get_webview_window("pluely"))
        .or_else(|| app.webview_windows().values().next().cloned())
    {
        // Move window back to visible position and show it
        window::position_window_top_center(&window, 54).map_err(|e| e.to_string())?;
        window.show().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn emit_area_screenshot(app: tauri::AppHandle) -> Result<(), String> {
    // Spawn thread so we don't block invoke handler / UI
    std::thread::spawn(move || {
        println!("[backend] emit_area_screenshot invoked - starting capture thread");
        if let Ok(Some(b64)) = crate::screenshot::invoke_area_screenshot() {
            println!("[backend] emit_area_screenshot captured screenshot length={} - emitting event", b64.len());
            if let Err(e) = app.emit("pluely://screenshot-captured", b64) {
                println!("[backend] emit_area_screenshot failed to emit event: {:?}", e);
            }
        } else {
            println!("[backend] emit_area_screenshot capture returned None or Err");
        }
    });
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Shared hidden state for tray toggling (best-effort)
    #[derive(Default, Clone)]
    struct UiState { hidden: Arc<AtomicBool> }

    let ui_state = UiState::default();

    let builder = tauri::Builder::default()
    .manage(ui_state.clone())
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
    .invoke_handler(tauri::generate_handler![greet, get_app_version, restart_app, hide_window, show_window, screenshot::invoke_area_screenshot, screenshot::invoke_fullscreen_screenshot, emit_area_screenshot])
        .setup(|app| {
            // Setup main window positioning
            window::setup_main_window(app).expect("Failed to setup main window");

            // Build tray icon & menu (Tauri v2 uses tray_icon crate under the hood)
            #[cfg(any(target_os = "windows", target_os = "macos", target_os = "linux"))]
            {
                use tauri::tray::{TrayIconBuilder, TrayIconEvent};
                use tauri::menu::{MenuBuilder, MenuItemBuilder};
                let app_handle = app.handle().clone();
                std::thread::spawn(move || {
                    // Build menu items
                    let toggle_window = MenuItemBuilder::new("Show / Hide Window").id("toggle_window").build(&app_handle).expect("toggle_window");
                    let toggle_voice = MenuItemBuilder::new("Toggle Voice").id("toggle_voice").build(&app_handle).expect("toggle_voice");
                    let analyze_clip = MenuItemBuilder::new("Analyze Clipboard").id("clipboard_analyze").build(&app_handle).expect("clipboard");
                    let cycle_model = MenuItemBuilder::new("Cycle Model").id("cycle_model").build(&app_handle).expect("cycle_model");
                    let screenshot_item = MenuItemBuilder::new("Capture Screenshot").id("screenshot").build(&app_handle).expect("screenshot");
                    let restart_item = MenuItemBuilder::new("Restart").id("restart").build(&app_handle).expect("restart");
                    let quit_item = MenuItemBuilder::new("Quit").id("quit").build(&app_handle).expect("quit");

                    let menu = MenuBuilder::new(&app_handle)
                        .item(&toggle_window)
                        .item(&toggle_voice)
                        .item(&analyze_clip)
                        .item(&cycle_model)
                        .item(&screenshot_item)
                        .separator()
                        .item(&restart_item)
                        .item(&quit_item)
                        .build()
                        .expect("tray menu");

                    let _tray = TrayIconBuilder::new()
                        .menu(&menu)
                        .on_menu_event(|tray, event| {
                            let id = event.id().as_ref();
                            match id {
                                "toggle_window" => {
                                    let state_arc = tray.app_handle().state::<UiState>().hidden.clone();
                                    let hidden = state_arc.load(Ordering::SeqCst);
                                    if hidden { let _ = show_window(tray.app_handle().clone()); } else { let _ = hide_window(tray.app_handle().clone()); }
                                    state_arc.store(!hidden, Ordering::SeqCst);
                                },
                                "toggle_voice" => { let _ = tray.app_handle().emit("pluely://hotkey/voice-toggle", ()); },
                                "clipboard_analyze" => { let _ = tray.app_handle().emit("pluely://hotkey/clipboard-analyze", ()); },
                                "cycle_model" => { let _ = tray.app_handle().emit("pluely://hotkey/model-cycle", ()); },
                                "screenshot" => { let ah = tray.app_handle().clone(); std::thread::spawn(move || { if let Ok(Some(b64)) = crate::screenshot::invoke_area_screenshot() { let _ = ah.emit("pluely://screenshot-captured", b64); } }); },
                                "restart" => { let _ = restart_app(); },
                                "quit" => { tray.app_handle().exit(0); },
                                _ => {}
                            }
                        })
                        .on_tray_icon_event(|tray, event| {
                            if matches!(event, TrayIconEvent::Click { .. }) {
                                // Simple toggle on click
                                let state_arc = tray.app_handle().state::<UiState>().hidden.clone();
                                let hidden = state_arc.load(Ordering::SeqCst);
                                if hidden { let _ = show_window(tray.app_handle().clone()); } else { let _ = hide_window(tray.app_handle().clone()); }
                                state_arc.store(!hidden, Ordering::SeqCst);
                            }
                        })
                        .build(&app_handle)
                        .expect("tray icon");
                });
            }

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
                    // Repair or remove legacy shortcut if it exists (old name used by older installer/script)
                    let legacy = start_menu.join("Pluely (Hotkey Restart).lnk");
                    if legacy.exists() {
                        // Try to repair: load existing .lnk and re-save as the new name with no args
                        use windows::Win32::System::Com::IPersistFile;
                        use windows::Win32::UI::Shell::IShellLinkW;
                        use windows::core::PCWSTR;
                        let legacy_w: Vec<u16> = legacy.to_string_lossy().encode_utf16().chain(std::iter::once(0)).collect();
                        if unsafe { CoInitializeEx(None, COINIT_APARTMENTTHREADED) }.is_ok() {
                            unsafe {
                                if let Ok(shell_link) = CoCreateInstance::<_, IShellLinkW>(&ShellLink, None, CLSCTX_INPROC_SERVER) {
                                    if let Ok(persist) = shell_link.cast::<IPersistFile>() {
                                        if persist.Load(PCWSTR(legacy_w.as_ptr()), windows::Win32::System::Com::STGM(0)).is_ok() {
                                            // Clear arguments and set hotkey to Ctrl+Alt+P
                                            let args_w = wide("");
                                            let _ = shell_link.SetArguments(PCWSTR(args_w.as_ptr()));
                                            let no_shift: u16 = ((0x02 | 0x04) << 8) | 0x50; // Ctrl+Alt+P
                                            let _ = shell_link.SetHotkey(no_shift);
                                            // Save as new shortcut name
                                            let new_path = shortcut_path.to_string_lossy().to_string();
                                            let new_w = wide(&new_path);
                                            let _ = persist.Save(PCWSTR(new_w.as_ptr()), true);
                                            let _ = std::fs::remove_file(&legacy);
                                        } else {
                                            let _ = std::fs::remove_file(&legacy);
                                        }
                                    }
                                } else {
                                    let _ = std::fs::remove_file(&legacy);
                                }
                            }
                        } else {
                            let _ = std::fs::remove_file(&legacy);
                        }
                    }
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
                                        // Ensure Target is the executable only (no restart arg; restart handled via in-app hotkey).
                                        let path_str = exe.as_os_str().to_string_lossy().into_owned();
                                        eprintln!("Pluely: creating shortcut target='{}'", path_str);
                                        let path_w = wide(&path_str);
                                        let _ = shell_link.SetPath(PCWSTR(path_w.as_ptr()));
                                        // No arguments for plain launch
                                        let _ = shell_link.SetArguments(PCWSTR([0u16].as_ptr()));
                                        let desc_w = wide("Pluely launch / focus (restart: Ctrl+Alt+Shift+P)");
                                        let _ = shell_link.SetDescription(PCWSTR(desc_w.as_ptr()));
                                        // Attempt to set working directory
                                        if let Some(dir) = exe.parent() { let wd_w = wide(&dir.to_string_lossy()); let _ = shell_link.SetWorkingDirectory(PCWSTR(wd_w.as_ptr())); }
                                        // Set icon
                                        let _ = shell_link.SetIconLocation(PCWSTR(path_w.as_ptr()), 0);
                                        // Set hotkey: Windows expects LOWORD = key code, HIWORD = modifiers. Ctrl=0x02, Alt=0x04, Shift=0x01 per .lnk HOTKEYF flags.
                                        // We want Ctrl+Alt+Shift+P. Virtual key for P is 0x50.
                                        // Format: (modifiers << 8) | vk
                                        // Use Ctrl+Alt+P for the .lnk hotkey (launch/focus). Shift variant handled inside app for restart.
                                        let no_shift: u16 = ((0x02 | 0x04) << 8) | 0x50; // Ctrl+Alt+P modifiers: Ctrl(0x02) Alt(0x04)
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
                use tauri::Manager;

                // Clone the AppHandle for the background thread
                let ah = app.handle().clone();

                // Parse configurable hotkey from env (format CTRL+ALT+S or just S; supporting Ctrl+Alt+S for screenshot)
                let configured = std::env::var("PLUELY_HOTKEY").unwrap_or_else(|_| "CTRL+ALT+S".to_string());
                let (hotkey_vk, hotkey_mods) = {
                    let upper = configured.to_ascii_uppercase();
                    let parts: Vec<&str> = upper.split('+').collect();
                    let mut mods = 0u32; let mut key: Option<u32> = None;
                    for p in parts { match p {
                        "CTRL" => mods |= 0x0002,
                        "ALT" => mods |= 0x0001,
                        "SHIFT" => mods |= 0x0004,
                        k if k.len()==1 => { key = Some(k.chars().next().unwrap() as u32); },
                        _ => {}
                    }}
                    (key.unwrap_or('S' as u32), if mods==0 { 0x0002 | 0x0001 } else { mods }) // default to CTRL+ALT if none provided
                };

                thread::spawn(move || {
                    // Use winapi for Win32 API
                    use winapi::shared::windef::HWND;
                    use winapi::um::winuser::{RegisterHotKey, GetMessageW, MSG, WM_HOTKEY, UnregisterHotKey};

                    // Virtual-Key code for 'L'
                    const VK_L: u32 = 0x4C;

                    // Hotkeys:
                    // id 1: Ctrl+Shift+L (existing behavior toggle)
                    // id 2: Ctrl+Alt+P (launch / focus existing instance - single-instance will bring to front)
                    // id 3: Ctrl+Alt+Shift+P (full restart)
                    // id 4: Ctrl+Alt+Q (quit application)
                    // id 5: Configurable screenshot hotkey (default Ctrl+Alt+S)
                    // MOD_CONTROL = 0x0002, MOD_SHIFT = 0x0004, MOD_ALT = 0x0001
                    let _ = unsafe { RegisterHotKey(0 as HWND, 1, (0x0002 | 0x0004) as u32, VK_L) }; // toggle
                    let _ = unsafe { RegisterHotKey(0 as HWND, 2, (0x0002 | 0x0001) as u32, 'P' as u32) }; // launch/focus
                    let _ = unsafe { RegisterHotKey(0 as HWND, 3, (0x0002 | 0x0001 | 0x0004) as u32, 'P' as u32) }; // restart
                    let _ = unsafe { RegisterHotKey(0 as HWND, 4, (0x0002 | 0x0001) as u32, 'Q' as u32) }; // quit
                    let _ = unsafe { RegisterHotKey(0 as HWND, 5, hotkey_mods, hotkey_vk) }; // screenshot
                    // id 6: Ctrl+Alt+V (voice activation toggle)
                    let _ = unsafe { RegisterHotKey(0 as HWND, 6, (0x0002 | 0x0001) as u32, 'V' as u32) };
                    // id 7: Ctrl+Alt+C (clipboard quick analysis)
                    let _ = unsafe { RegisterHotKey(0 as HWND, 7, (0x0002 | 0x0001) as u32, 'C' as u32) };
                    // id 8: Ctrl+Alt+H (toggle conversation history popover)
                    let _ = unsafe { RegisterHotKey(0 as HWND, 8, (0x0002 | 0x0001) as u32, 'H' as u32) };
                    // id 9: Ctrl+Alt+M (cycle AI model)
                    let _ = unsafe { RegisterHotKey(0 as HWND, 9, (0x0002 | 0x0001) as u32, 'M' as u32) };
                    // id 10: Ctrl+Alt+X (alternative screenshot hotkey)
                    let _ = unsafe { RegisterHotKey(0 as HWND, 10, (0x0002 | 0x0001) as u32, 'X' as u32) };

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
                                // Plain launch/focus: spawn another instance with no args -> single-instance handler focuses existing
                                if let Ok(exe) = std::env::current_exe() {
                                    let _ = Command::new(exe).spawn();
                                }
                            } else if id == 3 {
                                // Restart: in development we shouldn't exit the cargo/dev wrapper because it will stop the
                                // frontend dev server. So in debug builds, just reload the main window. In release builds,
                                // spawn a new process with --restart to trigger single-instance restart.
                                if cfg!(debug_assertions) {
                                    if let Some(win) = ah.get_webview_window("main")
                                        .or_else(|| ah.get_webview_window("pluely"))
                                        .or_else(|| ah.webview_windows().values().next().cloned())
                                    {
                                        // Emit pre-restart event for any cleanup, then reload the webview
                                        let _ = ah.emit("pluely://pre-restart", ());
                                        let _ = win.eval("window.location.reload()");
                                    }
                                } else {
                                    if let Ok(exe) = std::env::current_exe() {
                                        let _ = Command::new(exe).arg("--restart").spawn();
                                    }
                                }
                            } else if id == 4 {
                                // Quit: emit pre-restart-like event for cleanup and then exit gracefully
                                let _ = ah.emit("pluely://pre-restart", ());
                                // Try to close main window(s) first
                                if let Some(win) = ah.get_webview_window("main")
                                    .or_else(|| ah.get_webview_window("pluely"))
                                    .or_else(|| ah.webview_windows().values().next().cloned())
                                {
                                    let _ = win.close();
                                }
                                // Then exit the app
                                ah.exit(0);
                            } else if id == 5 {
                                // Screenshot capture in blocking fashion on this thread; spawn new thread to not block message loop.
                                let ah_inner = ah.clone();
                                println!("[backend] Hotkey 5 pressed - initiating screenshot capture");
                                std::thread::spawn(move || {
                                    println!("[backend] Screenshot thread started");
                                    if let Ok(Some(b64)) = screenshot::invoke_area_screenshot() {
                                        println!("[backend] Screenshot capture successful, base64 length: {}", b64.len());
                                        println!("[backend] Emitting Tauri event 'pluely://screenshot-captured'");
                                        let emit_result = ah_inner.emit("pluely://screenshot-captured", b64);
                                        match emit_result {
                                            Ok(_) => println!("[backend] Tauri event emitted successfully"),
                                            Err(e) => println!("[backend] Failed to emit Tauri event: {:?}", e),
                                        }
                                    } else {
                                        println!("[backend] Screenshot capture failed or returned None");
                                    }
                                });
                            } else if id == 6 {
                                // Voice activation toggle
                                let _ = ah.emit("pluely://hotkey/voice-toggle", ());
                            } else if id == 7 {
                                // Clipboard quick analysis request
                                let _ = ah.emit("pluely://hotkey/clipboard-analyze", ());
                            } else if id == 8 {
                                // Toggle conversation history
                                let _ = ah.emit("pluely://hotkey/history-toggle", ());
                            } else if id == 9 {
                                // Cycle model
                                let _ = ah.emit("pluely://hotkey/model-cycle", ());
                            } else if id == 10 {
                                // Alternative screenshot hotkey - FULLSCREEN capture (same processing as area screenshot)
                                let ah_inner = ah.clone();
                                println!("[backend] Hotkey 10 (Ctrl+Alt+X) pressed - initiating FULLSCREEN screenshot capture");
                                std::thread::spawn(move || {
                                    println!("[backend] Fullscreen screenshot thread started");
                                    if let Ok(Some(b64)) = screenshot::invoke_fullscreen_screenshot() {
                                        println!("[backend] Fullscreen screenshot capture successful, base64 length: {}", b64.len());
                                        println!("[backend] Emitting Tauri event 'pluely://screenshot-captured'");
                                        let emit_result = ah_inner.emit("pluely://screenshot-captured", b64);
                                        match emit_result {
                                            Ok(_) => println!("[backend] Tauri event emitted successfully"),
                                            Err(e) => println!("[backend] Failed to emit Tauri event: {:?}", e),
                                        }
                                    } else {
                                        println!("[backend] Fullscreen screenshot capture failed or returned None");
                                    }
                                });
                            }
                        }
                    }

            // Unregister hotkey when loop exits
            let _ = unsafe { UnregisterHotKey(0 as HWND, 1) };
            let _ = unsafe { UnregisterHotKey(0 as HWND, 2) };
            let _ = unsafe { UnregisterHotKey(0 as HWND, 3) };
            let _ = unsafe { UnregisterHotKey(0 as HWND, 4) };
            let _ = unsafe { UnregisterHotKey(0 as HWND, 5) };
            let _ = unsafe { UnregisterHotKey(0 as HWND, 6) };
            let _ = unsafe { UnregisterHotKey(0 as HWND, 7) };
            let _ = unsafe { UnregisterHotKey(0 as HWND, 8) };
            let _ = unsafe { UnregisterHotKey(0 as HWND, 9) };
            let _ = unsafe { UnregisterHotKey(0 as HWND, 10) };
                });
            }
            Ok(())
        });
    #[cfg(target_os = "macos")]
    let builder = builder.plugin(tauri_plugin_macos_permissions::init());

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
