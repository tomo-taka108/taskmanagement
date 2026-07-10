output "ec2_public_ip" {
  description = "EC2インスタンスのパブリックIPアドレス"
  value       = aws_instance.app.public_ip
}

output "ec2_instance_id" {
  description = "EC2インスタンスID"
  value       = aws_instance.app.id
}

output "ec2_security_group_id" {
  description = "EC2用セキュリティグループID（Stage 2でRDS用SGの許可元として参照）"
  value       = aws_security_group.ec2.id
}

output "vpc_id" {
  description = "VPC ID（Stage 2でプライベートサブネット作成時に参照）"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "パブリックサブネットID一覧"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "プライベートサブネットID一覧"
  value       = aws_subnet.private[*].id
}

output "rds_endpoint" {
  description = "RDSのエンドポイント（ホスト名:ポート）"
  value       = aws_db_instance.main.endpoint
}

output "rds_address" {
  description = "RDSのホスト名（ポートなし）"
  value       = aws_db_instance.main.address
}
