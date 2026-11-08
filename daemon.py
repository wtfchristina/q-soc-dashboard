import asyncio
import websockets
import json
import math
import random

clients = set()
is_perturbed = False

async def telemetry_stream(websocket):
    global is_perturbed
    clients.add(websocket)
    print("Dashboard connected.")
    t = 0
    try:
        while True:
            # Physics Ground Truth
            x = 4 * math.cos(t)
            y = 1.5 * math.sin(t * 0.5)
            z = 4 * math.sin(t)
            
            # PINN Prediction (Drifts if perturbed)
            noise = random.uniform(-0.5, 0.5) if is_perturbed else random.uniform(-0.05, 0.05)
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
            t += 0.05
            
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
    async with websockets.serve(handler, "0.0.0.0", 8766):
        print("Backend running on ws://0.0.0.0:8766...")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
