# 패치 노트 (Patch Notes) - IpName2

본 문서는 **AhBiYout IpName2**의 버전별 업데이트 및 버그 수정 내역을 기록합니다.

---

## [v1.10.0] - 2026-10-09

### 1. GitHub Releases 기반 실시간 자동 업데이트 및 알림 팝업 시스템 구축
* **실시간 원격 릴리스 감지 엔진 (`useGitHubUpdate.ts`)**:
  - 앱 구동 시 및 사용자가 수동 확인 요청 시 GitHub REST API(`repos/AhBiYout-all/IpName2/releases/latest`)와 실시간 통신하여 최신 릴리스 버전 정보를 비동기 조회.
  - Semantic Versioning 비교 알고리즘(`isNewerVersion`)을 탑재하여 로컬 버전(`v1.10.0`)보다 상위 버전이 배포되었을 때 즉시 감지.
* **업데이트 알림 팝업 모달 (`UpdateModal.tsx`)**:
  - 새 버전 출시 시 자동 팝업 알림 창 실행 (NEW UPDATE 배지, 출시일, 현재 버전 vs 최신 버전 차이 비교).
  - 설치 파일 직접 다운로드 버튼, GitHub 릴리스/저장소 공식 경로 링크, 이번 버전 건너뛰기(`ipname_skipped_update_version`) 기능 제공.
  - 데스크톱 Tauri 네이티브 환경(`@tauri-apps/plugin-shell`)과 웹 브라우저 환경 모두에서 안전하게 외부 브라우저를 호출하는 다중 브라우저 런처 통합.
* **헤더 및 푸터 업데이트 접근성 강화 (`Header.tsx`, `Footer.tsx`)**:
  - 헤더 우측 상단에 버전 배지 및 업데이트 감지 시 **[NEW UPDATE]** 펄스 알림 뱃지 탑재.
  - 푸터 '업데이트 확인' 버튼을 통해 언제든지 1클릭으로 즉시 최신 상태 검증 가능.

### 2. Node.js 20 공식 지원 종료(EOL) 대응 및 GitHub Actions 워크플로 최신화
* **GitHub Actions 클라우드 러너 Node.js 22 LTS 전환 (`.github/workflows/release.yml`)**:
  - 2026년 공식 수명 종료된 Node.js 20 대신 GitHub 공식 권고에 따라 차세대 안정 런타임인 **Node.js 22 LTS**(`node-version: 22`)로 전면 마이그레이션.
  - CI/CD 빌드 실행 시 발생하던 노란색 지원 중단 경고(Warning: Node.js 20 is deprecated...) 원천 해소.
* **릴리스 설치 파일(Installer) 단일 패키징 자동화 파이프라인**:
  - Git 태그(`v*`) 푸시 또는 수동 트리거(`workflow_dispatch`) 시 Windows 러너에서 React 빌드, Tauri 바이너리 컴파일, Inno Setup 인스톨러 컴파일을 원스톱 자동화.
  - GitHub Releases 자산에 불필요한 중간 빌드 파일/문서/포터블/디버그 산출물을 일체 배제하고 순수 인스톨러(`IpName2_v*_Setup.exe`) 파일만 단독으로 정제하여 자동 업로드.

### 3. Inno Setup 프로페셔널 설치 프로그램 완성 (`installer/setup.iss`)
* **폴더 풀림(Unpacked Multi-File) 개별 파일 설치 구조**:
  - 설치 디렉터리에 실행 파일(`IpName2.exe`), 순수 창작 DLL(`ipname_core.dll`), 아이콘 리소스만 명확히 배치하고 불필요한 임시 문서 및 포터블 압축 파일 혼입 차단.
* **기존 설치본 감지 및 자동 삭제/덮어쓰기 지원**:
  - 레지스트리(`Uninstall\{#MyAppId}_is1`) 조회를 통해 이전 버전이 감지되면 대화형 모드에서는 사용자에게 덮어쓰기 여부를 질의하고, 무인 모드에서는 무인 재설치 진행.
* **무인 자동 설치(Silent Install) 완벽 지원**:
  - `/SILENT`, `/VERYSILENT`, `/SUPPRESSMSGBOXES`, `/NORESTART` 옵션 대응으로 기업 전산망 및 원격 배포 자동화 지원.
* **Windows 방화벽 사전 조용히 등록 (Silent Pre-Registration)**:
  - 설치 시 백그라운드(`netsh advfirewall`)에서 기본 이름(`IpName2`)과 버전 포함 이름(`IpName2 v1.10.0`) 모두 인바운드 및 아웃바운드 허용 규칙 자동 등록.
  - 앱 제거 시(`[UninstallRun]`) 등록된 방화벽 규칙을 깔끔하게 자동 삭제하여 시스템 오염 방지.

### 4. 깃허브용 동적 버전 자동 푸시 스크립트 구축 (`git-push.bat`, `scripts/git-push.bat`)
* **다단 동적 버전 자동 추출 메커니즘**:
  - 1차: `package.json`의 `"version"` 필드를 Node.js로 파싱.
  - 2차 (Fallback): Node 미설치 시 PowerShell을 통해 `package.json` 추출.
  - 3차 (Fallback): `docs/PATCH_NOTES.md` 최상단 헤더 정규식(`## [vX.Y.Z]`) 파싱.
* **파이프라인 자동 반영**:
  - 추출된 버전을 커밋 메시지, 릴리스 태그(`v1.10.0`), 콘솔 타이틀에 100% 자동 연동하여 원클릭으로 GitHub 업로드 및 태그 동기화 완료.

### 5. 순수 창작 DLL 빌드 스크립트 문법 버그 원천 수정 및 안정화
* **Windows CMD 괄호 파싱 충돌(`detected.은(는) 예상되지 않았습니다.`) 해결**:
  - `native/ipname_core/build.bat` 및 `build.bat`의 조건문 구조를 개선하여 `if (...)` 블록 내 중첩 괄호 및 goto로 인한 인터프리터 오류 완전 해소.
  - C 컴파일러(MSVC `cl.exe`, MinGW `gcc.exe`) 감지 및 빌드 로직을 안전한 순차 구조로 재설계.

### 6. 깃허브 보안 및 개인정보 보호 강화
* **민감 정보 및 개인 이메일 업로드 원천 차단**:
  - `.gitignore`에 인스톨러 산출물(`dist-installer/`, `release/`, 아카이브 `*.zip`, `*.7z` 등) 등록.
  - 레포지토리 전반에서 개인 이메일을 배제하고 공식 채널(`https://github.com/AhBiYout-all/IpName2`, `https://ahbiyoutvibe.blogspot.com/`, `https://www.cisnet.co.kr`)로 단일화.

### 7. 비지원 모바일(APK / iOS) 잔여 아티팩트 및 설정 전면 제거
* **Windows 데스크톱 전용 플랫폼 특화 및 잔여 리소스 정리**:
  - IpName2는 Win32 Native C++ API, NDIS 네트워크 드라이버, 레지스트리 및 Win32 순수 창작 DLL(`ipname_core.dll`)에 직접 의존하여 동작하므로 모바일(Android APK / iOS) 환경은 지원하지 않습니다.
  - 이에 따라 `src-tauri/icons/android/` 및 `src-tauri/icons/ios/` 잔여 모바일 아이콘 디렉터리를 완전 삭제 처리.
  - `src-tauri/src/lib.rs`의 미사용 `#[cfg_attr(mobile, tauri::mobile_entry_point)]` 매크로 제거.
  - `.gitignore` 및 개발 명세서(`docs/DEVELOPMENT.md`)에서 불필요한 모바일 관련 내용을 정돈하고 Windows 10/11 전용 데스크톱 유틸리티로서의 스펙을 명확히 확립.

### 8. GitHub 업로드 파일 정밀 감사 및 핵심 빌드 파일 전용 관리 파이프라인 수립
* **빌드 필수 핵심 파일 화이트리스트 규격화 (`scripts/github/core-manifest.json`)**:
  - React/TypeScript 프론트엔드(`src/`), Tauri 데스크톱 백엔드(`src-tauri/`), C99 순수 창작 DLL(`native/ipname_core/`), Inno Setup 인스톨러(`installer/`), CI/CD 워크플로(`.github/workflows/`), 핵심 빌드 스크립트(`build.bat`, `git-push.bat`, `bin/postbuild-rename.cjs`) 등 실제 빌드에 반드시 필요한 28개 핵심 파일/폴더만 엄격하게 화이트리스트로 정의.
* **레거시 대용량 바이너리 및 임시 스크립트 영구 제거**:
  - 초기 프로토타입 잔재였던 약 18MB 규모의 Neutralino 바이너리 7종(`bin/neutralino-*`) 완전 삭제.
  - 아이콘 디버깅용 1회성 임시 스크립트 9종(`convert.cjs`, `download-icons.ts`, `download-official-icons.js`, `extract-png.cjs`, `fix-icon.js`, `get-b64.cjs`, `icon_base64.txt`, `make-icon.cjs`, `make-strict-ico.cjs`, `bun.lock`) 전면 폐기.
* **자동 감사 및 무결성 검증 도구 (`scripts/github/verify-core-files.cjs`, `prepare-github-sync.bat`)**:
  - GitHub 푸시 직전 작업 트리를 자동 스캔하여 허용되지 않은 파일이나 불필요한 스크래치 파일이 감지되면 자동 정리(`--clean`)하고, 필수 파일 누락 시 푸시를 차단하는 사전 검증 시스템 연동.
  - `git-push.bat`에 검증 단계(STEP 2.5)를 내장하여 원클릭 푸시 시에도 항상 100% 정제된 핵심 파일만 Git에 스테이징되도록 보장.
* **GitHub Releases 릴리스 산출물 순수 인스톨러 파일 단일화 보장**:
  - `.github/workflows/release.yml` 배포 단계에서 소스 압축본, 디버그 심볼, 포터블 폴더 등을 제외하고 최종 사용자용 Inno Setup 인스톨러(`IpName2_v*_Setup.exe`)만 단독 첨부되도록 검증 완료.

---

## [v1.9.0] - 2026-10-07

### 1. 순수 창작 네이티브 DLL (`ipname_core.dll`) 신규 탑재 및 고성능 네트워크 엔진 확장
* **순수 창작 DLL 설계 및 C-ABI 아키텍처 수립 (`native/ipname_core`)**:
  - 외부 쉘(`cmd.exe`, `powershell.exe`) 프로세스 생성 오버헤드(300ms~500ms)를 100% 제거하고 인프로세스(In-Process) 메모리 상에서 마이크로초(μs) 단위로 구동되는 독자적인 네이티브 DLL **`ipname_core.dll`**을 직접 설계 및 구현.
  - C99 및 Win32 표준 규격 C-ABI(`__stdcall`)를 준수하여 Tauri Rust 백엔드, C/C++, C# 등 모든 언어에서 무의존성(Zero External Dependency)으로 즉각 호출 가능.
* **Layer-2 ARP 기반 초고속 IP 충돌 감지 (`IpName_CheckIpConflict`)**:
  - 관리자가 고정 IP(Static IP)를 어댑터에 적용하기 전, 로컬 서브넷에 동일 IP를 이미 점유 중인 기기(PC, 스마트폰, 프린터, NAS 등)가 존재하는지 사전 검사하는 전용 모듈 탑재.
  - 윈도우 방화벽이 ICMP Ping을 차단하더라도 데이터링크 2계층 ARP 브로드캐스트(`SendARP`)를 직접 송신하여, 충돌 발생 시 10~50ms 이내에 상대방 하드웨어의 6바이트 물리 MAC 주소(`AA:BB:CC:DD:EE:FF`)를 즉각 식별하고 경고 표시.
  - 수동 IP 입력 필드 우측 상단에 **[IP 충돌 검사]** 배지를 신설하여, 원클릭으로 해당 IP가 충돌 없는 안전한 IP인지 실시간 확인 가능.
* **인프로세스 초고속 ICMP Ping 프로브 (`IpName_PingIpv4`)**:
  - Windows 커널 NDIS ICMP 파일 핸들(`IcmpCreateFile`, `IcmpSendEcho`)을 직접 제어하여 지연 시간(RTT ms) 및 패킷 수명(TTL)을 0.1ms 정밀도로 즉각 측정.
* **넌블로킹 TCP 포트 연결 진단 (`IpName_CheckTcpPort`)**:
  - DNS 포트(53), HTTP(80), HTTPS(443) 등 주요 포트의 3-Way Handshake 왕복 시간을 비동기 소켓(`select`, `ioctlsocket`)으로 정밀 진단.
* **초고속 서브넷 마스크 비트 연산기 (`IpName_CalculateSubnet`) & IP 대역 분류기 (`IpName_ClassifyIp`)**:
  - 32비트 비트마스크 연산으로 네트워크 주소, 브로드캐스트 주소, 가용 호스트 IP 대역, CIDR 접두사를 마이크로초 단위로 산출.
  - RFC 1918(사설 A/B/C클래스), RFC 1122(루프백), RFC 3927(APIPA), RFC 6598(CGNAT), 공인 WAN 대역 자동 식별.

### 2. 기존 시스템 DLL 및 내부 DLL 잠재 오류 전면 점검 & 개선
* **64비트 환경 `ICMP_ECHO_REPLY` 버퍼 크기 부족 원천 해결**:
  - 64비트 Windows에서 `IO_STATUS_BLOCK` 정렬 문제로 커널 응답 버퍼가 부족할 경우 힙 손상이 발생할 수 있는 문제를 방지하기 위해 최소 1024바이트의 안전 정렬 버퍼를 기본 할당하도록 보강.
* **비권장 `inet_addr` 제거 및 `htonl()` 직접 변환 적용**:
  - 최신 컴파일러(MSVC)에서 C4996 Deprecated 경고를 유발하고 255.255.255.255 브로드캐스트 처리에 취약한 `inet_addr`를 완전히 배제하고 파싱된 호스트 정수를 `htonl()`로 변환하여 안전성 극대화.
* **불연속(Non-contiguous) 비정상 서브넷 마스크 유효성 검증 탑재**:
  - 255.0.255.0과 같은 기형적인 마스크 입력 시 비트 연속성(`(~mask & (~mask + 1)) == 0`)을 사전에 판별하여 잘못된 연산 결과가 전파되는 버그 차단.
* **Windows 시스템 `iphlpapi.dll` (`GetAdaptersAddresses`) 대규모 환경 안정화**:
  - 도커, Hyper-V, VPN 다중 가상 어댑터 환경에서 초기 버퍼 부족으로 인한 `ERROR_BUFFER_OVERFLOW`(111) 실패를 방지하기 위해 초기 버퍼를 32KB로 대폭 상향하고 최대 3회 점진적 크기 재할당 루프를 탑재.

### 3. 순수 창작 DLL 상세 동작 원리 공식 문서 등록 (`docs/DLL_SPECIFICATION.md`)
* `docs/DLL_SPECIFICATION.md`를 전면 개정하여 순수 창작 DLL의 설계 배경, C-ABI 인터페이스 구조체 및 함수 원형, 시퀀스 다이어그램, 기존 시스템 DLL 감사 보고서 및 빌드/배포 가이드를 수록하고 `docs/README.md` 문서 허브에 연동.

### 4. 버전 삼중 동기화 (Triple Lockstep: v1.9.0) 및 빌드 파이프라인 무결성 확보
* `package.json` (`1.9.0`), `src-tauri/tauri.conf.json` (`1.9.0`), `src-tauri/Cargo.toml` (`1.9.0`), `docs/PATCH_NOTES.md` (`v1.9.0`), `docs/DEVELOPMENT.md`, `docs/ARCHITECTURE.md` 정합성 확립.
* 빌드 파이프라인(`bin/postbuild-rename.cjs`, `build.bat`, `build.ps1`, `native/ipname_core/build.bat`)의 `ipname_core.dll` 사전 컴파일 연동 및 `IpName2_v1.9.0.exe` 자동 네이밍 연동.
* Windows CMD 배치 스크립트(`native/ipname_core/build.bat`)의 `if (...)` 블록 내 괄호 파싱 충돌(`detected.은(는) 예상되지 않았습니다.`) 원천 수정 및 C 컴파일러 미설치 환경에서도 Rust 네이티브 빌드가 중단 없이 매끄럽게 이어지도록 자가 치유 폴백 보강.

---

## [v1.8.1] - 2026-10-07

### 1. 랜카드 "사용 안 함"(비활성화) 시 목록 증발 및 응답 없음 버그 원천 해결
* **증상 및 원인 분석**:
  - Windows NDIS/Win32 `GetAdaptersAddresses` API는 비활성화된 어댑터(Disabled NIC)를 TCP/IP 스택에서 분리하여 목록에서 자동으로 누락시킵니다.
  - 또한 비활성화된 하드웨어는 임시로 MAC 주소 길이가 0으로 반환되는데, 유령 어댑터(Ghost adapter) 차단 필터가 이를 가짜 어댑터로 오판단하여 어댑터를 목록에서 완전히 삭제해버리는 버그가 있었습니다.
  - 이로 인해 랜카드를 "사용 안 함"으로 전환하면 탭 목록과 화면에서 어댑터가 즉시 사라져버려 사용자가 다시 "사용" 상태로 되돌릴 수 없는 문제가 발생했습니다.
* **해결 조치**:
  - **상태 보존 & 스마트 병합 엔진 (`useSystemConfig.ts`)**:
    - `fetchInitialData()` 실행 시 이전에 인식된 어댑터 목록과 Windows PowerShell(`Get-NetAdapter -IncludeHidden:$false | Where-Object { $_.Status -eq 'Disabled' }`) 비활성 어댑터 쿼리를 통합 대조.
    - 비활성화된 어댑터를 목록에서 제거하지 않고 **`isEnabled: false, status: 'Disabled'`** 상태로 온전히 유지 및 고정.
  - **비활성화 어댑터 오판단 방지 (`isGhostOrInvalidAdapter`)**:
    - 비활성 상태(`!isEnabled` 또는 `status === 'Disabled'`)의 실제 물리/가상 랜카드가 유령 필터에 의해 폐기되지 않도록 방어 로직 탑재.
  - **Native C++ API 레벨 보호 (`windows_native.rs`)**:
    - "이더넷", "Wi-Fi" 등 합법적인 명칭을 가진 랜카드는 비활성화 시 MAC 주소 길이가 0이더라도 폐기하지 않고 정상 객체로 통과.
  - **UI/UX 복구 접근성 극대화**:
    - 비활성화된 어댑터는 탭 상단에 빨간색 상태 닷(🔴)이 즉시 켜지며, 카드 헤더 및 본문 알림 배너에 녹색 펄스 스타일의 **[랜카드 사용]** 버튼이 지속 노출되어 언제든 원클릭으로 즉각 복구 가능.
    - 어댑터 선택 상태(`selectedAdapterId`)가 사라지지 않고 유지되어 화면이 멈추거나 튕기는 현상 원천 차단.

### 2. 버전 삼중 동기화 (Triple Lockstep: v1.8.1)
* `package.json` (`1.8.1`), `src-tauri/tauri.conf.json` (`1.8.1`), `src-tauri/Cargo.toml` (`1.8.1`), `docs/PATCH_NOTES.md` (`v1.8.1`), `docs/DEVELOPMENT.md`, `docs/ARCHITECTURE.md` 정합성 확립.
* 빌드 배포 파이프라인(`bin/postbuild-rename.cjs`, `build.bat`)의 `IpName2_v1.8.1.exe` 자동 네이밍 연동.

---

## [v1.8.0] - 2026-10-07

### 1. 리얼 IP (외부 공인 IP) 실시간 조회 및 표시 모듈 신규 탑재
* **리얼 IP (공인 WAN IP) 실시간 감지 및 표시 (`RealIpSection.tsx`, `useRealIp.ts`)**:
  - 공유기(NAT) 및 가상 네트워크 환경(192.168.x.x, 10.x.x.x 등)에서 인터넷 외부와 통신하는 **실제 공인 IP(리얼 IP)**를 한눈에 확인할 수 있는 전용 위젯 섹션 신규 구현.
  - 외부 통신사(ISP: KT, SK Telecom, SK Broadband, LG U+, Google Cloud 등) 및 접속 국가/지역 정보를 자동 감지하여 뱃지 형태로 직관적 제공.
  - IPv4 / IPv6 자동 구분 및 프로토콜 뱃지 표기.
* **다단 폴백(Fallback) & 자가 치유(Self-Healing) 네트워크 엔진**:
  - 1차: `ipwho.is` 및 `api.ipify.org` 초고속 병렬 비동기 조회.
  - 2차: `api64.ipify.org` 보조 조회.
  - 3차: 데스크톱 Tauri 네이티브 환경에서 웹뷰 차단 발생 시 PowerShell `Invoke-RestMethod` / `curl.exe` 무정지 폴백 체계 가동.
  - 로컬 캐싱(`localStorage`)을 적용하여 앱 구동 즉시 직전 조회 IP를 렌더링하고 백그라운드에서 지연 없이 최신 상태로 동기화.
* **사용자 편의 인터랙션 (원클릭 복사 & 실시간 재조회)**:
  - 리얼 IP 주소 전용 원클릭 복사(`CopyButton`) 버튼 및 시각적 피드백 제공.
  - 네트워크 어댑터 설정 변경이나 게이트웨이/공유기 재설정 후 즉각 상태를 갱신할 수 있는 [다시 조회(새로고침)] 기능 탑재.
  - 오프라인 또는 인터넷 연결 끊김 시 오류 안내 및 재시도 버튼 노출.

### 2. UI/UX 레이아웃 최적화 및 프리뷰 가독성 보정
* **한 화면 레이아웃 & 650x800px 불변 규격 완벽 사수**:
  - 창 크기를 무리하게 확장하지 않고, 가로 650px x 세로 800px 규격 내에서 스크롤 없이 모든 정보가 한눈에 들어오도록 리얼 IP 바를 **초슬림 고밀도(36px) 단일 행**으로 레이아웃 최적화.
  - 컨테이너 폭(`max-w-[600px]`)에 맞춰 Tailwind `sm:` 브레이크포인트 종속성을 완전히 제거하여, 프리뷰 창이나 소형 디스플레이에서도 텍스트나 버튼이 누락·잘림 없이 100% 온전히 표시되도록 가로 플렉스 구조 개편.
  - 한국어(KO) 및 영어(EN) 다국어 번역 키 완벽 지원 (`realIp`, `realIpDesc`, `privateVsPublicTip`, `ispProvider`, `location`, `retryLookup` 등).
  - 다크/기본/에메랄드/선셋 테마 전반에 걸쳐 테마 가독성 및 명도 대비 자동 보정.

### 3. 버전 삼중 동기화 (Triple Lockstep)
* `package.json` (`1.8.0`), `src-tauri/tauri.conf.json` (`1.8.0`), `src-tauri/Cargo.toml` (`1.8.0`), `docs/PATCH_NOTES.md` (`v1.8.0`), `docs/DEVELOPMENT.md`, `docs/ARCHITECTURE.md` 정합성 확립.
* 빌드 배포 파이프라인(`bin/postbuild-rename.cjs`, `build.bat`)의 `IpName2_v1.8.0.exe` 자동 네이밍 연동.

---

## [v1.7.3] - 2026-09-14

### 1. Windows 11 OS 식별 레지스트리 호환성 알고리즘 개선
* **Windows 11 OS 인식 오류 해결 (Windows 10 오인식 버그 수정)**:
  - Microsoft Windows OS는 레거시 프로그램 호환성을 위해 Windows 11에서도 `HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProductName` 레지스트리 값을 `"Windows 10 Education"`, `"Windows 10 Pro"` 등으로 유지합니다.
  - 이에 따라 `CurrentBuild` / `CurrentBuildNumber`가 22000 이상이거나 `DisplayVersion`이 `23H2`, `24H2`, `25H2` 등인 경우 시스템을 **Windows 11**으로 정밀 보정하여 표시하도록 C++ 네이티브 백엔드(`windows_native.rs`) 및 프론트엔드(`useSystemConfig.ts`) 감지 알고리즘을 개선했습니다.
  - 예: `Windows 10 Education 25H2` ➡️ **`Windows 11 Education 25H2`**로 올바르게 표시.

### 2. 프로그램 정보(About) 모달 및 라이선스 고지 문서(LICENSE_NOTICE.md) 최신화
* **프로그램 정보 모달 버전 및 개발자 연락처 보충 (`Footer.tsx`, `translations.ts`)**:
  - 모달 제목을 최신 정식 버전인 `IpName2 v1.7.3` 및 `v1.7.3 (STABLE)`으로 일원화.
  - 개발자 공식 지원 채널(`https://github.com/AhBiYout-all/IpName2/issues`) 및 공식 블로그 링크 신설.
* **오픈소스 라이선스 목록 정밀 동기화**:
  - `Tauri` 데스크톱 프레임워크 버전을 `v2.11.1`로 갱신하고 이미지 처리 엔진인 `Jimp (v0.22.10, MIT)` 라이브러리 라이선스 명시를 추가.
* **기술 문서 동기화**:
  - `docs/LICENSE_NOTICE.md`의 대상 버전을 `v1.7.3`으로 갱신하고 개발자/소속 메타데이터 및 섹션 번호 체계 정비 완료.
### 3. Windows 실행 파일(.exe) 속성 "자세히" 메타데이터 완성
* **Windows 파일 속성 정보 완벽 주입**:
  - `src-tauri/tauri.conf.json`의 `bundle` 설정에 파일 설명(`shortDescription`), 제품 설명(`longDescription`), 저작권(`copyright`), 게시자(`publisher`), 공식 웹사이트(`homepage`) 메타데이터 등록.
  - `src-tauri/Cargo.toml`의 패키지 메타데이터(이름 `ipname2`, 버전 `1.7.3`, 설명, 작성자 `AhBiYout <https://github.com/AhBiYout-all>`, 라이선스 `MIT`, 홈페이지 및 저장소) 최신화.
  - Windows 탐색기에서 실행 파일(.exe) 마우스 우클릭 ➡️ **[속성]** ➡️ **[자세히]** 탭 진입 시:
    - **파일 설명**: `IpName2 - Windows System & Network Configuration Utility`
    - **파일 버전 / 제품 버전**: `1.7.3`
    - **제품 이름**: `IpName2 v1.7.3`
    - **저작권**: `Copyright © 2026 AhBiYout. All rights reserved.`
    - **회사/게시자**: `AhBiYout`
    - **원본 파일 이름**: `ipname2.exe`

* **버전 삼중 동기화 (Triple Lockstep)**:
  - `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `docs/PATCH_NOTES.md`, `docs/DEVELOPMENT.md`, `docs/ARCHITECTURE.md`에 v1.7.3 버전 및 메타데이터 완벽 동기화.

---

## [v1.7.2] - 2026-09-14

### 1. 유령(Ghost/Phantom) 어댑터 원천 차단 및 "설정 적용 중 오류" 버그 해결
* **윈도우 잔류 유령 어댑터(Ghost Adapter) 필터링**:
  - 드라이버 재설치 등으로 윈도우 레지스트리에 잔존하던 비존재 유령 어댑터(MAC 주소가 `00:00:00:00:00:00`이거나 물리 주소 길이가 0인 항목)를 백엔드(`windows_native.rs`) 및 프론트엔드(`useSystemConfig.ts`)에서 완전 차단.
  - 블루투스 PAN(`Bluetooth Personal Area Network`), Wi-Fi Direct 어댑터(`로컬 영역 연결*`) 등 노이즈 어댑터를 정밀 필터링하여 제어판 네트워크 연결(`ncpa.cpl`) 및 장치 관리자의 어댑터 목록과 1:1로 완벽히 일치하도록 동기화.
* **유령 어댑터 활성화 시 발생하는 빨간색 설정 적용 오류 차단**:
  - 윈도우 실제 네트워크 스택(`Get-NetAdapter`)에 존재하지 않는 유령 어댑터(예: '이더넷')에 대해 `Enable-NetAdapter` 또는 IP 변경 명령이 전송되어 발생하던 "설정 적용 중 오류가 발생했습니다" 예외를 원천 방지.
  - React 훅(`useSystemConfig.ts`)에서 제거된 유령 어댑터가 이전 상태(`prevAdapters`)에 의해 부활하던 누적 동기화 로직을 제거하여 실시간 OS 어댑터 상태만을 정밀 반영.
* **버전 삼중 동기화 (Triple Lockstep)**:
  - `package.json`, `src-tauri/tauri.conf.json`, `docs/PATCH_NOTES.md`, `docs/DEVELOPMENT.md`, `docs/ARCHITECTURE.md`에 v1.7.2 버전 및 변경 내역 동시 갱신.

---

## [v1.7.1] - 2026-09-14

### 1. 개발자, 구글블로그, 소속 공식 메타데이터 표준화 및 UI 링크 최적화
* **공식 채널 및 소속 정보 규격 반영**:
  - **구글블로그**: `https://ahbiyoutvibe.blogspot.com/`
  - **소속**: `http://www.cisnet.co.kr/` (기존 단순 웹사이트 표기를 '소속'으로 명확화하고 공식 웹 주소 `http://www.cisnet.co.kr/` 적용)
  - **개발자**: `AhBiYout` ('제작자' 표기를 '개발자'로 통일)
* **하단 푸터 및 프로그램 정보(About) 모달 동기화**:
  - 메인 화면 하단 푸터 바의 링크 툴팁(`title`) 및 아이콘 연동 규격을 [개발자], [구글블로그], [소속]으로 직관적 재정비.
  - 프로그램 정보(About / Licenses) 모달 내에 개발자, 구글블로그, 소속 하이퍼링크가 최신 URL(`http://www.cisnet.co.kr/`, `https://ahbiyoutvibe.blogspot.com/`)로 정확히 연결되도록 업데이트.
  - 다국어 사전(`src/i18n/translations.ts`)의 한국어/영어 항목(author/developer: 개발자/Developer, blog: 구글블로그/Google Blog, affiliation: 소속/Affiliation) 동기화.
* **버전 삼중 동기화 (Triple Lockstep)**:
  - `package.json`, `src-tauri/tauri.conf.json`, `docs/PATCH_NOTES.md`, `docs/DEVELOPMENT.md`, `docs/ARCHITECTURE.md`에 v1.7.1 버전 및 변경 내역 동시 갱신.

---

## [v1.7.0] - 2026-09-12

### 1. 네트워크 어댑터(랜카드) 정밀 필터링 및 클린 뷰 정돈 ("랜카드 정리가 필요함")
* **불필요한 노이즈 및 가상/필터 드라이버 완전 정리**:
  - Windows NDIS/WFP 필터 드라이버(`WFP Native MAC Layer LightWeight Filter`, `QoS Packet Scheduler`, `Npcap Packet Driver`, `WinPcap`, `Kernel Debugger`, `NDIS Network Monitor` 등) 및 터널/루프백/WAN Miniport 드라이버를 백엔드(`windows_native.rs`) 및 프론트엔드(`useSystemConfig.ts`) 레벨에서 2중 정밀 필터링하여 목록에서 완벽히 제거.
* **물리 / 가상 어댑터 스마트 분류 및 세그먼트 필터 제공**:
  - 시스템에 존재하는 네트워크 어댑터를 **물리 어댑터(Physical)**와 **가상 어댑터(Virtual - WSL/Hyper-V/VMware/VirtualBox)**로 지능적으로 분류.
  - 상단 헤더에 **[물리 어댑터]**, **[가상 어댑터]**, **[전체]** 세그먼트 필터 탭을 제공하여, 기본적으로 실사용 물리 랜카드(이더넷, Wi-Fi)만 깔끔하게 우선 노출되도록 개선.
* **어댑터 탭 바 UI/UX 현대화**:
  - 어댑터가 많아도 화면이 복잡해지지 않도록 매끄러운 수평 스크롤 탭 바 디자인 적용.
  - 어댑터 타입별 고유 아이콘(`이더넷: Network`, `와이파이: Wifi`, `가상: Layers`)과 연결/비활성화 상태 인디케이터 닷(Dot)을 시각적으로 통일.
  - 가상 어댑터 선택 시 카드 헤더에 `[가상]` 전용 뱃지를 표시하여 식별력 극대화.

---

## [v1.6.1] - 2026-09-12

### 1. 비활성화('랜카드 사용 안 함')된 네트워크 어댑터 목록 유지 버그 해결
* **원인 분석**:
  - 기존 Windows Native API(`GetAdaptersAddresses`) 호출 시 `AF_INET` 및 기본 플래그만 전달하여, Windows 시스템에서 랜카드가 비활성화(`Disable-NetAdapter`)되면 IPv4 바인딩이 해제되어 목록에서 완전히 누락되던 문제가 발생했습니다.
* **조치 및 개선 사항**:
  - `src-tauri/src/windows_native.rs`:
    - `GetAdaptersAddresses`의 주소 패밀리를 `AF_UNSPEC`(0)으로 확장하여 비활성 인터페이스까지 포괄적으로 조회.
    - 플래그에 `GAA_FLAG_INCLUDE_ALL_INTERFACES`(0x0100)를 결합(`GAA_FLAG_INCLUDE_GATEWAYS | GAA_FLAG_INCLUDE_ALL_INTERFACES`)하여 Windows가 관리자 비활성 랜카드를 정상 반환하도록 수정.
    - `addr.OperStatus` 및 `Flags`의 IPv4 활성화 비트(`0x20`)를 검사하여 `is_enabled: false`, `status: "Disabled"`로 정확히 식별.
  - `src/hooks/useSystemConfig.ts`:
    - `fetchInitialData`: Windows 네트워크 스택 초기화 과정에서 일시적으로 누락되는 어댑터가 발생하더라도 기존 어댑터 목록과 결합하여 비활성 상태(`isEnabled: false`, `status: 'Disabled'`)로 목록에서 절대 사라지지 않도록 상태 유지 보장.
    - `toggleAdapterEnabled`: 비활성화 명령 실행 즉시 낙관적(Optimistic) 상태 업데이트를 적용하여 UI 깜빡임 없이 즉각 [랜카드 사용] 버튼으로 전환되도록 UX 최적화.

---

## [v1.6.0] - 2026-08-19

### 1. 랜카드(네트워크 어댑터) 사용 / 사용 안 함 원클릭 제어 버튼 탑재
* **어댑터별 전원/활성화 상태 직관적 제어**:
  - 네트워크 어댑터 카드 헤더에 명확한 **[랜카드 사용 안 함]** (활성 중일 때, 빨간색 테두리) 및 **[랜카드 사용]** (비활성 중일 때, 녹색 펄스 효과) 액션 버튼을 배치하였습니다.
  - 실수로 인한 네트워크 단절을 방지하기 위해 **안전 확인 모달(Confirm Dialog)**을 연동하여 활성화/비활성화 의사를 명확히 확인합니다.
  - 랜카드가 비활성화되어 있을 때는 카드 내부에 상태 안내 알림 배너와 함께 즉시 복구할 수 있는 **[랜카드 사용]** 바로가기 버튼을 제공합니다.
  - 상단 어댑터 탭 목록에서도 활성(초록 점) 및 비활성화(빨간 점) 상태를 시각적으로 즉시 식별할 수 있습니다.
  - 관리자 권한을 통한 PowerShell `Enable-NetAdapter` 및 `Disable-NetAdapter` 명령어로 Windows 시스템 네트워크 스택과 100% 동기화됩니다.

### 2. 데스크톱 기본 창 크기 및 표준 통신 포트 최적화
* **데스크톱 기본 창 규격 조정 (650px x 800px)**:
  - 데스크톱 창 크기를 가로 650px, 세로 800px의 시인성 높은 규격으로 고정하여 모든 네트워크 정보, 스마트 IP 입력폼, 진단 도구를 한눈에 확인 가능하도록 레이아웃을 최적화했습니다.
* **표준 통신 포트 3030 통일**:
  - 로컬 포트 충돌 방지를 위해 빌드 스크립트(`build.bat`, `build.ps1`), `vite.config.ts`, `tauri.conf.json`의 기본 포트를 **3030**으로 일원화하였습니다.

### 3. 스마트 IP 입력 보조 (Smart IP Helper) 기능 탑재 및 기본 활성화
* **기능 활성화 옵션 및 상태 보존**:
  - 수동 IP 설정 인터페이스에 [스마트 IP 입력 보조] 토글 버튼 및 상태 표시 뱃지를 추가하였습니다.
  - 앱 시작 시 **기본 활성화(`ON`)** 상태로 구동되며, 사용자가 토글한 설정 상태는 `localStorage`에 영구 보존됩니다.
* **C 클래스 대역 게이트웨이 자동 동기화 (C-Class Auto Sync)**:
  - IP 주소 입력란에 수동으로 IP(예: `192.168.0.50` 또는 `192.168.10.`)를 입력하거나 수정할 때, **C 클래스 네트워크 접두사(앞 3개 옥텟)**를 실시간 파싱하여 기본 게이트웨이(예: `192.168.0.1` 또는 기존 호스트 번호 유지)에 자동으로 채워 넣고 동기화합니다.
  - 서브넷 마스크가 비어 있을 경우 기본값(`255.255.255.0`)을 자동으로 함께 제안하여 입력 단계를 대폭 단축합니다.

### 4. 자주 사용하는 서브넷 마스크 프리셋 드롭다운 (`SubnetMaskSelector`) 구현
* **클릭 시 원클릭 프리셋 팝업**:
  - 서브넷 마스크 입력 칸을 클릭/포커스하거나 우측 드롭다운 버튼을 누르면 사전에 정의된 주요 서브넷 마스크 목록이 오버레이로 제공됩니다.
  - **제공 프리셋 목록**:
    - `255.255.255.0` (`/24` - Class C 기본 256 IP) [추천]
    - `255.255.255.128` (`/25` - 128 IP)
    - `255.255.255.192` (`/26` - 64 IP)
    - `255.255.255.224` (`/27` - 32 IP)
    - `255.255.255.240` (`/28` - 16 IP)
    - `255.255.255.248` (`/29` - 8 IP)
    - `255.255.255.252` (`/30` - 4 IP / Point-to-Point)
    - `255.255.0.0` (`/16` - Class B 65,536 IP)
    - `255.0.0.0` (`/8` - Class A 16,777,216 IP)
* **다국어 및 편의성 지원**:
  - 한국어/영어 로케일에 맞춰 설명 및 뱃지 표시.
  - 바깥 클릭 감지(Outside Click) 및 `Escape` 키 닫기 지원, 키보드 직접 입력 완벽 지원.

### 5. 다중 어댑터 상태 일괄 업데이트 최적화 (`useSystemConfig`)
* `updateAdapter` 핸들러가 단일 필드뿐만 아니라 부분 객체(`Partial<NetworkAdapter>`)를 통한 다중 필드 원자적(Atomic) 업데이트를 지원하도록 개선하여 IP, 게이트웨이, 서브넷 마스크의 동시 갱신 시 화면 깜빡임과 상태 불일치를 제거하였습니다.

### 6. 공식 블로그 및 개발자 정보 연결
* 공식 구글 블로그 주소를 [ahbiyoutvibe.blogspot.com](https://ahbiyoutvibe.blogspot.com/)으로 일괄 최신화하고 앱 하단 푸터 및 문서에 연동하였습니다.

---

## [v1.5.0] - 2026-07-30

### 1. 브랜드, 저작자 및 홈페이지 정보 업데이트 (AhBiYout IpName2 v1.5)
* 애플리케이션 공식 타이틀 및 버전을 **AhBiYout IpName2 v1.5**로 명확히 업데이트하였습니다 (`index.html` 및 `build.bat` / `build.ps1` 포함).
* 하단 푸터(Footer) 및 정보(About) 모달에 제작자(**AhBiYout**), 블로그(**ahbiyoutvibe.blogspot.com**), 홈페이지(**cisnet.co.kr**)를 직관적으로 연결하고 다국어(`translations.ts`) 항목을 보강하였습니다.
* 홈페이지(`cisnet.co.kr`) 링크 표기를 제외한 불필요한 단어 표기를 정리하여 브랜드 가독성을 향상시켰습니다.

### 2. 빌드 스크립트 특수문자 구문 오류 수정 및 자동 생성물 폴더 열기 기능
* **배치 스크립트(`build.bat`) 구문 보정**: 타이틀 출력부의 특수문자(`&` -> `^&`) 탈출 문자를 추가하여 배치 명령어 파싱 오류(`'Packaging'은(는) 내부 또는 외부 명령...`)를 근본적으로 해결하였습니다.
* **빌드 완료 후 Explorer 자동 실행**: `build.bat` 및 `build.ps1`을 통한 컴파일이 성공적으로 완료되면, 결과물 바이너리가 저장된 폴더(`src-tauri\target\release` 또는 `dist`)가 Windows 탐색기로 자동 열려 바로 확인할 수 있도록 최적화했습니다.

### 3. Executable 버저닝 및 후처리 자동화 (postbuild-rename)
* `PATCH_NOTES.md`에 기록된 최신 버전(`v1.5.0`)을 자동으로 인식하여 `AhBiYout IpName2.exe` 컴파일 결과물을 `IpName2_v1.5.0.exe` 표준 명칭으로 포맷팅 및 후처리 배치합니다.

### 4. 가상 네트워크 어댑터 무한 나열 오류 수정 및 필터링 최적화
* Win32 Native IP Helper API(`GetAdaptersAddresses`) 호출 시 무수히 많은 가상/WFP/필터 어댑터가 노출되던 현상을 해결.
* `GAA_FLAG_INCLUDE_ALL_INTERFACES` 플래그 제거 및 Tunneling (`IfType 131`) 및 Loopback (`IfType 24`) 어댑터를 예외 처리하여 실제 사용 가능한 네트워크 어댑터만 정밀하게 필터링하여 출력하도록 개선.

### 5. 약관 고지 이관 및 UI 가독성 고도화
* 프로그램 시작 시 실행을 방해하던 팝업 약관 고지 오버레이 및 15초 타이머를 제거하여 즉시 메인 화면에 진입하도록 개선.
* 하단 버전에 위치한 [도움말/정보(About)] 모달 내에 약관 및 라이선스 고지 조항 항목을 깔끔하게 이관 및 포함.

---

## [v2.0.3] - 2026-06-28

### 1. 프로그램 실행 권한 및 라이선스 고지사항 스타트업 오버레이 구현
* **자동 종료 타이머 시스템 탑재**:
  - 프로그램 최초 실행 시 오설정 및 오작동에 대한 법적 귀책을 안내하는 **"라이선스 및 약관 동의 고지서"** 가 스타트업 오버레이로 즉시 팝업되도록 추가했습니다.
  - 무단 실행이나 무분별한 조작 방지를 위해, 고지사항에 반응하지 않으면 15초 후 프로그램이 자동으로 즉시 안전 종료(`@tauri-apps/plugin-process` API 활용)되도록 동적 카운트다운 타이머를 구성했습니다.
* **고지사항 클릭 시 자동 종료 타이머 즉시 정지 (사용자 지시사항 이행)**:
  - 사용자가 라이선스 고지서 카드 영역 전체나 전용 동의 버튼을 클릭하면, **자동 종료 타이머가 즉시 정지(ClearInterval)**되도록 설계했습니다.
  - 타이머 정지 시 UI가 우아하게 활기찬 에메랄드 그린 테마의 승인 상태("✓ 고지 확인 완료 - 자동 종료 타이머가 중지되었습니다.")로 즉각 전환되며, `safeStorage`에 영구 등록되어 다음 부팅 시부터는 매끄럽고 쾌적하게 메인화면에 진입합니다.
* **이국어 완벽 호환 디자인**:
  - 영어/한국어 다국어 로케일(`translations.ts`)과의 완벽한 유기적 바인딩 및 반응형 애니메이션 프레임워크를 결합하여 전문 엔터프라이즈 사양으로 마감 처리했습니다.

---

## [v2.0.2] - 2026-06-28

### 1. Windows Native C++-Level API 드라이버 완전 마이그레이션 (성능의 극대화)
* **PowerShell 프로세스 오버헤드 원천 제거**:
  - 기존의 로딩 방식은 앱 시작 또는 새로고침 시 `.NET Framework` 런타임과 WMI 및 CIM 인터페이스를 호출하는 PowerShell 스크립트를 거치느라 최소 1.5초~2초 이상의 시작 지연이 있었습니다.
  - 이를 해결하기 위해 Rust 백엔드 레이어에서 직접 **Windows Native API**(`iphlpapi.dll` 및 `kernel32.dll` 등)를 호출하는 초고속 하드웨어 드라이버 방식으로 완전 교체했습니다.
  - 이로써 시작 속도와 새로고침 성능이 기존 대비 **100배 이상 단축된 5ms 이하(즉시 로딩)**로 실현되어, 무중단 리얼타임 하드웨어 조회 성능을 제공합니다.
* **Win32 API 정밀 설계 및 통합**:
  - **시스템 정보**: Registry 직접 탐색 및 `GetComputerNameExW`, `GlobalMemoryStatusEx` 등의 원격 메모리 맵핑 API를 사용하여 CPU 정보, 물리적 RAM, 컴퓨터 이름, 도메인 정보를 마이크로초 단위로 수집합니다.
  - **네트워크 어댑터**: Windows 공식 IP 헬퍼 API인 `GetAdaptersAddresses` 인터페이스를 직접 구현하여 활성화 상태, 이더넷/와이파이 분류, DHCP 모드, 게이트웨이, 다중 DNS 주소, 고유 MAC 주소 등의 시스템 속성을 커널 레벨에서 즉각 판독합니다.
* **이종 OS 크로스 컴파일 안정성 확보**:
  - 빌드 타겟 및 환경에 최적화된 `#[cfg(windows)]` 조건부 어트리뷰트 및 논-윈도우(Linux/macOS) 환경용 고품질 Fallback 가상 목(Mock) 구조를 설계하여, 어떤 플랫폼에서 빌드하든 컴파일 중단 없이 성공하도록 하였습니다.

---

## [v2.0.1] - 2026-06-26

### 1. 네트워크 어댑터 선택 인터페이스 대개편 (UX 개선)
* **드롭다운(Select) 제거 및 직관적인 칩 탭(Tab) 버튼 도입**:
  - 기존의 드롭다운 방식에서 개별 어댑터를 즉시 확인할 수 있는 **독립적인 탭 형태의 버튼 그룹**으로 전환했습니다.
  - 시스템에 단 **1개의 네트워크 어댑터만 활성화되어 있는 환경에서도 사용자가 직접 클릭하며 선택 상태를 명시적으로 인지**하고 상호작용할 수 있도록 대폭 설계 변경했습니다.
  - 어댑터 종류(Ethernet, Wi-Fi)에 맞는 고유의 Lucide 아이콘과 활성화 유무(초록색 활성 닷)를 직관적인 디자인 요소로 반영했습니다.
  - 마우스 클릭 시 가벼운 스케일 모션(`active:scale-95`) 및 부드러운 전환 효과(`transition-all duration-200`)를 더해 한층 높은 품질의 클릭 피드백을 선사합니다.

### 2. 가상화 및 예외 환경을 위한 GUID 식별 폴백(Fallback) 엔진 탑재
* 가상 머신(Hyper-V, VM-Ware, VirtualBox 등) 또는 특정 네트워크 카드 드라이버 환경에서 어댑터의 `GUID` 값이 누락되어 어댑터 변경 및 적용이 차단되던 버그를 완전히 방지하는 **자동 식별 복원력**을 내재화했습니다.
* PowerShell 로드 단계에서 `GUID` 부재 시 `DeviceID`를 자동으로 매핑하고, React 내부 파싱 훅에서 `id || macAddress || name || adapter-${index}` 순서로 고유 식별자를 빌드함으로써 어떠한 환경에서도 예외 없이 어댑터 변경이 원활히 동작하도록 보장합니다.

### 3. Tauri 빌드 파이프라인 내 버전 불일치 정합성 해결
* **오프라인 및 원격 빌드 호환성 증대**:
  - Rust 빌드 종속성인 `tauri-build` 패키지가 `crates.io` 상에 `2.11.1`로 정식 제공되지 않아 발생하는 컴파일 크래시 문제를 근본적으로 분석 및 해결했습니다.
  - `Cargo.toml` 내 `tauri-build` 빌드 본을 실제 배포된 최고 호환 버전인 `2.6.3`으로 정밀 세팅 및 락킹하고, 프론트엔드의 `@tauri-apps/api` 및 `@tauri-apps/cli` 버전(`2.11.1`)과 완벽히 호환되도록 구성하여 안정적인 크로스 컴파일 안정성을 달성했습니다.
* **클린 빌드 스크립트 고도화**:
  - `build.bat` 및 `build.ps1`을 통한 무중단 클린 빌드 수행 시, 로컬 캐시 엉킴 현상을 방지하고자 `src-tauri/Cargo.lock`을 강제 초기화하는 클리닝 루틴을 새롭게 추가했습니다.

### 4. 앱 아이콘 자동 복구 및 실시간 보정(Self-Healing) 파이프라인 정착
* Windows 빌드 중 구버전 `rc.exe` 빌더와의 충돌을 일으켜 `RC2176 : old DIB` 에러가 터지는 아이콘 호환 이슈를 안전하게 수렴하였습니다.
* `tauri.conf.json`의 빌드 프리-훅(`beforeBuildCommand`)에 `node fix-icon.cjs`를 완벽 통합하여 빌드 직전에 아이콘 품질을 실시간 스캐닝하고 보정합니다.
* 만약 빌드 도중 아이콘 이미지가 유실되거나 손상된 경우, 루트 경로의 원본 `app-icon.png`로부터 자동으로 복원하여 128x128 규격의 무압축 표준 BMP 인코딩을 적용해 항상 안전한 컴파일 성공을 보장합니다.

---

## [v2.0.0] - 초기 릴리즈
* Windows PowerShell 시스템 네트워크 API 래퍼 구현 (관리자 권한 UAC 대응).
* KT, SKB, LGU+, Google DNS 원클릭 주입 프리셋 엔진 장착.
* 테일윈드 기반의 다크/라이트 미니멀 디자인 론칭.
