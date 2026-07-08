data "aws_availability_zones" "available" {
  state = "available"
}

# パブリックサブネット（Stage 1）
# プライベートサブネット用に 10.0.11.0/24 (AZ 1つ目) / 10.0.12.0/24 (AZ 2つ目) を予約している（Stage 2でRDS用に追加予定）
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-public-${count.index + 1}"
    Environment = var.environment
  }
}
