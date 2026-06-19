# GitHub 運用ルール（Claude Code 用）

このファイルは Claude Code が必ず遵守する GitHub 運用ルールを定義します。
作業を開始する際は、このファイルの内容を必ず確認してから進めてください。

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
