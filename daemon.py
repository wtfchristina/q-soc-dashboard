import asyncio
import websockets
import json
import random
import urllib.request
from datetime import datetime, timedelta

clients = set()
is_perturbed = False
orbital_data = []

def fetch_jwst_ephemeris():
    print("Fetching live JWST ephemeris from JPL Horizons...")
    start = datetime.utcnow().strftime("%Y-%m-%d")
    end = (datetime.utcnow() + timedelta(days=30)).strftime("%Y-%m-%d")
    
    # Query JWST (-170) relative to Earth (@399) in 1-hour steps
    url = f"https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='-170'&OBJ_DATA='NO'&MAKE_EPHEM='YES'&EPHEM_TYPE='VECTORS'&CENTER='@399'&START_TIME='{start}'&STOP_TIME='{end}'&STEP_SIZE='1 h'&CSV_FORMAT='YES'"
    
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        
    result = data.get("result", "")
    lines = result.split("\n")
    in_data = False
    coords = []
    
    for line in lines:
        if "$$EOE" in line:
            break
        if in_data:
            parts = line.split(",")
            if len(parts) >= 5:
                # JPL returns X, Y, Z in km. JWST is ~1.5 million km away. 
                # We divide by 200,000 to scale it down to ~7.5 Three.js units.
                scale = 200000.0
                x = float(parts[2]) / scale
                y = float(parts[3]) / scale
                z = float(parts[4]) / scale
                coords.append([x, y, z])
        if "$$SOE" in line:
            in_data = True
            
    print(f"Loaded {len(coords)} real orbital data points from JPL.")
    return coords

async def telemetry_stream(websocket):
    global is_perturbed
    clients.add(websocket)
    print("Dashboard connected.")
    
    index = 0
    try:
        while True:
            if not orbital_data:
                await asyncio.sleep(1)
                continue
                
            # Get real JPL coordinates
            x, y, z = orbital_data[index]
            
            # Loop the 30-day trajectory
            index = (index + 1) % len(orbital_data)
            
            # PINN Prediction (Drifts if perturbed)
            noise = random.uniform(-0.5, 0.5) if is_perturbed else random.uniform(-0.02, 0.02)
            px = x + noise
            py = y + noise
            pz = z + noise

            # BCI Stress (Base 20%, spikes if perturbed)
            bci = 0.85 if is_perturbed else 0.2 + random.uniform(-0.05, 0.05)
            
            payload = {
                "phys_pos": [x, y, z],
                "pinn_pos": [px, py, pz],
                "qber": 0.01 + random.uniform(-0.002, 0.002),
                "drift": 1.00000000 + random.uniform(-0.0000001, 0.0000001),
                "bci_stress": bci
            }
            
            await websocket.send(json.dumps(payload))
            
            if is_perturbed and random.random() > 0.95:
                is_perturbed = False # Auto-recover
                
            await asyncio.sleep(0.05)
    except websockets.exceptions.ConnectionClosed:
        clients.remove(websocket)

async def handle_commands(websocket):
    global is_perturbed
    try:
        async for message in websocket:
            data = json.loads(message)
            if data.get("command") == "perturb_pinn":
                is_perturbed = True
    except websockets.exceptions.ConnectionClosed:
        pass

async def handler(websocket):
    stream_task = asyncio.create_task(telemetry_stream(websocket))
    command_task = asyncio.create_task(handle_commands(websocket))
    await asyncio.gather(stream_task, command_task)

async def main():
    global orbital_data
    try:
        orbital_data = fetch_jwst_ephemeris()
    except Exception as e:
        print(f"JPL API Error: {e}")
        # Fallback math if JPL is down
        orbital_data = [[4 * math.cos(t/10), 1.5 * math.sin(t/20), 4 * math.sin(t/10)] for t in range(720)]
        
    async with websockets.serve(handler, "0.0.0.0", 8766):
        print("Backend running on ws://0.0.0.0:8766...")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
