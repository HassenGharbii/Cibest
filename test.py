import subprocess
import platform
import ipaddress
import re
import time
from datetime import datetime

custom_names = {
    "10.136.115.96": "MDR6",
    "10.136.115.100": "Serveur IA"
}

def get_device_name(ip, index):
    ip_str = str(ip)
    if ip_str in custom_names:
        return custom_names[ip_str]
    else:
        return f"Camera {index}"

def ping_ip(ip):
    system = platform.system().lower()
    count_flag = '-n' if system == 'windows' else '-c'
    cmd = ['ping', count_flag, '1', str(ip)]

    try:
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=3)
        output = result.stdout

        # Debug: uncomment to see raw ping output for troubleshooting
        # print(f"DEBUG: Ping output for {ip}:\n{output}")

        reachable = result.returncode == 0
        rtt = None
        ttl = None

        if reachable:
            if system == 'windows':
                # Windows example: Reply from 8.8.8.8: bytes=32 time=14ms TTL=117
                rtt_match = re.search(r'time[=<]?\s*(\d+)\s*ms', output, re.IGNORECASE)
                ttl_match = re.search(r'ttl[=|:](\d+)', output, re.IGNORECASE)
            else:
                # Linux/macOS example: 64 bytes from 8.8.8.8: icmp_seq=1 ttl=117 time=14.2 ms
                rtt_match = re.search(r'time[=<]?\s*(\d+(?:\.\d+)?)\s*ms', output, re.IGNORECASE)
                ttl_match = re.search(r'ttl[=|:](\d+)', output, re.IGNORECASE)

            if rtt_match:
                rtt = float(rtt_match.group(1))
            if ttl_match:
                ttl = int(ttl_match.group(1))

        return {
            "ip": str(ip),
            "reachable": reachable,
            "rtt_ms": rtt,
            "ttl": ttl,
            "timestamp": datetime.now().isoformat(),
        }

    except subprocess.TimeoutExpired:
        return {
            "ip": str(ip),
            "reachable": False,
            "rtt_ms": None,
            "ttl": None,
            "timestamp": datetime.now().isoformat(),
            "error": "Timeout"
        }
    except Exception as e:
        return {
            "ip": str(ip),
            "reachable": False,
            "rtt_ms": None,
            "ttl": None,
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

def run_ping_cycle():
    start_ip = ipaddress.IPv4Address('10.136.115.60')
    end_ip = ipaddress.IPv4Address('10.136.115.75')

    results = []
    camera_index = 1

    print(f"\n📡 Starting new ping cycle at {datetime.now().isoformat()}\n")

    for ip_int in range(int(start_ip), int(end_ip) + 1):
        ip = ipaddress.IPv4Address(ip_int)
        device_name = get_device_name(ip, camera_index)
        result = ping_ip(ip)
        result["name"] = device_name
        if "error" not in result:
            result["error"] = None
        results.append(result)

        print(f"{result['timestamp']} | {result['ip']} - {device_name}: {'Reachable' if result['reachable'] else 'Unreachable'} | RTT: {result['rtt_ms']} ms | TTL: {result['ttl']}")
        camera_index += 1

    # Ping extra custom IPs outside the main range
    for extra_ip_str in custom_names:
        ip = ipaddress.IPv4Address(extra_ip_str)
        if start_ip <= ip <= end_ip:
            continue
        result = ping_ip(ip)
        result["name"] = custom_names[extra_ip_str]
        if "error" not in result:
            result["error"] = None
        results.append(result)

        print(f"{result['timestamp']} | {result['ip']} - {result['name']}: {'Reachable' if result['reachable'] else 'Unreachable'} | RTT: {result['rtt_ms']} ms | TTL: {result['ttl']}")

    return results

def main():
    try:
        while True:
            run_ping_cycle()
            print("⏳ Waiting 2 minutes...\n")
            time.sleep(120)  # Wait 2 minutes
    except KeyboardInterrupt:
        print("\n🛑 Stopped by user.")

if __name__ == "__main__":
    main()
