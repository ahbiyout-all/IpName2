import { useState, useCallback, useEffect } from 'react';
import { SystemInfo, NetworkAdapter } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { executePowerShell, isTauriEnv } from '../lib/powershell';

export function isFilterOrPseudoAdapter(name: string): boolean {
  const n = (name || '').toLowerCase();
  return (
    n.includes('-wfp') ||
    n.includes('-npc') ||
    n.includes('-qos') ||
    n.includes('-virt') ||
    n.includes('커널 디') ||
    n.includes('kernel debug') ||
    n.includes('lightweight filter') ||
    n.includes('native mac layer') ||
    n.includes('packet scheduler') ||
    n.includes('npcap') ||
    n.includes('winpcap') ||
    n.includes('kdnic') ||
    n.includes('wan miniport') ||
    n.includes('teredo') ||
    n.includes('isatap') ||
    n.includes('6to4') ||
    n.includes('wi-fi direct') ||
    n.includes('wifi direct') ||
    n.includes('bluetooth') ||
    n.startsWith('로컬 영역 연결*') ||
    n.startsWith('local area connection*') ||
    n.includes('loopback')
  );
}

export function isGhostOrInvalidAdapter(adapter: { macAddress?: string; name?: string; isEnabled?: boolean; status?: string; type?: string }): boolean {
  if (adapter.status === 'Not Present' || adapter.status === 'NotPresent') {
    return true;
  }
  if (adapter.name && isFilterOrPseudoAdapter(adapter.name)) {
    return true;
  }

  const isVirt = isVirtualAdapter(adapter.name || '', adapter.type);
  const clean = (adapter.macAddress || '').replace(/[:-]/g, '').toLowerCase().trim();
  const isZeroOrEmptyMac = !clean || clean === '000000000000' || /^0+$/.test(clean);

  // For physical adapters (Ethernet / Wi-Fi), a valid non-zero 6-byte MAC address is strictly mandatory!
  // Any physical Ethernet/Wi-Fi entry with no MAC or all-zero MAC (00:00:00:00:00:00) is an obsolete
  // registry remnant (ghost NIC) whose hardware does not exist in the system.
  // Even if its registry record is named "이더넷" or "Ethernet", it must be strictly excluded.
  if (!isVirt && isZeroOrEmptyMac) {
    return true;
  }

  return false;
}

export function formatOsVersion(rawOs?: string): string {
  if (!rawOs) return 'Windows 11';
  let os = rawOs.replace('Microsoft ', '').trim();
  // If reported as Windows 10 but has 23H2, 24H2, 25H2, or build >= 22000, correct to Windows 11
  if (os.includes('Windows 10')) {
    if (
      os.includes('23H2') ||
      os.includes('24H2') ||
      os.includes('25H2') ||
      os.includes('26H2') ||
      /build\s*2[2-9]\d{3}/i.test(os) ||
      /build\s*[3-9]\d{4}/i.test(os)
    ) {
      os = os.replace('Windows 10', 'Windows 11');
    }
  }
  return os || 'Windows 11';
}

export function isVirtualAdapter(name: string, type?: string, description?: string, isVirtualProp?: boolean, macAddress?: string): boolean {
  if (isVirtualProp === true) return true;
  if (type === 'Virtual') return true;

  // Hypervisor MAC OUI checks
  if (macAddress) {
    const cleanMac = macAddress.replace(/[:-]/g, '').toLowerCase();
    if (
      cleanMac.startsWith('00155d') || // Microsoft Hyper-V
      cleanMac.startsWith('000569') || // VMware
      cleanMac.startsWith('000c29') || // VMware
      cleanMac.startsWith('005056') || // VMware
      cleanMac.startsWith('080027') || // Oracle VirtualBox
      cleanMac.startsWith('525400') || // QEMU / KVM
      cleanMac.startsWith('00163e') || // Xen
      cleanMac.startsWith('001c42')    // Parallels
    ) {
      return true;
    }
  }

  const combined = `${name || ''} ${description || ''}`.toLowerCase();
  return (
    combined.includes('가상') ||
    combined.includes('virtual') ||
    combined.startsWith('vethernet') ||
    combined.startsWith('vswitch') ||
    combined.includes('hyper-v') ||
    combined.includes('vmware') ||
    combined.includes('vmnet') ||
    combined.includes('virtualbox') ||
    combined.includes('vbox') ||
    combined.includes('wsl') ||
    combined.includes('tap') ||
    combined.includes('wintun') ||
    combined.includes('tunnel') ||
    combined.includes('tailscale') ||
    combined.includes('zerotier') ||
    combined.includes('openvpn') ||
    combined.includes('wireguard') ||
    combined.includes('hamachi') ||
    combined.includes('radmin') ||
    combined.includes('anyconnect') ||
    combined.includes('cisco') ||
    combined.includes('fortinet') ||
    combined.includes('globalprotect') ||
    combined.includes('vpn') ||
    combined.includes('virtio') ||
    combined.includes('ndis virtual') ||
    /(^|[^a-z0-9])tun(\d|[^a-z0-9]|$)/i.test(combined)
  );
}

function subnetMatches(ip: string, mask: string, gw: string): boolean {
  if (!ip || !gw || !mask) return false;
  try {
    const parse = (s: string) => s.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
    const ipInt = parse(ip);
    const gwInt = parse(gw);
    const maskInt = parse(mask);
    return (ipInt & maskInt) === (gwInt & maskInt);
  } catch {
    return false;
  }
}

function isLinkLocal(ip: string): boolean {
  return ip.startsWith('169.254.');
}

export function sortAdaptersAndEnforcePrimaryIp(adapters: NetworkAdapter[]): NetworkAdapter[] {
  // 1. Enforce Primary status on DHCP-assigned or gateway-connected IPv4 addresses
  const processed = adapters.map(adapter => {
    const allIps: Array<{ ipAddress: string; subnetMask: string }> = [];
    if (adapter.ipAddress && adapter.ipAddress.trim() !== '') {
      allIps.push({ ipAddress: adapter.ipAddress.trim(), subnetMask: adapter.subnetMask || '255.255.255.0' });
    }
    if (adapter.additionalIps && Array.isArray(adapter.additionalIps)) {
      for (const sec of adapter.additionalIps) {
        if (sec.ipAddress && sec.ipAddress.trim() !== '' && !allIps.some(e => e.ipAddress === sec.ipAddress.trim())) {
          allIps.push({ ipAddress: sec.ipAddress.trim(), subnetMask: sec.subnetMask || '255.255.255.0' });
        }
      }
    }

    if (allIps.length > 1) {
      allIps.sort((a, b) => {
        const aGw = subnetMatches(a.ipAddress, a.subnetMask, adapter.gateway);
        const bGw = subnetMatches(b.ipAddress, b.subnetMask, adapter.gateway);
        if (aGw && !bGw) return -1;
        if (!aGw && bGw) return 1;

        const aLink = isLinkLocal(a.ipAddress);
        const bLink = isLinkLocal(b.ipAddress);
        if (!aLink && bLink) return -1;
        if (aLink && !bLink) return 1;

        return 0;
      });

      return {
        ...adapter,
        ipAddress: allIps[0].ipAddress,
        subnetMask: allIps[0].subnetMask,
        additionalIps: allIps.slice(1).map(item => ({ ipAddress: item.ipAddress, subnetMask: item.subnetMask }))
      };
    }

    return adapter;
  });

  // 2. Sort adapter list so gateway-connected / DHCP-assigned active adapters appear above secondary/disconnected/virtual
  processed.sort((a, b) => {
    const aConn = a.status === 'Connected';
    const bConn = b.status === 'Connected';
    const aHasIp = !!a.ipAddress;
    const bHasIp = !!b.ipAddress;
    const aHasGw = !!a.gateway;
    const bHasGw = !!b.gateway;

    const score = (conn: boolean, ip: boolean, gw: boolean) => {
      if (conn && gw && ip) return 3;
      if (conn && ip) return 2;
      if (conn) return 1;
      return 0;
    };

    const scoreA = score(aConn, aHasIp, aHasGw);
    const scoreB = score(bConn, bHasIp, bHasGw);

    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    return a.name.localeCompare(b.name);
  });

  return processed;
}

export function useSystemConfig() {
  const { t } = useLanguage();

  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    computerName: t('loading'),
    workgroup: t('loading'),
    osVersion: t('loading'),
    processor: t('loading'),
    ram: t('loading'),
    isAdmin: false
  });
  
  const [originalSystemInfo, setOriginalSystemInfo] = useState<SystemInfo | null>(null);

  const [adaptersState, setAdaptersState] = useState<NetworkAdapter[]>([
    {
      id: 'loading',
      name: t('loading'),
      type: 'Ethernet',
      status: 'Disconnected',
      ipAddress: '',
      subnetMask: '',
      gateway: '',
      primaryDns: '',
      secondaryDns: '',
      macAddress: '',
      isDhcp: true,
      isEnabled: true
    }
  ]);

  const setAdapters = useCallback((action: NetworkAdapter[] | ((prev: NetworkAdapter[]) => NetworkAdapter[])) => {
    setAdaptersState(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      return sortAdaptersAndEnforcePrimaryIp(next);
    });
  }, []);

  const adapters = adaptersState;

  const [originalAdapters, setOriginalAdapters] = useState<NetworkAdapter[]>([]);

  const fetchInitialData = useCallback(async () => {
    try {
      if (isTauriEnv()) {
        const { invoke } = await import('@tauri-apps/api/core');
        try {
          const sysInfo = await invoke<SystemInfo>('get_system_info');
          const fetchedInfo = {
            computerName: sysInfo.computerName || 'Unknown',
            workgroup: sysInfo.workgroup || 'WORKGROUP',
            osVersion: formatOsVersion(sysInfo.osVersion),
            processor: sysInfo.processor ? sysInfo.processor.trim() : 'Unknown',
            ram: sysInfo.ram || 'Unknown',
            isAdmin: !!sysInfo.isAdmin
          };
          setSystemInfo(fetchedInfo);
          setOriginalSystemInfo(fetchedInfo);

          const adapterList = await invoke<NetworkAdapter[]>('get_adapters');
          
          // Query all physically present network adapters and disabled adapters from PowerShell
          let disabledNetAdapters: Array<{ name: string; macAddress?: string; isVirtual?: boolean; description?: string }> = [];
          const physicallyPresentNames = new Set<string>();
          const virtualNetNames = new Set<string>();
          let hasPowerShellData = false;

          try {
            const psPresent = await executePowerShell(
              `try { @(Get-NetAdapter -IncludeHidden:$false -ErrorAction SilentlyContinue | Select-Object -Property Name,Status,MacAddress,Virtual,InterfaceDescription) | ConvertTo-Json -Compress } catch { '[]' }`,
              false
            );
            if (psPresent.stdout) {
              const trimmed = psPresent.stdout.trim();
              let parsed: any[] = [];
              if (trimmed.startsWith('[')) {
                parsed = JSON.parse(trimmed);
              } else if (trimmed.startsWith('{')) {
                const single = JSON.parse(trimmed);
                if (single.Name) parsed = [single];
              }
              if (Array.isArray(parsed) && parsed.length > 0) {
                hasPowerShellData = true;
                for (const item of parsed) {
                  if (item.Name) {
                    const nLower = String(item.Name).toLowerCase();
                    physicallyPresentNames.add(nLower);
                    const isItemVirt = item.Virtual === true || isVirtualAdapter(item.Name, undefined, item.InterfaceDescription);
                    if (isItemVirt) {
                      virtualNetNames.add(nLower);
                    }
                    if (item.Status === 'Disabled') {
                      disabledNetAdapters.push({ 
                        name: item.Name, 
                        macAddress: item.MacAddress,
                        isVirtual: isItemVirt,
                        description: item.InterfaceDescription
                      });
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.warn("Could not query present NetAdapters via PowerShell:", e);
          }

          const activeParsed = adapterList
            .filter(adapter => {
              if (isFilterOrPseudoAdapter(adapter.name) || isGhostOrInvalidAdapter(adapter)) {
                return false;
              }
              return true;
            })
            .map((adapter, index) => {
              const isVirt = adapter.isVirtual === true ||
                virtualNetNames.has(adapter.name.toLowerCase()) ||
                isVirtualAdapter(adapter.name, adapter.type, adapter.description, adapter.isVirtual, adapter.macAddress);
              return {
                ...adapter,
                isVirtual: isVirt,
                type: isVirt ? ('Virtual' as const) : adapter.type,
                id: adapter.id || adapter.macAddress || adapter.name || `adapter-${index}`
              };
            });

          setAdapters(() => {
            const activeNames = new Set(activeParsed.map(a => a.name.toLowerCase()));
            const activeMacs = new Set(activeParsed.map(a => (a.macAddress || '').replace(/[:-]/g, '').toLowerCase()).filter(Boolean));
            const merged = [...activeParsed];

            // Add verified disabled adapters discovered from Windows that are not already present
            for (const dis of disabledNetAdapters) {
              const cleanDisMac = (dis.macAddress || '').replace(/[:-]/g, '').toLowerCase();
              if (
                !activeNames.has(dis.name.toLowerCase()) &&
                (!cleanDisMac || !activeMacs.has(cleanDisMac)) &&
                !isFilterOrPseudoAdapter(dis.name) &&
                !isGhostOrInvalidAdapter(dis)
              ) {
                const isVirt = dis.isVirtual ?? isVirtualAdapter(dis.name, 'Ethernet', dis.description, undefined, dis.macAddress);
                merged.push({
                  id: dis.macAddress || dis.name,
                  name: dis.name,
                  type: isVirt ? 'Virtual' : (dis.name.toLowerCase().includes('wi-fi') || dis.name.toLowerCase().includes('wireless') || dis.name.toLowerCase().includes('와이파이') ? 'Wi-Fi' : 'Ethernet'),
                  status: 'Disabled',
                  ipAddress: '',
                  subnetMask: '',
                  gateway: '',
                  primaryDns: '',
                  secondaryDns: '',
                  macAddress: dis.macAddress || '',
                  isDhcp: true,
                  isEnabled: false,
                  isVirtual: isVirt,
                  description: dis.description,
                  additionalIps: []
                });
                activeNames.add(dis.name.toLowerCase());
                if (cleanDisMac) activeMacs.add(cleanDisMac);
              }
            }

            return merged;
          });

          setOriginalAdapters(prev => {
            return prev.length === 0 ? activeParsed : prev;
          });
        } catch (err: any) {
          console.error('Native API Error:', err);
          setSystemInfo(prev => ({ ...prev, computerName: 'Error', osVersion: String(err).substring(0, 50) }));
          setAdapters([{
            id: 'error',
            name: 'Error: ' + String(err).substring(0, 50),
            type: 'Ethernet',
            status: 'Disconnected',
            ipAddress: '',
            subnetMask: '',
            gateway: '',
            primaryDns: '',
            secondaryDns: '',
            macAddress: '',
            isDhcp: true,
            isEnabled: false
          }]);
        }
      } else {
        // Web Preview Mock
        const mockInfo = {
          computerName: 'WEB-PREVIEW-PC',
          workgroup: 'WORKGROUP',
          osVersion: 'Windows 11 Pro (Web Preview)',
          processor: 'Intel(R) Core(TM) i9-14900K',
          ram: '32 GB',
          isAdmin: true
        };
        setSystemInfo(mockInfo);
        setOriginalSystemInfo(mockInfo);

        const mockAdapters: NetworkAdapter[] = [
          {
            id: 'mock-eth-1',
            name: 'Ethernet',
            type: 'Ethernet',
            status: 'Connected',
            isEnabled: true,
            isVirtual: false,
            ipAddress: '192.168.1.100',
            subnetMask: '255.255.255.0',
            gateway: '192.168.1.1',
            primaryDns: '8.8.8.8',
            secondaryDns: '8.8.4.4',
            macAddress: '00:1A:2B:3C:4D:5E',
            isDhcp: false,
            additionalIps: [
              { ipAddress: '192.168.2.100', subnetMask: '255.255.255.0' }
            ]
          },
          {
            id: 'mock-wifi-1',
            name: 'Wi-Fi',
            type: 'Wi-Fi',
            status: 'Disconnected',
            isEnabled: true,
            isVirtual: false,
            ipAddress: '',
            subnetMask: '',
            gateway: '',
            primaryDns: '',
            secondaryDns: '',
            macAddress: 'A1:B2:C3:D4:E5:F6',
            isDhcp: true,
            additionalIps: []
          },
          {
            id: 'mock-veth-1',
            name: 'vEthernet (WSL)',
            type: 'Virtual',
            status: 'Connected',
            isEnabled: true,
            isVirtual: true,
            ipAddress: '172.28.16.1',
            subnetMask: '255.255.240.0',
            gateway: '',
            primaryDns: '',
            secondaryDns: '',
            macAddress: '00:15:5D:8A:2B:3C',
            isDhcp: true,
            additionalIps: []
          }
        ];
        setAdapters(mockAdapters);
        setOriginalAdapters(mockAdapters);
      }
    } catch (error: any) {
      console.error('Failed to fetch initial data:', error);
      setSystemInfo(prev => ({ ...prev, computerName: 'Exception' }));
    }
  }, []);

  const [isLoaded, setIsLoaded] = useState(false);
  const [pendingComputerName, setPendingComputerName] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData().finally(() => {
      setIsLoaded(true);
    });
  }, [fetchInitialData]);

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  }, []);

  const isValidIPv4 = (ip: string) => {
    if (!ip) return false;
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255 && part === num.toString();
    });
  };

  const saveSystemInfo = useCallback(async () => {
    setIsSaving(true);
    try {
      let script = '';
      let requiresRestart = false;

      if (originalSystemInfo) {
        if (!systemInfo.computerName || /[\\/:\*\?"<>\|]/.test(systemInfo.computerName)) {
          showToast(t('invalidComputerName'), 'error');
          setIsSaving(false);
          return;
        }

        if (systemInfo.computerName !== originalSystemInfo.computerName) {
          script += `Rename-Computer -NewName "${systemInfo.computerName}" -Force\n`;
          requiresRestart = true;
        }
        if (systemInfo.workgroup !== originalSystemInfo.workgroup) {
          script += `Add-Computer -WorkgroupName "${systemInfo.workgroup}" -Force\n`;
          requiresRestart = true;
        }
      }

      if (!script) {
        showToast(t('saveSuccess'), 'success');
        setIsSaving(false);
        return;
      }

      const wrappedScript = `
        $ErrorActionPreference = 'Stop';
        try {
          & {
            ${script}
          } 2>&1 | Out-Null
          exit 0
        } catch {
          exit 1
        }
      `;

      if (isTauriEnv()) {
        const response = await executePowerShell(wrappedScript, !systemInfo.isAdmin);
        
        if (response.code !== 0) {
          console.error("PowerShell Error: Command failed with code", response.code);
          showToast(t('applyError'), 'error');
        } else {
          if (requiresRestart) {
            setPendingComputerName(systemInfo.computerName);
            showToast(`${t('saveSuccess')} ${t('restartRequired')}`, 'success');
          } else {
            showToast(t('saveSuccess'), 'success');
          }
        }
        
        await fetchInitialData(); // Refresh system info
      } else {
        // Web Preview Mock
        console.log("Mock saveSystemInfo executed with script:", script);
        if (requiresRestart) {
          setPendingComputerName(systemInfo.computerName);
          showToast(`${t('saveSuccess')} ${t('restartRequired')}`, 'success');
        } else {
          showToast(t('saveSuccess'), 'success');
        }
        setOriginalSystemInfo({...systemInfo});
      }
    } catch (error) {
      console.error("Failed to save system info:", error);
    } finally {
      setIsSaving(false);
    }
  }, [systemInfo, originalSystemInfo, fetchInitialData, t, showToast]);

  const saveNetworkConfig = useCallback(async (selectedAdapterId: string) => {
    setIsSaving(true);
    try {
      let script = '';

      const adapter = adapters.find(a => a.id === selectedAdapterId);
      const originalAdapter = originalAdapters.find(a => a.id === selectedAdapterId);
      
      if (adapter) {
        // Handle Enable/Disable
        if (originalAdapter && adapter.isEnabled !== originalAdapter.isEnabled) {
          if (adapter.isEnabled) {
            script += `Enable-NetAdapter -Name "${adapter.name}" -Confirm:$false\n`;
            script += `Start-Sleep -Seconds 2\n`;
          } else {
            script += `Disable-NetAdapter -Name "${adapter.name}" -Confirm:$false\n`;
          }
        }

        // Only process IP settings if the adapter is enabled
        if (adapter.isEnabled) {
          if (!adapter.isDhcp) {
            if (!adapter.ipAddress || !adapter.subnetMask) {
              showToast(t('ipRequired'), 'error');
              setIsSaving(false);
              return;
            }
            if (!isValidIPv4(adapter.ipAddress)) {
              showToast(t('invalidIp'), 'error');
              setIsSaving(false);
              return;
            }
            if (!isValidIPv4(adapter.subnetMask)) {
              showToast(t('invalidSubnet'), 'error');
              setIsSaving(false);
              return;
            }
            if (adapter.gateway && !isValidIPv4(adapter.gateway)) {
              showToast(t('invalidGateway'), 'error');
              setIsSaving(false);
              return;
            }
            if (adapter.primaryDns && !isValidIPv4(adapter.primaryDns)) {
              showToast(t('invalidDns'), 'error');
              setIsSaving(false);
              return;
            }
            if (adapter.secondaryDns && !isValidIPv4(adapter.secondaryDns)) {
              showToast(t('invalidDns'), 'error');
              setIsSaving(false);
              return;
            }

            if (adapter.additionalIps && adapter.additionalIps.length > 0) {
              const seenIps = new Set<string>([adapter.ipAddress]);
              for (const sec of adapter.additionalIps) {
                if (!sec.ipAddress || !isValidIPv4(sec.ipAddress)) {
                  showToast(t('invalidSecondaryIp'), 'error');
                  setIsSaving(false);
                  return;
                }
                if (!sec.subnetMask || !isValidIPv4(sec.subnetMask)) {
                  showToast(t('invalidSecondaryIp'), 'error');
                  setIsSaving(false);
                  return;
                }
                if (seenIps.has(sec.ipAddress)) {
                  showToast(t('duplicateIpWarning'), 'error');
                  setIsSaving(false);
                  return;
                }
                seenIps.add(sec.ipAddress);
              }
            }
          }

          if (adapter.isDhcp) {
            script += `netsh interface ipv4 set address name="${adapter.name}" source=dhcp\n`;
            script += `netsh interface ipv4 set dns name="${adapter.name}" source=dhcp\n`;
          } else {
            const gw = adapter.gateway ? ` gateway=${adapter.gateway}` : '';
            script += `netsh interface ipv4 set address name="${adapter.name}" source=static address=${adapter.ipAddress} mask=${adapter.subnetMask}${gw}\n`;
            
            // Add secondary / multiple IP addresses
            if (adapter.additionalIps && adapter.additionalIps.length > 0) {
              for (const sec of adapter.additionalIps) {
                if (sec.ipAddress && sec.subnetMask) {
                  script += `netsh interface ipv4 add address name="${adapter.name}" address=${sec.ipAddress} mask=${sec.subnetMask}\n`;
                }
              }
            }

            if (adapter.primaryDns) {
              script += `netsh interface ipv4 set dns name="${adapter.name}" source=static address=${adapter.primaryDns} validate=no\n`;
              if (adapter.secondaryDns) {
                script += `netsh interface ipv4 add dns name="${adapter.name}" address=${adapter.secondaryDns} index=2 validate=no\n`;
              }
            } else {
              script += `netsh interface ipv4 set dns name="${adapter.name}" source=dhcp\n`;
            }
          }
        }
      }

      if (!script) {
        showToast(t('saveSuccess'), 'success');
        setIsSaving(false);
        return;
      }

      const wrappedScript = `
        $ErrorActionPreference = 'Stop';
        try {
          & {
            ${script}
          } 2>&1 | Out-Null
          exit 0
        } catch {
          exit 1
        }
      `;

      if (isTauriEnv()) {
        const response = await executePowerShell(wrappedScript, !systemInfo.isAdmin);
        
        if (response.code !== 0) {
          console.error("PowerShell Error: Command failed with code", response.code);
          showToast(t('applyError'), 'error');
        } else {
          showToast(t('saveSuccess'), 'success');
        }
        
        // Wait for Windows to apply network changes before fetching
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await fetchInitialData(); // Refresh data after applying
      } else {
        // Web Preview Mock
        console.log("Mock saveNetworkConfig executed with script:", script);
        showToast(t('saveSuccess'), 'success');
        setOriginalAdapters([...adapters]);
      }
    } catch (error) {
      console.error("Failed to save network config:", error);
    } finally {
      setIsSaving(false);
    }
  }, [adapters, originalAdapters, systemInfo, fetchInitialData, t, showToast]);

  const updateAdapter = useCallback((id: string, fieldOrUpdates: keyof NetworkAdapter | Partial<NetworkAdapter>, value?: any) => {
    setAdapters(prev => prev.map(adapter => {
      if (adapter.id !== id) return adapter;
      if (typeof fieldOrUpdates === 'object' && fieldOrUpdates !== null) {
        return { ...adapter, ...fieldOrUpdates };
      }
      return { ...adapter, [fieldOrUpdates as keyof NetworkAdapter]: value };
    }));
  }, []);

  const updateSystemInfo = useCallback((field: keyof SystemInfo, value: string) => {
    setSystemInfo(prev => ({ ...prev, [field]: value }));
  }, []);

  const applyDns = useCallback((adapterId: string, primary: string, secondary: string) => {
    setAdapters(prev => prev.map(adapter => 
      adapter.id === adapterId ? {
        ...adapter,
        primaryDns: primary,
        secondaryDns: secondary,
        isDhcp: false
      } : adapter
    ));
  }, []);

  const toggleAdapterEnabled = useCallback(async (adapterId: string, targetState?: boolean) => {
    setIsSaving(true);
    try {
      const adapter = adapters.find(a => a.id === adapterId);
      if (!adapter) {
        setIsSaving(false);
        return;
      }

      const newEnabled = targetState !== undefined ? targetState : !adapter.isEnabled;

      // Optimistically update the UI state immediately for instant feedback
      setAdapters(prev => prev.map(a => (a.id === adapterId || a.name === adapter.name) ? {
        ...a,
        isEnabled: newEnabled,
        status: newEnabled ? (a.ipAddress ? 'Connected' : 'Disconnected') : 'Disabled'
      } : a));

      if (isTauriEnv()) {
        const cmd = newEnabled 
          ? `Enable-NetAdapter -Name "${adapter.name}" -Confirm:$false\nStart-Sleep -Seconds 2`
          : `Disable-NetAdapter -Name "${adapter.name}" -Confirm:$false`;

        const wrappedScript = `
          $ErrorActionPreference = 'Stop';
          try {
            & {
              ${cmd}
            } 2>&1 | Out-Null
            exit 0
          } catch {
            exit 1
          }
        `;

        const response = await executePowerShell(wrappedScript, !systemInfo.isAdmin);
        if (response.code !== 0) {
          console.error("PowerShell Error: Command failed with code", response.code);
          showToast(t('applyError'), 'error');
        } else {
          showToast(newEnabled ? t('adapterEnabledSuccess') : t('adapterDisabledSuccess'), 'success');
        }

        // Wait for Windows to update network stack
        await new Promise(resolve => setTimeout(resolve, 2500));
        await fetchInitialData();
      } else {
        // Web Preview Mock
        setAdapters(prev => prev.map(a => (a.id === adapter.id || a.name === adapter.name) ? {
          ...a,
          isEnabled: newEnabled,
          status: newEnabled ? (a.ipAddress ? 'Connected' : 'Disconnected') : 'Disabled'
        } : a));
        setOriginalAdapters(prev => prev.map(a => (a.id === adapter.id || a.name === adapter.name) ? {
          ...a,
          isEnabled: newEnabled,
          status: newEnabled ? (a.ipAddress ? 'Connected' : 'Disconnected') : 'Disabled'
        } : a));
        showToast(newEnabled ? t('adapterEnabledSuccess') : t('adapterDisabledSuccess'), 'success');
      }
    } catch (err) {
      console.error("Failed to toggle adapter:", err);
      showToast(t('applyError'), 'error');
    } finally {
      setIsSaving(false);
    }
  }, [adapters, systemInfo, fetchInitialData, t, showToast]);

  const rebootSystem = useCallback(async () => {
    try {
      if (isTauriEnv()) {
        await executePowerShell('Restart-Computer -Force');
      } else {
        console.log("Mock reboot executed");
        showToast(t('rebootSystem'), 'success');
      }
    } catch (error) {
      console.error("Failed to reboot system:", error);
      showToast(t('applyError'), 'error');
    }
  }, [t, showToast]);

  return {
    isLoaded,
    systemInfo,
    originalSystemInfo,
    adapters,
    isSaving,
    toast,
    pendingComputerName,
    saveSystemInfo,
    saveNetworkConfig,
    toggleAdapterEnabled,
    updateAdapter,
    updateSystemInfo,
    applyDns,
    rebootSystem,
    showToast
  };
}
