# AI Coding Assistant Persistent Rules (IpName2)

본 문서는 **AhBiYout IpName2** 프로젝트에서 코드를 생성하거나 수정할 때 AI 코딩 어시스턴트가 반드시 준수해야 하는 영구 지침입니다.

---

## 1. 소프트웨어 버전 관리 (Semantic Versioning: MAJOR.MINOR.PATCH) 원칙
코드 수정이나 기능 변경 시 반드시 Semantic Versioning 3단계 원칙에 따라 버전을 명확히 분리하여 관리해야 합니다:

1. **MAJOR (X.0.0 - 1단계: 주요 대규모 변경)**:
   - 하위 호환성을 깨는 대규모 아키텍처 개편, 플랫폼/OS 지원 변경 시 승급.
2. **MINOR (1.X.0 - 2단계: 기능 추가)**:
   - 하위 호환성을 유지하면서 새로운 주요 기능/제어 모듈 추가 시 승급 (예: 랜카드 전원 제어, 스마트 IP 동기화 등).
3. **PATCH (1.6.X - 3단계: 수정 및 개선)**:
   - 하위 호환성을 유지하는 버그 수정, UI/UX 미세 조정, 설정값(포트, 창 크기 등) 최적화 시 승급.

---

## 2. 코드 수정 특이점 발생 시 패치노트 자동 기록 의무
코드 수정 시 특이점(새로운 기능 추가, 로직 변경, 버그 해결, UI 개선, 환경 설정 변경)이 발생하면 **반드시 다음 작업을 자동으로 수행**해야 합니다:

1. **`docs/PATCH_NOTES.md` 자동 갱신**:
   - 최신 버전 번호(`## [vX.Y.Z] - YYYY-MM-DD`)를 최상단에 기재하고, 변경된 상세 내역을 명확한 글머리 기호로 빠짐없이 기록합니다.
2. **버전 삼중 동기화 (Triple Lockstep)**:
   - `package.json`의 `"version"` 필드
   - `src-tauri/tauri.conf.json`의 `"version"` 및 `"productName"` 필드
   - `docs/PATCH_NOTES.md`의 최신 버전 표기
3. **`docs/` 폴더 내 기술 문서 동기화**:
   - `docs/DEVELOPMENT.md` 및 `docs/ARCHITECTURE.md`에 변경된 기능과 아키텍처를 실시간 반영합니다.
4. **신규 문서의 자동 생성**:
   - 대규모 기능이나 독립 서브모듈(백업, 보안, CLI 등)이 추가되는 경우, `docs/` 내에 전용 신규 문서를 생성하고 `docs/README.md` 색인표에 등록합니다.

---

## 3. 프로젝트 핵심 규격 및 불변 사양
- **기본 데스크톱 창 크기**: 가로(Width) 650px x 세로(Height) 800px (고정 크기 유지)
- **기본 통신 및 개발 포트**: 3030 (`vite.config.ts`, `tauri.conf.json`, `build.bat`, `build.ps1` 통일)
- **공식 블로그 주소**: `https://ahbiyoutvibe.blogspot.com/`
- **공식 웹사이트**: `https://cisnet.co.kr`
- **제작자 표기**: AhBiYout (GitHub: `https://github.com/AhBiYout-all`)
- **공식 GitHub 저장소**: `https://github.com/AhBiYout-all/IpName2`
