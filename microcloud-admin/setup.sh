echo "Updating package lists..."
sudo apt-get update
echo "Installing required dependencies..."
sudo apt-get install -y curl apt-transport-https software-properties-common
sudo apt-get install -y build-essential libssl-dev libffi-dev python3-dev
sudo apt-get install -y unixodbc unixodbc-dev
sudo apt-get install -y python3-pip
echo "Importing Microsoft GPG key..."
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
echo "Adding Microsoft SQL Server Ubuntu repository..."
UBUNTU_VERSION=$(lsb_release -rs)
sudo curl https://packages.microsoft.com/config/ubuntu/$UBUNTU_VERSION/prod.list -o /etc/apt/sources.list.d/mssql-release.list
echo "Updating package lists after adding Microsoft repository..."
sudo apt-get update
echo "Installing Microsoft ODBC Driver for SQL Server..."
sudo ACCEPT_EULA=Y apt-get install -y msodbcsql17
echo "Installing unixODBC development headers..."
sudo apt-get install -y unixodbc-dev
echo "Installing required Python packages..."
pip3 install --upgrade pip
pip3 install pyodbc docker python-dotenv requests
echo "Setup complete! Please update the .env file with your database credentials."
echo "Note: You may need to log out and log back in for Docker group changes to take effect."