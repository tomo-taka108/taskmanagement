---
description: フロントエンド（ESLint）とバックエンド（Spotless）の品質チェックを実行する。エラーがあれば自動修正して再チェックする。
allowed-tools: Bash
disable-model-invocation: false
---

# 品質チェック手順

このプロジェクトの品質チェックは以下の2ステップで実施する。

## Step 1: フロントエンド ESLint チェック

```bash
cd frontend && npm run lint
```

- **0 errors** が目標
- エラーがある場合は修正してから再実行する
- 主なチェック内容: TypeScript 型エラー、React Hooks ルール違反、未使用変数

## Step 2: バックエンド Spotless チェック

```bash
cd backend && ./gradlew spotlessCheck
```

- **BUILD SUCCESSFUL** が目標
- フォーマット違反がある場合は以下で自動修正してから再チェックする:

```bash
cd backend && ./gradlew spotlessApply
cd backend && ./gradlew spotlessCheck
```

- チェック内容: Eclipse Java Format によるコードフォーマット、未使用インポートの除去、末尾空白・改行の統一

## 重要事項

- `spotlessApply` はコードの動作を変えずに書式のみを修正する
- Java 25 環境では google-java-format / palantir-java-format は動作しないため Eclipse フォーマッターを使用している
- 品質チェックはコミット前に必ず実施すること
