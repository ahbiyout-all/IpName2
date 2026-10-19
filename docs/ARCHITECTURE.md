# IpName2 시스템 아키텍처 (System Architecture)

본 문서는 **AhBiYout IpName2 v1.12.6**의 프론트엔드, 데스크톱 런타임(Tauri v2), Win32 Native C++ 계층, 순수 창작 DLL(`ipname_core.dll`), Inno Setup 인스톨러, GitHub Releases 실시간 업데이트 및 핵심 파일 관리 파이프라인의 전체 소프트웨어 구조를 기술합니다.

---

## 1. 전체 아키텍처 개요 (High-Level Overview)

IpName2는 **초경량 무설치(Portable)** 실행과 **초고속 오프라인 동작**, **실시간 자동 업데이트** 및 **무결성 패키징**을 보장하기 위해 다음과 같은 다계층 구조(Multi-Tier Architecture)로 설계되었습니다:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Presentation Layer (React 19)                │
│   - Windows 11 Fluent Design System (Tailwind CSS, Lucide)      │
│   - Real Public IP & ISP Real-Time Widget (RealIpSection)       │
│   - Segmented Filter [Physical / Virtual / All] Tabs            │
│   - Multi-Adapter Tabs, Multi-IP (Secondary IPs) Manager        │
│   - SubnetMaskSelector, ConfirmModal (Destructive Action Prev.) │
│   - GitHub Releases Live Updater (UpdateModal, useGitHubUpdate) │
└────────────────────────────────┬────────────────────────────────┘
                                 │ IPC (Tauri Invoke)
┌────────────────────────────────▼────────────────────────────────┐
│                   Desktop Core (Rust / Tauri v2)                │
│   - src-tauri/src/lib.rs (IPC Handler & Routing)                │
│   - Single-Instance Lock, Fixed Window Sizing (650x800)         │
│   - Shell Plugin (tauri_plugin_shell), Process Plugin           │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Direct Win32 FFI / C-ABI / Elevated Execution
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│  순수 창작 네이티브 DLL │ │  Win32 Native API 계층  │ │ Elevated PowerShell   │
│ - ipname_core.dll     │ │ - iphlpapi.dll (Get-  │ │ - Enable-NetAdapter   │
│ - SendARP IP 충돌 검사 │ │   AdaptersAddresses)  │ │ - Disable-NetAdapter  │
│ - IcmpSendEcho Ping   │ │ - kernel32.dll (Host) │ │ - New-NetIPAddress    │
│ - 넌블로킹 TCP 포트   │ │ - 32KB 버퍼 3회 재시도│ │ - Set-DnsClientServer │
│ - 32bit Subnet Math   │ │ - NDIS Filter Engine  │ │ - UAC RunAs Execution │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│             Packaging & Distribution Pipeline                   │
│   - Inno Setup Professional (installer/setup.iss)               │
│   - GitHub Actions CI/CD (Node.js 22 LTS, Installer-Only Asset) │
│   - Core Files Validator (scripts/github/verify-core-files.cjs) │
│   - Dynamic Version Git Pusher (git-push.bat)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 주요 모듈 및 파일 구조

### 2.1. 프론트엔드 계층 (`/src`)
* `src/App.tsx`: 최상위 뷰 컨트롤러, 시스템 정보, **리얼 IP(공인 IP) 위젯**, **[물리 어댑터] / [가상 어댑터] / [전체]** 필터링 제어 및 수평 스크롤 어댑터 탭 관리, 안전 확인 모달(`ConfirmModal`) 연동.
* `src/components/RealIpSection.tsx`: 리얼 IP(공인 WAN IP), ISP 통신사, 위치 정보 실시간 표시 위젯.
* `src/hooks/useRealIp.ts`: `ipwho.is` 및 `api.ipify.org` 병렬 비동기 조회와 PowerShell 무정지 폴백 엔진.
* `src/components/AdapterItem.tsx`: 네트워크 어댑터 상세 카드 컴포넌트, 랜카드 전원 제어, [IP 충돌 검사] 배지 및 스마트 IP 동기화 연동.
* `src/components/UpdateModal.tsx`: GitHub Releases 실시간 업데이트 알림 모달 (버전 차이 비교, 직접 다운로드 및 외부 브라우저 런처).
* `src/hooks/useGitHubUpdate.ts`: GitHub REST API 비동기 쿼리 및 Semantic Versioning 비교 엔진.
* `src/components/SubnetMaskSelector.tsx`: `/24`, `/25`, `/26`, `/29`, `/16` 서브넷 마스크 프리셋 오버레이 셀렉터.
* `src/components/ConfirmModal.tsx`: 네트워크 단절 등 파괴적 작업 시 사용자 실수를 방지하는 안전 확인 모달.
* `src/components/QuickDnsSettings.tsx`: KT, SKB, LGU+, Google DNS 원클릭 프리셋 주입 컨트롤.
* `src/hooks/useSystemConfig.ts`: 통합 시스템 상태 머신 (어댑터 목록, IP/DNS, 컴퓨터 이름, 저장/토글 핸들러).

### 2.2. 백엔드 및 Native 계층 (`/src-tauri`)
* `src-tauri/src/lib.rs`: Tauri IPC 커맨드 라우팅 (`get_system_info`, `get_adapters`, `ping_ipv4`, `calculate_subnet`, `check_ip_conflict`, `check_tcp_port`, `classify_ip`).
* `src-tauri/src/windows_native.rs`: Windows Win32 API FFI 바인딩. `GetAdaptersAddresses`를 호출하여 어댑터 상태, IP, MAC, 활성화 여부를 마이크로초 단위로 쿼리.
* `src-tauri/tauri.conf.json`: 고정 창 크기(650x800), 단일 인스턴스 락, NSIS 타깃 번들 설정.

### 2.3. 순수 창작 네이티브 DLL (`/native/ipname_core`)
* `native/ipname_core/include/ipname_core.h`: 순수 C-ABI 헤더. 결과 코드 열거형, 결과 구조체 및 함수 원형 정의.
* `native/ipname_core/src/ipname_core.c`: Win32 Native 소스코드.
  - `IpName_CheckIpConflict`: Layer-2 ARP `SendARP` 브로드캐스트 기반 IP 충돌 탐지.
  - `IpName_PingIpv4`: Windows NDIS ICMP Echo 커널 파일 직접 제어.
  - `IpName_CheckTcpPort`: 넌블로킹 소켓 `select` 기반 포트 응답 시간 계측.
  - `IpName_CalculateSubnet` / `IpName_ClassifyIp`: 32비트 고속 비트마스크 연산기.
* `native/ipname_core/build.bat`: MSVC `cl.exe` 및 MinGW `gcc.exe` 감지 기반 순차 컴파일 스크립트.

### 2.4. 패키징 및 GitHub 관리 파이프라인 (`/installer`, `/.github`, `/scripts`)
* `installer/setup.iss`: Inno Setup 프로페셔널 스크립트 (Unpacked Multi-File, 기존 버전 감지 및 덮어쓰기, 무인 설치, Windows 방화벽 기본명/버전명 듀얼 사전 등록).
* `.github/workflows/release.yml`: Node.js 22 LTS 환경 기반 릴리스 자동화 (Inno Setup 순수 인스톨러 `IpName2_v*_Setup.exe` 파일만 단독 배포 첨부).
* `scripts/github/core-manifest.json`: 28개 빌드 필수 파일 화이트리스트 및 금지 파일 패턴 정의.
* `scripts/github/verify-core-files.cjs`: 작업 트리 실시간 감사 및 스크래치 파일 자동 청소 도구.
* `git-push.bat`: 다단 동적 버전 자동 추출 및 STEP 2.5 사전 무결성 감사 연동 푸시 파이프라인.

---

## 3. 핵심 동작 흐름 (Data & Execution Flow)

### 3.1. 랜카드 사용 / 사용 안 함 제어 흐름
```
[사용자 클릭] ──> [ConfirmModal 경고] ──> [useSystemConfig.ts] ──> [PowerShell UAC]
                                                                        │
[초록/빨강 상태 점 갱신] <── [2.5초 대기 & 자동 재조회] <── [Enable/Disable-NetAdapter]
```

### 3.2. Layer-2 ARP 기반 IP 충돌 감지 흐름
```
[IP 입력 후 검사 클릭] ──(Tauri IPC)──> [lib.rs] ──> [windows_native.rs / DLL]
                                                            │
                                              SendARP(Target_IP, 0)
                                                            │
                            ┌───────────────────────────────┴───────────────────────────────┐
                            ▼                                                               ▼
                   [ARP Reply 수신: 충돌]                                         [Timeout: 사용 가능]
              MAC: "AA:BB:CC:DD:EE:FF"                                      "충돌 없는 안전한 IP"
              경고 배너 및 차단 알림                                         녹색 사용 가능 배지
```

### 3.3. GitHub Releases 실시간 자동 업데이트 흐름
```
[앱 시작 / 푸터 클릭] ──> [useGitHubUpdate.ts] ──(GitHub REST API)──> [api.github.com/releases/latest]
                                                                                   │
                                     ┌─────────────────────────────────────────────┴─────────────┐
                                     ▼                                                           ▼
                           [remoteVer > currentVer]                                    [최신 버전 유지 중]
                        UpdateModal 팝업 창 자동 실행                                   최신 상태 안내 배너
                        - 버전 차이(v1.10.0 vs vX.Y.Z)
                        - 전용 인스톨러 직접 다운로드
                        - 이번 버전 건너뛰기
```

### 3.4. GitHub 핵심 파일 검증 및 자동 푸시 흐름
```
[git-push.bat 실행]
       │
       ▼
[STEP 1: 다단 동적 버전 추출] (package.json ➔ PowerShell ➔ PATCH_NOTES.md) ➔ %APP_VER%
       │
       ▼
[STEP 2.5: 핵심 파일 정밀 감사] (scripts/github/verify-core-files.cjs --clean)
       ├── 28개 필수 빌드 파일 존재 확인
       └── 스크래치 파일 및 레거시 바이너리 자동 제거
       │
       ▼
[STEP 3~6: 안전 스테이징 & 푸시] (git add . ➔ v%APP_VER% 태그 ➔ GitHub 원격 저장소 푸시)
```

### 3.5. 다중 IP (한 개 이상의 IP) 바인딩 및 순차 Netsh 제어 흐름
```
[사용자 수동 IP 입력] ──> [+ 보조 IP 추가] ──> [보조 IP #1, #2 ... 서브넷 마스크 지정]
                                                      │
                                                      ▼
[각 보조 IP별 SendARP 충돌 검사] ─────────────> [유효성 & 중복 IP 검증]
                                                      │
                                                      ▼ (저장 클릭)
                                            [useSystemConfig.ts]
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
         [기본 IP 설정: 초기화 & 바인딩]                              [보조 IP 순차 등록 (반복)]
 netsh interface ipv4 set address "이더넷"                   netsh interface ipv4 add address "이더넷"
 static 192.168.1.100 255.255.255.0 gw 192.168.1.1           192.168.2.100 255.255.255.0
```

### 3.6. 물리 vs 가상 이더넷 이중 식별 및 필터링 파이프라인
```
[어댑터 감지 트리거]
        │
        ├── [1단계: Win32 IP Helper] (windows_native.rs: GetAdaptersAddresses)
        │      ├── OperStatus == 6 (Not Present) 유령 어댑터 즉시 차단
        │      ├── 하드웨어 6바이트 MAC 유효성 검증
        │      └── 어댑터명/설명 기반 1차 가상성 필터링 (Hyper-V, VMware, VirtualBox, WSL 등)
        │
        └── [2단계: Windows NDIS 커널 스택] (useSystemConfig.ts: PowerShell Get-NetAdapter)
               ├── item.Virtual == true 공인 플래그 수집
               ├── InterfaceDescription 하드웨어 제조사명 vs 가상 드라이버 교차 대조
               └── 시스템 PnP 트리에 실존하는 장치명(physicallyPresentNames) 대조
        │
        ▼
[NetworkAdapter { isVirtual: boolean, type: 'Ethernet'|'Wi-Fi'|'Virtual' }]
        │
        ├── UI 탭 바: [물리] (에메랄드) vs [가상] (호박색) vs [Wi-Fi] (파랑색)
        ├── 어댑터 카드 헤더: "물리 이더넷" 배지 vs "가상 이더넷" 배지
        └── 필터 세그먼트: [물리 어댑터] / [가상 어댑터] / [전체] 원클릭 분류
```
