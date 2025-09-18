<template>
  <canvas ref="canvas" class="w-full h-full block"></canvas>
</template>

<script setup lang="ts">
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { onMounted, onBeforeUnmount, ref } from "vue";

const canvas = ref<HTMLCanvasElement | null>(null);

let scene!: THREE.Scene;
let camera!: THREE.PerspectiveCamera;
let renderer!: THREE.WebGLRenderer;
let mixer: THREE.AnimationMixer | null = null;
let action: THREE.AnimationAction | null = null;
let animationId: number;
const clock = new THREE.Clock();

let isInView = false;

onMounted(() => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 1.6, 6);

  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value!,
    alpha: true,
    antialias: true,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // 🔹 Luces
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(5, 10, 7.5);
  scene.add(dirLight);

  // 🔹 Cargar modelo Rick
  const loader = new GLTFLoader();
  loader.load(
    "/models/rick/rick/rick.glb",
    (gltf) => {
      const model = gltf.scene;

      const group = new THREE.Group();
      group.add(model);

      // Escalar y centrar modelo más pequeño
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxAxis = Math.max(size.x, size.y, size.z);
      const scale = 1.5 / maxAxis; // 
      group.scale.setScalar(scale);

      const center = new THREE.Vector3();
      box.getCenter(center);
      group.position.sub(center);

      // Ajuste posición cerca del botón
      group.position.y = -0.9;
      group.position.x = -2.9;
      group.rotation.y = Math.PI / 12;

      model.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material.side = THREE.FrontSide;
          if (child.material.map) {
            child.material.map.colorSpace = THREE.SRGBColorSpace;
          }
        }
      });

      scene.add(group);

      // 🔹 Animación si existe
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        action = mixer.clipAction(gltf.animations[0]);
        action.loop = THREE.LoopOnce;
        action.clampWhenFinished = true;
        playAnimation();
      }
    },
    undefined,
    (error) => console.error("Error cargando Rick:", error)
  );

  // 🔹 Loop render
  const animate = () => {
    animationId = requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    renderer.render(scene, camera);
  };
  animate();

  window.addEventListener("resize", onResize);
  document.addEventListener("scroll", onScroll);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener("resize", onResize);
  document.removeEventListener("scroll", onScroll);
  renderer.dispose();
});

function onResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function isInViewport(el: HTMLElement | null) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}

function playAnimation() {
  if (action) {
    action.reset().play();
  }
}

function onScroll() {
  const currentlyInView = isInViewport(canvas.value);

  if (currentlyInView && !isInView) {
    playAnimation();
  }

  isInView = currentlyInView;
}
</script>

<style scoped>
canvas {
  position: absolute;
  top: 45%; /* 🔹 colocarlo más abajo cerca del botón */
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px; /* 🔹 tamaño controlado */
  height: 400px;
  z-index: 40;
  pointer-events: none;
}
</style>
