import * as THREE from "three";
// Drawer module library for My Kitchen Pro.
// The caller sets buildingModuleId before invoking buildDrawerModule().
export function buildDrawerModule({ THREE, addPart, addRoundPart, width = 800, height = 720, depth = 520, legsHeight = 100, variant = "two" }) {
  const t = 16;
  const bottomY = legsHeight;
  const sideHeight = height - t;
  const sideY = bottomY + t + sideHeight / 2;
  const innerWidth = width - 2 * t;
  const left = addPart("panel", "Боковина левая", t, sideHeight, depth, -width / 2 + t / 2, sideY, 0, "oak", t);
  const moduleId = left.userData.moduleId;

  const add = (type, name, w, h, d, x, y, z, material = "oak", thickness = 16, extra = {}) => {
    const mesh = addPart(type, name, w, h, d, x, y, z, material, thickness);
    mesh.userData.moduleId = moduleId;
    mesh.userData.moduleWidth = width;
    mesh.userData.moduleHeight = height;
    mesh.userData.moduleDepth = depth;
    Object.assign(mesh.userData, extra);
    return mesh;
  };

  add("panel", "Боковина правая", t, sideHeight, depth, width / 2 - t / 2, sideY, 0);
  add("panel", "Дно накладное", width, t, depth, 0, bottomY + t / 2, 0);
  add("back", "Задняя стенка", width - 3, height - 3, 4, 0, bottomY + (height - 3) / 2, -depth / 2 + 2, "milk", 4);
  const topY = bottomY + height;
  add("panel", "Верхнее усиление переднее", innerWidth, t, 100, 0, topY - t / 2, depth / 2 - 50);
  add("panel", "Верхнее усиление заднее", innerWidth, t, 100, 0, topY - t / 2, -depth / 2 + 50);

  if (legsHeight > 0) {
    for (const x of [-width / 2 + 55, width / 2 - 55]) {
      for (const z of [-depth / 2 + 55, depth / 2 - 55]) {
        addRoundPart("Опора Volpato 31 — основание", 48, 10, x, 5, z, "graphite");
        addRoundPart("Опора Volpato 31 — стойка", 28, 82, x, 51, z, "graphite");
        add("leg", "Опора Volpato 31 — верхнее крепление", 46, 8, 46, x, 96, z, "graphite", 8);
      }
    }
  }

  const perimeterGap = 3;
  const betweenGap = 4;
  const totalFaceHeight = height - perimeterGap;
  let faceHeights;
  if (variant === "two") {
    const each = (totalFaceHeight - betweenGap) / 2;
    faceHeights = [each, each];
  } else if (variant === "large-small-small") {
    const available = totalFaceHeight - 2 * betweenGap;
    const lower = Math.round(height / 2 - 3);
    const upper = (available - lower) / 2;
    faceHeights = [lower, upper, upper];
  } else if (variant === "three") {
    const each = (totalFaceHeight - 2 * betweenGap) / 3;
    faceHeights = [each, each, each];
  } else {
    throw new Error("Неизвестная схема ящиков: " + variant);
  }

  const faceWidth = width - 3;
  const faceBottom = bottomY + perimeterGap / 2;
  const frontZ = depth / 2 + 8;
  const boxWidth = innerWidth - 26; // 13 mm clearance per side for standard ball-bearing slides.
  const boxDepth = Math.min(450, depth - 70); // 450 mm slide in a 520 mm deep cabinet.
  const boxZ = depth / 2 - boxDepth / 2;
  let cursorY = faceBottom;

  faceHeights.forEach((faceHeight, index) => {
    const faceY = cursorY + faceHeight / 2;
    const drawerId = moduleId + "-drawer-" + (index + 1);
    const boxHeight = faceHeight >= 300 ? 180 : faceHeight >= 220 ? 150 : 100;
    const face = add("facade", "Фасад ящика " + (index + 1), faceWidth, faceHeight, 16, 0, faceY, frontZ, "milk", 16, {
      drawerId, drawerFront: true, drawerIndex: index + 1, drawerOpenProgress: 0
    });
    const drawerExtra = { drawerId, drawerIndex: index + 1, drawerOpenProgress: 0 };
    const sideX = boxWidth / 2 - 8;
    const boxY = faceY;
    add("drawerPart", "Ящик " + (index + 1) + " — боковина левая", 16, boxHeight, boxDepth, -sideX, boxY, boxZ, "oak", 16, drawerExtra);
    add("drawerPart", "Ящик " + (index + 1) + " — боковина правая", 16, boxHeight, boxDepth, sideX, boxY, boxZ, "oak", 16, drawerExtra);
    add("drawerPart", "Ящик " + (index + 1) + " — задняя стенка", boxWidth - 32, boxHeight, 16, 0, boxY, boxZ - boxDepth / 2 + 8, "oak", 16, drawerExtra);
    add("drawerPart", "Ящик " + (index + 1) + " — дно 3 мм", boxWidth - 32, 3, boxDepth - 16, 0, boxY - boxHeight / 2 + 1.5, boxZ + 8, "milk", 3, drawerExtra);
    cursorY += faceHeight + betweenGap;
  });

  return {
    moduleId,
    drawerCount: faceHeights.length,
    dimensions: {
      carcass: { width, height, depth },
      drawerOuterWidth: boxWidth,
      drawerDepth: boxDepth,
      sideClearance: 13,
      slideLength: boxDepth,
      faceHeights: faceHeights.map(Math.round),
      drawerBoxHeights: faceHeights.map(h => h >= 300 ? 180 : h >= 220 ? 150 : 100)
    }
  };
}

export function toggleDrawer(parts, front) {
  const drawerId = front?.userData?.drawerId;
  if (!drawerId) return false;
  const members = parts.filter(p => p.userData.drawerId === drawerId);
  if (!members.length || members.some(p => p.userData.drawerAnimating)) return false;

  const progress = front.userData.drawerOpenProgress || 0;
  const from = progress;
  const to = progress < 0.5 ? 1 : 0;
  const travel = Math.min(350, (front.userData.drawerDepth || 450) - 80);
  const angle = front.rotation.y || 0;
  const direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
  const start = members.map(mesh => {
    const current = mesh.position.clone();
    const closed = current.clone().addScaledVector(direction, -travel * from);
    mesh.userData.drawerAnimating = true;
    return { mesh, closed };
  });
  const started = performance.now();
  const duration = 420;

  function frame(now) {
    const t = Math.min(1, (now - started) / duration);
    const eased = t * t * (3 - 2 * t);
    const value = from + (to - from) * eased;
    start.forEach(({ mesh, closed }) => mesh.position.copy(closed).addScaledVector(direction, travel * value));
    if (t < 1) {
      requestAnimationFrame(frame);
      return;
    }
    members.forEach(mesh => {
      mesh.userData.drawerOpenProgress = to;
      mesh.userData.drawerAnimating = false;
    });
  }
  requestAnimationFrame(frame);
  return true;
}
