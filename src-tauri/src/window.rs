use tauri::{Manager, App, WebviewWindow};

// The offset from the top of the screen to the window
const TOP_OFFSET: i32 = 54;

/// Sets up the main window with custom positioning
pub fn setup_main_window(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    // Try different possible window labels
    let window = app.get_webview_window("main")
        .or_else(|| app.get_webview_window("pluely"))
        .or_else(|| {
            // Get the first window if specific labels don't work
            app.webview_windows().values().next().cloned()
        })
        .ok_or("No window found")?;

    position_window_top_center(&window, TOP_OFFSET)?;

    // Hide window from taskbar on Windows for stealth behavior (if supported)
    #[cfg(target_os = "windows")]
    {
        // Best-effort: set skip taskbar on the existing window
        let _ = window.set_skip_taskbar(true);
    }

    // Make the window always on top so it floats above other applications
    // This is applied on all platforms where `set_always_on_top` is supported.
    let _ = window.set_always_on_top(true);

    // On Windows, remove the system menu and minimize/maximize boxes so the
    // non-client context menu (minimize/maximize/close) doesn't appear on right-click.
    #[cfg(target_os = "windows")]
    {
        use std::ptr::null_mut;

        use winapi::um::winuser::{
            FindWindowW, GetWindowLongW, SetWindowLongW, SetWindowPos,
            SetLayeredWindowAttributes,
            GWL_STYLE, GWL_EXSTYLE,
            WS_SYSMENU, WS_MINIMIZEBOX, WS_MAXIMIZEBOX, WS_EX_LAYERED,
            SWP_NOMOVE, SWP_NOSIZE, SWP_NOZORDER, SWP_FRAMECHANGED,
            LWA_COLORKEY,
        };

        // Title must match the window title set in tauri.conf.json
        let title: Vec<u16> = "Pluely - AI Assistant\0".encode_utf16().collect();

        unsafe {
            let hwnd = FindWindowW(null_mut(), title.as_ptr());
                if !hwnd.is_null() {
                // Read current style
                let style = GetWindowLongW(hwnd, GWL_STYLE);
                // Remove system menu and minimize/maximize boxes
                let new_style = style & !(WS_SYSMENU as i32) & !(WS_MINIMIZEBOX as i32) & !(WS_MAXIMIZEBOX as i32);
                let _ = SetWindowLongW(hwnd, GWL_STYLE, new_style);
                // Apply the style change
                let flags = SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED;
                let _ = SetWindowPos(hwnd, 0 as _, 0, 0, 0, 0, flags);

                    // Make the window layered and set a color key to treat white as transparent.
                    // This helps when the webview or native window paints white borders.
                    // Best-effort: preserve existing extended style, then add WS_EX_LAYERED.
                    let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
                    let _ = SetWindowLongW(hwnd, GWL_EXSTYLE, ex_style | (WS_EX_LAYERED as i32));
                    // COLORREF for white is 0x00FFFFFF. Use LWA_COLORKEY to make that color transparent.
                    let _ = SetLayeredWindowAttributes(hwnd, 0x00FFFFFF, 0, LWA_COLORKEY);
            }
        }
    }

    Ok(())
}

/// Positions a window at the top center of the screen with a specified Y offset
pub fn position_window_top_center(window: &WebviewWindow, y_offset: i32) -> Result<(), Box<dyn std::error::Error>> {
    // Get the primary monitor
    if let Some(monitor) = window.primary_monitor()? {
        let monitor_size = monitor.size();
        let window_size = window.outer_size()?;

        // Calculate center X position
        let center_x = (monitor_size.width as i32 - window_size.width as i32) / 2;

        // Set the window position
        window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: center_x,
            y: y_offset,
        }))?;
    }

    Ok(())
}

/// Future function for centering window completely (both X and Y)
#[allow(dead_code)]
pub fn center_window_completely(window: &WebviewWindow) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(monitor) = window.primary_monitor()? {
        let monitor_size = monitor.size();
        let window_size = window.outer_size()?;

        let center_x = (monitor_size.width as i32 - window_size.width as i32) / 2;
        let center_y = (monitor_size.height as i32 - window_size.height as i32) / 2;

        window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: center_x,
            y: center_y,
        }))?;
    }

    Ok(())
}

/// Future function for positioning window at custom coordinates
#[allow(dead_code)]
pub fn position_window_at(window: &WebviewWindow, x: i32, y: i32) -> Result<(), Box<dyn std::error::Error>> {
    window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }))?;
    Ok(())
}
