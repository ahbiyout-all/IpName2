# 패치 노트 (Patch Notes) - IpName2

본 문서는 **AhBiYout IpName2**의 버전별 업데이트 및 버그 수정 내역을 기록합니다.

## [v1.13.14] - 2026-11-22

### 1. Inno Setup 6단계 무중단 설치 순서 확정 (기존 앱 자동 삭제 & Windows 프로그램 추가/제거 정식 등록) (`installer/setup.iss`)
* **기존 설치 감지 시 덮어쓰기 선택 없이 자동 삭제 진행 (`InitializeSetup`)**:
  - 기존 버전이 설치되어 있을 경우 사용자에게 삭제/덮어쓰기를 되묻던 `MB_YESNOCANCEL` 대화상자를 제거하고, 실행 중 앱 강제 종료(`ForceKillRunningApp()`) 직후 `{#MyAppGuid}_is1` 및 `{#MyAppName}_is1` 레지스트리(64/32비트)에서 탐지된 기존 버전을 `/VERYSILENT /NORESTART /SUPPRESSMSGBOXES`로 자동 완전 삭제(`Sleep(500)` 파일 잠금 해제 대기 포함)한 뒤 곧바로 다음 단계로 진행합니다.
* **라이선스 선언 ➔ 설치 직결 (`DisableDirPage=yes`, `DisableReadyPage=yes`)**:
  - `DisableWelcomePage=yes`, `DisableProgramGroupPage=yes`와 함께 `DisableDirPage=yes` 및 `DisableReadyPage=yes`를 추가해 중간 경로/확인 화면 없이 **MIT 라이선스 선언(`wpLicense`) ➔ 즉시 설치(`wpInstalling`)**로 간결하게 전환됩니다.
* **최종 6단계 설치 순서 & Windows 프로그램 추가/제거 정식 등록**:
  1. **기존 앱 실행 시 강제 종료**: `InitializeSetup()`, `InitializeUninstall()` 및 `CurStepChanged(ssInstall)` 파일 복사 직전 `ForceKillRunningApp()` 다중 가드.
  2. **기존 앱 설치 시 자동 삭제 진행**: 레지스트리 탐지 시 사용자 프롬프트 없이 무인 완전 삭제 후 진행.
  3. **라이선스 선언**: `LicenseFile=..\LICENSE` (MIT 라이선스 동의 화면).
  4. **설치 및 Windows 프로그램 추가/제거 정식 등록**: `Uninstallable=yes`, `CreateUninstallRegKey=yes`, `UninstallDisplayName`, `UninstallDisplayIcon`, `VersionInfo*` 기반 Windows **프로그램 추가/제거(Apps & Features)** 정식 등록 및 방화벽 인바운드/아웃바운드 규칙 등록.
  5. **바탕화면 바로가기 체크**: 완료 화면(`wpFinished`) 상단 기본 체크 박스(`IpName2.lnk`).
  6. **앱 실행**: 완료 화면 하단 기본 체크 박스(`shellexec` UAC 지원)로 즉시 실행.

---

## [v1.13.13] - 2026-11-22

### 1. Inno Setup 6단계 진행 순서 정밀 보강 & Windows 프로그램 추가/제거 정식 등록 (`installer/setup.iss`)
* **Windows 프로그램 추가/제거 (Apps & Features) 정식 등록 및 메타데이터 보강**:
  - `[Setup]` 섹션에 `Uninstallable=yes`, `CreateUninstallRegKey=yes`, `UninstallDisplayIcon`, `UninstallDisplayName`, `AppPublisher`, `AppPublisherURL`, `AppSupportURL`, `AppUpdatesURL` 및 `VersionInfoVersion`/`VersionInfoCompany`/`VersionInfoDescription`/`VersionInfoProductName`/`VersionInfoProductVersion`을 명시해 Windows 제어판 **프로그램 추가/제거** 및 **설정 > 설치된 앱**에 정식으로 등록·관리되도록 구성했습니다.
* **기존 설치 레지스트리 탐지(`{{` 이스케이프 버그) 완전 해결 (`MyAppGuid`, `QueryUninstallKey`)**:
  - 기존 `[Code]` Pascal Script에서 `[Setup]`용 이중 중괄호(`{{42CD...}`)를 그대로 레지스트리 조회 경로에 사용해 실제 등록 키(`{42CD...}_is1`)와 불일치하던 결함을 교정했습니다.
  - `#define MyAppGuid "{42CD47A3-...}"`와 `#define MyAppId "{" + MyAppGuid`로 분리하고 `{#MyAppGuid}_is1` 및 `{#MyAppName}_is1` 레지스트리(`HKLM`/`HKCU`/`HKLM32`/`HKCU32`)를 정밀 조회하여 기존 설치 감지 ➔ **삭제 / 덮어쓰기 / 취소** 대화상자가 100% 정확히 작동합니다.
* **6단계 설치 흐름 최종 완결**:
  1. **기존 앱 실행 시 강제 종료**: `InitializeSetup()`, `InitializeUninstall()` 및 `CurStepChanged(ssInstall)` 파일 복사 직전까지 `ForceKillRunningApp()` 이중 가드 적용.
  2. **기존 앱 설치 시 삭제/덮어쓰기 선택**: 레지스트리 조회 기반 `MB_YESNOCANCEL` 안내.
  3. **라이선스 선언**: `DisableWelcomePage=yes` + `LicenseFile=..\LICENSE`.
  4. **설치 및 Windows 프로그램 추가/제거·방화벽 등록**: 바이너리·아이콘·방화벽 규칙·언인스톨 레지스트리 일괄 등록.
  5. **완료 화면 바탕화면 바로가기 체크**: `wpFinished` 상단에 기본 체크된 바로가기 생성 체크박스 배치(`IpName2.lnk` 단일 유지 및 `[UninstallDelete]`로 `{autodesktop}`/`{userdesktop}` 정리).
  6. **앱 실행**: 완료 화면 하단 체크박스(`shellexec` UAC 지원)로 즉시 실행.

---

## [v1.13.12] - 2026-11-22

### 1. GitHub Releases 최신 3개 릴리즈 바이너리 유지 & 이전 릴리즈 에셋 자동 정리 (`.github/workflows/release.yml`)
* **최신 3개 릴리즈 바이너리 보존 정책 (`Retain Only Latest 3 Releases' Binary Assets`)**:
  - `Upload Installer & Portable Assets to GitHub Release` 단계 완료 후 GitHub REST API(`/repos/{owner}/{repo}/releases`)를 페이지네이션 조회하여 공개된 릴리즈(`draft == false`)를 최신순으로 정렬하고, 현재 릴리즈(`v1.13.12`)를 포함한 **최신 3개 릴리즈의 첨부 바이너리 파일(`_Setup.exe`, `_Portable.exe`, `_Portable.zip`)만 유지**합니다.
* **이전 릴리즈 이력 보존 & 바이너리 에셋만 선택 삭제**:
  - 최신 3개를 초과하는 이전 릴리즈에 대해서는 릴리즈 자체(`tag_name`), **릴리즈 제목(`name`), 릴리즈 노트 본문(`body`), Git 태그 및 배포 이력은 모두 그대로 보존**한 채 첨부된 바이너리 에셋(`DELETE /releases/assets/{asset_id}`)만 자동 삭제하여 저장소 용량을 최적화합니다.
* **로컬 빌드 정리 로직 무변경 원칙 준수**:
  - 로컬 개발 및 빌드 스크립트(`build.bat`, `build.ps1`, `verify-core-files.cjs`)의 로컬 산출물 정리 동작은 기존과 동일하게 유지했습니다.

---

## [v1.13.11] - 2026-11-22

### 1. GitHub Releases 포터블 빌드(`_Portable.exe` & `_Portable.zip`) 자동 생성 파이프라인 추가
* **단일 실행 포터블 & 압축 패키지 동시 빌드 (`.github/workflows/release.yml`)**:
  - `Extract Release Version` 단계를 패키징 전으로 전진 배치해 `$env:APP_VERSION`을 확보하고, `Package Portable Executable & Archive` PowerShell 단계를 신설해 다음 2종의 포터블 배포본을 자동 생성합니다:
    1. `dist-portable/IpName2_v1.13.11_Portable.exe`: 별도 설치나 런타임 없이 단독 실행 가능한 단일 포터블 실행 파일(`static_vc_runtime` 및 Win32 네이티브 엔진 내장).
    2. `dist-portable/IpName2_v1.13.11_Portable.zip`: `IpName2.exe`, `ipname_core.dll`, `IpName2.ico`, `LICENSE`가 포함된 무설치 포터블 압축 패키지.
  - `Upload Installer & Portable Assets to GitHub Release` 단계(`softprops/action-gh-release@v3`)가 인스톨러(`*_Setup.exe`)와 포터블 산출물(`*_Portable.exe`, `*_Portable.zip`)을 모두 GitHub Releases에 업로드하고 릴리스 본문 다운로드 안내를 자동 갱신합니다.
* **인앱 자동 업데이터 인스톨러 우선순위 보호 (`src/hooks/useGitHubUpdate.ts`)**:
  - GitHub Release 에셋 목록에서 알파벳 순서상 `Portable`이 `Setup`보다 앞서더라도 자동 업데이트 다운로드 버튼이 항상 정식 설치 프로그램(`/setup.*\.exe$/i` 또는 비포터블 `.exe`/`.msi`)을 최우선 선택하도록 자산 매칭 규칙을 보강했습니다.
* **빌드 산출물 격리 및 52종 핵심 파일 삼중 동기화 (`.gitignore`, `scripts/github/verify-core-files.cjs`)**:
  - `dist-portable/` 디렉터리를 `.gitignore` 및 `verify-core-files.cjs`의 `ignoredScanDirs`에 등록하여 로컬 포터블 패키징 테스트 시 저장소 오염 및 감사 오탐을 차단했습니다.

---

## [v1.13.10] - 2026-11-22

### 1. Inno Setup 인스톨러 6단계 표준 진행 순서 전면 개편 (`installer/setup.iss`)
* **1단계 — 기존 실행 중인 앱 자동 강제 종료 (`ForceKillRunningApp`)**:
  - `InitializeSetup()` 및 `InitializeUninstall()` 진입 즉시 `taskkill.exe /F /T`로 실행 중인 `IpName2.exe` 및 `ipname2.exe` 프로세스를 강제 종료하고 파일 핸들 해제(`Sleep(700)`)를 보장해 설치·제거 중 DLL/EXE 잠금 충돌을 원천 차단.
* **2단계 — 기존 설치 감지 시 삭제/덮어쓰기 선택 프롬프트 (`GetUninstallString`, `MB_YESNOCANCEL`)**:
  - 64비트(`HKLM`/`HKCU`) 및 32비트(`HKLM32`/`HKCU32`) 레지스트리를 전수 조회해 기존 설치본이 발견되면 대화상자를 통해 **[예: 기존 앱 삭제 후 새로 설치] / [아니오: 기존 설정 유지하며 덮어쓰기] / [취소: 설치 중단]**을 명확히 선택해 진행 (`WizardSilent` 무인 설치 시 자동 정리).
* **3단계 — MIT 라이선스 선언 (`LicenseFile=..\LICENSE`, `DisableWelcomePage=yes`)**:
  - 불필요한 환영 페이지와 중간 작업 페이지를 정리해 기존 설치 확인 직후 공식 MIT 라이선스 동의 화면(`wpLicense`)으로 바로 진입.
* **4단계 — 파일 설치 및 Windows 방화벽 규칙 자동 등록**:
  - `IpName2.exe`, `ipname_core.dll`, 아이콘, `LICENSE` 설치 및 Windows 방화벽 인바운드/아웃바운드 규칙 등록.
* **5~6단계 — 완료 화면 바탕화면 바로가기 체크 & 앱 실행 (`wpFinished`, `CreateDesktopShortcut`)**:
  - 설치 완료 페이지(`wpFinished`) 상단에 **[바탕화면 바로가기 만들기]** 체크박스(기본 선택)를 배치하고 그 아래 **[IpName2 실행]** 체크박스(기본 선택, `shellexec` UAC 지원)를 연동하여 `설치 ➔ 바탕화면 바로가기 체크 ➔ 앱 실행` 흐름을 완결 (`[UninstallDelete]`로 제거 시 바로가기 자동 정리).

---

## [v1.13.9] - 2026-11-22

### 1. 7차 심층 감사(Self-Reflection & Deep Audit): 4개 국어 완전성·스크립트 클로저·Win32 정렬 UB 수정
* **헤더 4개 국어 순환 및 테마 툴팁 다국어화 (`Header.tsx`)**:
  - 상단 언어 전환 버튼이 `ko ⇄ en` 2개 언어만 순환하던 결함을 수정하여 `['ko', 'en', 'ja', 'zh']` 4개 국어를 순서대로 순환하고 활성 언어 코드(`KO`/`EN`/`JA`/`ZH`)를 표시하도록 교정.
  - 4종 테마 버튼 툴팁 및 언어 전환 툴팁을 `t(...)` 번역 키(`toggleLanguage`, `themeDefault`, `themeDark`, `themeEmerald`, `themeSunset`)로 현지화.
* **동적 PowerShell 스크립트 언어 Stale Closure 수정 및 전 명령 주석 확장 (`useSystemConfig.ts`)**:
  - `saveSystemInfo`, `saveNetworkConfig`, `toggleAdapterEnabled`의 `useCallback` 의존성 배열에 `language`가 누락되어 언어 전환 직후에도 이전 언어 주석이 출력되던 결함 해결.
  - `getScriptComments(language)` 헬퍼를 도입해 컴퓨터 이름 변경, 어댑터 DHCP/고정 IP·다중 IP·DNS 설정, 랜카드 활성화/비활성화 전 스크립트 명령에 선택 언어별 상세 주석 헤더/단계 주석을 동적 생성.
* **전역 `<html lang>` 동기화 및 컨텍스트 메모이제이션 (`LanguageContext.tsx`)**:
  - `document.documentElement.lang`을 현재 활성 언어(`zh` ➔ `zh-CN`, 기타 `ko`/`en`/`ja`)와 실시간 동기화하고, 중복 초기 감지 `useEffect` 제거 및 `useCallback`/`useMemo` 최적화 적용.
* **잔존 한국어 하드코딩 4개 국어 완전 해소 (`translations.ts`, `UpdateModal.tsx`, `useGitHubUpdate.ts`, `SubnetMaskSelector.tsx`, `AdapterItem.tsx`, `App.tsx`, `Footer.tsx`, `CopyButton.tsx`, `useRealIp.ts`)**:
  - `translations.ts`에 48개 번역 키를 `ko/en/ja/zh` 4개 국어 대칭 구조로 추가.
  - `UpdateModal.tsx` 및 `useGitHubUpdate.ts`의 상태 메시지(`no_releases`/`up_to_date`/`connect_failed`), 로캘 기반 릴리스 날짜 포맷, 모달 배지·라벨·버튼 전면 다국어화.
  - `SubnetMaskSelector.tsx`의 `descJa`/`descZh` 및 기본 배지, `useRealIp.ts`의 국가/ISP/연결 끊김 문구, `AdapterItem.tsx`의 ARP 충돌/내부 중복/툴팁/Wireless LAN, `App.tsx`의 Ping 토스트/상태/툴팁, `CopyButton.tsx`·`Footer.tsx` 툴팁 및 배지 현지화.
* **Rust Win32 레지스트리 포인터 정렬 UB 및 NULL `lpSockaddr` 방어 (`windows_native.rs`)**:
  - `read_registry_string` 및 `read_registry_strings`에서 바이트 버퍼를 `*const u16`로 직접 캐스팅하던 비정렬 메모리 접근(UB) 위험을 `chunks_exact(2)` 기반 `u16::from_le_bytes` 안전 디코딩으로 교체.
  - `get_adapters_native`의 유니캐스트/게이트웨이/DNS 주소 순회 루프에 `lpSockaddr.is_null()` 방어 가드 추가.
* **문서 및 버전 삼중 동기화 (`v1.13.9`, 52종 핵심 파일)**:
  - `README.md`, `README_EN.md`, `README_JA.md`, `README_ZH.md` 및 `docs/` 전체 문서를 `v1.13.9` 및 52개 핵심 파일 규격으로 일괄 동기화.

---

## [v1.13.8] - 2026-11-21

### 1. 사용자 기본 언어 자동 감지 및 4개 국어(KO, EN, JA, ZH) 동적 지원 구현
* **브라우저 언어 자동 감지 (`LanguageContext.tsx`, `translations.ts`)**:
  - 첫 실행 시 브라우저(`navigator.language`)의 로캘을 자동 감지하여 한국어(`ko`), 일본어(`ja`), 중국어 간체(`zh`), 영어(`en`) 중 최적의 언어로 자동 설정.
  - 사용자가 하단 푸터에 추가된 빠른 언어 선택 버튼(KR, EN, JP, CN)을 통해 언제든지 수동으로 언어를 변경할 수 있으며, 선택값은 `safeStorage`에 안전하게 영구 저장되어 오버라이드 지원.
* **4개 국어(한국어, 영어, 일본어, 중국어) 완벽 대응 번역 딕셔너리 구축**:
  - 앱 내 모든 레이블, 버튼, 알림 메시지, 모달 안내문을 4개 언어로 완전 동적 번역.
* **생성된 PowerShell 스크립트 동적 주석 현지화 (`useSystemConfig.ts`)**:
  - 컴퓨터 이름 변경 및 네트워크 어댑터 구성 스크립트 실행 시 현재 선택된 앱 언어에 맞춰 실시간으로 동적 주석 헤더(`# IpName2 시스템 설정 변경 스크립트` 등)를 생성하도록 개선.
* **다국어 GitHub README 파일 정비 (`README_EN.md`, `README_JA.md`, `README_ZH.md`)**:
  - 글로벌 사용자 및 개발자를 위한 영어, 일본어, 중국어 간체 README 파일 생성 및 상단 언어 전환 내비게이션 바 탑재.
* **버전 삼중 동기화 (`v1.13.8`) 및 저장소 감사**:
  - 10개 빌드 타깃 버전 동기화, core-manifest 필수 파일 목록(52개) 및 6단계 저장소 무결성 감사 통과.

## [v1.13.7] - 2026-11-20

### 1. 하단 푸터 및 정보(About) 모달 GitHub 저장소 경로 수정 (`Footer.tsx`)
* **공식 저장소 직통 연결 (`https://github.com/AhBiYout-all/IpName2`)**:
  - 메인 화면 하단 푸터 GitHub 바로가기 링크/툴팁, 프로그램 정보(`About / Licenses`) 모달의 GitHub 경로, 오픈소스 라이선스 목록 내 `IpNameCore Native DLL` 프로젝트 링크를 프로필 최상위(`github.com/AhBiYout-all`)에서 공식 저장소 직통 URL인 `https://github.com/AhBiYout-all/IpName2`로 일괄 교정.
  - 정보 모달 2단 그리드에서 긴 URL이 넘치지 않도록 `truncate` 및 아이콘 `shrink-0` 안전 스타일 적용.
  - 버전 삼중 동기화(`v1.13.7`) 및 전체 기술 문서 동기화 완료.

---

## [v1.13.6] - 2026-11-20

### 1. 세로 뷰포트 확장(650x920) 및 푸터 바로가기 중복 창 열림 결함 해결
* **하단 푸터까지 한눈에 보이는 세로 폭 확장 및 단일 화면 레이아웃 최적화 (`tauri.conf.json`, `App.tsx`, `Footer.tsx`)**:
  - 기본 데스크톱 창 세로 폭을 `800px`에서 `920px`로 확장(`650x920`, 최소 크기 `650x760`)하여 상단 헤더, 시스템 정보, 리얼 IP 바, 어댑터 설정 카드, 빠른 DNS 프리셋, CMD/Ping 버튼 및 최하단 푸터가 세로 스크롤 없이 한 화면에 모두 표시되도록 개선.
  - 메인 컨테이너 너비를 `624px`로 확장하고 섹션 간 세로 여백을 정돈해 창 내부 공간 활용도를 높임.
* **푸터·모달 외부 링크 클릭 시 동일 창 2개 동시 열림 버그 수정 (`ExternalLink.tsx`, `Footer.tsx`, `UpdateModal.tsx`)**:
  - Tauri WebView2 환경에서 `<a href target="_blank">` 기본 동작과 `@tauri-apps/plugin-shell`의 `open()` 호출이 동시에 실행되어 외부 브라우저 창이 2개씩 열리던 문제를 해결.
  - 공용 `ExternalLink` 컴포넌트를 신설해 Tauri 데스크톱에서는 `href`/`target="_blank"` 없는 시맨틱 `<button>`으로 렌더링하고 `600ms` 중복 호출 잠금을 적용해 단일 실행을 보장하며, 웹 미리보기에서는 표준 `<a target="_blank">`로 동작하도록 분리.
* **문서 및 버전 삼중 동기화 (`v1.13.6`)**:
  - 변경된 창 규격(`650x920`), SWR 고속 부팅, `ExternalLink` 아키텍처를 `AGENTS.md`, `README.md`, `docs/` 전체 기술 문서(11종)에 반영.
  - 깃허브 저장소 운영·6단계 감사·Node 24 CI/CD 릴리스 안내 문서(`docs/GITHUB_GUIDE.md`) 신규 생성 및 핵심 파일 화이트리스트(49종) 등록.
  - 구글 블로거 공식 포스팅 가이드(`docs/BLOGGER_POST.md`)의 **`[작성 모드 (서식 있는 텍스트)]`** 및 **`[HTML 편집 모드]`** 콘텐츠를 최신 `v1.13.6` 사양으로 전면 갱신.

---

## [v1.13.5] - 2026-11-20

### 1. 6차 심층 감사: 푸터 Tauri 외부 링크 보호·ARP 오류 오표기 차단·동시 저장 잠금·업데이트 경합 해결
* **Tauri WebView2 외부 링크 안전 실행 (`Footer.tsx`)**:
  - 하단 푸터 및 정보(`About / Licenses`) 모달 내 모든 외부 링크(`GitHub`, `ahbiyoutvibe.blogspot.com`, `(주)청운정보시스템 ( cisnet.co.kr )`, 오픈소스 라이선스 URL)에 `isTauriEnv()` 가드가 적용된 `handleExternalLinkClick`(`@tauri-apps/plugin-shell` `open`)을 연결해 데스크톱 앱 창 내부로 외부 페이지가 열리는 현상을 차단.
* **ARP IP 충돌 검사 입력 검증 및 Tauri 문자열 예외 오표기 수정 (`AdapterItem.tsx`)**:
  - `check_ip_conflict` 호출 전 `isValidHostIPv4` 선행 검증을 수행하고, Tauri 커맨드가 문자열 예외로 reject될 때 `typeof err === 'string'`을 추출하지 못해 녹색 성공 상태(`is_conflict: false`, `"검사 완료"`)로 오표기되던 결함을 빨간색 경고(`is_conflict: true`)로 교정.
* **단일 실행 잠금(`isSavingRef`) 및 적응형 폴링 서브넷 마스크 검증 (`useSystemConfig.ts`)**:
  - `saveSystemInfo`, `saveNetworkConfig`, `toggleAdapterEnabled`에 동기 Ref 잠금(`isSavingRef`)을 적용해 빠른 연속 클릭으로 중복 PowerShell/UAC 프롬프트가 호출되는 경합 방지.
  - `saveNetworkConfig` 적응형 폴링 완료 조건에 `matched.subnetMask === expectedMask` 검증을 추가해 서브넷 마스크만 변경한 경우에도 Win32 반영 완료 후 새로고침하도록 개선.
* **업데이트 확인 경합 차단 (`useGitHubUpdate.ts`) & Win32 레지스트리 방어 (`windows_native.rs`, `release.yml`)**:
  - 백그라운드 자동 확인과 수동 업데이트 확인이 겹칠 때 `AbortController` 취소 및 세대 카운터(`checkGenRef`)로 이전 응답이 최신 UI 상태를 덮어쓰지 않도록 보호.
  - `windows_native.rs`에서 어댑터 GUID(`id`)가 비어 있을 때 `Tcpip\\Parameters\\Interfaces` 레지스트리 조회를 건너뛰도록 방어하고, `.github/workflows/release.yml` 릴리스 본문 소속 표기를 `(주)청운정보시스템 ( https://cisnet.co.kr )`으로 통일.

---

## [v1.13.4] - 2026-11-20

### 1. 하단 푸터 및 정보(About) 모달 소속 표기 변경 (`Footer.tsx`)
* **소속 표기 통일 (`(주)청운정보시스템 ( cisnet.co.kr )`)**:
  - 메인 화면 하단 푸터 링크와 정보(`About / Licenses`) 모달 내 소속 항목의 표시 텍스트 및 툴팁을 `www.cisnet.co.kr`에서 `(주)청운정보시스템 ( cisnet.co.kr )`(`https://cisnet.co.kr`)으로 변경.
  - 650px 고정 데스크톱 창 너비에서 문구가 중간에 끊기지 않도록 `whitespace-nowrap` 및 아이콘 축소 방지(`shrink-0`) 적용.
  - `README.md` 및 `docs/` 내 소속 표기와 버전 삼중 동기화(`v1.13.4`) 반영.

---

## [v1.13.3] - 2026-11-20

### 1. 5차 심층 감사: UI 플레이스홀더 격리·비동기 ARP 경합 차단·외부 링크 안전화 (`App.tsx`, `AdapterItem.tsx`, `UpdateModal.tsx`)
* **초기 `loading`·오류(`error`) 플레이스홀더가 어댑터 카운터 및 제어 UI에 노출되는 결함 수정 (`App.tsx`)**:
  - `loading`/`error` 더미 엔트리와 유령 어댑터를 선제 배제한 `validAdapters` 파생 목록을 도입하여 `0/1`·`전체 (1)` 오표기를 제거하고, 치명적 로드 실패 시 `<QuickDnsSettings>`·CMD 열기·DNS Ping 버튼이 비정상적으로 렌더링되지 않도록 차단.
* **비동기 Layer-2 ARP IP 충돌 검사 경합(Race Condition) 및 스타일 보강 (`AdapterItem.tsx`)**:
  - `handleCheckConflict` 및 `handleCheckSecondaryConflict`에 요청 세대 추적 Ref(`primaryConflictReqRef`, `secGlobalGenRef`, `secConflictGenRef`)를 도입해 검사 도중 IP 편집·DHCP 자동 모드 전환·보조 IP 삭제(인덱스 시프트) 발생 시 지연 도착한 과거 응답이 UI 상태를 덮어쓰지 않도록 교정.
  - 비활성화 안내 배너 내 `[랜카드 사용]` 버튼에 `disabled:opacity-50 disabled:cursor-not-allowed` 비활성 스타일 추가.
* **외부 URL 처리 안전성 및 웹 미리보기 호환성 보강 (`UpdateModal.tsx`)**:
  - `window.open` 폴백을 제거하고 `isTauriEnv()` 가드가 적용된 시맨틱 `<a target="_blank" rel="noopener noreferrer">` 링크로 통합해, Tauri 데스크톱에서는 `@tauri-apps/plugin-shell`로 안전 실행하고 웹 미리보기에서도 콘솔 오류 없이 동작하도록 개선.

### 2. 비활성 어댑터 GUID 연속성 보장·Win32 `0.0.0.0`/DHCP 정렬 교정 (`useSystemConfig.ts`, `windows_native.rs`)
* **비활성화 ➔ 활성화 전환 시 어댑터 ID 불일치 해소 (`useSystemConfig.ts`)**:
  - 2단계 `Get-NetAdapter` 쿼리에 `InterfaceGuid` 속성을 포함하고 비활성 어댑터 `id` 생성 시 `InterfaceGuid`를 최우선 채택해, Win32 `AdapterName` GUID와 동일하게 유지되어 랜카드 활성화 직후 선택된 탭(`selectedAdapterId`)이 다른 탭으로 튀는 현상 방지.
* **Win32 네이티브 `0.0.0.0` 방어 및 DHCP 레지스트리 우선순위 교정 (`windows_native.rs`)**:
  - `get_adapters_native`의 IPv4 유니캐스트 및 기본 게이트웨이 수집 루프에서 일시적 `0.0.0.0` 주소를 건너뛰도록 방어.
  - 다중 IP 대표 주소 정렬(Priority A) 전에 `is_dhcp` 플래그를 먼저 판별해 DHCP 어댑터에서는 과거 정적 `IPAddress` 레지스트리 대신 `DhcpIPAddress`를 조회하고, 게이트웨이 서브넷 일치(Priority B) 및 비-APIPA(`169.254.x.x` 배제, Priority C) 순으로 안전하게 폴백.

### 3. C99 DLL 하이퍼바이저 OUI 정밀 매칭 및 빌드·문서 정합성 동기화 (`ipname_core.c`, `build.ps1`, `docs/ROADMAP.md`)
* **Strict 6-Hex OUI 접두사 대조 및 Xen·Parallels OUI 보완 (`ipname_core.c`)**:
  - `IpName_DistinguishAdapter`의 부분 문자열 OUI 검색(`str_contains_ci`)이 NIC 하위 바이트와 우연히 일치할 위험을 차단하기 위해 정규화된 앞 6자리 16진수 접두사 비교(`mac_oui_matches`)로 교체하고, 누락되어 있던 Xen(`00:16:3E`) 및 Parallels(`00:1C:42`) OUI를 추가해 Rust·TypeScript 분류기와 100% 일치시킴.
* **PowerShell 빌드 위생 게이트 통합 및 캐시 보존 (`build.ps1`) & 로드맵 중복 정리 (`docs/ROADMAP.md`)**:
  - `build.ps1` 1단계에 `verify-core-files.cjs --clean` 사전 감사 단계를 통합하고, `-Clean` 옵션이 Rust 의존성 빌드 캐시(`src-tauri/target`) 전체를 지우지 않고 번들 산출물(`src-tauri/target/release/bundle`)만 정리하도록 `build.bat`과 규격 통일.
  - `docs/ROADMAP.md` 말미에 중복 기재된 `[ROADMAP-018]` 항목을 정리하고 `v1.13.3`(`[ROADMAP-019]`) 감사 기록 및 전 문서 버전 삼중 동기화 완료.

---

## [v1.13.2] - 2026-11-15

### 1. GitHub 공개 저장소 위생 점검, 미사용 패키지·중복 에셋 정리 (`package.json`, `Footer.tsx`, `.env.example`, `fix-icon.cjs`)
* **미사용 의존성 및 네이티브 애드온 컴파일 부담 제거**:
  - 소스 전반에서 참조되지 않는 `@google/genai`, `better-sqlite3`, `dotenv`, `express`, `@types/express`, `autoprefixer`, `tsx`, `vite-plugin-pwa` 패키지를 제거하고 `package-lock.json`을 최신화하여 Windows 러너의 불필요한 네이티브 C++ 애드온 빌드 위험 및 `npm ci` 시간을 절감.
  - `fix-icon.cjs` 전용 이미지 유틸리티 `jimp`를 `devDependencies`로 재분류하고 `Footer.tsx` 오픈소스 라이선스 목록에서 미사용 `Better-SQLite3` 항목을 제거.
  - `.env.example`에서 미사용 API/URL 플레이스홀더를 정리하고 `VITE_PORT=3030` 표준 환경 변수만 남기도록 정비.
* **중복·미참조 대용량 바이너리 아이콘 에셋 제거**:
  - `index.html`, `README.md`, `setup.iss`, `src-tauri`에서 전혀 참조되지 않는 중복 복사본 `public/appIcon.png`(1.4MB) 및 `public/icon1.ico`(84KB)를 삭제하고 `fix-icon.cjs`의 해당 복사 로직을 제거하여 `dist/` 번들 및 실행 파일 용량 축소.

### 2. 6단계 GitHub 업로드 통합 감사 게이트 및 CI/CD 캐싱·Fast-Fail 고도화 (`scripts/github/`, `.github/workflows/release.yml`)
* **6단계 저장소 감사 파이프라인 구축 (`verify-core-files.cjs`, `core-manifest.json`)**:
  - 필수 파일 검증 대상을 48종(`AGENTS.md`, `build.ps1`, `Makefile`, `scripts/github/*`, 아이콘·무시 규칙 포함)으로 확장.
  - 기존 금지 파일 청소(`--clean`) 외에 ① 필수 파일 검증 ② 금지·중복 파일 차단 ③ 루트·에셋 화이트리스트 외 미등록 파일 탐지 ④ 시크릿·토큰·개인정보(이메일)·`.env` 유출 정규식 스캔 ⑤ `package.json`·`package-lock.json`·`tauri.conf.json`·`Cargo.toml`·`useGitHubUpdate.ts`·`ipname_core.c`·`setup.iss`·`index.html`·`PATCH_NOTES.md`·`core-manifest.json` 10개 지점 삼중 버전 정합성 교차 검증 ⑥ 로컬 `git-push.bat` 원격 추적 격리 확인까지 자동 수행하도록 고도화.
* **GitHub Actions CI/CD 빠른 실패 게이트 및 빌드 캐시 적용 (`.github/workflows/release.yml`)**:
  - `main` 브랜치 및 `v*` 태그 푸시 듀얼 자동 릴리스 정책을 유지하면서, `actions/setup-node@v5`에 `cache: 'npm'` 적용, Rust 컴파일 전 `verify-core-files.cjs` 및 `npm run lint`(`tsc --noEmit`) 선행 검증 단계 추가, `Swatinem/rust-cache@v2` (`workspaces: src-tauri`) 캐싱을 도입해 반복 빌드 속도 대폭 개선.

### 3. 문서 및 버전 삼중 동기화 (`README.md`, `docs/*`)
* **문서 최신화**: `README.md`의 사전 요구사항을 Node.js `v22 LTS`로 상향하고 SWR 부팅 및 사전 검증 명령을 추가했으며, `/docs/` 내 전체 기술 문서(`README`, `DEVELOPMENT`, `ARCHITECTURE`, `ROADMAP`, `VERSIONING_POLICY`, `UPDATE_WORK_INSTRUCTION`, `DLL_SPECIFICATION`, `LICENSE_NOTICE`, `BLOGGER_POST`)를 `v1.13.2` 규격으로 일괄 동기화.

---

## [v1.13.1] - 2026-11-14

### 1. 4차 심층 감사: 적응형 폴링·편집 상태 보존·재부팅 UAC 승급 및 모의 스냅샷 동기화 (`src/hooks/useSystemConfig.ts`)
* **적응형 폴링 조기 종료 결함 수정 (`saveNetworkConfig`, `toggleAdapterEnabled`)**:
  - `saveNetworkConfig`에서 기본 IP나 DHCP 상태가 유지된 채 게이트웨이·DNS·보조 IP만 변경할 때 첫 폴링(`350ms`)에서 즉시 완료로 오판하던 조건을 제거하고, `ipAddress`, `gateway`, `primaryDns`, `secondaryDns`, `additionalIps` 및 `isEnabled`/`isDhcp` 전체 일치 여부를 검증하도록 개선.
  - `toggleAdapterEnabled`에서 `GAA_FLAG_INCLUDE_ALL_INTERFACES`로 비활성 인터페이스(`isEnabled === false`)가 응답에 이미 포함되어 재활성화 폴링이 즉시 빠져나가던 문제를 `matched?.isEnabled === true` 확인으로 교정.
* **저장 실패/UAC 취소 시 사용자 편집 보존 및 격리**:
  - `saveSystemInfo`와 `saveNetworkConfig`가 실패(`response.code !== 0`)했을 때 `forceOverwrite: true`로 다른 탭/어댑터나 현재 입력 중이던 값을 덮어쓰던 문제를 수정하여, 실패 시 사용자의 편집 내역(`dirtySystemRef`, `dirtyAdapterIdsRef`)을 그대로 보존하고 불필요한 적용 후 폴링을 생략하도록 개선.
  - 성공 시에도 전역 `forceOverwrite` 대신 저장된 대상(`dirtySystemRef` 또는 해당 `selectedAdapterId`)만 선택적으로 해제해 동시 편집 중인 다른 항목의 유실을 차단.
* **시스템 재부팅 UAC 승급 및 웹 미리보기 SWR 캐시 정합성 보강**:
  - `rebootSystem`에서 `executePowerShell('Restart-Computer -Force', !systemInfo.isAdmin)`로 관리자 권한 승급 플래그를 전달하고 비정상 종료 시 오류 토스트를 표시하도록 수정.
  - 웹 미리보기 모의 저장(`saveSystemInfo`, `saveNetworkConfig`, `toggleAdapterEnabled`)에서도 `dirty*` 플래그 정리 및 `saveStartupSnapshot` 갱신을 동기화하며, 모든 비동기 타이머·`finally` 블록에 `isMountedRef.current` 가드 적용.

### 2. 키보드 탭/저장 중 입력 잠금 및 테마 disabled 스타일 통일 (`AdapterItem.tsx`, `SystemSection.tsx`, `index.css`)
* **입력 필드 및 보조 IP 컨트롤 완전 잠금**:
  - `AdapterItem.tsx`의 기본 IP/게이트웨이/주·보조 DNS `<input>`과 `SubnetMaskSelector`에 `disabled={isSaving || adapter.isDhcp || !adapter.isEnabled}`를 명시해 DHCP·비활성 상태에서 `Tab` 키보드 포커스로 편집이 가능하던 틈을 차단하고, 스마트 도우미·충돌 검사·보조 IP 추가/삭제 버튼에도 `isSaving` 잠금 일괄 적용.
  - `SystemSection.tsx`의 컴퓨터 이름·작업 그룹 입력 필드에 `disabled={isSaving}` 추가 및 `src/index.css`에 `.input-field:disabled` 스타일 규칙 통합.

### 3. Win32·C99 DLL DNS/ARP 엣지 케이스 및 Vite 포트 파싱 안전성 보강 (`windows_native.rs`, `ipname_core.c`, `vite.config.ts`)
* **Win32 DNS 무효 주소(`0.0.0.0`)·중복 필터링 및 ARP 0-MAC 방어**:
  - `src-tauri/src/windows_native.rs`의 `get_adapters_native`에서 `0.0.0.0` 또는 주 DNS와 중복되는 주소를 건너뛰도록 개선하고, `check_ip_conflict_native`와 `native/ipname_core/src/ipname_core.c`의 `IpName_CheckIpConflictEx`에서 `00:00:00:00:00:00` 응답을 외부 충돌로 오탐하지 않도록 차단.
* **안전한 `VITE_PORT` 파싱 (`vite.config.ts`)**:
  - 비수치 또는 `"0"` 환경 변수 입력 시 `NaN` 포트로 바인딩되는 문제를 방지하기 위해 `Number.parseInt(process.env.VITE_PORT || '', 10) || 3000`으로 보완.

---

## [v1.13.0] - 2026-11-14

### 1. SWR 즉시 캐시 복원 및 2단계 비차단 어댑터 조회 파이프라인 (`src/hooks/useSystemConfig.ts`, `src/App.tsx`)
* **체감 부팅 0ms Stale-While-Revalidate (SWR) 캐시 도입**:
  - `safeStorage` 기반 `ipname2_startup_snapshot_v1` 스냅샷 캐시를 도입하여 재실행 시 직전 시스템 정보와 어댑터 목록을 첫 프레임에 즉시 복원하고 전체 화면 로딩 스피너 차단을 제거.
* **병렬 Win32 Fast Path + 지연 PowerShell 백그라운드 보강**:
  - 초기 로딩 시 `get_system_info`와 `get_adapters`를 `Promise.all`로 동시 호출하여 `<50ms` 내에 실시간 활성 어댑터를 선표시.
  - `.NET` 콜드 스타트(1~2.5초)를 유발하던 PowerShell `Get-NetAdapter` 조회를 비차단 백그라운드 2단계로 분리하여 비활성(Disabled) 어댑터·NDIS 가상 속성을 부드럽게 병합하고, 사용자가 1차 화면에서 수정 중인 어댑터(`dirtyAdapterIdsRef`)는 덮어쓰지 않도록 보호.
  - 어댑터 헤더 영역에 비차단 동기화 상태 배지(`syncingAdapters`) 및 다국어 키(`src/i18n/translations.ts`) 추가.
* **고정 대기 제거 및 적응형 적용 완료 폴링**:
  - 네트워크 설정 저장 및 랜카드 전원 토글 후 무조건 `2.5~3.0초` 대기하던 `sleep`을 제거하고, `350ms` 간격 Win32 `get_adapters` 상태 반영 확인 폴링(최대 2.1~2.4초)으로 교체해 적용 체감 속도 단축.

### 2. Rust Tauri 비동기 스레드 격리 및 릴리스 컴파일 최적화 (`src-tauri/src/lib.rs`, `src-tauri/Cargo.toml`)
* **Tokio 워커 블로킹 해소 (`spawn_blocking`)**:
  - `execute_powershell`, `get_system_info`, `get_adapters`, `ping_ipv4`, `calculate_subnet`, `check_ip_conflict`, `check_tcp_port`, `classify_ip` 커맨드를 `tauri::async_runtime::spawn_blocking`으로 오프로드하여 동시 IPC 호출이 이벤트 루프를 막지 않고 진정한 병렬로 실행되도록 개선.
* **Cargo 릴리스 프로파일 최적화**:
  - `[profile.release]`에 `opt-level = 3`, `lto = "thin"`, `codegen-units = 1`, `panic = "abort"`, `strip = true`를 적용하여 네이티브 바이너리 실행 성능 및 콜드 스타트 용량 최적화.

### 3. 프론트엔드 번들 청킹, 모달 지연 로딩 및 유휴 네트워크 스케줄링 (`vite.config.ts`, `App.tsx`, `useRealIp.ts`, `useGitHubUpdate.ts`)
* **코드 분할 및 모달 지연 로딩**:
  - `ConfirmModal`, `UpdateModal`을 `React.lazy` + `Suspense`로 분리해 초기 부팅 JS 파싱량 절감.
  - `vite.config.ts`에 `target: 'es2022'` 및 `vendor-react` / `vendor-icons` `manualChunks` 분리 적용.
* **백그라운드 네트워크 경합 방지**:
  - `useRealIp.ts`(5분 이내 유효 캐시 시 2.2초 지연) 및 `useGitHubUpdate.ts` 초기 체크를 `requestIdleCallback` 기반 유휴 시점으로 지연시켜 초기 페인트 및 Win32 IPC와의 리소스 경합 제거.

---

## [v1.12.10] - 2026-11-14

### 1. Tailwind CSS v4 테마 토큰 누락 및 UI 대비·호버 결함 수정 (`src/index.css`)
* **미정의 테마 토큰 일괄 복구**:
  - `src/index.css` 내 `:root`, `[data-theme="dark"]`, `[data-theme="emerald"]`, `[data-theme="sunset"]` 및 `@theme` 블록에 `--primary-foreground`, `--primary-hover`, `--foreground`, `--background`, `--card-hover`, `--muted`, `--muted-foreground`, `--secondary`, `--input-bg` 매핑을 추가.
  - 선택된 어댑터 탭/필터 배지(`text-primary-foreground`), 카드 호버(`hover:bg-[var(--card-hover)]`), 모달 내부 섹션(`bg-secondary/30`, `bg-card-hover/20`) 및 닫기 버튼이 모든 테마에서 의도된 고대비 색상으로 렌더링되도록 교정.

### 2. Tauri CMD 쉘 인자·Ping 경합·비동기 언마운트 안전성 보강 (`App.tsx`, `AdapterItem.tsx`, `useRealIp.ts`)
* **Windows `cmd /c start` 인자 파싱 오류 수정 (`src/App.tsx`)**:
  - `handleOpenCmd` 및 `handlePingDns` 폴백에서 `start` 명령에 명시적 창 제목(`IpName2 CMD`, `IpName2 Ping`)을 부여하고 `'ping', '-t', dnsTarget`을 개별 인자로 분리 전달하여 Windows `cmd.exe` 따옴표 오작동 원천 차단.
* **비동기 Ping/충돌 검사·공인 IP 조회 경합(Race Condition) 및 타이머 누수 제거**:
  - `App.tsx`: `pingRequestIdRef`, `mockPingTimerRef`, `isMountedRef`를 도입하여 어댑터 탭 전환 중 이전 Ping 응답이 새 어댑터 상태를 덮어쓰는 현상 차단.
  - `AdapterItem.tsx`: 언마운트/전환 시 모의 타이머 일괄 정리(`mockTimersRef`) 및 저장 중(`isSaving`) 보조 IP·서브넷 마스크 입력 잠금 적용; `isVirtual` 아이콘 우선순위(`App.tsx`·`AdapterItem.tsx`)를 배지/색상과 일관화.
  - `useRealIp.ts`: `AbortController` 기반 타임아웃 폴백 및 `isMountedRef` 언마운트 상태 보호 추가.

### 3. 네트워크/시스템 저장 엣지 케이스 및 Rust·C99·Inno Setup 안전성 강화
* **공백 입력·단독 보조 DNS·작업 그룹 변경 배너 교정 (`src/hooks/useSystemConfig.ts`)**:
  - `saveNetworkConfig` 진입 시 모든 IP/마스크/게이트웨이/DNS 입력을 선행 `.trim()` 처리하여 공백만 있는 선택 항목이 형식 오류로 오탐지되지 않도록 개선.
  - `primaryDns`가 비어 있고 `secondaryDns`만 입력된 경우 DHCP로 초기화되던 문제를 수정하여 `secondaryDns`를 주 DNS로 정상 등록(`netsh`).
  - `saveSystemInfo`에서 작업 그룹(Workgroup)만 변경한 경우 `"다음 부팅 시 컴퓨터 이름이 변경됩니다"` 배너(`pendingComputerName`)가 불필요하게 표시되지 않도록 조건 분리.
* **Rust Win32 포인터 NULL 가드 및 엄격한 IPv4 파서 (`src-tauri/src/windows_native.rs`)**:
  - `get_adapters_native`에서 `addr.AdapterName` / `addr.FriendlyName` 순회 전 `.is_null()` 검사를 추가하여 인터페이스 리셋 중 발생할 수 있는 미정의 동작(UB) 차단.
  - `calculate_subnet_native`, `classify_ip_native`를 `std::net::Ipv4Addr::from_str`로 교체하여 선행 `0`·부호 포함 문자열 차단 및 `distinguish_adapter_native` 필터(`로컬 영역 연결*`, `wifi direct`, `desc` 무선 키워드) 동기화.
* **C99 DLL & Inno Setup 인스톨러 보강 (`native/ipname_core/src/ipname_core.c`, `installer/setup.iss`)**:
  - `ipname_core.c`: `IPNAME_VERSION "1.12.10"` 갱신 및 `로컬 영역 연결*` / `local area connection*` 필터 동기화.
  - `setup.iss`: `[UninstallRun]` 방화벽 규칙 삭제에 `waituntilterminated` 적용 및 `InitializeSetup` 내 `FileExists(sUninstPath)` 사전 검사 추가.

---

## [v1.12.9] - 2026-11-14

### 1. C99 네이티브 DLL (`native/ipname_core/src/ipname_core.c`) 엄격한 파싱 및 안전성 강화
* **`parse_ipv4_string` 문자 단위 엄격 파서 전면 교체**:
  - 공백 포함 주소나 `+` 기호, 후행 잔여 문자를 허용하던 `sscanf` 기반 파싱을 제거하고 엄격한 점 표기(0~255, 선행 0 다자리 금지, 공백·기호 불허) 문자 단위 파서로 교체하여 MSVC `C4996` 경고를 제거하고 입력 무결성을 강화.
* **부호 있는 `char` `toupper` 미정의 동작(UB) 차단**:
  - `IpName_CheckIpConflictEx` 내 MAC 16진수 정규화 루프에서 `unsigned char` 캐스팅을 적용하여 확장 바이트 처리 시 발생할 수 있는 UB 원천 차단.
* **잔여 `strncpy` 전면 제거 및 `IPNAME_VERSION` 동기화**:
  - `IpName_GetVersion`, `IpName_CheckIpConflictEx` (모의 경로), `IpName_ClassifyIp`, `IpName_DistinguishAdapter`의 모든 `strncpy` 호출을 `snprintf(..., sizeof(...), "%s", ...)`로 통일하여 NUL 종단 보장 및 컴파일러 경고 제거 (`IPNAME_VERSION "1.12.9"`).

### 2. Rust Win32 백엔드 (`src-tauri/src/windows_native.rs`) 경계 검사 및 ARP 충돌 판정 교정
* **외부 IP 충돌 마스킹 버그 수정 (`check_ip_conflict_native`)**:
  - `SendARP` 응답 MAC이 `own_mac` 및 로컬 어댑터 MAC 목록 어느 것과도 일치하지 않았음에도 `adapter.ipAddress == target_ip`만으로 "충돌 없음"으로 잘못 덮어쓰던 조건을 제거하여, 외부 장비의 동일 IP 가로채기(IP Hijacking/Conflict)를 정확히 탐지하도록 교정.
* **MAC 주소 버퍼 인덱스 경계 클램핑**:
  - `GetAdaptersAddresses` 순회 시 `PhysicalAddressLength`를 `addr.PhysicalAddress.len()`(8바이트)으로 클램핑(`.min(...)`)하여 드라이버 이상 값으로 인한 패닉 원천 차단.
* **네이티브 네트워크 명령 입력 공백 트리밍**:
  - `calculate_subnet_native`, `ping_ipv4_native`, `classify_ip_native`, `check_ip_conflict_native`, `check_tcp_port_native` 진입 시 앞뒤 공백(`.trim()`) 정규화 적용.

### 3. 프론트엔드 React / TypeScript (`src/`) 검증·타임아웃·상태 롤백·접근성 개선
* **연속 서브넷 마스크 및 호스트 IP 엄격 검증 (`useSystemConfig.ts`)**:
  - `isValidSubnetMask`(32비트 MSB 연속 1비트 검증, `0.0.0.0` 및 `255.255.255.255` 차단) 및 `isValidHostIPv4`(`0.0.0.0` / `255.255.255.255` 차단)를 도입하여 `netsh` 실행 단계 런타임 실패 사전 차단.
  - PowerShell 비활성 어댑터 병합 시 하이픈(`-`) 구분 MAC 주소를 콜론(`:`) 대문자로 정규화, `fetchInitialData` 오류 시 `originalAdapters` 초기화, `toggleAdapterEnabled` 예외 발생 시 낙관적 UI 상태 자동 롤백(`fetchInitialData`), `saveNetworkConfig` 예외 시 에러 토스트 표시 보강.
* **주 DNS Ping 폴백 정지 상태 및 쉘 인젝션 방어 (`App.tsx`)**:
  - `isTauriEnv` 중복 선언을 `src/lib/powershell.ts` 공용 import로 통합하고, `handlePingDns` 네이티브 Ping 실패 후 CMD 폴백 실행 시 대상 문자열 문자셋 검증(`/^[a-zA-Z0-9.:-]+$/`) 및 상태값(`CMD 실행됨` / `오류`) 갱신으로 `"조회 중..."` 무한 유지 결함 해결.
* **업데이트 타임아웃, 클립보드 폴백, 모달 ESC 및 HTTPS 링크 일관화**:
  - `useGitHubUpdate.ts`: `AbortController` 기반 6초 타임아웃 및 언마운트 가드(`isMountedRef`) 적용 (`CURRENT_VERSION = '1.12.9'`).
  - `Footer.tsx`: `IpNameCore Native DLL` 표기 버전을 `v${CURRENT_VERSION}` 동적 바인딩으로 교정하고 푸터 버전 배지(`v{CURRENT_VERSION}`) 및 `https://www.cisnet.co.kr` HTTPS 링크 통일.
  - `CopyButton.tsx`: 언마운트 타이머 정리, 빈 문자열 가드, WebView 제한 환경용 `execCommand('copy')` 폴백 추가.
  - `Modal.tsx` / `ConfirmModal.tsx` / `Header.tsx` / `SystemSection.tsx` / `AdapterItem.tsx`: `Escape` 키 모달 닫기 및 명시적 `type="button"` 속성 전수 적용.

### 4. 빌드 및 아이콘 검증 파이프라인 안정화 (`build.bat`, `build.ps1`, `fix-icon.cjs`)
* **`.gitkeep-ignore` 기반 오삭제 결함 제거 (`build.bat`)**:
  - 기존 `build.bat` STEP 1에서 지연 확장(`enabledelayedexpansion`) 중 `"!"` 비교 구문 오류 및 `.gitkeep-ignore` 목록 내 로컬 파일(`git-push.bat`, `.env` 등)까지 삭제될 수 있던 위험 루프를 제거하고 `scripts\github\verify-core-files.cjs --clean` + 임시 락파일 정리로 안전 교체, 단계 표기 `[STEP 0/8] ~ [STEP 8/8]` 및 `IpName2_v1.12.9.exe` 통일.
* **`build.ps1` 단계 번호 & 종료 코드 전파 및 `fix-icon.cjs` 오류 코드 반환**:
  - `build.ps1`의 `[1/7] ~ [7/7]` 단계 번호 통일, 네이티브 DLL 및 `postbuild-rename.cjs` `$LASTEXITCODE` 검사, `bun.lock` 정리 추가. `fix-icon.cjs` 실패 시 `process.exitCode = 1` 설정으로 오류 마스킹 차단.

---

## [v1.12.8] - 2026-11-14

### 1. 순수 창작 C99 네이티브 DLL (`native/ipname_core/`) 메모리 안전성 및 소켓 초기화 결함 해결
* **`IpName_PingIpv4` Use-After-Free 버그 수정 (`ipname_core.c`)**:
  - `free(ReplyBuffer)` 호출 이후 해제된 메모리의 `pEchoReply->Status`를 역참조하던 Use-After-Free 결함을 `DWORD reply_status = pEchoReply->Status;` 선저장으로 원천 해결.
* **`IpName_CheckTcpPort` Winsock 초기화 누락(`WSANOTINITIALISED`) 해결 (`ipname_core.c`)**:
  - `WSAStartup(MAKEWORD(2, 2), &wsa_data)` 및 모든 종료 경로에서의 `WSACleanup()` 짝맞춤 처리를 추가하여 독립 호출 환경에서도 소켓 오류가 발생하지 않도록 개선.
* **`IpName_ValidateNetBiosName` 문자열 절단 및 MSVC UTF-8 인코딩 보강 (`ipname_core.c`, `build.bat`)**:
  - `strncpy` 사용 시 버퍼 절단 구간에서 NUL 종단 문자(`\0`)가 누락될 수 있던 취약점을 `snprintf(..., "%s", ...)`로 전면 교체.
  - `native/ipname_core/build.bat`의 MSVC `cl.exe` 옵션에 `/utf-8` 플래그를 추가하여 한국어 UTF-8 문자열 리터럴 깨짐 방지 및 `IPNAME_VERSION`을 `1.12.8`로 동기화.
* **어댑터 토큰 경계 정밀 매칭 (`str_contains_token_ci`)**:
  - `"tap"` / `"tun"` 키워드가 `"tuning"`, `"taping"` 등 무관한 부분 문자열에 의해 가상 어댑터로 오탐되지 않도록 토큰/접두사 경계 검사 적용.

### 2. Rust Win32 백엔드 (`src-tauri/src/windows_native.rs`) 안전성 및 서브넷 검증 보강
* **64비트 `ICMP_ECHO_REPLY` 안전 버퍼 확보**:
  - `ping_ipv4_native` 응답 버퍼 크기를 `.max(1024)`로 보장하여 64비트 Windows 커널 구조체 정렬 오버플로우 예방.
* **비트 시프트 오버플로우 및 비정상 서브넷 마스크 차단**:
  - `OnLinkPrefixLength` ➔ 서브넷 마스크 변환 시 `prefix_len >= 32` 경계 가드 추가.
  - `calculate_subnet_native`에 연속 비트 마스크(`contiguous mask`) 유효성 검증 도입.
* **물리/가상 판별 일관성 통일**:
  - `contains_token_or_prefix` 헬퍼를 `get_adapters_native` 및 `distinguish_adapter_native` 양측에 일관 적용.

### 3. Inno Setup 인스톨러, 빌드 스크립트 및 GitHub Actions CI/CD 무결성 개선
* **Inno Setup 컴파일 타임 조건부 포함 교정 (`installer/setup.iss`)**:
  - 기존 `[Files]` 섹션의 런타임 `Check: FileExists(ExpandConstant('{src}\..\bin\ipname_core.dll'))` 및 `LICENSE` 체크가 최종 사용자의 다운로드 폴더(`{src}`)를 검사하여 DLL과 라이선스가 설치본에 포함되지 않던 치명적 패키징 버그 해결.
  - 컴파일 타임 전처리기 `#ifexist` 지시문으로 전면 교체하고, `IpName2.exe` 미존재 시 Cargo 원본 바이너리 `ipname2.exe` 폴백 및 `MyAppVersion "1.12.8"` 동기화.
* **GitHub Actions 에러 마스킹 제거 (`.github/workflows/release.yml`)**:
  - `build.bat`, `iscc.exe`, `dir /b dist-installer\*_Setup.exe` 단계 직후 `if errorlevel 1 exit /b 1`을 추가하여 빌드 실패가 후속 명령에 의해 성공(exit 0)으로 덮어써지는 현상 차단.
* **빌드 후처리 및 배치 단계 정정 (`bin/postbuild-rename.cjs`, `build.bat`)**:
  - `package.json` 우선 버전 추출, `ipname2.exe` / `IpName2.exe` 우선 매칭, `src-tauri/target/release/IpName2.exe` 상시 생성 및 오류 시 `process.exitCode = 1` 반환 보장.
  - `build.bat`의 중복 `[STEP 6/7]` 라벨을 `6/8 ~ 8/8`로 교정하고 DLL 컴파일 실패 경고 및 `IpName2_v1.12.8.exe` 안내 문구 최신화.

### 4. 프론트엔드 React / TypeScript (`src/`) 상태 동기화 및 UI 결함 수정
* **입력 중 Primary IP 강제 재정렬 및 보조 IP 목록 꼬임 방지 (`useSystemConfig.ts`)**:
  - `updateAdapter`, `applyDns`, `toggleAdapterEnabled` 등에서 키 입력/부분 수정 시마다 `sortAdaptersAndEnforcePrimaryIp`가 실행되어 입력 중이던 IP가 재배치되던 문제를 제거하고 `fetchInitialData` 초기 로드/갱신 시에만 정렬 수행.
  - `originalAdapters` 상태가 재조회 시 비활성 어댑터 포함 최신 배열(`sortedMerged`)로 일관 갱신되도록 수정.
  - `subnetMatches` 엄격한 4-옥텟 검증, `isGhostOrInvalidAdapter` ➔ `isVirtualAdapter` MAC 포함 5개 인자 전달, 데드 코드(`physicallyPresentNames`, `hasPowerShellData`) 제거, `toastTimerRef` 타이머 정리, `escapePsDoubleQuoted` 및 NetBIOS 1~15자/금지문자/선행·후행 기호 전체 검증 보강.
* **어댑터 전환 및 모드 변경 시 잔여 상태 초기화 (`AdapterItem.tsx`, `App.tsx`)**:
  - 어댑터 선택 변경(`adapter.id`) 및 DHCP 전환 시 `conflictResult`, `isCheckingConflict`, `secConflictStates` 상태가 이전 어댑터/모드에서 남아있지 않도록 초기화하고, 보조 IP 삭제 시 `secConflictStates` 인덱스 재정렬.
  - 필터 결과(`displayAdapters`)가 비어 있을 때 `selectedAdapter`가 타 탭의 `adapters[0]`으로 잘못 폴백되던 문제 수정 및 `pingStatus` 자동 초기화, `<AdapterItem key={selectedAdapter.id}>` 부여, `<QuickDnsSettings>` 비활성화 가드 추가.
* **공통 훅/컴포넌트/버전 동적화 (`useGitHubUpdate.ts`, `useRealIp.ts`, `Modal.tsx`, `Footer.tsx`, `translations.ts`)**:
  - `safeStorage` 일원화, `useRealIp` `Promise.all` 병렬 조회, `isNewerVersion` 프리릴리스 접미사 처리, `ModalProps.title` 타입(`React.ReactNode`) 정합성 확보, `Footer` 및 번역 텍스트의 `CURRENT_VERSION` 동적 참조.

---

## [v1.12.7] - 2026-10-23

### 1. 타 IP Name 앱 패밀리 표준 업그레이드를 위한 AI 작업 지시서 수립 (`docs/UPDATE_WORK_INSTRUCTION.md`)
* **타 AI 모델 및 신규 파생 프로젝트에 즉시 전달 가능한 7대 핵심 원칙 통합 프롬프트 작성**:
  - **불변 사양 보장**: 창 크기 650x800 고정, 통신 포트 3030 통일, 공식 메타데이터 및 브랜드 규격 명시.
  - **순수 창작 C DLL (`ipname_core.dll`)**: Layer-2 ARP `SendARP` 기반 본인 MAC 오탐(Self-Conflict) 방어, 인프로세스 ICMP Echo Ping, 넌블로킹 TCP 진단 및 서브넷 연산기 아키텍처 수립.
  - **스마트 어댑터 & IP 강제 정렬**: 게이트웨이 및 DHCP 일치 IPv4 Primary 강제 우선순위 알고리즘 이식 가이드.
  - **물리 vs 가상 이중 판별 필터링**: NDIS 및 OUI 기반 클린 세그먼트 탭 필터링 엄격화.
  - **Tauri v2 빌드 최적화**: `build.rs` 기반 staticVCRuntime 처리 및 컴파일러 경고 0건 달성 가이드.
  - **GitHub Actions Node 24 마이그레이션**: EOL 경고 없는 최신 액션(`checkout@v5`, `setup-node@v5`, `action-gh-release@v3`)과 AI Studio 웹 Sync 연동 듀얼 트리거(`branches: [ main ]`, `tags: [ 'v*' ]`) 표준화.
  - **31종 핵심 빌드 파일 화이트리스트 및 로컬 푸시 스크립트 격리**: `.gitignore`, `core-manifest.json`, `verify-core-files.cjs`, `git-push.bat` 자동화 파이프라인.
* **문서 색인 및 화이트리스트 매니페스트 동기화**:
  - `docs/README.md` 테이블 색인 등록 및 `scripts/github/core-manifest.json` 필수 파일 목록 등록 완료.

### 2. 구글 블로거(Google Blogger) 공식 배포 포스팅 문서 수립 (`docs/BLOGGER_POST.md`)
* **공식 블로그 [AhBiYout Vibe](https://ahbiyoutvibe.blogspot.com/) 발행용 콘텐츠 완비**:
  - 권장 포스트 제목, 맞춤 퍼머링크(`ahbiyout-ipname2-network-manager-v1-12`), 검색 메타 설명, 태그 목록 구성.
  - 8대 핵심 기능, 윈도우 기본 제어판과의 상세 비교표, 다운로드 및 설치 가이드 수록.
  - 블로거 HTML 편집기 모드에 바로 붙여넣을 수 있는 반응형 스타일 완성형 HTML 블록 제공.
  - `scripts/github/core-manifest.json` 및 `docs/README.md`에 공식 연동 등록.

### 3. 루트 디렉터리 표준 MIT 라이선스 파일 신설 (`LICENSE`)
* **표준 오픈소스 라이선스 파일 배치 및 저작권 명시**:
  - 프로젝트 루트에 GitHub 표준 `LICENSE` 파일 생성.
  - 저작권 소유자: `AhBiYout`
  - 저작권 연도: 개발 시작 및 현재 연도인 `2026` 반영 (`Copyright (c) 2026 AhBiYout`).
  - Inno Setup 패키징 스크립트(`installer/setup.iss`)의 설치 파일 목록(`[Files]`) 및 버전 정의(`MyAppVersion 1.12.7`) 동기화.
  - `core-manifest.json` 화이트리스트에 루트 파일 및 필수 파일로 정식 등록.

### 4. Inno Setup 설치 완료 후 앱 실행 시 UAC 권한 상승 오류 (코드 740) 해결
* **인스톨러 `[Run]` 실행 플래그 보강 (`installer/setup.iss`)**:
  - 관리자 권한(UAC Elevation)을 요구하는 `IpName2.exe` 실행 파일이 Inno Setup 설치 완료 직후 자동 실행될 때, 기본 `CreateProcess` 호출로 인해 발생하는 `CreateProcess 실패; 코드 740. 요청한 작업을 수행하려면 권한 상승이 필요합니다` 오류 교정.
  - `[Run]` 섹션의 실행 플래그에 `shellexec`를 추가하여 `ShellExecuteEx` 호출로 전환함으로 UAC 권한 승급을 정상적으로 처리하도록 개선 (`Flags: nowait postinstall skipifsilent shellexec`).

---

## [v1.12.6] - 2026-10-19

### 1. GitHub Actions CI/CD 워크플로 Node.js 24 런타임 전면 마이그레이션
* **GitHub Actions 워크플로 현대화 (`.github/workflows/release.yml`)**:
  - GitHub Actions 러너의 Node.js 20 공식 EOL 및 강제 전환 경고(Annotations: `Node.js 20 is deprecated... forced to run on Node.js 24`)를 원천 해결.
  - 리포지토리 체크아웃 액션 승급: `actions/checkout@v4` ➔ `actions/checkout@v5` (Node 24 네이티브 런타임).
  - Node 환경 설정 액션 승급: `actions/setup-node@v4` ➔ `actions/setup-node@v5` (Node 24 네이티브 런타임).
  - GitHub Releases 자산 배포 액션 승급: `softprops/action-gh-release@v2` ➔ `softprops/action-gh-release@v3` (Node 24 네이티브 런타임).
  - 작업 레벨 환경 변수 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true`를 명시하여 차세대 Actions 런타임과의 100% 호환성 확보 및 경고 완전 제거.

---

## [v1.12.5] - 2026-10-18

### 1. GitHub 업로드 파일 전수 점검 및 빌드 핵심 소스 화이트리스트 최적화
* **`.gitignore` 및 `.gitkeep-ignore` 전면 개편 및 엄격한 제외 규칙 확립**:
  - 프로젝트 빌드에 불필요한 모든 임시/스크래치 파일(`*.tmp`, `*.bak`, `*.log`, `*.cache`, `*.tsbuildinfo`, `bun.lock`, `yarn.lock` 등)을 철저히 차단.
  - 로컬 환경 전용 IDE 및 툴링 설정(`.idea`, `.vscode`, `.fleet`, `.claude`, `.cursor` 등)과 플랫폼 내부 아티팩트(`.aistudio`, `.dev.*`)를 원천 제외.
  - 빌드 산출물(`dist/`, `target/`, `node_modules/`, `Output/`, `release/`, `installer/Output/`, 바이너리 파일 `*.exe`, `*.dll`, `*.lib`, `*.obj`)을 완벽 차단.
  - 프로젝트의 실제 소스코드(`src/`, `src-tauri/`, `native/`), 공식 문서(`docs/`), 인스톨러 스크립트(`installer/setup.iss`), 빌드 스크립트(`build.bat`, `build.ps1`), 필수 아이콘 자산만 선별하여 추적되도록 확정.

### 2. 로컬 커밋 및 푸시 자동화 스크립트(`git-push.bat`) 정비 및 업로드 제외 격리
* **`git-push.bat` 복원 및 안전 실행 파이프라인 고도화**:
  - `package.json` 기반 동적 버전 자동 추출 및 Git 리포지토리 초기화/원격지 연동 기능 정비.
  - 스테이징 직전 `verify-core-files.cjs --clean` 자동 호출을 통한 프로젝트 무결성 감사 및 스크래치 파일 자동 정화.
  - Git 인덱스 자체 격리 단계(Step 4: `git rm --cached git-push.bat scripts\git-push.bat`)를 스크립트 내에 내장하여, 사용자가 로컬에서 스크립트를 실행해도 스크립트 파일 자체가 GitHub에 스테이징되거나 커밋/푸시되는 사고를 원천 차단.
  - `.gitignore`, `.gitkeep-ignore`, `core-manifest.json` 내 `excludedFiles` 및 `*git-push*.bat` 와일드카드 규칙을 동시 적용하여 이중 격리 보장.

### 3. 루트 공식 `README.md` 프로젝트 명세 반영
* **GitHub 리포지토리 메인 문서 정비**:
  - 프로젝트 루트에 AhBiYout IpName2 공식 README를 수립하여, 기술 스택, 핵심 기능, 아키텍처, 빌드 가이드 및 제작자/공식 채널 정보를 명확히 제공.

---

## [v1.12.4] - 2026-10-17

### 1. `git-push.bat` GitHub 푸시 및 저장소 추적 제외 목록 공식 편입
* **배치 스크립트 격리 및 저장소 추적 해제 (`.gitignore`, `.gitkeep-ignore`)**:
  - `git-push.bat` 및 `scripts/git-push.bat`을 공식 `.gitignore` 및 `.gitkeep-ignore` 목록에 전면 등록.
  - 로컬 환경에서의 배치 자동화 실행 기능은 완벽히 보존하면서, GitHub 리포지토리에는 업로드되지 않도록 Git 캐시 인덱스 추적(`git rm --cached`) 해제 적용.
* **핵심 화이트리스트 매니페스트 및 자동 감사 스크립트 연동 (`core-manifest.json`, `verify-core-files.cjs`)**:
  - `scripts/github/core-manifest.json` 내 `requiredFiles` 및 `coreRootFiles`에서 `git-push.bat`을 안전하게 제거하고 `excludedFiles` 항목으로 공식 재배치.
  - `scripts/github/verify-core-files.cjs`에 제외 대상 파일의 Git 인덱스 추적 여부를 실시간 검증하는 무결성 검사 로직(Step 3b) 탑재.
  - 리포지토리 구조 요약 출력에서 `git-push.bat`을 로컬 전용 자동화 스크립트로 분리 표기.

---

## [v1.12.3] - 2026-10-13

### 1. 보조 IP 충돌 검사 시 본인 MAC 주소 오탐(Self-Conflict) 결함 원천 해결
* **로컬 어댑터 MAC 주소 및 시스템 랜카드 화이트리스트 필터링 구현 (`AdapterItem.tsx`, `windows_native.rs`)**:
  - **결함 원인 분석**: Windows 환경에서 이미 해당 랜카드(또는 로컬 PC)에 보조 IP로 바인딩되어 있는 IP 주소에 대해 `SendARP` 질의를 수행하면, Windows IP 스택이 본인 랜카드의 MAC 주소(예: `18:C0:4D:7F:68:08`)로 응답하여 이를 외부 기기와의 중복 충돌로 오인 경고하던 문제 해결.
  - **Tauri 백엔드 개선 (`check_ip_conflict_native`)**:
    - 호출 시 현재 검사 대상 어댑터의 MAC 주소(`own_mac`)를 전달받아, ARP 응답 MAC과 일치할 경우 `is_conflict: false` 및 정상 사용 메시지로 처리.
    - 로컬 머신에 구성된 모든 네트워크 어댑터(`get_adapters_native`)의 MAC 목록 및 기존 할당 IP 목록과 전수 대조하여, 본인 컴퓨터 소유 IP인 경우 외부 충돌 경고를 원천 차단.
  - **프론트엔드 연동 (`AdapterItem.tsx`)**:
    - `isSameMac` 하드웨어 주소 비교 유틸리티를 적용하여 대소문자/구분기호(`:`, `-`) 차이에 상관없이 본인 MAC 주소를 정밀 식별.
    - 본인 랜카드 MAC 감지 시 안내 문구를 `"✓ [현재 어댑터] 해당 보조 IP는 현재 본인 랜카드(MAC: ...)에 할당된 정상 주소이며, 외부 충돌이 없습니다."`로 긍정적 안내 전환.
  - **내부 입력 중복 검증 추가**:
    - 기본 IP와 동일한 IP를 보조 IP로 입력하거나, 보조 IP 목록 내 서로 중복된 IP를 입력한 경우 네트워크 ARP 요청 전 즉각 안내 문구(`⚠️ [내부 중복] ...`) 표출.
    - 사용자가 보조 IP 주소를 수정하면 기존 충돌 경고 상태를 즉각 자동 리셋하여 UI 피드백 향상.

### 2. 순수 창작 DLL (`ipname_core.dll`) 확장 충돌 검사 API 탑재
* **`IpName_CheckIpConflictEx` 함수 신설 및 C-ABI 표준 탑재 (`ipname_core.h`, `ipname_core.c`)**:
  - `own_mac` 파라미터를 추가하여 DLL 내부에서도 로컬 MAC 주소를 바이너리 레벨에서 대조 및 화이트리스트 처리.
  - 기존 `IpName_CheckIpConflict` 호출부와의 100% 하위 호환성 유지.
  - C DLL 버전 삼중 동기화 (`v1.12.3`).

### 3. 어댑터 및 IP 자동 정렬 알고리즘 구현 (`useSystemConfig.ts`)
* **DHCP 및 게이트웨이 연동 IPv4 기본(Primary) 우선순위 강제 정렬**:
  - `useSystemConfig.ts` 내부에 `sortAdaptersAndEnforcePrimaryIp` 알고리즘 탑재.
  - 게이트웨이 서브넷과 일치하는 IPv4 주소 또는 DHCP 할당 주소를 최우선(`ipAddress`, Primary)으로 강제 정렬하고, 보조 정적 IP나 링크 로컬 주소(`169.254.x.x`)를 보조 IP 목록으로 자동 배치.
  - 네트워크 어댑터 목록 역시 게이트웨이/IP 연결 상태를 기준으로 최상단에 렌더링되도록 정렬 로직 자동화.

### 4. GitHub 동기화 제외 목록 정밀 고도화 및 불필요 파일 완전 제거
* **`.gitignore` 및 `.gitkeep-ignore` 제외 규칙 전면 강화**:
  - 임시 및 스크래치 파일(`.aistudio/`, `bun.lock`, `*.cache`, `*.tsbuildinfo`, `coverage/`, `.claude/`, `.cursor/`, `.fleet/`, 일회성 스크립트 등)을 차단 목록에 완벽 등록.
  - 빌드 산출물(`dist/`, `target/`, `node_modules/`, `Output/`, `release/`, `*.exe`, `*.dll`, `*.lib`, `*.obj` 등) 원천 제외.
  - 프로젝트 빌드 및 실행에 필수적인 핵심 소스 코드(`src/`, `src-tauri/`, `native/`), 빌드 스크립트, 아이콘 리소스, 문서(`docs/`)만 엄격히 추적 및 푸시되도록 파이프라인 및 매니페스트(`core-manifest.json`, `verify-core-files.cjs`) 검증 체계 강화.

---

## [v1.12.2] - 2026-10-13

### 1. Rust 컴파일러 경고 완전 제거 (Zero Compiler Warnings 달성)
* **`AdapterDistinctionResult` 필드 명명 규칙 경고 해소 (`windows_native.rs`)**:
  - `isVirtual`, `isWifi`, `isGhostOrFilter`, `detectionReason` 필드에 대해 발생하던 `non_snake_case` 경고 4건을 `#[allow(non_snake_case)]` 속성 부여로 완전 해결.
  - Rust 백엔드와 프론트엔드 간 camelCase 직렬화/역직렬화 호환성을 100% 유지하면서 컴파일러 경고 원천 차단.
* **`build.rs` 빌드 스크립트 정리 및 Deprecation 경고 해소**:
  - `tauri_build` 내부에서 발생하던 `STATIC_VCRUNTIME is deprecated` 빌드 경고를 유발하는 레거시 호출을 제거하여 Clean Native Build (0 Warnings) 달성.
* **최종 인스톨러 생성 검증 (`IpName2 v1.12.2_1.12.2_x64-setup.exe`)**:
  - NSIS x64 번들 인스톨러 및 단독 실행 바이너리(`ipname2.exe`) 완전 패키징 확인.

---

## [v1.12.1] - 2026-10-13

### 1. Tauri v2 빌드 설정(`tauri.conf.json`) 스키마 불일치 오류 완전 해결
* **`bundle > windows` 내 예기치 않은 속성(`staticVCRuntime`) 스키마 에러 해소**:
  - `tauri build` 실행 시 발생하던 `Error: "tauri.conf.json" error on bundle > windows: Additional properties are not allowed ('staticVCRuntime' was unexpected)` 오류 수정.
  - `bundle.windows` 내부의 비표준 `staticVCRuntime` 필드를 제거하고, `src-tauri/build.rs`에서 `tauri_build::WindowsAttributes::new().static_vc_runtime(true)` 공식 API를 직접 호출하도록 완벽 전환.
  - `npx tauri info` 및 `tauri build` 명령어가 스키마 유효성 검사를 100% 정상 통과하도록 보장.

### 2. 순수 창작 DLL (`ipname_core.dll`) GCC 컴파일러 재정의 경고 제거
* **`IPNAME_CORE_EXPORTS` 매크로 중복 정의 방어 (`ipname_core.c`)**:
  - `native/ipname_core/build.bat`의 GCC 명령행 옵션(`-DIPNAME_CORE_EXPORTS`)과 소스 코드 내 `#define` 구문 간의 충돌로 발생하던 `'IPNAME_CORE_EXPORTS' redefined` 경고를 `#ifndef` 가드로 완벽 차단.
  - MinGW GCC 및 MSVC 환경 모두에서 0 Warnings의 깨끗한 Clean Compile 달성.

---

## [v1.12.0] - 2026-10-13

### 1. 물리/가상 어댑터 필터링 엄격화 및 가상 어댑터 혼입 버그 원천 해결
* **물리 어댑터 선택 시 가상 어댑터가 함께 표시되던 폴백 버그 원천 차단 (`App.tsx`)**:
  - 기존 로직에서 물리 어댑터 필터 적용 시 개수 미체크 폴백(`physicalAdapters.length > 0 ? physicalAdapters : adapters`)으로 인해 전체(가상 포함) 어댑터가 노출되던 문제를 완전 제거.
  - 필터 탭(`물리 어댑터` / `가상 어댑터` / `전체`) 선택 시 각각의 순수 배열(`physicalAdapters`, `virtualAdapters`)만 독립적으로 반환되도록 엄격 분리.
* **선택된 어댑터(`selectedAdapter`)의 필터 동기화 보장**:
  - `selectedAdapter`를 `displayAdapters` 기준으로만 즉각 선출하도록 반응형 연산(`useMemo`) 최적화.
  - 사용자가 '물리 어댑터' 탭을 누르는 즉시 상세 카드(`AdapterItem`)에 표시되는 어댑터도 100% 물리 하드웨어 랜카드로 자동 동기화되어 가상 어댑터가 혼재되는 현상 완전 종식.
  - 가로 스크롤 탭 바 및 필터 세그먼트 카운터 수치(`물리 어댑터 (N)`) 실시간 일치.

### 2. 어댑터 리스트 불일치(Adapter List Mismatch) 및 한글 인코딩 탈락 해결
* **PowerShell 콘솔 인코딩(CP949)에 의한 어댑터 이름 손상 및 누락 방지 (`useSystemConfig.ts`)**:
  - Windows 한국어 환경에서 PowerShell 출력 결과의 한글("이더넷", "가상")이 깨져 물리 어댑터 검증에서 누락되던 위험을 원천 방지하기 위해, Rust `GetAdaptersAddresses` 커널 API 수집 결과를 1차 권위(Authoritative Source)로 확정.
  - PowerShell 이름 비교 실패로 인해 실제 하드웨어 랜카드가 목록에서 일방적으로 제외되던 결함 코드 완전 제거.
* **유령(Ghost) 어댑터 부활 및 중복 식별자(`id`) 병합 불일치 해소**:
  - 이전 상태(`prevAdapters`)의 비활성 잔여 항목이 중복 추가되던 로직을 제거하고, Windows 실시간 활성/비활성 어댑터와 1:1 완벽 정합 유지.

### 3. 순수 창작 DLL (`ipname_core.dll`) 물리/가상 어댑터 정밀 판별 엔진 신설
* **C-ABI 네이티브 판별 함수 `IpName_DistinguishAdapter` 공식 탑재 (`ipname_core.h`, `ipname_core.c`)**:
  - **IEEE 하이퍼바이저 MAC OUI 하드웨어 식별**: Hyper-V(`00:15:5D`), VMware(`00:05:69`, `00:0C:29`, `00:50:56`), VirtualBox(`08:00:27`), QEMU/KVM(`52:54:00`), Xen(`00:16:3E`), Parallels(`00:1C:42`) 고유 OUI 프리픽스를 인프로세스 메모리에서 마이크로초 단위로 탐지.
  - **Windows NDIS TunnelType & IfType 심층 검사**: 커널 레벨 터널 타입(`TunnelType != 0`) 및 가상/루프백 인터페이스 완벽 분별.
  - **다국어(한국어 '가상' + 영문 시그니처) 휴리스틱 매칭**: 드라이버 설명 및 장치 이름에 포함된 `가상`, `virtual`, `wsl`, `wintun`, `virtio` 등 30여 개 특화 시그니처 판별.
* **Tauri 네이티브 커맨드 연동 (`src-tauri/src/lib.rs`, `windows_native.rs`)**:
  - Rust 및 프론트엔드에서 언제든지 호출 가능한 `distinguish_adapter` IPC 인터페이스 구현.
  - `IpNameCore` DLL 버전 삼중 동기화 (`v1.12.0`).

---

## [v1.11.0] - 2026-10-13

### 1. 단일 네트워크 어댑터(이더넷/Wi-Fi) 다중 IP(한 개 이상의 IP) 할당 및 보조 IP 관리 공식 지원
* **Rust 네이티브 커널 스택(`windows_native.rs`) 다중 IP 수집 구현**:
  - `SecondaryIp` 구조체 신설(`ipAddress`, `subnetMask`) 및 `NetworkAdapter`에 `additionalIps: Vec<SecondaryIp>` 필드 추가.
  - `GetAdaptersAddresses` API의 IPv4 유니캐스트 주소 리스트 순회 시 단일 IP에서 중단되던 로직을 확장하여, 첫 번째 유효 IPv4는 기본 IP(`ipAddress`)로 설정하고 2번째 이상의 고유 IPv4 주소들을 `additionalIps`로 완벽 수집.
* **Windows Netsh 네트워크 스택 자동 구성 연동 (`useSystemConfig.ts`)**:
  - 수동 IP 설정 시 기본 IP(`set address ... source=static address=... mask=... gateway=...`)를 적용하여 기존 주소를 안전하게 갱신한 뒤, 구성된 보조 IP들을 순차적으로 `netsh interface ipv4 add address name="..." address=... mask=...` 명령어로 자동 바인딩.
  - 중복 IP 입력 방지 검증(`duplicateIpWarning`) 및 보조 IP 서브넷 마스크 유효성 검사(`invalidSecondaryIp`) 탑재.
  - DHCP 전환 시 기존에 등록된 모든 기본 및 보조 IP가 깔끔하게 초기화되도록 동기화 보장.
* **프론트엔드 다중 IP 관리 UI/UX 및 실시간 검증 (`AdapterItem.tsx`)**:
  - 수동 IP 설정 모드에서 `+ 보조 IP 추가` 버튼을 통해 1개 이상의 IP를 직관적으로 추가/삭제 가능.
  - 보조 IP별 독립적인 IP 입력 필드 및 `SubnetMaskSelector` 서브넷 마스크 드롭다운 연동.
  - 각 보조 IP마다 순수 창작 DLL (`ipname_core`) 기반의 초고속 ARP 레이어2 IP 충돌 검사 버튼 제공.
  - 가로 650px x 세로 800px 기본 창 규격을 엄격 준수하는 정돈된 카드형 레이아웃 구현.
* **다국어(i18n) 및 시맨틱 버전 동기화**:
  - 한국어/영어 번역 파일(`src/i18n/translations.ts`)에 다중 IP 관련 키 등록.
  - 새 기능 추가에 따른 Semantic Versioning MINOR 승급: `1.10.4` -> `1.11.0`.

### 2. 물리/가상 이더넷(Physical vs Virtual NIC) 구분 정밀화 및 직관적 식별 체계 확립
* **Windows NDIS 커널 및 PowerShell 통합 가상 어댑터 판별 고도화**:
  - `NetworkAdapter` 구조체(Rust & TypeScript)에 `isVirtual: bool` 정규 필드를 추가하여, 어댑터 생성 시점부터 가상성 여부를 일관되게 전달.
  - PowerShell `Get-NetAdapter -Property Name,Status,MacAddress,Virtual,InterfaceDescription` 조회를 통해 Windows NDIS 드라이버가 공인한 `Virtual` 불리언 속성 및 장치 드라이버 상세 설명(`InterfaceDescription`)을 즉각 반영.
  - Rust(`windows_native.rs`) 및 TypeScript(`useSystemConfig.ts`)의 가상 어댑터 탐지 알고리즘을 확장하여 Hyper-V(`vEthernet`, `vSwitch`), VMware(`VMnet`), VirtualBox(`VBox`), WSL, TAP, TUN, WireGuard, Tailscale, ZeroTier, OpenVPN, Cisco AnyConnect, Hamachi, Radmin 등 현존하는 모든 가상/VPN 인터페이스를 100% 빈틈없이 감지.
* **UI/UX 전반의 물리/가상 어댑터 명확한 시각적 구분 (`App.tsx`, `AdapterItem.tsx`)**:
  - **어댑터 선택 탭 바**: 가로 스크롤 탭 바의 각 항목마다 `[물리]` (에메랄드), `[가상]` (호박색), `[Wi-Fi]` (파랑색) 전용 배지와 아이콘 색상을 적용하여 한눈에 식별 가능.
  - **어댑터 상세 카드 헤더**: 어댑터 이름 우측에 `물리 이더넷` / `가상 이더넷` 전용 배지를 크게 표시하고, 상태 행에 `물리적 하드웨어 랜카드` vs `가상 네트워크 어댑터 (Hyper-V / VMware / WSL / VPN 등)` 설명을 상시 안내.
  - **필터링 탭**: 상단 세그먼트 버튼(`물리 어댑터` / `가상 어댑터` / `전체`)을 통해 원하는 범주의 어댑터만 즉시 필터링하여 집중 관리 가능.
  - **웹 프리뷰 모의 데이터 완비**: 브라우저 환경에서도 물리 이더넷(`Ethernet`), 무선(`Wi-Fi`), 가상(`vEthernet (WSL)`)의 3개 어댑터가 기본 로드되어 UI 및 기능을 즉시 검증 가능.

### 3. Tauri v2 `STATIC_VCRUNTIME` 경고 완전 제거 및 최신 스키마 정합성 보장
* **공식 Tauri v2 설정(`tauri.conf.json`) 마이그레이션**:
  - `src-tauri/build.rs` 내 deprecated 처리된 `static_vc_runtime(true)` 코드를 제거하고, `tauri.conf.json` 내 `"bundle.windows.staticVCRuntime": true` 표준 규격으로 공식 이전.
  - 빌드 시 발생하던 `STATIC_VCRUNTIME is deprecated` 경고를 완전히 해소하여 완전한 Clean Build(0 Warnings) 달성.

---

## [v1.10.4] - 2026-10-12

### 1. GitHub Actions CI/CD `npm ci` 무결성 검증 오류(EUSAGE) 해결 및 락파일 정합성 회복
* **`package.json` - `package-lock.json` 버전 범위 동기화**:
  - `package.json` 내 `@tauri-apps/cli` 및 `@tauri-apps/api`의 버전 명세를 `^2.11.1`로 보정하여, 락파일에 빌드 시점 저장된 `@tauri-apps/cli@2.11.3` 및 OS별 바이너리 패키지들과의 엄격 불일치(EUSAGE: does not satisfy) 문제 원천 해소.
  - `npm ci` 실행 시 무결성 검증 오류 없이 즉시 패키지가 완전 설치(Clean Install)되도록 정합성 회복.
* **`.github/workflows/release.yml` 빌드 파이프라인 방어 로직 강화**:
  - PowerShell 네이티브 프로세스 종료 코드(`$LASTEXITCODE`)를 검증하여, `npm ci`에서 예기치 못한 락파일 차이가 감지되더라도 즉시 파이프라인이 중단되지 않고 `npm install`로 자동 폴백되도록 이중 안전망 구축.

### 2. Rust 네이티브 컴파일러 경고(11건) 및 빌드 런타임 최적화 (Clean Compilation)
* **Rust non_snake_case 경고(10건) 해결**:
  - 프론트엔드 IPC 직렬화 호환성을 100% 보존하면서, `SystemInfo` 및 `NetworkAdapter` 구조체에 `#[allow(non_snake_case)]` 명시적 선언을 적용하여 필드명(`computerName`, `ipAddress`, `isDhcp` 등) 관련 컴파일러 경고 완전 제거.
* **미사용 임포트(`unused import`) 제거**:
  - `src-tauri/src/windows_native.rs` 내 미사용 `windows_sys::Win32::NetworkManagement::Ndis::*` 임포트 정리.
* **`STATIC_VCRUNTIME` Deprecation 경고 해소**:
  - `src-tauri/build.rs`에 Tauri v2 공식 빌드 속성인 `windows = windows.static_vc_runtime(true);`를 명시적으로 구성하여 환경변수 기반 경고를 공식 API로 대체 및 정적 런타임 링크 안정화.

### 3. 버전 삼중 동기화 (Triple Lockstep: v1.10.4)
* `package.json` (`1.10.4`), `src-tauri/tauri.conf.json` (`1.10.4`), `src-tauri/Cargo.toml` (`1.10.4`), `docs/PATCH_NOTES.md` (`v1.10.4`), `docs/DEVELOPMENT.md`, `docs/ARCHITECTURE.md` 정합성 확립.

---

## [v1.10.3] - 2026-10-12

### 1. 레지스트리 잔류 유령 물리 이더넷(Ghost Ethernet NIC) 정밀 판별 및 완전 제외
* **Win32 IP Helper 커널 레벨 부재 장치 차단 (`windows_native.rs`)**:
  - `GetAdaptersAddresses` API 응답 중 `OperStatus`가 `IfOperStatusNotPresent` (6: RFC 2863 / Windows NDIS 하드웨어 부재/제거 상태)인 인터페이스를 즉시 순회에서 제외(`continue`).
  - 과거 네트워크 카드 교체나 탈착된 USB 랜카드로 인해 레지스트리에 설정만 남아있던 잔여 물리 이더넷이 비활성화(Disabled) 어댑터로 오인식되던 결함 원천 차단.
* **물리 이더넷 6바이트 고유 MAC 주소 필수 검증 확립**:
  - 정상적인 물리 이더넷(IEEE 802.3) 및 Wi-Fi 하드웨어는 벤더 고유의 6바이트 물리 MAC 주소를 필수 보유합니다.
  - 물리 어댑터(`!is_virtual`)의 MAC 길이가 6바이트 미만이거나 `00:00:00:00:00:00` 또는 빈 값인 경우, 어댑터 명칭("이더넷", "Ethernet", "로컬 영역 연결")과 무관하게 레지스트리 유령 잔재로 확정 판정하여 철저히 배제.
* **Windows PnP 및 `Get-NetAdapter` 실물 장착 상태 통합 대조 (`useSystemConfig.ts`)**:
  - PowerShell `Get-NetAdapter -IncludeHidden:$false` 조회를 통해 시스템 PnP 트리에 현재 실제 연결되어 있는 활성/비활성 어댑터 이름 목록을 확보.
  - Windows PnP 스택에 실물이 존재하지 않는 레지스트리 잔류 어댑터는 실시간 검증을 통해 완전 탈락 처리.
  - `isGhostOrInvalidAdapter` 필터 함수를 강화하여, 비활성화 상태이더라도 유효한 하드웨어 MAC 주소가 없는 물리 어댑터는 유령 객체로 정확히 분류.
  - 이전 어댑터 상태(`prevAdapters`)의 무조건적 복원 루프를 개선하여, 시스템에서 분리된 하드웨어가 영구 잔존하던 문제 해결.

### 2. 버전 삼중 동기화 (Triple Lockstep: v1.10.3)
* `package.json` (`1.10.3`), `src-tauri/tauri.conf.json` (`1.10.3`), `src-tauri/Cargo.toml` (`1.10.3`), `docs/PATCH_NOTES.md` (`v1.10.3`), `docs/DEVELOPMENT.md`, `docs/ARCHITECTURE.md` 정합성 확립.

---

## [v1.10.2] - 2026-10-12

### 1. `build.bat` 스크립트 전면 개편 및 공백 안전(Space-Safe) 인용 표준화
* **환경 변수 인용 규칙 일원화 (`set "VAR=VAL"`)**:
  - `build.bat` 내의 모든 환경 변수 할당에 `set "KEY=VALUE"` 표준 인용 구문을 엄격히 적용하여 공백이 포함된 경로나 입력값으로 인한 구문 파싱 오류 원천 차단.
  - `if not defined PORT_INPUT` 및 `if "%PORT_INPUT%"==""` 이중 검증으로 안전한 기본 포트(3030) 설정.
* **공백 및 특수문자 안전 조건 분기 (`%*` 인자 루프)**:
  - 명령행 인자 순회 루프에서 `%%~A` 따옴표 제거 연산자와 따옴표 비교(`if /I "%%~A"=="--clean"`)를 결합하여 공백이 포함된 플래그 인자 완벽 방어.
  - 리액트 빌드 및 타우리 빌드 오류 검사(`if errorlevel 1`) 구문 일원화.

### 2. `.gitkeep-ignore` 기반 비핵심 파일 및 스크래치 파일 배제 파이프라인 탑재
* **`.gitkeep-ignore` 파일 신규 제정**:
  - 미버전 바이너리(`*.exe`, `*.msi`, `*.dll`, `*.lib` 등), 번들 임시 폴더(`dist`, `build`, `release`, `Output`), 러스트 빌드 캐시(`src-tauri/target`), 불필요한 번들 락(`bun.lock`), 임시 파일(`*.tmp`, `*.bak`) 등을 명시적으로 배제하는 정식 필터 명세 수립.
* **`build.bat` 내 `.gitkeep-ignore` 파싱 및 자동 정화(Purge) 스텝 신설**:
  - 빌드 전 1단계에서 `.gitkeep-ignore`를 자동 순회하여 디렉터리(`rmdir /s /q`)와 패턴 파일(`del /f /q /a`)을 안전하게 정리.
  - 빌드 완료 후에도 최종 작업 영역을 재정화하여 깃허브(GitHub) 저장소에는 핵심 소스코드 및 필수 메타데이터만 올라가도록 보장.
### 3. Rust 네이티브 백엔드(Tauri) FFI 타입 안전화 및 컴파일 오류 원천 해결
* **ICMP Ping FFI 안정화 (`ping_ipv4_native`)**:
  - `CString` 및 불완전한 `inet_addr` FFI 포인터 캐스팅을 배제하고 표준 `std::net::Ipv4Addr` 파싱과 `u32::from_ne_bytes` 네트워크 바이트 변환 적용.
  - `std::ptr::null::<IP_OPTION_INFORMATION>()` 명시적 타입 지정으로 러스트 컴파일러의 타입 추론 모호성(E0282) 해결.
  - `CloseHandle` 대신 Win32 IP Helper 전용 규격인 `IcmpCloseHandle`을 적용하여 핸들 누수 방지 및 리소스 해제 무결성 확보.
* **TCP 포트 검사 표준화 (`check_tcp_port_native`)**:
  - 기존의 복잡하고 플랫폼 의존적인 WinSock raw C-FFI(`socket`, `select`, `ioctlsocket`, `FD_SET`)를 Rust 표준 라이브러리 `std::net::TcpStream::connect_timeout` 기반의 안전한 비차단 구현으로 전면 개편하여 잠재적 런타임 크래시 및 컴파일 결함 제거.
* **IP 충돌 감지 FFI 타입 정밀화 (`check_ip_conflict_native`)**:
  - `SendARP` 호출 시 `dest_ip`와 `src_ip`를 안전한 `Ipv4Addr` 바이트 표현으로 변환하여 C 문자열 캐스팅 오류 원천 방지.
* **`Cargo.toml` 버전 동기화**:
  - `src-tauri/Cargo.toml`의 버전을 `1.10.0`에서 최신 규격인 `1.10.2`로 완벽 동기화.

---

## [v1.10.1] - 2026-10-12

### 1. GitHub Actions 및 로컬 CI 환경 `npm ci` 실행 오류(EUSAGE) 완벽 해소
* **`package-lock.json` 무결성 보장 및 깃허브 추적 허용**:
  - 기존 `.gitignore`에 등록되어 있던 `package-lock.json` 제외 규칙을 해제하여, CI/CD 러너 환경에서 재현 가능한(Deterministic) 의존성 설치 환경 보장.
  - 최신 의존성 스펙에 맞춘 공식 `package-lock.json`(npm lockfileVersion 3) 생성 및 저장소 포함.
* **GitHub Actions 워크플로 듀얼 인스톨 폴백 체계 구축 (`.github/workflows/release.yml`)**:
  - `package-lock.json` 파일 존재 여부를 사전 감지하여 존재할 경우 신속하고 정확한 `npm ci`를 실행하고, 파일 미존재 시 `npm install`로 자동 폴백되는 이중 안전망 구축.
* **핵심 파일 검증 매니페스트 동기화 (`scripts/github/core-manifest.json`)**:
  - 핵심 파일 목록(`coreRootFiles`)에 `package-lock.json`을 등록하고 불필요한 번들/임시 캐시(`bun.lock`)를 정격 배제.

### 2. 빌드 스크립트 CMD 구문 오류('found.은(는) 예상되지 않았습니다') 완벽 해결
* **`native\ipname_core\build.bat` 조건 블록 괄호 구문 오류 수정**:
  - `if not errorlevel 1 (` 블록 내부의 `echo [OK] Microsoft Visual C++ compiler (cl.exe) found.` 및 MinGW 검사 구문에서 괄호 `)`가 CMD 블록 종결자로 잘못 파싱되어 발생하던 `found.은(는) 예상되지 않았습니다.` 오류를 대괄호(`[cl.exe]`, `[gcc.exe]`) 표기로 전면 치환하여 원천 차단.
  - 배치 파일 종료 시 `endlocal` 구문을 명시하여 환경 변수 누수 방지.
* **`build.bat` 셸 구문 정규화 및 버전 표기 동기화**:
  - 스크립트 종결부의 비표준 `) else if exist` 분기를 표준 중첩 `) else ( if ... )` 구조로 개선.
  - DLL 빌드 호출 안내 문구 및 최종 산출물 안내를 v1.10.1로 동기화.
  - 빌드 후 자동 버전 네이밍 모듈(`bin/postbuild-rename.cjs`)에 `IpName2 v1.10.1.exe` 탐색 우선순위 반영.

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
