# API設計書

**バージョン:** 0.1  
**作成日:** 2026-06-13  
**作成者:** tomo-taka108

---

## 1. 概要

- ベースURL: `http://localhost:8080`
- APIスタイル: RESTful
- レスポンス形式: JSON
- 文字コード: UTF-8

---

## 2. エンドポイント一覧

### 2.1 カラム

| メソッド | エンドポイント | 概要 |
|----------|---------------|------|
| GET | /api/columns | カラム一覧取得 |
| POST | /api/columns | カラム作成 |
| PUT | /api/columns/{id} | カラム更新（タイトル変更） |
| DELETE | /api/columns/{id} | カラム削除（配下カードも削除） |
| PUT | /api/columns/reorder | カラム並び替え |

### 2.2 カード

| メソッド | エンドポイント | 概要 |
|----------|---------------|------|
| GET | /api/columns/{id}/cards | カード一覧取得（カラム指定） |
| POST | /api/columns/{id}/cards | カード作成 |
| GET | /api/cards/{id} | カード詳細取得 |
| PUT | /api/cards/{id} | カード更新（タイトル・説明・期限等） |
| DELETE | /api/cards/{id} | カード削除 |
| PUT | /api/cards/{id}/move | カード移動（カラム間・並び替え） |

### 2.3 ラベル

| メソッド | エンドポイント | 概要 |
|----------|---------------|------|
| GET | /api/labels | ラベル一覧取得 |
| POST | /api/labels | ラベル作成 |
| PUT | /api/labels/{id} | ラベル更新 |
| DELETE | /api/labels/{id} | ラベル削除 |

### 2.4 チェックリスト

| メソッド | エンドポイント | 概要 |
|----------|---------------|------|
| POST | /api/cards/{id}/checklist | チェックリスト項目追加 |
| PUT | /api/checklist/{id} | チェックリスト項目更新 |
| DELETE | /api/checklist/{id} | チェックリスト項目削除 |

---

## 3. HTTPステータスコード規則

| ステータス | 用途 |
|-----------|------|
| 200 OK | 取得・更新成功 |
| 201 Created | 作成成功 |
| 204 No Content | 削除成功 |
| 400 Bad Request | リクエストパラメータ不正 |
| 404 Not Found | 指定リソースが存在しない |
| 500 Internal Server Error | サーバー内部エラー |
