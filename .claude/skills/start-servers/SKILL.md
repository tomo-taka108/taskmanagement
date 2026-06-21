---
description: バックエンド（port 8080）とフロントエンド（port 5173）を起動する。ポート競合時は既存プロセスを停止してから必ず指定ポートで起動する。
allowed-tools: Bash
disable-model-invocation: true
---

# サーバー起動手順

このプロジェクトのサーバーは **必ず以下の指定ポートで動作させること**。別ポートへの変更は禁止。

| サーバー | ポート |
|---|---|
| バックエンド（Spring Boot） | 8080 |
| フロントエンド（Vite） | 5173 |

## 実行手順

### Step 1: ポート競合チェック & 解放

port 8080 と port 5173 を占有しているプロセスを停止する。

**Windows の場合（このプロジェクトの環境）:**

```bash
# port 8080 を確認して停止
netstat -ano | findstr :8080
# 出力された PID を使って停止（PID が 0 の場合はスキップ）
# taskkill /PID <PID> /F

# port 5173 を確認して停止
netstat -ano | findstr :5173
# taskkill /PID <PID> /F
```

上記で PID が見つかった場合は `taskkill /PID <PID> /F` で停止してから次へ進む。

**Unix/macOS の場合:**

```bash
lsof -ti :8080 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true
```

### Step 2: バックエンド起動（port 8080）

`backend/` ディレクトリで Gradle ラッパーを使って Spring Boot を起動する。

```bash
cd backend && ./gradlew bootRun
```

バックグラウンドで起動し、`http://localhost:8080/api/health` が `{"status":"UP"}` を返すまで待機する。

### Step 3: フロントエンド起動（port 5173）

`frontend/` ディレクトリで Vite 開発サーバーを起動する。

```bash
cd frontend && npm run dev
```

バックグラウンドで起動し、`http://localhost:5173` にアクセスできることを確認する。

### Step 4: 確認

起動完了後、以下を案内する：
- バックエンド: http://localhost:8080/api/health
- フロントエンド: http://localhost:5173

## 重要ルール

- ポートが競合している場合は **必ず既存プロセスを停止してから** 起動すること
- 別ポート（例: 8081, 5174 など）で起動することは **禁止**
  - 理由: CORS 設定（`WebConfig.java`）が `localhost:5173` のみ許可、API クライアントが `localhost:8080` に固定されているため
