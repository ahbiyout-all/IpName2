export interface SecondaryIp {
  ipAddress: string;
  subnetMask: string;
}

export interface NetworkAdapter {
  id: string;
  name: string;
  type: 'Ethernet' | 'Wi-Fi' | 'Virtual';
  status: 'Connected' | 'Disconnected' | 'Disabled';
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  primaryDns: string;
  secondaryDns: string;
  macAddress: string;
  isDhcp: boolean;
  isEnabled: boolean;
  isVirtual?: boolean;
  description?: string;
  additionalIps?: SecondaryIp[];
}

export interface SystemInfo {
  computerName: string;
  workgroup: string;
  osVersion: string;
  processor: string;
  ram: string;
  isAdmin: boolean;
}

export interface RealIpInfo {
  ip: string;
  ipv4?: string;
  isp?: string;
  country?: string;
  city?: string;
  asn?: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
  lastUpdated?: string;
}

export interface NativePingResult {
  round_trip_time_ms: number;
  time_to_live: number;
  success: boolean;
  message: string;
}

export interface NativeSubnetDetails {
  network_address: string;
  broadcast_address: string;
  first_usable_ip: string;
  last_usable_ip: string;
  usable_hosts: number;
  cidr_prefix: number;
}

export interface NativeIpConflictResult {
  is_conflict: boolean;
  conflicting_mac: string;
  message: string;
}

export interface NativeTcpPortResult {
  is_open: boolean;
  latency_ms: number;
  message: string;
}

export interface NativeIpClassification {
  category: string;
  scope_desc: string;
  is_routable: boolean;
}

