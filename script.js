(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mouse = { x: 0, y: 0 };

  /* Typing effect */
  const roles = ['Full Stack Developer', 'MERN Stack Developer', 'Java Developer', '3D Web Builder'];
  const out = $('#typed');
  let r = 0, c = 0, del = false;
  (function type() {
    const w = roles[r];
    out.textContent = w.slice(0, c);
    if (!del && c === w.length) { del = true; return setTimeout(type, 1500); }
    if (del && c === 0) { del = false; r = (r + 1) % roles.length; }
    c += del ? -1 : 1;
    setTimeout(type, del ? 35 : 80);
  })();

  /* Scroll reveal */
  const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.12 });
  $$('.reveal').forEach((el) => io.observe(el));

  /* 3D tilt + glare on cards */
  $$('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const b = el.getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width - 0.5;
      const y = (e.clientY - b.top) / b.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${x * 16}deg) rotateX(${-y * 16}deg) translateZ(12px)`;
      el.style.setProperty('--mx', (x + 0.5) * 100 + '%');
      el.style.setProperty('--my', (y + 0.5) * 100 + '%');
    });
    el.addEventListener('pointerleave', () => (el.style.transform = ''));
  });

  /* Cursor glow + scroll progress */
  const glow = $('.glow-cursor'), bar = $('.progress');
  addEventListener('pointermove', (e) => {
    mouse.x = e.clientX / innerWidth - 0.5;
    mouse.y = e.clientY / innerHeight - 0.5;
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });
  const prog = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    return h > 0 ? scrollY / h : 0;
  };
  addEventListener('scroll', () => (bar.style.width = prog() * 100 + '%'), { passive: true });

  /* Three.js 3D background */
  if (!window.THREE) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: $('#bg'), alpha: true, antialias: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 300);
  cam.position.z = 30;

  // Particle field
  const N = 1800, pos = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i++) pos[i] = (Math.random() - 0.5) * 140;
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.22, transparent: true, opacity: 0.8 }));
  scene.add(stars);

  // Core: wireframe icosahedron + torus knot + orbit rings
  const core = new THREE.Group();
  const mat = (col, o) => new THREE.MeshBasicMaterial({ color: col, wireframe: true, transparent: true, opacity: o });
  const ico = new THREE.Mesh(new THREE.IcosahedronGeometry(7, 1), mat(0xffffff, 0.22));
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(3.2, 0.8, 120, 16), mat(0x00f7ff, 0.7));
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(11, 0.06, 8, 120), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(13.5, 0.05, 8, 120), new THREE.MeshBasicMaterial({ color: 0x00f7ff }));
  ring1.rotation.x = Math.PI / 2.4;
  ring2.rotation.y = Math.PI / 2.6;
  core.add(ico, knot, ring1, ring2);
  scene.add(core);

  // Floating cubes
  const cubes = [];
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), mat(i % 2 ? 0xffffff : 0x00f7ff, 0.4));
    m.position.set((Math.random() - 0.5) * 70, (Math.random() - 0.5) * 90, (Math.random() - 0.5) * 30 - 10);
    m.userData.s = Math.random() * 0.01 + 0.004;
    cubes.push(m); scene.add(m);
  }

  const resize = () => {
    renderer.setSize(innerWidth, innerHeight);
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
  };
  addEventListener('resize', resize); resize();

  let t = 0;
  const tick = () => {
    t += 0.01;
    const p = prog();
    cam.position.y += (-p * 45 - cam.position.y) * 0.06;            // fly down through the particles
    cam.position.x += (mouse.x * 6 - cam.position.x) * 0.04;        // mouse parallax
    cam.lookAt(cam.position.x * 0.3, cam.position.y, 0);
    const wide = innerWidth > 900;
    core.position.y = cam.position.y;
    core.position.x += ((wide ? Math.sin(p * Math.PI * 3) * 14 + 8 : 0) - core.position.x) * 0.05;
    core.rotation.y = t * 0.6 + mouse.x * 1.5;
    core.rotation.x = t * 0.3 + mouse.y * 1.2;
    knot.rotation.x = -t * 1.4; knot.rotation.y = t;
    ring1.rotation.z = t * 1.2; ring2.rotation.x = -t;
    stars.rotation.y = t * 0.04;
    cubes.forEach((m) => { m.rotation.x += m.userData.s; m.rotation.y += m.userData.s * 1.3; });
    renderer.render(scene, cam);
    if (!reduce) requestAnimationFrame(tick);
  };
  tick();
})();
