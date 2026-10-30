
import * as THREE from "three";
import { EGYPT_STATIONS } from "../world/Stations.js";

export class Train {
  constructor(scene, railwayCurve, options = {}) {
    if (!scene || !railwayCurve) {
      throw new Error("Train requires a scene and railway curve");
    }

    this.scene = scene;
    this.curve = railwayCurve;

    this.options = {
      coachCount: 5,
      coachCapacity: 60,
      speed: 0,
      ...options
    };

    this.positionOnTrack = 0;
    this.speed = this.options.speed;
    this.maxSpeed = 45;

    this.isStopped = true;
    this.currentStation = null;
    this.doorState = "closed";

    this.totalLength = this.curve.getLength();

    this.group = new THREE.Group();
    this.group.name = "EgyptPassengerTrain";

    this.coaches = [];
    this.wheels = [];
    this.doors = [];
    this.passengers = [];

    this.materials = {
      blue: this.material(0x174d76, 0.45, 0.35),
      darkBlue: this.material(0x102f49),
      white: this.material(0xe5e8e8, 0.4),
      silver: this.material(0x9da6aa, 0.35, 0.7),
      glass: new THREE.MeshStandardMaterial({
        color: 0x83b7ce,
        metalness: 0.5,
        roughness: 0.15
      }),
      darkGlass: new THREE.MeshStandardMaterial({
        color: 0x172d3b,
        metalness: 0.35,
        roughness: 0.15
      }),
      rubber: this.material(0x191919),
      metal: this.material(0x555b60, 0.35, 0.8),
      red: this.material(0xc82929),
      yellow: this.material(0xf0c64c),
      light: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 1.2
      }),
      seat: this.material(0x315c78),
      skin: this.material(0xb98059),
      clothes: [
        this.material(0x526c83),
        this.material(0x987044),
        this.material(0x54714c),
        this.material(0x704b57)
      ]
    };

    this.buildTrain();
    this.scene.add(this.group);

    this.updatePosition();
  }

  material(color, roughness = 0.65, metalness = 0.05) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness
    });
  }

  addBox(parent, material, x, y, z, w, h, d) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    parent.add(mesh);
    return mesh;
  }

  addCylinder(parent, material, x, y, z, radius, height) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        radius,
        radius,
        height,
        20
      ),
      material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;

    parent.add(mesh);
    return mesh;
  }

  buildTrain() {
    this.buildLocomotive();

    for (let i = 0; i < this.options.coachCount; i++) {
      const coach = this.buildCoach(i);
      this.coaches.push(coach);
      this.group.add(coach);
    }

    this.buildCouplers();
  }

  // ==================================
  // LOCOMOTIVE
  // ==================================

  buildLocomotive() {
    const loco = new THREE.Group();
    loco.name = "DieselLocomotive";

    // الهيكل السفلي
    this.addBox(
      loco, this.materials.darkBlue,
      0, 1.1, 0,
      13, 1.3, 2.8
    );

    // جسم الجرار
    this.addBox(
      loco, this.materials.blue,
      0.5, 2.5, 0,
      10.5, 2.5, 2.7
    );

    // غطاء المحرك الأمامي
    this.addBox(
      loco, this.materials.blue,
      5.4, 2.1, 0,
      2.3, 1.8, 2.65
    );

    // مقدمة الجرار
    this.addBox(
      loco, this.materials.white,
      6.65, 2.25, 0,
      0.25, 1.7, 2.65
    );

    // كابينة القيادة
    this.addBox(
      loco, this.materials.blue,
      -3.8, 3.1, 0,
      3.7, 3.2, 2.8
    );

    // الزجاج الأمامي
    for (const z of [-0.76, 0.76]) {
      const frontGlass = this.addBox(
        loco, this.materials.glass,
        -5.67, 3.5, z,
        0.12, 1.15, 1.05
      );

      frontGlass.rotation.x = z > 0 ? -0.12 : 0.12;
    }

    // شبابيك جانبية
    for (const side of [-1, 1]) {
      this.addBox(
        loco, this.materials.darkGlass,
        -3.9, 3.8, side * 1.42,
        2.1, 1.05, 0.08
      );

      this.addBox(
        loco, this.materials.darkGlass,
        -1.9, 3.5, side * 1.42,
        0.8, 1.1, 0.08
      );
    }

    // باب الكابينة
    this.addBox(
      loco, this.materials.darkBlue,
      -4.8, 2.5, 1.43,
      0.75, 2, 0.12
    );

    // فتحات تهوية المحرك
    for (let i = 0; i < 8; i++) {
      this.addBox(
        loco, this.materials.silver,
        -0.5 + i * 0.55, 3.2, 1.37,
        0.08, 0.85, 0.06
      );
    }

    // شريط جانبي أبيض
    this.addBox(
      loco, this.materials.white,
      0.3, 1.85, 1.37,
      9.5, 0.25, 0.08
    );

    // المصابيح الأمامية
    for (const z of [-0.85, 0.85]) {
      this.addBox(
        loco, this.materials.light,
        6.8, 2.65, z,
        0.15, 0.3, 0.35
      );
    }

    // المصابيح السفلية
    for (const z of [-0.85, 0.85]) {
      this.addBox(
        loco, this.materials.light,
        6.82, 1.6, z,
        0.12, 0.2, 0.25
      );
    }

    // قاعدة ومصد الجرار
    this.addBox(
      loco, this.materials.darkBlue,
      6.9, 0.75, 0,
      0.8, 0.55, 2.5
    );

    this.addBox(
      loco, this.materials.silver,
      7.2, 0.55, 0,
      0.45, 0.25, 1.8
    );

    // بوق أعلى الكابينة
    this.addCylinder(
      loco, this.materials.metal,
      -2.5, 5, 0,
      0.18, 0.6
    );

    // عجل الجرار
    this.addWheelSet(loco, [-4.5, 0, 4.5]);

    loco.position.set(0, 0, 0);
    this.locomotive = loco;
    this.group.add(loco);
  }

  // ==================================
  // PASSENGER COACHES
  // ==================================

  buildCoach(index) {
    const coach = new THREE.Group();

    coach.name = `PassengerCoach_${index + 1}`;

    const length = 18;
    const width = 2.85;
    const height = 3.5;

    // الهيكل السفلي
    this.addBox(
      coach, this.materials.darkBlue,
      0, 1.1, 0,
      length, 1, width
    );

    // جسم العربة
    this.addBox(
      coach, this.materials.white,
      0, 2.75, 0,
      length, height, width
    );

    // السقف
    this.addBox(
      coach, this.materials.silver,
      0, 4.55, 0,
      length + 0.2, 0.25, width + 0.15
    );

    // الشريط الأزرق الجانبي
    for (const side of [-1, 1]) {
      this.addBox(
        coach, this.materials.blue,
        0, 1.9, side * 1.44,
        length - 0.4, 0.65, 0.08
      );
    }

    // الشبابيك
    for (const side of [-1, 1]) {
      for (let x = -7; x <= 7; x += 2.3) {
        this.addBox(
          coach, this.materials.darkGlass,
          x, 3.15, side * 1.45,
          1.35, 0.95, 0.08
        );

        // إطار النافذة
        this.addBox(
          coach, this.materials.silver,
          x, 3.15, side * 1.5,
          1.45, 1.05, 0.045
        );
      }
    }

    // الأبواب الجانبية
    for (const side of [-1, 1]) {
      const door = new THREE.Group();
      door.name = "PassengerDoor";

      this.addBox(
        door, this.materials.blue,
        0, 2.55, side * 1.46,
        1.25, 2.7, 0.13
      );

      this.addBox(
        door, this.materials.darkGlass,
        0, 3.1, side * 1.54,
        0.75, 0.8, 0.05
      );

      door.position.x = 8.1;
      coach.add(door);

      this.doors.push({
        object: door,
        closedX: 8.1,
        side,
        open: false,
        target: 8.1
      });
    }

    // نهايات العربة
    for (const x of [-9, 9]) {
      this.addBox(
        coach, this.materials.darkBlue,
        x, 2.7, 0,
        0.2, 3.1, 2.6
      );
    }

    // العجلات
    this.addWheelSet(coach, [-6, 6]);

    // المقاعد الداخلية
    this.buildSeats(coach);

    // أماكن الركاب
    coach.userData.passengers = 0;
    coach.userData.capacity = this.options.coachCapacity;
    coach.userData.index = index + 1;
    coach.userData.visualPassengers = [];

    coach.position.x = -16 - index * 20;

    return coach;
  }

  buildSeats(coach) {
    for (let x = -7; x <= 7; x += 3) {
      for (const z of [-0.65, 0.65]) {
        this.addBox(
          coach, this.materials.seat,
          x, 1.95, z,
          1.2, 0.75, 0.65
        );

        this.addBox(
          coach, this.materials.seat,
          x - 0.4, 2.4, z,
          0.2, 1.1, 0.65
        );
      }
    }
  }

  // ==================================
  // WHEELS
  // ==================================

  addWheelSet(parent, positions) {
    for (const x of positions) {
      const axle = new THREE.Group();
      axle.position.set(x, 0.75, 0);

      for (const side of [-1, 1]) {
        const wheel = this.meshWheel(axle, side);

        this.wheels.push(wheel);
      }

      parent.add(axle);

      // المحور
      this.addCylinder(
        axle, this.materials.metal,
        0, 0, 0,
        0.13, 1.65
      ).rotation.x = Math.PI / 2;
    }
  }

  meshWheel(parent, side) {
    const wheel = new THREE.Group();

    const disk = this.addCylinder(
      wheel, this.materials.rubber,
      0, 0, 0,
      0.55, 0.28
    );

    disk.rotation.x = Math.PI / 2;

    const center = this.addCylinder(
      wheel, this.materials.silver,
      0, 0, 0,
      0.19, 0.31
    );

    center.rotation.x = Math.PI / 2;

    wheel.position.z = side * 0.85;
    parent.add(wheel);

    return wheel;
  }

  // ==================================
  // COUPLERS
  // ==================================

  buildCouplers() {
    for (let i = 0; i < this.options.coachCount; i++) {
      const coupler = new THREE.Group();

      this.addBox(
        coupler, this.materials.metal,
        0, 0.8, 0,
        1.2, 0.25, 0.35
      );

      this.addCylinder(
        coupler, this.materials.metal,
        0, 0.8, 0,
        0.22, 0.35
      ).rotation.x = Math.PI / 2;

      coupler.position.x = -13 - i * 20;
      this.group.add(coupler);
    }
  }

  // ==================================
  // MOVEMENT
  // ==================================

  setSpeed(speed) {
    this.speed = THREE.MathUtils.clamp(
      speed,
      0,
      this.maxSpeed
    );

    this.isStopped = this.speed === 0;
  }

  update(delta) {
    if (!Number.isFinite(delta) || delta < 0) return;

    if (this.speed > 0) {
      this.positionOnTrack +=
        (this.speed * delta) / this.totalLength;

      if (this.positionOnTrack >= 1) {
        this.positionOnTrack = 0;
      }

      this.isStopped = false;
      this.closeDoors();
    } else {
      this.isStopped = true;
    }

    this.animateDoors(delta);
    this.rotateWheels(delta);
    this.updatePosition();
  }

  updatePosition() {
    const point = this.curve.getPointAt(
      this.positionOnTrack
    );

    const tangent = this.curve.getTangentAt(
      this.positionOnTrack
    );

    this.group.position.copy(point);
    this.group.position.y += 0.15;

    const angle = Math.atan2(
      tangent.z,
      tangent.x
    );

    this.group.rotation.y = -angle;
  }

  rotateWheels(delta) {
    for (const wheel of this.wheels) {
      wheel.rotation.z += this.speed * delta * 0.8;
    }
  }

  // ==================================
  // STATION SYSTEM
  // ==================================

  stopAtStation(stationName) {
    const station = EGYPT_STATIONS.find(
      item => item.name === stationName
    );

    if (!station) {
      return false;
    }

    this.positionOnTrack = station.t;
    this.speed = 0;
    this.isStopped = true;
    this.currentStation = stationName;

    this.updatePosition();
    this.openDoors();

    return true;
  }

  openDoors() {
    if (!this.isStopped || !this.currentStation) {
      return false;
    }

    this.doorState = "opening";

    this.doors.forEach(door => {
      door.open = true;
      door.target = door.closedX + 0.8;
    });

    return true;
  }

  closeDoors() {
    this.doorState = "closing";

    this.doors.forEach(door => {
      door.open = false;
      door.target = door.closedX;
    });
  }

  animateDoors(delta) {
    for (const door of this.doors) {
      const current = door.object.position.x;
      const next = THREE.MathUtils.damp(
        current,
        door.target,
        5,
        delta
      );

      door.object.position.x = next;
    }

    if (this.doors.every(door =>
      Math.abs(door.object.position.x - door.target) < 0.02
    )) {
      this.doorState = this.doors.some(door => door.open)
        ? "open"
        : "closed";
    }
  }

  // ==================================
  // PASSENGERS
  // ==================================

  boardPassengers(count, coachIndex = null) {
    if (!this.isStopped || !this.currentStation) {
      return {
        boarded: 0,
        message: "القطار لازم يكون واقف في محطة"
      };
    }

    if (this.doorState !== "open") {
      return {
        boarded: 0,
        message: "افتح الأبواب أولا"
      };
    }

    let remaining = Math.max(0, Math.floor(count));
    let boarded = 0;

    const targets = coachIndex === null
      ? this.coaches
      : [this.coaches[coachIndex]];

    if (targets.some(item => !item)) {
      return { boarded: 0, message: "العربة غير موجودة" };
    }

    for (const coach of targets) {
      const available =
        coach.userData.capacity -
        coach.userData.passengers;

      const amount = Math.min(available, remaining);

      coach.userData.passengers += amount;
      boarded += amount;
      remaining -= amount;

      for (let i = 0; i < amount; i++) {
        this.addPassengerVisual(coach);
      }

      if (remaining <= 0) break;
    }

    return {
      boarded,
      remaining,
      totalPassengers: this.getPassengerCount()
    };
  }

  addPassengerVisual(coach) {
    // شكل مبسط للراكب داخل العربة
    // الظهور يتوزع على أماكن المقاعد
    const passenger = new THREE.Group();

    const clothes = this.materials.clothes[
      Math.floor(Math.random() * this.materials.clothes.length)
    ];

    this.addBox(
      passenger, clothes,
      0, 0.55, 0,
      0.35, 0.65, 0.3
    );

    this.meshSphere(
      passenger,
      this.materials.skin,
      0, 1, 0
    );

    const index = coach.userData.visualPassengers.length;

    passenger.position.set(
      -7 + (index % 7) * 2.2,
      1.15,
      index % 2 === 0 ? -0.7 : 0.7
    );

    coach.add(passenger);
    coach.userData.visualPassengers.push(passenger);

    this.passengers.push(passenger);
  }

  meshSphere(parent, material, x, y, z) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 10, 8),
      material
    );

    mesh.position.set(x, y, z);
    parent.add(mesh);

    return mesh;
  }

  getPassengerCount() {
    return this.coaches.reduce(
      (total, coach) =>
        total + coach.userData.passengers,
      0
    );
  }

  getCapacity() {
    return this.coaches.reduce(
      (total, coach) =>
        total + coach.userData.capacity,
      0
    );
  }

  getStatus() {
    return {
      speed: this.speed,
      station: this.currentStation,
      stopped: this.isStopped,
      doors: this.doorState,
      passengers: this.getPassengerCount(),
      capacity: this.getCapacity()
    };
  }

  dispose() {
    this.scene.remove(this.group);

    this.group.traverse(object => {
      if (object.geometry) object.geometry.dispose();
    });

    this.coaches = [];
    this.wheels = [];
    this.doors = [];
    this.passengers = [];
  }
  
        
