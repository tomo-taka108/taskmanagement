# 07. コスト管理（超重要）

AWSは「使った分だけ課金」される従量課金制です。学習中に想定外の高額請求を避けるため、
必ずこのドキュメントの内容を実践してください。

---

## 1. 月額コスト概算（東京リージョン、常時稼働させた場合）

| リソース | 概算月額（無料枠適用時） | 概算月額（無料枠なし） | 備考 |
|---|---|---|---|
| EC2 t3.micro（1台常時稼働） | $0 | 約$8〜9 | 新規アカウントは12ヶ月間750時間/月が無料 |
| EC2用EBSボリューム（30GB gp3） | $0 | 約$2〜3 | 無料枠は30GB/月まで |
| RDS db.t4g.micro（Single-AZ, 20GB gp2） | $0 | 約$13〜18 | 新規アカウントは12ヶ月間750時間/月が無料 |
| **合計目安** | **ほぼ$0（無料枠内）** | **約$23〜30/月** | EC2・RDSともに無料枠対象インスタンスタイプを使用 |

ALB・ECS Fargate・ECR・S3・CloudFrontを使わない構成にしたことで、**新規アカウントの12ヶ月無料枠内であれば、
常時稼働させてもほぼ$0で運用できます。** これが今回EC2 1台+RDSというシンプルな構成を選んだ最大の理由です。

ただし無料枠には上限（EC2・RDSともに750時間/月＝インスタンス1台を常時稼働させた場合とほぼ同じ）があるため、
同じアカウントで他にもEC2やRDSを起動していると無料枠を使い切ってしまう点には注意してください。
また、**12ヶ月の無料枠期間を過ぎると、インスタンス構成（`t3.micro`/`db.t4g.micro`等）が無料枠対象であっても
自動的に通常課金（上表の「無料枠なし」列）になります。** 本プロジェクトのAWSアカウントは既に無料枠期間が
終了しているため、常時「無料枠なし」列（合計約$23〜30/月）の料金がそのまま発生する前提で運用してください。
これが次項の「使わないときはdestroyする」を徹底すべき最大の理由です。

## 2. コストを抑える基本方針: 使わないときは `destroy` する

無料枠の範囲内であっても、想定外の使い方（無料枠の消費ペースが速い、12ヶ月を過ぎた等）に備え、
**「動作確認したいときだけ`terraform apply`、確認が終わったら`terraform destroy`」**を徹底することをお勧めします。
これにより、無料枠を使い切った後や無料枠期間終了後でも、実質のコストを最小限に抑えられます。

```powershell
# 使い終わったら
cd infra/envs/dev
terraform destroy
```

`destroy`してもTerraformコード自体は手元に残っているので、`terraform apply`すればまた同じ構成を数分で再構築できます。
これがコンソール手動構築にはない、IaCの大きな利点です。

## 3. destroy後に容易に復元するための準備

「講座の課題提出が終わったら`destroy`、転職活動などでポートフォリオとして見せたくなったら`apply`」という
運用を想定しています。`destroy`しても以下さえ残しておけば、いつでも同じ構成を再構築できます。

### 残しておくもの（Gitリポジトリで管理）

- **Terraformコード一式**（`infra/envs/dev/*.tf`）: `apply`すればこの内容通りにインフラが再現される
- **`terraform.tfvars.example`**: 実際の値を入れる`terraform.tfvars`（gitignore対象）を再作成する際のひな形。
  再構築のたびに必要な変数（`my_ip_cidr`、`db_password`）が過不足なく載っているか、定期的に見直すこと

### 再構築のたびに変わるもの（事前に把握しておく）

- **EC2のパブリックIPアドレス**: `apply`のたびに新しいIPが割り当てられる。ポートフォリオのURLとして
  固定したい場合は、将来的にElastic IP・独自ドメイン（Route 53）の導入を検討する（今回は未導入）
- **SSH秘密鍵（`taskmanagement-key.pem`）**: `apply`のたびにTerraformが新しいキーペアを生成する。
  古い鍵は使えなくなるが、これは問題にならない（`destroy`時に自動的に無効化される）
- **RDSのデータ**: `destroy`するとRDSインスタンスごとデータが消える。デモ用のシードデータを見せたい場合は、
  `destroy`前に`pg_dump`でバックアップを取得しておく

```powershell
# destroy前: RDSのデータをバックアップ（EC2経由、または手元のPCからトンネル経由で）
pg_dump -h <RDSエンドポイント> -U <ユーザー名> -d taskmanagement -F c -f taskmanagement_backup.dump

# 再構築後: バックアップからリストア
pg_restore -h <新しいRDSエンドポイント> -U <ユーザー名> -d taskmanagement --clean taskmanagement_backup.dump
```

バックアップファイル（`.dump`）は機密データを含む可能性があるため、Gitリポジトリにはコミットせず、
手元のPCや別の安全な場所（暗号化したクラウドストレージ等）に保管すること。

### 再構築の具体的な手順（destroy → apply の一連の流れ）

1. `cd infra/envs/dev && terraform init`（初回、またはPCを変えた場合）
2. `terraform.tfvars.example`を`terraform.tfvars`にコピーし、`my_ip_cidr`（`https://checkip.amazonaws.com`等で確認した
   現在のグローバルIP）と`db_password`（新しいパスワードを設定してよい）を記入
3. `terraform plan`で作成内容を確認し、`terraform apply`
4. `terraform output ec2_public_ip`・`terraform output rds_endpoint`で新しい接続先を取得
5. （デモデータが必要な場合）バックアップから`pg_restore`でリストア
6. アプリのデプロイ（`05-deploy-procedure.md`参照）
7. 見せ終わったら`terraform destroy`で再度課金を止める

## 4. AWS Budgets（予算アラート）を設定する【手動作業・強く推奨】

想定外の課金に早く気づけるよう、AWS Budgetsで予算アラートを設定しておくことを強く推奨します。
これはマネジメントコンソールでの手動設定です（Terraformで自動化することも可能ですが、まずは手動で確実に設定することを優先してください）。

1. マネジメントコンソールで「Billing and Cost Management」→「Budgets」を開く
2. 「予算を作成」
3. 「Cost budget」を選択
4. 月間予算額を設定（例: $10）
5. アラートのしきい値を設定（例: 予算の50%, 80%, 100%に達したらメール通知）
6. 通知先のメールアドレスを設定

これにより、うっかり`destroy`し忘れたリソースが積み上がっても、早期にメールで気づけます。

## 5. Cost Explorerで実際の使用状況を確認する

「Billing and Cost Management」→「Cost Explorer」で、日次・サービス別の実際のコストを確認できます。
特にデプロイ直後の数日は、想定通りのコストになっているか確認する習慣をつけてください。

## 6. 無料利用枠の確認

「Billing and Cost Management」→「無料利用枠」ページで、現在の無料枠の消費状況を確認できます。
RDSの無料枠（750時間/月、12ヶ月間）は特に消費ペースを意識してください。

## 7.（発展）リモートstateについて

`03-terraform-basics.md`で触れた通り、今回はTerraformのstateをローカル（自分のPC）に置いています。
個人で単独作業する分にはこれで全く問題ありませんが、チームで同じインフラを複数人が触る場合は、
以下のような課題が生じます。

- 各メンバーのPCにあるstateファイルの内容がバラバラになり、「本当の最新状態」が分からなくなる
- 複数人が同時に`terraform apply`すると、同じリソースを取り合って競合が起きる

この課題を解決するのが「リモートstate」です。S3バケットにstateファイルを保存し、
DynamoDBテーブルで「今誰かが`apply`中かどうか」のロックを管理する、という構成が定番です。

```hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state-bucket"
    key            = "taskmanagement/dev/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "terraform-lock"
  }
}
```

これは今回は導入しませんが、「チーム開発でTerraformを使う場合はこういう仕組みが必要になる」ということだけ、
発展的な知識として覚えておくとよいです。

---

次は`08-troubleshooting.md`で、よくあるエラーとその対処法を解説します。
