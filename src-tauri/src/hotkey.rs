// Hotkey management for mode switching functionality

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HotkeyRegistration {
    pub id: String,
    pub hotkey: String,
    pub mode: String,
}

// Global hotkey registry
lazy_static::lazy_static! {
    static ref HOTKEY_REGISTRY: Arc<Mutex<HashMap<String, HotkeyRegistration>>> = 
        Arc::new(Mutex::new(HashMap::new()));
}

#[tauri::command]
pub fn register_hotkey(id: String, hotkey: String, mode: String) -> Result<(), String> {
    println!("Registering hotkey: {} -> {} (mode: {})", hotkey, id, mode);
    
    let registration = HotkeyRegistration {
        id: id.clone(),
        hotkey: hotkey.clone(),
        mode,
    };
    
    // Store in registry
    if let Ok(mut registry) = HOTKEY_REGISTRY.lock() {
        registry.insert(id, registration);
    }
    
    // Note: Actual hotkey registration would happen in the main hotkey loop
    // For now, we'll integrate with the existing system
    println!("Hotkey registered successfully: {}", hotkey);
    Ok(())
}

#[tauri::command]
pub fn unregister_hotkey(id: String) -> Result<(), String> {
    println!("Unregistering hotkey: {}", id);
    
    if let Ok(mut registry) = HOTKEY_REGISTRY.lock() {
        registry.remove(&id);
    }
    
    println!("Hotkey unregistered successfully: {}", id);
    Ok(())
}

#[tauri::command]
pub fn unregister_all_hotkeys() -> Result<(), String> {
    println!("Unregistering all mode switching hotkeys");
    
    if let Ok(mut registry) = HOTKEY_REGISTRY.lock() {
        registry.clear();
    }
    
    println!("All hotkeys unregistered successfully");
    Ok(())
}

#[tauri::command]
pub fn is_hotkey_available(hotkey: String) -> Result<bool, String> {
    // For now, assume all hotkeys are available
    // In a real implementation, this would check with the OS
    println!("Checking hotkey availability: {}", hotkey);
    Ok(true)
}

#[tauri::command]
pub fn get_registered_hotkeys() -> Result<String, String> {
    if let Ok(registry) = HOTKEY_REGISTRY.lock() {
        let hotkeys: Vec<HotkeyRegistration> = registry.values().cloned().collect();
        serde_json::to_string(&hotkeys)
            .map_err(|e| format!("Failed to serialize hotkeys: {}", e))
    } else {
        Err("Failed to access hotkey registry".to_string())
    }
}

// Function to handle mode switching hotkey activation
pub fn handle_mode_hotkey(app_handle: &AppHandle, mode: &str) -> Result<(), String> {
    println!("Mode hotkey activated: {}", mode);
    
    // Emit event to frontend
    app_handle
        .emit("tauri://hotkey", serde_json::json!({ "mode": mode }))
        .map_err(|e| format!("Failed to emit hotkey event: {}", e))?;
    
    println!("Mode hotkey event emitted successfully");
    Ok(())
}

// Integration with existing hotkey system
pub fn setup_mode_hotkeys(app_handle: AppHandle) {
    use std::thread;
    
    // Clone the AppHandle for the background thread
    let ah = app_handle.clone();
    
    thread::spawn(move || {
        #[cfg(target_os = "windows")]
        {
            use winapi::shared::windef::HWND;
            use winapi::um::winuser::{RegisterHotKey, GetMessageW, MSG, WM_HOTKEY};
            
            // Register mode switching hotkeys
            // id 11-14: Mode switching hotkeys (Ctrl+Alt+1-4)
            let _ = unsafe { RegisterHotKey(0 as HWND, 11, (0x0002 | 0x0001) as u32, '1' as u32) }; // MCQ
            let _ = unsafe { RegisterHotKey(0 as HWND, 12, (0x0002 | 0x0001) as u32, '2' as u32) }; // Coding
            let _ = unsafe { RegisterHotKey(0 as HWND, 13, (0x0002 | 0x0001) as u32, '3' as u32) }; // Verbal Interview
            let _ = unsafe { RegisterHotKey(0 as HWND, 14, (0x0002 | 0x0001) as u32, '4' as u32) }; // Theoretical
            
            println!("Mode switching hotkeys registered");
            
            // Message loop for mode switching hotkeys
            let mut msg: MSG = unsafe { std::mem::zeroed() };
            while unsafe { GetMessageW(&mut msg as *mut MSG, 0 as HWND, 0, 0) } > 0 {
                if msg.message == WM_HOTKEY {
                    let id = msg.wParam as usize;
                    
                    match id {
                        11 => {
                            let _ = handle_mode_hotkey(&ah, "mcq");
                        },
                        12 => {
                            let _ = handle_mode_hotkey(&ah, "coding");
                        },
                        13 => {
                            let _ = handle_mode_hotkey(&ah, "verbal_interview");
                        },
                        14 => {
                            let _ = handle_mode_hotkey(&ah, "theoretical");
                        },
                        _ => {}
                    }
                }
            }
            
            // Cleanup
            let _ = unsafe { winapi::um::winuser::UnregisterHotKey(0 as HWND, 11) };
            let _ = unsafe { winapi::um::winuser::UnregisterHotKey(0 as HWND, 12) };
            let _ = unsafe { winapi::um::winuser::UnregisterHotKey(0 as HWND, 13) };
            let _ = unsafe { winapi::um::winuser::UnregisterHotKey(0 as HWND, 14) };
        }
        
        #[cfg(not(target_os = "windows"))]
        {
            // For non-Windows platforms, we would implement platform-specific hotkey registration
            println!("Mode switching hotkeys not implemented for this platform yet");
        }
    });
}