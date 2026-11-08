import * as THREE from 'three';

// 1. Three.js Setup (Physics vs PINN)
const container = document.getElementById('three-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const geometry = new THREE.SphereGeometry(2, 32, 32);
const material = new THREE.MeshBasicMaterial({ color: 0x222222, wireframe: true });
const blackHole = new THREE.Mesh(geometry, material);
scene.add(blackHole);
camera.position.z = 10;

// Trajectory 1: Ground Truth Physics (Green)
const maxPoints = 150;
const physPositions = new Float32Array(maxPoints * 3);
const physGeo = new THREE.BufferGeometry();
physGeo.setAttribute('position', new THREE.BufferAttribute(physPositions, 3));
const physMat = new THREE.LineBasicMaterial({ color: 0x00ff66 });
const physTrail = new THREE.Line(physGeo, physMat);
scene.add(physTrail);

// Trajectory 2: PINN Prediction (Blue)
const pinnPositions = new Float32Array(maxPoints * 3);
const pinnGeo = new THREE.BufferGeometry();
pinnGeo.setAttribute('position', new THREE.BufferAttribute(pinnPositions, 3));
const pinnMat = new THREE.LineBasicMaterial({ color: 0x00bbff });
const pinnTrail = new THREE.Line(pinnGeo, pinnMat);
scene.add(pinnTrail);

let pointCount = 0;

window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

function animate() {
    requestAnimationFrame(animate);
    blackHole.rotation.y += 0.005; blackHole.rotation.x += 0.002;
    renderer.render(scene, camera);
}
animate();

// 2. Swarm Node Setup
const swarmGrid = document.getElementById('swarm-grid');
const nodes = [];
for(let i=1; i<=6; i++) {
    const el = document.createElement('div');
    el.className = 'node';
    el.textContent = `N-${i}`;
    swarmGrid.appendChild(el);
    nodes.push(el);
}

// 3. WebSocket Data Pipeline
const logList = document.getElementById('audit-log-list');
const cryptoState = document.getElementById('crypto-state');
const bciBar = document.getElementById('bci-stress-bar');
const bciStatus = document.getElementById('bci-status');

function logAudit(msg, color = '') {
    const li = document.createElement('li');
    li.textContent = `[${new Date().toISOString().split('T')[1].slice(0,-1)}] ${msg}`;
    if (color) li.style.color = `var(--accent-${color})`;
    logList.prepend(li);
    if (logList.children.length > 20) logList.lastChild.remove();
}

// Option B Cloud Prep: This URL will become an environment variable during deployment.
const ws = new WebSocket('ws://0.0.0.0:8766'); 

let isAlertState = false;

ws.onopen = () => { logAudit('WS Connected. Multi-modal telemetry nominal.', 'secure'); };

ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        if (isAlertState) return;

        // Update 3D Orbits
        if (data.phys_pos && data.pinn_pos) {
            for (let i = (maxPoints - 1) * 3; i >= 3; i--) {
                physPositions[i] = physPositions[i - 3];
                pinnPositions[i] = pinnPositions[i - 3];
            }
            physPositions[0] = data.phys_pos[0]; physPositions[1] = data.phys_pos[1]; physPositions[2] = data.phys_pos[2];
            pinnPositions[0] = data.pinn_pos[0]; pinnPositions[1] = data.pinn_pos[1]; pinnPositions[2] = data.pinn_pos[2];
            pointCount = Math.min(pointCount + 1, maxPoints);
            physGeo.setDrawRange(0, pointCount); pinnGeo.setDrawRange(0, pointCount);
            physGeo.attributes.position.needsUpdate = true; pinnGeo.attributes.position.needsUpdate = true;
        }

        // Update BCI
        if (data.bci_stress !== undefined) {
            const stressPct = data.bci_stress * 100;
            bciBar.style.width = `${stressPct}%`;
            bciBar.style.background = stressPct > 70 ? 'var(--accent-alert)' : 'var(--accent-secure)';
        }

        document.querySelector('#qber-meter span').textContent = (data.qber * 100).toFixed(2) + '%';
        document.querySelector('#energy-metric span').textContent = data.drift.toFixed(8);

    } catch (e) { console.error(e); }
};

// 4. Fault Injections
document.getElementById('btn-qber').addEventListener('click', () => {
    if (isAlertState) return; isAlertState = true;
    logAudit('QBER SPIKE: Eavesdropping attempt on ISL.', 'alert');
    bciBar.style.width = '95%'; bciBar.style.background = 'var(--accent-alert)';
    bciStatus.textContent = 'Status: HIGH COGNITIVE LOAD'; bciStatus.className = 'metric status-alert';
    cryptoState.textContent = 'State: RE-KEYING PQC'; cryptoState.className = 'metric status-alert';
    physMat.color.setHex(0xff3333); pinnMat.color.setHex(0xff3333);
    
    setTimeout(() => {
        logAudit('RECOVERY: PQC key regenerated. Pilot stress normalizing.', 'secure');
        bciStatus.textContent = 'Status: NOMINAL'; bciStatus.className = 'metric status-secure';
        cryptoState.textContent = 'State: SECURE'; cryptoState.className = 'metric status-secure';
        physMat.color.setHex(0x00ff66); pinnMat.color.setHex(0x00bbff);
        isAlertState = false;
    }, 4000);
});

document.getElementById('btn-biquad').addEventListener('click', () => {
    if (isAlertState) return; isAlertState = true;
    logAudit('SWARM FAULT: Node-4 broadcasting Byzantine errors.', 'warn');
    nodes[3].className = 'node compromised';
    
    setTimeout(() => {
        logAudit('CONSENSUS: Node-4 isolated from Swarm.', 'secure');
        nodes[3].className = 'node isolated';
        setTimeout(() => {
            logAudit('RECOVERY: Node-4 re-authenticated.', 'secure');
            nodes[3].className = 'node';
            isAlertState = false;
        }, 2000);
    }, 2000);
});

document.getElementById('btn-perturb').addEventListener('click', () => {
    if (isAlertState) return; isAlertState = true;
    logAudit('PHYSICS PERTURBATION: Gravity well anomaly detected.', 'warn');
    ws.send(JSON.stringify({ command: 'perturb_pinn' })); // Tells backend to simulate PINN drift
    
    setTimeout(() => {
        logAudit('PINN: Machine learning model converging to ground truth.', 'secure');
        isAlertState = false;
    }, 3000);
});
