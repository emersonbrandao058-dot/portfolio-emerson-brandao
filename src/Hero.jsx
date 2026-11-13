import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';
import { assetUrl } from './asset-url.js';
import { useI18n } from './i18n.jsx';
import { whenPreloaderDone } from './Preloader.jsx';

gsap.registerPlugin(ScrollTrigger);

const quoteUrl = message => `https://wa.me/5575999312633?text=${encodeURIComponent(message)}`;

/* Lens outlines in the portrait's own pixel space (1672 × 941). */
const LENS_LEFT = 'M671 262 L818 255 Q823 298 816 330 Q806 352 760 356 Q712 359 693 350 Q675 338 669 300 Z';
const LENS_RIGHT = 'M867 256 L1018 254 Q1025 291 1018 330 Q1009 350 960 353 Q910 355 889 343 Q873 330 868 300 Z';
const GLASSES_CENTER = { x: 845 / 1672, y: 305 / 941 };

/* What the screen in front of him shows: a build, a commit, a deploy. */
const sessionsFor = term => [
  [['$ ', 'npm run build'], ['', 'vite v6.4 building…', 'out'], ['', '✓ 214 modules transformed', 'ok'], ['', '✓ built in 1.84s', 'ok'], ['$ ', 'git push origin main'], ['', term.deploy, 'out'], ['', term.live, 'ok']],
  [['$ ', 'npm test'], ['', term.responsive, 'ok'], ['', term.a11y, 'ok'], ['', term.seo, 'ok'], ['$ ', 'git commit -m "hero"'], ['', '[main 4f2a9c1] 3 files', 'out']],
  [['$ ', 'npm run dev'], ['', 'VITE ready in 312 ms', 'out'], ['', '➜ localhost:5173', 'ok'], ['$ ', 'code src/Hero.jsx'], ['', term.motto, 'out']],
];
const LINES = 7;
const LINE_STEP = 10;
const FIRST_BASELINE = 18;

function GlassesTerminal({ terminal }) {
  const svg = useRef(null);
  /* The loop reads the current language through a ref: a switch shows from the next line on, without restarting it. */
  const sessions = useRef(null);
  sessions.current = sessionsFor(terminal);
  const refresh = useRef(null);
  useEffect(() => { refresh.current?.(); }, [terminal]);

  useEffect(() => {
    const root = svg.current;
    const rows = [...root.querySelectorAll('.term-row')];
    const cursor = root.querySelector('.term-cursor');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const buffer = [];
    let charWidth = 0;

    const render = () => {
      rows.forEach((row, index) => {
        const line = buffer[index];
        const [prompt, text] = row.children;
        prompt.textContent = line ? line.prompt : '';
        text.textContent = line ? line.text : '';
        row.setAttribute('class', 'term-row' + (line?.kind ? ' is-' + line.kind : ''));
      });
      const last = buffer.length - 1;
      if (last < 0) { cursor.setAttribute('opacity', '0'); return; }
      // The rows are monospaced: one measured character gives every cursor position. Measuring the
      // row on each typed character forced a layout of the whole page every 40-110ms.
      const length = rows[last].textContent.length;
      if (!charWidth && length) charWidth = (rows[last].getComputedTextLength?.() || 0) / length;
      const width = length * charWidth;
      cursor.setAttribute('x', String(8 + width + 1.5));
      cursor.setAttribute('y', String(FIRST_BASELINE + last * LINE_STEP - 6.4));
      cursor.setAttribute('opacity', '1');
    };
    const push = line => { buffer.push(line); if (buffer.length > LINES) buffer.shift(); };

    if (reduced) {
      refresh.current = () => {
        buffer.length = 0;
        sessions.current[0].forEach(([prompt, text, kind]) => push({ prompt, text, kind: kind || 'cmd' }));
        render();
      };
      refresh.current();
      return () => { refresh.current = null; };
    }

    let session = 0, line = 0, char = 0, timer = 0, running = false, visible = true;
    const schedule = (fn, delay) => { timer = window.setTimeout(fn, delay); };
    const tick = () => {
      if (!running) return;
      const SESSIONS = sessions.current;
      const script = SESSIONS[session];
      if (line >= script.length) {
        schedule(() => { buffer.length = 0; session = (session + 1) % SESSIONS.length; line = 0; render(); schedule(tick, 500); }, 3200);
        return;
      }
      const [prompt, text, kind] = script[line];
      if (!kind) {
        if (char === 0) push({ prompt, text: '', kind: 'cmd' });
        char += 1;
        buffer[buffer.length - 1].text = text.slice(0, char);
        render();
        if (char >= text.length) { char = 0; line += 1; schedule(tick, 520); }
        else schedule(tick, 42 + Math.random() * 70);
      } else {
        push({ prompt, text, kind });
        line += 1;
        render();
        schedule(tick, 140 + Math.random() * 220);
      }
    };
    const start = () => { if (running || !visible || document.hidden) return; running = true; tick(); };
    const stop = () => { running = false; window.clearTimeout(timer); };
    const onVisibility = () => (document.hidden ? stop() : start());
    /* The typing and the hero's ambient loops run only while at least half of what can fit of the
       portrait is on screen: once the reader is scrolling on, their repaints only cost frames. */
    const hero = root.closest('.cine');
    const observer = new IntersectionObserver(entries => {
      const entry = entries.at(-1); // the latest record is the current state
      const fits = Math.min(entry.boundingClientRect.height, window.innerHeight);
      visible = entry.isIntersecting && entry.intersectionRect.height >= fits * .5;
      hero?.classList.toggle('is-away', !visible);
      visible ? start() : stop();
    }, { threshold: [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1] });

    render();
    /* Typing starts 1.7s into the hero's opening, which itself waits for the preloader: started on
       mount, it typed (and repainted the lenses) behind the preloader and through the whole opening. */
    let boot = 0;
    const stopWaiting = whenPreloaderDone(() => {
      boot = window.setTimeout(() => { observer.observe(root); document.addEventListener('visibilitychange', onVisibility); }, 1700);
    });
    return () => {
      stopWaiting();
      window.clearTimeout(boot);
      stop();
      observer.disconnect();
      hero?.classList.remove('is-away');
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <svg ref={svg} className="cine-lens" viewBox="0 0 1672 941" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">
    <defs>
      <clipPath id="cine-lens-clip"><path d={LENS_LEFT} /><path d={LENS_RIGHT} /></clipPath>
      <linearGradient id="cine-glint-fill" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset=".5" stopColor="#fff" stopOpacity=".55" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      {/* Convex lenses shrink a reflection and let it die out towards the rim. */}
      <radialGradient id="cine-lens-falloff"><stop offset=".25" stopColor="#fff" /><stop offset=".72" stopColor="#777" /><stop offset="1" stopColor="#000" /></radialGradient>
      <mask id="cine-lens-mask" maskUnits="userSpaceOnUse" x="640" y="230" width="410" height="150">
        <ellipse cx="748" cy="300" rx="92" ry="64" fill="url(#cine-lens-falloff)" />
        <ellipse cx="946" cy="298" rx="92" ry="64" fill="url(#cine-lens-falloff)" />
      </mask>
      <filter id="cine-lens-soften" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation=".32" /></filter>
    </defs>
    <g clipPath="url(#cine-lens-clip)">
      <g className="lens-content" mask="url(#cine-lens-mask)" filter="url(#cine-lens-soften)">
        <g className="lens-drift">
          {/* The screen is mirrored, as a reflection is; the right lens sees it from a slightly different angle. */}
          <g transform="translate(690 263) skewY(-3) scale(.9)">
            <g id="cine-screen" transform="translate(132 0) scale(-1 1)">
              <rect className="lens-panel" width="132" height="86" rx="3" />
              <rect className="lens-panel-bar" width="132" height="8" rx="3" />
              {Array.from({ length: LINES }, (_, index) => <text key={index} className="term-row" x="8" y={FIRST_BASELINE + index * LINE_STEP}><tspan className="term-prompt" /><tspan /></text>)}
              <rect className="term-cursor" width="4.2" height="7.6" opacity="0" />
            </g>
          </g>
          <use href="#cine-screen" transform="translate(888 262) skewY(3) scale(.86 .9)" />
        </g>
      </g>
      <g className="lens-glint"><rect x="690" y="200" width="34" height="200" fill="url(#cine-glint-fill)" transform="skewX(-22)" /></g>
    </g>
  </svg>;
}

export function Hero() {
  const { t } = useI18n();
  const h = t.hero;
  const root = useRef(null);

  useEffect(() => {
    const hero = root.current;
    const q = gsap.utils.selector(hero);
    const media = gsap.matchMedia();

    media.add('(prefers-reduced-motion: no-preference)', () => {
      const [frame] = q('.cine-frame');
      const [glow] = q('.cine-glow');
      const [portrait] = q('.cine-portrait');

      // The opening holds in its start pose behind the preloader and plays once the curtain is gone.
      const opening = gsap.timeline({ defaults: { ease: 'power3.out' }, paused: true })
        .fromTo(frame, { opacity: 0, scale: 1.07 }, { opacity: 1, scale: 1, duration: 2.1, ease: 'power2.out' }, 0)
        .fromTo(glow, { opacity: 0 }, { opacity: 1, duration: 2.4, ease: 'sine.inOut' }, .5)
        .fromTo(q('.cine-bar > *'), { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: .7, stagger: .06 }, .3)
        .fromTo(q('.cine-line > span'), { yPercent: 112 }, { yPercent: 0, duration: 1.15, stagger: .1, ease: 'expo.out' }, .45)
        .fromTo(q('.cine-sub, .cine-actions > *'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: .9, stagger: .08 }, .85)
        .fromTo(q('.cine-aside > *'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: .9, stagger: .08 }, 1.05);
      const stopWaiting = whenPreloaderDone(() => opening.play());

      gsap.to(portrait, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to(q('.cine-stage'), { y: -70, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });

      const pointer = gsap.matchMedia();
      pointer.add('(hover: hover) and (pointer: fine)', () => {
        const [drift] = q('.lens-drift');
        const [content] = q('.lens-content');
        const ease = { duration: 1.1, ease: 'power3.out' };
        const frameX = gsap.quickTo(frame, 'x', ease), frameY = gsap.quickTo(frame, 'y', ease);
        const glowX = gsap.quickTo(glow, 'x', ease), glowY = gsap.quickTo(glow, 'y', ease);
        const driftX = gsap.quickTo(drift, 'x', ease), driftY = gsap.quickTo(drift, 'y', ease);
        const shine = gsap.quickTo(content, 'opacity', { duration: .6, ease: 'power2.out' });
        const move = event => {
          if (event.pointerType === 'touch') return;
          const bounds = hero.getBoundingClientRect();
          const nx = (event.clientX - bounds.left) / bounds.width * 2 - 1;
          const ny = (event.clientY - bounds.top) / bounds.height * 2 - 1;
          frameX(nx * -12); frameY(ny * -8);
          glowX(nx * 34); glowY(ny * 22);
          driftX(nx * -9); driftY(ny * -6);
          const lens = frame.getBoundingClientRect();
          const distance = Math.hypot(event.clientX - (lens.left + lens.width * GLASSES_CENTER.x), event.clientY - (lens.top + lens.height * GLASSES_CENTER.y));
          shine(.55 + .4 * Math.max(0, 1 - distance / 420));
        };
        const leave = () => { frameX(0); frameY(0); glowX(0); glowY(0); driftX(0); driftY(0); shine(.55); };
        hero.addEventListener('pointermove', move);
        hero.addEventListener('pointerleave', leave);
        return () => { hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', leave); };
      });
      return () => { stopWaiting(); pointer.revert(); };
    });
    return () => media.revert();
  }, []);

  return <section ref={root} className="cine" id="inicio" aria-labelledby="cine-title">
    <header className="cine-bar">
      <a className="cine-brand" href="#inicio">Emerson Brandão<span aria-hidden="true">.</span></a>
      <nav aria-label={t.nav.main}>{['projetos', 'servicos', 'sobre', 'contato'].map(id => <a key={id} href={'#' + id}>{t.nav.links[id]}</a>)}</nav>
    </header>

    <div className="cine-portrait">
      <div className="cine-frame">
        <img
          src={assetUrl('/assets/emerson-hero-1672.webp')}
          srcSet={`${assetUrl('/assets/emerson-hero-800.webp')} 800w, ${assetUrl('/assets/emerson-hero-1200.webp')} 1200w, ${assetUrl('/assets/emerson-hero-1672.webp')} 1672w`}
          sizes="(max-width: 900px) 220vw, 92vw"
          alt={h.alt}
          width="1672" height="941" fetchPriority="high" />
        <GlassesTerminal terminal={h.terminal} />
      </div>
      <div className="cine-glow" aria-hidden="true" />
    </div>

    <div className="cine-stage">
      <div className="cine-lead">
        <h1 className="cine-title" id="cine-title">
          <span className="cine-line"><span>{h.title[0]}</span></span>
          <span className="cine-line"><span>{h.title[1]}</span></span>
          <span className="cine-line cine-line--red"><span>{h.title[2]}</span></span>
        </h1>
        <p className="cine-sub">{h.sub}</p>
        <div className="cine-actions">
          <a className="cine-cta" href={quoteUrl(h.quote)} target="_blank" rel="noreferrer">{h.cta}<span className="cine-cta-icon" aria-hidden="true"><ArrowUpRight size={22} strokeWidth={2} /></span></a>
          <a className="cine-ghost" href="#projetos">{h.ghost}</a>
        </div>
      </div>
      <div className="cine-aside">
        <h2 className="cine-statement"><span>{h.statement[0]}</span> <span>{h.statement[1]}</span></h2>
        <p>{h.aside}</p>
        <ul className="cine-services" aria-label={h.servicesLabel}>{h.services.map(item => <li key={item}>{item}</li>)}</ul>
      </div>
    </div>
  </section>;
}
