# 06. アプリケーションコードの変更点（予定）

**注意: このドキュメントは、今後実施するアプリケーションコード変更（別Issueで対応予定）の
内容と理由を先にまとめたものです。** 実装が完了次第、このファイルを実際の変更内容に合わせて更新します。

---

## なぜアプリ側の変更が必要か

現状のコードは、ローカル開発（`localhost`）だけを前提にした設定がハードコードされています。
AWS上にデプロイすると、バックエンドのURLもフロントエンドが呼び出すAPIのURLも、
ローカルとは全く異なるものになります。環境ごとに値を切り替えられるよう、設定を外部化する必要があります。

## 1. CORS設定の環境変数化（バックエンド）

**対象**: `backend/src/main/java/com/example/taskmanagement/config/WebConfig.java`

現状:

```java
registry.addMapping("/api/**").allowedOrigins("http://localhost:5173")
        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS").allowedHeaders("*").maxAge(3600);
```

`http://localhost:5173`が固定で書かれているため、本番のCloudFrontドメイン（例: `https://d1234abcd.cloudfront.net`）
からのアクセスはCORSエラーで拒否されてしまいます。

CORS（Cross-Origin Resource Sharing）とは、「あるオリジン（ドメイン）で動いているWebページから、
別のオリジンのAPIを呼び出してよいか」をブラウザが確認する仕組みです。バックエンドが許可リストにないオリジンからの
リクエストを拒否するのは、悪意あるサイトが勝手にAPIを呼び出すのを防ぐためのセキュリティ機構です。

**変更方針**: `allowedOrigins`の値を`application.yml`のプロパティから読み込むようにし、
ローカル開発用のCORS設定は`application.yml`のデフォルト値として残しつつ、本番環境ではECSタスク定義の環境変数
`CORS_ALLOWED_ORIGINS`でCloudFrontのドメインを注入できるようにします。

## 2. APIクライアントのbaseURL環境変数化（フロントエンド）

**対象**: `frontend/src/api/client.ts`

現状:

```typescript
const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
  ...
});
```

本番ビルドでは、ALBのDNS名（例: `http://taskmanagement-alb-xxx.ap-northeast-1.elb.amazonaws.com`）を
向く必要があります。しかし本番用に毎回コードを書き換えるのは非現実的です。

**変更方針**: Viteのビルド時環境変数機能（`import.meta.env`）を使い、`VITE_API_BASE_URL`という環境変数から
baseURLを取得するように変更します。この環境変数は、`.env.production`ファイル（`npm run build`時に読み込まれる）
に本番用のALB URLを設定することで注入します。ローカル開発時は`.env.production`が存在しない・設定されていなければ、
従来通り`http://localhost:8080`にフォールバックします。

Viteでは`VITE_`という接頭辞がついた環境変数のみ、ビルド後のフロントエンドコードから参照できる仕様になっています
（それ以外の環境変数は、意図せずビルド成果物に埋め込まれて公開されるのを防ぐため除外されます）。

## 3. Dockerfileの新規作成（バックエンド）

**対象**: `backend/Dockerfile`（新規）

現状、バックエンドをコンテナ化する設定が存在しません。ECS Fargateで実行するには、
Dockerイメージとしてビルドできる必要があります。

**変更方針**: マルチステージビルドで、以下の2段階に分けます。

1. **ビルドステージ**: JDKを含むイメージ上で`./gradlew bootJar`を実行し、実行可能なJARファイルを生成
2. **実行ステージ**: JRE（実行環境のみ、開発ツール類を含まない軽量イメージ）上に、ビルドステージで生成したJARファイルだけをコピー

2段階に分ける理由は、最終的なイメージサイズを小さくするためです。ビルドに必要なツール（Gradle本体、ソースコードなど）は
実行時には不要なので、実行用イメージには含めません。イメージが小さいほど、ECRへのpush・ECS上でのpull・起動が高速になります。

**検証が必要な点**: このプロジェクトはJava 25のtoolchainを使用しています（`backend/build.gradle.kts`）。
Java 25は非常に新しいバージョンのため、実装時に`eclipse-temurin`等の公式Dockerイメージで
対応タグが存在するか確認が必要です。存在しない場合は、Gradle toolchain機能でビルド時にJDK 25を自動ダウンロードさせつつ、
ベースイメージ自体は入手可能なLTSバージョン（JDK 21等）にする代替案を検討します。

## 4. Vite環境変数の型定義追加

**対象**: `frontend/src/vite-env.d.ts`（新規）

現状このファイルが存在しないため、`import.meta.env.VITE_API_BASE_URL`のようなコードを書いてもTypeScriptの型補完・型チェックが効きません。
Viteプロジェクトの標準的な作法に従い、`ImportMetaEnv`インターフェースを拡張する型定義ファイルを追加します。

---

これらの変更が完了すると、同じコードベースから「ローカル開発用のビルド」と「AWS本番用のビルド」の両方を、
設定ファイル（環境変数）の違いだけで作り分けられるようになります。

次は`07-cost-management.md`で、コストの試算と管理方法を解説します。
