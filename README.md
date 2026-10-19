# AhBiYout IpName2

<div align="center">

![IpName2 Logo](app-icon.png)

### Windows 시스템 이름 및 고성능 네트워크 어댑터/다중 IP 관리 데스크톱 유틸리티

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](docs/LICENSE_NOTICE.md)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2.11-orange.svg)](https://tauri.app/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)](https://www.typescriptlang.org/)
[![C99 Native DLL](https://img.shields.io/badge/C--ABI-ipname__core.dll-green.svg)](docs/DLL_SPECIFICATION.md)

**제작자**: AhBiYout ([GitHub](https://github.com/AhBiYout-all)) | **공식 블로그**: [AhBiYout Vibe](https://ahbiyoutvibe.blogspot.com/) | **소속**: [씨아이에스넷(CISNET)](https://cisnet.co.kr)

</div>

---

## 📌 프로젝트 소개 (Overview)

**AhBiYout IpName2**는 Windows 10 및 Windows 11(64비트) 환경에서 컴퓨터 이름, 작업 그룹(Workgroup), 네트워크 어댑터 IP/DNS 설정을 직관적으로 관리할 수 있는 고성능 데스크톱 애플리케이션입니다.

초경량 무설치(Portable) 단독 실행과 Inno Setup 기반 정식 인스톨러 배포를 모두 지원하며, 100% 오프라인 환경에서도 안전하고 신속하게 네트워크 환경을 진단하고 구성할 수 있습니다.

### 핵심 기능 (Key Features)

1. **컴퓨터 이름 및 작업 그룹 원클릭 변경**:
   - 시스템 재부팅 예약 및 즉각 반영 지원.
2. **단일 어댑터 내 다중 IP (Secondary IPs) 바인딩 및 정렬**:
   - 게이트웨이 및 DHCP 연결 IPv4 기본(Primary) 우선순위 강제 정렬.
   - 복수의 정적 보조 IP 추가, 수정, 순차 바인딩.
3. **순수 창작 네이티브 DLL (`ipname_core.dll`) 탑재**:
   - Layer-2 ARP(`SendARP`) 기반 실시간 IP 충돌 검사 및 본인 MAC 오탐(Self-Conflict) 필터링.
   - 인프로세스 고속 ICMP Echo Ping 진단(`IcmpSendEcho`).
   - 넌블로킹 TCP 포트 헬스체크 및 32비트 서브넷 마스크 비트 연산기.
4. **물리 vs 가상 네트워크 어댑터 정밀 분류**:
   - NDIS 커널 스택 및 MAC OUI 대조를 통한 물리/가상/Wi-Fi 어댑터 탭 필터링.
5. **실시간 공인 IP (Real IP) 및 통신사(ISP) 조회**:
   - 외부 네트워크 연결 시 공인 IP와 ISP 정보를 실시간으로 확인.
6. **네트워크 어댑터 전원 원클릭 제어**:
   - 관리자 권한(UAC) 안전 실행을 통한 랜카드 재시작/활성화/비활성화.
7. **실시간 GitHub 릴리스 자동 업데이트**:
   - 새 버전 출시 시 자동 감지 및 원클릭 업데이트 안내.

---

## 🛠️ 기술 스택 (Tech Stack)

| 구분 | 기술 스택 | 설명 |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 6 | 컴포넌트 기반 반응형 UI (650x800 고정 규격) |
| **Styling** | Tailwind CSS 4, Lucide React, Framer Motion | Windows 11 Fluent 스타일 다크/라이트 테마 |
| **Desktop Core** | Rust (Tauri v2.11) | 초경량 네이티브 IPC 및 Win32 API 래퍼 |
| **Native Engine** | ISO C99 (`ipname_core.dll`) | Layer-2 ARP 충돌 감지 및 네트워크 진단 엔진 |
| **Installer** | Inno Setup 6 | 64비트 Windows 정식 인스톨러 (`setup.iss`) |
| **CI/CD** | GitHub Actions | 릴리스 자동 빌드 및 바이너리 패키징 파이프라인 |

---

## 🚀 빠른 시작 (Getting Started)

### 사전 요구사항 (Prerequisites)
- [Node.js](https://nodejs.org/) (v20 LTS 이상 권장)
- [Rust](https://www.rust-lang.org/) (Tauri v2 빌드용, 1.77.2 이상)
- [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (C DLL 및 Win32 Native 연동)

### 로컬 개발 환경 실행
```bash
# 종속성 설치
npm install

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

프로젝트의 상세 아키텍처 및 개발 문서는 [`/docs`](docs/README.md) 디렉터리에 체계적으로 정리되어 있습니다:

- **[개발 명세서 (DEVELOPMENT.md)](docs/DEVELOPMENT.md)**: 전체 개발 환경, 빌드 절차, 포트 규격, 파이프라인 안내.
- **[시스템 아키텍처 (ARCHITECTURE.md)](docs/ARCHITECTURE.md)**: 다계층 아키텍처, Win32/Rust IPC 구조, 네트워크 제어 흐름.
- **[순수 창작 DLL 명세서 (DLL_SPECIFICATION.md)](docs/DLL_SPECIFICATION.md)**: `ipname_core.dll` C-ABI 인터페이스 명세 및 함수 레퍼런스.
- **[버전 관리 정책 (VERSIONING_POLICY.md)](docs/VERSIONING_POLICY.md)**: Semantic Versioning 및 삼중 동기화(Triple Lockstep) 규칙.
- **[패치 노트 (PATCH_NOTES.md)](docs/PATCH_NOTES.md)**: 버전별 상세 변경 내역 및 결함 해결 기록.
- **[라이선스 고지사항 (LICENSE_NOTICE.md)](docs/LICENSE_NOTICE.md)**: 오픈소스 라이선스 고지 및 MIT License 전문.

---

## 📄 라이선스 (License)

This project is licensed under the MIT License - see the [LICENSE_NOTICE.md](docs/LICENSE_NOTICE.md) file for details.
