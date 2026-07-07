# 05. 実際のデプロイ手順

**注意: このドキュメントに書かれたコマンドは、まだTerraformコード（`infra/`ディレクトリ）が
実装されていない段階での「今後の流れの説明」です。** `infra/`ディレクトリと`backend/Dockerfile`・
`docker-compose.yml`・`nginx/`設定が実装された後に、実際にこの手順でデプロイを行います。実装が完了したら、
このファイルの内容と実際のファイル構成に相違がないか合わせて確認してください。

`terraform apply`はAWS上に実際にリソースを作成し、課金が発生します。
**必ず内容を理解した上で、自分の意思で実行してください。**

---

## 全体の流れ

```
1. インフラ（VPC/EC2/RDS/セキュリティグループ）をterraform apply
2. terraform outputでEC2のパブリックIPとRDSのエンドポイントを取得
3. フロントエンドをビルド（APIのベースURLをEC2のIPに向ける）
4. フロントエンドの成果物・バックエンドのソース・docker-compose.ymlをEC2にscpで転送
5. EC2にSSHでログインし、docker compose upでコンテナを起動
6. ブラウザでEC2のパブリックIPにアクセスして動作確認
```

ECR・ECSを使わないため、Dockerイメージをビルドしてレジストリにpushする工程はありません。
代わりに、ソースコード一式をEC2に転送し、**EC2上で直接`docker compose build`する**方式を取ります
（個人利用でビルド頻度が低いため、レジストリを経由するメリットよりシンプルさを優先しています）。

## ステップ1: インフラを構築

```powershell
cd infra/envs/dev
terraform init
terraform plan
terraform apply
```

`plan`の出力で、作成されるリソース一覧（VPC、サブネット、EC2、RDS、セキュリティグループなど）を確認してから`apply`を実行し、
`yes`と入力して実行します。RDSの作成には数分かかることがあります。

## ステップ2: EC2のIPとRDSのエンドポイントを取得

```powershell
terraform output ec2_public_ip
terraform output rds_endpoint
```

出力されたパブリックIP（例: `54.123.45.67`）が、これ以降のSSH接続・ブラウザアクセス先になります。

## ステップ3: フロントエンドをビルド

```powershell
cd ../../../frontend
echo "VITE_API_BASE_URL=http://<EC2のパブリックIP>" > .env.production
npm run build
```

## ステップ4: EC2にファイルを転送

Terraformで作成したキーペア（`.pem`ファイル）を使ってSCPで転送します。

```powershell
# フロントエンドのビルド成果物
scp -i ./taskmanagement-key.pem -r ./dist ec2-user@<EC2のパブリックIP>:~/frontend-dist

# バックエンドのソース一式（Dockerfileを含む）
scp -i ./taskmanagement-key.pem -r ../backend ec2-user@<EC2のパブリックIP>:~/backend

# docker-compose.ymlとnginx設定
scp -i ./taskmanagement-key.pem ../docker-compose.yml ec2-user@<EC2のパブリックIP>:~/
scp -i ./taskmanagement-key.pem -r ../nginx ec2-user@<EC2のパブリックIP>:~/nginx
```

## ステップ5: EC2にSSHでログインし、コンテナを起動

```powershell
ssh -i ./taskmanagement-key.pem ec2-user@<EC2のパブリックIP>
```

ログイン後、EC2インスタンス上で以下を実行します。

```bash
# RDSのエンドポイントなどをまとめた.envファイルを作成（初回のみ）
cat <<EOF > .env
DB_URL=jdbc:postgresql://<RDSエンドポイント>:5432/taskmanagement
DB_USERNAME=<マスターユーザー名>
DB_PASSWORD=<マスターパスワード>
EOF

# コンテナをビルドして起動
docker compose up -d --build
```

`docker-compose.yml`は以下の2サービスを定義する想定です。

- `backend`: `backend/Dockerfile`からビルドしたSpring Bootコンテナ。8080番ポートは外部公開せず、Nginxコンテナからのみアクセス
- `nginx`: フロントエンドの静的ファイル（`frontend-dist`）を配信し、`/api`宛のリクエストを`backend`コンテナにリバースプロキシ。80番ポートを外部公開

## ステップ6: 動作確認

ブラウザで `http://<EC2のパブリックIP>/actuator/health` にアクセスし、
`{"status":"UP"}` のような応答が返ってくれば、バックエンドは正常に起動しています。

続けて `http://<EC2のパブリックIP>/` にアクセスし、フロントエンドの画面が表示されることを確認します。

---

## 更新時の再デプロイ

コードを変更した場合、ステップ3〜5（該当する部分のみ）を繰り返します。

```bash
# EC2上で再ビルド・再起動
docker compose up -d --build
```

インフラ構成自体（VPCやRDSなど）を変えていない限り、`terraform apply`は差分がなければ何もしません。

## 全部消したいとき

```powershell
cd infra/envs/dev
terraform destroy
```

EC2インスタンスとRDSインスタンスが削除されます。RDSは削除保護を無効化している想定なので、追加の手動操作は不要です。

---

次は`06-app-changes.md`で、アプリケーションコードに加えた変更の理由を解説します。
