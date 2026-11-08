import * as THREE from 'three';

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

// NEW: Orbital Trajectory Trail
const maxPoints = 150;
const positions = new Float32Array(maxPoints * 3);
const trailGeometry = new THREE.BufferGeometry();
trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const trailMaterial = new THREE.LineBasicMaterial({ color: 0x00ff66 });
const trail = new THREE.Line(trailGeometry, trailMaterial);
scene.add(trail);
let pointCount = 0;

window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

function animate() {
    requestAnimationFrame(animate);
    blackHole.rotation.y += 0.005;
    blackHole.rotation.x += 0.002; 
    renderer.render(scene, camera);
}
animate();

const logList = document.getElementById('audit-log-list');
const cryptoState = document.getElementById('crypto-state');
const qberValue = document.querySelector('#qber-meter span');
const driftValue = document.querySelector('#energy-metric span');

function logAudit(message, isAlert = false) {
    const li = document.createElement('li');
    li.textContent = `[${new Date().toISOString().split('T')[1].slice(0,-1)}] ${message}`;
    if (isAlert) li.style.color = 'var(--accent-alert)';
    logList.prepend(li);
    if (logList.children.length > 20) logList.lastChild.remove();
}

let isAlertState = false;
const ws = new WebSocket('ws://0.0.0.0:8766');

ws.onopen = () => {
    logAudit('WebSocket connected. Listening for CCSDS telemetry...');
    cryptoState.textContent = 'State: VERIFIED_FIPS_204';
    cryptoState.className = 'metric status-secure';
};

ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        
        // NEW: Update 3D Trajectory
        if (data.position && !isAlertState) {
            const [x, y, z] = data.position;
            for (let i = (maxPoints - 1) * 3; i >= 3; i--) {
                positions[i] = positions[i - 3];
            }
            positions[0] = x;
            positions[1] = y;
            positions[2] = z;
            pointCount = Math.min(pointCount + 1, maxPoints);
            trailGeometry.setDrawRange(0, pointCount);
            trailGeometry.attributes.position.needsUpdate = true;
        }

        if (data.qber !== undefined && !isAlertState) {
            qberValue.textContent = (data.qber * 100).toFixed(2) + '%';
        }
        
        // NEW: Update Energy Drift
        if (data.drift !== undefined && !isAlertState) {
            driftValue.textContent = data.drift.toFixed(8);
        }

    } catch (e) {
        console.error("Payload parsing error:", e);
    }
};

ws.onclose = () => logAudit('Connection to telemetry daemon lost.', true);

// NEW: Hardware-in-the-loop Interactions
document.getElementById('btn-qber').addEventListener('click', () => {
    if (isAlertState) return;
    isAlertState = true;
    logAudit('INJECT: Forcing QBER spike. Potential ISL eavesdropping detected...', true);
    qberValue.textContent = '14.82%';
    qberValue.style.color = 'var(--accent-alert)';
    cryptoState.textContent = 'State: RE-KEYING';
    cryptoState.className = 'metric status-alert';
    trailMaterial.color.setHex(0xff3333);
    
    setTimeout(() => {
        logAudit('RECOVERY: Ephemeral memory zeroized. PQC Link secured.');
        qberValue.style.color = '';
        cryptoState.textContent = 'State: VERIFIED_FIPS_204';
        cryptoState.className = 'metric status-secure';
        trailMaterial.color.setHex(0x00ff66);
        isAlertState = false;
    }, 4000);
});

document.getElementById('btn-biquad').addEventListener('click', () => {
    if (isAlertState) return;
    isAlertState = true;
    logAudit('INJECT: Biquad instability detected. Symplectic energy drifting...', true);
    driftValue.textContent = '1.04928177';
    driftValue.style.color = 'var(--accent-alert)';
    trailMaterial.color.setHex(0xffaa00);
    
    setTimeout(() => {
        logAudit('RECOVERY: Hamiltonian integrator stabilized.');
        driftValue.style.color = '';
        trailMaterial.color.setHex(0x00ff66);
        isAlertState = false;
    }, 4000);
});

document.getElementById('btn-downgrade').addEventListener('click', () => {
    logAudit('INJECT: Simulating cryptographic downgrade attack...', true);
});
