<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1jSCqqvWOAov4rYpUHgsNxdxIh1yQNaB6

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
プロジェクト構成
front end
├── 📁 .qodo                          // Qodo / AI エージェント用の設定フォルダ（アプリ実行には直接関係しない）
│   ├── 📁 agents                     // 自動コード生成などに利用する「エージェント」定義
│   └── 📁 workflows                  // 開発支援用のワークフロー定義
├── 📁 components                     // 共通で使う React コンポーネント群
│   └── 📄 Layout.tsx                 // 画面全体レイアウト（ヘッダー・メニュー・コンテンツ領域など）を定義するコンポーネント
├── 📁 constants                      // 定数や自動生成された設定値を管理するフォルダ
│   └── 📄 generatedCode.ts           // Swagger/OpenAPI 等から自動生成されたコード・型定義などを格納
├── 📁 pages                          // 画面単位（ルーティング単位）のコンポーネント群
│   ├── 📄 DeviceEdit.tsx             // デバイス情報の新規作成・編集画面（フォーム入力・保存処理を行う）
│   ├── 📄 DeviceList.tsx             // デバイス一覧画面（一覧取得APIを呼び出し、テーブル表示や編集画面への遷移を行う）
│   ├── 📄 DeviceLogs.tsx             // デバイスごとのログ閲覧画面（動作履歴・イベントログを表示する）
│   ├── 📄 Login.tsx                  // ログイン画面（ユーザーID／パスワード入力と認証API呼び出し、トークン保存・遷移を行う）
│   └── 📄 UserList.tsx               // ユーザー一覧画面（システムに登録されているユーザー・権限などを表示・管理する）
├── 📁 services                       // API 通信やモックデータなど、ビジネスロジック寄りのサービス層
│   ├── 📄 apiClient.ts               // バックエンド API を呼び出すクライアント（Base URL, 共通ヘッダー, エラーハンドリングなど）
│   └── 📄 mockBackend.ts             // 実APIの代わりに使うモックバックエンド（UI 開発・テスト用のダミーデータを返す）
├── ⚙️ .gitignore                     // Git で管理しないファイル／フォルダの設定（node_modules やビルド成果物など）
├── 📄 App.tsx                        // アプリケーションのルートコンポーネント（ルーティング設定や Layout との組み合わせを行う）
├── 📝 README.md                      // プロジェクトの説明書（セットアップ手順・起動方法・ビルド方法などのドキュメント）
├── 📄 env.d.ts                       // 環境変数（import.meta.env.*）の型定義ファイル（TypeScript 用）
├── 🌐 index.html                     // 最初に読み込まれる HTML（React をマウントするための <div id="root"> などを定義）
├── 📄 index.tsx                      // エントリーポイント（ReactDOM.createRoot 等で App.tsx を index.html に描画する）
├── ⚙️ metadata.json                  // プロジェクトメタ情報（ツールやエディタ用の補助情報、実行時にはほぼ影響なし）
├── ⚙️ package-lock.json              // npm の依存関係バージョン固定ファイル（全環境で同じバージョンを再現するため）
├── ⚙️ package.json                   // Node プロジェクト定義（プロジェクト名、npm scripts、依存パッケージなど）
├── ⚙️ tsconfig.json                  // TypeScript コンパイラ設定（ターゲット、strict モード、パスエイリアス等の設定）
├── 📄 types.ts                       // 共通で利用する型定義（Device, User, Log, API レスポンスなどの型を定義）
└── 📄 vite.config.ts                 // Vite の設定ファイル（開発サーバ、パスエイリアス、API プロキシ、ビルド設定など）

backend 
├── 📁 .qodo                                      // Qodo / AI エージェント用の設定フォルダ（実行アプリ本体には直接関係しない）
│   ├── 📁 agents                                 // 自動生成や補助タスクを行うエージェント定義
│   └── 📁 workflows                              // 開発用ワークフロー定義
├── 📁 Controllers                               // Web API のエンドポイントを提供するコントローラー群
│   ├── 📄 AdminUsersController.cs               // 管理者ユーザーの一覧取得・登録・更新などを行う API を定義
│   ├── 📄 AuthController.cs                     // ログイン認証、トークン発行など認証関連 API を定義
│   └── 📄 DeviceController.cs                   // デバイス情報・デバイスログ・シリアル登録などデバイス関連 API を定義
├── 📁 Data                                      // データアクセス関連
│   └── 📄 DeviceDbContext.cs                    // Entity Framework Core の DbContext（Device, DeviceLog, AdminUser などの DbSet を定義）
├── 📁 Migrations                                // Entity Framework Core のマイグレーションファイル
│   ├── 📄 20251208033307_InitClean.Designer.cs  // マイグレーションのデザイナーファイル（モデル構造のメタ情報）
│   ├── 📄 20251208033307_InitClean.cs           // 初期 DB 作成用マイグレーション（テーブル作成・カラム定義など）
│   └── 📄 DeviceDbContextModelSnapshot.cs       // 現在の DbContext モデル定義のスナップショット
├── 📁 Models                                    // ドメインモデル・DTO クラス定義
│   ├── 📄 AdminUser.cs                          // 管理者ユーザーのエンティティ（ID, ログインID, パスワードハッシュ, 権限 など）
│   ├── 📄 AuthDtos.cs                           // 認証用の DTO（ログインリクエスト、レスポンス、トークン情報など）
│   ├── 📄 Device.cs                             // デバイス情報のエンティティ（シリアル番号、名称、状態、設定項目など）
│   ├── 📄 DeviceLog.cs                          // デバイスの動作ログ・イベントログのエンティティ
│   └── 📄 SerialRequest.cs                      // シリアル番号などを受け取る API リクエスト用のモデル
├── 📁 Properties
│   └── ⚙️ launchSettings.json                   // 開発環境での起動プロファイル設定（ポート番号、環境変数など）
├── 📁 publish                                   // 発行済みのビルド成果物（本番・検証環境に配置するファイル一式）
│   ├── 📁 de                                    // ドイツ語リソース DLL
│   ├── 📁 es                                    // スペイン語リソース DLL
│   ├── 📁 fr                                    // フランス語リソース DLL
│   ├── 📁 it                                    // イタリア語リソース DLL
│   ├── 📁 ja                                    // 日本語リソース DLL
│   ├── 📁 ko                                    // 韓国語リソース DLL
│   ├── 📁 pt-BR                                 // ポルトガル語（ブラジル）リソース DLL
│   ├── 📁 publish                               // （発行コマンドを繰り返した際にネストしてしまった）発行フォルダ
│   │   ├── 📁 publish                           // さらにネストされた発行フォルダ
│   │   │   ├── 📁 publish                       // 最内層の発行フォルダ（実際に IIS / Kestrel で使う設定ファイル群）
│   │   │   │   ├── ⚙️ DeviceApi.deps.json       // DeviceApi の依存関係定義ファイル
│   │   │   │   ├── ⚙️ DeviceApi.runtimeconfig.json // .NET ランタイム設定
│   │   │   │   ├── ⚙️ appsettings.Development.json // 開発用の設定ファイル（接続文字列など）
│   │   │   │   ├── ⚙️ appsettings.json          // 共通設定ファイル（本番/開発共通の設定）
│   │   │   │   └── ⚙️ web.config                // IIS 用の設定ファイル
│   │   │   ├── ⚙️ DeviceApi.deps.json           // 同上（別階層の発行アウトプット）
│   │   │   ├── ⚙️ DeviceApi.runtimeconfig.json  // 同上
│   │   │   ├── ⚙️ appsettings.Development.json  // 同上
│   │   │   ├── ⚙️ appsettings.json              // 同上
│   │   │   └── ⚙️ web.config                    // 同上
│   │   ├── ⚙️ DeviceApi.deps.json               // デプロイに使われる依存関係定義
│   │   ├── ⚙️ DeviceApi.runtimeconfig.json      // ランタイム設定
│   │   ├── ⚙️ appsettings.Development.json      // 発行時に含まれた開発用設定
│   │   ├── ⚙️ appsettings.json                  // 発行時設定（接続文字列などを環境ごとに変更）
│   │   └── ⚙️ web.config                        // IIS 向けの Web サーバー設定ファイル
│   ├── 📁 ru                                    // ロシア語リソース DLL
│   ├── 📁 runtimes                              // 各 OS / CPU アーキテクチャ向けのランタイム DLL
│   │   ├── 📁 unix                              // Unix 用 SqlClient DLL
│   │   ├── 📁 win                               // Windows 共通向け DLL
│   │   ├── 📁 win-arm                           // Windows ARM 用ネイティブ DLL
│   │   ├── 📁 win-arm64                         // Windows ARM64 用ネイティブ DLL
│   │   ├── 📁 win-x64                           // Windows x64 用ネイティブ DLL
│   │   └── 📁 win-x86                           // Windows x86 用ネイティブ DLL
│   ├── 📁 wwwroot                               // 発行済みのフロントエンド静的ファイル（SPA のビルド成果物）
│   │   ├── 📁 assets                            // バンドルされた JS / CSS 等
│   │   └── 🌐 index.html                        // SPA のエントリ HTML
│   ├── 📁 zh-Hans                               // 中国語（簡体字）リソース DLL
│   ├── 📁 zh-Hant                               // 中国語（繁体字）リソース DLL
│   ├── ⚙️ Azure.Core.dll                        // Azure SDK コアライブラリ
│   ├── ⚙️ Azure.Identity.dll                    // Azure 認証関連ライブラリ
│   ├── ⚙️ DeviceApi.deps.json                   // 依存関係定義（トップレベル）
│   ├── ⚙️ DeviceApi.dll                         // DeviceApi 本体の .NET アセンブリ
│   ├── ⚙️ DeviceApi.exe                         // 自己ホスト実行用の EXE
│   ├── 📄 DeviceApi.pdb                         // デバッグ用シンボルファイル
│   ├── ⚙️ DeviceApi.runtimeconfig.json          // ランタイム設定
│   ├── ⚙️ Microsoft.AspNetCore.OpenApi.dll      // OpenAPI（Swagger）連携用ライブラリ
│   ├── ⚙️ Microsoft.Data.SqlClient.dll          // SQL Server 接続用クライアントライブラリ
│   ├── ⚙️ Microsoft.EntityFrameworkCore*.dll    // Entity Framework Core 関連ライブラリ群
│   ├── ⚙️ Microsoft.Extensions.*.dll            // ASP.NET Core の拡張ライブラリ（DI, Logging, Options など）
│   ├── ⚙️ Microsoft.Identity*.dll               // 認証 / JWT / OpenID Connect 関連ライブラリ
│   ├── ⚙️ Microsoft.OpenApi.dll                 // OpenAPI モデル表現ライブラリ
│   ├── ⚙️ Swashbuckle.AspNetCore.*.dll          // Swagger 生成・UI 提供ライブラリ
│   ├── ⚙️ System.*.dll                          // .NET 標準の拡張ライブラリ（JWT, Caching 等）
│   ├── ⚙️ appsettings.Development.json          // 発行された開発環境用設定
│   ├── ⚙️ appsettings.json                      // 発行された共通設定
│   └── ⚙️ web.config                            // 発行された IIS 用設定
├── 📁 wwwroot                                   // ローカル開発環境で使う静的ファイル（SPA ビルド成果物を配置）
│   ├── 📁 assets                                // バンドルされた JS / CSS 等
│   │   └── 📄 index-CHXlMM0D.js                 // フロントエンドのビルド JS ファイル
│   └── 🌐 index.html                            // フロントエンドのエントリ HTML
├── 📄 DeviceApi.csproj                          // DeviceApi プロジェクトファイル（依存パッケージやターゲットフレームワーク定義）
├── 📄 DeviceApi.http                            // HTTP リクエストのサンプル定義（VS の HTTP Client で API テスト用）
├── 📄 DeviceApi.sln                             // ソリューションファイル（DeviceApi を含む .NET ソリューション）
├── 📄 Program.cs                                // アプリケーションエントリポイント（DI 設定、ミドルウェア、ルーティングなどを構成）
├── ⚙️ appsettings.Development.json              // ローカル開発環境用の設定（接続文字列、ログレベルなど）
├── ⚙️ appsettings.json                          // 共通設定ファイル（環境共通の基本設定）
└── 📄 db.sql                                    // DB 初期化・テーブル作成などの SQL スクリプト（手動セットアップ用）
