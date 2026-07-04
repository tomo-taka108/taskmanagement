# 03. Terraformの基本概念 / IaCとは何か

コードを書き始める前に、Terraformが何をするツールで、どんな概念が出てくるかを理解しておきます。

---

## 1. IaC（Infrastructure as Code）とは

IaCとは、「サーバーやネットワークなどのインフラ構成を、プログラムのコードとして記述し、
そのコードを実行することでインフラを構築する」という考え方です。

対義語は「手動構築」です。マネジメントコンソールでボタンをクリックしてサーバーを作るのが手動構築、
「VPCを1つ、サブネットを2つ、EC2を1台作る」という内容をコードに書いて実行するのがIaCです。

`00-overview.md`で触れた通り、IaCの利点は**再現性・記録性・レビュー可能性・削除のしやすさ**です。

## 2. Terraformとは

TerraformはHashiCorp社が開発するIaCツールです。特徴は以下の通りです。

- **宣言的**: 「どういう手順で作るか」ではなく「最終的にどんな状態であるべきか」を書く
  - 例: 「まずVPCを作って、次にサブネットを作って...」という手順を書くのではなく、
    「VPCがこれで、サブネットがこれで...」という完成形を書く。作る順序はTerraformが自動で判断する
- **マルチクラウド対応**: AWSだけでなくGCP、Azureなど様々なクラウドに対応（今回はAWSのみ使用）
- **HCL（HashiCorp Configuration Language）**という専用の設定言語を使う

## 3. 基本概念

### Provider（プロバイダ）

「どのクラウドを、どのリージョンで操作するか」を宣言します。

```hcl
provider "aws" {
  region  = "ap-northeast-1"
  profile = "taskmanagement"
}
```

これは「AWSの東京リージョンを、`taskmanagement`という認証プロファイルを使って操作します」という宣言です。

### Resource（リソース）

実際に作りたいもの1つ1つを表します。VPC、EC2、S3バケットなど、AWS上の「モノ」はすべてresourceで表現します。

```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}
```

`resource "リソースの種類" "自分でつけた名前"`という形式です。この例は「10.0.0.0/16というアドレス範囲のVPCを作り、
以降このコード内では`aws_vpc.main`という名前で参照できるようにする」という意味です。

### Variable（変数）

環境ごとに変わる値（リージョン名、パスワードなど）をコードから分離するための仕組みです。

```hcl
variable "aws_region" {
  type    = string
  default = "ap-northeast-1"
}
```

こうしておくと、コードの中では`var.aws_region`として参照でき、環境によって値を変えられます。

### Output（出力）

Terraformが作ったリソースの情報（IDやURLなど）を、apply後に画面に表示・取得できるようにする仕組みです。

```hcl
output "alb_dns_name" {
  value = aws_lb.main.dns_name
}
```

これにより、`terraform output alb_dns_name`でALBのURLを取得し、フロントエンドの設定に使う、といったことができます。

### State（ステート）

Terraformは「今どんなリソースを作ったか」を`terraform.tfstate`というファイルに記録します。
これが**非常に重要**な概念です。

- Terraformはこのstateファイルを見て「前回作ったものと今のコードの差分」を計算します
- stateファイルには、作成したリソースのIDなど、実際のAWS上の情報が入ります（**パスワードなどの機密情報が平文で入ることもあるため、Gitには絶対にコミットしない**）
- 今回は学習・個人利用なので、stateファイルは手元のPC（ローカル）に置く「ローカルstate」方式を使います
- チームで複数人が同じインフラを触る場合は、S3などにstateを置く「リモートstate」方式が使われます（発展的な話題として`07-cost-management.md`で軽く触れます）

### Plan と Apply

Terraformの操作は基本的に以下の3ステップです。

1. **`terraform init`**: 使用するproviderのプラグインをダウンロードする（最初の1回、または新しいproviderを追加した時）
2. **`terraform plan`**: 今のコードを実行すると「何が作られ、何が変更され、何が削除されるか」を**実行せずに**表示する
3. **`terraform apply`**: 実際にAWS上にリソースを作成・変更・削除する

**`plan`は必ず`apply`の前に確認する癖をつけてください。** 特に「削除(destroy)」の表示が意図せず出ていないか確認するのが重要です。
誤って本番データベースを消してしまう、といった事故を防ぐための最後の確認ポイントです。

## 4. なぜコンソールではなくTerraformで管理するとよいか（再確認）

- コードなので、`git diff`で「前回から何が変わったか」が一目でわかる
- `terraform plan`で「実行する前に結果を予測できる」のは、コンソールのボタン操作にはない大きな利点
- `terraform destroy`で「作ったものを全部、漏れなく削除できる」（コスト管理上、非常に重要）

## 5. Terraform実行の基本ワークフロー（今回の流れ）

```
terraform init    # 初回だけ（またはprovider追加時）
terraform plan    # 何が作られるか確認
terraform apply   # 実際に作成（確認プロンプトで yes と入力）
# ... 使い終わったら ...
terraform destroy # 作ったものを全部削除（課金を止める）
```

---

具体的にどのAWSサービスをどう組み合わせるかは `04-infra-design.md` で解説します。
