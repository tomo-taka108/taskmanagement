# 06. アプリケーションコードの変更点（予定）

**注意: このドキュメントは、今後実施するアプリケーションコード変更（別Issueで対応予定）の
内容と理由を先にまとめたものです。** 実装が完了次第、このファイルを実際の変更内容に合わせて更新します。

---

## なぜアプリ側の変更が必要か

現状のコードは、ローカル開発（`localhost`）だけを前提にした設定がハードコードされています。
AWS上にデプロイすると、バックエンドのURLもフロントエンドが呼び出すAPIのURLも、
ローカルとは全く異なるものになります。環境ごとに値を切り替えられるよう、設定を外部化する必要があります。

## 1. CORS設定の緩和・環境変数化（バックエンド）

**対象**: `backend/src/main/java/com/example/taskmanagement/config/WebConfig.java`

現状:

```java
registry.addMapping("/api/**").allowedOrigins("http://localhost:5173")
        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS").allowedHeaders("*").maxAge(3600);
```

今回の本番構成では、NginxがフロントエンドとバックエンドAPIの両方を同じオリジン（同じIP・同じポート80）で配信するため、
**本番環境ではブラウザから見るとCORSは発生しません**（フロントエンドとAPIが同一オリジンになるため）。

ただし、ローカル開発時（フロントエンド`localhost:5173` → バックエンド`localhost:8080`）は引き続き別オリジンなので、
CORS設定自体は残します。`allowedOrigins`の値を`application.yml`のプロパティから読み込むようにし、
ローカル開発用のCORS設定はデフォルト値として残しつつ、本番環境では環境変数`CORS_ALLOWED_ORIGINS`で
上書きできるようにしておきます（将来的に構成を変えた場合の保険として環境変数化はしておきますが、
今回のNginxリバースプロキシ構成では実質的に本番でCORSエラーが発生することはありません）。

## 2. APIクライアントのbaseURL環境変数化（フロントエンド）

**対象**: `frontend/src/api/client.ts`

現状:

```typescript
const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
  ...
});
```

本番ビルドでは、NginxがAPIリクエストをリバースプロキシするため、フロントエンドは**相対パス（`/api`）でリクエストするだけでよく**、
バックエンドのホスト名やポートを意識する必要がありません。

**変更方針**: Viteのビルド時環境変数機能（`import.meta.env`）を使い、`VITE_API_BASE_URL`という環境変数からbaseURLを取得するように変更します。
ローカル開発時は`http://localhost:8080`にフォールバックし、本番用の`.env.production`では空文字列（相対パス扱い）を設定します。

## 3. Dockerfileの新規作成（バックエンド）

**対象**: `backend/Dockerfile`（新規）

現状、バックエンドをコンテナ化する設定が存在しません。EC2上でDocker Composeにより実行するには、
Dockerイメージとしてビルドできる必要があります。

**変更方針**: マルチステージビルドで、以下の2段階に分けます。

1. **ビルドステージ**: JDKを含むイメージ上で`./gradlew bootJar`を実行し、実行可能なJARファイルを生成
2. **実行ステージ**: JRE（実行環境のみ、開発ツール類を含まない軽量イメージ）上に、ビルドステージで生成したJARファイルだけをコピー

2段階に分ける理由は、最終的なイメージサイズを小さくするためです。ビルドに必要なツール（Gradle本体、ソースコードなど）は
実行時には不要なので、実行用イメージには含めません。イメージが小さいほど、`t3.micro`という限られたリソースのEC2上でも
ビルド・起動が軽くなります。

**検証が必要な点**: このプロジェクトはJava 25のtoolchainを使用しています（`backend/build.gradle.kts`）。
Java 25は非常に新しいバージョンのため、実装時に`eclipse-temurin`等の公式Dockerイメージで
対応タグが存在するか確認が必要です。存在しない場合は、Gradle toolchain機能でビルド時にJDK 25を自動ダウンロードさせつつ、
ベースイメージ自体は入手可能なLTSバージョン（JDK 21等）にする代替案を検討します。

## 4. docker-compose.ymlの新規作成

**対象**: `docker-compose.yml`（新規、リポジトリルート）

EC2上で`backend`コンテナと`nginx`コンテナをまとめて起動・管理するための定義ファイルです。

- `backend`: `backend/Dockerfile`からビルド。RDSの接続情報（`DB_URL`、`DB_USERNAME`、`DB_PASSWORD`）を環境変数（`.env`ファイル）から注入。8080番ポートはコンテナ間ネットワークのみに公開し、ホストOSには公開しない
- `nginx`: 公式`nginx`イメージをベースに、フロントエンドのビルド成果物と`nginx/nginx.conf`をマウント。80番ポートをホストOS（EC2）に公開

## 5. Nginx設定の新規作成

**対象**: `nginx/nginx.conf`（新規）

フロントエンドの静的ファイル配信とバックエンドAPIへのリバースプロキシを1つの設定にまとめます。

- `location /`: フロントエンドの静的ファイル（`frontend-dist`）を配信。SPA（Single Page Application）のため、存在しないパスへのアクセスは`index.html`にフォールバックする設定（`try_files ... /index.html`）を入れる
- `location /api/`: `backend`コンテナ（`http://backend:8080`）へリバースプロキシ

## 6. Vite環境変数の型定義追加

**対象**: `frontend/src/vite-env.d.ts`（新規）

現状このファイルが存在しないため、`import.meta.env.VITE_API_BASE_URL`のようなコードを書いてもTypeScriptの型補完・型チェックが効きません。
Viteプロジェクトの標準的な作法に従い、`ImportMetaEnv`インターフェースを拡張する型定義ファイルを追加します。

---

これらの変更が完了すると、同じコードベースから「ローカル開発用のビルド」と「AWS本番用のビルド」の両方を、
設定ファイル（環境変数）の違いだけで作り分けられるようになります。

次は`07-cost-management.md`で、コストの試算と管理方法を解説します。
