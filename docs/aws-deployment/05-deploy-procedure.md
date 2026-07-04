# 05. 実際のデプロイ手順

**注意: このドキュメントに書かれたコマンドは、まだTerraformコード（`infra/`ディレクトリ）が
実装されていない段階での「今後の流れの説明」です。** `infra/`ディレクトリと`backend/Dockerfile`が
実装された後に、実際にこの手順でデプロイを行います。実装が完了したら、このファイルの内容と
実際のファイル構成に相違がないか合わせて確認してください。

`terraform apply`はAWS上に実際にリソースを作成し、課金が発生します。
**必ず内容を理解した上で、自分の意思で実行してください。**

---

## 全体の流れ

```
1. ECRリポジトリだけ先にterraform applyで作る
2. バックエンドのDockerイメージをbuildしてECRにpush
3. 残りのインフラ（VPC/RDS/ALB/ECS/S3/CloudFront）をterraform apply
4. terraform outputでALBのURLを取得
5. フロントエンドの環境変数にALBのURLを設定してビルド
6. S3にフロントエンドの成果物をアップロード
7. CloudFrontのキャッシュを無効化
```

なぜECRだけ先に作るかというと、ECSのタスク定義が「ECR上にイメージが存在すること」を前提にしているためです。
イメージが存在しない状態でECSサービスを作ろうとすると、タスクの起動に失敗します。

## ステップ1: ECRリポジトリを先に作る

```powershell
cd infra/envs/dev
terraform init
terraform apply -target=aws_ecr_repository.backend
```

`-target`オプションで、特定のリソースだけを先に作ることができます。

## ステップ2: バックエンドのDockerイメージをビルド・push

```powershell
# ECRのリポジトリURLを確認
terraform output ecr_repository_url

# ECRへのDockerログイン
aws ecr get-login-password --profile taskmanagement --region ap-northeast-1 | `
  docker login --username AWS --password-stdin <アカウントID>.dkr.ecr.ap-northeast-1.amazonaws.com

# イメージをビルド
docker build -t taskmanagement-backend ./backend

# ECRのURL形式にタグ付け
docker tag taskmanagement-backend:latest <ECRリポジトリURL>:latest

# push
docker push <ECRリポジトリURL>:latest
```

## ステップ3: 残りのインフラを構築

```powershell
terraform plan
terraform apply
```

`plan`の出力で、作成されるリソース一覧（VPC、サブネット、RDS、ALB、ECSサービスなど）を確認してから`apply`を実行し、
`yes`と入力して実行します。RDSの作成には数分かかることがあります。

## ステップ4: バックエンドのURLを取得

```powershell
terraform output alb_dns_name
```

出力されたDNS名（例: `taskmanagement-alb-123456789.ap-northeast-1.elb.amazonaws.com`）が、
バックエンドAPIのベースURLになります。ブラウザで `http://<このDNS名>/actuator/health` にアクセスし、
`{"status":"UP"}` のような応答が返ってくれば、バックエンドは正常に起動しています。

## ステップ5: フロントエンドをビルド

```powershell
cd ../../../frontend
echo "VITE_API_BASE_URL=http://<ALBのDNS名>" > .env.production
npm run build
```

## ステップ6: S3にアップロード

```powershell
terraform -chdir=../infra/envs/dev output s3_bucket_name
aws s3 sync ./dist s3://<バケット名> --delete --profile taskmanagement
```

`--delete`オプションにより、S3側にあってローカルの`dist`にないファイル（古いビルドの残骸）は削除されます。

## ステップ7: CloudFrontのキャッシュを無効化

CloudFrontは配信を高速化するためにファイルをキャッシュしているため、新しいビルドをアップロードしても
すぐには反映されません。キャッシュを明示的に無効化(invalidate)する必要があります。

```powershell
terraform -chdir=../infra/envs/dev output cloudfront_distribution_id
aws cloudfront create-invalidation --distribution-id <ディストリビューションID> --paths "/*" --profile taskmanagement
```

## ステップ8: 動作確認

```powershell
terraform -chdir=infra/envs/dev output cloudfront_domain_name
```

出力されたドメイン（例: `d1234abcd.cloudfront.net`）にブラウザでアクセスし、アプリが表示されることを確認します。

---

## 更新時の再デプロイ

コードを変更した場合、バックエンドは ステップ2→3（`terraform apply`は変更があった場合のみ）、
フロントエンドはステップ5〜7を繰り返せば反映されます。インフラ構成自体（VPCやRDSなど）を変えていない限り、
`terraform apply`は差分がなければ何もしません。

## 全部消したいとき

```powershell
cd infra/envs/dev
terraform destroy
```

S3バケットの中身が残っていると削除に失敗することがあるため、その場合は先にバケットを空にしてから再実行します。

```powershell
aws s3 rm s3://<バケット名> --recursive --profile taskmanagement
terraform destroy
```

---

次は`06-app-changes.md`で、アプリケーションコードに加えた変更の理由を解説します。
