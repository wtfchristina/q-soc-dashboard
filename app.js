import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// --- THREE.JS ---
const container = document.getElementById('three-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 1.8, 0.4, 0.85);
bloomPass.threshold = 0.0;
bloomPass.strength = 2.0; 
bloomPass.radius = 0.8;
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

const geometry = new THREE.SphereGeometry(2, 32, 32);
const material = new THREE.MeshBasicMaterial({ color: 0x13383a, wireframe: true });
const blackHole = new THREE.Mesh(geometry, material);
scene.add(blackHole);

const maxPoints = 200;
const physPositions = new Float32Array(maxPoints * 3);
const physGeo = new THREE.BufferGeometry();
physGeo.setAttribute('position', new THREE.BufferAttribute(physPositions, 3));
const physMat = new THREE.LineBasicMaterial({ color: 0x26e680, linewidth: 2 });
const physTrail = new THREE.Line(physGeo, physMat);
scene.add(physTrail);

const pinnPositions = new Float32Array(maxPoints * 3);
const pinnGeo = new THREE.BufferGeometry();
pinnGeo.setAttribute('position', new THREE.BufferAttribute(pinnPositions, 3));
const pinnMat = new THREE.LineBasicMaterial({ color: 0x00bbff, linewidth: 2 });
const pinnTrail = new THREE.Line(pinnGeo, pinnMat);
scene.add(pinnTrail);

camera.position.z = 8.5;

function resizeThree() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    composer.setSize(container.clientWidth, container.clientHeight);
}
window.addEventListener('resize', resizeThree);

// --- SWARM NODES ---
const swarmGrid = document.getElementById('swarm-grid');
const nodes = [];
const nodeLabels = [];
for(let i=1; i<=6; i++) {
    const wrap = document.createElement('div');
    wrap.className = 'node-container';
    
    const topLabel = document.createElement('div');
    topLabel.className = 'node-label';
    topLabel.textContent = i <= 3 ? 'CONNECTED' : '';
    
    const el = document.createElement('div');
    el.className = 'node';
    el.textContent = `N-${i}`;
    
    const botLabel = document.createElement('div');
    botLabel.className = 'node-label';
    botLabel.textContent = i > 3 ? (i===4 ? 'CONNECTED' : 'ONLINE') : '';
    
    wrap.appendChild(topLabel);
    wrap.appendChild(el);
    wrap.appendChild(botLabel);
    swarmGrid.appendChild(wrap);
    nodes.push(el);
    nodeLabels.push({top: topLabel, bot: botLabel});
}

// --- CANVAS HELPERS ---
function setupCanvas(id) {
    const cvs = document.getElementById(id);
    cvs.width = cvs.parentElement.clientWidth;
    cvs.height = cvs.parentElement.clientHeight;
    return cvs.getContext('2d');
}

// Radar Chart
const radarCtx = setupCanvas('radar-canvas');
let radarPulse = 0;
function drawRadar() {
    radarCtx.clearRect(0, 0, radarCtx.canvas.width, radarCtx.canvas.height);
    const cx = radarCtx.canvas.width / 2;
    const cy = radarCtx.canvas.height / 2;
    const r = Math.min(cx, cy) - 5;
    
    // Grid
    radarCtx.strokeStyle = 'rgba(26,211,220,0.3)';
    radarCtx.beginPath();
    for(let i=0; i<5; i++) {
        const a = (i * 2 * Math.PI / 5) - Math.PI/2;
        radarCtx.moveTo(cx, cy);
        radarCtx.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r);
    }
    radarCtx.stroke();
    
    radarPulse += 0.05;
    const pulseR = r * (0.6 + Math.sin(radarPulse)*0.1);
    
    radarCtx.fillStyle = 'rgba(26,211,220,0.2)';
    radarCtx.strokeStyle = '#1ad3dc';
    radarCtx.beginPath();
    for(let i=0; i<5; i++) {
        const a = (i * 2 * Math.PI / 5) - Math.PI/2;
        const dist = i % 2 === 0 ? pulseR : pulseR * 0.7;
        const px = cx + Math.cos(a)*dist;
        const py = cy + Math.sin(a)*dist;
        if(i===0) radarCtx.moveTo(px, py); else radarCtx.lineTo(px, py);
    }
    radarCtx.closePath();
    radarCtx.fill();
    radarCtx.stroke();
}

// Audit Graphs
const auditCtx = setupCanvas('audit-graph-canvas');
let auditOffset = 0;
function drawAuditGraphs() {
    auditCtx.clearRect(0, 0, auditCtx.canvas.width, auditCtx.canvas.height);
    auditCtx.strokeStyle = '#39ff96';
    auditCtx.lineWidth = 1.5;
    auditOffset += 0.1;
    
    for(let g=0; g<3; g++) {
        const yBase = (g * 30) + 15;
        auditCtx.beginPath();
        for(let x=0; x<auditCtx.canvas.width; x+=2) {
            const y = yBase + Math.sin((x*0.1) + auditOffset + g) * 5;
            if(x===0) auditCtx.moveTo(x, y); else auditCtx.lineTo(x, y);
        }
        auditCtx.stroke();
    }
}

// BCI Wave & Mini Charts
const eegCtx = setupCanvas('eeg-canvas');
const stressCtx = setupCanvas('stress-canvas');
const freqCtx = setupCanvas('freq-canvas');
const driftCtx = setupCanvas('drift-canvas');
let time = 0;

function drawLineChart(ctx, color, data, fill=false) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for(let i=0; i<data.length; i++) {
        const x = (i / (data.length - 1)) * ctx.canvas.width;
        const y = ctx.canvas.height - (data[i] * ctx.canvas.height);
        if(i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    if(fill) {
        ctx.lineTo(ctx.canvas.width, ctx.canvas.height);
        ctx.lineTo(0, ctx.canvas.height);
        ctx.fillStyle = color.replace(')', ', 0.2)').replace('rgb', 'rgba');
        if(color.startsWith('#')) ctx.fillStyle = color + '33';
        ctx.fill();
    }
}

// Dials
const gaugeCtx = setupCanvas('gauges-canvas');
let targetErr = 0.2;
let currErr = 0.2;
function drawDials() {
    gaugeCtx.clearRect(0, 0, gaugeCtx.canvas.width, gaugeCtx.canvas.height);
    const w = gaugeCtx.canvas.width / 3;
    const h = gaugeCtx.canvas.height;
    
    currErr += (targetErr - currErr) * 0.1;
    const vals = [0.7, 0.4, currErr]; // Beta, Gamma, Error
    const labels = ["BETA", "GAMMA", "INVARIANT ERROR"];
    
    gaugeCtx.textAlign = 'center';
    gaugeCtx.font = '10px monospace';
    
    for(let i=0; i<3; i++) {
        const cx = (w * i) + (w/2);
        const cy = h - 20;
        const r = 30;
        
        // Track
        gaugeCtx.beginPath();
        gaugeCtx.arc(cx, cy, r, Math.PI, 0);
        gaugeCtx.strokeStyle = '#1a4f54';
        gaugeCtx.lineWidth = 4;
        gaugeCtx.stroke();
        
        // Fill
        gaugeCtx.beginPath();
        gaugeCtx.arc(cx, cy, r, Math.PI, Math.PI + (vals[i] * Math.PI));
        gaugeCtx.strokeStyle = i===2 && currErr > 0.6 ? '#ff5252' : '#1ad3dc';
        gaugeCtx.stroke();
        
        // Label
        gaugeCtx.fillStyle = '#fff';
        gaugeCtx.fillText(labels[i], cx, h - 5);
    }
}

let bciStress = 0.2;
let eegData = Array(50).fill(0.5);
let stressData = Array(50).fill(0.2);
let freqData = Array(50).fill(0.5);
let driftData = Array(50).fill(0.5);
let pointCountClient = 0;

function animateAll() {
    requestAnimationFrame(animateAll);
    time += 0.05;
    
    blackHole.rotation.y += 0.003; 
    blackHole.rotation.x += 0.0015;
    composer.render();
    
    drawRadar();
    drawAuditGraphs();
    
    // Update data arrays
    eegData.shift(); eegData.push(0.5 + Math.sin(time*3)*0.2 * (1+bciStress*2) + (Math.random()-0.5)*0.1);
    stressData.shift(); stressData.push(bciStress + (Math.random()-0.5)*0.05);
    freqData.shift(); freqData.push(0.5 + Math.cos(time*2)*0.3 + (Math.random()-0.5)*0.2);
    driftData.shift(); driftData.push(0.5 + Math.sin(time)*0.3 * (currErr*2));
    
    drawLineChart(eegCtx, bciStress > 0.6 ? '#ff5252' : '#39ff96', eegData);
    drawLineChart(stressCtx, '#00d0ff', stressData, true);
    drawLineChart(freqCtx, '#1ad3dc', freqData);
    drawLineChart(driftCtx, '#1ad3dc', driftData);
    
    drawDials();
}
window.addEventListener('resize', () => {
    [eegCtx, stressCtx, freqCtx, driftCtx, gaugeCtx, radarCtx, auditCtx].forEach(c => {
        c.canvas.width = c.canvas.parentElement.clientWidth;
        c.canvas.height = c.canvas.parentElement.clientHeight;
    });
});
animateAll();

// --- WEBSOCKET & LOGIC ---
const ws = new WebSocket('wss://q-soc-daemon.onrender.com');
let isAlertState = false;

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
            pointCountClient = Math.min(pointCountClient + 1, maxPoints);
            physGeo.setDrawRange(0, pointCountClient); pinnGeo.setDrawRange(0, pointCountClient);
            physGeo.attributes.position.needsUpdate = true; pinnGeo.attributes.position.needsUpdate = true;
        }
        if (data.bci_stress !== undefined) bciStress += (data.bci_stress - bciStress) * 0.1;
    } catch(e) {}
};

document.getElementById('btn-qber').addEventListener('click', () => {
    if(isAlertState) return; isAlertState = true;
    bciStress = 0.95;
    document.getElementById('crypto-state').textContent = 'RE-KEYING';
    document.getElementById('crypto-state').className = 'metric status-alert';
    physMat.color.setHex(0xff5252); pinnMat.color.setHex(0xff5252);
    setTimeout(() => {
        bciStress = 0.2;
        document.getElementById('crypto-state').textContent = 'SECURE';
        document.getElementById('crypto-state').className = 'metric status-secure';
        physMat.color.setHex(0x39ff96); pinnMat.color.setHex(0x00d0ff);
        isAlertState = false;
    }, 4000);
});

document.getElementById('btn-biquad').addEventListener('click', () => {
    if(isAlertState) return; isAlertState = true;
    nodes[3].className = 'node compromised';
    nodeLabels[3].top.textContent = 'FAULT'; nodeLabels[3].top.className = 'node-label compromised';
    nodeLabels[3].bot.textContent = '';
    setTimeout(() => {
        nodes[3].className = 'node';
        nodeLabels[3].top.textContent = ''; nodeLabels[3].top.className = 'node-label';
        nodeLabels[3].bot.textContent = 'ONLINE';
        isAlertState = false;
    }, 3000);
});

document.getElementById('btn-perturb').addEventListener('click', () => {
    if(isAlertState) return; isAlertState = true;
    ws.send(JSON.stringify({ command: 'perturb_pinn' }));
    targetErr = 0.9;
    setTimeout(() => { targetErr = 0.2; isAlertState = false; }, 4000);
});
