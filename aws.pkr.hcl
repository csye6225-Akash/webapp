packer {
  required_plugins {
    amazon = {
      version = ">= 1"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "aws_region" {
  type = string
}

variable "source_ami" {
  type = string
}

variable "ssh_username" {
  type    = string
  default = "ubuntu"
}

variable "subnet_id" {
  type = string
}

source "amazon-ebs" "csye6225-ami" {
  region          = "us-east-2"
  ami_name        = "csye6225-ami1-1"
  ami_description = "CSYE6225 Assignment-04"
  ssh_username    = "ubuntu"
  # profile         = "${var.aws-profile}"

  aws_polling {
    delay_seconds = 120
    max_attempts  = 50
  }

  ami_users = [
    "886436923776", "361769559850"
  ]

  instance_type = "t2.micro"
  source_ami    = "ami-0ea3c35c5c3284d82"
  # ssh_username  = "${var.ssh_username}"
  subnet_id = "${var.subnet_id}"


  launch_block_device_mappings {
    delete_on_termination = true
    device_name           = "/dev/sda1"
    volume_size           = 8
    volume_type           = "gp2"
  }
}

build {
  sources = [
    "source.amazon-ebs.csye6225-ami"
  ]

  provisioner "file" {
    source      = "webapp.zip"
    destination = "~/"
  }

   provisioner "shell" {
    script = "setup.sh"
  }
}