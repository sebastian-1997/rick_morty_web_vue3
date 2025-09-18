<template>
  <canvas ref="canvas" class="w-full h-full"></canvas>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, defineExpose } from "vue";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";

const props = defineProps({
  modelPath: { type: String, required: true },
});

const canvas = ref(null);
let scene, camera, renderer, model, shipGroup, animationId;
let particles = [];
const MAX_PARTICLES = 180; // to avoid runaway
let sharedTrailGeo = null;
let haloMaterial = null;
let glowSprite = null;
let allTweens = []; // to kill on unmount

// ----------------- HALO SHADER -----------------
const HaloShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform float time;
    void main() {
      float d = distance(vUv, vec2(0.5));
      // un pulso suave con time
      float pulse = 0.6 + 0.4 * sin(time * 2.0);
      float alpha = smoothstep(0.6, 0.0, d) * (1.8 + 0.9*sin(time*4.0));
      vec3 col = mix(vec3(0.0,1.0,1.0), vec3(1.0,0.0,1.0), vUv.x);
      gl_FragColor = vec4(col, alpha);
    }
  `,
  uniforms: { time: { value: 0 } },
};

// ----------------- HELPERS -----------------
function worldSize() {
  const w = camera.right - camera.left;
  const h = camera.top - camera.bottom;
  return { w, h };
}

function percentToPosition(xPercent, yPercent) {
  const { w, h } = worldSize();
  const x = (xPercent / 100 - 0.5) * w;
  const y = (0.5 - yPercent / 100) * h;
  return { x, y };
}

// ----------------- TRAIL (optimized) -----------------
function createTrailParticles(from, to) {
  if (!sharedTrailGeo) {
    sharedTrailGeo = new THREE.SphereGeometry(0.35, 6, 6);
  }

  const dir = new THREE.Vector3(to.x - from.x, to.y - from.y, 0).normalize();
  const basePos = new THREE.Vector3(from.x, from.y, -1.2); // detrás de la nave

  // fewer particles, smaller, fade faster -> mejor rendimiento
  const count = 4;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1 || 1);
    const offset = dir.clone().multiplyScalar(i * 0.9 + 0.2);
    const pos = basePos.clone().add(offset);

    // clonamos material para animar opacidad independientemente
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x00ffff),
      transparent: true,
      opacity: 0.85 - Math.random() * 0.25,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particle = new THREE.Mesh(sharedTrailGeo, mat);
    particle.position.copy(pos);
    particle.scale.setScalar(0.6 + Math.random() * 0.6);
    scene.add(particle);
    particles.push(particle);

    // animación de opacidad y ligera dispersión
    const tween = gsap.to(particle.material, {
      opacity: 0,
      duration: 0.9 + Math.random() * 0.6,
      ease: "power1.out",
      onComplete: () => {
        // quitar y liberar material (no la geometría compartida)
        scene.remove(particle);
        if (particle.material) particle.material.dispose();
      },
    });
    allTweens.push(tween);

    // opcional: pequeña expansión mientras desaparece
    const tween2 = gsap.to(particle.scale, {
      x: particle.scale.x * 1.6,
      y: particle.scale.y * 1.6,
      z: particle.scale.z * 1.6,
      duration: 0.9 + Math.random() * 0.6,
      ease: "power1.out",
    });
    allTweens.push(tween2);
  }

  // control simple para evitar exceso
  if (particles.length > MAX_PARTICLES) {
    // remove oldest until within limit
    while (particles.length > MAX_PARTICLES) {
      const p = particles.shift();
      try {
        scene.remove(p);
        if (p.material) p.material.dispose();
      } catch (e) {}
    }
  }
}

// ----------------- HALO (plane shader) -----------------
function createHalo() {
  const geo = new THREE.PlaneGeometry(8.5, 8.5, 1, 1); // tamaño
  const matUniforms = THREE.UniformsUtils.clone(HaloShader.uniforms);
  const mat = new THREE.ShaderMaterial({
    vertexShader: HaloShader.vertexShader,
    fragmentShader: HaloShader.fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    uniforms: matUniforms,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  haloMaterial = mat; // guardar para actualizar uniforms
  const haloMesh = new THREE.Mesh(geo, mat);
  haloMesh.position.set(0, 0, -2.2); // detrás de la nave
  haloMesh.renderOrder = 0;
  // permitir que pase algo de blur al render pipeline (no obligatorio)
  return haloMesh;
}

// ----------------- GLOW SPRITE (fondo suave detrás de la nave) -----------------
function createGlowSprite() {
  // crear canvas radial para textura
  const size = 256;
  const canvasTex = document.createElement("canvas");
  canvasTex.width = size;
  canvasTex.height = size;
  const ctx = canvasTex.getContext("2d");
  const grd = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
  grd.addColorStop(0, "rgba(0,255,255,0.9)");
  grd.addColorStop(0.4, "rgba(0,255,255,0.35)");
  grd.addColorStop(0.7, "rgba(128,0,128,0.12)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvasTex);
  tex.needsUpdate = true;

  const mat = new THREE.SpriteMaterial({
    map: tex,
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(12, 12, 1); // tamaño: ajusta según tu escena
  sprite.position.set(0, 0, -3.0); // siempre detrás
  sprite.renderOrder = -1;
  // guardamos referencia para limpiar la textura más tarde
  glowSprite = sprite;
  return sprite;
}

// ----------------- INIT -----------------
onMounted(() => {
  scene = new THREE.Scene();

  const aspect = window.innerWidth / window.innerHeight;
  const d = 50;
  camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
  camera.position.set(0, 0, 100);

  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // Lights
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(10, 20, 30);
  scene.add(dirLight);
  scene.add(new THREE.AmbientLight(0xaaaaaa, 0.8));

  // Loader
  const loader = new GLTFLoader();
  loader.load(
    props.modelPath,
    (gltf) => {
      model = gltf.scene;
      model.traverse((c) => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = false;
          // dejamos materiales del modelo como están (sin cambiar)
        }
      });

      model.scale.set(4.5, 4.5, 4.5);
      model.position.set(0, 0, 0);

      shipGroup = new THREE.Group();
      shipGroup.add(model);

      // halo (shader plane) detrás de la nave
      const hMesh = createHalo();
      shipGroup.add(hMesh);

      // glow sprite (más suave, más grande atrás)
      const sprite = createGlowSprite();
      shipGroup.add(sprite);

      scene.add(shipGroup);

      // Idle flotando (solo el modelo para dar sensación de vida)
      const floatTween = gsap.to(model.position, {
        y: "+=0.6",
        duration: 2,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
      allTweens.push(floatTween);
    },
    undefined,
    (err) => console.error("GLTF load error:", err)
  );

  // render loop
  function animate() {
  animationId = requestAnimationFrame(animate);
  if (shipGroup) {
    // 🔹 mantener actualizado el tiempo del shader del halo
    shipGroup.traverse((c) => {
      if (c.material && c.material.uniforms && c.material.uniforms.time) {
        c.material.uniforms.time.value += 0.02;
      }
    });

    // 🔹 generar estela continua detrás de la nave
    if (model) {
      const pos = shipGroup.position.clone();
      createTrailParticles(pos, { x: pos.x, y: pos.y - 0.01 }); // un poco detrás
    }
  }
  renderer.render(scene, camera);
}
  animate();

  window.addEventListener("resize", onResize);
});

// cleanup
onBeforeUnmount(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener("resize", onResize);

  // kill tweens
  allTweens.forEach((t) => {
    try {
      t.kill && t.kill();
    } catch (e) {}
  });

  // dispose trail geometry
  if (sharedTrailGeo) {
    sharedTrailGeo.dispose();
    sharedTrailGeo = null;
  }

  // dispose halo material
  if (haloMaterial) {
    if (haloMaterial.uniforms && haloMaterial.uniforms.time) {
      haloMaterial.uniforms.time.value = 0;
    }
    haloMaterial.dispose && haloMaterial.dispose();
    haloMaterial = null;
  }

  // dispose glow sprite texture & material
  if (glowSprite) {
    try {
      if (glowSprite.material.map) glowSprite.material.map.dispose();
      glowSprite.material.dispose();
      scene.remove(glowSprite);
    } catch (e) {}
    glowSprite = null;
  }

  // dispose rest of renderer
  if (renderer) {
    renderer.dispose();
  }
});

// resize
function onResize() {
  const aspect = window.innerWidth / window.innerHeight;
  const d = 50;
  camera.left = -d * aspect;
  camera.right = d * aspect;
  camera.top = d;
  camera.bottom = -d;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// ----------------- MOVE -----------------
function moveToPercent(xPercent, yPercent) {
  if (!shipGroup) return;
  const { x, y } = percentToPosition(xPercent, yPercent);

  const from = { x: shipGroup.position.x, y: shipGroup.position.y };
  const to = { x, y };

  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  if (dist < 0.25) return;

  // crear estela optimizada
  createTrailParticles(from, to);

  gsap.killTweensOf(shipGroup.position);
  const moveTween = gsap.to(shipGroup.position, {
    x,
    y,
    duration: Math.min(1.8, 0.5 + dist * 0.018),
    ease: "power2.out",
  });
  allTweens.push(moveTween);

  // pulso del halo/ sprite
  const halo = shipGroup.children.find((c) => c.material && c.material.uniforms && c.material.uniforms.time);
  if (halo) {
    const sTween = gsap.fromTo(
      halo.scale,
      { x: 0.7, y: 0.7, z: 0.7 },
      { x: 1.15, y: 1.15, z: 1.15, duration: 0.45, yoyo: true, repeat: 1, ease: "sine.inOut" }
    );
    allTweens.push(sTween);
  }
}

defineExpose({ moveToPercent });
</script>

<style scoped>
canvas {
  display: block;
}
</style>
