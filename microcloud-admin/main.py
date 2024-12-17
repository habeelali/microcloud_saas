#!/usr/bin/env python3

import argparse
import os
import pyodbc
import docker
import random
import socket
import time
import secrets
import string
from dotenv import load_dotenv
import tempfile
import shutil
import shlex

def parse_args():
    parser = argparse.ArgumentParser(description="Spawn a Docker instance based on plan specifications.")
    parser.add_argument('plan_id', type=int, help='Plan ID')
    parser.add_argument('subscription_id', type=int, help='Subscription ID')
    parser.add_argument('node_id', type=int, help='Node ID')
    return parser.parse_args()

def load_env():
    load_dotenv()
    db_credentials = {
        'server': os.getenv('DB_SERVER'),
        'database': os.getenv('DB_NAME'),
        'username': os.getenv('DB_USER'),
        'password': os.getenv('DB_PASSWORD')
    }
    return db_credentials

def connect_db(db_credentials):
    conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={db_credentials['server']};"
        f"DATABASE={db_credentials['database']};"
        f"UID={db_credentials['username']};"
        f"PWD={db_credentials['password']}"
    )
    try:
        connection = pyodbc.connect(conn_str)
        return connection
    except pyodbc.Error as e:
        print("Database connection failed:", e)
        exit(1)

def get_plan_details(connection, plan_id):
    cursor = connection.cursor()
    query = "SELECT * FROM VW_Plans WHERE plan_id = ?"
    cursor.execute(query, (plan_id,))
    row = cursor.fetchone()
    if row:
        plan_details = {
            'vcpu': row.vcpu,
            'ram': row.ram
        }
        return plan_details
    else:
        print("Plan ID not found.")
        exit(1)

def is_port_free(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) != 0

def get_free_ports(count):
    ports = set()
    while len(ports) < count:
        port = random.randint(10000, 11500)
        if is_port_free(port):
            ports.add(port)
    return list(ports)

def generate_password(length=12):
    # Use only letters and digits
    characters = string.ascii_letters + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

def spawn_docker_instance(vcpu, ram, port_mappings, ssh_password):
    client = docker.from_env()

    # Escape the password for the shell command
    escaped_password = shlex.quote(ssh_password)

    # Create a Dockerfile for the container
    dockerfile = f"""
    FROM ubuntu:latest
    RUN apt-get update && apt-get install -y openssh-server && \\
        echo 'root:{escaped_password}' | chpasswd && \\
        sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \\
        sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config && \\
        mkdir /var/run/sshd
    EXPOSE 22 80 443 23 8083
    CMD ["/usr/sbin/sshd", "-D"]
    """

    # Create a temporary directory for the Docker build context
    temp_dir = tempfile.mkdtemp()

    try:
        # Write the Dockerfile to the temporary directory
        dockerfile_path = os.path.join(temp_dir, 'Dockerfile')
        with open(dockerfile_path, 'w') as f:
            f.write(dockerfile)

        # Build the Docker image
        image, build_logs = client.images.build(path=temp_dir, rm=True, tag='custom_ubuntu')

        # Resource constraints
        mem_limit = f"{ram}m"
        nano_cpus = int(float(vcpu) * 1e9)  # Docker uses nanocpus for CPU limit

        # Port mappings
        ports = {
            '80/tcp': port_mappings[0],
            '443/tcp': port_mappings[1],
            '22/tcp': port_mappings[2],
            '23/tcp': port_mappings[3],
            '8083/tcp': port_mappings[4],
        }

        # Run the container
        container = client.containers.run(
            image='custom_ubuntu',
            detach=True,
            mem_limit=mem_limit,
            nano_cpus=nano_cpus,
            ports=ports
        )

        # Wait for the container to start and assign an IP
        time.sleep(5)
        container.reload()  # Reload the container attributes

        return container
    finally:
        # Clean up the temporary directory
        shutil.rmtree(temp_dir)

def get_public_ip():
    import requests
    try:
        ip = requests.get('https://api.ipify.org').text
        return ip
    except requests.RequestException:
        return 'Unavailable'

def main():
    args = parse_args()
    db_credentials = load_env()
    connection = connect_db(db_credentials)
    plan_details = get_plan_details(connection, args.plan_id)

    vcpu = plan_details['vcpu']
    ram = plan_details['ram']

    # Get 5 free ports
    free_ports = get_free_ports(5)

    # Generate SSH password
    ssh_password = generate_password()

    # Spawn Docker instance
    container = spawn_docker_instance(vcpu, ram, free_ports, ssh_password)

    # Get container details
    container_id = container.id

    # Retrieve the internal IP address from the correct network settings
    network_settings = container.attrs['NetworkSettings']
    networks = network_settings['Networks']
    if networks:
        # Assuming the container is connected to one network
        network_name = next(iter(networks))
        internal_ip = networks[network_name]['IPAddress']
    else:
        internal_ip = None  # or handle accordingly

    external_ip = get_public_ip()

    # Insert into TB_Instances
    cursor = connection.cursor()
    proc_query = "{CALL P_AddInstance(?, ?, ?, ?, ?)}"
    cursor.execute(proc_query, (args.plan_id, args.subscription_id, args.node_id, 'Running', container_id))
    connection.commit()

    # Get instance_id
    cursor.execute("SELECT instance_id FROM TB_Instances WHERE container_id = ?", (container_id,))
    instance_row = cursor.fetchone()
    if instance_row:
        instance_id = instance_row.instance_id
    else:
        print("Failed to retrieve instance_id.")
        exit(1)

    # Insert into TB_Port_Mappings
    internal_ports = [80, 443, 22, 23, 8083]
    for external_port, internal_port in zip(free_ports, internal_ports):
        cursor.execute(
            "INSERT INTO TB_Port_Mappings (external_port, internal_port, instance_id) VALUES (?, ?, ?)",
            (external_port, internal_port, instance_id)
        )
    connection.commit()

    # Insert into TB_IP_Mappings
    cursor.execute(
        "INSERT INTO TB_IP_Mappings (external_ip, internal_ip, instance_id) VALUES (?, ?, ?)",
        (external_ip, internal_ip, instance_id)
    )
    connection.commit()

    # Print SSH command
    print("Docker instance has been created successfully.")
    print(f"SSH Command: ssh root@{external_ip} -p {free_ports[2]}")
    print(f"Password: {ssh_password}")

if __name__ == '__main__':
    main()
