resource "tls_private_key" "ec2" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "ec2" {
  key_name   = "${var.project_name}-key"
  public_key = tls_private_key.ec2.public_key_openssh

  tags = {
    Name        = "${var.project_name}-key"
    Environment = var.environment
  }
}

resource "local_file" "private_key" {
  content         = tls_private_key.ec2.private_key_pem
  filename        = "${path.module}/${var.project_name}-key.pem"
  file_permission = "0400"
}
