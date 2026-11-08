import * as THREE from 'three';
// NEW: Import Post-Processing Addons
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// 1. Three.js Setup (Physics vs PINN)
const container = document.getElementById('three-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// NEW: Post-Processing Engine for Cinematic Glow
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.0;
bloomPass.strength = 2.5; // High intensity neon glow
bloomPass.radius = 0.8;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// Black Hole wireframe & accent orbital shell
const geometry = new THREE.SphereGeometry(2, 32, 32);
const material = new THREE.MeshBasicMaterial({ color: 0x13383a, wireframe: true });
const blackHole = new THREE.Mesh(geometry, material);
scene.add(blackHole);

// Faint external grid accent
const outerGeo = new THREE.SphereGeometry(2.05, 16, 16);
const outerMat = new THREE.MeshBasicMaterial({ color: 0x0fa2a9, wireframe: true, transparent: true, opacity: 0.15 });
const outerShell = new THREE.Mesh(outerGeo, outerMat);
scene.add(outerShell);

camera.position.z = 8.5;

// Trajectory 1: Ground Truth Physics (Green)
const maxPoints = 200;
const physPositions = new Float32Array(maxPoints * 3);
const physGeo = new THREE.BufferGeometry();
physGeo.setAttribute('position', new THREE.BufferAttribute(physPositions, 3));
const physMat = new THREE.LineBasicMaterial({ color: 0x26e680, linewidth: 2 });
const physTrail = new THREE.Line(physGeo, physMat);
scene.add(physTrail);

// Trajectory 2: PINN Prediction (Blue)
const pinnPositions = new Float32Array(maxPoints * 3);
const pinnGeo = new THREE.BufferGeometry();
pinnGeo.setAttribute('position', new THREE.BufferAttribute(pinnPositions, 3));
const pinnMat = new THREE.LineBasicMaterial({ color: 0x00bbff, linewidth: 2 });
const pinnTrail = new THREE.Line(pinnGeo, pinnMat);
scene.add(pinnTrail);

let pointCount = 0;

window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    composer.setSize(container.clientWidth, container.clientHeight);
});

function animate() {
    requestAnimationFrame(animate);
    blackHole.rotation.y += 0.003; 
    blackHole.rotation.x += 0.0015;
    outerShell.rotation.y -= 0.001;
    // Render through the composer to trigger the Bloom Effect
    composer.render();
}
animate();

// 2. Swarm Node Setup
const swarmGrid = document.getElementById('swarm-grid');
const nodes = [];
for(let i=1; i<=6; i++) {
    const el = document.createElement('div');
    el.className = 'node';
    el.innerHTML = `N-${i} <div class="node-label">ONLINE</div>`;
    swarmGrid.appendChild(el);
    nodes.push(el);
}

// 3. EEG BCI Simulation
const eegCanvas = document.getElementById('eeg-canvas');
const eegCtx = eegCanvas.getContext('2d');
eegCanvas.width = eegCanvas.parentElement.clientWidth;
eegCanvas.height = 80;

let eegData = Array(100).fill(40);
let bciTargetStress = 0.2;
let bciStress = 0.2;

function animateEEG() {
    requestAnimationFrame(animateEEG);
    eegCtx.clearRect(0, 0, eegCanvas.width, eegCanvas.height);
    
    bciStress += (bciTargetStress - bciStress) * 0.1;
    
    eegCtx.strokeStyle = 'rgba(26,211,220,0.15)';
    eegCtx.lineWidth = 1;
    for (let x = 0; x < eegCanvas.width; x += 20) {
        eegCtx.beginPath(); eegCtx.moveTo(x, 0); eegCtx.lineTo(x, eegCanvas.height); eegCtx.stroke();
    }
    for (let y = 0; y < eegCanvas.height; y += 20) {
        eegCtx.beginPath(); eegCtx.moveTo(0, y); eegCtx.lineTo(eegCanvas.width, y); eegCtx.stroke();
    }

    eegData.shift();
    const noiseAmp = 8 + (bciStress * 20);
    const frequencyFactor = 0.15 + (bciStress * 0.5);
    const newVal = 40 + Math.sin(Date.now() * frequencyFactor) * noiseAmp + (Math.random() - 0.5) * 8;
    eegData.push(newVal);

    eegCtx.beginPath();
    eegCtx.lineWidth = 2;
    eegCtx.strokeStyle = bciStress > 0.6 ? '#ff5252' : '#39ff96';
    for(let i = 0; i < eegData.length; i++) {
        const x = (i / (eegData.length - 1)) * eegCanvas.width;
        if(i === 0) eegCtx.moveTo(x, eegData[i]);
        else eegCtx.lineTo(x, eegData[i]);
    }
    eegCtx.stroke();
}
animateEEG();

// 4. Energy Drift Invariant Simulation
const driftCanvas = document.getElementById('drift-canvas');
const driftCtx = driftCanvas.getContext('2d');
driftCanvas.width = driftCanvas.parentElement.clientWidth;
driftCanvas.height = 70;

let driftData = Array(120).fill(35);
let driftAmplitudeTarget = 1;
let driftAmplitude = 1;

function animateDrift() {
    requestAnimationFrame(animateDrift);
    driftCtx.clearRect(0, 0, driftCanvas.width, driftCanvas.height);
    
    driftAmplitude += (driftAmplitudeTarget - driftAmplitude) * 0.05;

    driftCtx.strokeStyle = 'rgba(26,211,220,0.15)';
    driftCtx.lineWidth = 1;
    for (let x = 0; x < driftCanvas.width; x += 20) {
        driftCtx.beginPath(); driftCtx.moveTo(x, 0); driftCtx.lineTo(x, driftCanvas.height); driftCtx.stroke();
    }

    driftData.shift();
    const newVal = 35 + Math.sin(Date.now() * 0.005) * (8 * driftAmplitude) + Math.cos(Date.now() * 0.01) * (3 * driftAmplitude);
    driftData.push(newVal);

    driftCtx.beginPath();
    driftCtx.lineWidth = 2;
    driftCtx.strokeStyle = driftAmplitude > 3 ? '#ffc436' : '#1ad3dc';
    for(let i = 0; i < driftData.length; i++) {
        const x = (i / (driftData.length - 1)) * driftCanvas.width;
        if(i === 0) driftCtx.moveTo(x, driftData[i]);
        else driftCtx.lineTo(x, driftData[i]);
    }
    driftCtx.stroke();
}
animateDrift();

// 5. WebSocket Data Pipeline & Security Events
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

const ws = new WebSocket('wss://q-soc-daemon.onrender.com'); 

let isAlertState = false;

ws.onopen = () => { logAudit('WS Connected. Multi-modal telemetry nominal.', 'secure'); };

ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        if (isAlertState) return;

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

        if (data.bci_stress !== undefined) {
            bciTargetStress = data.bci_stress;
            const stressPct = bciStress * 100;
            bciBar.style.width = `${stressPct}%`;
            bciBar.style.background = stressPct > 70 ? 'var(--accent-alert)' : 'var(--accent-secure)';
        }

        document.querySelector('#qber-meter span').textContent = (data.qber * 100).toFixed(2) + '%';
        document.querySelector('#energy-metric span').textContent = data.drift.toFixed(8);

    } catch (e) { console.error(e); }
};

document.getElementById('btn-qber').addEventListener('click', () => {
    if (isAlertState) return; isAlertState = true;
    logAudit('QBER SPIKE: Eavesdropping attempt on ISL.', 'alert');
    bciTargetStress = 0.95;
    bciBar.style.width = '95%'; bciBar.style.background = 'var(--accent-alert)';
    bciStatus.textContent = 'HIGH LOAD'; bciStatus.className = 'status-alert';
    cryptoState.textContent = 'RE-KEYING PQC'; cryptoState.className = 'metric status-alert';
    physMat.color.setHex(0xff5252); pinnMat.color.setHex(0xff5252);
    
    setTimeout(() => {
        logAudit('RECOVERY: PQC key regenerated. Pilot stress normalizing.', 'secure');
        bciTargetStress = 0.2;
        bciStatus.textContent = 'NOMINAL'; bciStatus.className = 'status-secure';
        cryptoState.textContent = 'SECURE'; cryptoState.className = 'metric status-secure';
        physMat.color.setHex(0x39ff96); pinnMat.color.setHex(0x00d0ff);
        isAlertState = false;
    }, 4000);
});

document.getElementById('btn-biquad').addEventListener('click', () => {
    if (isAlertState) return; isAlertState = true;
    logAudit('SWARM FAULT: Node-4 broadcasting Byzantine errors.', 'warn');
    nodes[3].className = 'node compromised';
    nodes[3].innerHTML = `N-4 <div class="node-label">FAULT</div>`;
    
    setTimeout(() => {
        logAudit('CONSENSUS: Node-4 isolated from Swarm.', 'secure');
        nodes[3].className = 'node isolated';
        nodes[3].innerHTML = `N-4 <div class="node-label">ISOLATED</div>`;
        setTimeout(() => {
            logAudit('RECOVERY: Node-4 re-authenticated.', 'secure');
            nodes[3].className = 'node';
            nodes[3].innerHTML = `N-4 <div class="node-label">ONLINE</div>`;
            isAlertState = false;
        }, 2000);
    }, 2000);
});

document.getElementById('btn-perturb').addEventListener('click', () => {
    if (isAlertState) return; isAlertState = true;
    logAudit('PHYSICS PERTURBATION: Gravity well anomaly detected.', 'warn');
    ws.send(JSON.stringify({ command: 'perturb_pinn' }));
    driftAmplitudeTarget = 5;
    
    setTimeout(() => {
        logAudit('PINN: Machine learning model converging to ground truth.', 'secure');
        driftAmplitudeTarget = 1;
        isAlertState = false;
    }, 4000);
});
