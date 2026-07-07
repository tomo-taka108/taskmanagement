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

## EC2 / Docker関連

### SSHで接続できない（`Connection timed out`）

- EC2用セキュリティグループが、自分のIPからの22番ポート（SSH）を許可しているか確認（自宅のIPが変わった場合は許可ルールの更新が必要）
- キーペア（`.pem`ファイル）のパスが正しいか、ファイルのパーミッションが適切か確認（Windowsの場合は`icacls`で自分のみ読み取り可にする）
- EC2インスタンスが「running」状態か、AWSコンソールまたはCLIで確認

```powershell
aws ec2 describe-instances --filters "Name=tag:Name,Values=taskmanagement-*" --profile taskmanagement
```

### `docker compose up`でコンテナがすぐ落ちる

```bash
docker compose ps
docker compose logs backend
docker compose logs nginx
```

`backend`が落ちる場合はアプリのログ（次項）を、`nginx`が落ちる場合は`nginx/nginx.conf`の構文エラーを確認してください。

### アプリのログを確認したい

EC2にSSHでログインし、Docker Composeのログをそのまま確認します。

```bash
docker compose logs -f backend
```

### ブラウザで開いても真っ白、または`Connection refused`になる

- セキュリティグループで80番ポート（HTTP）が全世界に許可されているか確認
- `docker compose ps`で`nginx`コンテナが起動しているか確認
- EC2インスタンスのパブリックIPが変わっていないか確認（再起動するとIPが変わることがあります。固定したい場合はTerraformでElastic IPを割り当てる構成に変更してください）

## RDS / データベース関連

### バックエンドからRDSに接続できない

- RDS用セキュリティグループが、EC2用セキュリティグループからの5432番ポートを許可しているか確認
- EC2上の`.env`ファイルの`DB_URL`が正しいRDSエンドポイントを指しているか確認（`terraform output rds_endpoint`で確認可能）
- RDSがプライベートサブネットにあり、EC2と同じVPC内にあるか確認

## CORS関連

### ブラウザのコンソールに `has been blocked by CORS policy` と表示される

今回の構成ではNginxがフロントエンドとAPIを同一オリジンで配信するため、本番環境では基本的にCORSエラーは発生しません。
発生する場合は、フロントエンドが`VITE_API_BASE_URL`経由で直接バックエンドのポート（8080番など）にアクセスしてしまっていないか、
Nginxの`location /api/`設定が正しく`backend`コンテナにリバースプロキシしているかを確認してください。

## フロントエンド関連

### アプリを開くと真っ白になる、またはリロードで404になる

Nginxの設定（`nginx/nginx.conf`）で、SPA向けのフォールバック設定（`try_files $uri $uri/ /index.html;`）が
正しく入っているか確認してください。

### 新しいビルドが反映されない

ブラウザのキャッシュが残っている場合があります。強制リロード（`Ctrl+Shift+R`）を試すか、
EC2上で新しいビルド成果物に差し替えた後に`docker compose restart nginx`を実行してください。

---

ここまでで一連のドキュメントは完了です。実際の実装（Terraformコード、Dockerfile、アプリケーションコードの変更）に進む準備ができました。
