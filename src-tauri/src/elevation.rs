// Elevation support: relaunching the app with Administrator rights to save
// files that the current user can't write (e.g. C:\Windows\..., hosts, etc.).
//
// Architecture:
//   1. App #1 (no admin) catches "Access denied" on save.
//   2. JS layer serialises full app state to JSON (path, content, isDirty,
//      mode, uiSettings) and stores it at %TEMP%\arkd-md-viewer\elevation-state.json.
//   3. JS calls Tauri command `restart_elevated` (defined in commands.rs).
//   4. That command invokes `request_elevation()` below — on Windows, uses
//      ShellExecuteW with verb="runas" to spawn ourselves with the
//      `--elevated-startup <state-path>` argument. The shell shows the UAC
//      prompt; we don't wait for its result.
//   5. App #1 exits (cleanly closes its window).
//   6. If user accepts UAC: App #2 starts elevated, sees `--elevated-startup`,
//      reads the state file, restores everything.
//      If user declines: App #2 never starts. The state file stays in TEMP.
//   7. On next normal launch, App detects the orphan state file and offers
//      recovery (handled by `check_for_recovery_state()` below).
//
// Non-Windows builds get a stub that always returns Err — JS shows a manual
// re-launch prompt instead.

use std::path::PathBuf;
use std::sync::Mutex;
use once_cell::sync::Lazy;

/// Path to the orphaned state file, if any was discovered at startup.
/// JS calls `consume_recovery_state()` to read and clear it.
static RECOVERY_STATE: Lazy<Mutex<Option<String>>> = Lazy::new(|| Mutex::new(None));

/// Path to the freshly-loaded elevation state from `--elevated-startup`.
/// Available only when the process was launched via UAC re-launch.
static ELEVATED_STATE: Lazy<Mutex<Option<String>>> = Lazy::new(|| Mutex::new(None));

/// Directory where we keep elevation state files.
/// Resolves to e.g. `C:\Users\<name>\AppData\Local\Temp\arkd-md-viewer\`
pub fn state_dir() -> Option<PathBuf> {
    dirs::cache_dir().map(|p| p.join("arkd-md-viewer"))
}

pub fn state_file_path() -> Option<PathBuf> {
    state_dir().map(|d| d.join("elevation-state.json"))
}

/// Called early in main() to detect both startup scenarios:
///   - `--elevated-startup <path>`: process was relaunched with admin rights
///     and should load state from <path>.
///   - Otherwise: check if a leftover state file exists from a previous
///     elevation attempt that was abandoned (UAC declined, crash, etc.)
///     and remember its path for recovery prompt.
pub fn check_startup_args(args: &[String]) {
    // Elevated re-launch path
    if let Some(idx) = args.iter().position(|a| a == "--elevated-startup") {
        if let Some(state_path) = args.get(idx + 1) {
            *ELEVATED_STATE.lock().unwrap() = Some(state_path.clone());
        }
        return;
    }

    // Normal launch — check for orphaned state file
    if let Some(path) = state_file_path() {
        if path.exists() {
            *RECOVERY_STATE.lock().unwrap() = Some(path.to_string_lossy().into_owned());
        }
    }
}

pub fn consume_elevated_state() -> Option<String> {
    let path = ELEVATED_STATE.lock().unwrap().take()?;
    std::fs::read_to_string(&path).ok()
}

pub fn consume_recovery_state() -> Option<String> {
    let path = RECOVERY_STATE.lock().unwrap().take()?;
    std::fs::read_to_string(&path).ok()
}

pub fn clear_state_file() {
    if let Some(path) = state_file_path() {
        let _ = std::fs::remove_file(path);
    }
}

pub fn write_state_file(json: &str) -> Result<String, String> {
    let dir = state_dir().ok_or_else(|| "cannot resolve cache dir".to_string())?;
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("create state dir: {}", e))?;
    let path = dir.join("elevation-state.json");
    std::fs::write(&path, json)
        .map_err(|e| format!("write state file: {}", e))?;
    Ok(path.to_string_lossy().into_owned())
}

/// Windows implementation: launch our own exe with UAC prompt via the shell's
/// runas verb. Returns immediately (we don't wait for the new process).
#[cfg(target_os = "windows")]
pub fn request_elevation(state_path: &str) -> Result<(), String> {
    use std::os::windows::ffi::OsStrExt;
    use std::ffi::OsStr;
    use windows::core::PCWSTR;
    use windows::Win32::UI::Shell::{ShellExecuteW, SE_ERR_ACCESSDENIED};
    use windows::Win32::UI::WindowsAndMessaging::SW_NORMAL;

    let exe = std::env::current_exe()
        .map_err(|e| format!("current_exe: {}", e))?;
    let exe_str = exe.to_string_lossy().into_owned();

    // Build command line: --elevated-startup "<state_path>"
    // We quote the path in case it contains spaces (TEMP can have spaces).
    let params = format!("--elevated-startup \"{}\"", state_path);

    let verb: Vec<u16> = OsStr::new("runas").encode_wide().chain(std::iter::once(0)).collect();
    let file: Vec<u16> = OsStr::new(&exe_str).encode_wide().chain(std::iter::once(0)).collect();
    let parameters: Vec<u16> = OsStr::new(&params).encode_wide().chain(std::iter::once(0)).collect();

    // SAFETY: All pointers are valid for the duration of the call. ShellExecuteW
    // is the documented way to request UAC elevation on Windows.
    let result = unsafe {
        ShellExecuteW(
            None,
            PCWSTR(verb.as_ptr()),
            PCWSTR(file.as_ptr()),
            PCWSTR(parameters.as_ptr()),
            PCWSTR::null(),
            SW_NORMAL,
        )
    };

    // ShellExecuteW returns HINSTANCE; values > 32 indicate success.
    // Values <= 32 are error codes (e.g. SE_ERR_ACCESSDENIED if user cancelled UAC).
    let code = result.0 as isize;
    if code <= 32 {
        if code == SE_ERR_ACCESSDENIED as isize {
            return Err("user_cancelled_uac".to_string());
        }
        return Err(format!("ShellExecuteW failed with code {}", code));
    }
    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub fn request_elevation(_state_path: &str) -> Result<(), String> {
    Err("elevation_not_supported_on_this_platform".to_string())
}

/// Best-effort check: are we currently running with admin/root privileges?
/// Used to show the "Administrator" indicator in the UI.
#[cfg(target_os = "windows")]
pub fn is_elevated() -> bool {
    use windows::Win32::Foundation::{CloseHandle, HANDLE};
    use windows::Win32::Security::{GetTokenInformation, TokenElevation, TOKEN_ELEVATION, TOKEN_QUERY};
    use windows::Win32::System::Threading::{GetCurrentProcess, OpenProcessToken};

    unsafe {
        let mut token: HANDLE = HANDLE::default();
        if OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token).is_err() {
            return false;
        }
        let mut elevation = TOKEN_ELEVATION::default();
        let mut size = std::mem::size_of::<TOKEN_ELEVATION>() as u32;
        let result = GetTokenInformation(
            token,
            TokenElevation,
            Some(&mut elevation as *mut _ as *mut _),
            size,
            &mut size,
        );
        let _ = CloseHandle(token);
        result.is_ok() && elevation.TokenIsElevated != 0
    }
}

#[cfg(not(target_os = "windows"))]
pub fn is_elevated() -> bool {
    // On Unix, check euid == 0 (root). Most desktop users aren't root,
    // so this almost always returns false — which is the correct answer
    // since we don't auto-elevate on these platforms anyway.
    #[cfg(unix)]
    {
        // SAFETY: getuid is always safe to call.
        unsafe { libc_getuid() == 0 }
    }
    #[cfg(not(unix))]
    {
        false
    }
}

#[cfg(all(unix, not(target_os = "windows")))]
extern "C" {
    #[link_name = "geteuid"]
    fn libc_getuid() -> u32;
}
