# IpName2 문서 허브 (Documentation Hub)

본 디렉터리(`/docs`)는 **AhBiYout IpName2 (v1.12.5)** 데스크톱 애플리케이션의 개발, 아키텍처, 순수 창작 DLL, 버전 관리, 패치 노트 및 GitHub 배포 파이프라인을 체계적으로 관리하는 공식 문서 모음입니다.

---

## 📚 문서 색인 (Table of Contents)

| 문서명 | 설명 | 주요 내용 |
| :--- | :--- | :--- |
| **[DEVELOPMENT.md](./DEVELOPMENT.md)** | 개발 및 빌드 가이드 | 환경 설정, 빌드 스크립트(`build.bat`/`ps1`), 데스크톱 규격(650x800), 포트(3030), GitHub 핵심 파일 관리(`scripts/github/`), 실시간 자동 업데이트 |
| **[PATCH_NOTES.md](./PATCH_NOTES.md)** | 버전별 패치 노트 | Semantic Versioning 기준 최신 `v1.12.5` 상세 변경 내역, GitHub 핵심 파일 화이트리스트, git-push.bat 로컬 격리 및 제외 |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | 시스템 아키텍처 명세서 | Rust Tauri Backend, Win32 Native C++ API, 순수 창작 DLL(`ipname_core.dll`), Inno Setup 인스톨러, 실시간 GitHub 업데이트 데이터 흐름 |
| **[DLL_SPECIFICATION.md](./DLL_SPECIFICATION.md)** | 순수 창작 DLL 명세서 | `ipname_core.dll` C-ABI 규격, 물리/가상 어댑터 정밀 판별(`IpName_DistinguishAdapter`), Layer-2 ARP IP 충돌 감지(`SendARP`), 넌블로킹 TCP 포트 진단, 서브넷 비트 연산기, 기존 시스템 DLL 감사 보고서 |
| **[VERSIONING_POLICY.md](./VERSIONING_POLICY.md)** | 버전 관리 및 기록 정책 | **MAJOR.MINOR.PATCH** 3단계 버전 관리 원칙, 버전 삼중 동기화(Triple Lockstep), 다단 동적 버전 자동 추출 및 특이점 기록 규칙 |
| **[LICENSE_NOTICE.md](./LICENSE_NOTICE.md)** | 라이선스 고지사항 | 오픈소스 라이선스 고지 및 MIT License 전문 (Tauri, React, Vite, Tailwind CSS, Lucide, Jimp 등) |

---

## 🚀 빠른 시작 (Quick References)

### 1. 개발 및 빌드
```cmd
:: 로컬 개발 서버 실행 (기본 포트 3030)
npm run dev

:: 프론트엔드 프로덕션 빌드
npm run build

:: Tauri 데스크톱 애플리케이션 원클릭 자동 빌드 & 패키징
build.bat
```

### 2. GitHub 핵심 파일 검증 및 자동 푸시
```cmd
:: 빌드 필수 핵심 파일 무결성 감사 및 스크래치 파일 자동 정리
node scripts\github\verify-core-files.cjs --clean

:: 동적 버전 추출, 커밋, 태그 생성 및 원클릭 GitHub 푸시 파이프라인
git-push.bat
```

---

## 🧭 문서 관리 및 작성 원칙

1. **지속적 동기화 (Continuous Sync)**:
   - 코드에 유의미한 변경(신규 기능 추가, UI 수정, 버그 해결, 빌드 환경 변경, 패키징 최적화)이 발생할 때마다 관련 문서를 실시간으로 동기화합니다.
2. **시맨틱 버저닝 3단계 준수**:
   - 모든 패치 노트는 `MAJOR.MINOR.PATCH` 원칙에 따라 명확히 분류되어 기록됩니다.
3. **신규 문서의 자동 확장**:
   - 새로운 기술 영역(예: 플러그인, 원격 관리, 백업/복원 엔진 등)이 도입되는 경우 `docs/` 내에 즉시 신규 마크다운 문서를 추가하고 본 색인표에 등록합니다.
4. **개인정보 보호 및 공식 채널 단일화**:
   - 문서 내에 개인 이메일을 노출하지 않으며, 공식 GitHub 저장소([https://github.com/AhBiYout-all/IpName2](https://github.com/AhBiYout-all/IpName2)) 및 공식 구글 블로그([https://ahbiyoutvibe.blogspot.com/](https://ahbiyoutvibe.blogspot.com/))로 안내를 일원화합니다.
