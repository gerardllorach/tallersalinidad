/* =========================================================
   ¿Cuánta sal tiene el mar?  —  Globo 3D de salinidad
   - Globo: globe.gl (three.js)
   - Datos "de hoy": Copernicus Marine WMTS cargado con OpenLayers
   ========================================================= */
(() => {
  'use strict';

  // ---------- Configuración ----------
  const COUNTRIES_URL =
    'https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson';
  const STARS_URL = 'https://unpkg.com/three-globe/example/img/night-sky.png';

  // Producto global de física oceánica (análisis + previsión diaria) de Copernicus Marine
  const CMEMS_PRODUCT = 'GLOBAL_ANALYSISFORECAST_PHY_001_024';
  const CMEMS_CAPS =
    `https://wmts.marine.copernicus.eu/teroWmts/${CMEMS_PRODUCT}?request=GetCapabilities&service=WMTS`;
  const CMEMS_STYLE = 'cmap:haline,range:0/40'; // colores de "poca sal" a "mucha sal"

  const TEX_W = 2048;
  const TEX_H = 1024;
  const OCEAN_TOP = '#0a1630';
  const OCEAN_MID = '#0e1f42';

  const LAND_ALT = 0.012;   // la tierra está "por encima" de los mares
  const SEA_ALT = 0.006;    // así los bordes de los mares quedan tapados por la costa
  const DEAD_ALT = 0.018;   // el Mar Muerto está dentro de tierra: va por encima

  const ROTATE_SPEED = 0; // positivo = la Tierra gira de oeste a este (como la de verdad)

  // ---------- Los mares ----------
  // Polígonos sencillos [lng, lat]. Los trozos que pisan tierra quedan tapados por los países.
  const SEAS = [
    {
      id: 'atlantico',
      name: 'Océano Atlántico',
      short: 'Atlántico',
      color: '#22d3ee',
      emoji: '🐋',
      salt: 35,
      text: 'Agua salada, como casi todo el mar.',
      label: { lat: 24, lng: -42 },
      sample: { lat: 28, lng: -40 },
      view: { lat: 22, lng: -35, altitude: 2.3 },
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
      id: 'mediterraneo',
      name: 'Mar Mediterráneo',
      short: 'Mediterráneo',
      color: '#c084fc',
      emoji: '🐬',
      salt: 38,
      text: 'Un poco más salado que el Atlántico.',
      label: { lat: 35.5, lng: 17 },
      sample: { lat: 34.5, lng: 19 },
      view: { lat: 37, lng: 16, altitude: 1.3 },
      ring: [
        [-5.5, 35], [-5.5, 37.5], [0, 41.5], [3, 44], [8, 44.6], [10, 44.5], [12.5, 46],
        [14, 45.9], [19, 46], [22, 43], [26, 41.5], [26.3, 40.2], [27, 39.8], [28, 38],
        [32, 37.6], [36.5, 37.5], [36.5, 36.5], [35.5, 33], [34.2, 31.2], [32.3, 30.9],
        [30, 30.7], [25, 31.2], [20, 29.8], [15, 31.5], [10.8, 32.8], [10, 34], [9.5, 36.5],
        [3, 36.2], [-2, 34.7]
      ]
    },
    {
      id: 'baltico',
      name: 'Mar Báltico',
      short: 'Báltico',
      color: '#a3e635',
      emoji: '🦭',
      salt: 7,
      text: 'Muy poca sal. ¡Casi agua dulce!',
      label: { lat: 58.5, lng: 19.5 },
      sample: { lat: 57, lng: 19.5 },
      view: { lat: 59, lng: 20, altitude: 1.1 },
      ring: [
        [10.6, 57.75], [12.2, 57.9], [13, 59], [17, 61], [17, 62], [20, 66], [26, 66],
        [25, 64], [30, 61], [31, 60], [31, 59.5], [28, 57.5], [24, 54], [14, 53.5],
        [10, 53.8], [9.5, 55]
      ]
    },
    {
      id: 'muerto',
      name: 'Mar Muerto',
      short: 'Mar Muerto',
      color: '#fb923c',
      emoji: '🛟',
      salt: 340,
      text: '¡Muchísima sal! Flotas sin nadar.',
      label: { lat: 31.5, lng: 35.5 },
      labelRight: true,
      sample: null, // los modelos del océano no incluyen el Mar Muerto
      view: { lat: 31.5, lng: 35.5, altitude: 0.9 },
      // Es muy pequeño: lo dibujamos como un círculo más grande para que se vea
      circle: { lng: 35.5, lat: 31.5, radius: 1.0 }
    }
  ];

  // ---------- Estado ----------
  const state = {
    mode: 'fixed',          // 'fixed' | 'live'
    selected: null,         // id del mar
    baseTexture: null,
    liveTexture: null,
    liveValues: {},         // id -> número
    liveDate: null,
    loadingLive: false
  };

  const labelEls = {};
  const cardEls = {};

  // ---------- Utilidades ----------
  const $ = (sel) => document.querySelector(sel);

  function hexToRgba(hex, a) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }

  function closeRing(r) {
    const a = r[0], b = r[r.length - 1];
    return a[0] === b[0] && a[1] === b[1] ? r.slice() : [...r, a];
  }
  // Los anillos exteriores deben ir en sentido horario (convención de d3-geo / globe.gl)
  function clockwise(ring) {
    let s = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const [x1, y1] = ring[i], [x2, y2] = ring[i + 1];
      s += (x2 - x1) * (y2 + y1);
    }
    return s > 0;
  }
  function cw(ring) {
    const r = closeRing(ring);
    return clockwise(r) ? r : r.slice().reverse();
  }
  function circleRing(lng, lat, radius, n = 48) {
    const pts = [];
    const k = 1 / Math.cos((lat * Math.PI) / 180);
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      pts.push([lng + Math.cos(t) * radius * k, lat + Math.sin(t) * radius]);
    }
    return pts;
  }

  function seaValue(sea) {
    if (state.mode === 'live' && Number.isFinite(state.liveValues[sea.id])) {
      return state.liveValues[sea.id];
    }
    return sea.salt;
  }
  function fmt(v) {
    return v >= 100 ? Math.round(v).toString() : (Math.round(v * 10) / 10).toString().replace('.', ',');
  }
  function isLiveValue(sea) {
    return state.mode === 'live' && Number.isFinite(state.liveValues[sea.id]);
  }

  // 1 cucharadita de sal ≈ 6 gramos
  function spoonsHTML(grams) {
    const n = Math.max(1, Math.round(grams / 6));
    const shown = Math.min(n, 8);
    let html = '🥄'.repeat(shown);
    if (n > shown) html += `<span class="more">… ¡${n}!</span>`;
    return { html, n };
  }

  // ---------- Mensajes ----------
  let toastTimer = null;
  function showToast(text, { spinner = false, ms = 0 } = {}) {
    const el = $('#toast');
    clearTimeout(toastTimer);
    el.innerHTML = (spinner ? '<span class="spinner" aria-hidden="true"></span>' : '') + `<span>${text}</span>`;
    el.hidden = false;
    if (ms) toastTimer = setTimeout(hideToast, ms);
  }
  function hideToast() { $('#toast').hidden = true; }

  // ---------- Textura base (océano oscuro) ----------
  function paintOcean(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, TEX_H);
    g.addColorStop(0, OCEAN_TOP);
    g.addColorStop(0.5, OCEAN_MID);
    g.addColorStop(1, OCEAN_TOP);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, TEX_W, TEX_H);
  }
  function paintGrid(ctx) {
    ctx.strokeStyle = 'rgba(120, 160, 255, 0.07)';
    ctx.lineWidth = 1.5;
    for (let lng = -180; lng <= 180; lng += 30) {
      const x = ((lng + 180) / 360) * TEX_W;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, TEX_H); ctx.stroke();
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = ((90 - lat) / 180) * TEX_H;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(TEX_W, y); ctx.stroke();
    }
  }
  function makeBaseTexture() {
    const c = document.createElement('canvas');
    c.width = TEX_W; c.height = TEX_H;
    const ctx = c.getContext('2d');
    paintOcean(ctx);
    paintGrid(ctx);
    return c.toDataURL('image/jpeg', 0.92);
  }

  // ---------- Polígonos ----------
  const seaFeatures = SEAS.map((sea) => ({
    type: 'Feature',
    properties: { kind: 'sea', id: sea.id },
    geometry: {
      type: 'Polygon',
      coordinates: [cw(sea.circle ? circleRing(sea.circle.lng, sea.circle.lat, sea.circle.radius) : sea.ring)]
    }
  }));
  let landFeatures = [];
  const seaById = Object.fromEntries(SEAS.map((s) => [s.id, s]));

  function capColor(f) {
    if (f.properties.kind === 'land') return '#1a1f2e';
    const sea = seaById[f.properties.id];
    const sel = state.selected === sea.id;
    if (state.mode === 'live' && sea.sample) return hexToRgba(sea.color, sel ? 0.22 : 0.05);
    return hexToRgba(sea.color, sel ? 0.85 : (state.selected ? 0.35 : 0.55));
  }
  function strokeColor(f) {
    if (f.properties.kind === 'land') return '#2a3046';
    return seaById[f.properties.id].color;
  }
  function sideColor(f) {
    return f.properties.kind === 'land' ? '#0d1019' : 'rgba(0,0,0,0)';
  }
  function altitude(f) {
    if (f.properties.kind === 'land') return LAND_ALT;
    return f.properties.id === 'muerto' ? DEAD_ALT : SEA_ALT;
  }

  // ---------- Etiquetas sobre el globo ----------
  function makeLabel(sea) {
    const el = document.createElement('div');
    el.className = 'sea-label' + (sea.labelRight ? ' is-right' : '');
    el.style.setProperty('--c', sea.color);
    el.setAttribute('role', 'button');
    el.addEventListener('click', (e) => { e.stopPropagation(); select(sea.id); });
    labelEls[sea.id] = el;
    updateLabel(sea);
    return el;
  }
  function updateLabel(sea) {
    const el = labelEls[sea.id];
    if (!el) return;
    el.innerHTML =
      `<span class="emo" aria-hidden="true">${sea.emoji}</span>` +
      `<span class="nm">${sea.short}</span>` +
      `<span class="val">${fmt(seaValue(sea))} g</span>`;
    el.classList.toggle('is-selected', state.selected === sea.id);
  }

  // ---------- Tarjetas ----------
  function buildCards() {
    const wrap = $('#cards');
    SEAS.forEach((sea) => {
      const b = document.createElement('button');
      b.className = 'card';
      b.style.setProperty('--c', sea.color);
      b.addEventListener('click', () => select(sea.id));
      wrap.appendChild(b);
      cardEls[sea.id] = b;
      updateCard(sea);
    });
  }
  function updateCard(sea) {
    const b = cardEls[sea.id];
    const v = seaValue(sea);
    const sp = spoonsHTML(v);
    let tag = '';
    if (state.mode === 'live') {
      tag = isLiveValue(sea)
        ? '<span class="card-tag is-live">HOY</span>'
        : '<span class="card-tag">de siempre</span>';
    }
    b.innerHTML =
      tag +
      `<div class="card-head"><div class="card-emoji" aria-hidden="true">${sea.emoji}</div>` +
      `<div class="card-name">${sea.name}</div></div>` +
      `<div class="card-value">${fmt(v)}<small>g</small></div>` +
      `<div class="card-unit">de sal en 1 litro de agua</div>` +
      `<div class="card-spoons" aria-hidden="true">${sp.html}</div>` +
      `<div class="card-spoon-text">${sp.n === 1 ? '1 cucharadita' : sp.n + ' cucharaditas'} de sal</div>` +
      `<div class="card-text">${sea.text}</div>`;
    b.classList.toggle('is-selected', state.selected === sea.id);
    b.setAttribute('aria-pressed', state.selected === sea.id ? 'true' : 'false');
    b.setAttribute('aria-label', `${sea.name}: ${fmt(v)} gramos de sal en un litro de agua`);
  }

  function refreshAll() {
    SEAS.forEach((s) => { updateLabel(s); updateCard(s); });
    if (world) {
      world.polygonCapColor((f) => capColor(f));
      world.polygonStrokeColor((f) => strokeColor(f));
    }
  }

  // ---------- Globo ----------
  function createGlobe(el) {
    // globe.gl nuevo usa "new Globe(el)"; el antiguo "Globe()(el)"
    try {
      const g = new Globe(el, { animateIn: false });
      if (g && typeof g.polygonsData === 'function' && el.querySelector('canvas')) return g;
    } catch (e) { /* versión antigua */ }
    return Globe({ animateIn: false })(el);
  }

  const globeEl = $('#globe');
  state.baseTexture = makeBaseTexture();

  const world = createGlobe(globeEl)
    .width(window.innerWidth)
    .height(window.innerHeight)
    .backgroundColor('#04050c')
    .backgroundImageUrl(STARS_URL)
    .globeImageUrl(state.baseTexture)
    .showAtmosphere(true)
    .atmosphereColor('#4cc9f0')
    .atmosphereAltitude(0.22)
    .showGraticules(false)
    // Polígonos: países + mares
    .polygonsData(seaFeatures)
    .polygonCapColor(capColor)
    .polygonSideColor(sideColor)
    .polygonStrokeColor(strokeColor)
    .polygonAltitude(altitude)
    .polygonCapCurvatureResolution(3)
    .polygonsTransitionDuration(0)
    .onPolygonClick((f) => {
      if (f && f.properties.kind === 'sea') select(f.properties.id);
    })
    .onPolygonHover((f) => {
      globeEl.style.cursor = f && f.properties.kind === 'sea' ? 'pointer' : '';
    })
    // Etiquetas HTML
    .htmlElementsData(SEAS)
    .htmlLat((s) => s.label.lat)
    .htmlLng((s) => s.label.lng)
    .htmlAltitude(0.03)
    .htmlElement(makeLabel)
    // Aro que late sobre el Mar Muerto (es muy pequeño)
    .ringsData([{ lat: 31.5, lng: 35.5 }])
    .ringColor(() => (t) => `rgba(251, 146, 60, ${1 - t})`)
    .ringMaxRadius(4)
    .ringPropagationSpeed(2.5)
    .ringRepeatPeriod(1400)
    .ringAltitude(DEAD_ALT + 0.001);

  if (typeof world.htmlElementVisibilityModifier === 'function') {
    // Oculta las etiquetas que quedan detrás del globo
    world.htmlElementVisibilityModifier((el, visible) => {
      el.style.opacity = visible ? '1' : '0';
      el.style.pointerEvents = visible ? 'auto' : 'none';
    });
  }

  world.pointOfView({ lat: 35, lng: -10, altitude: 2.4 }, 0);

  // Giro automático + giro con el ratón
  const controls = world.controls();
  controls.autoRotate = false;
  controls.autoRotateSpeed = ROTATE_SPEED;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 160;
  controls.maxDistance = 520;
  controls.enablePan = false;

  let resumeTimer = null;
  function pauseRotation(ms = 5000) {
    controls.autoRotate = false;
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { controls.autoRotate = false; }, ms);
  }
  controls.addEventListener('start', () => { controls.autoRotate = false; clearTimeout(resumeTimer); });
  controls.addEventListener('end', () => pauseRotation(4000));

  window.addEventListener('resize', () => {
    world.width(window.innerWidth).height(window.innerHeight);
  });

  // Países (tierra oscura)
  fetch(COUNTRIES_URL)
    .then((r) => r.json())
    .then((geo) => {
      landFeatures = geo.features
        .map((f) => ({ ...f, properties: { kind: 'land' } }));
      world.polygonsData([...landFeatures, ...seaFeatures]);
    })
    .catch(() => showToast('No se pudo cargar el mapa de la tierra 🌍', { ms: 4000 }));

  // ---------- Seleccionar un mar ----------
  function select(id) {
    state.selected = state.selected === id ? null : id;
    refreshAll();
    if (state.selected) {
      world.pointOfView(seaById[id].view, 1600);
      pauseRotation(9000);
      const card = cardEls[id];
      if (card && card.scrollIntoView) card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  // ---------- Cambiar de modo ----------
  document.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });

  async function setMode(mode) {
    if (mode === state.mode || state.loadingLive) return;

    if (mode === 'fixed') {
      applyMode('fixed');
      return;
    }

    // Modo "hoy"
    if (!state.liveTexture) {
      state.loadingLive = true;
      showToast('🛰️ Buscando la sal de hoy…', { spinner: true });
      try {
        await loadLive();
        hideToast();
      } catch (err) {
        console.error('[Copernicus]', err);
        state.loadingLive = false;
        showToast('Ahora no podemos ver la sal de hoy 😕 Prueba más tarde.', { ms: 4500 });
        return;
      }
      state.loadingLive = false;
    }
    applyMode('live');
  }

  function applyMode(mode) {
    state.mode = mode;
    document.querySelectorAll('.mode-btn').forEach((b) => {
      const on = b.dataset.mode === mode;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    world.globeImageUrl(mode === 'live' ? state.liveTexture : state.baseTexture);
    $('#legend').hidden = mode !== 'live';
    $('#credit-live').hidden = mode !== 'live';
    refreshAll();
  }

  // =========================================================
  //  Copernicus Marine (WMTS) con OpenLayers
  //  1) Lee las capacidades WMTS del producto
  //  2) Pinta la capa de salinidad superficial en un mapa OL oculto (EPSG:4326)
  //  3) Convierte ese mapa en una imagen y la pone como "piel" del globo
  //  4) Pide el valor exacto en un punto de cada mar (GetFeatureInfo)
  // =========================================================
  async function loadLive() {
    const resp = await fetchWithTimeout(CMEMS_CAPS, 20000);
    if (!resp.ok) throw new Error('GetCapabilities ' + resp.status);
    const caps = new ol.format.WMTSCapabilities().read(await resp.text());

    const layers = (caps.Contents && caps.Contents.Layer) || [];
    const layer =
      layers.find((l) => /phy-so_anfc.*P1D-m.*\/so$/i.test(l.Identifier)) ||
      layers.find((l) => /so_anfc.*\/so$/i.test(l.Identifier)) ||
      layers.find((l) => /\/so$/i.test(l.Identifier));
    if (!layer) throw new Error('No se encontró la capa de salinidad');

    const optionsFromCapabilities =
      (ol.source.WMTS && ol.source.WMTS.optionsFromCapabilities) || ol.source.optionsFromCapabilities;
    let options =
      optionsFromCapabilities(caps, { layer: layer.Identifier, projection: 'EPSG:4326' }) ||
      optionsFromCapabilities(caps, { layer: layer.Identifier });
    if (!options) throw new Error('Opciones WMTS no válidas');

    options.crossOrigin = 'anonymous';
    options.style = CMEMS_STYLE;
    options.wrapX = false;

    // Pide el día de hoy si el servicio tiene dimensión de tiempo
    const dims = options.dimensions || {};
    const timeKey = Object.keys(dims).find((k) => k.toLowerCase() === 'time');
    const defaultTime = timeKey ? dims[timeKey] : null;
    if (timeKey && typeof defaultTime === 'string' && /^\d{4}-\d{2}-\d{2}/.test(defaultTime)) {
      const today = new Date().toISOString().slice(0, 10);
      dims[timeKey] = defaultTime.replace(/^\d{4}-\d{2}-\d{2}/, today);
    }
    options.dimensions = dims;

    let { source, map, ok } = await renderOL(options);

    // Si "hoy" no existe todavía, usamos el día por defecto del servicio
    if (!ok && timeKey && defaultTime) {
      map.setTarget(null);
      options.dimensions = { ...dims, [timeKey]: defaultTime };
      ({ source, map, ok } = await renderOL(options));
    }
    if (!ok) throw new Error('No se cargaron teselas');

    state.liveTexture = composeTexture(map); // puede lanzar error si el canvas está "contaminado" (CORS)

    // Valores exactos en cada mar
    const results = await Promise.allSettled(
      SEAS.filter((s) => s.sample).map(async (s) => [s.id, await getValue(source, s.sample.lng, s.sample.lat)])
    );
    results.forEach((r) => {
      if (r.status === 'fulfilled' && Number.isFinite(r.value[1])) state.liveValues[r.value[0]] = r.value[1];
    });

    map.setTarget(null);
  }

  function renderOL(options) {
    return new Promise((resolve) => {
      const source = new ol.source.WMTS(options);
      let loaded = 0, failed = 0;
      source.on('tileloadend', () => loaded++);
      source.on('tileloaderror', () => failed++);

      const map = new ol.Map({
        target: 'olmap',
        pixelRatio: 1,
        controls: [],
        interactions: [],
        layers: [new ol.layer.Tile({ source })],
        view: new ol.View({
          projection: 'EPSG:4326',
          center: [0, 0],
          resolution: 360 / TEX_W,
          constrainResolution: false,
          multiWorld: false
        })
      });

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve({ source, map, ok: loaded > 0 });
      };
      map.once('rendercomplete', finish);
      setTimeout(finish, 25000);
    });
  }

  function composeTexture(map) {
    const out = document.createElement('canvas');
    out.width = TEX_W; out.height = TEX_H;
    const ctx = out.getContext('2d');
    paintOcean(ctx);

    map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer').forEach((canvas) => {
      if (canvas.width <= 0) return;
      const opacity = canvas.parentNode.style.opacity || canvas.style.opacity;
      ctx.globalAlpha = opacity === '' ? 1 : Number(opacity);
      let matrix;
      const transform = canvas.style.transform;
      const m = transform && transform.match(/^matrix\(([^(]*)\)$/);
      if (m) {
        matrix = m[1].split(',').map(Number);
      } else {
        matrix = [
          parseFloat(canvas.style.width) / canvas.width || 1, 0, 0,
          parseFloat(canvas.style.height) / canvas.height || 1, 0, 0
        ];
      }
      ctx.setTransform(...matrix);
      ctx.drawImage(canvas, 0, 0);
    });
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    paintGrid(ctx);
    return out.toDataURL('image/jpeg', 0.92);
  }

  async function getValue(source, lng, lat) {
    if (source.getRequestEncoding && source.getRequestEncoding() === 'REST') return null;
    const tg = source.getTileGrid();
    const proj = source.getProjection();
    const coord = ol.proj.transform([lng, lat], 'EPSG:4326', proj);
    const z = Math.min(3, tg.getMaxZoom());
    const tc = tg.getTileCoordForCoordAndZ(coord, z);
    const ext = tg.getTileCoordExtent(tc);
    const res = tg.getResolution(z);
    const params = new URLSearchParams({
      SERVICE: 'WMTS',
      REQUEST: 'GetFeatureInfo',
      VERSION: '1.0.0',
      LAYER: source.getLayer(),
      STYLE: source.getStyle(),
      FORMAT: source.getFormat(),
      TILEMATRIXSET: source.getMatrixSet(),
      TILEMATRIX: tg.getMatrixId(z),
      TILEROW: String(tc[2]),
      TILECOL: String(tc[1]),
      I: String(Math.floor((coord[0] - ext[0]) / res)),
      J: String(Math.floor((ext[3] - coord[1]) / res)),
      INFOFORMAT: 'application/json'
    });
    Object.entries(source.getDimensions() || {}).forEach(([k, v]) => params.set(k, v));

    let base = source.getUrls()[0];
    base = base.replace(/[?&]+$/, '');
    const url = base + (base.includes('?') ? '&' : '?') + params.toString();

    const r = await fetchWithTimeout(url, 15000);
    if (!r.ok) return null;
    const json = await r.json();
    const v = extractNumber(json);
    return Number.isFinite(v) && v > 0 && v < 50 ? v : null;
  }

  // Busca el valor numérico de la respuesta (el formato puede variar)
  function extractNumber(json) {
    let found = null;
    (function walk(o, key) {
      if (found !== null || o == null) return;
      if (typeof o === 'number' && Number.isFinite(o) && /value|so|sal/i.test(key || '')) { found = o; return; }
      if (typeof o === 'string' && /value|so|sal/i.test(key || '') && o.trim() !== '' && !isNaN(+o)) { found = +o; return; }
      if (typeof o === 'object') for (const k of Object.keys(o)) walk(o[k], k);
    })(json, '');
    return found;
  }

  function fetchWithTimeout(url, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
  }

  // ---------- Inicio ----------
  buildCards();
})();
