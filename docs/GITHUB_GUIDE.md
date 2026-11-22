# GitHub 저장소 운영, 배포 및 릴리스 가이드 (GitHub Repository & Release Guide)

본 문서는 **AhBiYout IpName2 (v1.13.9)** 공식 GitHub 저장소([https://github.com/AhBiYout-all/IpName2](https://github.com/AhBiYout-all/IpName2))의 코드 동기화, 6단계 무결성·보안 감사, GitHub Actions 자동 빌드/릴리스 배포 및 릴리스 노트 작성을 위한 공식 운영 지침서입니다.

---

## 1. 공식 저장소 및 메타데이터 규격

| 항목 | 공식 정보 |
| :--- | :--- |
| **저장소 URL** | [https://github.com/AhBiYout-all/IpName2](https://github.com/AhBiYout-all/IpName2) |
| **최신 안정 버전** | `v1.13.9` (`IpName2 v1.13.9`) |
| **제작자 (Author)** | **AhBiYout** ([https://github.com/AhBiYout-all](https://github.com/AhBiYout-all)) |
| **공식 블로그** | [https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/) |
| **소속 (Affiliation)** | [(주)청운정보시스템 ( cisnet.co.kr )](https://cisnet.co.kr) |
| **데스크톱 창 규격** | 가로 `650px` × 세로 `920px` (최소 `650x760`, 하단 푸터까지 단일 화면 표시) |
| **기본 개발 포트** | `3030` (`vite.config.ts`, `tauri.conf.json`, `build.bat`, `build.ps1` 통일) |
| **라이선스** | MIT License ([LICENSE](../LICENSE)) |

---

## 2. GitHub 업로드 전 6단계 무결성·보안 감사 (`scripts/github/`)

저장소에 소스를 푸시하거나 PR/Sync를 수행하기 전 반드시 6단계 감사 도구를 실행하여 불필요한 파일, 시크릿 유출, 버전 불일치가 없는지 검증해야 합니다.

```cmd
:: 1) 스크래치·비표준 파일 자동 삭제(--clean) 및 6단계 무결성 검증
node scripts\github\verify-core-files.cjs --clean

:: 2) 읽기 전용 최종 확인
node scripts\github\verify-core-files.cjs

:: 3) TypeScript 정적 타입 검사
npm run lint
```

### 감사 게이트 6단계 점검 항목
1. **Stage 1 (필수 빌드 파일 존재 검증)**: `scripts/github/core-manifest.json`에 명시된 **52개 핵심 파일**(다국어 README 4종, 프론트엔드, Tauri Rust, C99 DLL, Inno Setup, CI 워크플로, 11종 공식 문서) 누락 여부 확인.
2. **Stage 2 (금지·스크래치 파일 정리)**: `bun.lock`, `yarn.lock`, `pnpm-lock.yaml`, `*.tmp`, `*.bak`, `*.log`, 임시 아이콘 변환 스크립트 등 자동 탐지 및 `--clean` 옵션 시 삭제.
3. **Stage 3 (화이트리스트 구조 검증)**: 루트 디렉터리 및 `public/` 내 미등록 잔여 파일·디렉터리 탐지.
4. **Stage 4 (시크릿·개인정보 스캔)**: API 키(Google, AWS), GitHub PAT 토큰, 개인 키 블록, 개인 이메일 유출 여부 전수 검사.
5. **Stage 5 (10지점 버전 삼중 동기화 검증)**: 아래 10개 대상이 모두 `package.json` 버전(`1.13.9`)과 일치하는지 자동 검증:
   - `package.json` (`version`)
   - `package-lock.json` (`version` & `packages[""].version`)
   - `scripts/github/core-manifest.json` (`version`)
   - `src-tauri/tauri.conf.json` (`version`, `productName`, `window.title`)
   - `src-tauri/Cargo.toml` (`version`)
   - `src/hooks/useGitHubUpdate.ts` (`CURRENT_VERSION`)
   - `native/ipname_core/src/ipname_core.c` (`IPNAME_VERSION`)
   - `installer/setup.iss` (`MyAppVersion`)
   - `index.html` (`<title>`, `og:title`)
   - `docs/PATCH_NOTES.md` (최상단 `## [vX.Y.Z]` 헤더)
6. **Stage 6 (로컬 자동화 스크립트 격리 검증)**: `git-push.bat` 및 `scripts/git-push.bat`이 `.gitignore`에 등록되어 있고 Git 인덱스에서 추적 해제(Untracked) 상태인지 검증.

> 💡 Windows 환경에서는 `scripts\github\prepare-github-sync.bat`을 실행하면 Stage 1~6 정리와 Git 인덱스 동기화 안내를 한 번에 처리할 수 있습니다.

---

## 3. 로컬 자동 커밋/태그 푸시 및 CI/CD 릴리스 파이프라인

### 3.1. 로컬 원클릭 푸시 (`git-push.bat` — 원격 업로드 제외)
* **격리 원칙**: `git-push.bat`은 `.gitignore` 및 `excludedFiles`에 의해 GitHub 원격 저장소에는 업로드되지 않습니다.
* **동작 순서**:
  1. `package.json` ➔ PowerShell ➔ `docs/PATCH_NOTES.md` 순으로 최신 버전(`1.13.9`) 동적 추출.
  2. `node scripts\github\verify-core-files.cjs --clean` 실행으로 스테이징 전 6단계 감사 통과 확인.
  3. `git-push.bat` 자체 인덱스 격리 후 `v1.13.9` 커밋 및 태그 생성, `origin main --tags` 푸시.

### 3.2. GitHub Actions 자동 빌드 & 인스톨러 릴리스 (`.github/workflows/release.yml`)
* **트리거 조건**:
  - `branches: [ main ]` 푸시 시 (웹 GitHub Sync 포함)
  - `tags: [ 'v*' ]` 푸시 시 (정식 릴리스 태그)
  - `workflow_dispatch` (GitHub Actions 웹 UI 수동 실행)
* **런타임 및 빌드 파이프라인**:
  1. `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` + `actions/checkout@v5` + `actions/setup-node@v5` (`node-version: 22`, `cache: 'npm'`).
  2. **Fast-Fail 선행 게이트**: Rust 컴파일 전에 `verify-core-files.cjs` 및 `npm run lint` (`tsc --noEmit`) 우선 검증.
  3. **Rust 툴체인 & 캐시**: `dtolnay/rust-toolchain@stable` (`x86_64-pc-windows-msvc`) + `Swatinem/rust-cache@v2` (`workspaces: src-tauri`).
  4. **C99 DLL + Frontend + Tauri 빌드**: `native/ipname_core/build.bat` ➔ `npm run build` ➔ `npm run tauri build`.
  5. **Inno Setup 6 인스톨러 생성 및 배포**: `installer/setup.iss` 컴파일 후 `dist-installer/IpName2_v1.13.9_Setup.exe` 산출물을 `softprops/action-gh-release@v3`로 GitHub Releases에 자동 첨부.

---

## 4. GitHub Release 노트 복사용 템플릿 (v1.13.9)

새 버전 릴리스 시 GitHub Releases 본문 작성에 바로 활용할 수 있는 표준 템플릿입니다:

```markdown
## AhBiYout IpName2 v1.13.9 Release

Windows 10/11(64-bit)용 초고속 시스템 이름 및 네트워크 어댑터·다중 IP 관리 유틸리티 **IpName2 v1.13.9** 정식 배포입니다.

### ✨ 주요 개선 사항 (v1.13.6 ~ v1.13.9)
- **사용자 기본 언어 자동 감지 & 4개 국어(KO/EN/JA/ZH) 완전 동적 지원**: OS/브라우저 로캘 자동 감지와 상·하단 원클릭 4개 국어 전환, 모든 UI 레이블·업데이트 모달·ARP/Ping 진단 메시지 및 생성된 PowerShell 스크립트 주석의 실시간 다국어 동적 생성을 구현했습니다.
- **7차 심층 감사 및 Win32 네이티브 안정화**: 언어 전환 시 스크립트 주석 클로저 동기화(`useSystemConfig.ts`), `<html lang>` 속성 연동, Rust Win32 레지스트리 `u16` 정렬 UB 제거 및 `lpSockaddr.is_null()` 방어 가드를 적용했습니다.
- **단일 화면 전체 표시 창 크기 확장 (`650x920`) & `ExternalLink` 단일 실행 보호**: 데스크톱 창 높이(`650x920`, 최소 `650x760`) 내 하단 푸터까지 일괄 표시하며 WebView2 외부 링크 중복 실행 현상을 완벽히 차단합니다.
- **SWR 즉시 부팅 & 2단계 비차단 어댑터 파이프라인**: 직전 캐시 즉시 복원 + Win32 네이티브 병렬 조회(`<50ms`) 후 백그라운드 PowerShell 보강으로 실행 속도를 최적화했습니다.

### 📦 다운로드 및 설치
- **`IpName2_v1.13.9_Setup.exe`**: Windows 10/11 64비트 공식 Inno Setup 설치 프로그램 (관리자 권한 UAC 실행 지원)

### 🔗 공식 링크
- **공식 블로그**: https://ahbiyoutvibe.blogspot.com/
- **소속**: (주)청운정보시스템 ( https://cisnet.co.kr )
- **소스 코드 및 문서**: https://github.com/AhBiYout-all/IpName2
```
