from flask import Flask, request, jsonify
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
import requests
import jwt
from functools import wraps
from datetime import datetime, timedelta

app = Flask(__name__)

# Load environment variables
load_dotenv()
JWT_SECRET = os.getenv('JWT_SECRET')

# Utility to create JWT
def create_jwt(data, expires_in=60):
    payload = {
        "data": data,
        "exp": datetime.utcnow() + timedelta(minutes=expires_in)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

# Utility to decode JWT
def decode_jwt(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    except jwt.InvalidTokenError:
        raise Exception("Invalid token")

# Decorator to protect routes
def jwt_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Authorization header is missing"}), 401
        try:
            token = auth_header.split(" ")[1]
            decode_jwt(token)
        except Exception as e:
            return jsonify({"error": str(e)}), 401
        return f(*args, **kwargs)
    return wrapper

# Connect to the database
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
        raise Exception(f"Database connection failed: {str(e)}")

# Retrieve plan details from the database
def get_plan_details(connection, plan_id):
    cursor = connection.cursor()
    query = "SELECT * FROM VW_Plans WHERE plan_id = ?"
    cursor.execute(query, (plan_id,))
    row = cursor.fetchone()
    if row:
        return {
            'vcpu': row.vcpu,
            'ram': row.ram
        }
    else:
        raise Exception(f"Plan ID {plan_id} not found.")

# Check if a port is free
def is_port_free(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) != 0

# Get a list of free ports
def get_free_ports(count):
    ports = set()
    while len(ports) < count:
        port = random.randint(10000, 11500)
        if is_port_free(port):
            ports.add(port)
    return list(ports)

# Generate a random password
def generate_password(length=12):
    characters = string.ascii_letters + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

# Spawn a Docker instance
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

    temp_dir = tempfile.mkdtemp()

    try:
        dockerfile_path = os.path.join(temp_dir, 'Dockerfile')
        with open(dockerfile_path, 'w') as f:
            f.write(dockerfile)

        image, _ = client.images.build(path=temp_dir, rm=True, tag='custom_ubuntu')

        mem_limit = f"{ram}m"
        nano_cpus = int(float(vcpu) * 1e9)

        ports = {
            '80/tcp': port_mappings[0],
            '443/tcp': port_mappings[1],
            '22/tcp': port_mappings[2],
            '23/tcp': port_mappings[3],
            '8083/tcp': port_mappings[4],
        }

        container = client.containers.run(
            image='custom_ubuntu',
            detach=True,
            mem_limit=mem_limit,
            nano_cpus=nano_cpus,
            ports=ports
        )

        time.sleep(5)
        container.reload()

        return container
    finally:
        shutil.rmtree(temp_dir)

# Get public IP address
def get_public_ip():
    try:
        return requests.get('https://api.ipify.org').text
    except requests.RequestException:
        return 'Unavailable'

# Login endpoint to issue JWT
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # Simplified authentication (replace with real logic)
    if username == "admin" and password == "password":
        token = create_jwt({"username": username})
        return jsonify({"token": token})
    else:
        return jsonify({"error": "Invalid credentials"}), 401

# Spawn instance endpoint (requires JWT)
@app.route('/spawn_instance', methods=['POST'])
@jwt_required
def spawn_instance():
    data = request.json
    plan_id = data.get('plan_id')
    subscription_id = data.get('subscription_id')
    node_id = data.get('node_id')

    if not plan_id or not subscription_id or not node_id:
        return jsonify({"error": "Missing required fields: plan_id, subscription_id, node_id"}), 400

    try:
        db_credentials = load_env()
        connection = connect_db(db_credentials)

        plan_details = get_plan_details(connection, plan_id)
        vcpu = plan_details['vcpu']
        ram = plan_details['ram']

        free_ports = get_free_ports(5)
        ssh_password = generate_password()

        container = spawn_docker_instance(vcpu, ram, free_ports, ssh_password)

        container_id = container.id
        network_settings = container.attrs['NetworkSettings']
        networks = network_settings['Networks']
        internal_ip = next(iter(networks.values()))['IPAddress'] if networks else None
        external_ip = get_public_ip()

        cursor = connection.cursor()
        cursor.execute("{CALL P_AddInstance(?, ?, ?, ?, ?)}",
                       (plan_id, subscription_id, node_id, 'Running', container_id))
        connection.commit()

        cursor.execute("SELECT instance_id FROM TB_Instances WHERE container_id = ?", (container_id,))
        instance_id = cursor.fetchone().instance_id

        internal_ports = [80, 443, 22, 23, 8083]
        for ext_port, int_port in zip(free_ports, internal_ports):
            cursor.execute(
                "INSERT INTO TB_Port_Mappings (external_port, internal_port, instance_id) VALUES (?, ?, ?)",
                (ext_port, int_port, instance_id))
        connection.commit()

        cursor.execute(
            "INSERT INTO TB_IP_Mappings (external_ip, internal_ip, instance_id) VALUES (?, ?, ?)",
            (external_ip, internal_ip, instance_id))
        connection.commit()

        return jsonify({
            "message": "Docker instance has been created successfully.",
            "ssh_command": f"ssh root@{external_ip} -p {free_ports[2]}",
            "password": ssh_password,
            "instance_id": instance_id,
            "container_id": container_id,
            "ports": {
                "external_ports": free_ports,
                "internal_ports": internal_ports
            },
            "external_ip": external_ip,
            "internal_ip": internal_ip
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
