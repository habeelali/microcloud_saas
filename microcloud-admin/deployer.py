from flask import Flask, request, jsonify
from flask_cors import CORS
import pyodbc
import random
import datetime
import paramiko
import re
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database connection details - update these accordingly
DB_SERVER = '143.110.243.146'
DB_DATABASE = 'microcloud'
DB_USERNAME = 'sa'
DB_PASSWORD = 
ODBC_DRIVER = '{ODBC Driver 17 for SQL Server}'  # Adjust as needed

def get_db_connection():
    conn_str = f"DRIVER={ODBC_DRIVER};SERVER={DB_SERVER};DATABASE={DB_DATABASE};UID={DB_USERNAME};PWD={DB_PASSWORD}"
    conn = pyodbc.connect(conn_str)
    return conn

def run_remote_command(node_ip, plan_id, subscription_id, node_id):
    # Load SSH config
    ssh_config = paramiko.SSHConfig()
    config_path = os.path.expanduser('~/.ssh/config')
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            ssh_config.parse(f)
    else:
        raise Exception("No SSH config found at ~/.ssh/config")

    # Map node_ip to known SSH alias from ~/.ssh/config
    ip_to_alias = {
        '129.151.137.147': 'oracle1',
        '129.151.158.64': 'oracle2',
        '15.206.149.72': 'aws1',
        '4.213.178.67': 'azure1-1',
        '4.251.115.138': 'azure1-2',
        '4.240.98.248': 'azure1-3',
        '4.213.36.141': 'azure2-1',
        '40.120.108.242': 'azure2-2',
        '172.164.241.50': 'azure2-3'
    }

    if node_ip in ip_to_alias:
        host_alias = ip_to_alias[node_ip]
    else:
        raise Exception(f"No SSH alias found for IP: {node_ip}")

    host_conf = ssh_config.lookup(host_alias)

    hostname = host_conf.get('hostname', host_alias)
    username = host_conf.get('user', 'ubuntu')  # Default if not specified in config
    identityfile = host_conf.get('identityfile', None)
    if identityfile and isinstance(identityfile, list):
        identityfile = identityfile[0]

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    ssh.connect(
        hostname=hostname,
        username=username,
        key_filename=identityfile,
    )

    command = f"sudo python3 main.py {plan_id} {subscription_id} {node_id}"
    stdin, stdout, stderr = ssh.exec_command(command)
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    ssh.close()

    if error.strip():
        raise Exception(f"Remote command error: {error.strip()}")

    return output

def parse_output(output):
    ssh_line = None
    pwd_line = None
    for line in output.split('\n'):
        line = line.strip()
        if line.startswith("SSH Command:"):
            ssh_line = line
        elif line.startswith("Password:"):
            pwd_line = line

    if not ssh_line or not pwd_line:
        raise Exception("Failed to parse output: Missing SSH Command or Password lines.")

    match = re.search(r"ssh\s+root@([\d\.]+)\s+\-p\s+(\d+)", ssh_line)
    if not match:
        raise Exception("Failed to parse SSH command line.")

    ip_addr = match.group(1)
    tcp_port = int(match.group(2))
    psswd = pwd_line.split("Password:")[1].strip()
    return ip_addr, tcp_port, psswd

@app.route('/deploy', methods=['POST'])
def deploy():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    email = data.get('email')
    if not email:
        return jsonify({"error": "Missing required parameter: email"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Fetch plan_id, sub_id (subscription_id), region_id from VW_Deploy based on email
        cursor.execute("SELECT plan_id, sub_id, region_id FROM VW_Deploy WHERE email = ?", (email,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "No records found for the given email"}), 400

        plan_id = row.plan_id
        subscription_id = row.sub_id
        region_id = row.region_id

        # Query nodes for the given region
        cursor.execute("SELECT node_id, node_ip, node_ssh_port, node_region FROM TB_Nodes WHERE node_region = ?", (region_id,))
        nodes = cursor.fetchall()

        if not nodes:
            return jsonify({"error": "No nodes found for the given region"}), 400

        # Randomly select a node
        selected_node = random.choice(nodes)
        node_id = selected_node.node_id
        node_ip = selected_node.node_ip

        # Run the remote command
        output = run_remote_command(node_ip, plan_id, subscription_id, node_id)

        # Parse the output
        ip_addr, tcp_port, psswd = parse_output(output)

        # Perform database operations
        cursor.execute("INSERT INTO TB_SSH_Details (ip_addr, tcp_port, psswd) VALUES (?, ?, ?)",
                       (ip_addr, tcp_port, psswd))
        cursor.execute("UPDATE TB_Subscription SET status = 'Active' WHERE sub_id = ?", (subscription_id,))
        cursor.execute("SELECT customer_id FROM TB_Subscription WHERE sub_id = ?", (subscription_id,))
        row = cursor.fetchone()
        if not row:
            raise Exception("Subscription not found, cannot retrieve customer_id.")
        customer_id = row[0]

        timestamp = datetime.datetime.now()
        cursor.execute("INSERT INTO TB_User_Logs (event_type, customer_id, timestamp) VALUES (?, ?, ?)",
                       ("Got Instance", customer_id, timestamp))

        conn.commit()
        return jsonify({"message": "Deployment successful"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    # Run the Flask app
    app.run(host='0.0.0.0', port=9999, debug=True)
