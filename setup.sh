#!/bin/bash

# Update the package list
sudo apt-get update
sudo apt-get upgrade -y

# Install Unzip
sudo apt-get install -y unzip

# Install Node.js and NPM
sudo apt-get install -y nodejs npm

sudo mv ~/webapp.zip /opt/

if ! id -u csye6225 >/dev/null 2>&1; then
 sudo useradd -m -s /bin/bash csye6225
fi

              

# Unzip the webapp.zip file to /opt/webapp directory
sudo unzip /opt/webapp.zip -d /opt/webapp
sudo chown -R csye6225:csye6225 /opt/webapp
sudo chmod g+x /opt/webapp

wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E amazon-cloudwatch-agent.deb

cd /opt/webapp && sudo npm install && sudo rm -r .git
              
# sudo rm -f /opt/webapp/.env 



cd /opt/webapp && sudo mv webapp.service /etc/systemd/system

# Reload systemd to register the new service
sudo systemctl daemon-reload
              
# Start and enable the service to run at boot
sudo systemctl enable webapp.service
sudo systemctl start webapp.service
