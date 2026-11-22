# AhBiYout IpName2

<div align="center">

![IpName2 Logo](app-icon.png)

### Windows System Name & High-Performance Network Adapter / Multi-IP Management Desktop Utility (v1.13.9)

🌍 **Languages**: [🇰🇷 한국어](README.md) | [🇺🇸 English](README_EN.md) | [🇯🇵 日本語](README_JA.md) | [🇨🇳 中文](README_ZH.md)

[![Version](https://img.shields.io/badge/Version-v1.13.9-0284c7.svg)](docs/PATCH_NOTES.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](docs/LICENSE_NOTICE.md)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2.11-orange.svg)](https://tauri.app/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)](https://www.typescriptlang.org/)
[![C99 Native DLL](https://img.shields.io/badge/C--ABI-ipname__core.dll-green.svg)](docs/DLL_SPECIFICATION.md)

**Creator**: AhBiYout ([GitHub](https://github.com/AhBiYout-all)) | **Official Blog**: [AhBiYout Vibe](https://ahbiyoutvibe.blogspot.com/) | **Affiliation**: [(주)청운정보시스템 ( cisnet.co.kr )](https://cisnet.co.kr)

</div>

---

## 📌 Overview

**AhBiYout IpName2** is a high-performance desktop application designed for Windows 10 and Windows 11 (64-bit) to intuitively manage computer names, workgroups, and network adapter IP, subnet mask, gateway, and DNS settings.

Combining **SWR instant state restoration**, **Rust + Win32 native parallel polling**, and a **pure C99 native DLL (`ipname_core.dll`)**, it starts with zero lag and supports both portable execution and official Inno Setup installer (`IpName2_v1.13.9_Setup.exe`) distribution.

### Key Features

1. **Ultra-Fast SWR Boot & Single-Screen UI (`650x920`)**:
   - Displays previous snapshots instantly upon startup and synchronizes in real-time via Win32 API within `<50ms`, accompanied by background PowerShell reinforcement without blocking UI interactions.
   - Provides a single-screen layout (`650x920`, min `650x760`) fitting everything from header to footer without vertical scrolling, along with Tauri external link duplicate launch prevention (`ExternalLink`).
2. **One-Click Computer Name (NetBIOS) & Workgroup Change**:
   - Standard rule validation, reboot reminder badges, and UAC-secured safe reboot support.
3. **Secondary IPs (Multi-IP) Binding & Primary Sorting**:
   - Automatically prioritizes default gateway and DHCP IPv4 as the primary address.
   - Add/remove multiple secondary IPs with sequential `netsh` binding and subnet mask adaptive polling verification.
4. **Pure Native DLL (`ipname_core.dll`) Integration**:
   - **Layer-2 ARP (`SendARP`) IP Conflict Detection**: Detects actual occupying MAC addresses even behind firewalls, preventing self-conflict false positives with own MAC whitelist.
   - **In-Process High-Speed ICMP Ping (`IcmpSendEcho`)**: Instant RTT (ms) and TTL measurement without CMD popups.
   - **Non-Blocking TCP Port Health Check & 32-bit Subnet Mask Bitwise Calculator** (blocking discontinuous masks).
5. **Physical vs. Virtual Network Adapter Precision Classification**:
   - Perfect separation of physical, virtual, and Wi-Fi tabs based on NDIS kernel flags and IEEE 6-Hex MAC OUI (Hyper-V, VMware, VirtualBox, QEMU, Xen, Parallels, WSL/VPN).
6. **Real-Time Public IP & ISP Lookup**:
   - Instant single-row real-time display and one-click copy of external public IPv4/IPv6, ISP, and location details.
7. **Network Adapter Power Control & GitHub Releases Real-Time Auto-Update**:
   - Enable/disable adapters via UAC administrator privilege elevation with re-entry lock (`isSavingRef`).
   - Background and manual update checks with direct download guidance via `UpdateModal`.
8. **Automatic User Language Detection (KO/EN/JA/ZH) & Dynamic Localized Script Comments**:
   - Automatically detects OS/browser locale on launch to switch seamlessly among Korean, English, Japanese, and Simplified Chinese, with instant manual toggle from the header or footer.
   - Dynamically localizes all UI labels, diagnostic/update modals, and generated PowerShell execution script comments to match the active language.

---

## 🛠️ Tech Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 6 | Component-based responsive UI (`650x920` single screen, min `650x760`) |
| **Styling** | Tailwind CSS 4, Lucide React, Motion | Windows 11 Fluent styling with 4 themes (Default/Dark/Emerald/Sunset) |
| **Desktop Core** | Rust (Tauri v2.11) | Lightweight native IPC (`spawn_blocking`), Win32 API wrappers, and Shell/Process plugins |
| **Native Engine** | ISO C99 (`ipname_core.dll`) | Layer-2 ARP conflict detection, ICMP ping, TCP diagnostics, 6-Hex OUI adapter classifier |
| **Installer** | Inno Setup 6 | Official 64-bit Windows installer (`installer/setup.iss`) |
| **CI/CD & QA** | GitHub Actions (Node 24), `verify-core-files.cjs` | 6-stage repository audit (52 core files, secrets, 10-point version lockstep) & automated release |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v22 LTS recommended)
- [Rust](https://www.rust-lang.org/) (for Tauri v2 builds, 1.77.2+)
- [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (for C DLL and Win32 Native integration)

### Local Development & Integrity Verification
```bash
# Install dependencies
npm install

# TypeScript type check & 6-stage repository integrity audit
npm run lint
node scripts/github/verify-core-files.cjs --clean

# Start frontend dev server (Default port: 3030)
npm run dev

# Run Tauri desktop application in dev mode
npm run tauri dev
```

### Production Build & Packaging
```cmd
:: Run Windows one-click comprehensive build script (C DLL compilation + Frontend build + Tauri build)
build.bat
```

---

## 📚 Documentation

Detailed project architecture, GitHub operations, and blog publishing guides are systematically organized in the [`/docs`](docs/README.md) directory:

- **[GitHub Operations & Release Guide (GITHUB_GUIDE.md)](docs/GITHUB_GUIDE.md)**: 6-stage repo audit, auto-push, GitHub Actions Node 24 CI/CD, and release templates.
- **[Google Blogger Official Posting Guide (BLOGGER_POST.md)](docs/BLOGGER_POST.md)**: Latest v1.13.9 release introduction for Compose (Rich Text) and HTML editing modes.
- **[Development Specification (DEVELOPMENT.md)](docs/DEVELOPMENT.md)**: Complete development environment, build procedures, window dimensions (`650x920`), port (`3030`), and pipeline guide.
- **[System Architecture (ARCHITECTURE.md)](docs/ARCHITECTURE.md)**: Multi-layer architecture, Win32/Rust IPC structure, SWR boot, and network control flows.
- **[Pure Native DLL Specification (DLL_SPECIFICATION.md)](docs/DLL_SPECIFICATION.md)**: `ipname_core.dll` C-ABI interface specifications and system DLL audit report.
- **[Patch Notes (PATCH_NOTES.md)](docs/PATCH_NOTES.md)**: Detailed version changelogs and in-depth audit defect resolution history.
- **[Technical Roadmap (ROADMAP.md)](docs/ROADMAP.md)**: Project milestones and verification history (`ROADMAP-001` ~ `ROADMAP-025`).
- **[Versioning Policy (VERSIONING_POLICY.md)](docs/VERSIONING_POLICY.md)**: Semantic Versioning and Triple Lockstep rules.
- **[AI Standard Upgrade Work Instruction (UPDATE_WORK_INSTRUCTION.md)](docs/UPDATE_WORK_INSTRUCTION.md)**: Integrated AI prompt template for upgrading other IP Name applications.
- **[License Notice (LICENSE_NOTICE.md)](docs/LICENSE_NOTICE.md)**: Open-source license notices and full MIT License text.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file and [LICENSE_NOTICE.md](docs/LICENSE_NOTICE.md) for details.
Copyright (c) 2026 AhBiYout. All rights reserved.
