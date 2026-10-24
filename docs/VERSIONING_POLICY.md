# 소프트웨어 버전 관리 및 문서화 정책 (Versioning & Documentation Policy)

본 문서는 **AhBiYout IpName2** 프로젝트의 소프트웨어 버전 관리(Semantic Versioning: MAJOR.MINOR.PATCH) 원칙과 코드 수정 시 패치노트 자동 기록 및 신규 문서화 규정을 정의합니다.

---

## 1. 시맨틱 버저닝 (Semantic Versioning 2.0.0) 3단계 원칙

모든 소프트웨어 릴리스 버전은 `MAJOR.MINOR.PATCH` 형식(예: `1.6.0`)으로 표기하며, 변경 규모와 성격에 따라 3단계로 명확히 분리하여 승급합니다.

```
  v [MAJOR] . [MINOR] . [PATCH]
       │         │         │
       │         │         └── 3단계: 버그 수정, 설정/포트 미세 조정, 리팩토링
       │         └──────────── 2단계: 하위 호환 가능한 신규 기능 및 모듈 추가
       └────────────────────── 1단계: 하위 호환성을 깨는 대규모 구조/아키텍처 변경
```

### 1.1. MAJOR (주요 버전 승급: `X.0.0`)
* **승급 기준**: 기존 동작과의 **하위 호환성이 깨지는 대규모 아키텍처 개편**이 발생했을 때 승급합니다.
* **적용 사례**:
  - 지원 운영체제(OS) 최소 사양의 근본적 변경 (예: 64-bit 전용화, 특정 Windows 빌드 미만 지원 중단)
  - 핵심 런타임 플랫폼 전면 전환 (예: Electron ➔ Tauri v2 전환)
  - Native API 통신 프로토콜 및 데이터 구조의 비호환 재설계
  - 데이터 저장소 포맷의 완전한 파괴적 변경

### 1.2. MINOR (부 버전 승급: `1.X.0`)
* **승급 기준**: 기존 시스템과의 **하위 호환성을 유지하면서 새로운 기능, 도구, 제어 모듈이 추가**되었을 때 승급합니다.
* **적용 사례**:
  - **랜카드(네트워크 어댑터) 사용/사용 안 함 원클릭 제어 기능 탑재** (v1.6.0)
  - **스마트 IP 보조 시스템(C-Class 게이트웨이 자동 동기화)** 추가 (v1.6.0)
  - **리얼 IP (외부 공인 IP & ISP 통신사) 실시간 감지 위젯 탑재** (v1.7.0)
  - **순수 창작 네이티브 DLL(`ipname_core.dll`) 및 Layer-2 ARP IP 충돌 감지 엔진 신규 탑재** (v1.9.0)
  - **GitHub Releases 실시간 자동 업데이트 팝업 및 핵심 빌드 파일 전용 관리 파이프라인 구축** (v1.10.0)
  - **단일 랜카드 다중 IP (Multi-IP) 할당 및 물리/가상 어댑터 분리 탭 UI 탑재** (v1.11.0)
  - **C99 C-ABI 네이티브 DLL 통합 및 IEEE 하이퍼바이저 OUI 기반 물리/가상 100% 구분 엔진** (v1.12.0)

### 1.3. PATCH (수정 버전 승급: `1.X.Y`)
* **승급 기준**: 하위 호환성을 유지하는 **버그 수정, 성능 최적화, UI/UX 미세 조정 및 단순 설정 변경**이 발생했을 때 승급합니다.
* **적용 사례**:
  - 데스크톱 기본 창 크기 조정 (650x800 고정 규격 최적화)
  - 기본 개발/통신 포트 변경 (3030 표준화)
  - 유효 IPv4 주소 우선 탐색 및 `primaryIp` 강제 승격 (`sortAdaptersAndEnforcePrimaryIp`, v1.12.2)
  - 자체 어댑터 MAC 주소 대조를 통한 본인 IP 재적용 시 충돌 오탐 방지 (`IpName_CheckIpConflictEx`, v1.12.3)
  - 32개 핵심 필수 파일 화이트리스트 감사 파이프라인 및 로컬 푸시 스크립트 Git 추적 격리 (v1.12.5)
  - GitHub Actions Node 24 러너 마이그레이션 및 웹/태그 듀얼 푸시 CI/CD 파이프라인 구축 (v1.12.6)
  - 타 IP Name 앱 대상 AI 통합 마이그레이션 작업지시서(`UPDATE_WORK_INSTRUCTION.md`) 수립 (v1.12.7)
  - 배치 스크립트 특수문자(`&`) 구문 오류 방지 및 CMD 중첩 괄호 파싱 결함 해결

---

## 2. 코드 수정 특이점 발생 시 자동 기록 프로세스 (Automated Workflow)

AI 코딩 어시스턴트 및 개발자는 소스 코드 수정 시 **특이점(Significant Change)**이 감지되면 다음 절차를 **의무적으로 자동 수행**합니다.

### 2.1. 특이점 감지 기준
1. **신규 기능/UI 요소 추가**: 새로운 버튼, 모달, 입력기능, 시스템 제어 로직이 추가된 경우
2. **동작 로직 변경**: 네트워크 명령, API 호출, 권한 승급 방식 등이 변경된 경우
3. **규격 및 환경 변경**: 윈도우 크기, 통신 포트, 의존성 라이브러리, 빌드 스크립트 수정 시
4. **버그 수정**: 오작동, 예외 처리, 레이아웃 깨짐 현상을 교정한 경우

### 2.2. 자동 반영 단계
1. **버전 산정**:
   - 변경 규모에 따라 `PATCH` 또는 `MINOR`, `MAJOR` 중 적합한 버전을 결정합니다.
2. **버전 동기화 (Triple Lockstep & Multi-Tier Sync)**:
   - `package.json` ➔ `"version": "X.Y.Z"` 업데이트
   - `src-tauri/tauri.conf.json` ➔ `"version": "X.Y.Z"` 및 `"productName"` 업데이트
   - `src-tauri/Cargo.toml` ➔ `version = "X.Y.Z"` 업데이트
   - `native/ipname_core/src/ipname_core.c` ➔ `#define IPNAME_CORE_VERSION "X.Y.Z"` 동기화
   - `scripts/github/core-manifest.json` ➔ `"version": "X.Y.Z"` 업데이트
   - `src/i18n/translations.ts` ➔ 버전 표기 문자열 일치
   - `installer/setup.iss` ➔ `#define MyAppVersion "X.Y.Z"` 업데이트
   - `git-push.bat` 및 `bin/postbuild-rename.cjs` ➔ 동적 버전 자동 파싱 반영
3. **`docs/PATCH_NOTES.md` 기록**:
   - 해당 버전 항목(`## [vX.Y.Z] - YYYY-MM-DD`)을 최상단에 추가하고 변경 내역을 명확한 글머리 기호로 상세 기록합니다.
4. **관련 기술 문서 갱신**:
   - `docs/DEVELOPMENT.md`, `docs/ARCHITECTURE.md`, `docs/DLL_SPECIFICATION.md` 등 영향받는 기술 문서를 함께 수정합니다.

---

## 3. `docs` 폴더 내 신규 문서 자동 생성 규칙

다음과 같은 상황이 발생할 경우, 기존 문서를 무한정 늘리는 대신 **신규 마크다운 문서를 `docs/`에 생성**하여 전문성과 가독성을 유지합니다:

| 생성 상황 | 생성할 문서 예시 | 규칙 |
| :--- | :--- | :--- |
| **새로운 시스템 서브모듈 추가** | `docs/BACKUP_RESTORE.md` | 서브모듈 아키텍처, 저장 포맷, 복구 절차 기술 |
| **원격/CLI 명령어 확장** | `docs/CLI_REFERENCE.md` | 커맨드라인 파라미터 및 배치 사용법 기술 |
| **타 프로젝트/AI 마이그레이션 규격** | `docs/UPDATE_WORK_INSTRUCTION.md` | 타 AI를 위한 8대 아키텍처 원칙, 프롬프트, 소스 코드 템플릿 기술 |
| **보안 및 UAC 정책 변경** | `docs/SECURITY_GUIDE.md` | 관리자 권한 승급, PowerShell 서명, 무결성 검증 기술 |
| **배포 및 패키징 자동화** | `docs/DEPLOYMENT_GUIDE.md` | CI/CD 파이프라인 및 서명 인증서 설정 가이드 기술 |

> 📌 **규칙**: 신규 문서 생성 시 반드시 **`docs/README.md`**의 색인표 및 **`scripts/github/core-manifest.json`**의 필수 파일 목록(`requiredFiles`)에 즉시 추가하여 문서 간 연결성과 화이트리스트 무결성을 보장해야 합니다.
