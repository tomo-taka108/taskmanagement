data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "app" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public[0].id
  vpc_security_group_ids      = [aws_security_group.ec2.id]
  key_name                    = aws_key_pair.ec2.key_name
  associate_public_ip_address = true

  user_data = <<-EOF
    #!/bin/bash
    set -eux
    dnf install -y docker
    systemctl enable --now docker
    usermod -aG docker ec2-user

    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
  EOF

  root_block_device {
    volume_size = var.root_volume_size_gb
    volume_type = "gp3"
  }

  tags = {
    Name        = "${var.project_name}-ec2"
    Environment = var.environment
  }
}
