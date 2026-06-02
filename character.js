// character.js — 3D character animation
// Three.js (ES module via importmap) + GSAP ScrollTrigger (UMD on window)

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gsap         = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);

const mount = document.getElementById('char-canvas-mount');
if (!mount) throw new Error('#char-canvas-mount not found');

// ── Renderer ──────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: window.devicePixelRatio < 2,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping          = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure  = 1.3;
renderer.outputColorSpace     = THREE.SRGBColorSpace;
mount.appendChild(renderer.domElement);
renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;';

// ── Scene / Camera ────────────────────────────────────────
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 100);
camera.position.set(0, 0.5, 5.5);

// ── Lighting ──────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const keyLight = new THREE.DirectionalLight(0x8bb8ff, 2.5);
keyLight.position.set(-3, 5, 3);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffd0a0, 1.0);
fillLight.position.set(4, 1, 2);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xa78bfa, 2.0);
rimLight.position.set(0, 4, -5);
scene.add(rimLight);

const pointLight = new THREE.PointLight(0x6366f1, 3, 8);
pointLight.position.set(0, 0.5, 3);
scene.add(pointLight);

const topLight = new THREE.SpotLight(0xffffff, 1.5, 12, Math.PI / 5, 0.5);
topLight.position.set(0, 6, 2);
scene.add(topLight);

// ── Shared state — GSAP writes, RAF reads ─────────────────
const scrollState = {
  rotY:    0,
  camZ:    5.5,
  charX:   0,
  charY:   15,    // starts below, intro tweens to 0
  opacity: 0,     // starts hidden, intro tweens to 1
  scale:   0.72,  // starts small, intro tweens to 1
};

const mouse       = { x: 0, y: 0 };
const smoothMouse = { x: 0, y: 0 };
let modelGroup    = null;
let mixer         = null;
let isLoaded      = false;
let elapsed       = 0;
const clock       = new THREE.Clock();

// ── Load Model ────────────────────────────────────────────
new GLTFLoader().load(
  '/assets/model/character.glb',
  (gltf) => {
    const model  = gltf.scene;
    const box    = new THREE.Box3().setFromObject(model);
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s      = 2.4 / Math.max(size.y, 0.01);
    model.scale.setScalar(s);
    model.position.set(-center.x * s, -center.y * s, -center.z * s);

    model.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          mat.roughness       = Math.min(mat.roughness  ?? 0.6, 0.55);
          mat.metalness       = Math.max(mat.metalness  ?? 0.4, 0.45);
          mat.envMapIntensity = 0.8;
          mat.needsUpdate     = true;
        });
      }
    });

    modelGroup = new THREE.Group();
    modelGroup.scale.setScalar(scrollState.scale);
    modelGroup.add(model);
    scene.add(modelGroup);

    // ── Animation mixer ───────────────────────────────────
    mixer = new THREE.AnimationMixer(model);
    const clips   = gltf.animations;
    const getClip = (name) => THREE.AnimationClip.findByName(clips, name);

    const introClip  = getClip('introAnimation');
    const typingClip = getClip('typing');
    const blinkClip  = getClip('Blink');

    // 1. Play introAnimation once, then crossfade into typing loop
    if (introClip) {
      const introAction = mixer.clipAction(introClip);
      introAction.setLoop(THREE.LoopOnce, 1);
      introAction.clampWhenFinished = true;
      introAction.play();

      mixer.addEventListener('finished', (e) => {
        if (e.action !== introAction) return;
        if (typingClip) {
          const typingAction = mixer.clipAction(typingClip);
          typingAction.setLoop(THREE.LoopRepeat);
          introAction.crossFadeTo(typingAction, 0.6, true);
          typingAction.play();
        }
      });
    } else if (typingClip) {
      // No intro clip — go straight to typing
      const typingAction = mixer.clipAction(typingClip);
      typingAction.setLoop(THREE.LoopRepeat);
      typingAction.play();
    }

    // 2. Blink runs independently on repeat
    if (blinkClip) {
      const blinkAction = mixer.clipAction(blinkClip);
      blinkAction.setLoop(THREE.LoopRepeat);
      blinkAction.play();
    }

    // ── GSAP entrance: rise + scale overshoot + fade-in ───
    gsap.to(scrollState, {
      charY:   0,
      opacity: 1,
      scale:   1,
      duration: 1.9,
      ease:    'back.out(1.3)',
      delay:   0.25,
    });

    // ── Glow pulse loop ───────────────────────────────────
    gsap.to('.char-glow', {
      opacity:  0.85,
      scaleX:   1.3,
      scaleY:   1.4,
      duration: 2.8,
      ease:     'sine.inOut',
      yoyo:     true,
      repeat:   -1,
      delay:    1.8,
    });

    isLoaded = true;
    setupScrollTimelines();
  },
  undefined,
  (err) => console.error('[character.js] load error:', err)
);

// ── Scroll Timelines (Pin Section pattern) ────────────────
function setupScrollTimelines() {
  if (window.innerWidth <= 900) return;

  // Hero stays pinned for an extra 100vh of scroll budget.
  // Phase 1 (0–45 %): hero text fades, character leans.
  // Phase 2 (45–100 %): character rises off screen and disappears.
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger:             '.hero',
      start:               'top top',
      end:                 '+=100%',
      pin:                 true,
      scrub:               1.2,
      anticipatePin:       1,
      invalidateOnRefresh: true,
    },
  });

  tl
    .to(scrollState,      { rotY: 0.45, camZ: 6.2, duration: 0.45 }, 0)
    .to('.hero__text',    { opacity: 0, y: '-16%',  duration: 0.38 }, 0)
    .to('.hero__trusted', { opacity: 0,             duration: 0.28 }, 0)
    .to(scrollState,      { charY: -130,            duration: 0.55 }, 0.45)
    .to(scrollState,      { opacity: 0,             duration: 0.40 }, 0.50);

  // Restore everything when scrolling back into the hero
  ScrollTrigger.create({
    trigger:     '.hero',
    start:       'top bottom',
    end:         'bottom top',
    onEnterBack: () => {
      gsap.to(scrollState, {
        charY: 0, opacity: 1, rotY: 0, camZ: 5.5,
        duration: 0.65, ease: 'power2.out',
      });
      gsap.to('.hero__text',    { opacity: 1, y: '0%', duration: 0.5 });
      gsap.to('.hero__trusted', { opacity: 1,          duration: 0.4 });
    },
  });
}

// ── Resize ────────────────────────────────────────────────
function onResize() {
  const w = mount.clientWidth  || 1;
  const h = mount.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', () => { onResize(); ScrollTrigger.refresh(); });
onResize();

// ── Mouse tracking ────────────────────────────────────────
document.addEventListener('mousemove', (e) => {
  mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// ── Render loop ───────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  elapsed += delta;

  smoothMouse.x += (mouse.x - smoothMouse.x) * 0.05;
  smoothMouse.y += (mouse.y - smoothMouse.y) * 0.04;

  // Advance rig animations
  if (mixer) mixer.update(delta);

  if (isLoaded && modelGroup) {
    const nearTop = window.scrollY < window.innerHeight * 0.85;

    // scrollState.scale drives the entrance overshoot
    modelGroup.scale.setScalar(scrollState.scale);

    // Rotate the whole group toward the mouse — the rig animations
    // handle body movement so we only apply gentle Y rotation here.
    const targetRotY = scrollState.rotY + (nearTop ? smoothMouse.x * 0.25 : 0);
    modelGroup.rotation.y += (targetRotY - modelGroup.rotation.y) * 0.06;

    // Camera
    camera.position.z += (scrollState.camZ - camera.position.z) * 0.06;

    // Container driven entirely by scrollState
    const container = document.getElementById('char-container');
    if (container) {
      container.style.transform =
        `translateX(${scrollState.charX}%) translateY(${scrollState.charY}%)`;
      container.style.opacity = scrollState.opacity;
    }
  }

  // Pulsing violet point light
  pointLight.intensity = 2.5 + Math.sin(elapsed * 1.8) * 0.6;
  renderer.render(scene, camera);
}
animate();
