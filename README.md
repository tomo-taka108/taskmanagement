# タスク管理アプリ（Trelloライク カンバンボード）

【AIエンジニアコース】制作アプリ①  
React + Spring Boot + PostgreSQL によるフルスタックタスク管理アプリ。

---

## 概要

カンバン形式のタスク管理Webアプリです。カラム（リスト）とカード（タスク）をドラッグ&ドロップで操作でき、カードには説明・期限・ラベル・チェックリストを設定できます。

---

## 技術スタック

### フロントエンド

| 技術 | バージョン |
|------|-----------|
| TypeScript | 6.0.2 |
| React | 19.2.6 |
| Vite | 8.0.12 |
| Tailwind CSS | 4.3.1 |
| Zustand | 5.0.14 |
| Axios | 1.18.0 |

### バックエンド

| 技術 | バージョン |
|------|-----------|
| Java | 25 |
| Spring Boot | 4.0.7 |
| Spring Data JPA / Hibernate | Spring Boot 4.0.7 同梱 |
| PostgreSQL | 17 |
| Lombok | Spring Boot 4.0.7 同梱 |
| Gradle | 9.1.0 |

---

## 主な機能

- **カラム管理**: 追加・削除・名前変更・ドラッグ&ドロップで並び替え
- **カード管理**: 作成・編集・削除・カラム間移動・カラム内並び替え
- **カード詳細**: 説明文・期限日・ラベル・チェックリスト
- **期限警告**: 期限超過カードを視覚的に強調表示
- **ラベル**: プリセットラベル＋カスタムラベル作成・管理
- **検索・フィルタ**: キーワード検索、ラベル・期限日フィルタ
- **ダークモード**: ライト/ダーク切り替え

---

## セットアップ

### 前提条件

- Java 25
- Node.js（最新LTS版推奨）
- PostgreSQL

### 1. データベース作成

```sql
CREATE DATABASE taskmanagement;
CREATE USER taskuser WITH PASSWORD 'taskpass';
GRANT ALL PRIVILEGES ON DATABASE taskmanagement TO taskuser;
```

### 2. バックエンド起動

```bash
cd backend
./gradlew bootRun
```

起動後、`http://localhost:8080` でAPIが利用可能になります。  
テーブル作成と初期データ投入は自動で行われます。

環境変数でDB接続先を変更できます（省略時はデフォルト値を使用）:

```
DB_URL=jdbc:postgresql://localhost:5432/taskmanagement
DB_USERNAME=taskuser
DB_PASSWORD=taskpass
```

### 3. フロントエンド起動

```bash
cd frontend
npm install
npm run dev
```

起動後、`http://localhost:5173` でアプリが利用可能になります。

---

## ポート構成

| サーバー | URL |
|---------|-----|
| フロントエンド | http://localhost:5173 |
| バックエンド API | http://localhost:8080 |

> バックエンドのCORS設定はポート5173のみ許可しています。ポートを変更すると動作しません。

---

## ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [要件定義書](docs/requirements.md) | プロジェクト概要・スコープ・開発フェーズ |
| [機能要件・非機能要件](docs/functional-requirements.md) | 機能一覧・受入条件・非機能要件 |
| [画面設計書](docs/screen-design.md) | 画面一覧・画面遷移図・レイアウト詳細 |
| [データベース設計書](docs/database-design.md) | ER図・テーブル定義 |
| [API設計書](docs/api-design.md) | エンドポイント一覧・HTTPステータスコード規則 |
| [技術スタック・制約条件](docs/tech-stack.md) | 使用技術バージョン・実行環境・制約 |

---

## ディレクトリ構成

```
TaskManagement/
├── backend/          # Spring Boot アプリ
│   └── src/
│       └── main/
│           ├── java/   # Javaソースコード
│           └── resources/
│               ├── application.yml
│               └── data.sql  # 初期データ
├── frontend/         # React アプリ
│   └── src/
├── docs/             # 設計ドキュメント
└── .github/          # Issue・PRテンプレート
```
