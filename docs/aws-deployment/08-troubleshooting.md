# 08. トラブルシューティング

デプロイ作業中によく遭遇するであろうエラーと対処法をまとめます。
（Terraformコード実装後、実際に発生した事象があれば随時この一覧に追記してください。）

---

## 認証・CLI関連

### `Unable to locate credentials` / SSOセッション切れ

```
The SSO session associated with this profile has expired or is otherwise invalid.
```

SSOのログインセッションの期限切れです。再ログインしてください。

```powershell
aws sso login --profile taskmanagement
```

### `terraform` コマンドがproviderの認証情報を見つけられない

`infra/envs/dev/main.tf`の`provider "aws"`ブロックで指定している`profile`名と、
`aws configure sso`で設定したプロファイル名が一致しているか確認してください。

```powershell
aws configure list-profiles
```

## Terraform関連

### `Error: creating ... : AccessDenied`

IAM Identity Centerで割り当てたPermission Set（`AdministratorAccess`）の権限が反映されるまで、
まれに数分のタイムラグがあります。少し待ってから再実行してください。それでも解決しない場合は、
`01-aws-account-setup.md`の手順6（アカウント・Permission Set割り当て）が正しく完了しているか確認してください。

### `Error: ... already exists`

同名のリソース（S3バケット名など、グローバルで一意である必要があるもの）が既に存在する場合に発生します。
`variables.tf`で名前にランダムなsuffixやプロジェクト固有の接頭辞を含めるようにするか、
`terraform.tfvars`で別の名前を指定してください。

### `terraform destroy`が途中で失敗する（S3バケットが空でない）

```
Error: deleting S3 Bucket ... BucketNotEmpty
```

S3バケットにオブジェクトが残っていると削除できません。先にバケットを空にしてから再実行します。

```powershell
aws s3 rm s3://<バケット名> --recursive --profile taskmanagement
terraform destroy
```

### `plan`の内容が意図しない削除(destroy)を含んでいる

**絶対に焦って`apply`しないでください。** まず何が削除されようとしているか、リソース名を1つずつ確認します。
多くの場合、Terraformコードの記述ミス（リソース名の変更、属性の変更によりリソースの再作成が必要と判断された等）が原因です。
不明な場合は`terraform plan`の出力をよく読み、該当のリソースブロックを見直してください。

## ECS / Fargate関連

### ECSタスクが起動してはすぐ停止する

ECSコンソール（確認だけならブラウザで見てもOKです。作成・変更はCLIで行う方針ですが、状態確認は問題ありません）、
またはCLIでタスクの停止理由を確認します。

```powershell
aws ecs describe-tasks --cluster <クラスタ名> --tasks <タスクID> --profile taskmanagement
```

`stoppedReason`に理由が表示されます。よくある原因:

- **イメージのpullに失敗**: ECRリポジトリURLやタグが正しいか、ECSタスク実行ロールにECR pull権限があるか確認
- **アプリがクラッシュ**: 環境変数（`DB_URL`など）が正しく渡っているか確認。次のCloudWatch Logs確認方法でアプリのログを見る

### アプリのログを確認したい

ECSタスクのログはCloudWatch Logsに出力されます。

```powershell
aws logs tail /ecs/taskmanagement-backend --profile taskmanagement --follow
```

### ALBのヘルスチェックが失敗し続ける

ターゲットグループの状態を確認します。

```powershell
aws elbv2 describe-target-health --target-group-arn <ターゲットグループARN> --profile taskmanagement
```

ヘルスチェックパスが`/actuator/health`に正しく設定されているか、そのエンドポイントがコンテナ内で本当に200を返しているか、
セキュリティグループでALB→ECS間の8080番ポートが許可されているかを確認してください。

## RDS / データベース関連

### バックエンドからRDSに接続できない

- RDS用セキュリティグループが、ECS用セキュリティグループからの5432番ポートを許可しているか確認
- ECSタスク定義の環境変数`DB_URL`が正しいRDSエンドポイントを指しているか確認（`terraform output`で確認可能）
- RDSがプライベートサブネットにあり、ECSタスクと同じVPC内にあるか確認

## CORS関連

### ブラウザのコンソールに `has been blocked by CORS policy` と表示される

フロントエンドからバックエンドAPIへのリクエストがCORSで拒否されています。

- ECSタスク定義の環境変数`CORS_ALLOWED_ORIGINS`に、実際にアクセスしているCloudFrontのドメイン（`https://`込み、末尾スラッシュなし）が
  正しく設定されているか確認
- CloudFrontのドメインを変更した場合（ディストリビューションを作り直した等）、この環境変数も更新して再デプロイが必要

## フロントエンド関連

### CloudFrontでアプリを開くと真っ白になる、またはリロードで404になる

SPAのルーティング設定（カスタムエラーレスポンス: 403/404を`index.html`に200でリライトする設定）が
CloudFrontディストリビューションに正しく設定されているか確認してください。

### S3にアップロードしたはずの新しいビルドが反映されない

CloudFrontのキャッシュが残っています。キャッシュ無効化を行ってください。

```powershell
aws cloudfront create-invalidation --distribution-id <ディストリビューションID> --paths "/*" --profile taskmanagement
```

---

ここまでで一連のドキュメントは完了です。実際の実装（Terraformコード、Dockerfile、アプリケーションコードの変更）に進む準備ができました。
