import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

let scene, camera, renderer, controls;
let particles = [];
let attractorPoints = [];
let isAttractorMode = false;
let targetPositions = []; // Rastgele hedef pozisyonlar
let particleVelocities = []; // Partiküllerin hızları
const transitionSpeed = 0.05; // Geçiş hızı
const randomMovementSpeed = 0.1; // Rastgele hareket hızı

const sigma = 10, rho = 28, beta = 8 / 3;
const dt = 0.01;
const numSteps = 5000;

let isDarkMode = true; 

const modeToggle = document.getElementById("mode-toggle");
const modeIndicator = document.getElementById("mode-indicator");

// Yuvarlak şekli güncelle
function updateIndicator() {
  if (isDarkMode) {
    modeIndicator.classList.add("active");
  } else {
    modeIndicator.classList.remove("active");
  }
}


// Buton ve yuvarlak şekle tıklama olayı ekle
modeToggle.addEventListener("click", toggleTheme);
modeIndicator.addEventListener("click", toggleTheme);


init();
animate();

document.addEventListener('click', toggleMode);
document.getElementById('mode-toggle').addEventListener('click', toggleTheme);

function init() {
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 50);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    controls = new OrbitControls(camera, renderer.domElement);
    
    generateRandomParticles();
    generateLorenzAttractor();
    
    window.addEventListener('resize', onWindowResize);
    updateIndicator();
    setTheme(isDarkMode);
}

function generateRandomParticles() {
    const particleCount = 10000; // Partikül sayısını artır
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 100;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: isDarkMode ? 0xffffff : 0x000000,
        size: isDarkMode ? 0.01: 0.5 , // Partikül boyutunu küçült
        transparent: true,
        opacity: isDarkMode ? 0.9: 1,
        sizeAttenuation: true, // Kamera uzaklığına göre boyut değişimi
        alphaTest: 0.5, // Yuvarlak şekil için alphaTest
    });
    
    const pointCloud = new THREE.Points(geometry, material);
    scene.add(pointCloud);
    particles.push(pointCloud);

    // Başlangıçta rastgele hedef pozisyonları ve hızları oluştur
    targetPositions = positions.slice();
    particleVelocities = new Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
        particleVelocities[i] = new THREE.Vector3(
            (Math.random() - 0.5) * randomMovementSpeed,
            (Math.random() - 0.5) * randomMovementSpeed,
            (Math.random() - 0.5) * randomMovementSpeed
        );
    }
}

function generateLorenzAttractor() {
    let xyz = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < numSteps; i++) {
        let dx = sigma * (xyz.y - xyz.x) * dt;
        let dy = (xyz.x * (rho - xyz.z) - xyz.y) * dt;
        let dz = (xyz.x * xyz.y - beta * xyz.z) * dt;
        xyz.add(new THREE.Vector3(dx, dy, dz));
        attractorPoints.push(xyz.clone());
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    let positions = particles[0].geometry.attributes.position.array;
    if (isAttractorMode) {
        // Lorenz çekicisine doğru hareket ve yörüngede kalma
        for (let i = 0; i < particles[0].geometry.attributes.position.count; i++) {
            const attractorIndex = i % attractorPoints.length;
            positions[i * 3] += (attractorPoints[attractorIndex].x - positions[i * 3]) * transitionSpeed;
            positions[i * 3 + 1] += (attractorPoints[attractorIndex].y - positions[i * 3 + 1]) * transitionSpeed;
            positions[i * 3 + 2] += (attractorPoints[attractorIndex].z - positions[i * 3 + 2]) * transitionSpeed;
        }
    } else {
        // Rastgele hareket
        for (let i = 0; i < particles[0].geometry.attributes.position.count; i++) {
            positions[i * 3] += particleVelocities[i].x;
            positions[i * 3 + 1] += particleVelocities[i].y;
            positions[i * 3 + 2] += particleVelocities[i].z;

            // Ekran sınırlarını kontrol et ve hızı tersine çevir
            if (positions[i * 3] < -50 || positions[i * 3] > 50) particleVelocities[i].x *= -1;
            if (positions[i * 3 + 1] < -50 || positions[i * 3 + 1] > 50) particleVelocities[i].y *= -1;
            if (positions[i * 3 + 2] < -50 || positions[i * 3 + 2] > 50) particleVelocities[i].z *= -1;
        }
    }
    particles[0].geometry.attributes.position.needsUpdate = true;
    controls.update();
    renderer.render(scene, camera);
}

function toggleMode() {
    isAttractorMode = !isAttractorMode;
    if (!isAttractorMode) {
        // Rastgele hedef pozisyonlar ve hızlar oluştur
        const particleCount = particles[0].geometry.attributes.position.count;
        for (let i = 0; i < particleCount; i++) {
            targetPositions[i * 3] = (Math.random() - 0.5) * 100;
            targetPositions[i * 3 + 1] = (Math.random() - 0.5) * 100;
            targetPositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
            particleVelocities[i] = new THREE.Vector3(
                (Math.random() - 0.5) * randomMovementSpeed,
                (Math.random() - 0.5) * randomMovementSpeed,
                (Math.random() - 0.5) * randomMovementSpeed
            );
        }
    }
}

// Mod değiştirme fonksiyonu
function toggleTheme() {
    isDarkMode = !isDarkMode;
    setTheme(isDarkMode);
    updateIndicator();
  }


function setTheme(isDarkMode) {
    // Arka plan rengini ayarla
    renderer.setClearColor(isDarkMode ? 0x000000 : 0xffffff);

    // Partikül rengini güncelle
    particles[0].material.color.set(isDarkMode ? 0xffffff : 0x000000);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}