# 02. AWS CLI / Terraform のセットアップ

`01-aws-account-setup.md` の作業が完了している前提で進めます。
ここからはコマンド操作が中心になり、Claude Codeが実行を支援できます。

---

## 1. AWS CLI のインストール（Windows）

PowerShellで以下を実行します（要管理者権限、またはwinget利用可能な環境）。

```powershell
winget install -e --id Amazon.AWSCLI
```

インストール後、新しいターミナルを開いて確認します。

```powershell
aws --version
```

`aws-cli/2.x.x ...` のような表示が出ればOKです。

## 2. Terraform のインストール（Windows）

```powershell
winget install -e --id Hashicorp.Terraform
```

確認:

```powershell
terraform -version
```

## 3. AWS CLIにSSO（IAM Identity Center）プロファイルを設定する

`01-aws-account-setup.md`でメモした「アクセスポータルURL」を使います。

```powershell
aws configure sso
```

対話形式で以下を聞かれるので、順に答えます。

| 質問 | 入力する内容 |
|---|---|
| SSO session name | 任意の名前（例: `taskmanagement-sso`） |
| SSO start URL | メモしたアクセスポータルURL（例: `https://d-xxxxxxxxxx.awsapps.com/start`） |
| SSO region | IAM Identity Centerを有効化したリージョン（例: `ap-northeast-1`） |
| SSO registration scopes | そのままEnter（デフォルトの`sso:account:access`） |

この時点で**ブラウザが自動的に開き**、AWSへのログインとアクセス許可の確認を求められます。
ここは手動でブラウザ操作をして「Allow」を押してください。

ブラウザでの承認が終わると、CLIに戻って以下を聞かれます。

| 質問 | 入力する内容 |
|---|---|
| アカウントの選択 | 対象のAWSアカウントを選択 |
| ロールの選択 | `AdministratorAccess` を選択 |
| CLI default region | `ap-northeast-1` |
| CLI default output format | `json` |
| CLI profile name | 任意の名前（例: `taskmanagement`）。**このプロファイル名は以降のコマンドで使うので覚えておく** |

## 4. 動作確認

```powershell
aws sts get-caller-identity --profile taskmanagement
```

以下のようなJSONが表示されれば、認証設定は成功です。

```json
{
    "UserId": "...",
    "Account": "123456789012",
    "Arn": "arn:aws:sts::123456789012:assumed-role/AWSReservedSSO_AdministratorAccess_.../your-username"
}
```

## 5. 毎回のログイン方法（セッション切れ対策）

SSOのログインセッションには有効期限があります（デフォルト数時間〜)。
期限が切れると`aws`コマンドが認証エラーになるので、その場合は以下で再ログインします。

```powershell
aws sso login --profile taskmanagement
```

## 6. プロファイルをデフォルトにする（任意・推奨）

毎回`--profile taskmanagement`と打つのが面倒な場合、環境変数で指定できます。

```powershell
$env:AWS_PROFILE = "taskmanagement"
```

このセッション内はこれで`--profile`指定が不要になります（PowerShellを閉じるとリセットされます）。

## 7. Terraformからも同じプロファイルを使う

Terraformの`provider "aws"`ブロックで`profile`を指定することで、同じSSO認証情報を使い回せます
（`infra/envs/dev/main.tf`で設定済み、`variables.tf`の`aws_profile`変数に自分のプロファイル名を設定するだけで動きます）。

---

## ここまでで準備できたもの

- [ ] AWS CLIインストール済み
- [ ] Terraformインストール済み
- [ ] `aws configure sso` でプロファイル設定済み
- [ ] `aws sts get-caller-identity` で認証確認済み

すべて完了したら `03-terraform-basics.md` に進んでください。
