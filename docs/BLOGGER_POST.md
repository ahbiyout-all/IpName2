# 구글 블로거(Google Blogger) 공식 포스팅 가이드 및 콘텐츠

본 문서는 공식 블로그 [AhBiYout Vibe (https://ahbiyoutvibe.blogspot.com/)](https://ahbiyoutvibe.blogspot.com/)에 게시할 수 있도록 최적화된 **AhBiYout IpName2 (v1.12.7)** 공식 배포 소개 글입니다.

구글 블로거의 **[작성 모드 (서식 있는 텍스트)]** 및 **[HTML 편집 모드]** 모두에서 즉시 복사하여 발행할 수 있도록 메타데이터, 마크다운 본문, 완성형 HTML 코드를 함께 수록하였습니다.

---

## 1. 블로거(Blogger) 발행 설정 정보

| 설정 항목 | 권장 입력값 |
| :--- | :--- |
| **포스트 제목 (Title)** | **[추천]** [Windows 유틸리티] AhBiYout IpName2 v1.12.7 - 초고속 네트워크 IP 설정 & 관리자 도구 (다중 IP, Layer-2 충돌 감지, 가상 랜카드 완벽 분리) |
| **대체 제목 (영문/간결)** | AhBiYout IpName2: The Ultimate Windows Network & IP Management Tool |
| **커스텀 퍼머링크 (Permalink)** | `ahbiyout-ipname2-network-manager-v1-12` |
| **라벨 / 태그 (Labels)** | `Windows 유틸리티`, `네트워크 관리`, `IP설정`, `Tauri v2`, `IpName2`, `오픈소스`, `CisNet`, `AhBiYout`, `고정IP`, `DNS설정`, `네트워크유틸리티` |
| **검색 설명 (Meta Description)** | Windows 10/11 전용 초경량 네트워크 관리 도구 AhBiYout IpName2 v1.12.7 출시! 원클릭 IP/DNS/컴퓨터 이름 변경, 단일 랜카드 다중 IP 할당, Layer-2 ARP 기반 IP 충돌 감지, 물리/가상 랜카드 자동 판별 기능을 무료로 만나보세요. |

---

## 2. 블로그 본문 (마크다운 포맷)

*(아래 내용을 블로거 일반 편집창에 복사하거나 마크다운 변환기로 바로 사용할 수 있습니다)*

---

### 복잡한 윈도우 네트워크 설정 창과 작별하세요! 초경량 초고속 네트워크 도구 AhBiYout IpName2 v1.12.7 공개

사무실이나 개발 환경, 공장 인라인 장비 또는 데이터센터에서 네트워크 설정을 변경할 때, 윈도우 제어판의 '네트워크 연결'과 속성 창을 열고, IPv4 속성을 클릭하고, 관리자 창을 수없이 거치느라 번거로우셨나요?

**AhBiYout IpName2**는 네트워크 엔지니어, 시스템 관리자, 개발자 및 일반 사용자가 윈도우 환경에서 **단 한 번의 클릭만으로 IP 주소, 서브넷 마스크, 게이트웨이, DNS, 컴퓨터 이름까지 안전하고 신속하게 변경하고 진단**할 수 있도록 설계된 차세대 Windows 전용 데스크톱 유틸리티입니다.

기존의 무거운 Electron 프레임워크를 완전히 탈피하고, **Rust 기반의 Tauri v2와 순수 C99 네이티브 Win32 엔진(`ipname_core.dll`)**으로 개발되어 **설치 용량 단 15MB, 메모리 점유율 30MB 미만, 프로세스 실행 지연 0초**의 압도적인 반응 속도를 제공합니다.

---

### 🚀 IpName2의 8대 핵심 기능

#### 1. 원클릭 네트워크 속성 변경 & 재부팅 없는 즉각 반영
- IP 주소, 서브넷 마스크, 기본 게이트웨이, 기본/보조 DNS 서버를 직관적인 입력 폼에서 한 번에 수정.
- DHCP(자동 IP 할당)와 고정 IP 모드를 버튼 하나로 즉각 전환.
- 변경 버튼 클릭 즉시 Windows 커널 NDIS 드라이버와 통신하여 재부팅 없이 실시간 적용.

#### 2. 단일 랜카드 다중 IP (Multi-IP) 무제한 할당 지원
- 가상화 서버, 사내 인트라넷, PLC 장비 통신 등에 필수적인 **보조 IP (Secondary IP)**를 무제한으로 추가/삭제 가능.
- `netsh interface ipv4 add address` 명령을 백그라운드에서 안전하게 자동 실행하여 다중 IP 바인딩을 완벽하게 동기화.

#### 3. 물리(Physical) vs 가상(Virtual) 어댑터 100% 완벽 구분
- Hyper-V, VMware, VirtualBox, WSL2, Docker, WireGuard, OpenVPN 등 복잡한 가상 어댑터가 혼재된 환경에서도 **물리 하드웨어 랜카드와 가상 네트워크 인터페이스를 100% 정확하게 판별**.
- 상단 탭(`물리 어댑터`, `가상 어댑터`, `전체`)을 통해 관리하고자 하는 인터페이스를 즉시 필터링.

#### 4. 방화벽 차단을 뚫는 Layer-2 ARP 기반 IP 충돌 감지 엔진
- 고정 IP를 부여하기 전, 동일 네트워크 대역에 해당 IP를 점유 중인 기기가 있는지 사전에 검사.
- **방화벽에 막히는 일반 Ping 대신 OSI 2계층 ARP(`SendARP`) 프로토콜을 사용**하여 상대방 PC의 방화벽이 켜져 있어도 점유 여부와 하드웨어 MAC 주소를 정확히 검출.
- **자체 MAC 화이트리스트 필터링 기술** 탑재로, 현재 본인 PC가 점유 중인 IP를 재설정할 때 발생하는 오탐(False Positive)을 원천 차단.

#### 5. 인프로세스 초고속 ICMP Ping & TCP 포트 진단
- 검은색 콘솔(`cmd.exe`) 창이 번쩍거리는 구식 방식 대신, DLL 내부 인프로세스 메모리 통신으로 게이트웨이 및 DNS 응답 지연 시간(RTT)을 0.1ms 정밀도로 실시간 측정.
- TCP 포트 53(DNS), 80(HTTP), 443(HTTPS) 서비스의 활성화 여부를 앱 내부에서 즉시 진단.

#### 6. 랜카드 전원(사용/사용 안 함) 원클릭 제어
- 네트워크 장애 복구의 기본인 랜카드 재부팅(사용 안 함 후 다시 사용)을 제어판 진입 없이 카드 헤더의 전원 스위치 하나로 즉시 제어.

#### 7. C-Class 스마트 게이트웨이 동기화 & 실시간 리얼 IP 감지
- IP 주소 입력 시 서브넷 마스크와 C-Class 게이트웨이(.1)를 자동으로 예측하여 입력 시간을 대폭 단축.
- 공유기 내부 IP뿐만 아니라 현재 회선의 외부 공인 IP(Public WAN IP)와 접속 중인 ISP 통신사를 실시간 조회하여 상단 헤더에 표시.

#### 8. 안전하고 직관적인 컴퓨터 이름(NetBIOS) 변경
- 윈도우 시스템 등록정보를 뒤적일 필요 없이 앱 내에서 즉시 컴퓨터 이름을 변경.
- Windows 표준 규칙(15자 이내, 특수문자 검증)을 실시간으로 유효성 검사하여 시스템 오류 방지.

---

### 📊 기존 도구와의 비교 분석

| 비교 항목 | 기존 윈도우 기본 설정 창 | 일반 오픈소스 도구 (Electron 기반) | **AhBiYout IpName2 (v1.12.7)** |
| :--- | :--- | :--- | :--- |
| **설치 용량** | 윈도우 내장 (진입 경로 복잡) | 120MB ~ 250MB | **단 15MB (경량 Inno Setup)** |
| **메모리 점유율** | N/A | 180MB ~ 350MB | **25MB ~ 35MB (Rust 최적화)** |
| **실행 속도** | 클릭 5회 이상 필요 | 3~5초 (Chromium 구동) | **0.2초 즉시 기동** |
| **다중 IP 할당** | 고급 설정 깊숙이 위치 | 미지원 또는 불안정 | **단일 UI 내 원클릭 추가/삭제** |
| **IP 충돌 감지** | 사전 감지 불가 (적용 후 에러) | ICMP Ping (방화벽 시 미감지) | **Layer-2 SendARP (방화벽 무시)** |
| **물리/가상 분리** | 단순 텍스트 나열 | 구분 모호 | **IEEE OUI + NDIS 다중 필터링** |
| **진단 도구** | 별도 CMD 창 실행 필요 | 외부 프로세스 래핑 | **인프로세스 ICMP / TCP 직접 진단** |

---

### 💻 스크린샷 및 UI 디자인
IpName2는 복잡한 창 크기 조절로 인한 시각적 피로를 없애기 위해 **가로 650px x 세로 800px의 컴팩트한 고정 뷰포트**와 세련된 **다크 테마 (Dark Slate & Neon Accent)** 레이아웃을 채택했습니다.

> 📷 *(스크린샷 권장 위치 1: 메인 화면 - 물리 랜카드 목록 및 다중 IP 설정 UI)*  
> 📷 *(스크린샷 권장 위치 2: IP 충돌 감지 및 네트워크 진단 팝업)*  
> 📷 *(스크린샷 권장 위치 3: 가상 랜카드 필터링 및 리얼 IP 감지 헤더)*

---

### 📥 다운로드 및 설치 안내

IpName2는 악성코드나 광고가 일절 포함되지 않은 100% 클린 오픈소스 소프트웨어입니다.

* **최신 릴리스 다운로드**: [GitHub 공식 릴리스 페이지 (https://github.com/AhBiYout-all/IpName2/releases)](https://github.com/AhBiYout-all/IpName2/releases)
* **공식 설치 파일명**: `IpName2-Setup-v1.12.7.exe`
* **지원 운영체제**: Microsoft Windows 10 / Windows 11 (64-bit 권장)
* **필요 권한**: Windows 네트워크 어댑터 제어를 위한 관리자(UAC) 권한

> 💡 **설치 팁**: Inno Setup 기반의 공식 인스톨러로 배포되며, 시작 메뉴와 바탕화면 바로가기 생성을 지원합니다. 설치 후 실행 시 UAC 관리자 권한 승인 창에서 '예'를 클릭하시면 즉시 모든 네트워크 제어 권한이 활성화됩니다.

---

### 🌐 공식 링크 및 문의 채널

* **공식 블로그**: [AhBiYout Vibe (https://ahbiyoutvibe.blogspot.com/)](https://ahbiyoutvibe.blogspot.com/)
* **공식 웹사이트**: [CisNet (https://cisnet.co.kr)](https://cisnet.co.kr)
* **GitHub 저장소**: [https://github.com/AhBiYout-all/IpName2](https://github.com/AhBiYout-all/IpName2)
* **제작자**: AhBiYout (`ahbiyout@gmail.com`)

사용 중 개선 건의 사항이나 버그가 발견되면 언제든지 블로그 댓글이나 GitHub Issue를 통해 남겨주세요. 감사합니다!

---

## 3. 블로거(Blogger) HTML 소스 코드 모드 복사용 코드

*(구글 블로거 글쓰기 화면 좌측 상단의 연필 아이콘 ➔ **[<>] HTML 보기**를 누른 뒤 아래 HTML 코드를 전체 붙여넣기 하시면 완벽한 반응형 카드 스타일로 즉시 적용됩니다)*

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.7; color: #2d3748; max-width: 820px; margin: 0 auto; padding: 15px;">

  <!-- Hero Header Banner -->
  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%); color: #ffffff; padding: 35px 25px; border-radius: 16px; margin-bottom: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); text-align: center;">
    <div style="display: inline-block; background-color: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; color: #38bdf8; font-size: 13px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;">
      공식 출시 &middot; Windows 10 / 11 전용 유틸리티
    </div>
    <h1 style="font-size: 28px; font-weight: 800; margin: 0 0 12px 0; line-height: 1.3; color: #f8fafc;">
      AhBiYout IpName2 v1.12.7
    </h1>
    <p style="font-size: 16px; color: #cbd5e1; max-width: 650px; margin: 0 auto 20px auto; line-height: 1.5;">
      원클릭 IP/DNS 변경 &middot; 다중 IP 바인딩 &middot; Layer-2 ARP 충돌 사전 감지 &middot; 물리/가상 랜카드 완벽 분리
    </p>
    <a href="https://github.com/AhBiYout-all/IpName2/releases" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4); transition: background 0.2s;">
      🚀 최신 릴리스 v1.12.7 무료 다운로드
    </a>
  </div>

  <!-- Introduction -->
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
    <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 14px; border-bottom: 2px solid #0284c7; padding-bottom: 8px;">
      🌟 복잡한 윈도우 네트워크 설정 창과 작별하세요!
    </h2>
    <p style="font-size: 15px; color: #475569; margin: 0 0 12px 0;">
      사무실, 연구실, 공장 자동화 현장 또는 재택근무 환경에서 네트워크 설정을 변경할 때, 제어판과 어댑터 속성 창을 수없이 클릭하느라 스트레스 받으셨나요?
    </p>
    <p style="font-size: 15px; color: #475569; margin: 0;">
      <strong>AhBiYout IpName2</strong>는 관리자가 단 한 번의 조작으로 <strong>IPv4 주소, 서브넷 마스크, 게이트웨이, DNS 서버, 컴퓨터 이름(NetBIOS)을 안전하고 신속하게 변경</strong>할 수 있도록 개발된 스마트 관리자 도구입니다. 무거운 웹 기반 기술 대신 <strong>Tauri v2 + Rust + 순수 C99 Win32 엔진</strong>을 결합하여 설치 용량 단 15MB, 번개 같은 반응 속도를 자랑합니다.
    </p>
  </div>

  <!-- Feature Grid -->
  <h2 style="font-size: 21px; font-weight: 700; color: #0f172a; margin: 30px 0 18px 0; border-left: 4px solid #0284c7; padding-left: 10px;">
    🔥 핵심 기능 한눈에 보기
  </h2>

  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 30px;">
    
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px;">
      <div style="font-size: 24px; margin-bottom: 8px;">⚡</div>
      <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">원클릭 네트워크 전환</h3>
      <p style="font-size: 13.5px; color: #64748b; margin: 0; line-height: 1.5;">DHCP 자동 할당과 수동 고정 IP를 1초 만에 전환하며, NDIS 커널 통신으로 재부팅 없이 즉시 적용됩니다.</p>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px;">
      <div style="font-size: 24px; margin-bottom: 8px;">🌐</div>
      <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">단일 랜카드 다중 IP 지원</h3>
      <p style="font-size: 13.5px; color: #64748b; margin: 0; line-height: 1.5;">하나의 네트워크 카드에 보조 IP를 무제한 추가하고 충돌을 개별 검사하여 netsh로 완벽 바인딩합니다.</p>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px;">
      <div style="font-size: 24px; margin-bottom: 8px;">🛡️</div>
      <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">Layer-2 ARP 충돌 감지</h3>
      <p style="font-size: 13.5px; color: #64748b; margin: 0; line-height: 1.5;">방화벽을 무시하는 OSI 2계층 ARP 프로토콜과 자체 MAC 화이트리스트 기술로 오탐 없는 정밀 충돌 방지를 제공합니다.</p>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px;">
      <div style="font-size: 24px; margin-bottom: 8px;">🔍</div>
      <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">물리/가상 어댑터 분리</h3>
      <p style="font-size: 13.5px; color: #64748b; margin: 0; line-height: 1.5;">Hyper-V, VMware, VirtualBox, WSL 가상 어댑터를 IEEE MAC OUI 분석을 통해 하드웨어 랜카드와 100% 구분합니다.</p>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px;">
      <div style="font-size: 24px; margin-bottom: 8px;">📡</div>
      <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">초고속 Ping & 포트 진단</h3>
      <p style="font-size: 13.5px; color: #64748b; margin: 0; line-height: 1.5;">외부 CMD 창 없이 인프로세스 ICMP Echo 및 TCP 53/80/443 연결 상태와 RTT 지연 시간을 0.1ms 단위로 측정합니다.</p>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px;">
      <div style="font-size: 24px; margin-bottom: 8px;">🔌</div>
      <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">랜카드 전원 원클릭 제어</h3>
      <p style="font-size: 13.5px; color: #64748b; margin: 0; line-height: 1.5;">네트워크 먹통 시 제어판에 들어갈 필요 없이 앱 상단 전원 버튼으로 어댑터를 즉시 비활성화 후 재가동합니다.</p>
    </div>

  </div>

  <!-- Comparison Table -->
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; margin-bottom: 30px;">
    <h2 style="font-size: 19px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 14px;">
      📊 도구별 성능 및 사양 비교
    </h2>
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; text-align: left;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 10px 12px; font-weight: 700; color: #334155;">비교 항목</th>
            <th style="padding: 10px 12px; font-weight: 700; color: #64748b;">윈도우 기본 제어판</th>
            <th style="padding: 10px 12px; font-weight: 700; color: #0369a1;">AhBiYout IpName2</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 12px; font-weight: 600; color: #475569;">설치 용량</td>
            <td style="padding: 10px 12px; color: #64748b;">내장 (경로 5단계 이상)</td>
            <td style="padding: 10px 12px; font-weight: 700; color: #0284c7;">단 15MB 경량 설치본</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0; background: #fafafa;">
            <td style="padding: 10px 12px; font-weight: 600; color: #475569;">메모리 사용량</td>
            <td style="padding: 10px 12px; color: #64748b;">N/A</td>
            <td style="padding: 10px 12px; font-weight: 700; color: #0284c7;">약 25MB ~ 35MB 초경량</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 12px; font-weight: 600; color: #475569;">IP 충돌 검사</td>
            <td style="padding: 10px 12px; color: #dc2626;">사전 검사 불가 (충돌 시 끊김)</td>
            <td style="padding: 10px 12px; font-weight: 700; color: #16a34a;">Layer-2 SendARP (방화벽 무시)</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0; background: #fafafa;">
            <td style="padding: 10px 12px; font-weight: 600; color: #475569;">다중 IP 추가</td>
            <td style="padding: 10px 12px; color: #64748b;">고급 옵션 진입 필요</td>
            <td style="padding: 10px 12px; font-weight: 700; color: #0284c7;">UI 내 원클릭 추가 & 동기화</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; font-weight: 600; color: #475569;">물리/가상 분류</td>
            <td style="padding: 10px 12px; color: #64748b;">단순 이름 나열</td>
            <td style="padding: 10px 12px; font-weight: 700; color: #0284c7;">전용 탭 분리 & OUI 판별</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Download & Links Callout -->
  <div style="background: linear-gradient(to right, #f0fdf4, #e0f2fe); border: 1px solid #bbf7d0; border-radius: 12px; padding: 22px; margin-bottom: 30px;">
    <h3 style="font-size: 17px; font-weight: 700; color: #166534; margin: 0 0 10px 0;">
      📥 지금 바로 무료로 다운로드하세요
    </h3>
    <p style="font-size: 14px; color: #374151; margin: 0 0 15px 0;">
      IpName2는 모든 개인 및 기업 환경에서 100% 무료로 사용할 수 있는 순수 오픈소스 프로젝트입니다.
    </p>
    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
      <a href="https://github.com/AhBiYout-all/IpName2/releases" target="_blank" rel="noopener noreferrer" style="background: #16a34a; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 9px 18px; border-radius: 8px;">
        📦 GitHub Release 다운로드
      </a>
      <a href="https://github.com/AhBiYout-all/IpName2" target="_blank" rel="noopener noreferrer" style="background: #334155; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 9px 18px; border-radius: 8px;">
        💻 GitHub 소스코드 보기
      </a>
      <a href="https://cisnet.co.kr" target="_blank" rel="noopener noreferrer" style="background: #ffffff; color: #1e293b; border: 1px solid #cbd5e1; text-decoration: none; font-weight: 700; font-size: 14px; padding: 9px 18px; border-radius: 8px;">
        🏢 CisNet 공식 웹사이트
      </a>
    </div>
  </div>

  <!-- Footer Info -->
  <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12.5px; color: #94a3b8; text-align: center;">
    &copy; 2026 AhBiYout. All rights reserved. &middot; Official Blog: <a href="https://ahbiyoutvibe.blogspot.com/" style="color: #64748b;">AhBiYout Vibe</a>
  </div>

</div>
```

---

## 4. 블로그 포스팅 체크리스트

발행 전 아래 항목들을 최종 점검하세요:
- [ ] 구글 블로거 새 글 작성 진입 (`https://draft.blogger.com/` 또는 `blogger.com`)
- [ ] 제목에 권장 제목 입력
- [ ] 라벨(Labels)에 `Windows 유틸리티`, `네트워크 관리`, `IP설정`, `Tauri v2`, `IpName2` 추가
- [ ] 우측 메뉴 **[링크]**에서 맞춤 URL 선택 후 `ahbiyout-ipname2-network-manager-v1-12` 입력
- [ ] 우측 메뉴 **[검색 설명]**에 메타 설명 붙여넣기
- [ ] 본문 입력창에서 **[<>] HTML 편집** 모드로 전환 후 본 문서 3번의 HTML 코드 전체 붙여넣기
- [ ] 작성 모드로 다시 전환하여 텍스트 및 레이아웃 상태 확인 후 실제 프로그램 실행 스크린샷 1~3장 삽입
- [ ] **[게시]** 클릭하여 공개 발행
