variable "aws_region" {
  description = "AWSリージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "aws_profile" {
  description = "AWS CLIのSSOプロファイル名"
  type        = string
  default     = "takashima"
}

variable "project_name" {
  description = "リソース名・タグのプレフィックス"
  type        = string
  default     = "taskmanagement"
}

variable "environment" {
  description = "環境名（タグ用）"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "VPCのCIDRブロック"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "パブリックサブネットのCIDRブロック一覧（異なる2つのAZに1つずつ作成）"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "instance_type" {
  description = "EC2インスタンスタイプ（無料利用枠対象）"
  type        = string
  default     = "t3.micro"
}

variable "my_ip_cidr" {
  description = "SSH接続を許可する自分のIPアドレス（CIDR形式、例: 203.0.113.45/32）"
  type        = string
}

variable "root_volume_size_gb" {
  description = "EC2のルートEBSボリュームサイズ（GB、無料利用枠の上限に合わせる）"
  type        = number
  default     = 30
}
