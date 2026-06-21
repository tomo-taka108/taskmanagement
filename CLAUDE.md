# GitHub 運用ルール（Claude Code 用）

このファイルは Claude Code が必ず遵守するルールを定義します。

## ⚠️ 作業開始前チェックリスト（必須）

**いかなる実装・ファイル編集も、以下をすべて確認してから開始すること。**  
1つでも未完了なら、作業を止めてこのリストを満たしてから進めること。

- [ ] **Issue を作成したか？** → `gh issue create` で Issue を作り、番号を確認する
- [ ] **feature/fix/docs/chore ブランチを切ったか？** → `git checkout -b <prefix>/<Issue番号>-<内容>`
- [ ] **main ブランチに直接いないか？** → `git branch` で現在のブランチを確認する
- [ ] **コミットメッセージは Conventional Commits 形式か？** → `feat:` `fix:` `chore:` 等
- [ ] **サーバー起動が必要な場合、指定ポートを使うか？** → backend:8080 / frontend:5173 固定

> このチェックリストはルールの抜粋です。詳細は各セクションを参照してください。

---

## 1. ブランチ命名規則

ブランチを作成する際は、必ず以下のプレフィックスを使用してください。

| プレフィックス | 用途 | 例 |
|---|---|---|
| `feature/` | 新機能の実装 | `feature/42-add-card-label` |
| `fix/` | バグ修正 | `fix/15-card-drag-drop-error` |
| `docs/` | ドキュメント変更のみ | `docs/update-api-design` |
| `chore/` | 設定変更・依存関係更新など | `chore/update-gradle-wrapper` |

- プレフィックスの後は英小文字・ハイフン区切りで記述する（スペース・アンダースコア禁止）
- Issue番号を含める形式を推奨：`feature/<Issue番号>-<作業内容>`

---

## 2. Issue 作成ルール（必須）

**ブランチを作成する前に、必ず GitHub Issue を作成してください。**

手順：
1. `gh issue create` コマンド、または GitHub Web UI で Issue を作成する
2. Issue 番号を確認する
3. Issue 番号をブランチ名に含める：`feature/42-add-card-label`
4. ブランチを作成して作業を開始する

Issue テンプレートは `.github/ISSUE_TEMPLATE/` に用意されています。

```bash
# Issue作成コマンド例
gh issue create --title "feat: カードへのラベル設定機能を追加" --label "enhancement"
```

---

## 3. コミットメッセージ規則（Conventional Commits）

以下の形式に従ってコミットメッセージを書いてください。

```
<type>: <日本語または英語で概要を記述>
```

### type 一覧

| type | 用途 |
|---|---|
| `feat` | 新機能追加 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみの変更 |
| `style` | フォーマット変更（動作に影響しない） |
| `refactor` | リファクタリング（機能変更なし） |
| `test` | テストコードの追加・修正 |
| `chore` | ビルド・設定ファイルの変更 |

### 例

```
feat: カードへのラベル設定機能を追加
fix: ドラッグ&ドロップ時の順序ずれを修正
docs: API設計書にラベルエンドポイントを追記
chore: Gradleを8.8にアップデート
```

---

## 4. プルリクエスト（PR）ルール

- **main への直接プッシュは禁止**（ブランチ保護ルールで強制済み）
- 必ず `feature/` `fix/` `docs/` `chore/` ブランチを作成し、PR を通じて main にマージする
- PR タイトルはコミットメッセージと同様に Conventional Commits 形式にする
- PR テンプレートは `.github/PULL_REQUEST_TEMPLATE.md` に従って記述する

```bash
# PR作成コマンド例
gh pr create --title "feat: カードへのラベル設定機能を追加" --base main
```

---

## 5. 作業の流れ（必ず守る手順）

```
1. gh issue create でIssueを作成し、Issue番号を確認する
2. git checkout -b feature/<Issue番号>-<作業内容>
3. 実装・コミット（Conventional Commits形式）
4. git push origin feature/<ブランチ名>
5. gh pr create でPRを作成する
6. PRをマージする
7. git branch -d feature/<ブランチ名> でローカルブランチを削除する
```

---

## 6. サーバー起動ルール（必須）

このプロジェクトのサーバーは以下のポートで動作します。**別のポートへの変更は禁止です。**

| サーバー | ポート | 備考 |
|---|---|---|
| バックエンド（Spring Boot） | `8080` | `application.yml` で固定 |
| フロントエンド（Vite） | `5173` | Vite デフォルト。CORS設定で許可済み |

### ポート競合時の対処（必ず守ること）

サーバーを起動する前、または起動に失敗した場合は、**必ず指定ポートを占有しているプロセスを停止してから、同じポートで再起動する。**  
別のポートで一時的に起動することは禁止。

```bash
# バックエンド（8080）が競合している場合
# Windows
netstat -ano | findstr :8080       # PIDを確認
taskkill /PID <PID> /F             # プロセスを停止

# Linux / macOS
lsof -ti :8080 | xargs kill -9

# フロントエンド（5173）が競合している場合
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux / macOS
lsof -ti :5173 | xargs kill -9
```

### 理由

- バックエンドの CORS 設定（`WebConfig.java`）は `http://localhost:5173` のみ許可
- フロントエンドの API クライアント（`api/client.ts`）は `http://localhost:8080` に固定
- 別ポートで起動すると CORS エラーや API 接続エラーが発生し、動作確認が不可能になる
