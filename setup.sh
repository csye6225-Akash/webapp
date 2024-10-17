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
#sudo mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'root'; FLUSH PRIVILEGES; CREATE DATABASE database_development;"

sudo mysql -u root -e "CREATE USER 'akash'@'localhost' IDENTIFIED BY 'akash';"
sudo mysql -u root -e "GRANT ALL PRIVILEGES ON database_development.* TO 'akash'@'localhost';"
sudo mysql -u root -e "CREATE DATABASE database_development;"
sudo mysql -u root -e "FLUSH PRIVILEGES;"

# Unzip the webap .zip file
unzip ~/webapp.zip -d /home/ubuntu/webapp  # Adjust the path to the location of your webapp.zip

# Navigate to the application folder
cd /home/ubuntu/webapp  # Change this to the actual location of your unzipped webapp

# Install the npm dependencies
npm install
