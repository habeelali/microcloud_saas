import os
import subprocess
import re
import pyodbc
import json
import logging
from flask import Flask, jsonify
from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv
from datetime import datetime
import signal

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Flask application setup
app = Flask(__name__)

# Database credentials from .env
DB_SERVER = os.getenv('DB_SERVER')
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_DATABASE = os.getenv('DB_DATABASE')

# MS SQL connection string
conn_string = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={DB_SERVER};DATABASE={DB_DATABASE};UID={DB_USER};PWD={DB_PASSWORD}'

# Function to convert memory units to MiB
def convert_to_mib(mem_string):
    """Converts memory usage strings to MiB."""
    unit_multipliers = {"KiB": 1 / 1024, "MiB": 1, "GiB": 1024}
    match = re.match(r"([\d.]+)([KMGT]i?B)", mem_string.strip())
    if match:
        value, unit = match.groups()
        multiplier = unit_multipliers.get(unit, 1)
        return float(value) * multiplier
    return 0.0

# Function to parse docker stats output and insert into database
def process_and_push_metrics():
    try:
        logger.debug("Starting process_and_push_metrics")
        # Run the 'docker stats' command with JSON output
        result = subprocess.run(
            ['docker', 'stats', '--no-stream', '--format', '{{json .}}'],
            capture_output=True,
            text=True,
            check=True
        )
        logger.debug("Docker stats command executed")

        # Split the output into lines (one JSON object per line)
        lines = result.stdout.strip().split('\n')
        logger.debug(f"Docker stats output lines: {lines}")

        with pyodbc.connect(conn_string) as conn:
            cursor = conn.cursor()
            for line in lines:
                if not line.strip():
                    continue  # Skip empty lines

                logger.debug(f"Processing line: {line}")

                # Parse the JSON line
                data = json.loads(line)

                # Extract fields
                container_id = data['Container']
                cpu_percent = float(data['CPUPerc'].strip('%'))

                # Parse and convert memory usage
                mem_usage_raw = data['MemUsage'].split('/')[0].strip()
                mem_usage = convert_to_mib(mem_usage_raw)
                mem_percent = float(data['MemPerc'].strip('%'))

                net_io = data['NetIO']
                block_io = data['BlockIO']
                pids = int(data['PIDs'])

                # Check if container_id exists in TB_Instances table
                cursor.execute("SELECT COUNT(1) FROM TB_Instances WHERE container_id LIKE ?", (container_id + '%',))
                if cursor.fetchone()[0] > 0:
                    # Insert data into TB_Instance_Metrics table
                    cursor.execute("""
                        INSERT INTO TB_Instance_Metrics (container_id, cpu_percent, mem_usage, mem_percent, net_io, block_io, pids)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, container_id, cpu_percent, mem_usage, mem_percent, net_io, block_io, pids)

            conn.commit()
    except Exception as e:
        logger.error(f"Error in process_and_push_metrics: {e}", exc_info=True)

# Initialize the scheduler (don't start it yet)
scheduler = BackgroundScheduler()

# Define a function to start the scheduler
def start_scheduler():
    scheduler.add_job(process_and_push_metrics, 'interval', seconds=5)
    scheduler.start()
    logger.info("Scheduler started")

# Flask route
@app.route('/metrics', methods=['GET'])
def get_metrics_status():
    return jsonify({"status": "Metrics are being collected and pushed to the database."})

if __name__ == "__main__":
    # Only start the scheduler in the main process
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
        start_scheduler()
    app.run(debug=True)
