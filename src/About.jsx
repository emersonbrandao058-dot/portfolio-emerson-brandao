import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ArrowUpRight } from 'lucide-react';
import { assetUrl } from './asset-url.js';
import { StackCloud } from './StackCloud.jsx';
import { NOX_FLOORS } from './nox-floors.js';
import { FOLLOW } from './motion.js';
import { useI18n } from './i18n.jsx';

gsap.registerPlugin(ScrollTrigger, SplitText);

/* Texts (facts, chapters, statement) live in src/locales.js; every fact comes from the résumé (public/curriculo-emerson-brandao.pdf). */

/* Nox, one continuous take. The desktop set has 188 frames at 960px; the light set (narrow
   screens, or Save-Data) has every second one at 720px, so both share the 188-frame timeline.
   What he does: 0-40 turns his head; 40-74 brings a hand up; 74-108 adjusts his glasses;
   108-152 opens his hand towards the left of the screen; 152-170 lowers it; 170-187 rests. */
const pad = index => String(index).padStart(3, '0');
const SETS = {
  full: { count: 188, step: 1, size: 960, blend: false, floors: NOX_FLOORS.full, url: index => assetUrl(`/assets/frames_188_960/nox_${pad(index)}.webp`) },
  light: { count: 94, step: 2, size: 720, blend: true, floors: NOX_FLOORS.light, url: index => assetUrl(`/assets/frames_94_720/nox_${pad(index)}.webp`) },
};

/* The scroll plays the take through these segments: [frame to reach, share of the scroll].
   The take has one presenting gesture, so the stack plays the end of it backwards: from rest he
   looks back to the front and raises his hand towards the tools, which reads as a gesture of its own. */
const SEGMENTS = [
  [40, .55],  // 01 Design: turns his head
  [108, .7],  // 02 Código: brings his hand up, adjusts his glasses
  [140, .5],  // 03 Você: opens his hand to the reader
  [187, .95], // 04 Trajetória: lowers it and stands at ease while the facts come in
  [128, .55], // 05 Stack: looks back and presents the tools (played in reverse)
  [140, .2],  //    the presenting hand settles
  [168, .3],  // 06 lowers his hand; the section lets go
];
const T = { code: .55, you: 1.25, path: 1.75, stack: 2.7, rest: 3.45, end: 3.75 };
// His hand is out towards the tools between these two moments.
const POINTING = [T.stack + .33, T.rest + .12];
const chapterAt = time => time < T.code ? 1 : time < T.you ? 2 : time < T.path ? 3 : time < T.stack ? 4 : time < T.rest ? 5 : 6;

/* The frame engine. Every frame is fetched once, coarse to fine, and drawn on a canvas backed at
   its displayed size (capped at the frames' own). Measured on a 2012 integrated GPU: decoding into
   ImageBitmaps caused 600ms+ main-thread stalls, and blending frame pairs cost ~4ms a frame, so the
   dense desktop set draws one frame and only when the frame changes; the sparser light set blends
   neighbours, which is what keeps its half-as-many frames moving smoothly. */
function createPlayer(canvas, set) {
  const context = canvas.getContext('2d', { alpha: false });
  // Measuring a floor meant decoding the whole frame on the main thread (17-70ms each, 188 times, while
  // the reader was still in the projects and services), so the floors ship precomputed.
  const known = set.floors?.length === set.count * 3;
  let probe = null;
  const images = new Array(set.count);
  const floors = new Array(set.count);
  let size = 0;
  let wanted = 0;
  let drawn = '';
  let disposed = false;

  // A frame is ready once its load handler has measured its floor (complete can come first).
  const ready = index => floors[index] !== undefined;
  const nearest = index => {
    for (let offset = 0; offset < set.count; offset++) {
      if (ready(index - offset)) return index - offset;
      if (ready(index + offset)) return index + offset;
    }
    return -1;
  };

  const paint = () => {
    if (disposed || !size) return;
    const base = set.blend ? Math.floor(wanted) : Math.round(wanted);
    const fraction = set.blend ? wanted - base : 0;
    const a = ready(base) ? base : nearest(base);
    if (a < 0) return;
    const b = a === base && fraction > .04 && ready(base + 1) ? base + 1 : -1;
    const key = b < 0 ? `${a}` : `${a}:${Math.round(fraction * 24)}`;
    if (key === drawn) return;
    drawn = key;
    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 1;
    context.drawImage(images[a], 0, 0, size, size);
    let floor = floors[a];
    if (b >= 0) {
      const alpha = Math.round(fraction * 24) / 24;
      context.globalAlpha = alpha;
      context.drawImage(images[b], 0, 0, size, size);
      context.globalAlpha = 1;
      floor = floor.map((value, channel) => value + (floors[b][channel] - value) * alpha);
    }
    // The take sits on a near-black floor (about rgb(8,1,1)); taking it out leaves the section's true black.
    context.globalCompositeOperation = 'difference';
    context.fillStyle = `rgb(${floor.map(Math.round).join(',')})`;
    context.fillRect(0, 0, size, size);
    context.globalCompositeOperation = 'source-over';
  };

  const loadFrame = index => {
    if (images[index]) return;
    const image = new Image();
    image.decoding = 'async';
    if (index > 0) image.fetchPriority = 'low';
    image.onload = () => {
      if (disposed) return;
      if (known) {
        floors[index] = [set.floors[index * 3] / 10, set.floors[index * 3 + 1] / 10, set.floors[index * 3 + 2] / 10];
      } else {
        // The floor is the colour of the frame's top-left corner, averaged over a few pixels.
        probe ||= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
        probe.drawImage(image, 2, 2, 8, 8, 0, 0, 8, 8);
        const data = probe.getImageData(0, 0, 8, 8).data;
        const sum = [0, 0, 0];
        for (let i = 0; i < data.length; i += 4) { sum[0] += data[i]; sum[1] += data[i + 1]; sum[2] += data[i + 2]; }
        floors[index] = sum.map(value => value / 64);
      }
      if (Math.abs(index - wanted) < 2 || !drawn) { drawn = ''; paint(); }
    };
    image.src = set.url(index);
    images[index] = image;
  };

  // Requests go out a few at a time, in idle moments: 188 at once was a 67ms task mid-scroll.
  let queue = null;
  const idle = window.requestIdleCallback ? fn => requestIdleCallback(fn, { timeout: 120 }) : fn => setTimeout(fn, 16);
  const pump = () => {
    if (disposed) return;
    const until = performance.now() + 4;
    while (queue.length && performance.now() < until) loadFrame(queue.shift());
    if (queue.length) idle(pump);
  };

  const resize = cssWidth => {
    const next = Math.max(1, Math.min(set.size, Math.round(cssWidth * Math.min(devicePixelRatio || 1, 2))));
    if (next === size) return;
    size = next;
    canvas.width = canvas.height = size;
    drawn = '';
    paint();
  };
  const observer = new ResizeObserver(([entry]) => resize(entry.contentRect.width));
  observer.observe(canvas);

  return {
    // position is on the 188-frame timeline.
    show(position) { wanted = Math.max(0, Math.min(set.count - 1, position / set.step)); paint(); },
    loadAll() {
      if (queue) return;
      queue = [];
      for (const step of [16, 4, 2, 1]) for (let index = 0; index < set.count; index += step) queue.push(index);
      queue.push(set.count - 1);
      pump();
    },
    loadFirst() { loadFrame(0); },
    dispose() { disposed = true; observer.disconnect(); },
  };
}

export function About() {
  const { lang, t } = useI18n();
  const a = t.about;
  const root = useRef(null);
  const scene = useRef(null);
  const canvas = useRef(null);
  const bubble = useRef(null);
  const player = useRef(null);
  const [chapter, setChapter] = useState(1);

  useEffect(() => {
    const narrow = matchMedia('(max-width: 1000px)').matches;
    const set = narrow || navigator.connection?.saveData ? SETS.light : SETS.full;
    const instance = createPlayer(canvas.current, set);
    player.current = instance;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const start = () => { if (reduced.matches) instance.loadFirst(); else instance.loadAll(); };
    instance.show(0);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { start(); observer.disconnect(); }
    }, { rootMargin: '1600px 0px' });
    observer.observe(scene.current);
    const onMotion = () => { start(); instance.show(0); };
    reduced.addEventListener('change', onMotion);
    return () => { observer.disconnect(); reduced.removeEventListener('change', onMotion); instance.dispose(); player.current = null; };
  }, []);

  /* What does not depend on the language is built once: a language switch never replays it. */
  useEffect(() => {
    const section = root.current;
    const q = gsap.utils.selector(section);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      /* Hand-off from the services: as this section rises under their rounded edge, their index recedes.
         Their closing call to action stays at full strength, so it never looks disabled. */
      const previous = document.querySelectorAll('#servicos .sv-head, #servicos .sv-list');
      if (previous.length) {
        gsap.to(previous, { opacity: .4, y: -32, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'top 25%', scrub: FOLLOW } });
      }
      gsap.from(q('.ab-meta>span'), { opacity: 0, y: 10, duration: .7, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: q('.ab-meta')[0], start: 'top 90%', once: true } });
      gsap.from(q('.ab-meta>.ab-rule'), { scaleX: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: q('.ab-meta')[0], start: 'top 90%', once: true } });
    });
    return () => media.revert();
  }, []);

  /* The stage. SplitText rewrites the statement, the cue and the path title into letters and words, so the
     panels are keyed by the language: a switch mounts fresh text, the old timeline is reverted and a new one
     is built over the same scroll range. ScrollTrigger places it at the current scroll position at once,
     so the chapter, Nox's frame and the reader's place on the page all stay where they were. The canvas
     and its frame player are outside the keyed part and never reload. */
  useEffect(() => {
    const section = root.current;
    const q = gsap.utils.selector(section);
    const media = gsap.matchMedia();
    media.add({ motion: '(prefers-reduced-motion: no-preference)', compact: '(max-width: 1000px)' }, context => {
      const { motion, compact } = context.conditions;
      if (!motion) { setChapter(6); return; }

      const titleSplit = SplitText.create(q('.ab-title .ab-line'), { type: 'words,chars', charsClass: 'ab-char' });
      const cueSplit = SplitText.create(q('.ab-cue-text'), { type: 'words,chars', charsClass: 'ab-char' });
      const pathSplit = SplitText.create(q('.ab-path-title'), { type: 'words', wordsClass: 'ab-word' });
      const whiteChars = titleSplit.chars.filter(char => !char.closest('.ab-line--red'));
      const redChars = titleSplit.chars.filter(char => char.closest('.ab-line--red'));
      // Opacity and movement only: per-letter blur filters cost the most of anything on the stage (measured).
      const dim = { opacity: .1, yPercent: 22 };
      const lit = { opacity: 1, yPercent: 0, duration: .1 };
      const hidden = { opacity: 0, y: 24 };
      const shown = { opacity: 1, y: 0, duration: .15 };
      const gone = { opacity: 0, y: -24, duration: .12 };
      const [statement, path, stack] = q('.ab-panel');

      let current = 1;
      let pointing = false;
      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        /* Read from the timeline itself, which keeps rendering while the scrub catches up; the trigger's
           own update fired on the scroll event, while the playhead still lagged, and could leave the
           chapter list and the balloon one chapter behind after a fast scroll or a jump. */
        onUpdate: () => {
          const time = timeline.time();
          const next = chapterAt(time);
          if (next !== current) { current = next; setChapter(next); }
          const out = time >= POINTING[0] && time <= POINTING[1];
          if (out !== pointing) { pointing = out; bubble.current?.classList.toggle('is-on', out); }
        },
        scrollTrigger: {
          /* The take starts while the stage is still rising into place and ends while it leaves, so the
             reader is never held on a dim title or a finished scene: the pinned stretch is 65svh shorter
             (see .ab-scene) while every chapter keeps exactly the scroll it had. A short scrub: the stage
             answers the scroll quickly but never steps. */
          trigger: scene.current, start: 'top 40%', end: 'bottom 75%', scrub: .35,
        },
      });

      /* Nox: the playhead runs segment by segment, so every scene gets the scroll it needs. */
      const playhead = { frame: 0 };
      const draw = () => player.current?.show(playhead.frame);
      let at = 0;
      for (const [to, share] of SEGMENTS) { timeline.to(playhead, { frame: to, duration: share, onUpdate: draw }, at); at += share; }
      timeline.fromTo(q('.ab-progress'), { scaleX: 0 }, { scaleX: 1, duration: T.end }, 0);

      /* 01-03: the statement lights letter by letter, in step with what he does. */
      timeline
        .fromTo(whiteChars, dim, { ...lit, stagger: { amount: .38 } }, .03)
        .fromTo(redChars, dim, { ...lit, stagger: { amount: .4 } }, T.code + .05)
        .fromTo(q('.ab-cue-mark'), { scaleX: 0 }, { scaleX: 1, duration: .1 }, T.you)
        .fromTo(cueSplit.chars, dim, { ...lit, stagger: { amount: .25 } }, T.you + .03)

      /* 04: the statement makes way for the path; the facts arrive one by one. */
        .to(statement, gone, T.path - .12)
        .fromTo(q('.ab-path .ab-kicker'), hidden, shown, T.path)
        .fromTo(pathSplit.words, { opacity: 0, yPercent: 30 }, { opacity: 1, yPercent: 0, duration: .08, stagger: { amount: .1 } }, T.path + .03);
      q('.ab-fact').forEach((fact, index) => {
        const time = T.path + .12 + index * .08;
        timeline
          .fromTo(fact.querySelector('.ab-rule'), { scaleX: 0 }, { scaleX: 1, duration: .14 }, time)
          .fromTo(fact.querySelectorAll('dt, dd'), hidden, { ...shown, stagger: .03 }, time + .02);
      });
      timeline
        .fromTo(q('.ab-path .ab-link'), hidden, shown, T.path + .42)

      /* 05: he turns back and opens his hand towards the tools; the row takes their place beside him. */
        .to(path, gone, T.stack - .1)
        .fromTo(q('.ab-stack .ab-kicker, .ab-stack-title, .ab-cloud-wrap'), hidden, { ...shown, stagger: .05 }, T.stack);

      /* On narrow screens the stage pulls back for the path, so the facts fit under him,
         and comes back in a little for the shorter stack panel. */
      if (compact) {
        timeline
          .fromTo(q('.ab-figure'), { scale: 1 }, { scale: .68, duration: .25, ease: 'power1.inOut', immediateRender: false }, T.path - .15)
          .to(q('.ab-figure'), { scale: .86, duration: .2, ease: 'power1.inOut' }, T.stack - .08);
      }

      /* Keyboard users who tab into a panel that is not on screen yet are carried to its moment. */
      const seek = target => () => {
        const time = timeline.time();
        if (Math.abs(time - target) < .2) return;
        const trigger = timeline.scrollTrigger;
        window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * target / T.end, behavior: 'instant' });
        trigger.update();
        timeline.progress(target / T.end);
      };
      const onPath = seek(T.path + .72);
      const onStack = seek(T.stack + .5);
      path.addEventListener('focusin', onPath);
      stack.addEventListener('focusin', onStack);

      return () => {
        path.removeEventListener('focusin', onPath);
        stack.removeEventListener('focusin', onStack);
        bubble.current?.classList.remove('is-on');
        titleSplit.revert(); cueSplit.revert(); pathSplit.revert();
      };
    });
    return () => media.revert();
  }, [lang]);

  const phase = chapter > 5 ? 5 : chapter;
  return <section ref={root} className="ab" id="sobre" tabIndex={-1} aria-labelledby="ab-title">
    <div className="ab-wrap">
      <div className="ab-meta ab-mono">
        <span>{a.meta[0]}</span>
        <span>{a.meta[1]}</span>
        <span>{a.meta[2]}</span>
        <i className="ab-rule" aria-hidden="true" />
      </div>
    </div>

    <div ref={scene} className="ab-scene">
      <div className="ab-stage" data-chapter={chapter}>
        <div className="ab-stage-in ab-wrap">
          <div className="ab-panels" key={lang}>
            <div className={'ab-panel ab-statement' + (phase <= 3 ? ' is-current' : '')}>
              <h2 className="ab-title" id="ab-title">
                <span className="ab-line">{a.title[0]}</span>{' '}
                <span className="ab-line">{a.title[1]}</span>{' '}
                <span className="ab-line ab-line--red">{a.title[2]}</span>{' '}
                <span className="ab-line ab-line--red">{a.title[3]}</span>
              </h2>
              <p className="ab-cue"><i className="ab-cue-mark" aria-hidden="true" /><span className="ab-cue-text">{a.cue}</span></p>
            </div>

            <div className={'ab-panel ab-path' + (phase === 4 ? ' is-current' : '')} aria-labelledby="ab-path-title">
              <p className="ab-kicker ab-mono"><span>04</span>{a.pathKicker}</p>
              <h3 className="ab-path-title" id="ab-path-title">{a.pathTitle}</h3>
              <dl className="ab-facts">
                {a.facts.map(([term, main, detail]) => <div className="ab-fact" key={term}>
                  <i className="ab-rule" aria-hidden="true" />
                  <dt className="ab-mono">{term}</dt>
                  <dd><strong>{main}</strong><span>{detail}</span></dd>
                </div>)}
              </dl>
              <a className="ab-link" href={assetUrl('/curriculo-emerson-brandao.pdf')} target="_blank" rel="noreferrer">
                <span>{a.pathLink}</span><ArrowUpRight size={18} strokeWidth={1.8} aria-hidden="true" />
              </a>
            </div>

            <div className={'ab-panel ab-stack' + (phase === 5 ? ' is-current' : '')} id="stack" aria-labelledby="ab-stack-title">
              <p className="ab-kicker ab-mono"><span>05</span>{a.stackKicker}</p>
              <h3 className="ab-stack-title" id="ab-stack-title">{a.stackTitle}</h3>
              <StackCloud active={chapter >= 5} />
            </div>
          </div>

          <div className="ab-figure">
            <canvas ref={canvas} width="960" height="960" role="img"
              aria-label={a.nox} />
            <p ref={bubble} className="ab-bubble" aria-hidden="true">{a.bubble}</p>
          </div>

          <div className="ab-chapters ab-mono" aria-hidden="true">
            <ol>{a.chapters.map((name, index) => <li key={index} className={index + 1 === phase ? 'is-current' : ''}><span>{String(index + 1).padStart(2, '0')}</span><b>{name}</b></li>)}</ol>
            <span className="ab-track"><i className="ab-progress" /></span>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
