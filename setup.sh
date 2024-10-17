#!/bin/bash

# Update the package list
sudo apt-get update
sudo apt-get upgrade -y

# Install Unzip
sudo apt-get install -y unzip

# Install Node.js and check the version
sudo apt-get install -y nodejs npm

# Install NPM
sudo apt-get install npm -y

#Install MariaDB server
sudo apt-get install mysql-server -y

# # Start the MariaDB service and enable it
sudo systemctl start mysql
sudo systemctl enable mysql


sudo mysql_secure_installation -y

 sudo mysql -uroot -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'akash';FLUSH PRIVILEGES;CREATE DATABASE database_development;"