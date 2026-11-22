# AhBiYout IpName2

<div align="center">

![IpName2 Logo](app-icon.png)

### Windows システム名および高性能ネットワークアダプター・マルチIP管理デスクトップユーティリティ (v1.13.13)

🌍 **言語**: [🇰🇷 한국어](README.md) | [🇺🇸 English](README_EN.md) | [🇯🇵 日本語](README_JA.md) | [🇨🇳 中文](README_ZH.md)

[![Version](https://img.shields.io/badge/Version-v1.13.13-0284c7.svg)](docs/PATCH_NOTES.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](docs/LICENSE_NOTICE.md)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2.11-orange.svg)](https://tauri.app/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)](https://www.typescriptlang.org/)
[![C99 Native DLL](https://img.shields.io/badge/C--ABI-ipname__core.dll-green.svg)](docs/DLL_SPECIFICATION.md)

**作成者**: AhBiYout ([GitHub](https://github.com/AhBiYout-all)) | **公式ブログ**: [AhBiYout Vibe](https://ahbiyoutvibe.blogspot.com/) | **所属**: [(주)청운정보시스템 ( cisnet.co.kr )](https://cisnet.co.kr)

</div>

---

## 📌 概要 (Overview)

**AhBiYout IpName2**は、Windows 10およびWindows 11（64ビット）環境で、コンピューター名、ワークグループ、ネットワークアダプターのIP、サブネットマスク、ゲートウェイ、DNS設定を直感的に管理できる高性能デスクトップアプリケーションです。

**SWR即時状態復元**、**Rust + Win32ネイティブ並列ポーリング**、**純粋なC99ネイティブDLL (`ipname_core.dll`)**を組み合わせることで、遅延のない起動を実現し、単体ポータブル版(`IpName2_v1.13.13_Portable.exe` / `_Portable.zip`)と公式Inno Setupインストーラー(`IpName2_v1.13.13_Setup.exe`)の両方をサポートしています。

### 主な機能 (Key Features)

1. **超高速SWRブート & 単一画面UI (`650x920`)**:
   - 起動直前に保存されたスナップショットを即座に表示し、Win32 APIで`<50ms`以内にリアルタイム同期。バックグラウンドPowerShell補強によりUI操作をブロックしません。
   - ヘッダーから下部フッターまで縦スクロールなしで一望できる`650x920`（最小`650x760`）ビューポートと、Tauri外部リンクロック重複防止(`ExternalLink`)を提供します。
2. **コンピューター名（NetBIOS）およびワークグループのワンクリック変更**:
   - 標準規則の検証、再起動予定バッジの案内、UACセキュアな安全再起動をサポート。
3. **単一アダプター内のマルチIP（Secondary IPs）バインディングとプライマリ整列**:
   - デフォルトゲートウェイおよびDHCP IPv4をプライマリIPとして自動的に最優先整列。
   - 複数のセカンダリIPの追加/削除、`netsh`順次バインディング、サブネットマスク適応型ポーリング検証。
4. **純粋な独自ネイティブDLL (`ipname_core.dll`) 搭載**:
   - **Layer-2 ARP (`SendARP`) IP競合検出**: ファイアウォール環境でも実際の占有MACを検出し、自局MACホワイトリストで誤検知を防止。
   - **インプロセス高速ICMP Ping (`IcmpSendEcho`)**: CMDポップアップなしでRTT (ms) とTTLを即座に測定。
   - **ノンブロッキングTCPポートヘルスチェック & 32ビットサブネットマスク演算器**（不連続マスクの遮断）。
5. **物理 vs 仮想ネットワークアダプターの精密分類**:
   - NDISカーネルフラグとIEEE 6-Hex MAC OUI（Hyper-V、VMware、VirtualBox、QEMU、Xen、Parallels、WSL/VPN）に基づく物理/仮想/Wi-Fiタブの完璧な分離。
6. **リアルタイムグローバルIP（Real IP）およびISP照会**:
   - 外部グローバルIPv4/IPv6、ISP、位置情報を単一行でリアルタイム表示し、ワンクリックでコピー。
7. **ネットワークアダプター電源のワンクリック制御 & GitHub Releasesリアルタイム自動アップデート**:
   - 管理者権限（UAC）昇格を通じたアダプターの有効/無効切り替えと再入防止ロック(`isSavingRef`)。
   - バックグラウンドおよび手動でのアップデート確認、`UpdateModal`による直接ダウンロード案内。
8. **ユーザー言語自動検出（KO/EN/JA/ZH）& 動的PowerShellスクリプトコメント生成**:
   - 起動時にOS/ブラウザのロケールを自動検出し、韓国語・英語・日本語・中国語（簡体字）の4言語へ即時切替。ヘッダーおよびフッターボタンからいつでも手動切替が可能。
   - すべてのUIラベル、診断・アップデートモーダルに加え、生成されるPowerShell実行スクリプト内のコメントも選択中の言語に合わせて動的に生成。

---

## 🛠️ 技術スタック (Tech Stack)

| 区分 | 技術スタック | 説明 |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 6 | コンポーネントベースのレスポンシブUI (`650x920` 単一画面, 最小 `650x760`) |
| **Styling** | Tailwind CSS 4, Lucide React, Motion | Windows 11 Fluentスタイル（4種のテーマ切替: Default/Dark/Emerald/Sunset） |
| **Desktop Core** | Rust (Tauri v2.11) | 超軽量ネイティブIPC (`spawn_blocking`)、Win32 APIラッパー、Shell/Processプラグイン |
| **Native Engine** | ISO C99 (`ipname_core.dll`) | Layer-2 ARP競合検出、ICMP Ping、TCP診断、6-Hex OUIアダプター分類器 |
| **Installer & Portable** | Inno Setup 6 & Portable Bundle | 64ビットWindows用公式インストーラー (`_Setup.exe`)・単体ポータブル (`_Portable.exe`)・DLL同梱ZIP (`_Portable.zip`) |
| **CI/CD & QA** | GitHub Actions (Node 24), `verify-core-files.cjs` | 6段階リポジトリ監査（52のコアファイル、シークレット、10地点のバージョン同期）と自動デュアルリリース |

---

## 🚀 クイックスタート (Getting Started)

### 前提条件 (Prerequisites)
- [Node.js](https://nodejs.org/) (v22 LTS 推奨)
- [Rust](https://www.rust-lang.org/) (Tauri v2ビルド用, 1.77.2以上)
- [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (C DLLおよびWin32ネイティブ連携用)

### ローカル開発 & 整合性検証
```bash
# 依存関係のインストール
npm install

# TypeScript静的型チェック & 6段階リポジトリ整合性監査
npm run lint
node scripts/github/verify-core-files.cjs --clean

# フロントエンド開発サーバーの起動 (デフォルトポート: 3030)
npm run dev

# Tauriデスクトップアプリケーションの開発モード実行
npm run tauri dev
```

### プロダクションビルド & パッケージング
```cmd
:: Windowsワンクリック総合ビルドスクリプトの実行 (C DLLコンパイル + フロントエンドビルド + Tauriビルド)
build.bat
```

---

## 📚 詳細ドキュメント (Documentation)

プロジェクトの詳細なアーキテクチャ、GitHub運用、ブログ投稿ガイドは [`/docs`](docs/README.md) ディレクトリに体系的に整理されています：

- **[GitHub運用・リリースガイド (GITHUB_GUIDE.md)](docs/GITHUB_GUIDE.md)**: 6段階リポジトリ監査、自動プッシュ、GitHub Actions Node 24 CI/CD、リリース雛形。
- **[Google Blogger公式投稿ガイド (BLOGGER_POST.md)](docs/BLOGGER_POST.md)**: 作成モード（リッチテキスト）およびHTML編集モード用の最新v1.13.13紹介記事。
- **[開発仕様書 (DEVELOPMENT.md)](docs/DEVELOPMENT.md)**: 開発環境、ビルド手順、ウィンドウ寸法(`650x920`)、ポート(`3030`)、パイプライン案内。
- **[システムアーキテクチャ (ARCHITECTURE.md)](docs/ARCHITECTURE.md)**: 多層アーキテクチャ、Win32/Rust IPC構造、SWRブート、ネットワーク制御フロー。
- **[純粋ネイティブDLL仕様書 (DLL_SPECIFICATION.md)](docs/DLL_SPECIFICATION.md)**: `ipname_core.dll` C-ABIインターフェース仕様およびシステムDLL監査レポート。
- **[パッチノート (PATCH_NOTES.md)](docs/PATCH_NOTES.md)**: バージョン別詳細変更履歴および深層監査の不具合解決記録。
- **[技術ロードマップ (ROADMAP.md)](docs/ROADMAP.md)**: プロジェクトのマイルストーンと検証完了履歴 (`ROADMAP-001` ~ `ROADMAP-029`).
- **[バージョン管理ポリシー (VERSIONING_POLICY.md)](docs/VERSIONING_POLICY.md)**: Semantic Versioningおよびトリプルロックステップ（Triple Lockstep）規則。
- **[AI標準アップグレード作業指示書 (UPDATE_WORK_INSTRUCTION.md)](docs/UPDATE_WORK_INSTRUCTION.md)**: 他のIP Nameアプリのアップグレード用統合AIプロンプト。
- **[ライセンス通知 (LICENSE_NOTICE.md)](docs/LICENSE_NOTICE.md)**: オープンソースライセンス通知およびMITライセンス全文。

---

## 📄 ライセンス (License)

このプロジェクトはMITライセンスの下でライセンスされています - 詳細については [LICENSE](LICENSE) ファイルおよび [LICENSE_NOTICE.md](docs/LICENSE_NOTICE.md) を参照してください。
Copyright (c) 2026 AhBiYout. All rights reserved.
