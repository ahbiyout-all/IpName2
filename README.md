# AhBiYout IpName2

<div align="center">

![IpName2 Logo](app-icon.png)

### Windows 시스템 이름 및 고성능 네트워크 어댑터·다중 IP 관리 데스크톱 유틸리티 (v1.13.12)

🌍 **언어**: [🇰🇷 한국어](README.md) | [🇺🇸 English](README_EN.md) | [🇯🇵 日本語](README_JA.md) | [🇨🇳 中文](README_ZH.md)

[![Version](https://img.shields.io/badge/Version-v1.13.12-0284c7.svg)](docs/PATCH_NOTES.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](docs/LICENSE_NOTICE.md)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2.11-orange.svg)](https://tauri.app/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)](https://www.typescriptlang.org/)
[![C99 Native DLL](https://img.shields.io/badge/C--ABI-ipname__core.dll-green.svg)](docs/DLL_SPECIFICATION.md)

**제작자**: AhBiYout ([GitHub](https://github.com/AhBiYout-all)) | **공식 블로그**: [AhBiYout Vibe](https://ahbiyoutvibe.blogspot.com/) | **소속**: [(주)청운정보시스템 ( cisnet.co.kr )](https://cisnet.co.kr)

</div>

---

## 📌 프로젝트 소개 (Overview)

**AhBiYout IpName2**는 Windows 10 및 Windows 11(64비트) 환경에서 컴퓨터 이름, 작업 그룹(Workgroup), 네트워크 어댑터 IP/서브넷/게이트웨이/DNS 설정을 직관적으로 관리할 수 있는 고성능 데스크톱 애플리케이션입니다.

**SWR 즉시 화면 복원**과 **Rust + Win32 네이티브 병렬 조회**, **순수 C99 네이티브 DLL(`ipname_core.dll`)**을 결합해 지연 없이 기동하며, 무설치 포터블(`IpName2_v1.13.12_Portable.exe` / `_Portable.zip`)과 Inno Setup 정식 인스톨러(`IpName2_v1.13.12_Setup.exe`) 배포를 모두 지원합니다.

### 핵심 기능 (Key Features)

1. **초고속 SWR 부팅 & 단일 화면 전체 표시 UI (`650x920`)**:
   - 실행 즉시 직전 스냅샷을 표시하고 `<50ms` 이내에 Win32 API로 실시간 동기화하며, 백그라운드 PowerShell 보강으로 UI 조작을 차단하지 않습니다.
   - 헤더부터 하단 푸터까지 세로 스크롤 없이 한눈에 보이는 `650x920`(최소 `650x760`) 뷰포트와 Tauri 외부 링크 중복 열림 차단(`ExternalLink`)을 제공합니다.
2. **컴퓨터 이름(NetBIOS) 및 작업 그룹 원클릭 변경**:
   - 표준 규칙 검증, 재부팅 예정 배지 안내 및 UAC 안전 재부팅 지원.
3. **단일 어댑터 내 다중 IP (Secondary IPs) 바인딩 및 정렬**:
   - 기본 게이트웨이·DHCP 연결 IPv4를 대표 IP(Primary)로 자동 우선 정렬.
   - 복수의 보조 IP 추가/삭제, `netsh` 순차 바인딩 및 서브넷 마스크 적응형 폴링 검증.
4. **순수 창작 네이티브 DLL (`ipname_core.dll`) 탑재**:
   - **Layer-2 ARP (`SendARP`) IP 충돌 검사**: 방화벽 차단 환경에서도 실제 점유 MAC을 검출하며, 본인 MAC 화이트리스트로 자가 충돌 오탐을 원천 차단.
   - **인프로세스 고속 ICMP Ping (`IcmpSendEcho`)**: CMD 팝업 없이 RTT(ms) 및 TTL 즉시 측정.
   - **넌블로킹 TCP 포트 헬스체크 & 32비트 서브넷 마스크 비트 연산기** (불연속 마스크 차단).
5. **물리 vs 가상 네트워크 어댑터 정밀 분류**:
   - NDIS 커널 플래그 + IEEE 6-Hex MAC OUI(Hyper-V, VMware, VirtualBox, QEMU, Xen, Parallels, WSL/VPN) 기반 물리/가상/Wi-Fi 탭 완벽 분리.
6. **실시간 공인 IP (Real IP) 및 통신사(ISP) 조회**:
   - 외부 공인 IPv4/IPv6, 통신사(ISP), 위치 정보를 초슬림 단일 행 바로 실시간 표시 및 원클릭 복사.
7. **랜카드 전원 원클릭 제어 & GitHub Releases 실시간 자동 업데이트**:
   - 관리자 권한(UAC) 안전 승급을 통한 어댑터 사용/사용 안 함 전환과 동기 재진입 잠금(`isSavingRef`) 지원.
   - 백그라운드·수동 업데이트 확인 및 `UpdateModal` 직접 다운로드 안내.
8. **사용자 언어 자동 감지(KO/EN/JA/ZH) & 동적 PowerShell 스크립트 주석 생성**:
   - 실행 시 브라우저/OS 로캘을 자동 감지해 한국어·영어·일본어·중국어 4개 국어를 즉시 적용하고, 헤더/푸터 버튼으로 수동 전환 가능.
   - 모든 UI 레이블, 진단/업데이트 모달과 함께 실행되는 PowerShell 설정 스크립트 주석도 선택된 앱 언어에 맞춰 실시간 동적 생성.

---

## 🛠️ 기술 스택 (Tech Stack)

| 구분 | 기술 스택 | 설명 |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 6 | 컴포넌트 기반 반응형 UI (`650x920` 단일 화면, 최소 `650x760`) |
| **Styling** | Tailwind CSS 4, Lucide React, Motion | Windows 11 Fluent 스타일 4종 테마 (기본/다크/에메랄드/선셋) |
| **Desktop Core** | Rust (Tauri v2.11) | 초경량 네이티브 IPC (`spawn_blocking`), Win32 API 래퍼 및 Shell/Process 플러그인 |
| **Native Engine** | ISO C99 (`ipname_core.dll`) | Layer-2 ARP 충돌 감지, ICMP Ping, TCP 진단, 6-Hex OUI 어댑터 분류기 |
| **Installer & Portable** | Inno Setup 6 & Portable Bundle | 64비트 Windows 정식 인스톨러(`_Setup.exe`), 단일 포터블(`_Portable.exe`), DLL 포함 압축본(`_Portable.zip`) |
| **CI/CD & QA** | GitHub Actions (Node 24), `verify-core-files.cjs` | 6단계 저장소 감사(52개 핵심 파일·시크릿·10지점 버전 동기화) 및 설치본/포터블 자동 릴리스 |

---

## 🚀 빠른 시작 (Getting Started)

### 사전 요구사항 (Prerequisites)
- [Node.js](https://nodejs.org/) (v22 LTS 권장)
- [Rust](https://www.rust-lang.org/) (Tauri v2 빌드용, 1.77.2 이상)
- [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (C DLL 및 Win32 Native 연동)

### 로컬 개발 및 무결성 검증
```bash
# 종속성 설치
npm install

# TypeScript 정적 검사 및 6단계 저장소 무결성 감사
npm run lint
node scripts/github/verify-core-files.cjs --clean

# 프론트엔드 개발 서버 시작 (기본 포트: 3030)
npm run dev

# Tauri 데스크톱 애플리케이션 개발 모드 실행
npm run tauri dev
```

### 프로덕션 빌드 및 패키징
```cmd
:: Windows 원클릭 종합 빌드 스크립트 실행 (C DLL 컴파일 + 프론트엔드 빌드 + Tauri 빌드)
build.bat
```

---

## 📚 상세 기술 문서 (Documentation)

프로젝트의 상세 아키텍처, GitHub 운영 및 블로그 배포 문서는 [`/docs`](docs/README.md) 디렉터리에 체계적으로 정리되어 있습니다:

- **[GitHub 운영 및 릴리스 가이드 (GITHUB_GUIDE.md)](docs/GITHUB_GUIDE.md)**: 저장소 6단계 감사, 자동 푸시, GitHub Actions Node 24 CI/CD 및 릴리스 템플릿.
- **[구글 블로거 공식 포스팅 가이드 (BLOGGER_POST.md)](docs/BLOGGER_POST.md)**: 작성 모드(서식 있는 텍스트) 및 HTML 편집 모드용 최신 v1.13.12 배포 소개 글.
- **[개발 명세서 (DEVELOPMENT.md)](docs/DEVELOPMENT.md)**: 전체 개발 환경, 빌드 절차, 창 규격(`650x920`), 포트(`3030`), 파이프라인 안내.
- **[시스템 아키텍처 (ARCHITECTURE.md)](docs/ARCHITECTURE.md)**: 다계층 아키텍처, Win32/Rust IPC 구조, SWR 부팅 및 네트워크 제어 흐름.
- **[순수 창작 DLL 명세서 (DLL_SPECIFICATION.md)](docs/DLL_SPECIFICATION.md)**: `ipname_core.dll` C-ABI 인터페이스 명세 및 시스템 DLL 감사 보고.
- **[패치 노트 (PATCH_NOTES.md)](docs/PATCH_NOTES.md)**: 버전별 상세 변경 내역 및 심층 감사 결함 해결 기록.
- **[기술 로드맵 (ROADMAP.md)](docs/ROADMAP.md)**: 프로젝트 마일스톤 및 검증 완료 이력 (`ROADMAP-001` ~ `ROADMAP-028`).
- **[버전 관리 정책 (VERSIONING_POLICY.md)](docs/VERSIONING_POLICY.md)**: Semantic Versioning 및 삼중 동기화(Triple Lockstep) 규칙.
- **[AI 표준 업그레이드 작업 지시서 (UPDATE_WORK_INSTRUCTION.md)](docs/UPDATE_WORK_INSTRUCTION.md)**: 타 IP Name 앱 업그레이드용 통합 AI 프롬프트.
- **[라이선스 고지사항 (LICENSE_NOTICE.md)](docs/LICENSE_NOTICE.md)**: 오픈소스 라이선스 고지 및 MIT License 전문.

---

## 📄 라이선스 (License)

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file and [LICENSE_NOTICE.md](docs/LICENSE_NOTICE.md) for details.
Copyright (c) 2026 AhBiYout. All rights reserved.
