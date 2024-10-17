#!/bin/bash

# Update the package list
sudo apt-get update
sudo apt-get upgrade -y

# Install Unzip
sudo apt-get install -y unzip

# Install Node.js and NPM
sudo apt-get install -y nodejs npm

# Install MySQL server
sudo apt-get install mysql-server -y

# Start the MySQL service and enable it
sudo systemctl start mysql
sudo systemctl enable mysql

# Alter the MySQL root user password and create a database
sudo mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'root'; FLUSH PRIVILEGES; CREATE DATABASE database_development;"

cd ~/

npm install


