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

  default = ""
}

variable "source_ami" {
  type = string
}

variable "ssh_username" {
  type    = string
  default = ""
}

variable "ami_users" {
  type    = string
  default = ""
}

variable "subnet_id" {
  type    = string
  default = ""
}

source "amazon-ebs" "csye6225-ami" {
  region          = "${var.aws_region}"
  ami_name        = "csye6225-ami-${formatdate("YYYY_MM_DD_hh_mm_ss", timestamp())}"
  ami_description = "CSYE6225 Assignment-04"
  #ssh_username    = "ubuntu"
  #profile = "${var.aws-profile}"

  aws_polling {
    delay_seconds = 120
    max_attempts  = 50
  }

  ami_users = [
    "${var.ami_users}"
  ]

  instance_type = "t2.small"
  source_ami    = "${var.source_ami}"
  ssh_username  = "ubuntu"
  subnet_id     = "${var.subnet_id}"


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