(() => {
const $ = (s,r=document)=>r.querySelector(s), $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement, tbtn = $('#theme');

/* Theme */
const setTheme = t => { root.dataset.theme = t; tbtn.setAttribute('aria-pressed', t==='dark'); try{localStorage.setItem('sk-theme',t)}catch(e){} };
tbtn.setAttribute('aria-pressed', root.dataset.theme==='dark');
tbtn.addEventListener('click', () => setTheme(root.dataset.theme==='dark' ? 'light' : 'dark'));

/* Mobile menu */
const nt = $('#navToggle'), np = $('#navPanel');
const menu = open => { np.classList.toggle('open', open); nt.setAttribute('aria-expanded', open); nt.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); };
nt.addEventListener('click', () => menu(!np.classList.contains('open')));
np.addEventListener('click', e => { if (e.target.closest('a')) menu(false); });
addEventListener('keydown', e => { if (e.key === 'Escape' && np.classList.contains('open')) { menu(false); nt.focus(); } });

/* Hero. The name swells on load, near the cursor and with scroll. Dots light up in an accent circle around the cursor */
const hero = $('#hero'), nm = $('#name'), cv = $('#dots');
$$('.ln', nm).forEach(ln => { ln.innerHTML = [...ln.textContent].map(ch => `<span class="l">${ch}</span>`).join(''); });
const L = $$('.l', nm), w = L.map(() => 300), t0 = performance.now();
let mx = -1e4, my = -1e4, sy = scrollY, heroVis = true;
const paint = (el,i,v) => { w[i] = v; el.style.fontVariationSettings = `'wght' ${v|0},'wdth' ${(100 - (v-300)/500*16)|0}`; };

const ctx = cv.getContext('2d'), GAP = 26, R0 = 210, col = {ink:'#000', ac:'#f0f'};
let W = 0, H = 0, px = -1e4, py = -1e4, tx = -1e4, ty = -1e4, rad = 0;
const colors = () => { const s = getComputedStyle(root); col.ink = s.getPropertyValue('--ink').trim(); col.ac = s.getPropertyValue('--ac').trim(); draw(); };
const draw = () => {
  ctx.clearRect(0,0,W,H); ctx.fillStyle = col.ink; ctx.globalAlpha = .3; ctx.beginPath();
  const hot = [];
  for (let y = GAP/2; y < H; y += GAP) for (let x = GAP/2; x < W; x += GAP) {
    const k = rad > 1 ? Math.max(0, 1 - Math.hypot(x-px, y-py)/rad) : 0;
    if (k > 0) hot.push(x, y, k); else { ctx.moveTo(x+1.1, y); ctx.arc(x, y, 1.1, 0, 6.2832); }
  }
  ctx.fill(); ctx.fillStyle = col.ac;
  for (let i = 0; i < hot.length; i += 3) { const k = hot[i+2], s = k*k*(3-2*k);   /* thin at the edge, bold in the middle */
    ctx.globalAlpha = .35 + .65*s; ctx.beginPath(); ctx.arc(hot[i], hot[i+1], 1.1 + 3.4*s, 0, 6.2832); ctx.fill(); }
  ctx.globalAlpha = 1;
};
const size = () => { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = W*d; cv.height = H*d; ctx.setTransform(d,0,0,d,0,0); draw(); };
size(); colors(); addEventListener('resize', size);
new MutationObserver(colors).observe(root, {attributes:true, attributeFilter:['data-theme']});

if (calm) L.forEach((el,i) => paint(el,i,420)); else {
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; });
  addEventListener('pointerdown', e => { mx = e.clientX; my = e.clientY; });
  root.addEventListener('pointerleave', () => { mx = my = -1e4; });
  addEventListener('scroll', () => { sy = scrollY; }, {passive:true});
  new IntersectionObserver(e => { heroVis = e[0].isIntersecting; }).observe(hero);
  (function tick(now){
    if (heroVis) {
      const t = (now - t0)/1000, sc = sy/innerHeight*(L.length+6) - 3;
      L.forEach((el,i) => {
        const r = el.getBoundingClientRect(), d = Math.hypot(mx-(r.left+r.width/2), my-(r.top+r.height/2));
        const load = t < 2.6 ? 420*Math.max(0, 1 - Math.abs(i - (t*9 - 3))/3) : 0;
        const scroll = sy > 2 ? 440*Math.max(0, 1 - Math.abs(i - sc)/3) : 0;
        paint(el, i, w[i] + (Math.min(780, 300 + 480*Math.max(0, 1 - d/260) + Math.max(load, scroll)) - w[i]) * .14);
      });
      const r = cv.getBoundingClientRect(), inside = mx >= r.left && mx <= r.right && my >= r.top && my <= r.bottom;
      if (inside) { tx = mx - r.left; ty = my - r.top; if (px < -1e3) { px = tx; py = ty; } }
      px += (tx - px)*.18; py += (ty - py)*.18; rad += ((inside ? R0 : 0) - rad)*.1;
      if (inside || rad > .5) draw(); else if (rad) { rad = 0; draw(); }
    }
    requestAnimationFrame(tick);
  })(performance.now());
}

/* Scroll reveals and the career line */
const rvo = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rvo.unobserve(e.target); } }), {threshold:.15, rootMargin:'0px 0px -6% 0px'});
$$('.rv').forEach(el => calm ? el.classList.add('in') : rvo.observe(el));
const expEl = $('.exp');
const careerLine = () => { const r = expEl.getBoundingClientRect(); expEl.style.setProperty('--p', calm ? 1 : Math.min(1, Math.max(0, (innerHeight*.65 - r.top)/r.height)).toFixed(3)); };
addEventListener('scroll', careerLine, {passive:true}); addEventListener('resize', careerLine); careerLine();

/* Case studies */
const lb = $('#lb'); let zoom = [], lbI = 0;
const openCase = id => {
  const d = document.getElementById(id); if (!d || !d.matches('dialog.case')) return;
  $$('dialog.case[open]').forEach(o => o !== d && o.close());
  if (!d.open) { d.showModal(); document.body.style.overflow = 'hidden'; }
  d.scrollTop = 0; history.replaceState(null,'','#'+id);
};
const finish = d => { d.classList.remove('out'); d.close(); };
const closeCase = d => {
  if (!d || !d.open || d.classList.contains('out')) return;
  if (calm) return finish(d);
  d.classList.add('out');
  const h = e => { if (e.target !== d) return; d.removeEventListener('animationend', h); finish(d); };
  d.addEventListener('animationend', h);
};
$$('dialog.case').forEach(d => d.addEventListener('close', () => {
  if (!$('dialog.case[open]')) { document.body.style.overflow = ''; history.replaceState(null,'','#works'); }
}));
document.addEventListener('cancel', e => { if (e.target.matches?.('dialog.case')) { e.preventDefault(); closeCase(e.target); } }, true);
document.addEventListener('click', e => {
  const o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); return openCase(o.dataset.open); }
  if (e.target.matches('dialog.case')) return closeCase(e.target);          /* backdrop click */
  if (e.target.closest('[data-close]')) return closeCase(e.target.closest('dialog.case'));
  const n = e.target.closest('[data-next]'); if (n) return openCase(n.dataset.next);
  const z = e.target.closest('.zoom'); if (z) { zoom = $$('.zoom', z.closest('dialog.case')); showLb(zoom.indexOf(z), true); }
});

/* Lightbox, images keep their natural aspect ratio */
function showLb(i, first){
  i = (i + zoom.length) % zoom.length; lbI = i;
  const src = $('img', zoom[i]), im = $('img', lb);
  im.src = src.currentSrc || src.src; im.alt = src.alt;
  $('figcaption', lb).textContent = zoom[i].dataset.cap || src.alt;
  $$('[data-step]', lb).forEach(b => { b.hidden = zoom.length < 2; });
  if (first && !lb.open) lb.showModal();
}
lb.addEventListener('click', e => { const s = e.target.closest('[data-step]'); s ? showLb(lbI + +s.dataset.step) : lb.close(); });
lb.addEventListener('keydown', e => { if (e.key === 'ArrowRight') showLb(lbI+1); if (e.key === 'ArrowLeft') showLb(lbI-1); });

/* Deep link */
if (location.hash.startsWith('#case-')) openCase(location.hash.slice(1));
})();