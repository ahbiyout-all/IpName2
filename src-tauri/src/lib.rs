use base64::{Engine as _, engine::general_purpose};
use std::process::Command;

mod windows_native;

use windows_native::{SystemInfo, NetworkAdapter, PingResult, SubnetDetails, IpConflictResult, TcpPortResult, IpClassificationResult};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(serde::Serialize)]
pub struct CommandResponse {
    code: i32,
    stdout: String,
    stderr: String,
}

fn encode_powershell_command(script: &str) -> String {
    let utf16: Vec<u16> = script.encode_utf16().collect();
    let mut bytes = Vec::with_capacity(utf16.len() * 2);
    for word in utf16 {
        bytes.push((word & 0xFF) as u8);
        bytes.push((word >> 8) as u8);
    }
    general_purpose::STANDARD.encode(&bytes)
}

#[tauri::command]
async fn execute_powershell(script: String, require_admin: bool) -> Result<CommandResponse, String> {
    #[cfg(windows)]
    {
        let encoded_cmd = encode_powershell_command(&script);
        
        let mut args = vec![
            "-NoProfile".to_string(),
            "-NonInteractive".to_string(),
            "-ExecutionPolicy".to_string(),
            "Bypass".to_string(),
            "-WindowStyle".to_string(),
            "Hidden".to_string(),
            "-EncodedCommand".to_string(),
        ];

        if require_admin {
            let elevate_script = format!(
                r#"try {{ $p = Start-Process powershell -ArgumentList "-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -EncodedCommand {}" -Verb RunAs -Wait -PassThru -ErrorAction Stop; exit $p.ExitCode }} catch {{ exit 1 }}"#,
                encoded_cmd
            );
            let elevate_encoded = encode_powershell_command(&elevate_script);
            args.push(elevate_encoded);
        } else {
            args.push(encoded_cmd);
        }

        let output = Command::new("powershell")
            .args(args)
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map_err(|e| e.to_string())?;

        Ok(CommandResponse {
            code: output.status.code().unwrap_or(if output.status.success() { 0 } else { 1 }),
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        })
    }

    #[cfg(not(windows))]
    {
        Ok(CommandResponse {
            code: -1,
            stdout: "".to_string(),
            stderr: "PowerShell is only supported on Windows.".to_string(),
        })
    }
}

#[tauri::command]
async fn get_system_info() -> Result<SystemInfo, String> {
    windows_native::get_system_info_native()
}

#[tauri::command]
async fn get_adapters() -> Result<Vec<NetworkAdapter>, String> {
    windows_native::get_adapters_native()
}

#[tauri::command]
async fn ping_ipv4(target_ip: String, timeout_ms: u32) -> Result<PingResult, String> {
    windows_native::ping_ipv4_native(&target_ip, timeout_ms)
}

#[tauri::command]
async fn calculate_subnet(ip: String, mask: String) -> Result<SubnetDetails, String> {
    windows_native::calculate_subnet_native(&ip, &mask)
}

#[tauri::command]
async fn check_ip_conflict(target_ip: String, source_ip: Option<String>) -> Result<IpConflictResult, String> {
    windows_native::check_ip_conflict_native(&target_ip, source_ip.as_deref())
}

#[tauri::command]
async fn check_tcp_port(target_ip: String, port: u16, timeout_ms: u32) -> Result<TcpPortResult, String> {
    windows_native::check_tcp_port_native(&target_ip, port, timeout_ms)
}

#[tauri::command]
async fn classify_ip(ip: String) -> Result<IpClassificationResult, String> {
    windows_native::classify_ip_native(&ip)
}

pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_process::init())
    .invoke_handler(tauri::generate_handler![
        execute_powershell,
        get_system_info,
        get_adapters,
        ping_ipv4,
        calculate_subnet,
        check_ip_conflict,
        check_tcp_port,
        classify_ip
    ])

    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
