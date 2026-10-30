import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { MapWorld } from "./world/MapWorld.js";
import { Stations, EGYPT_STATIONS } from "./world/Stations.js";
import { Train } from "./train/Train.js";

// المشهد
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fc8dc);
scene.fog = new THREE.Fog(0x9fc8dc, 900, 6500);

// الكاميرا
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  15000
);

camera.position.set(-4550, 35, 65);

// محرك العرض
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 1.5)
);

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.body.appendChild(renderer.domElement);

// الإضاءة
const ambient = new THREE.HemisphereLight(
  0xe8f5ff,
  0x77654a,
  2
);

scene.add(ambient);

const sun = new THREE.DirectionalLight(
  0xfff0d5,
  2.2
);

sun.position.set(-1200, 1800, 900);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);

scene.add(sun);

// إنشاء العالم
// مهم: MapWorld يرجع مجموعة العالم مباشرة
const world = new MapWorld(scene);

// استخراج السكة
const railway = world.getObjectByName("Railway");

if (!railway || !railway.userData.curve) {
  throw new Error("لم يتم العثور على مسار السكة الحديد");
}

const railwayCurve = railway.userData.curve;

// إنشاء المحطات
const stations = new Stations(
  scene,
  railwayCurve
);

// إنشاء القطار
const train = new Train(
  scene,
  railwayCurve,
  {
    coachCount: 5,
    coachCapacity: 60
  }
);

// الكاميرا المتحركة
const controls = new OrbitControls(
  camera,
  renderer.domElement
);

controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 12;
controls.maxDistance = 180;
controls.maxPolarAngle = Math.PI * 0.48;

controls.target.copy(train.group.position);
controls.target.y += 3;

// عناصر الواجهة
const stationSelect =
  document.querySelector("#stationSelect");

const speedValue =
  document.querySelector("#speedValue");

const statusValue =
  document.querySelector("#statusValue");

const passengerValue =
  document.querySelector("#passengerValue");

const message =
  document.querySelector("#message");

// تحميل قائمة المحطات
EGYPT_STATIONS.forEach(station => {
  const option = document.createElement("option");

  option.value = station.name;
  option.textContent = station.name;

  stationSelect.appendChild(option);
});

// عرض الرسائل
function showMessage(text) {
  message.textContent = text;
}

// زيادة السرعة
document.querySelector("#accelerate")
  .addEventListener("click", () => {
    train.setSpeed(
      Math.min(train.speed + 5, train.maxSpeed)
    );

    showMessage("تمت زيادة سرعة القطار");
  });

// تقليل السرعة
document.querySelector("#brake")
  .addEventListener("click", () => {
    train.setSpeed(
      Math.max(train.speed - 5, 0)
    );

    showMessage("تم تقليل السرعة");
  });

// فرامل الطوارئ
document.querySelector("#emergencyStop")
  .addEventListener("click", () => {
    train.setSpeed(0);
    showMessage("تم إيقاف القطار");
  });

// الوقوف في محطة مختارة
document.querySelector("#stopAtStation")
  .addEventListener("click", () => {
    const ok = train.stopAtStation(
      stationSelect.value
    );

    showMessage(
      ok
        ? "وصل القطار إلى " + stationSelect.value
        : "تعذر الوصول إلى المحطة"
    );
  });

// فتح الأبواب
document.querySelector("#openDoors")
  .addEventListener("click", () => {
    const ok = train.openDoors();

    showMessage(
      ok
        ? "جاري فتح الأبواب"
        : "يجب إيقاف القطار في محطة أولاً"
    );
  });

// تحميل الركاب
document.querySelector("#boardPassengers")
  .addEventListener("click", () => {
    const result = train.boardPassengers(20);

    showMessage(
      result.boarded
        ? "تم تحميل " + result.boarded + " راكب"
        : result.message || "انتظر حتى تفتح الأبواب"
    );
  });

// البداية من رمسيس
document.querySelector("#startAtRamses")
  .addEventListener("click", () => {
    train.stopAtStation("محطة مصر - رمسيس");

    showMessage("أنت الآن في محطة رمسيس");
  });

// لوحة المفاتيح
window.addEventListener("keydown", event => {
  if (event.repeat) return;

  if (
    event.code === "ArrowUp" ||
    event.code === "KeyW"
  ) {
    train.setSpeed(
      Math.min(train.speed + 5, train.maxSpeed)
    );
  }

  if (
    event.code === "ArrowDown" ||
    event.code === "KeyS"
  ) {
    train.setSpeed(
      Math.max(train.speed - 5, 0)
    );
  }

  if (event.code === "Space") {
    event.preventDefault();
    train.setSpeed(0);
  }
});

// حلقة التشغيل
const clock = new THREE.Clock();

const forward = new THREE.Vector3();
const desiredCamera = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(
    clock.getDelta(),
    0.05
  );

  train.update(delta);

  // اتجاه السكة
  const tangent = railwayCurve.getTangentAt(
    train.positionOnTrack
  );

  forward.copy(tangent).normalize();

  // الكاميرا خلف القطار
  desiredCamera
    .copy(train.group.position)
    .addScaledVector(forward, -38);

  desiredCamera.y += 23;
  desiredCamera.z += 28;

  camera.position.lerp(
    desiredCamera,
    0.035
  );

  lookTarget.copy(train.group.position);
  lookTarget.y += 3.5;

  controls.target.lerp(
    lookTarget,
    0.08
  );

  controls.update();

  // تحديث المعلومات
  speedValue.textContent =
    train.speed.toFixed(0);

  statusValue.textContent =
    train.isStopped ? "متوقف" : "يتحرك";

  passengerValue.textContent =
    train.getPassengerCount() +
    " / " +
    train.getCapacity();

  renderer.render(scene, camera);
}

// تغيير حجم الشاشة
window.addEventListener("resize", () => {
  camera.aspect =
    window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
});

animate();

showMessage("اللعبة جاهزة للتجربة");
  
