const C = [
    { id: 'Lamborghini Aventador SV', name: 'Lamborghini Aventador SV', c: ['Black', 'White', 'Green', 'Blue', 'Red', 'Gray'], h: { Black: '#000', White: '#fff', Green: '#22c55e', Blue: '#3b82f6', Red: '#ef4444', Gray: '#64748b' } },
    { id: 'BMW M3', name: 'BMW M3', c: ['Black', 'White', 'Green', 'Blue', 'Red', 'Gray'], h: { Black: '#000', White: '#fff', Green: '#16a34a', Blue: '#2563eb', Red: '#dc2626', Gray: '#4b5563' } }
], s = { i: 0, c: 'Red', m: 'weighted' }, el = { i: document.getElementById('car-image'), n: document.getElementById('car-name'), p: document.getElementById('physics-mode'), cp: document.getElementById('color-picker'), pr: document.getElementById('prev-car'), nx: document.getElementById('next-car') },
nt = () => { const cr = C[s.i], d = { carId: cr.id, colorId: s.c, physicsMode: s.m }; if (chrome?.storage) { chrome.storage.sync.set(d); chrome.tabs.query({ active: true, currentWindow: true }, t => { if (t[0]?.id) chrome.tabs.sendMessage(t[0].id, { type: 'UPDATE_CARSOR', ...d }).catch(() => {}); }); } },
rd = () => { const cr = C[s.i]; if (!cr.c.includes(s.c)) s.c = cr.c[0]; el.i.src = `images/${cr.id}_Garage_${s.c}.png`; el.n.textContent = cr.name; el.p.value = s.m; el.cp.innerHTML = ''; cr.c.forEach(c => { const b = document.createElement('button'); b.className = `color-btn ${s.c === c ? 'active' : ''}`; b.style.backgroundColor = cr.h[c]; b.onclick = () => { s.c = c; rd(); nt(); }; el.cp.appendChild(b); }); };
el.pr.onclick = () => { s.i = (s.i - 1 + C.length) % C.length; rd(); nt(); };
el.nx.onclick = () => { s.i = (s.i + 1) % C.length; rd(); nt(); };
el.p.onchange = e => { s.m = e.target.value; nt(); };
if (chrome?.storage) chrome.storage.sync.get(['carId', 'colorId', 'physicsMode'], r => { if (r.carId) { const i = C.findIndex(x => x.id === r.carId); if (i !== -1) s.i = i; s.c = r.colorId || s.c; s.m = r.physicsMode || s.m; } rd(); }); else rd();
