(() => {
    const P = Math.PI, P2 = P * 2, PH = P / 2, MS = 500, MP = 120, C = ['#f00', '#f60', '#fc0', '#fff'];
    const car = document.createElement('img'), can = document.createElement('canvas'), ctx = can.getContext('2d', { alpha: true });
    car.id = 'drift-car-sprite';
    // Hidden by default to prevent teleport flicker
    car.style.cssText = 'position:fixed;top:0;left:0;width:40px;height:40px;pointer-events:none;z-index:1000000;object-fit:contain;will-change:transform;opacity:0;transition:opacity 0.2s;';
    car.onerror = function () { console.error("Error: Could not find image at " + this.src); };
    can.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:999999;';

    let w, h, s = { carId: 'Lamborghini Aventador SV', colorId: 'Red', physicsMode: 'weighted' }, m = { x: 0, y: 0 }, p = { x: 0, y: 0, lx: 0, ly: 0 }, a = { c: 0, t: 0, l: 0 }, f = 0, anim = 1;
    const res = () => { w = can.width = window.innerWidth; h = can.height = window.innerHeight; };
    window.addEventListener('resize', res, { passive: true }); res();

    // 1. Initial State Load
    if (chrome?.storage) {
        chrome.storage.local.get(['lx', 'ly', 'la'], (r) => {
            if (r.lx !== undefined) {
                p.x = p.lx = m.x = r.lx;
                p.y = p.ly = m.y = r.ly;
                a.c = a.t = r.la || 0;
                updateTransform();
                car.style.opacity = '1';
            }
        });
    }

    document.body.append(car, can);

    const skids = Array.from({ length: MS }, () => ({ x1: 0, y1: 0, x2: 0, y2: 0, x3: 0, y3: 0, x4: 0, y4: 0, o: 0 })), parts = Array.from({ length: MP }, () => ({ x: 0, y: 0, vx: 0, vy: 0, l: 0, ml: 1, s: 0, c: '' }));
    let si = 0, as = 0, ap = 0;

    const up = () => {
        const src = chrome.runtime.getURL(`images/${s.carId}_Cursor_${s.colorId}.png`);
        car.src = src;
    };

    const sync = d => { if (!d) return; s.carId = d.carId || s.carId; s.colorId = d.colorId || s.colorId; s.physicsMode = d.physicsMode || s.physicsMode; up(); };

    if (chrome?.storage) {
        chrome.storage.sync.get(['carId', 'colorId', 'physicsMode'], sync);
        chrome.runtime.onMessage.addListener(r => r.type === 'UPDATE_CARSOR' && sync(r));
    }
    up();

    // 2. Persistent Save Logic
    const save = () => {
        if (chrome?.storage?.local) {
            chrome.storage.local.set({ lx: p.x, ly: p.y, la: a.c });
        }
    };
    setInterval(save, 500);
    document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && save());

    // 3. Mouse Move Initialization
    const initMouse = (e) => {
        m.x = p.x = p.lx = e.clientX;
        m.y = p.y = p.ly = e.clientY;
        car.style.opacity = '1';
        updateTransform();
        if (!anim) { anim = 1; requestAnimationFrame(draw); }
    };
    document.addEventListener('mousemove', initMouse, { once: true, passive: true });
    document.addEventListener('mousemove', e => {
        m.x = e.clientX; m.y = e.clientY;
        if (!anim) { anim = 1; requestAnimationFrame(draw); }
    }, { passive: true });

    const lap = (a, b, t) => { let d = b - a; while (d < -P) d += P2; while (d > P) d -= P2; return a + d * t; };

    function updateTransform() {
        car.style.transform = `translate3d(${p.x - 20}px, ${p.y - 20}px, 0) rotate(${a.c}rad)`;
    }

    function draw() {
        f++; const dxM = m.x - p.x, dyM = m.y - p.y;
        if (s.physicsMode === 'weighted') { p.x += dxM * 0.15; p.y += dyM * 0.15; } else { p.x = m.x; p.y = m.y; }
        const dx = p.x - p.lx, dy = p.y - p.ly, v2 = dx * dx + dy * dy, v = Math.sqrt(v2);
        if (v2 > 1) { const ma = Math.atan2(dy, dx); if (v > 5 || f % 5 === 0 || Math.abs(ma - a.t) > 0.26) a.t = ma; }
        a.l = a.c; a.c = lap(a.c, a.t, 0.2); let dd = Math.abs(a.c - a.l); while (dd > P) dd -= P2;
        if (Math.abs(dd) > 0.015 && v > 10) {
            const wa = a.c + PH, ox = Math.cos(wa) * 10, oy = Math.sin(wa) * 10, sk = skids[si];
            sk.x1 = p.lx - ox; sk.y1 = p.ly - oy; sk.x2 = p.x - ox; sk.y2 = p.y - oy;
            sk.x3 = p.lx + ox; sk.y3 = p.ly + oy; sk.x4 = p.x + ox; sk.y4 = p.y + oy; sk.o = 1; si = (si + 1) % MS; if (as < MS) as++;
        }
        let dr = as > 0 || ap > 0;
        if (dr) {
            ctx.clearRect(0, 0, w, h); ctx.strokeStyle = '#333'; ctx.lineWidth = 6; ctx.lineCap = 'round';
            let cs = 0; for (let i = 0; i < MS; ++i) { let k = skids[i]; if (k.o > 0) { k.o -= 0.01; if (k.o > 0) { ctx.globalAlpha = k.o; ctx.beginPath(); ctx.moveTo(k.x1, k.y1); ctx.lineTo(k.x2, k.y2); ctx.moveTo(k.x3, k.y3); ctx.lineTo(k.x4, k.y4); ctx.stroke(); cs++; } } } as = cs;
            let cp = 0; for (let i = 0; i < MP; ++i) { let r = parts[i]; if (r.l > 0) { r.x += r.vx; r.y += r.vy; r.s *= 0.9; r.l--; if (r.l > 0) { ctx.globalAlpha = r.l / r.ml; ctx.fillStyle = r.c; ctx.beginPath(); ctx.arc(r.x, r.y, r.s, 0, P2); ctx.fill(); cp++; } } } ap = cp; ctx.globalAlpha = 1;
        }
        if (v > 20) {
            const ra = a.c + P, rx = p.x + Math.cos(ra) * 20, ry = p.y + Math.sin(ra) * 20;
            for (let i = 0; i < 4; i++) for (let j = 0; j < MP; j++) if (parts[j].l <= 0) { const pt = parts[j]; pt.x = rx; pt.y = ry; const o = (Math.random() - 0.5) * 0.8, sp = Math.random() * 3 + 1; pt.vx = Math.cos(ra + o) * sp; pt.vy = Math.sin(ra + o) * sp; pt.ml = pt.l = 15 + Math.random() * 15; pt.s = 3 + Math.random() * 4; pt.c = C[(Math.random() * 4) | 0]; ap++; break; }
        }
        car.style.transform = `translate3d(${p.x - 20}px, ${p.y - 20}px, 0) rotate(${a.c}rad) scale(${v > 20 ? 1.1 : 1})`;
        p.lx = p.x; p.ly = p.y; if (v2 < 0.01 && !dr && Math.abs(a.c - a.t) < 0.01 && Math.abs(dxM) < 0.5) anim = 0; else requestAnimationFrame(draw);
    }
    draw();
})();
