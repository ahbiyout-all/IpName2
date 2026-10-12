import React, { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { Network, Wifi, ShieldAlert, Terminal, Activity, Layers, Zap } from 'lucide-react';
import { useSystemConfig, isVirtualAdapter } from './hooks/useSystemConfig';
import { Header } from './components/Header';
import { SystemSection } from './components/SystemSection';
import { RealIpSection } from './components/RealIpSection';
import { QuickDnsSettings } from './components/QuickDnsSettings';
import { AdapterItem } from './components/AdapterItem';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';
import { UpdateModal } from './components/UpdateModal';
import { useGitHubUpdate } from './hooks/useGitHubUpdate';
import { useLanguage } from './contexts/LanguageContext';
import { NativePingResult } from './types';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', backgroundColor: 'white', height: '100vh', width: '100vw' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { t } = useLanguage();
  const {
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
  } = useSystemConfig();

  type ConfirmActionType = 
    | { type: 'system'; id?: string }
    | { type: 'network'; id: string }
    | { type: 'reboot'; id?: string }
    | { type: 'toggle-adapter'; id: string; targetState: boolean; adapterName: string };

  const [selectedAdapterId, setSelectedAdapterId] = useState<string>('');
  const [confirmAction, setConfirmAction] = useState<ConfirmActionType | null>(null);
  const [adapterFilter, setAdapterFilter] = useState<'all' | 'physical' | 'virtual'>('physical');
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  // GitHub Releases Real-Time Auto-Update System
  const {
    currentVersion,
    isChecking: isCheckingUpdate,
    updateAvailable,
    latestRelease,
    isModalOpen: isUpdateModalOpen,
    checkUpdate,
    dismissUpdate,
    statusMessage: updateStatusMessage,
    repoUrl
  } = useGitHubUpdate();

  // Categorize adapters
  const physicalAdapters = useMemo(() => {
    return adapters.filter(a => a.type !== 'Virtual' && !isVirtualAdapter(a.name, a.type));
  }, [adapters]);

  const virtualAdapters = useMemo(() => {
    return adapters.filter(a => a.type === 'Virtual' || isVirtualAdapter(a.name, a.type));
  }, [adapters]);

  // Determine displayed adapters based on filter (auto fallback to all if physical is empty)
  const displayAdapters = useMemo(() => {
    if (adapterFilter === 'physical') {
      return physicalAdapters.length > 0 ? physicalAdapters : adapters;
    }
    if (adapterFilter === 'virtual') {
      return virtualAdapters.length > 0 ? virtualAdapters : adapters;
    }
    return adapters;
  }, [adapters, adapterFilter, physicalAdapters, virtualAdapters]);

  useEffect(() => {
    // Tauri window resizing is handled in tauri.conf.json or via Tauri API
    // We can use @tauri-apps/api/window if needed
  }, []);

  useEffect(() => {
    if (displayAdapters.length > 0) {
      const currentExists = displayAdapters.some(a => a.id === selectedAdapterId || a.name === selectedAdapterId);
      if (!currentExists) {
        const connected = displayAdapters.find(a => a.status === 'Connected');
        setSelectedAdapterId(connected ? connected.id : displayAdapters[0].id);
      }
    }
  }, [displayAdapters, selectedAdapterId]);

  const selectedAdapter = adapters.find(a => a.id === selectedAdapterId || a.name === selectedAdapterId) || displayAdapters[0] || adapters[0];

  const isTauriEnv = () => typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;

  const handleOpenCmd = async () => {
    if (isTauriEnv()) {
      try {
        const { Command } = await import('@tauri-apps/plugin-shell');
        await Command.create('cmd', ['/c', 'start', 'cmd.exe']).execute();
      } catch (e) {
        console.error("Failed to open CMD:", e);
      }
    } else {
      console.log("Mock CMD open");
    }
  };

  const handlePingDns = async () => {
    if (!selectedAdapter?.primaryDns) return;
    setIsPinging(true);
    setPingStatus(t('checking'));

    if (isTauriEnv()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const res = await invoke<NativePingResult>('ping_ipv4', {
          targetIp: selectedAdapter.primaryDns,
          timeoutMs: 1500
        });
        if (res.success) {
          const latencyStr = `${res.round_trip_time_ms}ms (TTL ${res.time_to_live})`;
          setPingStatus(latencyStr);
          showToast(`⚡ [IpNameCore] ${selectedAdapter.primaryDns} Ping 성공: ${latencyStr}`, 'success');
        } else {
          setPingStatus('타임아웃');
          showToast(`[IpNameCore] Ping 실패: ${res.message}`, 'error');
        }
      } catch (e) {
        console.error("Native Ping failed, falling back to CMD:", e);
        try {
          const { Command } = await import('@tauri-apps/plugin-shell');
          await Command.create('cmd', ['/c', 'start', 'cmd.exe', '/k', `ping -t ${selectedAdapter.primaryDns}`]).execute();
        } catch {}
      } finally {
        setIsPinging(false);
      }
    } else {
      // Web Preview Mock
      setTimeout(() => {
        const mockLatency = '8ms (TTL 64)';
        setPingStatus(mockLatency);
        showToast(`⚡ [IpNameCore 모의] ${selectedAdapter.primaryDns} Ping 성공: ${mockLatency}`, 'success');
        setIsPinging(false);
      }, 400);
    }
  };

  if (!isLoaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full p-3 max-w-[600px] mx-auto flex flex-col overflow-hidden selection:bg-primary/20">
      <Header 
        isAdmin={systemInfo.isAdmin} 
        onReboot={() => setConfirmAction({ type: 'reboot' })} 
        onCheckUpdate={() => checkUpdate(true)}
        updateAvailable={updateAvailable}
      />

      {pendingComputerName && (
        <div className="bg-red-100 border border-red-300 text-red-800 px-3 py-2 rounded-lg text-xs flex items-center gap-2 mb-3 shrink-0 shadow-sm animate-in slide-in-from-top-2">
          <ShieldAlert size={14} className="shrink-0 text-red-600" />
          <span>
            {t('pendingComputerNameNotice')} <strong className="text-red-600 text-[13px] ml-1">{pendingComputerName}</strong>
          </span>
        </div>
      )}

      <main className="flex flex-col gap-2.5 flex-1 overflow-y-auto overflow-x-hidden pb-1 pr-1 custom-scrollbar">
        <SystemSection 
          info={systemInfo} 
          originalInfo={originalSystemInfo}
          onUpdate={updateSystemInfo} 
          onSave={() => setConfirmAction({ type: 'system' })}
          isSaving={isSaving}
        />

        <RealIpSection />

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold flex items-center gap-1.5 whitespace-nowrap">
                <Network size={14} className="text-primary" />
                {t('networkAdapters')}
              </h2>
              {adapters.length > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--card)] border border-[var(--border)] text-[var(--text-muted)]">
                  {displayAdapters.length}/{adapters.length}
                </span>
              )}
            </div>

            {/* Filter Segmented Controls */}
            {adapters.length > 0 && (virtualAdapters.length > 0 || physicalAdapters.length > 0) && (
              <div className="flex items-center gap-1 bg-[var(--card)] p-0.5 rounded-lg border border-[var(--border)] text-[10px]">
                <button
                  type="button"
                  onClick={() => setAdapterFilter('physical')}
                  className={`px-2 py-0.5 rounded font-bold transition-all ${
                    adapterFilter === 'physical'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-foreground'
                  }`}
                  title={t('filterPhysical')}
                >
                  {t('filterPhysical')} {physicalAdapters.length > 0 && `(${physicalAdapters.length})`}
                </button>
                {virtualAdapters.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAdapterFilter('virtual')}
                    className={`px-2 py-0.5 rounded font-bold transition-all ${
                      adapterFilter === 'virtual'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-foreground'
                    }`}
                    title={t('filterVirtual')}
                  >
                    {t('filterVirtual')} ({virtualAdapters.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAdapterFilter('all')}
                  className={`px-2 py-0.5 rounded font-bold transition-all ${
                    adapterFilter === 'all'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-foreground'
                  }`}
                  title={t('filterAll')}
                >
                  {t('filterAll')} ({adapters.length})
                </button>
              </div>
            )}
          </div>

          {/* Clean Horizontal Scrolling Tab Bar */}
          {displayAdapters.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 px-0.5 no-scrollbar scroll-smooth">
              {displayAdapters.map(adapter => {
                const isSelected = adapter.id === selectedAdapterId;
                const isVirtual = adapter.type === 'Virtual' || isVirtualAdapter(adapter.name, adapter.type);
                return (
                  <button
                    key={adapter.id}
                    onClick={() => setSelectedAdapterId(adapter.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all duration-200 active:scale-95 cursor-pointer select-none shrink-0 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm ring-1 ring-primary/40'
                        : 'bg-[var(--card)] text-foreground border-[var(--border)] hover:bg-[var(--card-hover)]'
                    }`}
                  >
                    {adapter.type === 'Wi-Fi' ? (
                      <Wifi size={12} className={isSelected ? 'text-primary-foreground' : 'text-primary'} />
                    ) : isVirtual ? (
                      <Layers size={12} className={isSelected ? 'text-primary-foreground' : 'text-amber-500'} />
                    ) : (
                      <Network size={12} className={isSelected ? 'text-primary-foreground' : 'text-primary'} />
                    )}
                    <span className="truncate max-w-[110px]" title={adapter.name}>{adapter.name}</span>
                    {adapter.status === 'Connected' ? (
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} title={t('connected')} />
                    ) : adapter.status === 'Disabled' || !adapter.isEnabled ? (
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-white' : 'bg-red-500'}`} title={t('statusDisabled')} />
                    ) : (
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-white/60' : 'bg-zinc-400'}`} title={t('disconnected')} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {displayAdapters.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground bg-card border border-border rounded-lg">
              {t('noAdapters')}
            </div>
          ) : selectedAdapter && (
            <AdapterItem 
              adapter={selectedAdapter} 
              onUpdate={updateAdapter} 
              onSave={() => setConfirmAction({ type: 'network', id: selectedAdapter.id })}
              onRequestToggleEnabled={(id, targetState, adapterName) => setConfirmAction({
                type: 'toggle-adapter',
                id,
                targetState,
                adapterName
              })}
              isSaving={isSaving}
            />
          )}
        </section>

        {adapters.length > 0 && (
          <>
            <QuickDnsSettings selectedAdapterId={selectedAdapterId} onApply={applyDns} />
            
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button 
                onClick={handleOpenCmd}
                className="card p-3 flex items-center justify-center gap-2 hover:bg-[var(--card-hover)] transition-colors border border-[var(--border)]"
              >
                <Terminal size={16} className="text-primary" />
                <span className="text-xs font-bold">{t('openCmd')}</span>
              </button>
              <button 
                onClick={handlePingDns}
                disabled={!selectedAdapter?.primaryDns || isPinging}
                className="card p-3 flex items-center justify-center gap-1.5 hover:bg-[var(--card-hover)] transition-colors border border-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed select-none"
                title={!selectedAdapter?.primaryDns ? t('noPrimaryDns') : 'IpNameCore 네이티브 ICMP Echo Ping 실행'}
              >
                {isPinging ? (
                  <Activity size={15} className="text-primary animate-spin" />
                ) : pingStatus ? (
                  <Zap size={15} className="text-amber-500 animate-pulse" />
                ) : (
                  <Activity size={15} className="text-primary" />
                )}
                <span className="text-xs font-bold truncate">
                  {pingStatus ? `Ping: ${pingStatus}` : t('pingPrimaryDns')}
                </span>
              </button>
            </div>
          </>
        )}
      </main>

      <Toast show={toast.show} message={toast.message} type={toast.type} />
      <Footer onCheckUpdate={() => checkUpdate(true)} />
      
      <ConfirmModal 
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction?.type === 'system') {
            saveSystemInfo();
          } else if (confirmAction?.type === 'network' && confirmAction.id) {
            saveNetworkConfig(confirmAction.id);
          } else if (confirmAction?.type === 'reboot') {
            rebootSystem();
          } else if (confirmAction?.type === 'toggle-adapter' && confirmAction.id) {
            toggleAdapterEnabled(confirmAction.id, confirmAction.targetState);
          }
        }}
        title={
          confirmAction?.type === 'reboot' ? t('rebootSystem') : 
          confirmAction?.type === 'system' ? t('confirmSystemApplyTitle') : 
          confirmAction?.type === 'toggle-adapter' ? (
            confirmAction.targetState ? t('confirmEnableLanCardTitle') : t('confirmDisableLanCardTitle')
          ) :
          t('confirmNetworkApplyTitle')
        }
        description={
          confirmAction?.type === 'reboot' ? t('rebootConfirm') : 
          confirmAction?.type === 'system' ? t('confirmSystemApplyDesc') : 
          confirmAction?.type === 'toggle-adapter' ? (
            `[${confirmAction.adapterName}] ` + (confirmAction.targetState ? t('confirmEnableLanCardDesc') : t('confirmDisableLanCardDesc'))
          ) :
          t('confirmNetworkApplyDesc')
        }
        confirmText={
          confirmAction?.type === 'toggle-adapter' ? (
            confirmAction.targetState ? t('enableLanCard') : t('disableLanCard')
          ) : undefined
        }
        isDestructive={
          confirmAction?.type === 'reboot' ||
          (confirmAction?.type === 'toggle-adapter' && !confirmAction.targetState)
        }
      />

      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => dismissUpdate(false)}
        currentVersion={currentVersion}
        latestRelease={latestRelease}
        updateAvailable={updateAvailable}
        isChecking={isCheckingUpdate}
        statusMessage={updateStatusMessage}
        repoUrl={repoUrl}
        onSkipVersion={() => dismissUpdate(true)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
