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

export function isGhostOrInvalidAdapter(adapter: { macAddress?: string; name?: string; isEnabled?: boolean; status?: string }): boolean {
  // If the adapter is administratively disabled or marked as Disabled, it is a valid real adapter that is powered off, NOT a ghost!
  if (adapter.isEnabled === false || adapter.status === 'Disabled') {
    return false;
  }
  if (!adapter.macAddress) return true;
  const clean = adapter.macAddress.replace(/[:-]/g, '').toLowerCase().trim();
  if (!clean || clean === '000000000000' || /^0+$/.test(clean)) {
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

export function isVirtualAdapter(name: string, type?: string): boolean {
  if (type === 'Virtual') return true;
  const n = (name || '').toLowerCase();
  return (
    n.startsWith('vethernet') ||
    n.startsWith('vswitch') ||
    n.includes('hyper-v') ||
    n.includes('vmware') ||
    n.includes('virtualbox') ||
    n.includes('virtual')
  );
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

  const [adapters, setAdapters] = useState<NetworkAdapter[]>([
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
          
          // Query disabled adapters from Windows PowerShell so disabled NICs are never lost
          let disabledNetAdapters: Array<{ name: string; macAddress?: string }> = [];
          try {
            const psDisabled = await executePowerShell(
              `try { @(Get-NetAdapter -IncludeHidden:$false -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'Disabled' } | Select-Object -Property Name,MacAddress) | ConvertTo-Json -Compress } catch { '[]' }`,
              false
            );
            if (psDisabled.stdout) {
              const trimmed = psDisabled.stdout.trim();
              if (trimmed.startsWith('[')) {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                  disabledNetAdapters = parsed.map((item: any) => ({ name: item.Name, macAddress: item.MacAddress }));
                }
              } else if (trimmed.startsWith('{')) {
                const item = JSON.parse(trimmed);
                if (item.Name) {
                  disabledNetAdapters = [{ name: item.Name, macAddress: item.MacAddress }];
                }
              }
            }
          } catch (e) {
            console.warn("Could not query disabled adapters via PowerShell:", e);
          }

          const activeParsed = adapterList
            .filter(adapter => !isFilterOrPseudoAdapter(adapter.name) && !isGhostOrInvalidAdapter(adapter))
            .map((adapter, index) => {
              const isVirt = isVirtualAdapter(adapter.name, adapter.type);
              return {
                ...adapter,
                type: isVirt ? ('Virtual' as const) : adapter.type,
                id: adapter.id || adapter.macAddress || adapter.name || `adapter-${index}`
              };
            });

          setAdapters(prevAdapters => {
            const activeNames = new Set(activeParsed.map(a => a.name.toLowerCase()));
            const merged = [...activeParsed];

            // 1. Preserve any previously known adapter that was disabled (Windows removes disabled NICs from GetAdaptersAddresses)
            for (const prev of prevAdapters) {
              if (prev.id === 'loading' || prev.id === 'error') continue;
              if (!activeNames.has(prev.name.toLowerCase())) {
                merged.push({
                  ...prev,
                  isEnabled: false,
                  status: 'Disabled'
                });
                activeNames.add(prev.name.toLowerCase());
              }
            }

            // 2. Add any disabled adapters discovered from Windows
            for (const dis of disabledNetAdapters) {
              if (!activeNames.has(dis.name.toLowerCase()) && !isFilterOrPseudoAdapter(dis.name)) {
                const isVirt = isVirtualAdapter(dis.name, 'Ethernet');
                merged.push({
                  id: dis.macAddress || dis.name,
                  name: dis.name,
                  type: isVirt ? 'Virtual' : (dis.name.toLowerCase().includes('wi-fi') || dis.name.toLowerCase().includes('wireless') ? 'Wi-Fi' : 'Ethernet'),
                  status: 'Disabled',
                  ipAddress: '',
                  subnetMask: '',
                  gateway: '',
                  primaryDns: '',
                  secondaryDns: '',
                  macAddress: dis.macAddress || '',
                  isDhcp: true,
                  isEnabled: false
                });
                activeNames.add(dis.name.toLowerCase());
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
            ipAddress: '192.168.1.100',
            subnetMask: '255.255.255.0',
            gateway: '192.168.1.1',
            primaryDns: '8.8.8.8',
            secondaryDns: '8.8.4.4',
            macAddress: '00:1A:2B:3C:4D:5E',
            isDhcp: false
          },
          {
            id: 'mock-wifi-1',
            name: 'Wi-Fi',
            type: 'Wi-Fi',
            status: 'Disconnected',
            isEnabled: true,
            ipAddress: '',
            subnetMask: '',
            gateway: '',
            primaryDns: '',
            secondaryDns: '',
            macAddress: 'A1:B2:C3:D4:E5:F6',
            isDhcp: true
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
          }

          if (adapter.isDhcp) {
            script += `netsh interface ipv4 set address name="${adapter.name}" source=dhcp\n`;
            script += `netsh interface ipv4 set dns name="${adapter.name}" source=dhcp\n`;
          } else {
            const gw = adapter.gateway ? ` gateway=${adapter.gateway}` : '';
            script += `netsh interface ipv4 set address name="${adapter.name}" source=static address=${adapter.ipAddress} mask=${adapter.subnetMask}${gw}\n`;
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
