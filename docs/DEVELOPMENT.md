# IpName2 개발 명세서 (Development Specifications)

본 문서는 **IpName2 v1.12.4**의 설계 구조, 기술 스택, 빌드 파이프라인, 순수 창작 DLL, 실시간 업데이트 및 GitHub 패키징 자동화를 기록한 개발 지침서입니다. AI 및 개발자가 본 프로젝트를 유지보수하거나 확장할 때 참고할 수 있도록 상세히 기술되었습니다.

---

## 1. 프로젝트 개요
- **프로젝트명**: AhBiYout IpName2 v1.12.4
- **버전**: v1.12.4 (v1.12-STABLE)
- **개발자**: AhBiYout (GitHub: [https://github.com/AhBiYout-all](https://github.com/AhBiYout-all))
- **공식 저장소**: [https://github.com/AhBiYout-all/IpName2](https://github.com/AhBiYout-all/IpName2)
- **공식 구글 블로그**: [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/)
- **소속**: [https://www.cisnet.co.kr](https://www.cisnet.co.kr)
- **데스크톱 기본 창 크기**: 가로(Width) 650px x 세로(Height) 800px (고정 크기, 시인성 최적화)
- **기본 통신 포트**: 3030 (Vite 개발 서버 및 Tauri 연동 표준 포트)
- **목적**: Windows 환경에서 컴퓨터 이름 및 네트워크 어댑터 설정을 직관적으로 관리하고, 오프라인에서도 단독 실행 가능한 고성능 포터블 데스크톱 애플리케이션 제공.
- **지원 환경**: Windows 전용 데스크톱 애플리케이션 (Windows 10, Windows 11 64비트). Win32 Native API(NDIS, Registry, PowerShell, DLL)에 직접 의존하므로 모바일 환경(Android APK / iOS)은 지원하지 않습니다.
- **핵심 가치**: 순수 창작 네이티브 DLL(`ipname_core.dll`) Layer-2 ARP IP 충돌 감지 및 인프로세스 ICMP Ping 엔진, 초고속 실행, 단일 이더넷 어댑터 내 다중 IP(한 개 이상의 IP) 할당 및 보조 IP 관리, 리얼 IP(공인 WAN IP 및 ISP 통신사) 실시간 조회, 100% 오프라인 동작 보장, 직관적 단일 화면 구성, Windows Native C++ API 연동, 스마트 IP 입력 자동화, 원클릭 랜카드 전원 제어, 지능형 어댑터 분류 및 클린 필터링, GitHub Releases 실시간 자동 업데이트.

---

## 2. 기술 스택 (Tech Stack)

### Frontend
- **Framework**: React 19, Vite 6
- **Styling**: Tailwind CSS 4 (Utility-first)
- **Animations**: Motion (framer-motion) - 고성능 UI 전환 및 레이아웃 애니메이션
- **Icons**: Lucide React - 시스템 스타일 아이콘셋
- **State Management**: React Hooks + LocalStorage Persistence
- **Language**: TypeScript

### Desktop App (Backend & Native)
- **Framework**: Tauri v2.11
- **Language**: Rust (Tauri Core & Win32 Native C++ API Wrapper) / ISO C99 (순수 창작 DLL: `ipname_core.dll`)
- **Native DLL Engine**: `ipname_core.dll` - Layer-2 ARP IP 충돌 검사(`SendARP`), 인프로세스 ICMP Echo Ping(`IcmpSendEcho`), 넌블로킹 TCP 포트 진단, 32비트 고속 서브넷 연산기, NetBIOS 유효성 검사기
- **Permissions**: 데스크톱 시스템 자원(네트워크 어댑터, WMI, 레지스터, UAC) 접근 권한 구성

---

## 3. 아키텍처 설계 (Architecture)

### 3.1. Tauri 데스크톱 구조
- `src-tauri/`: Rust 기반의 Tauri 백엔드 환경. Win32 Native API(`windows-sys` C++ wrapper), OS 권한, 빌드 설정을 담당합니다.
- `src/`: 모든 UI 로직과 상태 관리가 집중된 단일 페이지 애플리케이션(SPA) 구조. Tauri API 및 Custom Command를 통해 백엔드와 상호작용합니다.
- `native/ipname_core/`: 순수 창작 C99 네이티브 DLL 소스 및 헤더. Win32 C-ABI로 컴파일되어 인프로세스에서 마이크로초 단위로 구동.

### 3.2. 데이터 흐름
1. **초기 로딩**: 앱 시작 시 Rust 네이티브 백엔드(`windows_native.rs`)가 Win32 API를 직접 호출하여 5ms 이하 마이크로초 단위로 시스템 정보 및 물리 어댑터를 조회.
2. **사용자 입력**: 프론트엔드 React 상태 업데이트 (스마트 보조 파싱 및 서브넷 마스크 프리셋 동기화).
3. **지속성**: `localStorage`를 통해 스마트 IP 입력 보조 ON/OFF 및 사용자 환경설정 유지.
4. **OS 통신 및 적용**: Rust 백엔드가 Windows Native C++ API 및 UAC 승급 명령어(`Start-Process -Verb RunAs`)를 수행하여 즉각 네트워크 및 컴퓨터명 변경 적용.

---

## 4. 핵심 기능 구현 상세

### 4.1. 스마트 IP 입력 보조 및 C 클래스 게이트웨이 자동 동기화 Engine
- **스마트 IP 입력 보조 (Smart IP Helper)**:
  - 수동 IP 설정 인터페이스에 스마트 입력 보조 토글 옵션이 탑재되어 있으며, 앱 시작 시 기본으로 활성화(`ON`)됩니다.
  - 사용자가 IP 주소를 입력/수정할 때 3개 이상의 옥텟(예: `192.168.0.`)이 입력되면 C 클래스 네트워크 대역을 즉시 감지하여 기본 게이트웨이(예: `192.168.0.1` 또는 기존 4번째 호스트 옥텟 유지)로 실시간 자동 동기화합니다.
  - 서브넷 마스크가 비어 있을 경우 기본값 `255.255.255.0`을 자동으로 함께 채워줍니다.
- **서브넷 마스크 프리셋 셀렉터 (`SubnetMaskSelector.tsx`)**:
  - 서브넷 마스크 입력 필드 클릭 시 자주 사용되는 서브넷 마스크 프리셋(Class C, Class B, Class A 및 CIDR `/24`~`/30`) 팝업이 드롭다운으로 표시되어 원클릭으로 선택/적용할 수 있습니다.

### 4.2. 네트워크 어댑터 관리, 다중 IP 바인딩 및 물리/가상 구분 Engine
- **단일 이더넷 어댑터 내 다중 IP(한 개 이상의 IP) 할당 및 보조 IP 관리**:
  - `windows_native.rs`: Win32 IP Helper `GetAdaptersAddresses` API의 IPv4 유니캐스트 연결 리스트를 순회하여, 첫 번째 IPv4 주소를 기본 IP로 지정하고 2번째 이상의 주소들을 `SecondaryIp` 구조체 배열(`additionalIps`)로 완전 수집.
  - `AdapterItem.tsx`: 수동 IP 모드에서 `+ 보조 IP 추가` 버튼을 통해 1개 이상의 IP와 서브넷 마스크를 동적으로 구성하고, 각 보조 IP마다 순수 창작 DLL (`ipname_core`) 기반 Layer-2 ARP 충돌 검사를 지원.
  - `useSystemConfig.ts`: `netsh interface ipv4 add address name="..." address=... mask=...` 명령어를 순차적으로 생성/실행하여 복수 IP를 Windows 네트워크 스택에 안전하게 바인딩.
- **물리 vs 가상 이더넷(Physical vs Virtual NIC) 정밀 구분 & 시각적 식별**:
  - `NetworkAdapter` 구조체(Rust & TypeScript)에 `isVirtual: bool` 정규 필드를 추가하여, 어댑터 생성 시점부터 가상성 여부를 일관되게 전달.
  - PowerShell `Get-NetAdapter` 조회를 통해 Windows NDIS 드라이버가 공인한 `Virtual` 불리언 속성 및 장치 드라이버 상세 설명(`InterfaceDescription`)을 즉각 반영.
  - Rust(`windows_native.rs`) 및 TypeScript(`useSystemConfig.ts`)의 가상 어댑터 탐지 알고리즘을 확장하여 Hyper-V(`vEthernet`, `vSwitch`), VMware(`VMnet`), VirtualBox(`VBox`), WSL, TAP, TUN, WireGuard, Tailscale, ZeroTier, OpenVPN, Cisco AnyConnect, Hamachi, Radmin 등 현존하는 모든 가상/VPN 인터페이스를 100% 빈틈없이 감지.
  - **어댑터 선택 탭 바**: 각 항목마다 `[물리]` (에메랄드), `[가상]` (호박색), `[Wi-Fi]` (파랑색) 전용 배지와 아이콘 색상을 적용하여 한눈에 식별 가능.
  - **어댑터 상세 카드 헤더**: 어댑터 이름 우측에 `물리 이더넷` / `가상 이더넷` 전용 배지를 크게 표시하고, 상태 행에 `물리적 하드웨어 랜카드` vs `가상 네트워크 어댑터 (Hyper-V / VMware / WSL / VPN 등)` 설명을 상시 안내.
  - **세그먼트 필터 버튼**: 상단에 **[물리 어댑터]**, **[가상 어댑터]**, **[전체]** 세그먼트 필터 버튼을 제공하여 기본 상태에서 물리 랜카드만 정돈되어 표시되며, 필요 시 가상 어댑터도 손쉽게 조회/설정 가능.
- **노이즈 및 가상 필터 드라이버 완전 제거**: Win32 API `GetAdaptersAddresses` 백엔드(`windows_native.rs`)와 프론트엔드(`useSystemConfig.ts`) 2중 필터링을 통해 NDIS/WFP 경량 필터, QoS 패킷 스케줄러, Npcap, WinPcap, Kernel Debugger, WAN Miniport, IPv6 터널/루프백 등 수십 개의 불필요한 시스템 노이즈 어댑터를 완전히 걸러내어 사용자가 실제로 다루는 랜카드만 깔끔하게 표시합니다.
- **GUID 식별 폴백(Fallback) 엔진**: 가상 어댑터, 일부 이기종 드라이버, 가상화 환경(Hyper-V, VirtualBox)에서 네트워크 어댑터의 `GUID`가 유효하지 않거나 빈 값으로 응답되어 어댑터가 올바르게 선택 및 변경되지 않는 문제를 해결했습니다.
  - React 훅(`useSystemConfig.ts`) 및 파싱 로직에서 `id` 값에 대해 `id || macAddress || name || adapter-${index}` 순서로 견고한 폴백 식별자를 생성하여 다중 어댑터 조작이 100% 원활히 동작합니다.
- **DNS 프리셋**: 국내 3대 통신사(KT, SKB, LG U+) 및 Google DNS 설정값을 원클릭으로 어댑터에 즉시 주입 및 적용합니다.

### 4.3. 랜카드(네트워크 어댑터) 사용 / 사용 안 함 원클릭 제어 Engine
- **직관적 UI 전원 제어**:
  - `AdapterItem.tsx` 헤더에 [랜카드 사용 안 함](활성 시, 빨간색 보더/경고 스타일) 및 [랜카드 사용](비활성 시, 녹색 펄스 스타일) 버튼 배치.
  - 비활성화된 어댑터 화면 진입 시 중앙에 경고 알림 배너와 함께 즉시 복구할 수 있는 [랜카드 사용] 바로가기 버튼 제공.
  - 상단 어댑터 선택 탭에서 활성 어댑터(초록색)와 비활성 어댑터(빨간색) 상태 점을 실시간 시각화.
- **오동작 방지 확인 모달 (`ConfirmModal.tsx`) 연동**:
  - 네트워크 단절 위험이 있는 비활성화 요청 시 파괴적 액션(`isDestructive: true`) 경고 모달을 띄워 사용자 실수 방지.
- **PowerShell 및 Native 실행**:
  - `useSystemConfig.ts`의 `toggleAdapterEnabled` 훅을 통해 Windows PowerShell 명령어 실행:
    - 활성화: `Enable-NetAdapter -Name "<AdapterName>" -Confirm:$false`
    - 비활성화: `Disable-NetAdapter -Name "<AdapterName>" -Confirm:$false`
  - 관리자 권한 확인 후 UAC 자동 승급 실행 및 상태 갱신 완료 후 최신 어댑터 정보 재조회.

### 4.4. 리얼 IP (외부 공인 IP) 실시간 감지 및 표시 Engine
- **공인 IP 및 통신사(ISP) 식별 (`RealIpSection.tsx`, `useRealIp.ts`)**:
  - 공유기(NAT)나 사설 IP 환경(192.168.x.x 등)과 명확히 구분되는 외부 공인 IP 주소 및 통신사(ISP: KT, SK Telecom, SK Broadband, LG U+ 등), 위치 정보를 실시간 감지하여 한 화면에 표기합니다.
- **다단 폴백 & 무정지 쿼리 구조**:
  - `ipwho.is`와 `api.ipify.org`의 초고속 병렬 비동기 통신을 수행하며, 웹뷰 내 요청 제한 발생 시 데스크톱 네이티브 PowerShell `Invoke-RestMethod` / `curl.exe` 통합 폴백 체계로 즉시 전환됩니다.
  - `localStorage` 캐싱을 통해 재기동 시 직전 정보를 즉시 표시한 후 백그라운드 갱신을 진행합니다.
- **원클릭 복사 및 실시간 다시 조회**:
  - IP 주소 우측 원클릭 복사 버튼 및 네트워크 상태 변경 후 즉각 재조회 가능한 새로고침 기능을 제공합니다.

### 4.5. 시스템 명령어 실행 (Windows Native)
- **Win32 Native API 직접 통합**: `iphlpapi.dll` 및 `kernel32.dll`을 직접 호출하여 메모리와 레지스터 수준에서 즉시 정보를 수집합니다.
- **관리자 권한 UAC 승급**: Windows 환경에서 설정 적용 시 PowerShell의 `Start-Process -Verb RunAs`를 사용하여 동적으로 UAC 창을 띄워 안전하게 변경 권한을 획득합니다.

### 4.6. UI/UX 디자인 및 창 규격 (Window Sizing)
- **고정 창 크기 최적화**: 윈도우 데스크톱 창 크기를 가로 650px x 세로 800px로 고정하여 어댑터 목록, IP 입력폼, 서브넷 마스크 프리셋, DNS 원클릭 설정, 빠른 진단 도구가 스크롤 없이 한눈에 들어오도록 최적화.
- **Windows 11 스타일**: Fluent 디자인 시스템(`rounded-xl`, `backdrop-blur-xl`, 정밀한 대비)을 사용하여 현대적인 프리미엄 디자인 구현.
- **다국어 지원**: `src/i18n` 폴더를 통한 한국어/영어 지원 및 `v1.10-STABLE` 표기 통일.

### 4.7. 순수 창작 DLL (`ipname_core.dll`) 네트워크 진단 & IP 충돌 감지 Engine
- **Layer-2 ARP 기반 초고속 IP 충돌 감지 (`IpName_CheckIpConflict`)**:
  - 수동 IP 설정 인터페이스에서 [IP 충돌 검사] 버튼 클릭 시, OSI 2계층 ARP 브로드캐스트 패킷을 직접 송신하여 로컬 LAN 상에 동일 IP를 사용하는 기기가 존재하는지 10~50ms 이내에 탐지.
  - 윈도우 방화벽이 ICMP Ping을 차단하더라도 하드웨어 MAC 주소 레벨에서 100% 감지하여 IP 중복으로 인한 통신 마비 사고를 사전에 차단.
- **넌블로킹 TCP 포트 연결 진단 (`IpName_CheckTcpPort`)**:
  - DNS(포트 53), 게이트웨이 웹 관리자(포트 80/443)의 3-Way Handshake 완료 지연 시간(ms)을 마이크로초 단위로 계측.
- **인프로세스 고속 ICMP Echo Ping (`IpName_PingIpv4`)**:
  - 콘솔창 구동 오버헤드 없이 인프로세스 메모리 상에서 초정밀 RTT/TTL 계측.
- **기존 DLL 안정성 전면 보강**:
  - 64비트 Windows 환경의 `ICMP_ECHO_REPLY` 버퍼 크기 부족(MSDN 64비트 IO_STATUS_BLOCK 오버플로우) 원천 차단.
  - 비권장 `inet_addr`를 완전 제거하고 `htonl(ip_host)` 직접 변환 적용.
  - `iphlpapi.dll`의 `GetAdaptersAddresses` API 호출 시 초기 버퍼를 32KB로 증설하고 3회 점진적 재시도 루프 적용.

### 4.8. GitHub Releases 기반 실시간 자동 업데이트 시스템 (`useGitHubUpdate.ts`, `UpdateModal.tsx`)
- **실시간 비동기 감지**:
  - 앱 구동 1.5초 후 및 푸터의 [업데이트 확인] 버튼 클릭 시 GitHub REST API(`repos/AhBiYout-all/IpName2/releases/latest`)를 쿼리하여 최신 배포본 버전을 확인.
  - Semantic Versioning 비교 알고리즘(`isNewerVersion`)을 통해 현재 설치본(`v1.10.0`)보다 상위 릴리스가 존재하면 자동으로 알림 팝업 창(`UpdateModal.tsx`) 실행.
- **업데이트 알림 모달 UI**:
  - NEW UPDATE 배지, 최신 버전명, 릴리스 배포일, 현재 버전 vs 최신 버전 비교 디스플레이.
  - [업데이트 다운로드] 버튼: 전용 설치 프로그램(`.exe`) 직접 다운로드 링크로 연결 (Tauri shell open 연동).
  - [저장소 경로 보기] 버튼: 공식 GitHub Releases 웹 페이지로 이동.
  - [이 버전 건너뛰기] 옵션: 사용자가 해당 버전을 건너뛰도록 `localStorage`에 상태 기록.

### 4.9. Inno Setup 전문 설치 프로그램 (`installer/setup.iss`)
- **Unpacked Multi-File 개별 설치**: 불필요한 포터블 압축 파일이나 임시 문서를 제외하고 `IpName2.exe`, `ipname_core.dll`, 아이콘 리소스만 설치 폴더에 깔끔하게 배포.
- **기존 설치본 감지 & 덮어쓰기 지원**: 레지스트리 조회를 통해 구버전 설치가 감지되면 대화형 모드에서는 사용자에게 삭제/덮어쓰기 여부를 질의하고, 무인 설치 모드 시 자동 갱신.
- **무인 자동 설치 (Silent Install)**: `/SILENT`, `/VERYSILENT`, `/SUPPRESSMSGBOXES`, `/NORESTART` 옵션 완전 대응.
- **Windows 방화벽 사전 조용히 등록**: 기본 명칭(`IpName2`)과 버전 명칭(`IpName2 v1.10.0`) 모두 인바운드/아웃바운드 허용 규칙을 백그라운드에서 자동 등록하며 제거 시 깔끔하게 정리.

---

## 5. 개발, 빌드 및 GitHub 관리 (Build & GitHub Pipelines)

### 5.1. 주요 명령어
프로젝트 루트에서 다음 명령어들을 사용할 수 있습니다:
- `npm run dev`: 로컬 웹 개발 서버를 시작합니다 (기본 포트: 3030).
- `npm run build`: 프론트엔드 에셋을 프로덕션용으로 빌드합니다.
- `npm run tauri dev`: Tauri 데스크톱 앱 개발 모드를 실행합니다.
- `npm run tauri build`: Tauri 데스크톱 앱 프로덕션 빌드를 실행합니다.
- `npm run build:icons`: 앱 아이콘을 생성하고 Windows 호환성 문제를 보정합니다.
- `npm run lint`: TypeScript 정적 타입 검사(`tsc --noEmit`)를 수행합니다.

### 5.2. 자동 빌드 스크립트 (`build.bat` / `build.ps1`)
- 사용자에게 통신용 포트 번호(기본값: 3030) 입력 요청.
- 종속성 검증, 아이콘 자동 보정(`fix-icon.cjs`), 프론트엔드 빌드, 순수 창작 DLL 컴파일(`native/ipname_core/build.bat`), Tauri 본체 컴파일 진행.
- `bin/postbuild-rename.cjs`: 빌드 완료 후 실행파일을 `IpName2_v1.10.0.exe`로 자동 명명하고 결과물 폴더(`src-tauri\target\release`)를 탐색기로 자동 오픈.

### 5.3. GitHub 핵심 빌드 파일 전용 관리 파이프라인 (`scripts/github/`)
GitHub 저장소에 소스 코드를 동기화할 때, 빌드에 필요한 핵심 파일만 안전하게 선별하여 관리하는 전용 시스템입니다:
- `scripts/github/core-manifest.json`: 빌드에 필수적인 28개 핵심 파일/폴더 화이트리스트 및 금지 파일 패턴 정의.
- `scripts/github/verify-core-files.cjs`: 작업 디렉터리를 실시간 감사하여 스크래치 파일이나 불필요한 바이너리를 자동 감지/정리(`--clean`).
- `scripts/github/prepare-github-sync.bat`: Windows 환경에서 사전 감사 및 인덱스 정리를 원클릭으로 수행.

### 5.4. 깃허브용 동적 버전 자동 푸시 스크립트 (`git-push.bat` - 로컬 실행 전용, 원격 저장소 제외)
- **로컬 실행 전용 격리 및 원격 제외**: `git-push.bat` 및 `scripts/git-push.bat`은 로컬 개발자의 푸시 편의를 위한 유틸리티로, `.gitignore`, `.gitkeep-ignore`, `core-manifest.json` 내 `excludedFiles`에 공식 등록되어 GitHub 원격 저장소에는 푸시되지 않도록 철저히 격리됩니다.
- **다단 동적 버전 자동 추출**: `package.json` ➔ PowerShell ➔ `docs/PATCH_NOTES.md` 최상단 헤더 정규식 파싱.
- **사전 무결성 검증 (STEP 3)**: 스테이징 직전 `node scripts\github\verify-core-files.cjs --clean`을 자동 호출하여 불필요한 파일이 Git에 포함되는 사고를 원천 차단.
- **원클릭 자동화**: 추출된 버전(`v1.12.4`)으로 커밋 생성, Git 릴리스 태그 생성, 원격 저장소(`main` 브랜치 및 `--tags`) 푸시 완결.

### 5.5. GitHub Actions 릴리스 배포 워크플로 (`.github/workflows/release.yml`)
- **Node.js 22 LTS 전환**: GitHub 클라우드 러너의 Node 20 EOL 공식 수명 종료 정책에 맞춰 최신 LTS 환경으로 완전 전환.
- **인스톨 파일 전용 배포 정책**: 소스 압축본, 디버그 산출물, 포터블 폴더를 제외하고 Inno Setup 순수 설치 프로그램(`IpName2_v*_Setup.exe`)만 GitHub Releases 자산으로 등록.

---

## 6. 라이선스 및 배포 고지사항 (License Notice)
본 소프트웨어는 포터블 단일 실행 파일 및 인스톨러 형태로 자유롭게 복제 및 배포할 수 있으며, 이와 관련된 오픈소스 라이선스 고지사항은 `/docs/LICENSE_NOTICE.md`에 자세히 기술되어 있습니다. (MIT License 기반)
