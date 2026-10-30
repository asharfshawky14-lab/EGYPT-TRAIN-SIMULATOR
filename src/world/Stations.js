
import * as THREE from "three";

export const EGYPT_STATIONS = [
  { name: "محطة مصر - رمسيس", t: 0.00, size: "large" },
  { name: "الجيزة", t: 0.055, size: "large" },
  { name: "العياط", t: 0.115, size: "small" },
  { name: "الواسطى", t: 0.175, size: "medium" },
  { name: "بني سويف", t: 0.235, size: "large" },
  { name: "ببا", t: 0.285, size: "small" },
  { name: "مغاغة", t: 0.345, size: "medium" },
  { name: "بني مزار", t: 0.395, size: "medium" },
  { name: "المنيا", t: 0.455, size: "large" },
  { name: "ملوي", t: 0.505, size: "medium" },
  { name: "أسيوط", t: 0.565, size: "large" },
  { name: "طهطا", t: 0.625, size: "medium" },
  { name: "سوهاج", t: 0.675, size: "large" },
  { name: "نجع حمادي", t: 0.735, size: "medium" },
  { name: "قنا", t: 0.785, size: "large" },
  { name: "الأقصر", t: 0.845, size: "large" },
  { name: "إسنا", t: 0.895, size: "medium" },
  { name: "إدفو", t: 0.935, size: "medium" },
  { name: "كوم أمبو", t: 0.965, size: "medium" },
  { name: "أسوان", t: 1.00, size: "large" }
];

export class Stations {
  constructor(scene, railwayCurve, options = {}) {
    if (!scene || !railwayCurve) {
      throw new Error("Stations requires a scene and railway curve");
    }

    this.scene = scene;
    this.curve = railwayCurve;
    this.group = new THREE.Group();
    this.group.name = "EgyptStations";

    this.people = [];
    this.stationObjects = [];

    this.options = {
      peoplePerSmall: 3,
      peoplePerMedium: 6,
      peoplePerLarge: 12,
      ...options
    };

    this.materials = {
      platform: this.mat(0xb9b5a9),
      platformEdge: this.mat(0xe3d9bb),
      concrete: this.mat(0x99958c),
      roof: this.mat(0x9da8ad),
      roofDark: this.mat(0x53636b),
      metal: this.mat(0x65727a, 0.65),
      seat: this.mat(0x496b78),
      kiosk: this.mat(0xd7c39b),
      kioskDark: this.mat(0x8d6545),
      glass: new THREE.MeshStandardMaterial({
        color: 0x9fc9d4,
        transparent: true,
        opacity: 0.55,
        roughness: 0.2
      }),
      sign: this.mat(0x174c3b),
      white: this.mat(0xf2eee4),
      black: this.mat(0x262626),
      skin: this.mat(0xb98059),
      clothes: [
        this.mat(0x315c78),
        this.mat(0x8d4538),
        this.mat(0x637b43),
        this.mat(0x45465c),
        this.mat(0xc18b43)
      ],
      light: new THREE.MeshStandardMaterial({
        color: 0xffe4a1,
        emissive: 0xffc75e,
        emissiveIntensity: 0.6
      })
    };

    this.createStations(EGYPT_STATIONS);
    this.scene.add(this.group);
  }

  mat(color, roughness = 0.85) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness
    });
  }

  mesh(geometry, material, position, parent) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(...position);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  box(parent, material, x, y, z, w, h, d) {
    return this.mesh(
      new THREE.BoxGeometry(w, h, d),
      material,
      [x, y, z],
      parent
    );
  }

  cylinder(parent, material, x, y, z, radius, height) {
    return this.mesh(
      new THREE.CylinderGeometry(
        radius,
        radius,
        height,
        10
      ),
      material,
      [x, y, z],
      parent
    );
  }

  createStations(definitions) {
    definitions.forEach((data, index) => {
      const station = this.createStation(data, index);
      this.group.add(station);
      this.stationObjects.push(station);
    });
  }

  createStation(data, index) {
    const point = this.curve.getPointAt(data.t);
    const tangent = this.curve.getTangentAt(data.t);

    const station = new THREE.Group();
    station.name = `Station_${index}_${data.name}`;
    station.userData.stationName = data.name;
    station.userData.stationType = data.size;

    station.position.copy(point);
    station.position.y += 0.05;

    const angle = Math.atan2(tangent.z, tangent.x);
    station.rotation.y = -angle;

    const dimensions = {
      small: { length: 75, people: this.options.peoplePerSmall },
      medium: { length: 115, people: this.options.peoplePerMedium },
      large: { length: 175, people: this.options.peoplePerLarge }
    };

    const config = dimensions[data.size] || dimensions.small;

    this.createPlatform(station, config.length);
    this.createCanopy(station, config.length);
    this.createSeats(station, config.length);
    this.createKiosk(station, config.length);
    this.createSign(station, data.name);
    this.createLights(station, config.length);
    this.createPeople(station, config.people, config.length);

    return station;
  }

  createPlatform(parent, length) {
    // الرصيف بعيد عن محور السكة
    const z = 7;

    this.box(
      parent,
      this.materials.platform,
      0, 0.55, z,
      length, 1.1, 7
    );

    // حافة الرصيف
    this.box(
      parent,
      this.materials.platformEdge,
      0, 1.12, 3.65,
      length, 0.12, 0.35
    );

    // خطوط تقسيم أرضية الرصيف
    for (let x = -length / 2 + 5; x < length / 2; x += 5) {
      this.box(
        parent,
        this.materials.concrete,
        x, 1.115, 7,
        0.08, 0.025, 6.2
      );
    }
  }

  createCanopy(parent, length) {
    const roofLength = length * 0.55;

    // أعمدة المظلة
    for (let x = -roofLength / 2; x <= roofLength / 2; x += 12) {
      for (const z of [5, 11]) {
        this.box(
          parent,
          this.materials.metal,
          x, 3.4, z,
          0.25, 4.5, 0.25
        );
      }
    }

    // السقف
    this.box(
      parent,
      this.materials.roof,
      0, 5.75, 8,
      roofLength, 0.45, 7
    );

    this.box(
      parent,
      this.materials.roofDark,
      0, 5.45, 8,
      roofLength + 1, 0.15, 7.2
    );
  }

  createSeats(parent, length) {
    const count = Math.max(2, Math.floor(length / 28));

    for (let i = 0; i < count; i++) {
      const x = -length / 2 + 14 + i * 28;

      const seat = new THREE.Group();

      this.box(
        seat, this.materials.seat,
        0, 1.65, 0,
        4, 0.35, 1.1
      );

      this.box(
        seat, this.materials.seat,
        0, 2.25, -0.4,
        4, 1.1, 0.25
      );

      for (const side of [-1.6, 1.6]) {
        this.box(
          seat, this.materials.metal,
          side, 1.2, 0,
          0.2, 1.2, 0.2
        );
      }

      seat.position.set(x, 0, 10);
      parent.add(seat);
    }
  }

  createKiosk(parent, length) {
    const kiosk = new THREE.Group();
    kiosk.name = "FoodAndDrinkKiosk";

    this.box(
      kiosk, this.materials.kiosk,
      0, 2, 0,
      9, 4, 6
    );

    this.box(
      kiosk, this.materials.kioskDark,
      0, 3.25, 3.05,
      8.5, 0.8, 0.25
    );

    // واجهة زجاجية
    this.box(
      kiosk, this.materials.glass,
      0, 1.8, 3.1,
      7, 1.8, 0.12
    );

    // كاونتر البيع
    this.box(
      kiosk, this.materials.concrete,
      0, 1.1, 3.35,
      8, 0.3, 0.8
    );

    // لافتة الكشك
    this.box(
      kiosk, this.materials.sign,
      0, 3.85, 3.2,
      8, 0.75, 0.2
    );

    kiosk.position.set(length * 0.3, 1.1, 13);
    parent.add(kiosk);
  }

  createSign(parent, name) {
    const sign = new THREE.Group();
    sign.name = "StationNameSign";

    this.box(
      sign, this.materials.sign,
      0, 5, 0,
      13, 2.1, 0.4
    );

    // مساحة اللوحة؛ يمكن لاحقاً استبدالها بنص عربي حقيقي
    this.box(
      sign, this.materials.white,
      0, 5, 0.23,
      11.5, 0.12, 0.04
    );

    for (const x of [-5.8, 5.8]) {
      this.box(
        sign, this.materials.metal,
        x, 2.5, 0,
        0.25, 5, 0.25
      );
    }

    sign.position.set(0, 0, 12);
    sign.userData.text = name;
    sign.userData.stationName = name;

    parent.add(sign);
  }

  createLights(parent, length) {
    for (let x = -length / 2 + 12; x <= length / 2; x += 32) {
      const pole = new THREE.Group();

      this.cylinder(
        pole, this.materials.metal,
        0, 3, 0,
        0.12, 6
      );

      this.box(
        pole, this.materials.light,
        0, 6.1, 0,
        0.8, 0.3, 0.5
      );

      pole.position.set(x, 0, 12);
      parent.add(pole);
    }
  }

  createPeople(parent, count, length) {
    for (let i = 0; i < count; i++) {
      const person = this.createPerson();

      const x = THREE.MathUtils.randFloat(
        -length * 0.4,
        length * 0.4
      );

      const z = THREE.MathUtils.randFloat(5.5, 11);

      person.position.set(x, 1.15, z);
      person.rotation.y = Math.random() * Math.PI * 2;

      parent.add(person);
      this.people.push(person);
    }
  }

  createPerson() {
    const person = new THREE.Group();
    person.name = "StationPassenger";

    const clothes = this.materials.clothes[
      Math.floor(Math.random() * this.materials.clothes.length)
    ];

    // الجسم
    this.mesh(
      new THREE.CylinderGeometry(0.35, 0.42, 1.15, 8),
      clothes,
      [0, 1.05, 0],
      person
    );

    // الرأس
    this.mesh(
      new THREE.SphereGeometry(0.28, 12, 10),
      this.materials.skin,
      [0, 1.85, 0],
      person
    );

    // الساقان
    for (const x of [-0.16, 0.16]) {
      this.box(
        person, this.materials.black,
        x, 0.35, 0,
        0.2, 0.7, 0.25
      );
    }

    // الذراعان
    for (const x of [-0.43, 0.43]) {
      this.box(
        person, clothes,
        x, 1.05, 0,
        0.18, 0.8, 0.2
      );
    }

    person.userData.type = "passenger";
    return person;
  }

  getStation(name) {
    return this.stationObjects.find(
      station => station.userData.stationName === name
    ) || null;
  }

  getAllStations() {
    return this.stationObjects;
  }

  dispose() {
    this.scene.remove(this.group);

    this.group.traverse(object => {
      if (object.geometry) object.geometry.dispose();
    });

    this.stationObjects = [];
    this.people = [];
  
  }
      
