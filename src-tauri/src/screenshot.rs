//! Windows-specific invisible area selection & screenshot capture.
//! Provides a global hotkey (configurable) that lets the user drag-select
//! an on-screen rectangle. The overlay window is created as a layered,
//! click-through, exclusion-from-capture window so common recorders /
//! screen sharing tools do not capture it.
//! After selection, the image is captured and emitted to the frontend as a
//! base64 PNG string via a Tauri event `pluely://screenshot-captured`.
//! Frontend can then forward to AI provider.

#[cfg(target_os = "windows")]
mod platform {
    use std::sync::atomic::{AtomicBool, Ordering};
    use std::sync::Mutex;
    use once_cell::sync::Lazy;
    use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, RECT, WPARAM, COLORREF};
    use windows::Win32::Graphics::Gdi::{BitBlt, CreateCompatibleBitmap, CreateCompatibleDC, DeleteDC, DeleteObject, GetDIBits, SelectObject, SRCCOPY, HBITMAP, BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS, GetDC, ReleaseDC};
    use windows::Win32::UI::WindowsAndMessaging::{GetMessageW, TranslateMessage, DispatchMessageW, DefWindowProcW, PostQuitMessage, RegisterClassW, CreateWindowExW, ShowWindow, SetWindowPos, PostMessageW, WNDCLASSW, CS_HREDRAW, CS_VREDRAW, MSG, WM_LBUTTONDOWN, WM_MOUSEMOVE, WM_LBUTTONUP, WM_KEYDOWN, WM_DESTROY, SW_SHOWNOACTIVATE, WS_POPUP, WS_EX_LAYERED, WS_EX_TOOLWINDOW, WS_EX_TOPMOST, WS_EX_NOREDIRECTIONBITMAP, WS_EX_NOACTIVATE, WS_EX_TRANSPARENT, LWA_ALPHA, GetSystemMetrics, SetLayeredWindowAttributes, DestroyWindow, SM_CXSCREEN, SM_CYSCREEN, HMENU, WM_SETCURSOR, LoadCursorW, SetCursor, IDC_ARROW, SWP_NOACTIVATE, SWP_SHOWWINDOW, HWND_TOPMOST};
    use windows::Win32::System::LibraryLoader::GetModuleHandleW;
    use windows::core::PCWSTR;
    use image::{RgbaImage, ImageEncoder};
    use base64::Engine;
    // Key / mouse constants
    const MK_LBUTTON: usize = 0x0001;
    const VK_ESCAPE: i32 = 0x1B;

    static IS_ACTIVE: AtomicBool = AtomicBool::new(false);
    static SELECTION: Lazy<Mutex<Option<RECT>>> = Lazy::new(|| Mutex::new(None));

    const CLASS_NAME: &str = "PluelyInvisibleOverlay";

    fn to_wstring(s: &str) -> Vec<u16> { s.encode_utf16().chain(std::iter::once(0)).collect() }

    unsafe extern "system" fn wnd_proc(hwnd: HWND, msg: u32, w: WPARAM, l: LPARAM) -> LRESULT {
        match msg {
            WM_LBUTTONDOWN => {
                let x = (l.0 & 0xFFFF) as i16 as i32;
                let y = ((l.0 >> 16) & 0xFFFF) as i16 as i32;
                *SELECTION.lock().unwrap() = Some(RECT { left: x, top: y, right: x, bottom: y });
            }
            WM_MOUSEMOVE => {
                if (w.0 & MK_LBUTTON as usize) != 0 {
                    let x = (l.0 & 0xFFFF) as i16 as i32;
                    let y = ((l.0 >> 16) & 0xFFFF) as i16 as i32;
                    if let Some(ref mut r) = *SELECTION.lock().unwrap() { r.right = x; r.bottom = y; }
                }
            }
            WM_LBUTTONUP => { let _ = PostMessageW(hwnd, WM_DESTROY, WPARAM(0), LPARAM(0)); }
            WM_KEYDOWN => { if w.0 as i32 == VK_ESCAPE { *SELECTION.lock().unwrap() = None; let _ = PostMessageW(hwnd, WM_DESTROY, WPARAM(0), LPARAM(0)); } }
            WM_SETCURSOR => {
                // Keep default arrow cursor during selection
                if let Ok(hcursor) = LoadCursorW(None, IDC_ARROW) {
                    if !hcursor.is_invalid() {
                        let _ = SetCursor(hcursor);
                        return LRESULT(1);
                    }
                }
            }
            WM_DESTROY => {
                // Reset cursor to default arrow
                if let Ok(hcursor) = LoadCursorW(None, IDC_ARROW) {
                    if !hcursor.is_invalid() {
                        let _ = SetCursor(hcursor);
                    }
                }
                PostQuitMessage(0);
            }
            _ => {}
        }
        DefWindowProcW(hwnd, msg, w, l)
    }

    pub fn select_and_capture() -> Option<RgbaImage> {
        println!("[screenshot] select_and_capture called");
        if IS_ACTIVE.swap(true, Ordering::SeqCst) { return None; }
        unsafe {
            let hinstance = GetModuleHandleW(PCWSTR::null()).unwrap();
            let class_name = to_wstring(CLASS_NAME);
            let wc = WNDCLASSW {
                lpfnWndProc: Some(wnd_proc),
                hInstance: hinstance.into(),
                lpszClassName: PCWSTR(class_name.as_ptr()),
                style: CS_HREDRAW | CS_VREDRAW,
                ..Default::default()
            };
            let _atom = RegisterClassW(&wc);

            let screen_w = GetSystemMetrics(SM_CXSCREEN);
            let screen_h = GetSystemMetrics(SM_CYSCREEN);

            // Remove WS_EX_TRANSPARENT so we can receive mouse events.
                let hwnd = CreateWindowExW(
                    WS_EX_LAYERED | WS_EX_TOOLWINDOW | WS_EX_TOPMOST | WS_EX_NOREDIRECTIONBITMAP | WS_EX_NOACTIVATE | WS_EX_TRANSPARENT,
                    PCWSTR(class_name.as_ptr()),
                    PCWSTR(class_name.as_ptr()),
                    WS_POPUP,
                    0, 0, screen_w, screen_h,
                    HWND(0), HMENU(0), hinstance, None
                );
                println!("[screenshot] Overlay window created: hwnd={:?}", hwnd);
            if hwnd.0 == 0 { IS_ACTIVE.store(false, Ordering::SeqCst); return None; }
            // Make fully transparent + click-through (except we still receive events via low-level) – this is heuristic.
            // Use a near-transparent window; specify a COLORREF (0) explicitly.
            let alpha: u8 = 40; // more visible for debugging
            let _ = SetLayeredWindowAttributes(hwnd, COLORREF(0), alpha, LWA_ALPHA);
            let _ = ShowWindow(hwnd, SW_SHOWNOACTIVATE);
            // Ensure overlay is topmost but never activated
            let _ = SetWindowPos(
                hwnd,
                HWND_TOPMOST,
                0, 0, 0, 0,
                SWP_NOACTIVATE | SWP_SHOWWINDOW
            );
            // Do NOT call SetForegroundWindow or SetFocus anywhere for overlay
            println!("[screenshot] Overlay window shown and foregrounded");
            // Keep default arrow cursor
            if let Ok(hcursor) = LoadCursorW(None, IDC_ARROW) {
                if !hcursor.is_invalid() {
                    let _ = SetCursor(hcursor);
                }
            }            // Message loop
            loop {
                let mut msg = MSG::default();
                let res = GetMessageW(&mut msg, HWND(0), 0, 0);
                if res.0 == 0 || res.0 == -1 { break; }
                let _ = TranslateMessage(&msg); DispatchMessageW(&msg);
                if msg.message == WM_DESTROY { break; }
            }
            let _ = DestroyWindow(hwnd);
            IS_ACTIVE.store(false, Ordering::SeqCst);
        }

        // Compute normalized rect
        let rect_opt = SELECTION.lock().unwrap().take();
        if let Some(r) = rect_opt { return capture_rect(r); }
        None
    }

    fn capture_rect(mut r: RECT) -> Option<RgbaImage> {
        unsafe {
            // Normalize
            if r.left > r.right { std::mem::swap(&mut r.left, &mut r.right); }
            if r.top > r.bottom { std::mem::swap(&mut r.top, &mut r.bottom); }
            let w = (r.right - r.left).max(1);
            let h = (r.bottom - r.top).max(1);
            let hdc_screen = GetDC(HWND(0));
            if hdc_screen.0 == 0 { return None; }
            let hdc_mem = CreateCompatibleDC(hdc_screen);
            let hbmp = CreateCompatibleBitmap(hdc_screen, w, h);
            let prev = SelectObject(hdc_mem, HBITMAP(hbmp.0 as isize));
            let _ = BitBlt(hdc_mem, 0,0,w,h, hdc_screen, r.left, r.top, SRCCOPY);

            // Extract pixels
            let mut bmi = BITMAPINFO::default();
            bmi.bmiHeader = BITMAPINFOHEADER {
                biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                biWidth: w,
                biHeight: -h, // top-down
                biPlanes: 1,
                biBitCount: 32,
                biCompression: BI_RGB.0,
                ..Default::default()
            };
            let buf_size = (w * h * 4) as usize;
            let mut buf = vec![0u8; buf_size];
            let got = GetDIBits(hdc_mem, hbmp, 0, h as u32, Some(buf.as_mut_ptr() as *mut _), &mut bmi, DIB_RGB_COLORS);
            // Cleanup
            SelectObject(hdc_mem, prev);
            let _ = DeleteObject(hbmp);
            let _ = DeleteDC(hdc_mem);
            ReleaseDC(HWND(0), hdc_screen);
            if got == 0 { return None; }

            // BGRA -> RGBA
            for px in buf.chunks_exact_mut(4) { px.swap(0,2); }
            let img = RgbaImage::from_raw(w as u32, h as u32, buf)?;
            Some(img)
        }
    }

    fn capture_fullscreen() -> Option<RgbaImage> {
        unsafe {
            let screen_w = GetSystemMetrics(SM_CXSCREEN);
            let screen_h = GetSystemMetrics(SM_CYSCREEN);

            let hdc_screen = GetDC(HWND(0));
            if hdc_screen.0 == 0 { return None; }

            let hdc_mem = CreateCompatibleDC(hdc_screen);
            let hbmp = CreateCompatibleBitmap(hdc_screen, screen_w, screen_h);
            let prev = SelectObject(hdc_mem, HBITMAP(hbmp.0 as isize));

            // Capture entire screen
            let _ = BitBlt(hdc_mem, 0, 0, screen_w, screen_h, hdc_screen, 0, 0, SRCCOPY);

            // Extract pixels
            let mut bmi = BITMAPINFO::default();
            bmi.bmiHeader = BITMAPINFOHEADER {
                biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                biWidth: screen_w,
                biHeight: -screen_h, // top-down
                biPlanes: 1,
                biBitCount: 32,
                biCompression: BI_RGB.0,
                ..Default::default()
            };

            let buf_size = (screen_w * screen_h * 4) as usize;
            let mut buf = vec![0u8; buf_size];
            let got = GetDIBits(hdc_mem, hbmp, 0, screen_h as u32, Some(buf.as_mut_ptr() as *mut _), &mut bmi, DIB_RGB_COLORS);

            // Cleanup
            SelectObject(hdc_mem, prev);
            let _ = DeleteObject(hbmp);
            let _ = DeleteDC(hdc_mem);
            ReleaseDC(HWND(0), hdc_screen);

            if got == 0 { return None; }

            // BGRA -> RGBA
            for px in buf.chunks_exact_mut(4) { px.swap(0,2); }
            let img = RgbaImage::from_raw(screen_w as u32, screen_h as u32, buf)?;
            Some(img)
        }
    }

    pub fn capture_fullscreen_base64_png() -> Option<String> {
        use chrono::Local;
        use std::path::Path;

        println!("[screenshot] Starting fullscreen capture...");
        let img = match capture_fullscreen() {
            Some(img) => {
                println!("[screenshot] Captured fullscreen image: {}x{}", img.width(), img.height());
                img
            }
            None => {
                println!("[screenshot] Fullscreen capture failed");
                return None;
            }
        };

        // Save PNG to screenshots/ with timestamp (relative to project root)
        let now = Local::now();
        let folder = Path::new("../screenshots"); // Go up from src-tauri to project root
        if !folder.exists() {
            if let Err(e) = std::fs::create_dir_all(folder) {
                println!("[screenshot] Failed to create screenshots folder: {}", e);
            }
        }
        let filename = folder.join(format!("fullscreen-{}.png", now.format("%Y%m%d-%H%M%S")));
        println!("[screenshot] Attempting to save fullscreen to: {}", filename.display());

        use std::fs::File;
        use std::io::BufWriter;

        match File::create(&filename) {
            Ok(file) => {
                let w = BufWriter::new(file);
                match image::codecs::png::PngEncoder::new(w)
                    .write_image(
                        &img,
                        img.width(),
                        img.height(),
                        image::ExtendedColorType::Rgba8,
                    ) {
                    Ok(_) => {
                        println!("[screenshot] Successfully saved fullscreen to {}", filename.canonicalize().map(|p| p.display().to_string()).unwrap_or_else(|_| filename.display().to_string()));
                    }
                    Err(e) => {
                        println!("[screenshot] Failed to encode PNG: {}", e);
                        return None;
                    }
                }
            }
            Err(e) => {
                println!("[screenshot] Failed to create file {}: {}", filename.display(), e);
                return None;
            }
        }

        // Also return base64 for frontend
        let mut bytes = Vec::new();
        if image::codecs::png::PngEncoder::new(&mut bytes).write_image(&img, img.width(), img.height(), image::ExtendedColorType::Rgba8).is_ok() {
            let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
            println!("[screenshot] Generated fullscreen base64 data, length: {}", b64.len());
            Some(b64)
        } else {
            println!("[screenshot] Failed to encode fullscreen base64");
            None
        }
    }

    pub fn capture_base64_png() -> Option<String> {
        use chrono::Local;
        use std::path::Path;
        use std::fs::File;
        use std::io::BufWriter;

        println!("[screenshot] Starting screenshot capture...");
        let img = match select_and_capture() {
            Some(img) => {
                println!("[screenshot] Captured image: {}x{}", img.width(), img.height());
                img
            }
            None => {
                println!("[screenshot] No image captured (selection cancelled or failed)");
                return None;
            }
        };

        // Save PNG to screenshots/ with timestamp (relative to project root)
        let now = Local::now();
        let folder = Path::new("../screenshots"); // Go up from src-tauri to project root
        if !folder.exists() {
            if let Err(e) = std::fs::create_dir_all(folder) {
                println!("[screenshot] Failed to create screenshots folder: {}", e);
            }
        }
        let filename = folder.join(format!("screenshot-{}.png", now.format("%Y%m%d-%H%M%S")));
        println!("[screenshot] Attempting to save to: {}", filename.display());

        match File::create(&filename) {
            Ok(file) => {
                let w = BufWriter::new(file);
                match image::codecs::png::PngEncoder::new(w)
                    .write_image(
                        &img,
                        img.width(),
                        img.height(),
                        image::ExtendedColorType::Rgba8,
                    ) {
                    Ok(_) => {
                        println!("[screenshot] Successfully saved screenshot to {}", filename.canonicalize().map(|p| p.display().to_string()).unwrap_or_else(|_| filename.display().to_string()));
                    }
                    Err(e) => {
                        println!("[screenshot] Failed to encode PNG: {}", e);
                        return None;
                    }
                }
            }
            Err(e) => {
                println!("[screenshot] Failed to create file {}: {}", filename.display(), e);
                return None;
            }
        }

        // Also return base64 for frontend
        let mut bytes = Vec::new();
        if image::codecs::png::PngEncoder::new(&mut bytes).write_image(&img, img.width(), img.height(), image::ExtendedColorType::Rgba8).is_ok() {
            let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
            println!("[screenshot] Generated base64 data, length: {}", b64.len());
            Some(b64)
        } else {
            println!("[screenshot] Failed to encode base64");
            None
        }
    }
}

#[tauri::command]
pub fn invoke_area_screenshot() -> Result<Option<String>, String> {
    #[cfg(target_os = "windows")]
    {
        Ok(platform::capture_base64_png())
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("Area screenshot only implemented for Windows in this build".into())
    }
}

#[tauri::command]
pub fn invoke_fullscreen_screenshot() -> Result<Option<String>, String> {
    #[cfg(target_os = "windows")]
    {
        Ok(platform::capture_fullscreen_base64_png())
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("Fullscreen screenshot only implemented for Windows in this build".into())
    }
}
