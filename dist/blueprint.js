/** Procedural, conceptual warehouse study. Geometry does not specify structural profiles. */
export async function initBlueprint(host) {
  if (!host) return null;

  const scope = host.closest('section') || document;
  const status = scope.querySelector('#model-status') || document.querySelector('#model-status');
  const range = scope.querySelector('#explode-range') || document.querySelector('#explode-range');
  const reset = scope.querySelector('#model-reset') || document.querySelector('#model-reset');
  const roofToggle = scope.querySelector('#roof-toggle') || document.querySelector('#roof-toggle');
  const buttons = [...scope.querySelectorAll('[data-camera]')];
  const fallback = host.querySelector('img');
  const fallbackDisplay = fallback?.style.display || '';
  const mobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const events = new AbortController();
  const cleanups = [];
  const presets = {
    facade: { position: [43, 27, -62], target: [0, 4.5, 0], wall: .72, roof: .78, label: 'Fachada · duas portas de 5 × 5 m' },
    structure: { position: [-42, 26, -55], target: [0, 5.5, 0], wall: .10, roof: .14, label: 'Estrutura · pórticos, treliças e contraventamentos' },
    interior: { position: [-9, 8.5, -14], target: [3, 4, 10], wall: .04, roof: .04, label: 'Interior · vão operacional e circulação' },
    mezzanine: { position: [-12, 12, 1], target: [7.5, 4.4, 14], wall: .05, roof: .03, label: 'Mezanino · estudo de 80 m² e apoio sanitário' },
    docks: { position: [45, 19, 30], target: [14, 3.5, 9], wall: .38, roof: .42, label: 'Docas · dois pontos de carga na lateral direita' },
    aerial: { position: [45, 66, -49], target: [0, 2.5, 0], wall: .25, roof: .20, label: 'Implantação · 30 × 40 m' }
  };
  let view = 'facade';
  let explosionTarget = 0;
  let explosion = 0;
  let roofVisible = roofToggle ? roofToggle.checked : true;
  let engine = null;
  let launching = false;
  let disposed = false;
  let contextLost = false;
  let visible = true;
  let frame = 0;
  let lastTime = 0;
  let startButton = null;

  function say(message) { if (status) status.textContent = message; }

  function setExplosion(value) {
    explosionTarget = Math.min(1, Math.max(0, Number(value) / 100 || 0));
    if (range) range.value = String(Math.round(explosionTarget * 100));
    const output = scope.querySelector('#explode-output');
    if (output) output.textContent = `${Math.round(explosionTarget * 100)}%`;
    engine?.fitExplosion(explosionTarget);
    wake();
  }

  function setCamera(key) {
    if (!presets[key]) return;
    view = key;
    buttons.forEach(button => {
      const active = button.dataset.camera === key;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    say(presets[key].label);
    engine?.chooseCamera(key);
    wake();
  }

  function wake() {
    if (!engine || disposed || contextLost || !visible || document.hidden || frame) return;
    lastTime = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function tick(now) {
    frame = 0;
    if (!engine || disposed || contextLost || !visible || document.hidden) return;
    const dt = Math.min((now - lastTime) / 1000, .05);
    lastTime = now;
    const blend = reducedMotion ? 1 : 1 - Math.exp(-dt * 7);
    explosion += (explosionTarget - explosion) * blend;
    engine.draw(dt, blend, explosion);
    frame = requestAnimationFrame(tick);
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  async function launch() {
    if (disposed || engine || launching) return;
    launching = true;
    if (startButton) {
      startButton.disabled = true;
      startButton.textContent = 'Abrindo modelo…';
    }
    say('Preparando o estudo tridimensional…');
    let renderer;
    try {
      const THREE = await import('./vendor/three.module.js');
      if (disposed) return;
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !mobile, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1 : 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      const canvas = renderer.domElement;
      canvas.className = 'blueprint-webgl';
      canvas.tabIndex = 0;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', 'Modelo conceitual interativo de galpão de 30 por 40 metros. Arraste para girar, use a roda para aproximar e as setas do teclado para mudar o ângulo.');
      Object.assign(canvas.style, { position: 'absolute', inset: '0', display: 'block', width: '100%', height: '100%', touchAction: 'none', cursor: 'grab' });
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      host.appendChild(canvas);
      host.dataset.modelState = 'ready';

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(37, 1, .12, 320);
      const target = new THREE.Vector3();
      const cameraGoal = new THREE.Vector3();
      const targetGoal = new THREE.Vector3();
      const model = new THREE.Group();
      scene.add(model);
      scene.add(new THREE.HemisphereLight(0xc7e5ff, 0x17314c, 2.4));
      const key = new THREE.DirectionalLight(0xf0f7ff, 3.6);
      key.position.set(-25, 50, -30);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xf2b544, 1.7);
      rim.position.set(40, 18, 30);
      scene.add(rim);
      const fill = new THREE.DirectionalLight(0x5d9ede, 1.6);
      fill.position.set(0, 10, -35);
      scene.add(fill);

      const cube = new THREE.BoxGeometry(1, 1, 1);
      const cubeEdges = new THREE.EdgesGeometry(cube);
      const outline = new THREE.LineBasicMaterial({ color: 0xb8d9ef, transparent: true, opacity: .48 });
      const subduedOutline = new THREE.LineBasicMaterial({ color: 0x7895b0, transparent: true, opacity: .26 });
      const roofOutline = new THREE.LineBasicMaterial({ color: 0xb3cbdc, transparent: true, opacity: .45 });
      const wallOutline = new THREE.LineBasicMaterial({ color: 0x95b7d2, transparent: true, opacity: .35 });
      const steel = new THREE.MeshStandardMaterial({ color: 0x6f9fc2, metalness: .72, roughness: .34 });
      const foundationMaterial = new THREE.MeshStandardMaterial({ color: 0x4e6378, roughness: .9 });
      const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x25455f, metalness: .12, roughness: .76 });
      const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x2b668d, metalness: .32, roughness: .6, transparent: true, opacity: .72, depthWrite: false, side: THREE.DoubleSide });
      const blockMaterial = new THREE.MeshStandardMaterial({ color: 0x7690a3, roughness: .95, transparent: true, opacity: .72, depthWrite: false });
      const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x7a9daf, metalness: .65, roughness: .42, transparent: true, opacity: .78, depthWrite: false, side: THREE.DoubleSide });
      const officeMaterial = new THREE.MeshStandardMaterial({ color: 0xadc3d1, roughness: .72 });
      const glass = new THREE.MeshStandardMaterial({ color: 0xa9dce8, metalness: .15, roughness: .18, transparent: true, opacity: .20, depthWrite: false, side: THREE.DoubleSide });
      const amber = new THREE.MeshStandardMaterial({ color: 0xf2b544, metalness: .3, roughness: .48 });
      const dark = new THREE.MeshStandardMaterial({ color: 0x162c40, roughness: .6 });
      const wallMaterials = [wallMaterial, blockMaterial];

      const parts = {};
      const offsets = {
        foundation: [0, 0, 0], floor: [0, 1.5, 0], frame: [0, 4, 0],
        walls: [0, 5, 0], roof: [0, 13, 0], docks: [7, 1.5, 0], mezzanine: [-7, 6.5, 0]
      };
      Object.keys(offsets).forEach(name => {
        parts[name] = new THREE.Group();
        parts[name].name = name;
        model.add(parts[name]);
      });

      function box(parent, size, position, material, edgeMaterial = outline) {
        const mesh = new THREE.Mesh(cube, material);
        mesh.scale.set(...size);
        mesh.position.set(...position);
        parent.add(mesh);
        if (edgeMaterial) {
          const edges = new THREE.LineSegments(cubeEdges, edgeMaterial);
          mesh.add(edges);
        }
        return mesh;
      }

      const up = new THREE.Vector3(0, 1, 0);
      function member(parent, from, to, thickness = .17, material = steel, edgeMaterial = outline) {
        const a = new THREE.Vector3(...from);
        const b = new THREE.Vector3(...to);
        const delta = b.clone().sub(a);
        const mesh = box(parent, [thickness, delta.length(), thickness], a.clone().add(b).multiplyScalar(.5).toArray(), material, edgeMaterial);
        mesh.quaternion.setFromUnitVectors(up, delta.normalize());
        return mesh;
      }

      function line(parent, points, color = 0xf2b544, opacity = .7) {
        const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)));
        const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
        const result = new THREE.Line(geometry, material);
        parent.add(result);
        return result;
      }

      function label(parent, text, position, width = 4.8, color = '#d1e5f4') {
        const surface = document.createElement('canvas');
        surface.width = 512;
        surface.height = 96;
        const context = surface.getContext('2d');
        context.fillStyle = 'rgba(6,26,51,.92)';
        context.fillRect(0, 0, 512, 96);
        context.font = '500 36px monospace';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = color;
        context.fillText(text, 256, 49);
        const texture = new THREE.CanvasTexture(surface);
        texture.colorSpace = THREE.SRGBColorSpace;
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, sizeAttenuation: true }));
        sprite.position.set(...position);
        sprite.scale.set(width, width * 96 / 512, 1);
        sprite.renderOrder = 5;
        parent.add(sprite);
        return sprite;
      }

      // 30 × 40 m slab and isolated conceptual foundation blocks.
      box(parts.floor, [30, .28, 40], [0, -.14, 0], floorMaterial, subduedOutline);
      const portalZ = [-20, -12, -4, 4, 12, 20];
      portalZ.forEach(z => {
        [-15, 15].forEach(x => {
          box(parts.foundation, [2.3, .9, 2.3], [x, -.82, z], foundationMaterial, subduedOutline);
          box(parts.foundation, [.75, .35, .75], [x, -.23, z], foundationMaterial, subduedOutline);
          member(parts.frame, [x, .02, z], [x, 10.45, z], .25);
          box(parts.frame, [.65, .10, .65], [x, .06, z], steel);
        });
        const ridge = 12.05;
        member(parts.frame, [-15, 10.45, z], [0, ridge, z], .24);
        member(parts.frame, [0, ridge, z], [15, 10.45, z], .24);
        member(parts.frame, [-15, 10.05, z], [15, 10.05, z], .17);
        // Triangulated roof web visually describes a truss, not a calculated profile.
        for (let x = -15; x < 15; x += 3) {
          const next = x + 3;
          const topY = 10.45 + (1 - Math.abs(next) / 15) * 1.6;
          member(parts.frame, [x, 10.05, z], [next, topY, z], .09);
          member(parts.frame, [next, 10.05, z], [next, topY, z], .08);
        }
      });
      [-15, 0, 15].forEach(x => member(parts.frame, [x, x ? 10.45 : 12.05, -20], [x, x ? 10.45 : 12.05, 20], .15));
      [-10, -5, 5, 10].forEach(x => {
        const y = 10.45 + (1 - Math.abs(x) / 15) * 1.6;
        member(parts.frame, [x, y, -20], [x, y, 20], .11);
      });
      [-15, 15].forEach(x => {
        [[-20, -12], [12, 20]].forEach(([a, b]) => {
          member(parts.frame, [x, .2, a], [x, 10.4, b], .065);
          member(parts.frame, [x, 10.4, a], [x, .2, b], .065);
        });
      });
      [[-20, -12], [12, 20]].forEach(([a, b]) => {
        member(parts.frame, [-15, 10.5, a], [15, 10.5, b], .065);
        member(parts.frame, [15, 10.5, a], [-15, 10.5, b], .065);
      });

      const faces = {};
      const faceOffsets = { front: [0, 0, -5], back: [0, 0, 5], left: [-5, 0, 0], right: [5, 0, 0] };
      Object.keys(faceOffsets).forEach(name => {
        faces[name] = new THREE.Group();
        parts.walls.add(faces[name]);
      });
      // Masonry to 5 m; front openings remain precisely 5 × 5 m.
      [[-15, -9.5], [-4.5, 4.5], [9.5, 15]].forEach(([a, b]) => box(faces.front, [b - a, 5, .24], [(a + b) / 2, 2.5, -20], blockMaterial, wallOutline));
      box(faces.front, [30, 5.45, .16], [0, 7.725, -20], wallMaterial, wallOutline);
      box(faces.back, [30, 5, .24], [0, 2.5, 20], blockMaterial, wallOutline);
      box(faces.back, [30, 5.45, .16], [0, 7.725, 20], wallMaterial, wallOutline);
      box(faces.left, [.24, 5, 40], [-15, 2.5, 0], blockMaterial, wallOutline);
      box(faces.left, [.16, 5.45, 40], [-15, 7.725, 0], wallMaterial, wallOutline);
      [[-20, 3.5], [8.5, 11.5], [16.5, 20]].forEach(([a, b]) => box(faces.right, [.24, 5, b - a], [15, 2.5, (a + b) / 2], blockMaterial, wallOutline));
      box(faces.right, [.16, 5.45, 40], [15, 7.725, 0], wallMaterial, wallOutline);
      [-7, 7].forEach(x => {
        member(faces.front, [x - 2.5, 0, -20.18], [x - 2.5, 5, -20.18], .19, steel);
        member(faces.front, [x + 2.5, 0, -20.18], [x + 2.5, 5, -20.18], .19, steel);
        member(faces.front, [x - 2.5, 5, -20.18], [x + 2.5, 5, -20.18], .19, steel);
        box(faces.front, [5, .50, .12], [x, 4.75, -20.1], dark, subduedOutline);
        [-2.75, 2.75].forEach(dx => box(faces.front, [.2, 1.1, .2], [x + dx, .55, -20.8], amber, null));
      });
      // Narrow cladding ribs describe material direction without expensive textures.
      for (let x = -14.5; x < 15; x += 1) {
        line(faces.front, [[x, 5.08, -20.10], [x, 10.35, -20.10]], 0x96bdd7, .22);
        line(faces.back, [[x, 5.08, 20.10], [x, 10.35, 20.10]], 0x96bdd7, .22);
      }
      for (let z = -19.5; z < 20; z += 1) {
        line(faces.left, [[-15.1, 5.08, z], [-15.1, 10.35, z]], 0x96bdd7, .22);
        line(faces.right, [[15.1, 5.08, z], [15.1, 10.35, z]], 0x96bdd7, .22);
      }
      for (let y = .8; y < 5; y += .8) {
        [[-15, -9.5], [-4.5, 4.5], [9.5, 15]].forEach(([a, b]) => line(faces.front, [[a, y, -20.15], [b, y, -20.15]], 0xadc3d1, .17));
        line(faces.left, [[-15.15, y, -20], [-15.15, y, 20]], 0xadc3d1, .17);
      }

      // Two-pitch sandwich roof with a perimeter parapet.
      const pitch = Math.atan2(1.6, 15);
      const halfRoofLength = Math.hypot(15, 1.6);
      [-1, 1].forEach(side => {
        const slab = box(parts.roof, [halfRoofLength, .14, 40.4], [side * 7.5, 11.25, 0], roofMaterial, roofOutline);
        slab.rotation.z = -side * pitch;
      });
      member(parts.roof, [0, 12.12, -20.2], [0, 12.12, 20.2], .14, steel, roofOutline);
      [-20.25, 20.25].forEach(z => box(parts.roof, [30.4, 2.15, .16], [0, 11.45, z], roofMaterial, roofOutline));
      [-15.2, 15.2].forEach(x => box(parts.roof, [.16, 2.15, 40.5], [x, 11.45, 0], roofMaterial, roofOutline));
      for (let z = -19.5; z < 20; z += 1.5) line(parts.roof, [[-15, 10.56, z], [0, 12.17, z], [15, 10.56, z]], 0xc4d8e5, .24);

      // Two side loading positions, levellers, bumpers, canopy and safety bollards.
      [6, 14].forEach((z, index) => {
        box(parts.docks, [3.8, .5, 6.3], [17, -.28, z], foundationMaterial, subduedOutline);
        box(parts.docks, [1.8, .13, 3.1], [16.2, .03, z], steel);
        box(parts.docks, [.28, 4.75, 5.5], [15.32, 2.4, z], dark, subduedOutline);
        box(parts.docks, [.12, 4.15, 4.7], [15.50, 2.15, z], wallMaterial, wallOutline);
        [-2.4, 2.4].forEach(dz => {
          box(parts.docks, [.45, 1.0, .32], [19.0, -.05, z + dz], dark, null);
          box(parts.docks, [.17, 1.2, .17], [19.3, .35, z + dz], amber, null);
        });
        box(parts.docks, [5.8, .14, 7.4], [17.8, 5.85, z], roofMaterial, roofOutline);
        member(parts.docks, [15.1, 5.0, z - 3.3], [20.5, 5.75, z - 3.3], .13);
        member(parts.docks, [15.1, 5.0, z + 3.3], [20.5, 5.75, z + 3.3], .13);
        label(parts.docks, `DOCA ${index + 1}`, [19.3, 5.25, z], 3.5, '#f2b544');
      });

      // Mezzanine: 10 × 8 m, administration above two conceptual bathrooms.
      box(parts.mezzanine, [10, .28, 8], [8, 4.2, 14], steel);
      [[3, 10], [13, 10], [3, 18], [13, 18]].forEach(([x, z]) => member(parts.mezzanine, [x, 0, z], [x, 4.2, z], .20));
      box(parts.mezzanine, [10, .14, 8], [8, 7.1, 14], officeMaterial, subduedOutline);
      box(parts.mezzanine, [10, 2.8, .08], [8, 5.65, 10], glass, subduedOutline);
      box(parts.mezzanine, [.08, 2.8, 8], [3, 5.65, 14], glass, subduedOutline);
      box(parts.mezzanine, [.15, 2.8, 8], [13, 5.65, 14], officeMaterial, subduedOutline);
      box(parts.mezzanine, [10, 2.8, .15], [8, 5.65, 18], officeMaterial, subduedOutline);
      [3, 5.5, 8, 10.5, 13].forEach(x => member(parts.mezzanine, [x, 4.35, 10], [x, 7.05, 10], .075));
      member(parts.mezzanine, [3, 5.4, 10], [13, 5.4, 10], .055);
      [10, 12, 14, 16, 18].forEach(z => member(parts.mezzanine, [3, 4.35, z], [3, 7.05, z], .075));
      // Lightweight railing around the stair landing.
      for (let z = 10; z <= 18; z += 2) member(parts.mezzanine, [1.7, 4.2, z], [1.7, 5.25, z], .055);
      member(parts.mezzanine, [1.7, 5.25, 10], [1.7, 5.25, 18], .055);
      // Twenty broad steps and two inclined stringers.
      for (let i = 0; i < 20; i++) box(parts.mezzanine, [1.65, .12, .4], [1.95, (i + 1) * .21, 10 + i * .4], steel, subduedOutline);
      [1.10, 2.80].forEach(x => {
        member(parts.mezzanine, [x, .15, 9.8], [x, 4.15, 18], .14);
        member(parts.mezzanine, [x, 1.15, 9.8], [x, 5.15, 18], .055);
        [0, 1, 2, 3, 4].forEach(i => member(parts.mezzanine, [x, .15 + i, 9.8 + i * 2.05], [x, 1.15 + i, 9.8 + i * 2.05], .045));
      });
      [5.5, 10.5].forEach(x => {
        box(parts.mezzanine, [4.7, 3.15, .12], [x, 1.575, 12.1], officeMaterial, subduedOutline);
        box(parts.mezzanine, [1.05, 2.25, .13], [x, 1.125, 12.0], dark, null);
        box(parts.mezzanine, [.12, 3.15, 5.8], [x - 2.4, 1.575, 15], officeMaterial, subduedOutline);
        box(parts.mezzanine, [1.5, .12, .7], [x, .88, 16.9], officeMaterial, subduedOutline);
      });
      // A pair of office tables is deliberately diagrammatic.
      [5.8, 10.2].forEach(x => {
        box(parts.mezzanine, [2.0, .10, 1.1], [x, 5.15, 14.5], amber, subduedOutline);
        [-.7, .7].forEach(dx => member(parts.mezzanine, [x + dx, 4.35, 14.5], [x + dx, 5.12, 14.5], .06));
      });
      label(parts.mezzanine, '80 m² / APOIO', [7.5, 7.75, 14], 5.1);

      // Ground, dimension marks and technical scale remain below the exploded assembly.
      const grid = new THREE.GridHelper(76, 38, 0x477fa7, 0x28435d);
      grid.position.y = -1.32;
      grid.material.transparent = true;
      grid.material.opacity = .4;
      scene.add(grid);
      const dimensions = new THREE.Group();
      scene.add(dimensions);
      line(dimensions, [[-15, -.95, -23], [15, -.95, -23]]);
      [-15, 15].forEach(x => line(dimensions, [[x, -.95, -21.5], [x, -.95, -24.5]]));
      label(dimensions, '30,00 m', [0, -.6, -24.6], 6, '#f2b544');
      line(dimensions, [[-18, -.95, -20], [-18, -.95, 20]]);
      [-20, 20].forEach(z => line(dimensions, [[-16.5, -.95, z], [-19.5, -.95, z]]));
      label(dimensions, '40,00 m', [-21.0, .1, 0], 6, '#f2b544');
      line(dimensions, [[-17, 0, -20], [-17, 10, -20]]);
      [0, 10].forEach(y => line(dimensions, [[-17.6, y, -20], [-16.4, y, -20]]));
      label(dimensions, '10,00 m', [-19.4, 5.2, -20], 4.6, '#f2b544');

      const spherical = new THREE.Spherical();
      let cameraMoving = false;
      let roofOpacity = presets[view].roof;
      let wallOpacity = presets[view].wall;
      let dragging = false;
      const pointers = new Map();
      let pinchDistance = 0;

      function currentSpherical() {
        spherical.setFromVector3(camera.position.clone().sub(target));
      }

      function updateOrbit() {
        spherical.phi = Math.max(.16, Math.min(Math.PI * .49, spherical.phi));
        spherical.radius = Math.max(8, Math.min(170, spherical.radius));
        camera.position.setFromSpherical(spherical).add(target);
        cameraGoal.copy(camera.position);
        targetGoal.copy(target);
        cameraMoving = false;
        wake();
      }

      function chooseCamera(key, immediate = false) {
        const preset = presets[key];
        cameraGoal.set(...preset.position);
        targetGoal.set(...preset.target);
        if (!['interior', 'mezzanine'].includes(key)) {
          const portraitFit = Math.max(1, 1.25 / Math.max(.48, camera.aspect));
          cameraGoal.sub(targetGoal).multiplyScalar(portraitFit).add(targetGoal);
        }
        const expandedCenter = explosionTarget * 4;
        targetGoal.y += expandedCenter;
        if (explosionTarget > 0 && !['interior', 'mezzanine'].includes(key)) {
          cameraGoal.sub(targetGoal).multiplyScalar(1 + explosionTarget * .20).add(targetGoal);
          cameraGoal.y += explosionTarget * 7;
        }
        cameraMoving = true;
        if (immediate || reducedMotion) {
          target.copy(targetGoal);
          camera.position.copy(cameraGoal);
          currentSpherical();
          cameraMoving = false;
        }
      }

      function fitExplosion() {
        if (!dragging) chooseCamera(view);
      }

      function resize() {
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight || 560);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        if (engine && !dragging) chooseCamera(view);
        wake();
      }
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      cleanups.push(() => resizeObserver.disconnect());

      canvas.addEventListener('pointerdown', event => {
        if (event.button > 0) return;
        event.preventDefault();
        canvas.focus({ preventScroll: true });
        canvas.setPointerCapture(event.pointerId);
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        currentSpherical();
        dragging = true;
        canvas.style.cursor = 'grabbing';
        cameraMoving = false;
        if (pointers.size === 2) {
          const [a, b] = [...pointers.values()];
          pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
        }
      }, { signal: events.signal });
      canvas.addEventListener('pointermove', event => {
        const previous = pointers.get(event.pointerId);
        if (!previous) return;
        event.preventDefault();
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.size === 2) {
          const [a, b] = [...pointers.values()];
          const next = Math.hypot(a.x - b.x, a.y - b.y);
          if (pinchDistance > 0) spherical.radius *= pinchDistance / Math.max(1, next);
          pinchDistance = next;
        } else {
          spherical.theta -= (event.clientX - previous.x) * .006;
          spherical.phi -= (event.clientY - previous.y) * .004;
        }
        updateOrbit();
      }, { signal: events.signal });
      function release(event) {
        pointers.delete(event.pointerId);
        dragging = pointers.size > 0;
        if (pointers.size < 2) pinchDistance = 0;
        if (!dragging) canvas.style.cursor = 'grab';
      }
      canvas.addEventListener('pointerup', release, { signal: events.signal });
      canvas.addEventListener('pointercancel', release, { signal: events.signal });
      canvas.addEventListener('lostpointercapture', release, { signal: events.signal });
      canvas.addEventListener('wheel', event => {
        event.preventDefault();
        currentSpherical();
        spherical.radius *= Math.exp(Math.max(-250, Math.min(250, event.deltaY)) * .0012);
        updateOrbit();
      }, { passive: false, signal: events.signal });
      canvas.addEventListener('keydown', event => {
        const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'Home'];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        currentSpherical();
        if (event.key === 'ArrowLeft') spherical.theta += .12;
        if (event.key === 'ArrowRight') spherical.theta -= .12;
        if (event.key === 'ArrowUp') spherical.phi -= .08;
        if (event.key === 'ArrowDown') spherical.phi += .08;
        if (['+', '='].includes(event.key)) spherical.radius *= .90;
        if (event.key === '-') spherical.radius *= 1.10;
        if (event.key === 'Home') { chooseCamera(view); wake(); return; }
        updateOrbit();
      }, { signal: events.signal });
      canvas.addEventListener('webglcontextlost', event => {
        event.preventDefault();
        contextLost = true;
        stop();
        if (fallback) fallback.style.display = fallbackDisplay;
        canvas.style.display = 'none';
        host.dataset.modelState = 'fallback';
        say('A visualização foi pausada. A imagem de referência permanece disponível.');
      }, { signal: events.signal });

      function draw(dt, blend, amount) {
        Object.entries(parts).forEach(([name, group]) => {
          const shift = offsets[name];
          group.position.set(shift[0] * amount, shift[1] * amount, shift[2] * amount);
        });
        Object.entries(faces).forEach(([name, group]) => {
          const shift = faceOffsets[name];
          group.position.set(shift[0] * amount, 0, shift[2] * amount);
        });
        if (cameraMoving) {
          camera.position.lerp(cameraGoal, blend);
          target.lerp(targetGoal, blend);
          if (camera.position.distanceToSquared(cameraGoal) < .0004 && target.distanceToSquared(targetGoal) < .0004) {
            camera.position.copy(cameraGoal);
            target.copy(targetGoal);
            cameraMoving = false;
            currentSpherical();
          }
        }
        const preset = presets[view];
        wallOpacity += (preset.wall - wallOpacity) * blend;
        roofOpacity += (preset.roof - roofOpacity) * blend;
        wallMaterials.forEach(material => { material.opacity = wallOpacity; });
        wallOutline.opacity = Math.max(.08, wallOpacity * .5);
        roofMaterial.opacity = roofOpacity;
        roofOutline.opacity = Math.max(.06, roofOpacity * .58);
        parts.roof.visible = roofVisible;
        dimensions.visible = !['interior', 'mezzanine'].includes(view);
        camera.lookAt(target);
        renderer.render(scene, camera);
      }

      function destroy() {
        const geometries = new Set();
        const materials = new Set();
        const textures = new Set();
        scene.traverse(item => {
          if (item.geometry) geometries.add(item.geometry);
          const list = item.material ? (Array.isArray(item.material) ? item.material : [item.material]) : [];
          list.forEach(material => {
            materials.add(material);
            if (material.map) textures.add(material.map);
          });
        });
        textures.forEach(texture => texture.dispose());
        geometries.forEach(geometry => geometry.dispose());
        materials.forEach(material => material.dispose());
        renderer.dispose();
        canvas.remove();
      }
      engine = { chooseCamera, fitExplosion, draw, destroy };
      resize();
      chooseCamera(view, true);
      explosion = reducedMotion ? explosionTarget : 0;
      draw(0, 1, explosion);
      if (fallback) fallback.style.display = 'none';
      startButton?.remove();
      startButton = null;
      say(presets[view].label);
      wake();
    } catch (error) {
      renderer?.dispose();
      renderer?.domElement.remove();
      engine = null;
      host.dataset.modelState = 'fallback';
      if (fallback) fallback.style.display = fallbackDisplay;
      say('Modelo 3D indisponível neste dispositivo. Veja o estudo na imagem de referência.');
      if (startButton) {
        startButton.disabled = false;
        startButton.textContent = 'Tentar abrir o modelo 3D';
      }
      console.warn('BRAVIX conceptual model unavailable:', error?.message || error);
    } finally {
      launching = false;
    }
  }

  buttons.forEach(button => button.addEventListener('click', () => setCamera(button.dataset.camera), { signal: events.signal }));
  range?.addEventListener('input', event => setExplosion(event.target.value), { signal: events.signal });
  roofToggle?.addEventListener('change', event => {
    roofVisible = event.target.checked;
    wake();
  }, { signal: events.signal });
  reset?.addEventListener('click', () => {
    roofVisible = true;
    if (roofToggle) roofToggle.checked = true;
    setExplosion(0);
    setCamera('facade');
  }, { signal: events.signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else wake();
  }, { signal: events.signal });

  const intersection = new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? true;
    if (visible) wake();
    else stop();
  }, { threshold: .02 });
  intersection.observe(host);
  cleanups.push(() => intersection.disconnect());

  if (mobile) {
    startButton = document.createElement('button');
    startButton.type = 'button';
    startButton.className = 'model-start-button';
    startButton.textContent = 'Explorar o modelo 3D';
    Object.assign(startButton.style, { position: 'absolute', left: '50%', bottom: '42px', transform: 'translateX(-50%)', zIndex: '3', minHeight: '48px', padding: '14px 22px', whiteSpace: 'nowrap', color: '#0a0e14', background: '#93c0f0', border: '0', cursor: 'pointer', font: '600 12px monospace', letterSpacing: '.04em' });
    host.appendChild(startButton);
    startButton.addEventListener('click', launch, { signal: events.signal });
    host.dataset.modelState = 'idle';
    say('Toque em explorar para iniciar o modelo 3D.');
  } else {
    await launch();
  }

  return {
    setExplosion,
    setCamera,
    dispose() {
      disposed = true;
      stop();
      events.abort();
      cleanups.forEach(cleanup => cleanup());
      engine?.destroy();
      engine = null;
      startButton?.remove();
      if (fallback) fallback.style.display = fallbackDisplay;
      delete host.dataset.modelState;
    }
  };
}
