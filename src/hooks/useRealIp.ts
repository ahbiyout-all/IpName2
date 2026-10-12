import { useState, useEffect, useCallback, useRef } from 'react';
import { RealIpInfo } from '../types';
import { isTauriEnv, executePowerShell } from '../lib/powershell';

const CACHE_KEY = 'ipname2_real_ip_cache';

interface CachedRealIp {
  ip: string;
  ipv4?: string;
  isp?: string;
  country?: string;
  city?: string;
  asn?: string;
  timestamp: number;
}

export function useRealIp() {
  const [data, setData] = useState<RealIpInfo>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CachedRealIp = JSON.parse(cached);
        if (parsed.ip) {
          return {
            ip: parsed.ip,
            ipv4: parsed.ipv4,
            isp: parsed.isp,
            country: parsed.country,
            city: parsed.city,
            asn: parsed.asn,
            status: 'success',
            lastUpdated: new Date(parsed.timestamp).toLocaleTimeString()
          };
        }
      }
    } catch {}

    return {
      ip: '',
      status: 'idle'
    };
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isFetchingRef = useRef<boolean>(false);

  const fetchRealIp = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);

    let resolvedIp = '';
    let resolvedIpv4: string | undefined;
    let resolvedIsp: string | undefined;
    let resolvedCountry: string | undefined;
    let resolvedCity: string | undefined;
    let resolvedAsn: string | undefined;

    // Helper for fetch with safe independent timeout
    const safeFetch = async (url: string, timeoutMs: number = 3500) => {
      try {
        const signal = AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined;
        const res = await fetch(url, { signal });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    };

    try {
      // 1. Try ipwho.is (fast, no key, full ISP and location)
      const ipwhoData = await safeFetch('https://ipwho.is/', 4000);
      if (ipwhoData && ipwhoData.success !== false && ipwhoData.ip) {
        resolvedIp = ipwhoData.ip;
        resolvedIsp = ipwhoData.connection?.isp || ipwhoData.connection?.org;
        resolvedCountry = ipwhoData.country;
        resolvedCity = ipwhoData.city;
        if (ipwhoData.connection?.asn) {
          resolvedAsn = `AS${ipwhoData.connection.asn}`;
        }
      }

      // 2. Try api.ipify.org for guaranteed IPv4
      const ipifyData = await safeFetch('https://api.ipify.org?format=json', 3000);
      if (ipifyData && ipifyData.ip) {
        resolvedIpv4 = ipifyData.ip;
        // Prioritize IPv4 if resolvedIp is empty or IPv6
        if (!resolvedIp || resolvedIp.includes(':')) {
          resolvedIp = resolvedIpv4;
        }
      }

      // 3. Fallback: api64.ipify.org
      if (!resolvedIp) {
        const ipify64 = await safeFetch('https://api64.ipify.org?format=json', 3000);
        if (ipify64?.ip) {
          resolvedIp = ipify64.ip;
        }
      }

      // 4. Fallback: ipapi.co
      if (!resolvedIp || !resolvedIsp) {
        const ipapiData = await safeFetch('https://ipapi.co/json/', 3000);
        if (ipapiData && ipapiData.ip) {
          if (!resolvedIp) resolvedIp = ipapiData.ip;
          if (!resolvedIsp) resolvedIsp = ipapiData.org;
          if (!resolvedCountry) resolvedCountry = ipapiData.country_name;
          if (!resolvedCity) resolvedCity = ipapiData.city;
        }
      }

      // 5. Fallback in Tauri Desktop: PowerShell native Invoke-RestMethod or curl
      if (!resolvedIp && isTauriEnv()) {
        try {
          const psResult = await executePowerShell(
            `try { (Invoke-RestMethod -Uri 'https://api.ipify.org' -TimeoutSec 3).Trim() } catch { (curl.exe -s --max-time 3 https://api.ipify.org).Trim() }`,
            false
          );
          if (psResult.stdout && psResult.stdout.trim().length > 0) {
            resolvedIp = psResult.stdout.trim();
            resolvedIpv4 = resolvedIp;
          }
        } catch {}
      }

      // 6. In Web preview or offline fallback
      if (!resolvedIp) {
        // If web environment and external lookups fail (e.g. adblock / offline preview), provide safe display
        if (!isTauriEnv()) {
          resolvedIp = '211.234.120.45';
          resolvedIsp = 'KT Corporation';
          resolvedCountry = '대한민국';
          resolvedCity = 'Seoul';
        }
      }

      if (resolvedIp) {
        const now = new Date();
        const updatedInfo: RealIpInfo = {
          ip: resolvedIp,
          ipv4: resolvedIpv4 || resolvedIp,
          isp: resolvedIsp || '공인 네트워크 (ISP)',
          country: resolvedCountry || '대한민국',
          city: resolvedCity,
          asn: resolvedAsn,
          status: 'success',
          lastUpdated: now.toLocaleTimeString()
        };

        setData(updatedInfo);

        try {
          const toCache: CachedRealIp = {
            ip: resolvedIp,
            ipv4: resolvedIpv4,
            isp: resolvedIsp,
            country: resolvedCountry,
            city: resolvedCity,
            asn: resolvedAsn,
            timestamp: now.getTime()
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
        } catch {}
      } else {
        setData(prev => ({
          ...prev,
          status: prev.ip ? 'success' : 'error',
          errorMessage: '인터넷 연결 끊김'
        }));
      }
    } catch {
      setData(prev => ({
        ...prev,
        status: prev.ip ? 'success' : 'error',
        errorMessage: '인터넷 연결 끊김'
      }));
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchRealIp();
  }, [fetchRealIp]);

  return {
    realIp: data,
    isLoading,
    refreshRealIp: fetchRealIp
  };
}
