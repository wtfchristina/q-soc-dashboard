# Zero-Trust Spacetime Audit Dashboard

A live, full-stack WebGL command center built to monitor spacecraft telemetry, visualize non-linear orbital dynamics, and audit post-quantum cryptographic (PQC) link security in real-time.

Currently configured to ingest live ephemeris data for the James Webb Space Telescope (JWST) via the JPL Horizons API.

## Core Architecture
* **Frontend:** Three.js / WebGL rendering dual-trace trajectories (Ground Truth Physics vs. Physics-Informed Neural Network predictions).
* **Backend:** Python (asyncio/websockets) streaming 20Hz telemetry, querying the NASA/JPL Horizons REST API for real-world orbital state vectors.
* **Network:** Zero-latency WebSocket secure (`wss://`) pipeline simulating an active Security Operations Center (SOC).

## Simulated Telemetry & Fault Injection
The dashboard includes Hardware-in-the-Loop (HIL) fault injection toggles to demonstrate automated invariant verification:
1. **QBER Eavesdropping:** Simulates a Quantum Key Distribution (QKD) downgrade attack. The system flags the link, registers a spike in the pilot's BCI cognitive load, and forces ephemeral memory zeroization to re-key via FIPS 204.
2. **Swarm Consensus Fault:** Injects Byzantine errors into a 6-node Aegis-Swarm topology. The corrupted node is visually isolated until consensus re-authenticates it.
3. **Gravity Perturbation:** Forces the blue PINN trajectory to drift from the green Hamiltonian physics trajectory before the machine learning model mathematically converges back to ground truth.

## Live Demo
**Dashboard:** https://q-soc-dashboard-m9bd7a617-oohgirlimtelling-9195.vercel.app/
