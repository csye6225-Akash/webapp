#!/bin/bash

# Update the package list
sudo apt-get update
sudo apt-get upgrade -y

# Install Unzip
sudo apt-get install -y unzip

# Install Node.js and NPM
sudo apt-get install -y nodejs npm

sudo mv ~/webapp.zip /opt/

# Unzip the webap .zip file
sudo unzip /opt/webapp.zip -d /opt/  # Adjust the path to the location of your webapp.zip

# # Navigate to the application folder
# cd opt/webapp  

# sudo npm install
