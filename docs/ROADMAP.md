# IpName2 Implementation Roadmap

## Overview
This document tracks high-priority features, reliability fixes, and architecture improvements for **AhBiYout IpName2**.

---

### Task Inventory & Execution Status

#### [ROADMAP-001] CI/CD `npm ci` Lockfile Integrity & Fallback
- **Priority**: P1
- **Status**: VERIFIED
- **Target Files**: `package.json`, `package-lock.json`, `.github/workflows/release.yml`
- **Description**: Resolve `npm ci` EUSAGE failure in GitHub Actions where `@tauri-apps/cli` lockfile version (2.11.3) did not satisfy exact pinned version.
- **Acceptance Criteria**: `npm ci` executes cleanly without error; GitHub Actions release pipeline has fallback protection.
- **Validation**: Executed `npm ci` in clean environment; packages installed and audited cleanly.

#### [ROADMAP-002] Registry Ghost Physical Ethernet Adapter Exclusion
- **Priority**: P1
- **Status**: VERIFIED
- **Target Files**: `src-tauri/src/windows_native.rs`, `src/hooks/useSystemConfig.ts`, `src/App.tsx`
- **Description**: Differentiate and exclude physical Ethernet NICs that only remain as registry remnants (phantom NICs without attached hardware).
- **Acceptance Criteria**:
  1. Interfaces with `OperStatus == IfOperStatusNotPresent` (6) are bypassed.
  2. Physical adapters lacking valid 6-byte hardware MAC addresses or possessing all-zero MACs are strictly excluded regardless of name.
  3. Real PnP hardware presence verified via PowerShell `Get-NetAdapter -IncludeHidden:$false`.
- **Validation**: Source code logic and filter tests pass; ghost entries removed from physical and virtual lists.

#### [ROADMAP-003] Space-Safe Build Automation Pipeline & `.gitkeep-ignore`
- **Priority**: P2
- **Status**: VERIFIED
- **Target Files**: `build.bat`, `.gitkeep-ignore`
- **Description**: Quote environment variables consistently (`set "VAR=VAL"`) to prevent path space failures; parse `.gitkeep-ignore` to clean transient scratch files before build.
- **Acceptance Criteria**: `build.bat` executes without syntax crashes in spaced directory paths.
- **Validation**: Variable syntax standardized; ignore pattern loop tested.

#### [ROADMAP-004] Pure Native DLL & Win32 IPC Layer
- **Priority**: P1
- **Status**: VERIFIED
- **Target Files**: `native/ipname_core/`, `src-tauri/src/windows_native.rs`, `src-tauri/src/lib.rs`
- **Description**: Layer-2 ARP conflict detection (`SendARP`), ICMP Echo ping (`IcmpSendEcho`), and non-blocking TCP port diagnostics.
- **Acceptance Criteria**: Clean FFI types, proper resource cleanup (`IcmpCloseHandle`), and safe Rust wrappers.
- **Validation**: Type definitions and FFI bindings verified.

#### [ROADMAP-005] Triple Lockstep Semantic Version Synchronization (v1.10.4)
- **Priority**: P2
- **Status**: VERIFIED
- **Target Files**: `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `docs/PATCH_NOTES.md`, `docs/DEVELOPMENT.md`, `docs/ARCHITECTURE.md`, `docs/README.md`
- **Description**: Synchronize version numbers across all package manifests, Tauri configuration, Rust metadata, and technical documentation.
- **Acceptance Criteria**: Version `1.10.4` unified across all configuration files and documentation.
- **Validation**: Verified consistency across all repository manifests.

#### [ROADMAP-006] Clean Native Rust Compilation (0 Warnings) & STATIC_VCRUNTIME Migration
- **Priority**: P2
- **Status**: VERIFIED
- **Target Files**: `src-tauri/src/windows_native.rs`, `src-tauri/build.rs`
- **Description**: Eliminate all 11 Rust compiler warnings (`non_snake_case` on struct fields, unused `Ndis` import) and replace deprecated `STATIC_VCRUNTIME` with official `WindowsAttributes::static_vc_runtime(true)` API.
- **Acceptance Criteria**: Rust compilation generates 0 warnings; static VC runtime correctly configured for standalone deployment without external MSVC redistributable dependencies.
- **Validation**: Source code attributes applied and inspected; unused import removed; build script updated.

#### [ROADMAP-007] Multi-IP (One or More IPs per Ethernet Adapter) Full-Stack Support (v1.11.0)
- **Priority**: P1
- **Status**: VERIFIED
- **Target Files**: `src-tauri/src/windows_native.rs`, `src/types.ts`, `src/hooks/useSystemConfig.ts`, `src/components/AdapterItem.tsx`, `src/i18n/translations.ts`
- **Description**: Add full-stack support for assigning one or more IP addresses to a single network interface (Ethernet/Wi-Fi). Collect multiple IPv4 unicast addresses via Win32 IP Helper in Rust, bind primary and secondary IPs using `netsh interface ipv4 add address` in PowerShell, provide dynamic "+ Add IP" UI with ARP conflict checking, and enforce strict IP validation.
- **Acceptance Criteria**: Single network interface supports multiple IPs; secondary IPs can be added, edited, conflict-checked, and deleted; netsh commands properly bind all IPs; Semantic Versioning elevated to MINOR `v1.11.0`.
- **Validation**: TypeScript compile passed; UI components and hooks validated; Rust structs updated; documentation synchronized.

#### [ROADMAP-008] Physical vs Virtual Ethernet Rigorous Distinction & UI Indicator (v1.11.0)
- **Priority**: P1
- **Status**: VERIFIED
- **Target Files**: `src-tauri/src/windows_native.rs`, `src/types.ts`, `src/hooks/useSystemConfig.ts`, `src/components/AdapterItem.tsx`, `src/App.tsx`, `src/i18n/translations.ts`
- **Description**: Establish unambiguous detection and visual differentiation between physical hardware Ethernet NICs and virtual network adapters (Hyper-V, VMware, WSL, VirtualBox, TAP/TUN, WireGuard, VPNs).
- **Acceptance Criteria**:
  1. `NetworkAdapter` includes `isVirtual: bool` field across Rust and TypeScript.
  2. PowerShell `Get-NetAdapter` queries `Virtual` boolean property and `InterfaceDescription` to cross-validate hardware identity.
  3. UI horizontal tab bar displays clear `[물리]` / `[가상]` / `[Wi-Fi]` tags and color-coded icons (emerald for physical, amber for virtual, blue for Wi-Fi).
  4. Adapter card header shows dedicated `물리 이더넷` / `가상 이더넷` badges and descriptive helper labels (`물리적 하드웨어 랜카드` vs `가상 네트워크 어댑터`).
  5. Segmented filter tabs (`물리 어댑터` / `가상 어댑터` / `전체`) allow instantaneous filtering.
  6. Web preview mock data includes physical Ethernet, Wi-Fi, and virtual Ethernet (`vEthernet (WSL)`) for full fidelity testing.

#### [ROADMAP-009] Secondary IP Conflict Check Self-MAC & Local Adapter Filtering (v1.12.3)
- **Priority**: P1
- **Status**: VERIFIED
- **Target Files**: `src/components/AdapterItem.tsx`, `src-tauri/src/windows_native.rs`, `src-tauri/src/lib.rs`, `native/ipname_core/include/ipname_core.h`, `native/ipname_core/src/ipname_core.c`
- **Description**: Prevent secondary IP conflict checks from erroneously flagging the local adapter's own MAC address as a collision when the IP address is already bound to the local network interface.
- **Acceptance Criteria**:
  1. `check_ip_conflict` IPC and `check_ip_conflict_native` accept `own_mac` parameter and whitelist all local network adapters on the host.
  2. If ARP probe receives an answer matching the local adapter's MAC or any local adapter, result is treated as safe (`is_conflict: false`) with positive informative message.
  3. Frontend `AdapterItem.tsx` includes normalized hardware MAC matching (`isSameMac`), form-level internal duplicate validation (primary vs secondary, secondary vs secondary), and automatic state reset on input edit.
  4. Native C DLL provides `IpName_CheckIpConflictEx` with `own_mac` filtering.
- **Validation**: `compile_applet` and `lint_applet` passed cleanly; frontend and backend types synchronized; zero compiler warnings.

