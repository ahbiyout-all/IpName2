# IP Name 앱 패밀리 표준 업그레이드 작업 지시서 (AI Work Instruction)

본 문서는 **AhBiYout IpName2**의 검증된 고성능 아키텍처, 순수 창작 C DLL, Windows 네이티브 네트워크 제어 로직, GitHub Actions CI/CD 및 저장소 화이트리스트 관리 체계를 다른 IP Name 프로젝트나 신규 파생 앱에 동일하게 적용하기 위해 작성된 **AI 전용 작업 지시 프롬프트 및 기술 표준 가이드**입니다.

---

## 📋 1. 다른 AI에게 바로 전달하는 통합 작업 지시 프롬프트 (Copy & Paste AI Prompt)

> **사용 방법**: 아래 인용 블록 전체를 복사하여 대상 프로젝트의 AI 코딩 어시스턴트(Claude, GPT, Gemini 등)에게 프롬프트로 전달하세요.

```markdown
# [작업 지시서] IP Name 애플리케이션 최신 표준 아키텍처 및 파이프라인 전면 업그레이드

당신은 Windows 시스템 및 네트워크 어댑터 관리 유틸리티 개발의 시니어 시스템 엔지니어입니다.
본 프로젝트를 'AhBiYout IpName2 v1.12.x'의 검증된 기술 표준과 아키텍처에 맞춰 전면 업그레이드하세요.
아래의 7대 핵심 원칙과 세부 구현 요구사항을 한 단계도 빠짐없이 철저히 구현해야 합니다.

---

### [원칙 1] 프로젝트 핵심 불변 사양 준수
1. **창 크기**: 가로(Width) 650px x 세로(Height) 800px (고정 크기, 단일 화면 내 모든 컨트롤 시인성 최적화, 스크롤 피로도 제거).
2. **통신 및 개발 포트**: 3030 (`vite.config.ts`, `tauri.conf.json`, `build.bat`, `build.ps1` 통일).
3. **공식 메타데이터**:
   - 제작자: AhBiYout (GitHub: https://github.com/ahbiyout-all)
   - 공식 블로그: https://ahbiyoutvibe.blogspot.com/
   - 소속: 씨아이에스넷 (https://www.cisnet.co.kr)
   - 라이선스: MIT License

---

### [원칙 2] 순수 창작 C 네이티브 DLL (`ipname_core.dll`) 탑재 및 본인 MAC 오탐 차단
1. `native/ipname_core/` 디렉터리에 ISO C99 기반 순수 Win32 DLL 소스를 구성할 것.
   - 외부 런타임 종속성 없이 `iphlpapi.lib`, `ws2_32.lib`만 링크하여 컴파일(MinGW GCC 또는 MSVC).
2. **Layer-2 ARP IP 충돌 검사 (`IpName_CheckIpConflictEx`)**:
   - `SendARP` API를 호출하되, Windows IP 스택이 본인 랜카드의 IP에 대해 본인 MAC 주소로 응답하는 **자체 충돌(Self-Conflict) 오탐 결함을 원천 차단**할 것.
   - 함수 시그니처에 `const char* own_mac` 파라미터를 추가하여 ARP 응답 MAC과 대조하고, 본인 MAC인 경우 `is_conflict: false` 및 정상 사용으로 판정할 것.
3. **인프로세스 ICMP Echo Ping (`IpName_PingIcmpNative`)**:
   - 외부 `ping.exe` 프로세스를 띄우지 않고 `IcmpSendEcho` API를 인프로세스로 직접 호출하여 지연시간 1ms 미만의 초고속 응답 보장.
4. **넌블로킹 TCP 포트 진단 및 32비트 고속 서브넷 비트 연산기** 내장.

---

### [원칙 3] 어댑터 및 IP 자동 정렬 알고리즘 (`useSystemConfig.ts`)
1. **IPv4 Primary(기본) IP 우선순위 강제 정렬**:
   - 복수의 IP가 바인딩된 어댑터에서, 기본 게이트웨이(Default Gateway)와 서브넷이 일치하는 IPv4 또는 DHCP로 할당된 공인/사설 IP를 무조건 최우선(`ipAddress`, Primary)으로 강제 정렬할 것.
   - 임의의 보조 정적 IP나 링크 로컬 주소(`169.254.x.x`)가 기본 IP 위치를 점유하지 못하도록 차단하고, 이들은 보조 IP(`secondaryIps`) 목록으로 자동 배치할 것.
2. **어댑터 목록 우선순위 렌더링**:
   - 활성화된 물리 이더넷 ➔ 게이트웨이가 연결된 어댑터 ➔ Wi-Fi ➔ 가상 어댑터 순으로 정렬하여 UI 상단에 노출.

---

### [원칙 4] 물리 vs 가상 이더넷 이중 식별 및 엄격 필터링
1. **Win32 + NDIS 커널 2단계 판별**:
   - `GetAdaptersAddresses`의 `OperStatus == 6 (IfOperStatusNotPresent)` 유령 어댑터를 즉시 차단.
   - PowerShell `Get-NetAdapter`의 `.Virtual == true` 플래그 및 하드웨어 제조사 OUI 대조.
2. **UI 탭 필터링 엄격성**:
   - [물리 어댑터], [가상 어댑터], [전체] 세그먼트 탭 전환 시, 물리 어댑터 탭에 가상 어댑터가 단 하나도 혼입되지 않도록 순수 분리 배열(`physicalAdapters`, `virtualAdapters`)만 독립 렌더링.

---

### [원칙 5] Tauri v2 백엔드 안정화 (Zero Warnings & Schema Fix)
1. `src-tauri/tauri.conf.json`:
   - `bundle.windows` 내부의 비표준 `staticVCRuntime` 필드를 제거할 것 (스키마 오류 방지).
   - `src-tauri/build.rs`에서 `tauri_build::WindowsAttributes::new().static_vc_runtime(true)`를 통해 네이티브 정적 링크를 보장할 것.
2. `src-tauri/src/windows_native.rs`:
   - 프론트엔드 camelCase 직렬화를 위한 구조체 필드에 `#[allow(non_snake_case)]`를 선언하여 Rust 컴파일러 경고를 0건(Clean Compile)으로 만들 것.

---

### [원칙 6] GitHub Actions CI/CD Node.js 24 런타임 전면 마이그레이션 & 자동 릴리스
1. `.github/workflows/release.yml`:
   - GitHub Actions 러너의 Node 20 EOL 정책에 맞춰 최신 액션으로 전면 승급:
     * `actions/checkout@v5`
     * `actions/setup-node@v5` (앱 빌드 환경은 Node.js 22 LTS 지정)
     * `softprops/action-gh-release@v3`
   - 러너 환경 변수 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` 명시.
2. **듀얼 푸시 트리거 구성 (AI Studio 동기화 호환)**:
   - 트리거에 `branches: [ main ]` 및 `tags: [ 'v*' ]`, `workflow_dispatch`를 모두 등록할 것.
   - 웹(AI Studio)에서 `main` 브랜치로 커밋이 푸시될 때도 GitHub Actions가 자동으로 즉시 실행되어 Inno Setup 인스톨러(`_Setup.exe`)를 빌드하고 GitHub Releases에 자동 등록하도록 구성할 것.

---

### [원칙 7] 빌드 핵심 파일 화이트리스트 및 로컬 푸시 스크립트 격리
1. **`.gitignore` 및 `.gitkeep-ignore` 전면 개편**:
   - 불필요한 파일(`node_modules/`, `bun.lock*`, `yarn.lock`, `dist/`, `target/`, `Output/`, `*.exe`, `*.dll`, `*.log`, `*.tmp`, `.idea/`, `.vscode/*`, `.fleet/`, `.claude/`, `.cursor/`, `.aistudio/`)을 원천 차단.
   - 로컬 푸시 스크립트(`git-push.bat`, `scripts/git-push.bat`, `*git-push*.bat`)를 `.gitignore`에 등록하여 GitHub 원격 저장소 업로드에서 안전하게 격리.
2. **동적 버전 푸시 스크립트 (`git-push.bat`)**:
   - `package.json`에서 버전을 동적 추출하고, `git branch -M main` 보정, author 자동 설정(`AhBiYout`), 스테이징 전 자체 캐시 제거(`git rm --cached git-push.bat`), 커밋, `v%APP_VER%` 태그 생성 및 푸시 완결.
   - 배치 파일 내 앰퍼샌드는 반드시 `^&`로 이스케이프하고, 괄호 충돌을 방지하기 위해 라벨 분기(`goto :push_failed`)를 사용할 것.
3. **핵심 파일 감사 도구**:
   - `scripts/github/core-manifest.json` 및 `scripts/github/verify-core-files.cjs`를 통해 34개 필수 빌드 파일 무결성 및 금지 파일 자동 정화(`--clean`) 체계를 구축할 것.

---

### [원칙 8] Semantic Versioning (3단계) 및 삼중 동기화(Triple Lockstep)
1. 코드 수정 시 반드시 버전을 승급할 것 (`MAJOR.MINOR.PATCH`).
2. **삼중 동기화 (Triple Lockstep)** 필수:
   - `package.json`의 `"version"`
   - `src-tauri/tauri.conf.json`의 `"version"` 및 `"productName"`
   - `docs/PATCH_NOTES.md` 최상단 헤더 (`## [vX.Y.Z] - YYYY-MM-DD`)
   - `src-tauri/Cargo.toml`, `native/ipname_core/src/ipname_core.c` 버전 매크로 동시 갱신.
3. `docs/DEVELOPMENT.md`, `docs/ARCHITECTURE.md`, `docs/README.md` 문서를 실시간 동기화할 것.
```

---

## 🏗️ 2. 핵심 모듈별 구현 상세 명세 (Deep-Dive Specifications)

### 2.1. 순수 창작 C DLL (`ipname_core.dll`) - 본인 MAC 충돌 오탐 방어
Windows 네이티브 환경에서 `SendARP` API는 로컬 어댑터에 이미 할당된 IP를 질의할 경우 자신의 랜카드 MAC으로 즉각 응답합니다. 이를 외부 IP와의 중복으로 오인하지 않도록 `IpName_CheckIpConflictEx`를 구현합니다.

```c
// native/ipname_core/include/ipname_core.h
IPNAME_API int IpName_CheckIpConflictEx(
    const char* ip_address,
    const char* own_mac,          // 로컬 어댑터 본인의 MAC (예: "18:C0:4D:7F:68:08")
    char* conflict_mac_out,
    size_t mac_out_size,
    int timeout_ms
);
```

```c
// native/ipname_core/src/ipname_core.c 내부 검증 로직
if (own_mac && own_mac[0] != '\0') {
    if (mac_equals_ci(mac_str, own_mac)) {
        // 본인 랜카드가 응답한 것이므로 외부 충돌이 아님 (정상 사용 중)
        return 0; // NOT conflicted
    }
}
```

### 2.2. IPv4 Primary IP 우선순위 강제 정렬 (`src/hooks/useSystemConfig.ts`)
단일 어댑터에 여러 IP가 바인딩된 경우, 기본 게이트웨이와 통신 가능한 IP가 메인 IP(`ipAddress`)가 되도록 정렬합니다.

```typescript
function sortAdaptersAndEnforcePrimaryIp(adapters: NetworkAdapter[]): NetworkAdapter[] {
  return adapters.map(adapter => {
    if (!adapter.secondaryIps || adapter.secondaryIps.length === 0) return adapter;

    const allIps = [
      { ip: adapter.ipAddress, mask: adapter.subnetMask },
      ...adapter.secondaryIps.map(s => ({ ip: s.ipAddress, mask: s.subnetMask }))
    ].filter(item => item.ip && item.ip !== '0.0.0.0');

    // 1순위: 기본 게이트웨이의 C클래스 서브넷과 일치하는 IP
    // 2순위: 169.254.x.x(링크 로컬)가 아닌 유효 사설/공인 IP
    let primary = allIps.find(item => isGatewaySubnetMatch(item.ip, adapter.gateway));
    if (!primary) {
      primary = allIps.find(item => !item.ip.startsWith('169.254.')) || allIps[0];
    }

    const secondaries = allIps
      .filter(item => item.ip !== primary.ip)
      .map((item, idx) => ({ id: `sec-${idx}`, ipAddress: item.ip, subnetMask: item.mask }));

    return {
      ...adapter,
      ipAddress: primary.ip,
      subnetMask: primary.mask,
      secondaryIps: secondaries
    };
  });
}
```

### 2.3. GitHub Actions 최신 Node.js 24 규격 워크플로 (`.github/workflows/release.yml`)
GitHub Actions 러너의 EOL 경고를 방지하고, 웹 UI 동기화(`main` 브랜치)와 태그 푸시(`v*`) 모두에서 동작하도록 구성합니다.

```yaml
name: Release & Packaging Pipeline

on:
  push:
    branches:
      - main     # Google AI Studio 등 웹 동기화 시 자동 빌드 & 패키징
    tags:
      - 'v*'     # 로컬 git-push.bat 실행 시 정식 릴리스 태그 배포
  workflow_dispatch: # GitHub 웹 UI 수동 실행 지원

permissions:
  contents: write

jobs:
  build-and-release:
    name: Build & Package Windows Installer
    runs-on: windows-latest
    env:
      FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

    steps:
      - name: Checkout repository
        uses: actions/checkout@v5

      - name: Setup Node.js 22 LTS (Compliant with Node 20 EOL & Actions Node 24 Runtime)
        uses: actions/setup-node@v5
        with:
          node-version: 22

      - name: Install dependencies & Build
        run: |
          npm ci || npm install
          npm run build
          npm run tauri build

      - name: Compile Inno Setup Installer
        shell: cmd
        run: |
          "C:\Program Files (x86)\Inno Setup 6\iscc.exe" installer\setup.iss

      - name: Upload Installer Assets to GitHub Release
        uses: softprops/action-gh-release@v3
        if: startsWith(github.ref, 'refs/tags/v') || github.ref == 'refs/heads/main' || github.event_name == 'workflow_dispatch'
        with:
          name: "IpName2 v${{ steps.extract_version.outputs.version }}"
          tag_name: "v${{ steps.extract_version.outputs.version }}"
          files: dist-installer/*_Setup.exe
```

---

## 🛠️ 3. 파일 매니페스트 및 디렉터리 레이아웃 표준 (31 Core Files)

다른 프로젝트 구성 시 아래 31개 필수 파일 구조를 정확하게 유지해야 합니다:

```
IpName/
├── .github/workflows/release.yml         # CI/CD 자동 패키징 파이프라인
├── bin/postbuild-rename.cjs             # 빌드 후 실행파일 버전 명명 유틸리티
├── docs/                                # 공식 기술 문서 모음 (8개 필수 문서)
│   ├── README.md                        # 문서 색인 허브
│   ├── ARCHITECTURE.md                  # 시스템 아키텍처 명세서
│   ├── DEVELOPMENT.md                   # 개발 및 빌드 환경 가이드
│   ├── DLL_SPECIFICATION.md             # 순수 창작 DLL C-ABI 명세서
│   ├── LICENSE_NOTICE.md                # 라이선스 고지사항
│   ├── PATCH_NOTES.md                   # 버전별 패치 노트 (Triple Lockstep)
│   ├── ROADMAP.md                       # 로드맵
│   └── VERSIONING_POLICY.md             # 버전 관리 정책
├── installer/setup.iss                  # Inno Setup 6 전문 인스톨러 스크립트
├── native/ipname_core/                  # 순수 창작 C99 네이티브 DLL 소스
│   ├── include/ipname_core.h
│   ├── src/ipname_core.c
│   ├── build.bat
│   └── Makefile
├── scripts/github/                      # GitHub 핵심 파일 감사 및 동기화 도구
│   ├── core-manifest.json               # 34개 필수 빌드 파일 화이트리스트
│   ├── prepare-github-sync.bat          # 원클릭 감사 및 푸시 연동 스크립트
│   └── verify-core-files.cjs            # 스크래치 파일 자동 정화 및 무결성 검증기
├── src/                                 # React 19 프론트엔드 소스
├── src-tauri/                           # Tauri v2 데스크톱 백엔드 소스
├── .gitignore                           # 엄격 화이트리스트 기반 제외 규칙
├── .gitkeep-ignore                      # 스크립트 연동 클리닝 규칙
├── AGENTS.md                            # AI 코딩 어시스턴트 영구 지침
├── build.bat / build.ps1                # 포트 3030 통합 원클릭 빌드 스크립트
├── fix-icon.cjs                         # Windows 아이콘 규격 보정 스크립트
├── git-push.bat                         # 로컬 전용 동적 버전 자동 푸시 유틸리티 (Git 제외)
├── LICENSE                              # 루트 MIT 표준 라이선스 파일
├── package.json / package-lock.json     # Node.js 패키지 설정
├── README.md                            # GitHub 저장소 공식 루트 설명서
└── vite.config.ts / tsconfig.json       # 빌드 설정
```

---

## ✅ 4. 최종 무결성 검증 체크리스트

1. [ ] `npm run build` 및 `npm run lint` (`tsc --noEmit`) 에러 0건 확인.
2. [ ] `node scripts\github\verify-core-files.cjs --clean` 실행 시 34개 필수 파일 100% 정상 통과.
3. [ ] `git-push.bat` 및 `scripts/git-push.bat`이 `.gitignore`에 의해 Git 추적에서 제외되어 있는지 확인 (`git check-ignore -v git-push.bat`).
4. [ ] `package.json`, `tauri.conf.json`, `Cargo.toml`, `ipname_core.c`, `PATCH_NOTES.md` 버전 삼중 동기화 완료.
5. [ ] GitHub Actions 워크플로가 Node.js 24 규격(`actions/checkout@v5`, `setup-node@v5`, `action-gh-release@v3`)으로 설정되어 있는지 확인.
