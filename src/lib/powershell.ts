export const isTauriEnv = () => typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;

export const executePowerShell = async (script: string, requireAdmin: boolean = false) => {
  if (!isTauriEnv()) {
    console.warn("PowerShell execution is only available in Tauri environments.");
    return { stdout: '', stderr: 'Not running in Tauri', code: -1 };
  }

  const { invoke } = await import('@tauri-apps/api/core');
  try {
    const response: any = await invoke('execute_powershell', { script, requireAdmin });
    return response;
  } catch (error: any) {
    console.error("Rust Command Error:", error);
    return { stdout: '', stderr: String(error), code: -1 };
  }
};
