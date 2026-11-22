# 구글 블로거(Google Blogger) 공식 포스팅 가이드 및 콘텐츠

본 문서는 공식 블로그 [AhBiYout Vibe (https://ahbiyoutvibe.blogspot.com/)](https://ahbiyoutvibe.blogspot.com/)에 게시할 수 있도록 최신 **AhBiYout IpName2 (v1.13.12)** 사양으로 작성된 공식 배포 소개 글입니다.

구글 블로거 글쓰기 화면의 **`[작성 모드 (서식 있는 텍스트)]`**와 **`[HTML 편집 모드]`** 모두에 바로 붙여넣어 발행할 수 있도록 메타데이터, 일반 서식 본문, 완성형 반응형 HTML 소스 코드를 함께 제공합니다.

---

## 1. 블로거(Blogger) 발행 설정 정보

| 설정 항목 | 권장 입력값 |
| :--- | :--- |
| **포스트 제목 (Title)** | **[추천]** [Windows 유틸리티] AhBiYout IpName2 v1.13.12 - 초고속 네트워크 IP 설정 & 관리자 도구 (4개 국어 자동 감지, 다중 IP, Layer-2 충돌 감지, 포터블 지원) |
| **대체 제목 (영문/간결)** | AhBiYout IpName2 v1.13.12: The Ultimate Windows Network & IP Management Tool |
| **커스텀 퍼머링크 (Permalink)** | `ahbiyout-ipname2-network-manager-v1-13` |
| **라벨 / 태그 (Labels)** | `Windows 유틸리티`, `네트워크 관리`, `IP설정`, `Tauri v2`, `IpName2`, `오픈소스`, `CisNet`, `청운정보시스템`, `AhBiYout`, `고정IP`, `DNS설정`, `다중IP`, `다국어지원`, `포터블` |
| **검색 설명 (Meta Description)** | Windows 10/11 전용 초경량 네트워크 관리 도구 AhBiYout IpName2 v1.13.12 출시! 설치본(_Setup.exe)과 무설치 포터블(_Portable.exe/.zip) 동시 지원, 6단계 스마트 인스톨러, 4개 국어 자동 감지 및 동적 스크립트 생성, 다중 IP 바인딩, Layer-2 ARP IP 충돌 감지를 무료로 만나보세요. |

---

## 2. [작성 모드 (서식 있는 텍스트)] 블로그 본문

> 💡 **사용 방법**: 구글 블로거 글쓰기 화면이 **[작성 보기(서식 있는 텍스트)]** 상태일 때, 아래 구분선(`---`) 사이의 내용을 복사해 붙여넣거나 마크다운 변환기에 그대로 넣어 발행하세요.

---

### 복잡한 윈도우 네트워크 설정 창과 작별하세요! 초경량 초고속 네트워크 도구 AhBiYout IpName2 v1.13.12 공개

사무실이나 개발 환경, 공장 인라인 장비 또는 데이터센터에서 네트워크 설정을 변경할 때, 윈도우 제어판의 '네트워크 연결'과 속성 창을 열고, IPv4 속성을 클릭하고, 관리자 창을 수없이 거치느라 번거로우셨나요?

**AhBiYout IpName2**는 네트워크 엔지니어, 시스템 관리자, 개발자 및 일반 사용자가 윈도우 환경에서 **단 한 번의 클릭만으로 IP 주소, 서브넷 마스크, 게이트웨이, DNS, 컴퓨터 이름까지 안전하고 신속하게 변경하고 진단**할 수 있도록 설계된 차세대 Windows 전용 데스크톱 유틸리티입니다.

무거운 Electron 프레임워크 대신 **Rust 기반의 Tauri v2.11과 순수 C99 네이티브 Win32 엔진(`ipname_core.dll`)**으로 개발되어 **설치 용량 단 15MB, 메모리 점유율 30MB 미만, SWR 캐시 기반 0초대 즉시 기동**의 압도적인 반응 속도를 제공합니다.

---

#### 🚀 IpName2 v1.13.12의 9대 핵심 기능

1. **원클릭 네트워크 속성 변경 & 재부팅 없는 즉각 반영**
   - IP 주소, 서브넷 마스크(`/24`~`/30` 프리셋 지원), 기본 게이트웨이, 기본/보조 DNS 서버를 직관적인 입력 폼에서 한 번에 수정합니다.
   - DHCP(자동 IP 할당)와 고정 IP 모드를 버튼 하나로 전환하며, 적응형 Win32 상태 폴링으로 반영 즉시 UI가 갱신됩니다.

2. **단일 랜카드 다중 IP (Multi-IP) 무제한 바인딩 & 스마트 우선 정렬**
   - 가상화 서버, 사내 인트라넷, 설비·PLC 통신 등에 필수적인 **보조 IP(Secondary IP)**를 손쉽게 추가·삭제하고 `netsh`로 안전하게 바인딩합니다.
   - 기본 게이트웨이·DHCP 연결 IPv4 주소를 대표 IP(Primary)로 자동 우선 정렬합니다.

3. **물리(Physical) vs 가상(Virtual) 어댑터 100% 정밀 분리**
   - Hyper-V, VMware, VirtualBox, QEMU, Xen, Parallels, WSL2, WireGuard, OpenVPN 등 가상 어댑터가 섞여 있어도 **NDIS 커널 플래그와 IEEE 6-Hex MAC OUI 분석**으로 물리 랜카드와 가상 인터페이스를 정확히 분리합니다.
   - 상단 **[물리 어댑터] / [가상 어댑터] / [전체]** 필터 탭으로 필요한 카드만 깔끔하게 관리할 수 있습니다.

4. **방화벽을 통과하는 Layer-2 ARP 기반 IP 충돌 사전 감지**
   - 고정 IP 적용 전, **OSI 2계층 ARP(`SendARP`)** 패킷으로 동일 대역 내 점유 기기의 MAC 주소를 10~50ms 내에 탐지합니다.
   - **자체 MAC 화이트리스트 필터링**으로 본인 PC가 사용 중인 IP를 검사할 때 발생하는 오탐을 원천 차단하며, 오류 예외 상황도 정확히 경고로 구분해 표시합니다.

5. **인프로세스 초고속 ICMP Ping & 리얼 공인 IP 실시간 감지**
   - 별도의 검은 CMD 창이 깜빡이지 않고 앱 내부에서 DNS·게이트웨이 RTT(ms)와 TTL을 즉시 계측합니다.
   - 상단 **리얼 IP(WAN) 바**에서 현재 회선의 외부 공인 IP와 ISP 통신사(KT, SK, LG U+ 등), 위치 정보를 한눈에 확인하고 복사할 수 있습니다.

6. **랜카드 전원(사용/사용 안 함) 원클릭 제어 & 안전 잠금**
   - 네트워크 먹통 시 제어판에 들어가지 않고 카드 상단 전원 버튼으로 즉시 비활성화 후 재가동할 수 있으며, 중복 클릭 방지(`isSavingRef`)와 안전 확인 모달로 오작동을 예방합니다.

7. **SWR 즉시 화면 복원 & 650x920 한눈에 보는 단일 화면 뷰포트 (`v1.13.6+`)**
   - 앱 실행 즉시 직전 네트워크 스냅샷을 표시하고 `<50ms` 내에 Win32 네이티브 정보로 실시간 갱신해 대기 시간을 없앴습니다.
   - 세로 창 크기를 **`650px × 920px`**(최소 `650x760`)로 최적화해 상단 헤더부터 어댑터 설정, 빠른 DNS(KT/SKT/LG U+), CMD/Ping 버튼, 최하단 푸터까지 스크롤 없이 한 화면에 모두 들어옵니다.

8. **4개 국어(한국어·영어·일본어·중국어) 자동 감지 & 동적 스크립트 주석 (`v1.13.8 ~ v1.13.9` 신규)**
   - 앱 실행 시 사용자 OS/브라우저 언어를 자동으로 감지해 한국어(`KO`), 영어(`EN`), 일본어(`JP`), 중국어 간체(`CN`) 중 최적의 UI로 즉시 전환하며, 헤더/푸터 버튼으로 언제든지 수동 변경할 수 있습니다.
   - 업데이트 모달, ARP 충돌 진단, Ping 상태, 서브넷 프리셋 설명은 물론 **실행되는 PowerShell 설정 스크립트 내부의 명령별 주석까지 현재 선택된 언어에 맞춰 실시간 동적 생성**됩니다.

9. **Tauri 외부 링크 단일 브라우저 실행 보호 & Win32 네이티브 안정화 (`v1.13.9` 심층 감사)**
   - 하단 푸터 및 정보·업데이트 모달의 바로가기 클릭 시 브라우저 창이 두 번 열리던 WebView2 중복 실행 현상을 `ExternalLink` 전용 런처로 해결했고, GitHub Releases 실시간 자동 업데이트를 지원합니다.
   - 7차 심층 감사를 통해 Rust Win32 레지스트리 비정렬 `u16` 디코딩 UB 제거 및 `lpSockaddr` NULL 가드까지 완료해 안정성을 극대화했습니다.

---

#### 📊 기존 도구와의 비교 분석

| 비교 항목 | 기존 윈도우 기본 설정 창 | 일반 오픈소스 도구 (Electron 기반) | **AhBiYout IpName2 (v1.13.12)** |
| :--- | :--- | :--- | :--- |
| **설치 용량** | 윈도우 내장 (진입 경로 복잡) | 120MB ~ 250MB | **단 15MB (경량 인스톨러 & 포터블)** |
| **메모리 점유율** | N/A | 180MB ~ 350MB | **25MB ~ 35MB (Rust 최적화)** |
| **초기 기동 속도** | 클릭 5회 이상 필요 | 3~5초 (Chromium 구동) | **SWR 즉시 표시 + 50ms Win32 동기화** |
| **화면 구성** | 여러 창 중첩 이동 | 스크롤·메뉴 분산 | **650x920 단일 화면 전체 표시** |
| **다중 IP 할당** | 고급 설정 깊숙이 위치 | 미지원 또는 불안정 | **단일 UI 내 원클릭 추가/삭제** |
| **IP 충돌 감지** | 사전 감지 불가 (적용 후 에러) | ICMP Ping (방화벽 시 미감지) | **Layer-2 SendARP + 본인 MAC 예외 필터** |
| **물리/가상 분리** | 단순 텍스트 나열 | 구분 모호 | **IEEE 6-Hex OUI + NDIS 다중 필터링** |
| **진단 도구** | 별도 CMD 창 실행 필요 | 외부 프로세스 래핑 | **인프로세스 ICMP / TCP 직접 진단** |

---

#### 📥 다운로드 및 설치 안내

IpName2는 광고나 불필요한 번들이 일절 없는 100% 클린 오픈소스 소프트웨어입니다.

* **최신 릴리스 다운로드**: [GitHub 공식 릴리스 페이지 (https://github.com/AhBiYout-all/IpName2/releases)](https://github.com/AhBiYout-all/IpName2/releases)
* **공식 설치 프로그램**: `IpName2_v1.13.12_Setup.exe`
* **단일 실행 포터블**: `IpName2_v1.13.12_Portable.exe` (무설치 단독 실행)
* **포터블 압축 패키지**: `IpName2_v1.13.12_Portable.zip` (`IpName2.exe`, `ipname_core.dll`, `IpName2.ico`, `LICENSE` 포함)
* **지원 운영체제**: Microsoft Windows 10 / Windows 11 (64-bit 권장)
* **필요 권한**: Windows 네트워크 어댑터 제어를 위한 관리자(UAC) 권한

> 💡 **설치 팁**: Inno Setup 6 기반 6단계 스마트 인스톨러(`실행 앱 강제 종료 ➔ 기존 설치 삭제/덮어쓰기 선택 ➔ MIT 라이선스 동의 ➔ 설치 및 방화벽 등록 ➔ 바탕화면 바로가기 체크 ➔ 앱 실행`)와 무설치 포터블(`_Portable.exe`, `_Portable.zip`) 중 원하는 방식을 선택해 바로 사용하세요.

---

#### 🌐 공식 링크 및 문의 채널

* **공식 블로그**: [AhBiYout Vibe (https://ahbiyoutvibe.blogspot.com/)](https://ahbiyoutvibe.blogspot.com/)
* **소속**: [(주)청운정보시스템 ( cisnet.co.kr )](https://cisnet.co.kr)
* **GitHub 저장소**: [https://github.com/AhBiYout-all/IpName2](https://github.com/AhBiYout-all/IpName2)
* **제작자**: AhBiYout ([https://github.com/AhBiYout-all](https://github.com/AhBiYout-all))

사용 중 개선 건의 사항이나 버그가 발견되면 블로그 댓글이나 GitHub Issue를 통해 남겨주세요. 감사합니다!

---

## 3. [HTML 편집 모드] 완성형 반응형 HTML 코드

> 💡 **사용 방법**: 구글 블로거 글쓰기 화면 좌측 상단 연필/HTML 전환 버튼에서 **`[<>] HTML 보기`**를 선택한 뒤, 아래 HTML 코드 블록 전체를 복사해 붙여넣으시면 다크·네온 카드 스타일 레이아웃이 즉시 적용됩니다.

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', Helvetica, Arial, sans-serif; line-height: 1.7; color: #2d3748; max-width: 820px; margin: 0 auto; padding: 15px;">

  <!-- Hero Header Banner -->
  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%); color: #ffffff; padding: 36px 25px; border-radius: 16px; margin-bottom: 28px; box-shadow: 0 10px 25px rgba(0,0,0,0.16); text-align: center;">
    <div style="display: inline-block; background-color: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; color: #38bdf8; font-size: 13px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;">
      공식 출시 &middot; Windows 10 / 11 (64-bit) 전용 유틸리티
    </div>
    <h1 style="font-size: 28px; font-weight: 800; margin: 0 0 12px 0; line-height: 1.3; color: #f8fafc;">
      AhBiYout IpName2 v1.13.12
    </h1>
    <p style="font-size: 15.5px; color: #cbd5e1; max-width: 660px; margin: 0 auto 22px auto; line-height: 1.55;">
      설치본 &amp; 포터블 동시 제공 &middot; 4개 국어 자동 감지 &middot; SWR 즉시 기동 &middot; 650x920 단일 화면 UI &middot; Layer-2 ARP 충돌 감지
    </p>
    <a href="https://github.com/AhBiYout-all/IpName2/releases" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);">
      🚀 최신 릴리스 v1.13.12 무료 다운로드
    </a>
  </div>

  <!-- Introduction -->
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
    <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 14px; border-bottom: 2px solid #0284c7; padding-bottom: 8px;">
      🌟 복잡한 윈도우 네트워크 설정 창과 작별하세요!
    </h2>
    <p style="font-size: 15px; color: #475569; margin: 0 0 12px 0;">
      사무실, 연구실, 공장 자동화 현장 또는 데이터센터에서 네트워크 설정을 변경할 때, 제어판과 어댑터 속성 창을 수없이 클릭하느라 시간을 허비하셨나요?
    </p>
    <p style="font-size: 15px; color: #475569; margin: 0;">
      <strong>AhBiYout IpName2 v1.13.12</strong>은 관리자가 단 한 번의 조작으로 <strong>IPv4 주소, 다중 보조 IP, 서브넷 마스크, 게이트웨이, DNS 서버, 컴퓨터 이름(NetBIOS)을 안전하고 신속하게 변경</strong>할 수 있는 스마트 네트워크 유틸리티입니다. <strong>Tauri v2 + Rust + 순수 C99 Win32 엔진(<code>ipname_core.dll</code>)</strong>을 결합해 설치 용량 단 15MB, SWR 즉시 부팅과 4개 국어 자동 감지·세로 스크롤 없는 한 화면 뷰포트를 제공합니다.
    </p>
  </div>

  <!-- v1.13.12 Highlight Banner -->
  <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 18px 22px; margin-bottom: 26px;">
    <h3 style="font-size: 16.5px; font-weight: 700; color: #0369a1; margin: 0 0 10px 0;">
      ✨ v1.13.12 주요 업데이트 하이라이트
    </h3>
    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #334155; line-height: 1.65;">
      <li><strong>GitHub Releases 포터블 배포본(_Portable.exe &amp; _Portable.zip) 추가</strong>: 별도 설치 없는 단일 실행 포터블 파일과 <code>ipname_core.dll</code>이 포함된 무설치 ZIP 패키지를 정식 릴리스에 함께 제공합니다.</li>
      <li><strong>Inno Setup 6단계 스마트 인스톨러 개편</strong>: 실행 중 앱 자동 강제 종료 ➔ 기존 설치 삭제/덮어쓰기 선택 ➔ MIT 라이선스 동의 ➔ 설치 및 방화벽 등록 ➔ 완료 화면 바탕화면 바로가기 체크 ➔ 앱 실행 순서로 깔끔하게 설치됩니다.</li>
      <li><strong>4개 국어(KO/EN/JA/ZH) 자동 감지 &amp; 동적 스크립트 주석</strong>: OS/브라우저 언어를 자동 인식하고 헤더·푸터에서 원클릭 전환하며, 모든 진단 메시지·업데이트 모달과 실행 PowerShell 스크립트 주석까지 선택 언어로 동적 생성합니다.</li>
      <li><strong>7차 심층 감사 &amp; Win32 네이티브 안정화</strong>: 언어 전환 시 스크립트 클로저 동기화, HTML lang 연동, Rust Win32 레지스트리 비정렬 UB 및 NULL 포인터 방어 가드를 적용했습니다.</li>
      <li><strong>한눈에 보는 세로 뷰포트 확장 (650x920) &amp; ExternalLink 보호</strong>: 창 높이를 920px로 확장해 하단 푸터까지 일괄 표시하고 외부 링크 중복 실행을 차단합니다.</li>
    </ul>
  </div>

  <!-- Feature Grid -->
  <h2 style="font-size: 21px; font-weight: 700; color: #0f172a; margin: 28px 0 16px 0; border-left: 4px solid #0284c7; padding-left: 10px;">
    🔥 핵심 기능 한눈에 보기
  </h2>

  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 15px; margin-bottom: 28px;">

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px;">
      <div style="font-size: 24px; margin-bottom: 8px;">⚡</div>
      <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">SWR 0초 기동 &amp; 원클릭 전환</h3>
      <p style="font-size: 13.5px; color: #64748b; margin: 0; line-height: 1.5;">직전 캐시 즉시 표시 후 Win32 병렬 조회로 50ms 내 갱신되며 DHCP/고정 IP를 재부팅 없이 전환합니다.</p>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px;">
      <div style="font-size: 24px; margin-bottom: 8px;">🌐</div>
      <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">단일 랜카드 다중 IP 지원</h3>
      <p style="font-size: 13.5px; color: #64748b; margin: 0; line-height: 1.5;">보조 IP를 무제한 추가하고 대표 IP를 게이트웨이 기준 자동 정렬하며 netsh로 완벽 바인딩합니다.</p>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px;">
      <div style="font-size: 24px; margin-bottom: 8px;">🛡️</div>
      <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">Layer-2 ARP 충돌 감지</h3>
      <p style="font-size: 13.5px; color: #64748b; margin: 0; line-height: 1.5;">방화벽을 통과하는 ARP SendARP와 본인 MAC 화이트리스트 기술로 오탐 없는 정밀 충돌 검사를 제공합니다.</p>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px;">
      <div style="font-size: 24px; margin-bottom: 8px;">🔍</div>
      <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">물리/가상 어댑터 정밀 분리</h3>
      <p style="font-size: 13.5px; color: #64748b; margin: 0; line-height: 1.5;">Hyper-V, VMware, VirtualBox, Xen, WSL, VPN 인터페이스를 6-Hex MAC OUI 및 NDIS 분석으로 100% 구분합니다.</p>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px;">
      <div style="font-size: 24px; margin-bottom: 8px;">📡</div>
      <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">초고속 Ping &amp; 리얼 공인 IP</h3>
      <p style="font-size: 13.5px; color: #64748b; margin: 0; line-height: 1.5;">외부 CMD 창 없는 인프로세스 ICMP Ping 계측과 실시간 외부 공인 WAN IP·ISP 통신사 표시를 지원합니다.</p>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px;">
      <div style="font-size: 24px; margin-bottom: 8px;">🔌</div>
      <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">랜카드 전원 제어 &amp; 650x920 UI</h3>
      <p style="font-size: 13.5px; color: #64748b; margin: 0; line-height: 1.5;">어댑터 사용/사용 안 함 원클릭 제어와 스크롤 없는 650x920 단일 화면 레이아웃(4종 테마)을 제공합니다.</p>
    </div>

  </div>

  <!-- Comparison Table -->
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; margin-bottom: 28px;">
    <h2 style="font-size: 19px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 14px;">
      📊 도구별 성능 및 사양 비교
    </h2>
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; text-align: left;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 10px 12px; font-weight: 700; color: #334155;">비교 항목</th>
            <th style="padding: 10px 12px; font-weight: 700; color: #64748b;">윈도우 기본 제어판</th>
            <th style="padding: 10px 12px; font-weight: 700; color: #0369a1;">AhBiYout IpName2 v1.13.12</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 12px; font-weight: 600; color: #475569;">설치 용량</td>
            <td style="padding: 10px 12px; color: #64748b;">내장 (경로 5단계 이상)</td>
            <td style="padding: 10px 12px; font-weight: 700; color: #0284c7;">단 15MB 경량 설치본 (Inno Setup)</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0; background: #fafafa;">
            <td style="padding: 10px 12px; font-weight: 600; color: #475569;">메모리 &amp; 실행 속도</td>
            <td style="padding: 10px 12px; color: #64748b;">N/A (메뉴 탐색 지연)</td>
            <td style="padding: 10px 12px; font-weight: 700; color: #0284c7;">약 25~35MB &middot; SWR 즉시 표시</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 12px; font-weight: 600; color: #475569;">화면 뷰포트</td>
            <td style="padding: 10px 12px; color: #64748b;">다중 팝업 창 이동</td>
            <td style="padding: 10px 12px; font-weight: 700; color: #0284c7;">650x920 단일 화면 전체 표시</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0; background: #fafafa;">
            <td style="padding: 10px 12px; font-weight: 600; color: #475569;">IP 충돌 검사</td>
            <td style="padding: 10px 12px; color: #dc2626;">사전 검사 불가 (충돌 시 끊김)</td>
            <td style="padding: 10px 12px; font-weight: 700; color: #16a34a;">Layer-2 SendARP + 본인 MAC 보호</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 12px; font-weight: 600; color: #475569;">다중 IP 추가</td>
            <td style="padding: 10px 12px; color: #64748b;">고급 옵션 진입 필요</td>
            <td style="padding: 10px 12px; font-weight: 700; color: #0284c7;">UI 내 원클릭 추가 &amp; 자동 정렬</td>
          </tr>
          <tr style="background: #fafafa;">
            <td style="padding: 10px 12px; font-weight: 600; color: #475569;">물리/가상 분류</td>
            <td style="padding: 10px 12px; color: #64748b;">단순 이름 나열</td>
            <td style="padding: 10px 12px; font-weight: 700; color: #0284c7;">전용 탭 분리 &amp; 6-Hex OUI 판별</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Download & Links Callout -->
  <div style="background: linear-gradient(to right, #f0fdf4, #e0f2fe); border: 1px solid #bbf7d0; border-radius: 12px; padding: 22px; margin-bottom: 26px;">
    <h3 style="font-size: 17px; font-weight: 700; color: #166534; margin: 0 0 10px 0;">
      📥 지금 바로 무료로 다운로드하세요
    </h3>
    <p style="font-size: 14px; color: #374151; margin: 0 0 15px 0;">
      IpName2는 모든 개인 및 기업 환경에서 100% 무료로 사용할 수 있는 순수 MIT 오픈소스 프로젝트입니다.<br>
      (설치본: <code>IpName2_v1.13.12_Setup.exe</code> &middot; 포터블: <code>IpName2_v1.13.12_Portable.exe</code> / <code>IpName2_v1.13.12_Portable.zip</code>)
    </p>
    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
      <a href="https://github.com/AhBiYout-all/IpName2/releases" target="_blank" rel="noopener noreferrer" style="background: #16a34a; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 9px 18px; border-radius: 8px;">
        📦 GitHub Release 다운로드
      </a>
      <a href="https://github.com/AhBiYout-all/IpName2" target="_blank" rel="noopener noreferrer" style="background: #334155; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 9px 18px; border-radius: 8px;">
        💻 GitHub 소스코드 보기
      </a>
      <a href="https://cisnet.co.kr" target="_blank" rel="noopener noreferrer" style="background: #ffffff; color: #1e293b; border: 1px solid #cbd5e1; text-decoration: none; font-weight: 700; font-size: 14px; padding: 9px 18px; border-radius: 8px;">
        🏢 (주)청운정보시스템 ( cisnet.co.kr )
      </a>
    </div>
  </div>

  <!-- Footer Info -->
  <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12.5px; color: #94a3b8; text-align: center;">
    &copy; 2026 AhBiYout. All rights reserved. &middot; Official Blog: <a href="https://ahbiyoutvibe.blogspot.com/" target="_blank" rel="noopener noreferrer" style="color: #64748b;">AhBiYout Vibe</a> &middot; Affiliation: <a href="https://cisnet.co.kr" target="_blank" rel="noopener noreferrer" style="color: #64748b;">(주)청운정보시스템 ( cisnet.co.kr )</a>
  </div>

</div>
```

---

## 4. 블로그 포스팅 체크리스트

발행 전 아래 항목들을 최종 점검하세요:
- [ ] 구글 블로거 새 글 작성 진입 (`https://draft.blogger.com/` 또는 `blogger.com`)
- [ ] 제목에 권장 제목(`AhBiYout IpName2 v1.13.12`) 입력
- [ ] 라벨(Labels)에 `Windows 유틸리티`, `네트워크 관리`, `IP설정`, `Tauri v2`, `IpName2`, `다중IP`, `다국어지원` 추가
- [ ] 우측 메뉴 **[링크]**에서 맞춤 URL 선택 후 `ahbiyout-ipname2-network-manager-v1-13` 입력
- [ ] 우측 메뉴 **[검색 설명]**에 메타 설명 붙여넣기
- [ ] 본문 입력창에서 **`[작성 모드 (서식 있는 텍스트)]`**(2번 섹션) 또는 **`[<>] HTML 보기`**(3번 섹션 HTML 코드) 중 원하는 모드로 내용 붙여넣기
- [ ] 실제 프로그램 실행 스크린샷(650x920 단일 화면 전체 UI, ARP 충돌 검사, 가상 어댑터 분리) 1~3장 삽입
- [ ] **[게시]** 클릭하여 공개 발행
