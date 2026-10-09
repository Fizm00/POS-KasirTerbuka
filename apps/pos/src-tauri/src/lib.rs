use std::io::Write;
use std::net::{SocketAddr, TcpStream, ToSocketAddrs};
use std::time::Duration;

#[tauri::command]
fn list_serial_ports() -> Result<Vec<String>, String> {
    match serialport::available_ports() {
        Ok(ports) => Ok(ports.into_iter().map(|p| p.port_name).collect()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn print_raw_serial(port_name: String, baud_rate: Option<u32>, data: Vec<u8>) -> Result<(), String> {
    let baud = baud_rate.unwrap_or(9600);
    let mut port = serialport::new(&port_name, baud)
        .timeout(Duration::from_secs(5))
        .open()
        .map_err(|e| format!("Gagal membuka port {}: {}", port_name, e))?;

    port.write_all(&data)
        .map_err(|e| format!("Gagal mengirim data ke port {}: {}", port_name, e))?;
    port.flush()
        .map_err(|e| format!("Gagal melakukan flush port {}: {}", port_name, e))?;

    Ok(())
}

#[tauri::command]
fn print_raw_network(address: String, data: Vec<u8>) -> Result<(), String> {
    let addr_str = if address.contains(':') {
        address
    } else {
        format!("{}:9100", address)
    };

    let socket_addrs: Vec<SocketAddr> = addr_str
        .to_socket_addrs()
        .map_err(|e| format!("Alamat printer tidak valid {}: {}", addr_str, e))?
        .collect();

    if socket_addrs.is_empty() {
        return Err("Alamat printer tidak ditemukan".to_string());
    }

    let mut stream = TcpStream::connect_timeout(&socket_addrs[0], Duration::from_secs(5))
        .map_err(|e| format!("Gagal terhubung ke printer di {}: {}", addr_str, e))?;

    stream
        .write_all(&data)
        .map_err(|e| format!("Gagal mengirim data ke printer: {}", e))?;
    stream
        .flush()
        .map_err(|e| format!("Gagal melakukan flush data: {}", e))?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_serial_ports,
            print_raw_serial,
            print_raw_network
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
