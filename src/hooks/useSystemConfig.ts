import { useState, useCallback, useEffect, useRef } from 'react';
import { SystemInfo, NetworkAdapter } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { executePowerShell, isTauriEnv } from '../lib/powershell';
import { safeStorage } from '../lib/storage';

const STARTUP_CACHE_KEY = 'ipname2_startup_snapshot_v1';

interface StartupSnapshot {
  systemInfo: SystemInfo;
  adapters: NetworkAdapter[];
  timestamp: number;
}

function loadStartupSnapshot(): StartupSnapshot | null {
  try {
    const raw = safeStorage.getItem(STARTUP_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StartupSnapshot;
    if (
      parsed &&
      parsed.systemInfo &&
      typeof parsed.systemInfo.computerName === 'string' &&
      Array.isArray(parsed.adapters) &&
      parsed.adapters.length > 0 &&
      parsed.adapters[0]?.id !== 'loading'
    ) {
      return parsed;
    }
  } catch {}
  return null;
}

function saveStartupSnapshot(systemInfo: SystemInfo, adapters: NetworkAdapter[]): void {
  try {
    if (!systemInfo?.computerName || systemInfo.computerName === 'Error' || systemInfo.computerName === 'Exception') {
      return;
    }
    const validAdapters = adapters.filter(a => a.id !== 'loading' && a.id !== 'error');
    const payload: StartupSnapshot = {
      systemInfo,
      adapters: validAdapters,
      timestamp: Date.now()
    };
    safeStorage.setItem(STARTUP_CACHE_KEY, JSON.stringify(payload));
  } catch {}
}

function isValidIPv4(ip: string): boolean {
  if (!ip) return false;
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const num = Number(part);
    return num >= 0 && num <= 255 && part === num.toString();
  });
}

function isValidHostIPv4(ip: string): boolean {
  if (!isValidIPv4(ip)) return false;
  const trimmed = ip.trim();
  return trimmed !== '0.0.0.0' && trimmed !== '255.255.255.255';
}

function isValidSubnetMask(mask: string): boolean {
  if (!isValidIPv4(mask)) return false;
  const maskInt = mask
    .trim()
    .split('.')
    .reduce((acc, octet) => ((acc << 8) | parseInt(octet, 10)) >>> 0, 0) >>> 0;
  if (maskInt === 0 || maskInt === 0xffffffff) return false;
  const inv = (~maskInt) >>> 0;
  return ((inv & ((inv + 1) >>> 0)) >>> 0) === 0;
}

function escapePsDoubleQuoted(value: string): string {
  return value.replace(/`/g, '``').replace(/\$/g, '`$').replace(/"/g, '`"');
}

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

export function isGhostOrInvalidAdapter(adapter: {
  macAddress?: string;
  name?: string;
  isEnabled?: boolean;
  status?: string;
  type?: string;
  description?: string;
  isVirtual?: boolean;
}): boolean {
  if (adapter.status === 'Not Present' || adapter.status === 'NotPresent') {
    return true;
  }
  if (adapter.name && isFilterOrPseudoAdapter(adapter.name)) {
    return true;
  }

  const isVirt = isVirtualAdapter(
    adapter.name || '',
    adapter.type,
    adapter.description,
    adapter.isVirtual,
    adapter.macAddress
  );
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
    /(^|[^a-z0-9])tap(\d|[^a-z0-9]|$)/i.test(combined) ||
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
  if (!isValidIPv4(ip) || !isValidIPv4(gw) || !isValidIPv4(mask)) return false;
  try {
    const parse = (s: string) => s.trim().split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
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

  const initialSnapshotRef = useRef<StartupSnapshot | null | undefined>(undefined);
  if (initialSnapshotRef.current === undefined) {
    initialSnapshotRef.current = loadStartupSnapshot();
  }
  const hasInitialCache = Boolean(initialSnapshotRef.current);

  const [systemInfo, setSystemInfo] = useState<SystemInfo>(() =>
    initialSnapshotRef.current?.systemInfo ?? {
      computerName: t('loading'),
      workgroup: t('loading'),
      osVersion: t('loading'),
      processor: t('loading'),
      ram: t('loading'),
      isAdmin: false
    }
  );
  
  const [originalSystemInfo, setOriginalSystemInfo] = useState<SystemInfo | null>(() =>
    initialSnapshotRef.current?.systemInfo ?? null
  );

  const [adaptersState, setAdaptersState] = useState<NetworkAdapter[]>(() =>
    initialSnapshotRef.current?.adapters ?? [
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
    ]
  );

  // Interactive edits must NOT reorder adapter tabs or swap primary/secondary IPs mid-keystroke.
  // Sorting/enforcing primary IP is applied strictly on load/refresh in fetchInitialData.
  const setAdapters = setAdaptersState;

  const adapters = adaptersState;

  const [originalAdapters, setOriginalAdapters] = useState<NetworkAdapter[]>(() =>
    initialSnapshotRef.current?.adapters ?? []
  );

  const [isLoaded, setIsLoaded] = useState<boolean>(hasInitialCache);
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState<boolean>(false);
  const [pendingComputerName, setPendingComputerName] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);
  const fetchGenerationRef = useRef<number>(0);
  const adaptersRef = useRef<NetworkAdapter[]>(adaptersState);
  adaptersRef.current = adaptersState;
  const dirtyAdapterIdsRef = useRef<Set<string>>(new Set());
  const dirtySystemRef = useRef<boolean>(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const mergeRespectingDirtyEdits = useCallback(
    (incoming: NetworkAdapter[], current: NetworkAdapter[], forceOverwrite = false): NetworkAdapter[] => {
      if (forceOverwrite || dirtyAdapterIdsRef.current.size === 0) {
        return incoming;
      }
      const dirtyMap = new Map<string, NetworkAdapter>();
      for (const item of current) {
        if (dirtyAdapterIdsRef.current.has(item.id)) {
          dirtyMap.set(item.id, item);
        }
      }
      return incoming.map(item => dirtyMap.get(item.id) ?? item);
    },
    []
  );

  const fetchInitialData = useCallback(async (options?: { forceOverwrite?: boolean }) => {
    const gen = ++fetchGenerationRef.current;
    const forceOverwrite = options?.forceOverwrite === true;
    if (forceOverwrite) {
      dirtyAdapterIdsRef.current.clear();
      dirtySystemRef.current = false;
    }

    try {
      if (isTauriEnv()) {
        const { invoke } = await import('@tauri-apps/api/core');
        try {
          // Phase 1: Parallel Win32 Native Fast Path (<50ms)
          const [sysInfo, adapterList] = await Promise.all([
            invoke<SystemInfo>('get_system_info'),
            invoke<NetworkAdapter[]>('get_adapters')
          ]);

          if (!isMountedRef.current || fetchGenerationRef.current !== gen) return;

          const fetchedInfo: SystemInfo = {
            computerName: sysInfo.computerName || 'Unknown',
            workgroup: sysInfo.workgroup || 'WORKGROUP',
            osVersion: formatOsVersion(sysInfo.osVersion),
            processor: sysInfo.processor ? sysInfo.processor.trim() : 'Unknown',
            ram: sysInfo.ram || 'Unknown',
            isAdmin: !!sysInfo.isAdmin
          };

          setOriginalSystemInfo(fetchedInfo);
          setSystemInfo(prev => {
            if (!forceOverwrite && dirtySystemRef.current) {
              return {
                ...fetchedInfo,
                computerName: prev.computerName,
                workgroup: prev.workgroup
              };
            }
            return fetchedInfo;
          });

          const activeParsed: NetworkAdapter[] = adapterList
            .filter(adapter => !isFilterOrPseudoAdapter(adapter.name) && !isGhostOrInvalidAdapter(adapter))
            .map((adapter, index) => {
              const isVirt = adapter.isVirtual === true ||
                isVirtualAdapter(adapter.name, adapter.type, adapter.description, adapter.isVirtual, adapter.macAddress);
              return {
                ...adapter,
                isVirtual: isVirt,
                type: isVirt ? ('Virtual' as const) : adapter.type,
                id: adapter.id || adapter.macAddress || adapter.name || `adapter-${index}`
              };
            });

          const activeNames = new Set(activeParsed.map(a => a.name.toLowerCase()));
          const activeMacs = new Set(activeParsed.map(a => (a.macAddress || '').replace(/[:-]/g, '').toLowerCase()).filter(Boolean));

          // Temporarily preserve previously known disabled adapters until Phase 2 confirms
          const carriedDisabled = adaptersRef.current.filter(prev => {
            if (prev.id === 'loading' || prev.id === 'error') return false;
            if (prev.status !== 'Disabled' && prev.isEnabled !== false) return false;
            const prevName = (prev.name || '').toLowerCase();
            const prevMac = (prev.macAddress || '').replace(/[:-]/g, '').toLowerCase();
            return !activeNames.has(prevName) && (!prevMac || !activeMacs.has(prevMac));
          });

          const phase1Sorted = sortAdaptersAndEnforcePrimaryIp([...activeParsed, ...carriedDisabled]);
          setOriginalAdapters(phase1Sorted);
          setAdaptersState(prev => mergeRespectingDirtyEdits(phase1Sorted, prev, forceOverwrite));
          setIsLoaded(true);
          saveStartupSnapshot(fetchedInfo, phase1Sorted);

          // Phase 2: Deferred Non-Blocking PowerShell Enrichment for Disabled Adapters & NDIS Virtual Flags
          setIsBackgroundSyncing(true);
          void (async () => {
            try {
              // Yield a frame so Phase 1 UI renders immediately before spawning PowerShell
              await new Promise(resolve => setTimeout(resolve, 16));
              if (!isMountedRef.current || fetchGenerationRef.current !== gen) return;

              let disabledNetAdapters: Array<{ name: string; macAddress?: string; isVirtual?: boolean; description?: string }> = [];
              const virtualNetNames = new Set<string>();

              const psPresent = await executePowerShell(
                `try { @(Get-NetAdapter -IncludeHidden:$false -ErrorAction SilentlyContinue | Select-Object -Property Name,Status,MacAddress,Virtual,InterfaceDescription) | ConvertTo-Json -Compress } catch { '[]' }`,
                false
              );

              if (!isMountedRef.current || fetchGenerationRef.current !== gen) return;

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
                  for (const item of parsed) {
                    if (item.Name) {
                      const nLower = String(item.Name).toLowerCase();
                      const isItemVirt = item.Virtual === true || isVirtualAdapter(item.Name, undefined, item.InterfaceDescription, item.Virtual, item.MacAddress);
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

              const enrichedActive: NetworkAdapter[] = activeParsed.map(adapter => {
                const isVirt = adapter.isVirtual === true || virtualNetNames.has(adapter.name.toLowerCase());
                return isVirt !== adapter.isVirtual || (isVirt && adapter.type !== 'Virtual')
                  ? { ...adapter, isVirtual: isVirt, type: isVirt ? ('Virtual' as const) : adapter.type }
                  : adapter;
              });

              const enrichedNames = new Set(enrichedActive.map(a => a.name.toLowerCase()));
              const enrichedMacs = new Set(enrichedActive.map(a => (a.macAddress || '').replace(/[:-]/g, '').toLowerCase()).filter(Boolean));
              const merged = [...enrichedActive];

              for (const dis of disabledNetAdapters) {
                const cleanDisMac = (dis.macAddress || '').replace(/[:-]/g, '').toLowerCase();
                if (
                  !enrichedNames.has(dis.name.toLowerCase()) &&
                  (!cleanDisMac || !enrichedMacs.has(cleanDisMac)) &&
                  !isFilterOrPseudoAdapter(dis.name) &&
                  !isGhostOrInvalidAdapter(dis)
                ) {
                  const isVirt = dis.isVirtual ?? isVirtualAdapter(dis.name, 'Ethernet', dis.description, undefined, dis.macAddress);
                  const normalizedMac = dis.macAddress ? dis.macAddress.replace(/-/g, ':').toUpperCase() : '';
                  merged.push({
                    id: normalizedMac || dis.name,
                    name: dis.name,
                    type: isVirt ? 'Virtual' : (dis.name.toLowerCase().includes('wi-fi') || dis.name.toLowerCase().includes('wireless') || dis.name.toLowerCase().includes('와이파이') ? 'Wi-Fi' : 'Ethernet'),
                    status: 'Disabled',
                    ipAddress: '',
                    subnetMask: '',
                    gateway: '',
                    primaryDns: '',
                    secondaryDns: '',
                    macAddress: normalizedMac,
                    isDhcp: true,
                    isEnabled: false,
                    isVirtual: isVirt,
                    description: dis.description,
                    additionalIps: []
                  });
                  enrichedNames.add(dis.name.toLowerCase());
                  if (cleanDisMac) enrichedMacs.add(cleanDisMac);
                }
              }

              const sortedMerged = sortAdaptersAndEnforcePrimaryIp(merged);
              if (!isMountedRef.current || fetchGenerationRef.current !== gen) return;

              setOriginalAdapters(sortedMerged);
              setAdaptersState(prev => mergeRespectingDirtyEdits(sortedMerged, prev, forceOverwrite));
              saveStartupSnapshot(fetchedInfo, sortedMerged);
            } catch (e) {
              console.warn('Could not enrich NetAdapters via deferred PowerShell:', e);
            } finally {
              if (isMountedRef.current && fetchGenerationRef.current === gen) {
                setIsBackgroundSyncing(false);
              }
            }
          })();
        } catch (err: any) {
          console.error('Native API Error:', err);
          if (!isMountedRef.current || fetchGenerationRef.current !== gen) return;
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
          setOriginalAdapters([]);
          setIsLoaded(true);
        }
      } else {
        // Web Preview Mock
        const mockInfo: SystemInfo = {
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
        const sortedMock = sortAdaptersAndEnforcePrimaryIp(mockAdapters);
        setAdaptersState(sortedMock);
        setOriginalAdapters(sortedMock);
        setIsLoaded(true);
        saveStartupSnapshot(mockInfo, sortedMock);
      }
    } catch (error: any) {
      console.error('Failed to fetch initial data:', error);
      if (isMountedRef.current) {
        setSystemInfo(prev => ({ ...prev, computerName: 'Exception' }));
        setIsLoaded(true);
      }
    }
  }, [mergeRespectingDirtyEdits]);

  useEffect(() => {
    fetchInitialData().finally(() => {
      if (isMountedRef.current) {
        setIsLoaded(true);
      }
    });
  }, [fetchInitialData]);

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (!isMountedRef.current) return;
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ show: true, message, type });
    toastTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setToast(prev => ({ ...prev, show: false }));
      }
      toastTimerRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const saveSystemInfo = useCallback(async () => {
    setIsSaving(true);
    try {
      let script = '';
      let requiresRestart = false;

      let nameChanged = false;
      if (originalSystemInfo) {
        const trimmedName = (systemInfo.computerName || '').trim();
        const trimmedWorkgroup = (systemInfo.workgroup || '').trim();

        if (trimmedName.length === 0 || trimmedName.length > 15) {
          showToast(t('invalidComputerNameLength'), 'error');
          setIsSaving(false);
          return;
        }
        if (/[\\/:\*\?"<>\|+=;,\s]/.test(trimmedName)) {
          showToast(t('invalidComputerName'), 'error');
          setIsSaving(false);
          return;
        }
        if (/^[-.]|[-.]$/.test(trimmedName)) {
          showToast(t('invalidComputerNameEdge'), 'error');
          setIsSaving(false);
          return;
        }

        if (trimmedWorkgroup !== (originalSystemInfo.workgroup || '').trim()) {
          if (
            trimmedWorkgroup.length === 0 ||
            trimmedWorkgroup.length > 15 ||
            /[\\/:\*\?"<>\|+=;,\s]/.test(trimmedWorkgroup) ||
            /^[-.]|[-.]$/.test(trimmedWorkgroup)
          ) {
            showToast(t('invalidWorkgroup'), 'error');
            setIsSaving(false);
            return;
          }
          script += `Add-Computer -WorkgroupName "${escapePsDoubleQuoted(trimmedWorkgroup)}" -Force\n`;
          requiresRestart = true;
        }

        if (trimmedName !== (originalSystemInfo.computerName || '').trim()) {
          script += `Rename-Computer -NewName "${escapePsDoubleQuoted(trimmedName)}" -Force\n`;
          requiresRestart = true;
          nameChanged = true;
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
          Write-Error $_
          exit 1
        }
      `;

      if (isTauriEnv()) {
        const response = await executePowerShell(wrappedScript, !systemInfo.isAdmin);
        if (!isMountedRef.current) return;

        if (response.code !== 0) {
          console.error("PowerShell Error:", response.code, response.stderr || response.stdout);
          showToast(t('applyError'), 'error');
        } else {
          dirtySystemRef.current = false;
          if (requiresRestart) {
            if (nameChanged) {
              setPendingComputerName(systemInfo.computerName.trim());
            }
            showToast(`${t('saveSuccess')} ${t('restartRequired')}`, 'success');
          } else {
            showToast(t('saveSuccess'), 'success');
          }
          await fetchInitialData();
        }
      } else {
        // Web Preview Mock
        console.log("Mock saveSystemInfo executed with script:", script);
        dirtySystemRef.current = false;
        const nextInfo = { ...systemInfo };
        setOriginalSystemInfo(nextInfo);
        saveStartupSnapshot(nextInfo, adaptersRef.current);
        if (requiresRestart) {
          if (nameChanged) {
            setPendingComputerName(systemInfo.computerName.trim());
          }
          showToast(`${t('saveSuccess')} ${t('restartRequired')}`, 'success');
        } else {
          showToast(t('saveSuccess'), 'success');
        }
      }
    } catch (error) {
      console.error("Failed to save system info:", error);
      if (isMountedRef.current) {
        showToast(t('applyError'), 'error');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [systemInfo, originalSystemInfo, fetchInitialData, t, showToast]);

  const saveNetworkConfig = useCallback(async (selectedAdapterId: string) => {
    setIsSaving(true);
    try {
      let script = '';

      const adapter = adapters.find(a => a.id === selectedAdapterId);
      const originalAdapter = originalAdapters.find(a => a.id === selectedAdapterId);
      
      if (adapter) {
        const safeAdapterName = escapePsDoubleQuoted(adapter.name);

        // Handle Enable/Disable
        if (originalAdapter && adapter.isEnabled !== originalAdapter.isEnabled) {
          if (adapter.isEnabled) {
            script += `Enable-NetAdapter -Name "${safeAdapterName}" -Confirm:$false\n`;
            script += `Start-Sleep -Seconds 2\n`;
          } else {
            script += `Disable-NetAdapter -Name "${safeAdapterName}" -Confirm:$false\n`;
          }
        }

        // Only process IP settings if the adapter is enabled
        if (adapter.isEnabled) {
          const primaryIp = (adapter.ipAddress || '').trim();
          const subnetMask = (adapter.subnetMask || '').trim();
          const gateway = (adapter.gateway || '').trim();
          const dns1 = (adapter.primaryDns || '').trim();
          const dns2 = (adapter.secondaryDns || '').trim();

          if (!adapter.isDhcp) {
            if (!primaryIp || !subnetMask) {
              showToast(t('ipRequired'), 'error');
              setIsSaving(false);
              return;
            }
            if (!isValidHostIPv4(primaryIp)) {
              showToast(t('invalidIp'), 'error');
              setIsSaving(false);
              return;
            }
            if (!isValidSubnetMask(subnetMask)) {
              showToast(t('invalidSubnet'), 'error');
              setIsSaving(false);
              return;
            }
            if (gateway && !isValidHostIPv4(gateway)) {
              showToast(t('invalidGateway'), 'error');
              setIsSaving(false);
              return;
            }
            if (dns1 && !isValidHostIPv4(dns1)) {
              showToast(t('invalidDns'), 'error');
              setIsSaving(false);
              return;
            }
            if (dns2 && !isValidHostIPv4(dns2)) {
              showToast(t('invalidDns'), 'error');
              setIsSaving(false);
              return;
            }

            if (adapter.additionalIps && adapter.additionalIps.length > 0) {
              const seenIps = new Set<string>([primaryIp]);
              for (const sec of adapter.additionalIps) {
                const secIp = (sec.ipAddress || '').trim();
                const secMask = (sec.subnetMask || '').trim();
                if (!secIp || !isValidHostIPv4(secIp)) {
                  showToast(t('invalidSecondaryIp'), 'error');
                  setIsSaving(false);
                  return;
                }
                if (!secMask || !isValidSubnetMask(secMask)) {
                  showToast(t('invalidSecondaryIp'), 'error');
                  setIsSaving(false);
                  return;
                }
                if (seenIps.has(secIp)) {
                  showToast(t('duplicateIpWarning'), 'error');
                  setIsSaving(false);
                  return;
                }
                seenIps.add(secIp);
              }
            }
          }

          if (adapter.isDhcp) {
            script += `netsh interface ipv4 set address name="${safeAdapterName}" source=dhcp\n`;
            script += `netsh interface ipv4 set dns name="${safeAdapterName}" source=dhcp\n`;
          } else {
            const gw = gateway ? ` gateway=${gateway}` : '';
            script += `netsh interface ipv4 set address name="${safeAdapterName}" source=static address=${primaryIp} mask=${subnetMask}${gw}\n`;
            
            // Add secondary / multiple IP addresses
            if (adapter.additionalIps && adapter.additionalIps.length > 0) {
              for (const sec of adapter.additionalIps) {
                const secIp = (sec.ipAddress || '').trim();
                const secMask = (sec.subnetMask || '').trim();
                if (secIp && secMask) {
                  script += `netsh interface ipv4 add address name="${safeAdapterName}" address=${secIp} mask=${secMask}\n`;
                }
              }
            }

            if (dns1) {
              script += `netsh interface ipv4 set dns name="${safeAdapterName}" source=static address=${dns1} validate=no\n`;
              if (dns2 && dns2 !== dns1) {
                script += `netsh interface ipv4 add dns name="${safeAdapterName}" address=${dns2} index=2 validate=no\n`;
              }
            } else if (dns2) {
              script += `netsh interface ipv4 set dns name="${safeAdapterName}" source=static address=${dns2} validate=no\n`;
            } else {
              script += `netsh interface ipv4 set dns name="${safeAdapterName}" source=dhcp\n`;
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
          Write-Error $_
          exit 1
        }
      `;

      if (isTauriEnv()) {
        const response = await executePowerShell(wrappedScript, !systemInfo.isAdmin);
        if (!isMountedRef.current) return;

        if (response.code !== 0) {
          console.error("PowerShell Error:", response.code, response.stderr || response.stdout);
          showToast(t('applyError'), 'error');
          return;
        }

        showToast(t('saveSuccess'), 'success');
        dirtyAdapterIdsRef.current.delete(selectedAdapterId);

        // Adaptive polling: verify all applied fields settled in Win32 before refreshing (max ~2.1s)
        if (adapter) {
          const expectedEnabled = adapter.isEnabled;
          const expectedDhcp = adapter.isDhcp;
          const expectedIp = !expectedDhcp ? (adapter.ipAddress || '').trim() : '';
          const expectedGw = !expectedDhcp ? (adapter.gateway || '').trim() : '';
          const rawDns1 = !expectedDhcp ? (adapter.primaryDns || '').trim() : '';
          const rawDns2 = !expectedDhcp ? (adapter.secondaryDns || '').trim() : '';
          const expectedDns1 = rawDns1 || rawDns2;
          const expectedDns2 = (rawDns1 && rawDns2 && rawDns2 !== rawDns1) ? rawDns2 : '';
          const expectedSecIps = !expectedDhcp
            ? (adapter.additionalIps || []).map(s => (s.ipAddress || '').trim()).filter(Boolean)
            : [];
          const targetNameLower = (adapter.name || '').toLowerCase();

          await new Promise(resolve => setTimeout(resolve, 350));
          for (let attempt = 0; attempt < 6; attempt++) {
            if (!isMountedRef.current) return;
            try {
              const { invoke } = await import('@tauri-apps/api/core');
              const polled = await invoke<NetworkAdapter[]>('get_adapters');
              const matched = polled.find(a => a.id === selectedAdapterId || a.name.toLowerCase() === targetNameLower);
              if (!expectedEnabled) {
                if (!matched || matched.isEnabled === false) break;
              } else if (matched && matched.isEnabled) {
                if (expectedDhcp) {
                  if (matched.isDhcp) break;
                } else {
                  const secMatch =
                    (matched.additionalIps || []).length === expectedSecIps.length &&
                    expectedSecIps.every(ip => (matched.additionalIps || []).some(s => s.ipAddress === ip));
                  if (
                    !matched.isDhcp &&
                    matched.ipAddress === expectedIp &&
                    (matched.gateway || '') === expectedGw &&
                    (matched.primaryDns || '') === expectedDns1 &&
                    (matched.secondaryDns || '') === expectedDns2 &&
                    secMatch
                  ) {
                    break;
                  }
                }
              }
            } catch {}
            await new Promise(resolve => setTimeout(resolve, 350));
          }
        }

        if (isMountedRef.current) {
          await fetchInitialData();
        }
      } else {
        // Web Preview Mock
        console.log("Mock saveNetworkConfig executed with script:", script);
        dirtyAdapterIdsRef.current.delete(selectedAdapterId);
        const snapshotAdapters = [...adaptersRef.current];
        setOriginalAdapters(snapshotAdapters);
        saveStartupSnapshot(systemInfo, snapshotAdapters);
        showToast(t('saveSuccess'), 'success');
      }
    } catch (error) {
      console.error("Failed to save network config:", error);
      if (isMountedRef.current) {
        showToast(t('applyError'), 'error');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [adapters, originalAdapters, systemInfo, fetchInitialData, t, showToast]);

  const updateAdapter = useCallback((id: string, fieldOrUpdates: keyof NetworkAdapter | Partial<NetworkAdapter>, value?: any) => {
    dirtyAdapterIdsRef.current.add(id);
    setAdapters(prev => prev.map(adapter => {
      if (adapter.id !== id) return adapter;
      if (typeof fieldOrUpdates === 'object' && fieldOrUpdates !== null) {
        return { ...adapter, ...fieldOrUpdates };
      }
      return { ...adapter, [fieldOrUpdates as keyof NetworkAdapter]: value };
    }));
  }, []);

  const updateSystemInfo = useCallback((field: keyof SystemInfo, value: string) => {
    dirtySystemRef.current = true;
    setSystemInfo(prev => ({ ...prev, [field]: value }));
  }, []);

  const applyDns = useCallback((adapterId: string, primary: string, secondary: string) => {
    dirtyAdapterIdsRef.current.add(adapterId);
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
        const safeAdapterName = escapePsDoubleQuoted(adapter.name);
        const cmd = newEnabled 
          ? `Enable-NetAdapter -Name "${safeAdapterName}" -Confirm:$false\nStart-Sleep -Seconds 2`
          : `Disable-NetAdapter -Name "${safeAdapterName}" -Confirm:$false`;

        const wrappedScript = `
          $ErrorActionPreference = 'Stop';
          try {
            & {
              ${cmd}
            } 2>&1 | Out-Null
            exit 0
          } catch {
            Write-Error $_
            exit 1
          }
        `;

        const response = await executePowerShell(wrappedScript, !systemInfo.isAdmin);
        if (!isMountedRef.current) return;

        dirtyAdapterIdsRef.current.delete(adapterId);

        if (response.code !== 0) {
          console.error("PowerShell Error:", response.code, response.stderr || response.stdout);
          showToast(t('applyError'), 'error');
          await fetchInitialData();
          return;
        }

        showToast(newEnabled ? t('adapterEnabledSuccess') : t('adapterDisabledSuccess'), 'success');

        // Adaptive polling: finish as soon as adapter enable/disable state settles in Win32 (max ~2.1s)
        const targetNameLower = adapter.name.toLowerCase();
        await new Promise(resolve => setTimeout(resolve, 350));
        for (let attempt = 0; attempt < 5; attempt++) {
          if (!isMountedRef.current) return;
          try {
            const { invoke } = await import('@tauri-apps/api/core');
            const polled = await invoke<NetworkAdapter[]>('get_adapters');
            const matched = polled.find(a => a.id === adapterId || a.name.toLowerCase() === targetNameLower);
            if (newEnabled ? matched?.isEnabled === true : (!matched || matched.isEnabled === false)) {
              break;
            }
          } catch {}
          await new Promise(resolve => setTimeout(resolve, 350));
        }

        if (isMountedRef.current) {
          await fetchInitialData();
        }
      } else {
        // Web Preview Mock
        dirtyAdapterIdsRef.current.delete(adapterId);
        const nextAdapters = adaptersRef.current.map(a => (a.id === adapter.id || a.name === adapter.name) ? {
          ...a,
          isEnabled: newEnabled,
          status: (newEnabled ? (a.ipAddress ? 'Connected' : 'Disconnected') : 'Disabled') as NetworkAdapter['status']
        } : a);
        setAdaptersState(nextAdapters);
        setOriginalAdapters(nextAdapters);
        saveStartupSnapshot(systemInfo, nextAdapters);
        showToast(newEnabled ? t('adapterEnabledSuccess') : t('adapterDisabledSuccess'), 'success');
      }
    } catch (err) {
      console.error("Failed to toggle adapter:", err);
      if (isMountedRef.current) {
        showToast(t('applyError'), 'error');
        dirtyAdapterIdsRef.current.delete(adapterId);
        if (isTauriEnv()) {
          await fetchInitialData();
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [adapters, systemInfo, fetchInitialData, t, showToast]);

  const rebootSystem = useCallback(async () => {
    try {
      if (isTauriEnv()) {
        const response = await executePowerShell('Restart-Computer -Force', !systemInfo.isAdmin);
        if (response.code !== 0 && isMountedRef.current) {
          console.error("Reboot PowerShell Error:", response.code, response.stderr || response.stdout);
          showToast(t('applyError'), 'error');
        }
      } else {
        console.log("Mock reboot executed");
        showToast(t('rebootSystem'), 'success');
      }
    } catch (error) {
      console.error("Failed to reboot system:", error);
      if (isMountedRef.current) {
        showToast(t('applyError'), 'error');
      }
    }
  }, [systemInfo.isAdmin, t, showToast]);

  return {
    isLoaded,
    isBackgroundSyncing,
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
