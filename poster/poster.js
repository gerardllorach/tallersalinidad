/* =========================================================
   Póster A0 horizontal — ¿Cuánta sal tiene el mar?
   Todo se dibuja en SVG (vectorial). 1 unidad = 1 mm.
   ========================================================= */
(async () => {
  'use strict';

  // ---------- Medidas del póster (mm) ----------
  const W = 1189, H = 841, M = 30;
  const MAP = { x: M, y: 122, w: W - 2 * M, h: 436 };
  const PANELS = { y: MAP.y + MAP.h + 22, gap: 18 };
  PANELS.h = H - M - PANELS.y;

  const LAND_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json';
  const LOGO_URL = 'img/logo-icm.png';

  // Modo claro para imprimir (poca tinta). Los mares usan los mismos colores que la app;
  // "ink" es una versión más oscura del mismo color para líneas y textos sobre blanco.
  const OCEAN = '#e8eff7';
  const OCEAN_EDGE = '#d3dde9';
  const LAND = '#ffffff';
  const LAND_EDGE = '#b4bdcc';
  const BG = '#ffffff';
  const PANEL_BG = '#ffffff';
  const TEXT = '#151a2b';
  const MUTED = '#5b6478';

  // 1 cucharadita de sal ≈ 6 g (igual que en la aplicación)
  const GRAMS_PER_SPOON = 6;

  // ---------- Los mares ----------
  const SEAS = [
    {
      id: 'atlantico', name: 'Océano Atlántico', short: 'Atlántico', color: '#22d3ee', ink: '#0e7490', emoji: '🐋',
      salt: 35, text: 'Agua salada, como casi todo el mar.',
      spoonText: 'Casi 6 cucharaditas de sal',
      label: { lng: -40, lat: 27 },
      ring: [
        [-65, 62], [-52, 64], [-40, 66], [-30, 66], [-22, 66], [-12, 64], [-5, 62], [5, 62],
        [7, 60], [9, 58.6], [11.5, 58.9], [12.2, 57.9], [10.6, 57.75], [9.5, 55], [9, 54],
        [3, 47], [-1, 43], [-5.5, 37.5], [-5.5, 35], [-5, 30], [0, 20], [5, 12], [12, 5],
        [15, -10], [17, -22], [20, -34.8], [20, -45], [20, -60], [0, -60], [-20, -60],
        [-40, -60], [-60, -60], [-67, -60], [-67, -55.5], [-70, -52], [-65, -40], [-60, -20],
        [-70, -5], [-75, 5], [-77, 8.5], [-84, 11], [-89, 15], [-91, 18.5], [-95, 17.5],
        [-98, 22], [-98, 30], [-90, 33], [-80, 37], [-72, 44], [-70, 47], [-67, 55]
      ]
    },
    {
      id: 'mediterraneo', name: 'Mar Mediterráneo', short: 'Mediterráneo', color: '#c084fc', ink: '#7e22ce', emoji: '🐬',
      salt: 38, text: 'Un poco más salado que el Atlántico.',
      spoonText: 'Un poco más de 6 cucharaditas',
      label: { lng: 10, lat: 38.5 },
      ring: [
        [-5.5, 35], [-5.5, 37.5], [0, 41.5], [3, 44], [8, 44.6], [10, 44.5], [12.5, 46],
        [14, 45.9], [19, 46], [22, 43], [26, 41.5], [26.3, 40.2], [27, 39.8], [28, 38],
        [32, 37.6], [36.5, 37.5], [36.5, 36.5], [35.5, 33], [34.2, 31.2], [32.3, 30.9],
        [30, 30.7], [25, 31.2], [20, 29.8], [15, 31.5], [10.8, 32.8], [10, 34], [9.5, 36.5],
        [3, 36.2], [-2, 34.7]
      ]
    },
    {
      id: 'baltico', name: 'Mar Báltico', short: 'Báltico', color: '#a3e635', ink: '#4d7c0f', emoji: '🦭',
      salt: 7, text: 'Muy poca sal. ¡Casi agua dulce!',
      spoonText: 'Solo 1 cucharadita de sal',
      anchor: { lng: 19.5, lat: 58.5 },
      label: { lng: 44, lat: 64 },
      ring: [
        [10.6, 57.75], [12.2, 57.9], [13, 59], [17, 61], [17, 62], [20, 66], [26, 66],
        [25, 64], [30, 61], [31, 60], [31, 59.5], [28, 57.5], [24, 54], [14, 53.5],
        [10, 53.8], [9.5, 55]
      ]
    },
    {
      id: 'muerto', name: 'Mar Muerto', short: 'Mar Muerto', color: '#fb923c', ink: '#c2410c', emoji: '🛟',
      salt: 340, text: '¡Muchísima sal! Flotas sin nadar.',
      spoonText: '¡Casi 57 cucharaditas de sal!',
      anchor: { lng: 35.5, lat: 31.5 },
      // Contorno aproximado (cuenca norte + cuenca sur)
      rings: [
        [[35.48, 31.77], [35.56, 31.76], [35.58, 31.70], [35.59, 31.60], [35.57, 31.50],
         [35.55, 31.40], [35.53, 31.30], [35.47, 31.27], [35.42, 31.33], [35.40, 31.45],
         [35.39, 31.58], [35.43, 31.70]],
        [[35.40, 31.22], [35.47, 31.22], [35.50, 31.15], [35.47, 31.05], [35.41, 31.08], [35.38, 31.15]]
      ]
    }
  ];

  const CONTINENTS = [
    { name: 'AMÉRICA DEL NORTE', lng: -100, lat: 47 },
    { name: 'AMÉRICA DEL SUR', lng: -60, lat: -12 },
    { name: 'EUROPA', lng: 30, lat: 52 },
    { name: 'ÁFRICA', lng: 20, lat: 8 },
    { name: 'ASIA', lng: 90, lat: 52 }
  ];

  // ---------- Utilidades ----------
  const statusEl = document.getElementById('status');
  const setStatus = (t) => { statusEl.textContent = t; };

  function closeRing(r) {
    const a = r[0], b = r[r.length - 1];
    return a[0] === b[0] && a[1] === b[1] ? r.slice() : [...r, a];
  }
  // d3-geo necesita los anillos exteriores en sentido horario
  function cw(ring) {
    const r = closeRing(ring);
    let s = 0;
    for (let i = 0; i < r.length - 1; i++) s += (r[i + 1][0] - r[i][0]) * (r[i + 1][1] + r[i][1]);
    return s > 0 ? r : r.slice().reverse();
  }
  function seaFeature(sea) {
    if (sea.rings) {
      return { type: 'Feature', properties: { id: sea.id },
        geometry: { type: 'MultiPolygon', coordinates: sea.rings.map((r) => [cw(r)]) } };
    }
    return { type: 'Feature', properties: { id: sea.id },
      geometry: { type: 'Polygon', coordinates: [cw(sea.ring)] } };
  }
  function rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  // Reduce el tamaño de un texto si no cabe en el ancho dado
  function fitText(sel, maxW) {
    const w = sel.node().getComputedTextLength();
    if (w > maxW) sel.attr('font-size', (+sel.attr('font-size') * maxW / w).toFixed(2));
    return sel;
  }
  let uid = 0;
  const nextId = (p) => `${p}-${++uid}`;

  // ---------- Datos ----------
  let land;
  try {
    await document.fonts.load('700 20px Fredoka');
    await document.fonts.load('400 20px "Atkinson Hyperlegible"');
    await document.fonts.load('700 20px "Atkinson Hyperlegible"');
  } catch (e) { /* seguimos con fuentes del sistema */ }

  try {
    const topo = await (await fetch(LAND_URL)).json();
    land = topojson.feature(topo, topo.objects.land);
  } catch (e) {
    setStatus('No se pudo cargar el mapa. Revisa la conexión a internet y recarga.');
    return;
  }

  const seaFeatures = Object.fromEntries(SEAS.map((s) => [s.id, seaFeature(s)]));

  // ---------- SVG base ----------
  const svg = d3.select('#poster')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', `${W}mm`)
    .attr('height', `${H}mm`);
  svg.selectAll('*').remove();
  const defs = svg.append('defs');

  svg.append('rect').attr('width', W).attr('height', H).attr('fill', BG);

  // Cucharita (símbolo reutilizable) — 7.5 × 22 mm
  const spoon = defs.append('symbol').attr('id', 'spoon').attr('viewBox', '0 0 7.5 22');
  spoon.append('ellipse').attr('cx', 3.75).attr('cy', 5.2).attr('rx', 3.75).attr('ry', 5.2);
  spoon.append('rect').attr('x', 2.6).attr('y', 9).attr('width', 2.3).attr('height', 13).attr('rx', 1.15);

  // =========================================================
  //  Dibujo de un mapa (se usa para el mapa grande y la lupa)
  // =========================================================
  function drawGeo(root, projection, { graticule = false, deadSeaShape = false } = {}) {
    const path = d3.geoPath(projection);
    const landId = nextId('land');
    const maskId = nextId('water');

    // Tierra como definición reutilizable
    defs.append('path').attr('id', landId).attr('d', path(land));

    // Máscara "solo agua": para dibujar los límites de los mares en mar abierto
    const mask = defs.append('mask').attr('id', maskId)
      .attr('maskUnits', 'userSpaceOnUse').attr('x', 0).attr('y', 0).attr('width', W).attr('height', H);
    mask.append('rect').attr('width', W).attr('height', H).attr('fill', '#fff');
    mask.append('use').attr('href', `#${landId}`).attr('fill', '#000');

    // Océano
    root.append('path').attr('d', path({ type: 'Sphere' }))
      .attr('fill', OCEAN).attr('stroke', OCEAN_EDGE);

    if (graticule) {
      root.append('path').attr('d', path(d3.geoGraticule().step([15, 15])()))
        .attr('fill', 'none').attr('stroke', 'rgba(40,80,140,0.12)').attr('stroke-width', 0.4);
    }

    // Relleno de los mares (debajo de la tierra)
    SEAS.filter((s) => s.id !== 'muerto').forEach((s) => {
      root.append('path').attr('d', path(seaFeatures[s.id])).attr('fill', rgba(s.color, 0.4));
    });

    // Tierra oscura
    root.append('use').attr('href', `#${landId}`)
      .attr('fill', LAND).attr('stroke', LAND_EDGE).attr('stroke-width', 0.3);

    // Costa de cada mar en su color (brillo + línea)
    SEAS.filter((s) => s.id !== 'muerto').forEach((s) => {
      const clipId = nextId('clip');
      defs.append('clipPath').attr('id', clipId).append('path').attr('d', path(seaFeatures[s.id]));
      const g = root.append('g').attr('clip-path', `url(#${clipId})`);
      g.append('use').attr('href', `#${landId}`)
        .attr('fill', 'none').attr('stroke', rgba(s.color, 0.45)).attr('stroke-width', 4);
      g.append('use').attr('href', `#${landId}`)
        .attr('fill', 'none').attr('stroke', s.ink).attr('stroke-width', 1.2);

      // Límite en mar abierto (p. ej. Gibraltar o los estrechos daneses)
      root.append('path').attr('d', path(seaFeatures[s.id]))
        .attr('mask', `url(#${maskId})`)
        .attr('fill', 'none').attr('stroke', s.ink).attr('stroke-width', 1.1)
        .attr('stroke-dasharray', '3 2.2').attr('stroke-linecap', 'round');
    });

    // Mar Muerto (está dentro de tierra: va encima)
    if (deadSeaShape) {
      const dead = SEAS.find((s) => s.id === 'muerto');
      root.append('path').attr('d', path(seaFeatures.muerto))
        .attr('fill', 'none').attr('stroke', rgba(dead.color, 0.45)).attr('stroke-width', 5)
        .attr('stroke-linejoin', 'round');
      root.append('path').attr('d', path(seaFeatures.muerto))
        .attr('fill', dead.color).attr('stroke', dead.ink).attr('stroke-width', 1.2)
        .attr('stroke-linejoin', 'round');
    }
    return path;
  }

  // =========================================================
  //  Cabecera
  // =========================================================
  svg.append('text').attr('class', 'display').attr('x', M).attr('y', 74)
    .attr('font-size', 56).attr('fill', TEXT).text('¿Cuánta sal tiene el mar? 🧂');
  svg.append('text').attr('class', 'body').attr('x', M + 2).attr('y', 106)
    .attr('font-size', 19).attr('fill', MUTED)
    .text('Cada mar tiene una cantidad diferente de sal. ¡Compáralos!');

  // Logo ICM arriba a la derecha
  const LOGO = { w: 180, h: 84 };
  const logoG = svg.append('g').attr('transform', `translate(${W - M - LOGO.w},${24})`);
    const logoImg = logoG.append('image').attr('x', 10).attr('y', 8)
    .attr('width', LOGO.w - 20).attr('height', LOGO.h - 16)
    .attr('preserveAspectRatio', 'xMidYMid meet').attr('href', LOGO_URL);
  const logoFallback = logoG.append('g').style('display', 'none');
  logoFallback.append('text').attr('class', 'display').attr('x', LOGO.w / 2).attr('y', 50)
    .attr('text-anchor', 'middle').attr('font-size', 38).attr('fill', '#0b3d91').text('ICM');
  logoFallback.append('text').attr('class', 'body').attr('x', LOGO.w / 2).attr('y', 70)
    .attr('text-anchor', 'middle').attr('font-size', 12).attr('letter-spacing', 3)
    .attr('fill', '#444').text('CSIC');
  logoImg.on('error', () => { logoImg.remove(); logoFallback.style('display', null); });

  // =========================================================
  //  Mapa grande
  // =========================================================
  const mapClip = nextId('mapclip');
  defs.append('clipPath').attr('id', mapClip).append('rect')
    .attr('x', MAP.x).attr('y', MAP.y).attr('width', MAP.w).attr('height', MAP.h).attr('rx', 14);

  const projection = d3.geoNaturalEarth1().rotate([25, 0]);
  projection.fitExtent(
    [[MAP.x, MAP.y], [MAP.x + MAP.w, MAP.y + MAP.h]],
    { type: 'MultiPoint', coordinates: [[-25, -40], [-25, 73]] }
  );

  const mapG = svg.append('g').attr('clip-path', `url(#${mapClip})`);
  mapG.append('rect').attr('x', MAP.x).attr('y', MAP.y).attr('width', MAP.w).attr('height', MAP.h).attr('fill', BG);
  drawGeo(mapG, projection, { graticule: true });

  // Nombres de continentes (suaves, para orientarse)
  CONTINENTS.forEach((c) => {
    const [x, y] = projection([c.lng, c.lat]);
    mapG.append('text').attr('class', 'display').attr('x', x).attr('y', y)
      .attr('text-anchor', 'middle').attr('font-size', 13).attr('letter-spacing', 2.5)
      .attr('fill', 'rgba(21,26,43,0.32)').text(c.name);
  });

  // ---------- Mar Muerto: marca + lupa ----------
  const dead = SEAS.find((s) => s.id === 'muerto');
  const [dx, dy] = projection([dead.anchor.lng, dead.anchor.lat]);

  const LENS_R = 80;
  let [lx, ly] = projection([66, 8]);
  lx = Math.min(Math.max(lx, MAP.x + LENS_R + 14), MAP.x + MAP.w - LENS_R - 14);
  ly = Math.min(Math.max(ly, MAP.y + LENS_R + 14), MAP.y + MAP.h - LENS_R - 54);

  // Línea de la marca a la lupa
  const ang = Math.atan2(ly - dy, lx - dx);
  mapG.append('line')
    .attr('x1', dx).attr('y1', dy)
    .attr('x2', lx - Math.cos(ang) * LENS_R).attr('y2', ly - Math.sin(ang) * LENS_R)
    .attr('stroke', dead.ink).attr('stroke-width', 1.2).attr('stroke-dasharray', '3 2');
  [9, 6].forEach((r, i) => {
    mapG.append('circle').attr('cx', dx).attr('cy', dy).attr('r', r)
      .attr('fill', 'none').attr('stroke', rgba(dead.ink, i ? 0.8 : 0.4)).attr('stroke-width', 1.2);
  });
  mapG.append('circle').attr('cx', dx).attr('cy', dy).attr('r', 2.8).attr('fill', dead.ink);

  // Lupa
  const lensClip = nextId('lens');
  defs.append('clipPath').attr('id', lensClip).append('circle').attr('cx', lx).attr('cy', ly).attr('r', LENS_R);
  mapG.append('circle').attr('cx', lx).attr('cy', ly).attr('r', LENS_R + 3)
    .attr('fill', 'none').attr('stroke', rgba(dead.color, 0.35)).attr('stroke-width', 6);
  const lensG = mapG.append('g').attr('clip-path', `url(#${lensClip})`);
  const lensProj = d3.geoMercator()
    .center([35.25, 31.45])
    .scale(LENS_R / (1.15 * Math.PI / 180))
    .translate([lx, ly]);
  drawGeo(lensG, lensProj, { deadSeaShape: true });
  mapG.append('circle').attr('cx', lx).attr('cy', ly).attr('r', LENS_R)
    .attr('fill', 'none').attr('stroke', dead.ink).attr('stroke-width', 1.8);
  mapG.append('text').attr('class', 'display').attr('x', lx).attr('y', ly + LENS_R + 22)
    .attr('text-anchor', 'middle').attr('font-size', 17).attr('fill', dead.ink).text('Mar Muerto');
  mapG.append('text').attr('class', 'body').attr('x', lx).attr('y', ly + LENS_R + 40)
    .attr('text-anchor', 'middle').attr('font-size', 12).attr('fill', MUTED)
    .text('🔍 Es tan pequeño que lo vemos de cerca');

  // Marco del mapa
  svg.append('rect').attr('x', MAP.x).attr('y', MAP.y).attr('width', MAP.w).attr('height', MAP.h)
    .attr('rx', 14).attr('fill', 'none').attr('stroke', '#c9d2df').attr('stroke-width', 1);

  // =========================================================
  //  Paneles inferiores con las cucharaditas
  // =========================================================
  const SP = { w: 7.5, h: 22, dx: 10.5, dy: 26 };
  const PAD = 20;
  const deadCols = 29; // 57 cucharaditas en 2 filas
  const deadW = PAD * 2 + (deadCols - 1) * SP.dx + SP.w;
  const otherW = (MAP.w - 3 * PANELS.gap - deadW) / 3;

  let px = M;
  SEAS.forEach((s) => {
    const pw = s.id === 'muerto' ? deadW : otherW;
    const g = svg.append('g').attr('transform', `translate(${px},${PANELS.y})`);
    px += pw + PANELS.gap;

    g.append('rect').attr('width', pw).attr('height', PANELS.h).attr('rx', 14)
      .attr('fill', PANEL_BG).attr('stroke', s.ink).attr('stroke-width', 1.4);

    // Insignia + nombre
    g.append('circle').attr('cx', PAD + 17).attr('cy', 34).attr('r', 17).attr('fill', s.color);
    g.append('text').attr('x', PAD + 17).attr('y', 41).attr('text-anchor', 'middle')
      .attr('font-size', 19).text(s.emoji);
    fitText(g.append('text').attr('class', 'display').attr('x', PAD + 44).attr('y', 41)
      .attr('font-size', 21).attr('fill', TEXT).text(s.name), pw - PAD * 2 - 44);

    // Frase sencilla
    fitText(g.append('text').attr('class', 'body').attr('x', PAD).attr('y', 74)
      .attr('font-size', 12.5).attr('fill', '#2b3245').text(s.text), pw - PAD * 2);

    // Número grande
    const num = g.append('text').attr('class', 'display').attr('x', PAD).attr('y', 128)
      .attr('font-size', 52).attr('fill', s.ink);
    num.append('tspan').text(s.salt);
    num.append('tspan').attr('font-size', 26).attr('dx', 3).text('g');
    const numW = num.node().getComputedTextLength();
    g.append('text').attr('class', 'body').attr('x', PAD + numW + 12).attr('y', 107)
      .attr('font-size', 12.5).attr('fill', MUTED).text('gramos de sal');
    g.append('text').attr('class', 'body').attr('x', PAD + numW + 12).attr('y', 124)
      .attr('font-size', 12.5).attr('fill', MUTED).text('en 1 litro de agua');

    // Cucharaditas (mismo tamaño en todos los paneles para poder comparar)
    const spoons = s.salt / GRAMS_PER_SPOON;
    const full = Math.floor(spoons);
    const part = spoons - full;
    const total = Math.ceil(spoons);
    const cols = Math.max(1, Math.floor((pw - 2 * PAD - SP.w) / SP.dx) + 1);
    const sg = g.append('g').attr('transform', `translate(${PAD},${144})`);
    for (let i = 0; i < total; i++) {
      const x = (i % cols) * SP.dx;
      const y = Math.floor(i / cols) * SP.dy;
      const isPart = i === full && part > 0.01;
      if (isPart) {
        // Cucharadita incompleta: se rellena solo una parte
        sg.append('use').attr('href', '#spoon').attr('x', x).attr('y', y)
          .attr('width', SP.w).attr('height', SP.h).attr('fill', 'rgba(21,26,43,0.10)');
        const cid = nextId('part');
        defs.append('clipPath').attr('id', cid).append('rect')
          .attr('x', 0).attr('y', SP.h * (1 - part)).attr('width', SP.w).attr('height', SP.h * part);
        sg.append('g').attr('transform', `translate(${x},${y})`).attr('clip-path', `url(#${cid})`)
          .append('use').attr('href', '#spoon').attr('width', SP.w).attr('height', SP.h).attr('fill', s.color)
          .attr('stroke', s.ink).attr('stroke-width', 0.5);
      } else {
        sg.append('use').attr('href', '#spoon').attr('x', x).attr('y', y)
          .attr('width', SP.w).attr('height', SP.h).attr('fill', s.color)
          .attr('stroke', s.ink).attr('stroke-width', 0.5);
      }
    }

    // Texto de las cucharaditas
    fitText(g.append('text').attr('class', 'display').attr('x', PAD).attr('y', PANELS.h - 18)
      .attr('font-size', 16).attr('fill', s.ink).text(s.spoonText), pw - PAD * 2);
  });

  // Créditos
  svg.append('text').attr('class', 'body').attr('x', W - M).attr('y', H - 10)
    .attr('text-anchor', 'end').attr('font-size', 7.5).attr('fill', MUTED)
    .text('Valores típicos de salinidad en superficie · 1 cucharadita de sal ≈ 6 g · Mapa: Natural Earth · Institut de Ciències del Mar (ICM-CSIC)');

  // =========================================================
  //  Botones
  // =========================================================
  const btnPrint = document.getElementById('btn-print');
  const btnSvg = document.getElementById('btn-svg');
  btnPrint.disabled = false;
  btnSvg.disabled = false;
  setStatus('Listo. Para imprenta: «Imprimir / Guardar PDF».');

  btnPrint.addEventListener('click', () => window.print());

  btnSvg.addEventListener('click', async () => {
    const clone = document.getElementById('poster').cloneNode(true);
    clone.removeAttribute('style');
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Fuentes y clases dentro del propio SVG
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent =
      "@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Fredoka:wght@700&display=swap');" +
      ".display{font-family:Fredoka,'Atkinson Hyperlegible',sans-serif;font-weight:700}" +
      ".body{font-family:'Atkinson Hyperlegible',sans-serif}";
    clone.insertBefore(style, clone.firstChild);

    // Logo incrustado en el fichero
    const img = clone.querySelector('image');
    if (img) {
      try {
        const blob = await (await fetch(LOGO_URL)).blob();
        const dataUrl = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
        img.setAttribute('href', dataUrl);
      } catch (e) { /* se queda el enlace relativo */ }
    }

    const text = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }));
    a.download = 'poster-salinidad-A0.svg';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  });
})();
