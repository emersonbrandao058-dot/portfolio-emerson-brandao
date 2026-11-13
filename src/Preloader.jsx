import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export const PRELOADER_DONE_EVENT = 'preloader:done';

// Tempos em ms. `fade` + `lift` precisam bater com as transições do preloader.css.
export const PRELOADER_TIMING = { min: 900, max: 2500, fade: 200, lift: 700, reducedFade: 300 };

const LOADING_CEILING = 96; // os 4% finais só entram quando tudo terminou
const LERP = 0.15;

// Personagem: 8x10 pixels desenhados num canvas 8x10, exibido em 4x pelo CSS.
const PIXEL_SCALE = 4;
const SPRITE_WIDTH = 8 * PIXEL_SCALE;
const RUN_FRAME_MS = 110;
const OBSTACLES = [0.28, 0.55, 0.8];
const JUMP_HEIGHT = 46;
const JUMP_MS = 380;
const JUMP_LEAD_PX = 30; // distância entre o centro do boneco e o do obstáculo ao decolar/pousar
const RUN_SPEED = 0.004; // fração da barra por ms (no máx. a barra inteira em 250ms)

const COLORS = {
  B: '#5264df', // boné
  b: '#3747b8', // aba do boné
  S: '#e5b08a', // pele
  E: '#141516', // olho
  W: '#efefeb', // camiseta
  P: '#56607e', // calça
  K: '#b2b3ba', // tênis
};

const SPRITES = {
  runA: [
    '..BBBB..',
    '.BBBBBbb',
    '.SSSSES.',
    '.SSSSSS.',
    '..WWWW..',
    '.SWWWWS.',
    '..WWWW..',
    '..PPPP..',
    '.PP..PP.',
    '.K....K.',
  ],
  runB: [
    '..BBBB..',
    '.BBBBBbb',
    '.SSSSES.',
    '.SSSSSS.',
    '..WWWW..',
    '..WWWWS.',
    '.SWWWW..',
    '..PPPP..',
    '...PP...',
    '...KK...',
  ],
  jump: [
    '..BBBB..',
    '.BBBBBbb',
    '.SSSSES.',
    '.SSSSSS.',
    'SWWWWWWS',
    '..WWWW..',
    '..WWWW..',
    '..PPPP..',
    '.PP..PP.',
    'K......K',
  ],
};

function drawSprite(context, rows) {
  context.clearRect(0, 0, 8, 10);
  rows.forEach((row, y) => {
    [...row].forEach((key, x) => {
      if (!COLORS[key]) return;
      context.fillStyle = COLORS[key];
      context.fillRect(x, y, 1, 1);
    });
  });
}

const settleImage = image => image.complete
  ? Promise.resolve()
  : new Promise(resolve => {
    image.addEventListener('load', resolve, { once: true });
    image.addEventListener('error', resolve, { once: true });
  });

const settleUrl = url => new Promise(resolve => {
  const image = new Image();
  image.onload = image.onerror = () => resolve();
  image.src = url;
});

// Cada item resolve quando o asset carrega OU falha: um erro nunca trava o preloader.
// Imagens com loading="lazy" ficam de fora: com o scroll travado elas não carregariam
// e o preloader sempre bateria na trava máxima.
export function collectAssets(exclude) {
  const outside = element => !exclude?.contains(element);
  const tasks = [];

  for (const image of document.images) {
    if (!outside(image) || image.getAttribute('loading') === 'lazy') continue;
    if (!image.currentSrc && !image.getAttribute('src')) continue;
    tasks.push(settleImage(image));
  }

  const urls = new Set();
  for (const video of document.querySelectorAll('video[poster]')) {
    if (outside(video) && video.poster) urls.add(video.poster);
  }
  for (const element of document.body.querySelectorAll('*')) {
    if (!outside(element)) continue;
    const background = getComputedStyle(element).backgroundImage;
    if (!background || background === 'none') continue;
    for (const match of background.matchAll(/url\((['"]?)(.*?)\1\)/g)) {
      if (match[2]) urls.add(match[2]);
    }
  }
  for (const url of urls) tasks.push(settleUrl(url));

  if (document.fonts?.ready) tasks.push(document.fonts.ready.then(() => {}, () => {}));
  return tasks;
}

// Para quem precisa esperar o preloader (ex.: animação de entrada da hero).
// Se ele já saiu (ou nunca existiu), chama na hora.
export function whenPreloaderDone(callback) {
  if (!document.documentElement.classList.contains('is-preloading')) {
    callback();
    return () => {};
  }
  window.addEventListener(PRELOADER_DONE_EVENT, callback, { once: true });
  return () => window.removeEventListener(PRELOADER_DONE_EVENT, callback);
}

export function Preloader({ name = 'Emerson Brandão' }) {
  const root = useRef(null);
  const count = useRef(null);
  const bar = useRef(null);
  const runner = useRef(null);
  const unlockScroll = useRef(() => {});
  const [reducedMotion] = useState(() => typeof window !== 'undefined'
    && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
  const [phase, setPhase] = useState('loading'); // loading → leaving → lifting → done

  // Layout effect: trava o scroll antes do primeiro paint e antes dos effects do App,
  // que usam a classe is-preloading para saber se precisam esperar.
  useLayoutEffect(() => {
    const html = document.documentElement;
    const previousOverflow = document.body.style.overflow;
    html.classList.add('is-preloading');
    document.body.style.overflow = 'hidden';
    let locked = true;
    unlockScroll.current = () => {
      if (!locked) return;
      locked = false;
      html.classList.remove('is-preloading');
      document.body.style.overflow = previousOverflow;
    };
    return () => unlockScroll.current();
  }, []);

  useEffect(() => {
    let active = true;
    let value = 0;
    let target = 0;
    let settled = 0;
    let assetsReady = false;
    let minReached = false;
    let exiting = false;
    let raf = 0;
    let lastNow = null;
    let frame = null;
    let trackWidth = root.current.clientWidth;
    // O boneco acompanha o progresso, mas não entra no obstáculo pelo chão: espera
    // antes dele e só pula quando o progresso já passou, cruzando num arco de seno.
    let runnerAt = 0;
    let nextObstacle = 0;
    let jump = null; // { from, to, start }
    const timers = [];
    const later = (callback, delay) => timers.push(setTimeout(callback, delay));
    const context = reducedMotion ? null : runner.current?.getContext?.('2d') ?? null;
    if (context) drawSprite(context, SPRITES.runA);

    const allowFinish = () => {
      if (assetsReady && minReached) target = 100;
    };

    const tasks = collectAssets(root.current);
    if (tasks.length === 0) {
      assetsReady = true;
      target = LOADING_CEILING;
    }
    tasks.forEach(task => task.then(() => {
      if (!active) return;
      settled += 1;
      target = Math.max(target, (settled / tasks.length) * LOADING_CEILING);
      if (settled === tasks.length) {
        assetsReady = true;
        allowFinish();
      }
    }));

    const paintRunner = (progress, now, elapsed) => {
      const span = Math.max(1, trackWidth - SPRITE_WIDTH);
      const lead = JUMP_LEAD_PX / span;
      let at = runnerAt;
      let y = 0;
      let sprite = null;

      if (jump) {
        const t = (now - jump.start) / JUMP_MS;
        if (t >= 1) {
          runnerAt = jump.to;
          jump = null;
          nextObstacle += 1;
        } else {
          at = jump.from + (jump.to - jump.from) * t;
          y = Math.sin(t * Math.PI) * JUMP_HEIGHT;
          sprite = 'jump';
        }
      }

      if (!jump) {
        const obstacle = OBSTACLES[nextObstacle];
        const takeoff = obstacle === undefined ? 1 : obstacle - lead;
        const goal = Math.min(progress, takeoff);
        if (goal > runnerAt) runnerAt = Math.min(goal, runnerAt + RUN_SPEED * elapsed);
        at = runnerAt;
        if (obstacle !== undefined && runnerAt >= takeoff && progress > takeoff) {
          jump = { from: takeoff, to: obstacle + lead, start: now };
          sprite = 'jump';
        }
      }

      sprite ??= Math.floor(now / RUN_FRAME_MS) % 2 ? 'runB' : 'runA';
      runner.current.style.transform = `translate3d(${at * span}px, ${-y}px, 0)`;
      if (sprite !== frame) {
        frame = sprite;
        drawSprite(context, SPRITES[sprite]);
      }
    };

    const paint = (now, elapsed) => {
      const label = `${Math.round(value)}%`;
      if (count.current.textContent !== label) count.current.textContent = label;
      bar.current.style.transform = `scaleX(${value / 100})`;
      if (context) paintRunner(value / 100, now, elapsed);
    };

    const finish = () => {
      cancelAnimationFrame(raf);
      unlockScroll.current();
      setPhase('done');
    };

    const startExit = () => {
      if (exiting) return;
      exiting = true;
      value = target = 100;
      paint(lastNow ?? 0, 0);
      setPhase('leaving');
      if (reducedMotion) {
        later(finish, PRELOADER_TIMING.reducedFade);
      } else {
        later(() => setPhase('lifting'), PRELOADER_TIMING.fade);
        later(finish, PRELOADER_TIMING.fade + PRELOADER_TIMING.lift);
      }
    };

    const tick = now => {
      const elapsed = lastNow === null ? 0 : now - lastNow;
      lastNow = now;
      value += (target - value) * LERP;
      if (Math.abs(target - value) < 0.05) value = target;
      paint(now, elapsed);
      if (!exiting && target === 100 && value >= 99.5) startExit();
      raf = requestAnimationFrame(tick);
    };

    const onResize = () => {
      trackWidth = root.current?.clientWidth ?? trackWidth;
    };

    later(() => {
      minReached = true;
      allowFinish();
    }, PRELOADER_TIMING.min);
    later(startExit, PRELOADER_TIMING.max); // trava máxima: sai mesmo com asset pendente
    window.addEventListener('resize', onResize);
    raf = requestAnimationFrame(tick);

    return () => {
      active = false;
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (phase === 'done') window.dispatchEvent(new Event(PRELOADER_DONE_EVENT));
  }, [phase]);

  if (phase === 'done') return null;

  const className = 'preloader'
    + (reducedMotion ? ' is-reduced' : '')
    + (phase !== 'loading' ? ' is-leaving' : '')
    + (phase === 'lifting' ? ' is-lifting' : '');

  return (
    <div ref={root} className={className} aria-hidden="true">
      <div className="preloader-center">
        <p className="preloader-name">
          {name.split(' ').map((part, index, parts) => (
            <span key={part}>{part}{index === parts.length - 1 && <span className="preloader-dot">.</span>}</span>
          ))}
        </p>
        <p ref={count} className="preloader-count">0%</p>
      </div>
      <div className="preloader-track">
        {!reducedMotion && OBSTACLES.map(at => (
          <span key={at} className="preloader-obstacle" style={{ '--at': at }} />
        ))}
        {!reducedMotion && <canvas ref={runner} className="preloader-runner" width="8" height="10" />}
        <div ref={bar} className="preloader-bar" />
      </div>
    </div>
  );
}

export default Preloader;
