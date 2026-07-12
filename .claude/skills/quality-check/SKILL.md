---
description: フロントエンド（ESLint）・バックエンド（Spotless）・インフラ（Terraform）の品質チェックを実行する。エラーがあれば自動修正して再チェックする。
allowed-tools: Bash
disable-model-invocation: false
---

# 品質チェック手順

このプロジェクトの品質チェックは以下の3ステップで実施する。`infra/`配下（Terraformコード）に変更がない場合はStep 3を省略してよい。

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

## Step 3: インフラ（Terraform）品質チェック

対象は `infra/envs/dev/`（環境ディレクトリが増えた場合は `infra/envs/*/` 全体）。

```bash
cd infra/envs/dev && terraform fmt -check -recursive -diff
```

- フォーマット崩れがあれば diff が出力される。崩れている場合は以下で自動修正してから再チェックする:

```bash
cd infra/envs/dev && terraform fmt -recursive
cd infra/envs/dev && terraform fmt -check -recursive -diff
```

```bash
cd infra/envs/dev && terraform validate
```

- **Success! The configuration is valid.** が目標
- 初回や `.terraform/` が存在しない場合は `terraform validate` の前に `terraform init -backend=false` を実行する（AWS認証情報なしで構文・参照整合性のみ検証できる）

```bash
tflint --version
```

- `tflint` がインストールされている場合のみ、以下を実行する（AWSベストプラクティス・非推奨構文・命名規則などterraform validateでは検出できない項目をチェックする）:

```bash
cd infra/envs/dev && tflint --init && tflint
```

- 未インストールの場合はこのチェックを省略してよい（`terraform fmt` / `terraform validate` の2つが必須、`tflint` は任意）

## 重要事項

- `spotlessApply` はコードの動作を変えずに書式のみを修正する
- Java 25 環境では google-java-format / palantir-java-format は動作しないため Eclipse フォーマッターを使用している
- `terraform validate` はAWS上にリソースを作成しない静的チェックであり、`terraform plan` / `apply` とは異なり課金は発生しない
- 品質チェックはコミット前に必ず実施すること
