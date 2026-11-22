# AhBiYout IpName2

<div align="center">

![IpName2 Logo](app-icon.png)

### Windows 系统名称及高性能网络适配器与多 IP 管理桌面实用工具 (v1.13.7)

🌍 **语言**: [🇰🇷 한국어](README.md) | [🇺🇸 English](README_EN.md) | [🇯🇵 日本語](README_JA.md) | [🇨🇳 中文](README_ZH.md)

[![Version](https://img.shields.io/badge/Version-v1.13.7-0284c7.svg)](docs/PATCH_NOTES.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](docs/LICENSE_NOTICE.md)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2.11-orange.svg)](https://tauri.app/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)](https://www.typescriptlang.org/)
[![C99 Native DLL](https://img.shields.io/badge/C--ABI-ipname__core.dll-green.svg)](docs/DLL_SPECIFICATION.md)

**开发者**: AhBiYout ([GitHub](https://github.com/AhBiYout-all)) | **官方博客**: [AhBiYout Vibe](https://ahbiyoutvibe.blogspot.com/) | **所属单位**: [(주)청운정보시스템 ( cisnet.co.kr )](https://cisnet.co.kr)

</div>

---

## 📌 项目概述 (Overview)

**AhBiYout IpName2** 是一款专为 Windows 10 和 Windows 11（64位）设计的精简高效桌面应用程序，用于直观管理计算机名、工作组（Workgroup）以及网络适配器的 IP、子网掩码、网关和 DNS 设置。

结合了 **SWR 即时状态还原**、**Rust + Win32 原生并行轮询** 以及 **纯 C99 原生 DLL (`ipname_core.dll`)**，可实现零延迟无感启动，并同时支持便携运行和官方 Inno Setup 安装程序 (`IpName2_v1.13.7_Setup.exe`) 分发。

### 核心功能 (Key Features)

1. **超高速 SWR 启动与单屏自适应 UI (`650x920`)**:
   - 启动即显上一次快照状态，并在 `<50ms` 内通过 Win32 API 实时同步，配合后台 PowerShell 增强，决不阻塞前端交互。
   - 提供从页眉到底部脚注无需纵向滚动的单屏视图（`650x920`，最小 `650x760`），并防止 Tauri 外部链接重复打开（`ExternalLink`）。
2. **一键修改计算机名（NetBIOS）与工作组**:
   - 内置标准命名规则验证、重启提醒徽章及 UAC 安全重启支持。
3. **单网卡多 IP（Secondary IPs）绑定与主 IP 自动优先排序**:
   - 自动将默认网关与 DHCP IPv4 识别并排序列为主要 IP（Primary）。
   - 支持多辅 IP 的添加与删除、`netsh` 顺序绑定及子网掩码自适应轮询验证。
4. **内置纯原创原生 DLL (`ipname_core.dll`)**:
   - **Layer-2 ARP (`SendARP`) IP 冲突检测**：穿透防火墙环境精准捕获实际占用 MAC，利用本机 MAC 白名单从源头上消除误报。
   - **进程内高速 ICMP Ping (`IcmpSendEcho`)**：无黑窗弹出，即时测量 RTT (ms) 与 TTL。
   - **非阻塞 TCP 端口健康检查与 32 位子网掩码按位计算器**（有效拦截不连续掩码）。
5. **物理与虚拟网络适配器精准分类**:
   - 完美依据 NDIS 内核标志与 IEEE 6-Hex MAC OUI（Hyper-V、VMware、VirtualBox、QEMU、Xen、Parallels、WSL/VPN）自动分离物理、虚拟与 Wi-Fi 标签页。
6. **实时公网 IP 与运营商（ISP）查询**:
   - 单行实时展示外部公网 IPv4/IPv6、运营商与地理位置，支持一键复制。
7. **网卡电源一键控制与 GitHub Releases 实时自动更新**:
   - 通过管理员权限（UAC）安全启用或禁用网卡，并具备防重入锁（`isSavingRef`）。
   - 提供后台与手动更新检查，支持通过 `UpdateModal` 直接获取安装包下载指引。

---

## 🛠️ 技术栈 (Tech Stack)

| 模块 | 技术栈 | 说明 |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 6 | 基于组件的响应式 UI（`650x920` 单屏，最小 `650x760`） |
| **Styling** | Tailwind CSS 4, Lucide React, Motion | Windows 11 Fluent 风格，支持 4 种主题切换（默认/暗黑/翡翠/日落） |
| **Desktop Core** | Rust (Tauri v2.11) | 超轻量原生 IPC（`spawn_blocking`）、Win32 API 包装器及 Shell/Process 插件 |
| **Native Engine** | ISO C99 (`ipname_core.dll`) | Layer-2 ARP 冲突检测、ICMP Ping、TCP 诊断、6-Hex OUI 网卡分类器 |
| **Installer** | Inno Setup 6 | 官方 64 位 Windows 安装程序脚本 (`installer/setup.iss`) |
| **CI/CD & QA** | GitHub Actions (Node 24), `verify-core-files.cjs` | 6 阶段仓库审计（49 个核心文件、敏感信息防泄漏、10 点版本锁步同步）与自动化发布 |

---

## 🚀 快速上手 (Getting Started)

### 前置要求 (Prerequisites)
- [Node.js](https://nodejs.org/) (推荐 v22 LTS)
- [Rust](https://www.rust-lang.org/) (用于 Tauri v2 构建，1.77.2+)
- [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (用于 C DLL 与 Win32 原生集成)

### 本地开发与完整性审计
```bash
# 安装依赖
npm install

# 运行 TypeScript 静态检查与 6 阶段仓库完整性审计
npm run lint
node scripts/github/verify-core-files.cjs --clean

# 启动前端开发服务器（默认端口：3030）
npm run dev

# 在开发模式下运行 Tauri 桌面应用
npm run tauri dev
```

### 生产打包与构建
```cmd
:: 运行 Windows 一键综合构建脚本（C DLL 编译 + 前端构建 + Tauri 打包）
build.bat
```

---

## 📚 详细文档 (Documentation)

项目详细架构、GitHub 运营和博客发布指南已系统整理在 [`/docs`](docs/README.md) 目录中：

- **[GitHub 运营与发布指南 (GITHUB_GUIDE.md)](docs/GITHUB_GUIDE.md)**: 6 阶段仓库审计、自动推送、GitHub Actions Node 24 CI/CD 与发布模板。
- **[Google Blogger 官方发布指南 (BLOGGER_POST.md)](docs/BLOGGER_POST.md)**: 适用于编写模式（富文本）与 HTML 编辑模式的最新 v1.13.7 发布介绍文。
- **[开发规范说明书 (DEVELOPMENT.md)](docs/DEVELOPMENT.md)**: 完整开发环境、构建步骤、窗口尺寸（`650x920`）、端口（`3030`）及流水线指南。
- **[系统架构设计 (ARCHITECTURE.md)](docs/ARCHITECTURE.md)**: 多层架构、Win32/Rust IPC 结构、SWR 启动与网络控制流。
- **[纯原创原生 DLL 规范 (DLL_SPECIFICATION.md)](docs/DLL_SPECIFICATION.md)**: `ipname_core.dll` C-ABI 接口规范与系统 DLL 审计报告。
- **[补丁日志 (PATCH_NOTES.md)](docs/PATCH_NOTES.md)**: 各版本详细变更说明与深度审计缺陷解决记录。
- **[技术路线图 (ROADMAP.md)](docs/ROADMAP.md)**: 项目里程碑与验证历史记录（`ROADMAP-001` ~ `ROADMAP-023`）。
- **[版本管理策略 (VERSIONING_POLICY.md)](docs/VERSIONING_POLICY.md)**: 语义化版本控制（Semantic Versioning）与三重锁步（Triple Lockstep）规则。
- **[AI 标准升级作业指导书 (UPDATE_WORK_INSTRUCTION.md)](docs/UPDATE_WORK_INSTRUCTION.md)**: 用于升级其他 IP Name 系列应用的集成 AI 提示词模板。
- **[开源许可证声明 (LICENSE_NOTICE.md)](docs/LICENSE_NOTICE.md)**: 开源许可证说明及 MIT License 全文。

---

## 📄 许可证 (License)

本项目采用 MIT 许可证开源 - 详情请参阅 [LICENSE](LICENSE) 文件和 [LICENSE_NOTICE.md](docs/LICENSE_NOTICE.md)。
Copyright (c) 2026 AhBiYout. All rights reserved.
