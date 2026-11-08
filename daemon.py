import asyncio
import websockets
import json
import math
import time
import random

async def telemetry_stream(websocket):
    print("SOC Dashboard connected. Streaming PQC telemetry...")
    t = 0
    try:
        while True:
            # Simulate a 3D orbit around the Kerr black hole
            x = 4 * math.cos(t)
            y = 1.5 * math.sin(t * 0.5)
            z = 4 * math.sin(t)
            
            # Simulate baseline metrics
            qber = 0.01 + random.uniform(-0.002, 0.002)
            drift = 1.00000000 + random.uniform(-0.0000001, 0.0000001)

            payload = {
                "position": [x, y, z],
                "qber": qber,
                "drift": drift
            }
            
            await websocket.send(json.dumps(payload))
            t += 0.05
            await asyncio.sleep(0.05) # 20Hz update rate
    except websockets.exceptions.ConnectionClosed:
        print("SOC Dashboard disconnected.")

async def main():
    async with websockets.serve(telemetry_stream, "0.0.0.0", 8766):
        print("Telemetry Daemon running on ws://0.0.0.0:8766...")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
