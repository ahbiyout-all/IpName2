use serde::Serialize;

#[derive(Serialize, Clone, Debug)]
pub struct SystemInfo {
    pub computerName: String,
    pub workgroup: String,
    pub osVersion: String,
    pub processor: String,
    pub ram: String,
    pub isAdmin: bool,
}

#[derive(Serialize, Clone, Debug)]
pub struct NetworkAdapter {
    pub id: String,
    pub name: String,
    pub r#type: String, // "Ethernet" | "Wi-Fi"
    pub status: String, // "Connected" | "Disconnected" | "Disabled"
    pub ipAddress: String,
    pub subnetMask: String,
    pub gateway: String,
    pub primaryDns: String,
    pub secondaryDns: String,
    pub macAddress: String,
    pub isDhcp: bool,
    pub isEnabled: bool,
}

#[derive(Serialize, Clone, Debug)]
pub struct PingResult {
    pub round_trip_time_ms: u32,
    pub time_to_live: u32,
    pub success: bool,
    pub message: String,
}

#[derive(Serialize, Clone, Debug)]
pub struct SubnetDetails {
    pub network_address: String,
    pub broadcast_address: String,
    pub first_usable_ip: String,
    pub last_usable_ip: String,
    pub usable_hosts: u32,
    pub cidr_prefix: u32,
}

#[derive(Serialize, Clone, Debug)]
pub struct IpConflictResult {
    pub is_conflict: bool,
    pub conflicting_mac: String,
    pub message: String,
}

#[derive(Serialize, Clone, Debug)]
pub struct TcpPortResult {
    pub is_open: bool,
    pub latency_ms: u32,
    pub message: String,
}

#[derive(Serialize, Clone, Debug)]
pub struct IpClassificationResult {
    pub category: String,
    pub scope_desc: String,
    pub is_routable: bool,
}

#[cfg(windows)]
unsafe fn read_registry_string(hkey: windows_sys::Win32::System::Registry::HKEY, subkey: &str, value_name: &str) -> Option<String> {
    use windows_sys::Win32::System::Registry::*;
    use std::os::windows::ffi::OsStrExt;
    
    let subkey_w: Vec<u16> = std::ffi::OsStr::new(subkey).encode_wide().chain(std::iter::once(0)).collect();
    let value_w: Vec<u16> = std::ffi::OsStr::new(value_name).encode_wide().chain(std::iter::once(0)).collect();
    
    let mut hsub_key: HKEY = 0;
    if RegOpenKeyExW(hkey, subkey_w.as_ptr(), 0, KEY_READ, &mut hsub_key) != 0 {
        return None;
    }
    
    let mut val_type: u32 = 0;
    let mut len: u32 = 0;
    if RegQueryValueExW(hsub_key, value_w.as_ptr(), std::ptr::null_mut(), &mut val_type, std::ptr::null_mut(), &mut len) != 0 {
        RegCloseKey(hsub_key);
        return None;
    }
    
    let mut buffer = vec![0u8; len as usize];
    if RegQueryValueExW(hsub_key, value_w.as_ptr(), std::ptr::null_mut(), &mut val_type, buffer.as_mut_ptr(), &mut len) != 0 {
        RegCloseKey(hsub_key);
        return None;
    }
    
    RegCloseKey(hsub_key);
    
    if val_type == REG_SZ || val_type == REG_EXPAND_SZ {
        let u16_slice = std::slice::from_raw_parts(buffer.as_ptr() as *const u16, len as usize / 2);
        let mut s = String::from_utf16_lossy(u16_slice);
        if s.ends_with('\0') {
            s.pop();
        }
        Some(s.trim().to_string())
    } else {
        None
    }
}

#[cfg(windows)]
pub fn get_system_info_native() -> Result<SystemInfo, String> {
    use windows_sys::Win32::System::SystemInformation::*;
    use windows_sys::Win32::System::Registry::*;
    use windows_sys::Win32::NetworkManagement::NetManagement::*;
    use windows_sys::Win32::Security::*;
    use windows_sys::Win32::System::Threading::*;
    use windows_sys::Win32::Foundation::*;
    
    unsafe {
        // 1. Computer Name
        let mut len = 0;
        GetComputerNameExW(ComputerNamePhysicalDnsHostname, std::ptr::null_mut(), &mut len);
        let mut buf = vec![0u16; len as usize];
        let computer_name = if GetComputerNameExW(ComputerNamePhysicalDnsHostname, buf.as_mut_ptr(), &mut len) != 0 {
            let mut s = String::from_utf16_lossy(&buf[..len as usize]);
            if s.ends_with('\0') { s.pop(); }
            s
        } else {
            "Unknown".to_string()
        };

        // 2. Workgroup / Domain
        let mut domain_buf: *mut u16 = std::ptr::null_mut();
        let mut join_status = 0;
        let mut workgroup = "WORKGROUP".to_string();
        if NetGetJoinInformation(std::ptr::null(), &mut domain_buf, &mut join_status) == 0 {
            if !domain_buf.is_null() {
                let mut len = 0;
                while *domain_buf.add(len) != 0 {
                    len += 1;
                }
                let slice = std::slice::from_raw_parts(domain_buf, len);
                workgroup = String::from_utf16_lossy(slice);
                NetApiBufferFree(domain_buf as *mut _);
            }
        }

        // 3. CPU Name
        let processor = read_registry_string(HKEY_LOCAL_MACHINE, "HARDWARE\\DESCRIPTION\\System\\CentralProcessor\\0", "ProcessorNameString")
            .unwrap_or_else(|| "Unknown Processor".to_string());

        // 4. OS Version
        let mut os_name = read_registry_string(HKEY_LOCAL_MACHINE, "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion", "ProductName")
            .unwrap_or_else(|| "Windows 11".to_string());
        let display_version = read_registry_string(HKEY_LOCAL_MACHINE, "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion", "DisplayVersion")
            .unwrap_or_default();
        let current_build_str = read_registry_string(HKEY_LOCAL_MACHINE, "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion", "CurrentBuild")
            .or_else(|| read_registry_string(HKEY_LOCAL_MACHINE, "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion", "CurrentBuildNumber"))
            .unwrap_or_default();
        let build_num: u32 = current_build_str.parse().unwrap_or(0);

        // Windows 11 Detection:
        // Microsoft keeps "Windows 10" in the ProductName registry entry on Windows 11 for legacy compatibility.
        // Any build number >= 22000 or DisplayVersion >= 23H2/24H2/25H2 is definitively Windows 11!
        if build_num >= 22000 || display_version.starts_with("23") || display_version.starts_with("24") || display_version.starts_with("25") || display_version.starts_with("26") {
            if os_name.contains("Windows 10") {
                os_name = os_name.replace("Windows 10", "Windows 11");
            } else if !os_name.contains("Windows 11") && !os_name.contains("Server") {
                os_name = format!("Windows 11 {}", os_name);
            }
        }

        let os_version = if display_version.is_empty() {
            os_name
        } else {
            format!("{} {}", os_name, display_version)
        };

        // 5. RAM
        let mut mem_status: MEMORYSTATUSEX = std::mem::zeroed();
        mem_status.dwLength = std::mem::size_of::<MEMORYSTATUSEX>() as u32;
        let ram = if GlobalMemoryStatusEx(&mut mem_status) != 0 {
            let gb = (mem_status.ullTotalPhys as f64) / (1024.0 * 1024.0 * 1024.0);
            format!("{:.1} GB", gb)
        } else {
            "Unknown".to_string()
        };

        // 6. Is Admin
        let mut is_admin = false;
        let mut token: HANDLE = 0;
        if OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token) != 0 {
            let mut elevation: TOKEN_ELEVATION = std::mem::zeroed();
            let mut return_len = 0;
            if GetTokenInformation(
                token,
                TokenElevation,
                &mut elevation as *mut _ as *mut _,
                std::mem::size_of::<TOKEN_ELEVATION>() as u32,
                &mut return_len,
            ) != 0 {
                is_admin = elevation.TokenIsElevated != 0;
            }
            CloseHandle(token);
        }

        Ok(SystemInfo {
            computerName: computer_name,
            workgroup,
            osVersion: os_version,
            processor,
            ram,
            isAdmin: is_admin,
        })
    }
}

#[cfg(windows)]
pub fn get_adapters_native() -> Result<Vec<NetworkAdapter>, String> {
    use windows_sys::Win32::NetworkManagement::IpHelper::*;
    use windows_sys::Win32::Networking::WinSock::*;
    use windows_sys::Win32::NetworkManagement::Ndis::*;
    use std::ptr;
    
    unsafe {
        let mut size: u32 = 32768;
        let mut buf = vec![0u8; size as usize];
        // GAA_FLAG_INCLUDE_GATEWAYS (0x0080) | GAA_FLAG_INCLUDE_ALL_INTERFACES (0x0100)
        let flags = GAA_FLAG_INCLUDE_GATEWAYS | GAA_FLAG_INCLUDE_ALL_INTERFACES;
        
        // Multi-round allocation safety loop to handle high-density network/VPN setups
        let mut ret = 111;
        for _ in 0..3 {
            ret = GetAdaptersAddresses(
                AF_UNSPEC as u32,
                flags,
                ptr::null_mut(),
                buf.as_mut_ptr() as *mut _,
                &mut size,
            );
            if ret != 111 { // Not ERROR_BUFFER_OVERFLOW
                break;
            }
            // Add safety margin to size to prevent race conditions
            size += 8192;
            buf = vec![0u8; size as usize];
        }
        
        if ret != 0 {
            return Err(format!("GetAdaptersAddresses failed with error code {}", ret));
        }
        
        let mut adapters = Vec::new();
        let mut curr = buf.as_ptr() as *const IP_ADAPTER_ADDRESSES_LH;
        
        while !curr.is_null() {
            let addr = &*curr;
            
            // 1. Get ID (AdapterName)
            let mut len = 0;
            while *addr.AdapterName.add(len) != 0 {
                len += 1;
            }
            let name_slice = std::slice::from_raw_parts(addr.AdapterName, len);
            let id = String::from_utf8_lossy(name_slice).into_owned();
            
            // 2. Get Name (FriendlyName)
            let mut len = 0;
            while *addr.FriendlyName.add(len) != 0 {
                len += 1;
            }
            let name_slice = std::slice::from_raw_parts(addr.FriendlyName, len);
            let name = String::from_utf16_lossy(name_slice);

            // Get Description (Description)
            let mut desc = String::new();
            if !addr.Description.is_null() {
                let mut dlen = 0;
                while *addr.Description.add(dlen) != 0 {
                    dlen += 1;
                }
                if dlen > 0 {
                    let desc_slice = std::slice::from_raw_parts(addr.Description, dlen);
                    desc = String::from_utf16_lossy(desc_slice);
                }
            }

            let name_lower = name.to_lowercase();
            let desc_lower = desc.to_lowercase();

            // Skip Loopback, Tunnel, and Filter Drivers (WFP, QoS, Npcap, Kernel Debug, WAN Miniport, Bluetooth, Wi-Fi Direct, etc.)
            let is_filter_or_pseudo = 
                addr.IfType == 24 // IF_TYPE_SOFTWARE_LOOPBACK
                || addr.IfType == 131 // IF_TYPE_TUNNEL
                || addr.IfType == 23 // IF_TYPE_PPP
                || addr.IfType == 28 // IF_TYPE_SLIP
                || addr.IfType == 142 // IF_TYPE_IPHTTPS
                || name_lower.contains("-wfp")
                || name_lower.contains("-npc")
                || name_lower.contains("-qos")
                || name_lower.contains("-virt")
                || name_lower.contains("커널 디")
                || name_lower.contains("kernel debug")
                || desc_lower.contains("lightweight filter")
                || desc_lower.contains("native mac layer")
                || desc_lower.contains("packet scheduler")
                || desc_lower.contains("npcap")
                || desc_lower.contains("winpcap")
                || desc_lower.contains("kernel debug")
                || desc_lower.contains("kdnic")
                || desc_lower.contains("wan miniport")
                || desc_lower.contains("teredo")
                || desc_lower.contains("isatap")
                || desc_lower.contains("6to4")
                || desc_lower.contains("wi-fi direct")
                || desc_lower.contains("wifi direct")
                || desc_lower.contains("microsoft wi-fi direct")
                || name_lower.contains("wi-fi direct")
                || name_lower.contains("wifi direct")
                || name_lower.starts_with("로컬 영역 연결*")
                || name_lower.starts_with("local area connection*")
                || name_lower.contains("bluetooth")
                || desc_lower.contains("bluetooth");

            if is_filter_or_pseudo {
                curr = addr.Next;
                continue;
            }

            // 3. Interface type (Ethernet / Wi-Fi / Virtual)
            let is_virtual = name_lower.starts_with("vethernet") 
                || name_lower.starts_with("vswitch") 
                || name_lower.contains("hyper-v") 
                || name_lower.contains("vmware") 
                || name_lower.contains("virtualbox")
                || desc_lower.contains("hyper-v")
                || desc_lower.contains("virtual ethernet")
                || desc_lower.contains("virtualbox")
                || desc_lower.contains("vmware");

            let r#type = if is_virtual {
                "Virtual".to_string()
            } else if addr.IfType == 71 || name_lower.contains("wi-fi") || name_lower.contains("wireless") || desc_lower.contains("wi-fi") || desc_lower.contains("wireless") {
                "Wi-Fi".to_string()
            } else {
                "Ethernet".to_string()
            };
            
            // 4. Status and Enabled
            // Exclude ghost / detached hardware that only exists as records in the Windows registry:
            // OperStatus 6 = IfOperStatusNotPresent (RFC 2863 / Windows NDIS indicates hardware component is missing or removed)
            if addr.OperStatus == 6 {
                curr = addr.Next;
                continue;
            }

            // Check if IPv4 is enabled in Flags (bit 5: 0x20 is IP_ADAPTER_IPV4_ENABLED)
            let is_ipv4_active = (addr.Anonymous2.Flags & 0x20) != 0;
            
            let (is_enabled, status) = if addr.OperStatus == 1 {
                // IfOperStatusUp (1)
                (true, "Connected".to_string())
            } else if addr.OperStatus == 2 {
                // IfOperStatusDown (2)
                if is_ipv4_active {
                    (true, "Disconnected".to_string())
                } else {
                    (false, "Disabled".to_string())
                }
            } else {
                (is_ipv4_active, if is_ipv4_active { "Disconnected".to_string() } else { "Disabled".to_string() })
            };
            
            // 5. IP Address and Subnet Mask
            let mut ip_address = String::new();
            let mut subnet_mask = String::new();
            
            let mut unicast = addr.FirstUnicastAddress;
            while !unicast.is_null() {
                let uaddr = &*unicast;
                let sa = &*uaddr.Address.lpSockaddr;
                if sa.sa_family == AF_INET {
                    let ipv4: *const SOCKADDR_IN = uaddr.Address.lpSockaddr as *const _;
                    let ip_bytes = (*ipv4).sin_addr.S_un.S_un_b;
                    ip_address = format!("{}.{}.{}.{}", ip_bytes.s_b1, ip_bytes.s_b2, ip_bytes.s_b3, ip_bytes.s_b4);
                    
                    // Convert OnLinkPrefixLength to Subnet Mask
                    let prefix_len = uaddr.OnLinkPrefixLength;
                    let mask_val: u32 = if prefix_len == 0 {
                        0
                    } else {
                        0xFFFFFFFFu32 << (32 - prefix_len)
                    };
                    subnet_mask = format!(
                        "{}.{}.{}.{}",
                        (mask_val >> 24) & 0xFF,
                        (mask_val >> 16) & 0xFF,
                        (mask_val >> 8) & 0xFF,
                        mask_val & 0xFF
                    );
                    break;
                }
                unicast = uaddr.Next;
            }
            
            // 6. Gateway
            let mut gateway = String::new();
            let mut gw = addr.FirstGatewayAddress;
            while !gw.is_null() {
                let gw_addr = &*gw;
                let sa = &*gw_addr.Address.lpSockaddr;
                if sa.sa_family == AF_INET {
                    let ipv4: *const SOCKADDR_IN = gw_addr.Address.lpSockaddr as *const _;
                    let ip_bytes = (*ipv4).sin_addr.S_un.S_un_b;
                    gateway = format!("{}.{}.{}.{}", ip_bytes.s_b1, ip_bytes.s_b2, ip_bytes.s_b3, ip_bytes.s_b4);
                    break;
                }
                gw = gw_addr.Next;
            }
            
            // 7. DNS Servers
            let mut primary_dns = String::new();
            let mut secondary_dns = String::new();
            let mut dns = addr.FirstDnsServerAddress;
            let mut dns_count = 0;
            while !dns.is_null() {
                let dns_addr = &*dns;
                let sa = &*dns_addr.Address.lpSockaddr;
                if sa.sa_family == AF_INET {
                    let ipv4: *const SOCKADDR_IN = dns_addr.Address.lpSockaddr as *const _;
                    let ip_bytes = (*ipv4).sin_addr.S_un.S_un_b;
                    let dns_str = format!("{}.{}.{}.{}", ip_bytes.s_b1, ip_bytes.s_b2, ip_bytes.s_b3, ip_bytes.s_b4);
                    if dns_count == 0 {
                        primary_dns = dns_str;
                    } else if dns_count == 1 {
                        secondary_dns = dns_str;
                    }
                    dns_count += 1;
                }
                dns = dns_addr.Next;
            }
            
            // 8. MAC Address
            let mut mac_parts = Vec::new();
            let mut is_all_zero_mac = true;
            for i in 0..addr.PhysicalAddressLength as usize {
                if addr.PhysicalAddress[i] != 0 {
                    is_all_zero_mac = false;
                }
                mac_parts.push(format!("{:02X}", addr.PhysicalAddress[i]));
            }
            let mac_address = mac_parts.join(":");

            // Exclude Ghost / Phantom / Detached physical adapters that only remain in the Windows registry:
            // A genuine physical network card (Ethernet or Wi-Fi) always possesses a valid manufacturer-assigned 6-byte MAC address.
            // If an adapter is physical (!is_virtual) and has 0-length MAC, all-zero MAC (00:00:00:00:00:00), or empty MAC,
            // it is definitively an obsolete registry remnant (phantom NIC) whose hardware does not exist in the system.
            // Even if its registry name contains "이더넷" or "Ethernet", it must be strictly excluded.
            if !is_virtual && (addr.PhysicalAddressLength < 6 || is_all_zero_mac || mac_address == "00:00:00:00:00:00" || mac_address.is_empty()) {
                curr = addr.Next;
                continue;
            }
            
            // 9. DHCP status (Dhcpv4Enabled is bit 2 of addr.Anonymous2.Flags)
            let is_dhcp = (addr.Anonymous2.Flags & 0x04) != 0;
            
            adapters.push(NetworkAdapter {
                id,
                name,
                r#type,
                status,
                ipAddress: ip_address,
                subnetMask: subnet_mask,
                gateway,
                primaryDns: primary_dns,
                secondaryDns: secondary_dns,
                macAddress: mac_address,
                isDhcp: is_dhcp,
                isEnabled: is_enabled,
            });
            
            curr = addr.Next;
        }
        
        Ok(adapters)
    }
}

// ----------------------------------------------------
// Fallback Mocks for Non-Windows Target (Linux Builder/Previews)
// ----------------------------------------------------

#[cfg(not(windows))]
pub fn get_system_info_native() -> Result<SystemInfo, String> {
    Ok(SystemInfo {
        computerName: "LINUX-DEV-HOST".to_string(),
        workgroup: "WORKGROUP".to_string(),
        osVersion: "Ubuntu 22.04 LTS (Mock Native)".to_string(),
        processor: "AMD Ryzen 9 7950X @ 4.5GHz".to_string(),
        ram: "64.0 GB".to_string(),
        isAdmin: true,
    })
}

#[cfg(not(windows))]
pub fn get_adapters_native() -> Result<Vec<NetworkAdapter>, String> {
    Ok(vec![
        NetworkAdapter {
            id: "eth0-mock-uuid".to_string(),
            name: "eth0 (Ethernet)".to_string(),
            r#type: "Ethernet".to_string(),
            status: "Connected".to_string(),
            ipAddress: "192.168.1.150".to_string(),
            subnetMask: "255.255.255.0".to_string(),
            gateway: "192.168.1.1".to_string(),
            primaryDns: "8.8.8.8".to_string(),
            secondaryDns: "8.8.4.4".to_string(),
            macAddress: "52:54:00:12:34:56".to_string(),
            isDhcp: true,
            isEnabled: true,
        },
        NetworkAdapter {
            id: "wlan0-mock-uuid".to_string(),
            name: "wlan0 (Wi-Fi)".to_string(),
            r#type: "Wi-Fi".to_string(),
            status: "Disconnected".to_string(),
            ipAddress: "".to_string(),
            subnetMask: "".to_string(),
            gateway: "".to_string(),
            primaryDns: "".to_string(),
            secondaryDns: "".to_string(),
            macAddress: "52:54:00:65:43:21".to_string(),
            isDhcp: true,
            isEnabled: true,
        }
    ])
}

pub fn calculate_subnet_native(ip_str: &str, mask_str: &str) -> Result<SubnetDetails, String> {
    let parse_ip = |s: &str| -> Option<u32> {
        let parts: Vec<&str> = s.split('.').collect();
        if parts.len() != 4 { return None; }
        let mut val = 0u32;
        for p in parts {
            let b: u32 = p.parse().ok()?;
            if b > 255 { return None; }
            val = (val << 8) | b;
        }
        Some(val)
    };

    let fmt_ip = |v: u32| -> String {
        format!("{}.{}.{}.{}", (v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF)
    };

    let ip = parse_ip(ip_str).ok_or("Invalid IP address")?;
    let mask = parse_ip(mask_str).ok_or("Invalid Subnet mask")?;

    let wildcard = !mask;
    let net = ip & mask;
    let bcast = ip | wildcard;
    let cidr = mask.count_ones();

    let (first, last, hosts) = if wildcard <= 1 {
        (net, bcast, if wildcard == 0 { 1 } else { 2 })
    } else {
        (net + 1, bcast - 1, wildcard - 1)
    };

    Ok(SubnetDetails {
        network_address: fmt_ip(net),
        broadcast_address: fmt_ip(bcast),
        first_usable_ip: fmt_ip(first),
        last_usable_ip: fmt_ip(last),
        usable_hosts: hosts,
        cidr_prefix: cidr,
    })
}

#[cfg(windows)]
pub fn ping_ipv4_native(target_ip: &str, timeout_ms: u32) -> Result<PingResult, String> {
    use windows_sys::Win32::NetworkManagement::IpHelper::*;
    use std::net::Ipv4Addr;
    use std::str::FromStr;

    let target_addr = Ipv4Addr::from_str(target_ip).map_err(|e| format!("잘못된 IPv4 주소 형식: {}", e))?;
    let ip_addr = u32::from_ne_bytes(target_addr.octets());

    unsafe {
        let h_icmp = IcmpCreateFile();
        if h_icmp == 0 || h_icmp == windows_sys::Win32::Foundation::INVALID_HANDLE_VALUE {
            return Err("Failed to create ICMP handle".to_string());
        }

        let send_data = b"IpNameCore Probe";
        let reply_size = std::mem::size_of::<ICMP_ECHO_REPLY>() + send_data.len() + 8;
        let mut reply_buf = vec![0u8; reply_size];

        let ret = IcmpSendEcho(
            h_icmp,
            ip_addr,
            send_data.as_ptr() as *const _,
            send_data.len() as u16,
            std::ptr::null::<IP_OPTION_INFORMATION>(),
            reply_buf.as_mut_ptr() as *mut _,
            reply_size as u32,
            if timeout_ms == 0 { 1000 } else { timeout_ms },
        );

        IcmpCloseHandle(h_icmp);

        if ret != 0 {
            let reply = &*(reply_buf.as_ptr() as *const ICMP_ECHO_REPLY);
            let success = reply.Status == 0;
            let msg = if success {
                format!("응답 성공: {}ms (TTL: {})", reply.RoundTripTime, reply.Options.Ttl)
            } else if reply.Status == 11010 {
                "요청 시간이 초과되었습니다 (타임아웃).".to_string()
            } else {
                format!("대상에 연결할 수 없습니다 (코드: {}).", reply.Status)
            };

            Ok(PingResult {
                round_trip_time_ms: reply.RoundTripTime,
                time_to_live: reply.Options.Ttl as u32,
                success,
                message: msg,
            })
        } else {
            Ok(PingResult {
                round_trip_time_ms: 0,
                time_to_live: 0,
                success: false,
                message: "요청 시간이 초과되었거나 응답이 없습니다.".to_string(),
            })
        }
    }
}

#[cfg(not(windows))]
pub fn ping_ipv4_native(target_ip: &str, _timeout_ms: u32) -> Result<PingResult, String> {
    Ok(PingResult {
        round_trip_time_ms: 8,
        time_to_live: 64,
        success: true,
        message: format!("응답 성공 (IpNameCore 모의 테스트): 8ms (TTL: 64) -> {}", target_ip),
    })
}

pub fn classify_ip_native(ip_str: &str) -> Result<IpClassificationResult, String> {
    let parse_ip = |s: &str| -> Option<u32> {
        let parts: Vec<&str> = s.split('.').collect();
        if parts.len() != 4 { return None; }
        let mut val = 0u32;
        for p in parts {
            let b: u32 = p.parse().ok()?;
            if b > 255 { return None; }
            val = (val << 8) | b;
        }
        Some(val)
    };

    let val = parse_ip(ip_str).ok_or("Invalid IPv4 address format")?;
    let o1 = (val >> 24) & 0xFF;
    let o2 = (val >> 16) & 0xFF;

    let (category, scope_desc, is_routable) = if o1 == 10 {
        ("Private (사설 IP)", "RFC 1918 Class A (10.0.0.0/8)", false)
    } else if o1 == 172 && (16..=31).contains(&o2) {
        ("Private (사설 IP)", "RFC 1918 Class B (172.16.0.0/12)", false)
    } else if o1 == 192 && o2 == 168 {
        ("Private (사설 IP)", "RFC 1918 Class C (192.168.0.0/16)", false)
    } else if o1 == 127 {
        ("Loopback (루프백)", "RFC 1122 Localhost (127.0.0.0/8)", false)
    } else if o1 == 169 && o2 == 254 {
        ("APIPA (자동 사설 IP)", "RFC 3927 Link-Local (169.254.0.0/16)", false)
    } else if o1 == 100 && (64..=127).contains(&o2) {
        ("CGNAT (통신사 공유 IP)", "RFC 6598 Carrier-Grade NAT (100.64.0.0/10)", false)
    } else if (224..=239).contains(&o1) {
        ("Multicast (멀티캐스트)", "RFC 5771 Class D (224.0.0.0/4)", false)
    } else if o1 >= 240 {
        ("Reserved (예약 대역)", "RFC 1700 Class E Reserved", false)
    } else if o1 == 0 {
        ("Current Network", "RFC 1122 'This' Network", false)
    } else {
        ("Public (공인 WAN IP)", "Global Internet Routable", true)
    };

    Ok(IpClassificationResult {
        category: category.to_string(),
        scope_desc: scope_desc.to_string(),
        is_routable,
    })
}

#[cfg(windows)]
pub fn check_ip_conflict_native(target_ip: &str, source_ip: Option<&str>) -> Result<IpConflictResult, String> {
    use windows_sys::Win32::NetworkManagement::IpHelper::*;
    use std::net::Ipv4Addr;
    use std::str::FromStr;

    let target_addr = Ipv4Addr::from_str(target_ip).map_err(|e| format!("잘못된 대상 IP 형식: {}", e))?;
    let dest_ip = u32::from_ne_bytes(target_addr.octets());

    let src_ip = if let Some(src) = source_ip {
        if !src.is_empty() {
            let src_addr = Ipv4Addr::from_str(src).map_err(|e| format!("잘못된 출발지 IP 형식: {}", e))?;
            u32::from_ne_bytes(src_addr.octets())
        } else {
            0
        }
    } else {
        0
    };

    unsafe {
        let mut mac_buf: [u8; 8] = [0; 8];
        let mut mac_len: u32 = 6;

        let ret = SendARP(dest_ip, src_ip, mac_buf.as_mut_ptr() as *mut _, &mut mac_len);

        if ret == 0 && mac_len == 6 {
            let mac_str = format!(
                "{:02X}:{:02X}:{:02X}:{:02X}:{:02X}:{:02X}",
                mac_buf[0], mac_buf[1], mac_buf[2], mac_buf[3], mac_buf[4], mac_buf[5]
            );
            Ok(IpConflictResult {
                is_conflict: true,
                conflicting_mac: mac_str.clone(),
                message: format!("⚠️ [IP 충돌 감지] 동일한 IP를 사용하는 기기(MAC: {})가 로컬 네트워크에 존재합니다.", mac_str),
            })
        } else {
            Ok(IpConflictResult {
                is_conflict: false,
                conflicting_mac: String::new(),
                message: format!("✓ [사용 가능] 해당 IP({})는 로컬 네트워크에서 사용 가능한 안전한 주소입니다.", target_ip),
            })
        }
    }
}

#[cfg(not(windows))]
pub fn check_ip_conflict_native(target_ip: &str, _source_ip: Option<&str>) -> Result<IpConflictResult, String> {
    if target_ip.ends_with(".99") {
        Ok(IpConflictResult {
            is_conflict: true,
            conflicting_mac: "AA:BB:CC:11:22:33".to_string(),
            message: "⚠️ [IP 충돌 감지] 동일한 IP를 사용하는 기기(MAC: AA:BB:CC:11:22:33)가 로컬 네트워크에 존재합니다.".to_string(),
        })
    } else {
        Ok(IpConflictResult {
            is_conflict: false,
            conflicting_mac: String::new(),
            message: format!("✓ [사용 가능] 해당 IP({})는 로컬 네트워크에서 사용 가능한 안전한 주소입니다.", target_ip),
        })
    }
}

pub fn check_tcp_port_native(target_ip: &str, port: u16, timeout_ms: u32) -> Result<TcpPortResult, String> {
    use std::net::{SocketAddr, TcpStream};
    use std::time::{Duration, Instant};

    let addr_str = format!("{}:{}", target_ip, port);
    let sock_addr: SocketAddr = addr_str.parse().map_err(|e| format!("잘못된 대상 IP/포트 주소: {}", e))?;
    let timeout = Duration::from_millis(if timeout_ms == 0 { 1000 } else { timeout_ms as u64 });

    let start_time = Instant::now();
    match TcpStream::connect_timeout(&sock_addr, timeout) {
        Ok(_) => {
            let elapsed = start_time.elapsed().as_millis() as u32;
            Ok(TcpPortResult {
                is_open: true,
                latency_ms: elapsed,
                message: format!("포트 {} 연결 성공 ({}ms)", port, elapsed),
            })
        }
        Err(e) => {
            Ok(TcpPortResult {
                is_open: false,
                latency_ms: 0,
                message: format!("포트 {} 연결 불가 또는 타임아웃 ({})", port, e),
            })
        }
    }
}
