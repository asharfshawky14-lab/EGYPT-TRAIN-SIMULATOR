
import * as THREE from "three";

export class MapWorld {
  constructor(scene) {
    this.scene = scene;
    this.world = new THREE.Group();

    this.world.name = "EgyptWorld";
    this.scene.add(this.world);

    this.materials = {
      ground: new THREE.MeshStandardMaterial({
        color: 0xb5a77c,
        roughness: 1
      }),
      field: new THREE.MeshStandardMaterial({
        color: 0x78934e,
        roughness: 1
      }),
      water: new THREE.MeshStandardMaterial({
        color: 0x368da8,
        roughness: 0.25,
        metalness: 0.1
      }),
      rail: new THREE.MeshStandardMaterial({
        color: 0x777d82,
        metalness: 0.8,
        roughness: 0.3
      }),
      sleeper: new THREE.MeshStandardMaterial({
        color: 0x55402e,
        roughness: 1
      }),
      ballast: new THREE.MeshStandardMaterial({
        color: 0x77736a,
        roughness: 1
      }),
      road: new THREE.MeshStandardMaterial({
        color: 0x454545,
        roughness: 1
      }),
      bridge: new THREE.MeshStandardMaterial({
        color: 0x858b91,
        roughness: 0.8
      }),
      barrier: new THREE.MeshStandardMaterial({
        color: 0xe5e5e5,
        roughness: 0.7
      }),
      red: new THREE.MeshStandardMaterial({
        color: 0xd52d25
      })
    };

    this.trackPoints = [
      [-4500, 0, 0],
      [-3500, 0, -120],
      [-2500, 0, 100],
      [-1500, 0, 220],
      [-500, 0, 100],
      [500, 0, -100],
      [1500, 0, -220],
      [2500, 0, -100],
      [3500, 0, 120],
      [4500, 0, 0]
    ];

    this.trackCurve = new THREE.CatmullRomCurve3(
      this.trackPoints.map(
        p => new THREE.Vector3(p[0], p[1], p[2])
      )
    );

    this.buildTerrain();
    this.buildFields();
    this.buildWater();
    this.buildRailway();
    this.buildBridges();
    this.buildLevelCrossings();

    return this.world;
  }

  addMesh(geometry, material, position, parent = this.world) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  buildTerrain() {
    const geometry = new THREE.PlaneGeometry(
      11000,
      5000,
      180,
      100
    );

    const positions = geometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i);

      const hills =
        Math.sin(x * 0.0012) * 16 +
        Math.cos(z * 0.002) * 9 +
        Math.sin((x + z) * 0.0008) * 12;

      positions.setZ(i, hills);
    }

    geometry.computeVertexNormals();
    geometry.rotateX(-Math.PI / 2);

    const ground = new THREE.Mesh(
      geometry,
      this.materials.ground
    );

    ground.receiveShadow = true;
    this.world.add(ground);
  }

  buildFields() {
    for (let i = 0; i < 35; i++) {
      const x = -4200 + i * 245;

      const field = this.addMesh(
        new THREE.BoxGeometry(180, 0.5, 550),
        this.materials.field,
        [x, 0.3, 650]
      );

      field.rotation.y = (i % 3) * 0.025;
    }

    for (let i = 0; i < 25; i++) {
      const x = -4000 + i * 320;

      this.addMesh(
        new THREE.BoxGeometry(240, 0.5, 450),
        this.materials.field,
        [x, 0.3, -650]
      );
    }
  }

  buildWater() {
    // مجرى مائي رئيسي تجريبي
    const river = this.addMesh(
      new THREE.BoxGeometry(11000, 1, 180),
      this.materials.water,
      [0, -0.5, 1250]
    );

    river.name = "MainRiver";

    // بحيرات ومسطحات مائية
    const lakes = [
      [-3000, 0, 1850, 450, 250],
      [-1000, 0, -1550, 380, 220],
      [1300, 0, 1750, 520, 300],
      [3300, 0, -1600, 420, 250]
    ];

    lakes.forEach(([x, y, z, width, depth]) => {
      const lake = this.addMesh(
        new THREE.CircleGeometry(1, 48),
        this.materials.water,
        [x, y, z]
      );

      lake.rotation.x = -Math.PI / 2;
      lake.scale.set(width, depth, 1);
      lake.name = "Lake";
    });
  }

  buildRailway() {
    const railway = new THREE.Group();
    railway.name = "Railway";
    this.world.add(railway);

    // طبقة الحصى أسفل القضبان
    const ballastGeometry = new THREE.BoxGeometry(
      1,
      0.35,
      4.8
    );

    // القضبان
    const railGeometry = new THREE.BoxGeometry(
      1,
      0.25,
      0.16
    );

    // العوارض
    const sleeperGeometry = new THREE.BoxGeometry(
      2.8,
      0.18,
      0.28
    );

    const railLength = 9000;
    const sleeperCount = 1500;

    for (let i = 0; i < sleeperCount; i++) {
      const t = i / (sleeperCount - 1);
      const point = this.trackCurve.getPointAt(t);
      const tangent = this.trackCurve.getTangentAt(t);

      const angle = Math.atan2(
        tangent.z,
        tangent.x
      );

      const sleeper = new THREE.Mesh(
        sleeperGeometry,
        this.materials.sleeper
      );

      sleeper.position.copy(point);
      sleeper.position.y += 0.25;
      sleeper.rotation.y = -angle;

      railway.add(sleeper);
    }

    const railOffsets = [-0.72, 0.72];

    railOffsets.forEach(offset => {
      const railPoints = [];

      for (let i = 0; i <= 1000; i++) {
        const point = this.trackCurve.getPointAt(i / 1000);
        const tangent = this.trackCurve.getTangentAt(i / 1000);

        const side = new THREE.Vector3(
          -tangent.z,
          0,
          tangent.x
        ).normalize();

        point.addScaledVector(side, offset);
        point.y += 0.48;

        railPoints.push(point);
      }

      const curve = new THREE.CatmullRomCurve3(railPoints);

      const geometry = new THREE.TubeGeometry(
        curve,
        2000,
        0.09,
        8,
        false
      );

      const rail = new THREE.Mesh(
        geometry,
        this.materials.rail
      );

      railway.add(rail);
    });

    railway.userData.curve = this.trackCurve;
    railway.userData.length = railLength;
  }

  buildBridges() {
    // مواقع تجريبية لكباري عبور المياه
    const bridgePositions = [
      [-3000, 1250],
      [1200, 1250],
      [3200, 1250]
    ];

    bridgePositions.forEach(([x, z]) => {
      const bridge = new THREE.Group();
      bridge.name = "RailwayBridge";

      this.addMesh(
        new THREE.BoxGeometry(240, 1.2, 9),
        this.materials.bridge,
        [0, 2, 0],
        bridge
      );

      for (let i = -2; i <= 2; i++) {
        this.addMesh(
          new THREE.BoxGeometry(2, 9, 2),
          this.materials.bridge,
          [i * 45, -3, 0],
          bridge
        );
      }

      bridge.position.set(x, 0, z);
      this.world.add(bridge);
    });
  }

  buildLevelCrossings() {
    const crossingPositions = [
      [-3200, -120],
      [-1800, 220],
      [0, 0],
      [1900, -200],
      [3400, 120]
    ];

    crossingPositions.forEach(([x, z]) => {
      const crossing = new THREE.Group();
      crossing.name = "LevelCrossing";

      this.addMesh(
        new THREE.BoxGeometry(32, 0.3, 10),
        this.materials.road,
        [0, 0.65, 0],
        crossing
      );

      [-1, 1].forEach(side => {
        const barrier = this.addMesh(
          new THREE.BoxGeometry(8, 0.3, 0.3),
          this.materials.barrier,
          [side * 13, 2, side * 7],
          crossing
        );

        barrier.rotation.y = side * 0.15;
        barrier.userData.isBarrier = true;
      });

      this.addMesh(
        new THREE.BoxGeometry(0.5, 3, 0.5),
        this.materials.red,
        [-13, 1.5, -7],
        crossing
      );

      this.addMesh(
        new THREE.BoxGeometry(0.5, 3, 0.5),
        this.materials.red,
        [13, 1.5, 7],
        crossing
      );

      crossing.position.set(x, 0, z);
      this.world.add(crossing);
    });
  }
}
