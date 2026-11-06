import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ArrowUpRight, Lock } from 'lucide-react';
import { ProjectPreview } from './ProjectPreview.jsx';
import { PROJECTS, shotSrc } from './projects-data.js';
import { FOLLOW, focusWords } from './motion.js';
import { useI18n } from './i18n.jsx';

gsap.registerPlugin(ScrollTrigger, SplitText);

const whatsapp = message => `https://wa.me/5575999312633?text=${encodeURIComponent(message)}`;
const pad = number => String(number).padStart(2, '0');

export function Projects() {
  const { lang, t } = useI18n();
  const p = t.projects;
  const projects = useMemo(() => PROJECTS.map(project => ({ ...project, ...p.items[project.id] })), [p]);
  const root = useRef(null);
  const [active, setActive] = useState(null);
  const opener = useRef(null);

  const open = useCallback((index, event) => {
    opener.current = event?.currentTarget?.closest('.pj-card')?.querySelector('.pj-explore') ?? null;
    setActive(index);
  }, []);
  const close = useCallback(() => setActive(null), []);
  /* Runs after the viewer has closed its dialog, so focus lands back on the card's action. */
  useEffect(() => {
    if (active !== null || !opener.current) return;
    opener.current.focus({ preventScroll: true });
    opener.current = null;
  }, [active]);

  /* The opening is split into lines and words by SplitText, so it is rebuilt with each language: the title and
     lede are keyed by it, React mounts fresh text and the split runs again (its entrance replays only on screen). */
  useEffect(() => {
    const section = root.current;
    const q = gsap.utils.selector(section);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const cleanups = [];
      const [head] = q('.pj-head');
      const [title] = q('.pj-title');
      const [lede] = q('.pj-lede');
      /* The opening starts while the hero is still leaving: lines rise out of a mask,
         then the sentence below comes into focus word by word. */
      const titleSplit = SplitText.create(title, {
        type: 'lines', mask: 'lines', linesClass: 'pj-split-line', autoSplit: true,
        onSplit: self => gsap.from(self.lines, { yPercent: 105, duration: 1.05, stagger: .11, ease: 'expo.out', scrollTrigger: { trigger: head, start: 'top 88%', once: true } }),
      });
      const ledeSplit = SplitText.create(lede, {
        type: 'words', autoSplit: true,
        onSplit: self => focusWords(self.words, { trigger: head, start: 'top 88%', once: true }),
      });
      /* The heading drifts up a touch as it arrives, so the hand-off from the hero reads as one move. */
      gsap.fromTo(head, { y: 48 }, { y: 0, ease: 'none', scrollTrigger: { trigger: head, start: 'top bottom', end: 'top 45%', scrub: FOLLOW } });
      cleanups.push(() => { titleSplit.revert(); ledeSplit.revert(); });
      return () => cleanups.forEach(cleanup => cleanup());
    });
    return () => media.revert();
  }, [lang]);

  useEffect(() => {
    const section = root.current;
    const q = gsap.utils.selector(section);
    const media = gsap.matchMedia();
    media.add({ motion: '(prefers-reduced-motion: no-preference)', fine: '(hover: hover) and (pointer: fine)' }, context => {
      const { motion, fine } = context.conditions;
      const cleanups = [];

      if (motion) {
        q('.pj-card').forEach((card, index) => {
          // The entrance zoom is on a wrapper: GSAP owns its transform, the hover glide owns the image's translate.
          const shot = card.querySelector('.pj-zoom');
          /* A short rise tied to the scroll; the second column travels a little further for depth. */
          gsap.fromTo(card, { y: 56 + (index % 2) * 40 }, { y: 0, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'top 55%', scrub: FOLLOW } });
          const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 90%', once: true } })
            .from(card, { opacity: 0, duration: .7, ease: 'power2.out' });
          if (shot) tl.from(shot, { scale: 1.1, duration: 1.4, ease: 'expo.out' }, 0);
          tl.from(card.querySelectorAll('.pj-reveal'), { y: 14, opacity: 0, duration: .6, stagger: .05, ease: 'power3.out' }, .15);
        });
      }

      /* A red lens follows the pointer over each screen and tells what a click does. */
      if (fine) {
        for (const screen of q('.pj-screen')) {
          const cursor = screen.querySelector('.pj-cursor');
          const toX = gsap.quickTo(cursor, 'x', { duration: motion ? .5 : 0, ease: 'power3.out' });
          const toY = gsap.quickTo(cursor, 'y', { duration: motion ? .5 : 0, ease: 'power3.out' });
          const place = (event, instant) => {
            const bounds = screen.getBoundingClientRect();
            const x = event.clientX - bounds.left, y = event.clientY - bounds.top;
            if (instant) gsap.set(cursor, { x, y });
            toX(x); toY(y);
          };
          const enter = event => { if (event.pointerType !== 'touch') { place(event, true); screen.classList.add('is-hovered'); } };
          const move = event => { if (event.pointerType !== 'touch') place(event, false); };
          const leave = () => screen.classList.remove('is-hovered');
          screen.classList.add('has-cursor');
          screen.addEventListener('pointerenter', enter);
          screen.addEventListener('pointermove', move);
          screen.addEventListener('pointerleave', leave);
          cleanups.push(() => {
            screen.classList.remove('has-cursor', 'is-hovered');
            screen.removeEventListener('pointerenter', enter);
            screen.removeEventListener('pointermove', move);
            screen.removeEventListener('pointerleave', leave);
          });
        }
      }
      return () => cleanups.forEach(cleanup => cleanup());
    });
    return () => media.revert();
  }, []);

  return <section ref={root} className="pj" id="projetos" tabIndex={-1} aria-labelledby="pj-title">
    <div className="pj-wrap">
      <header className="pj-head">
        <h2 key={'title-' + lang} className="pj-title" id="pj-title">{p.title[0]}<span className="pj-accent">{p.title[1]}</span>{p.title[2]}</h2>
        <p key={'lede-' + lang} className="pj-lede">{p.lede}</p>
      </header>

      <div className="pj-grid">
        {projects.map((project, index) => <article className="pj-card" id={project.id} key={project.id} aria-labelledby={project.id + '-title'}>
          <div className="pj-card-top pj-mono pj-reveal">
            <span>{pad(index + 1)}</span>
            <span className="pj-status"><i className="pj-led is-live" aria-hidden="true" />{p.live}</span>
          </div>

          <div className="pj-screen" data-preview={index} onClick={event => open(index, event)}>
            <div className="pj-chrome" aria-hidden="true">
              <span className="pj-lights"><i /><i /><i /></span>
              <span className="pj-address pj-mono"><Lock size={10} strokeWidth={2.5} />{project.domain}</span>
            </div>
            <div className="pj-shot">
              <div className="pj-zoom">
                <img src={shotSrc(project)} srcSet={`${shotSrc(project, 800)} 800w, ${shotSrc(project)} 1351w`}
                  sizes="(min-width: 900px) 46vw, 92vw" alt={project.alt} width={project.width} height={project.height}
                  loading="lazy" decoding="async" />
              </div>
            </div>
            <span className="pj-cursor" aria-hidden="true"><span>{p.cursor[0]}<br />{p.cursor[1]}</span></span>
          </div>

          <div className="pj-body">
            <div className="pj-name pj-reveal">
              <h3 id={project.id + '-title'}>{project.title}</h3>
              <p className="pj-mono">{project.type} <span aria-hidden="true">/</span> {project.sector}</p>
            </div>
            <p className="pj-desc pj-reveal">{project.description}</p>
            <div className="pj-foot pj-reveal">
              <ul className="pj-tech pj-mono" aria-label={p.tech(project.title)}>{project.technologies.map(technology => <li key={technology}>{technology}</li>)}</ul>
              <div className="pj-actions">
                <button type="button" className="pj-explore" aria-haspopup="dialog" onClick={event => open(index, event)}>
                  <span>{p.explore}</span><span className="pj-explore-icon" aria-hidden="true"><ArrowUpRight size={18} strokeWidth={2} /></span>
                </button>
                <a className="pj-visit" href={project.url} target="_blank" rel="noreferrer" aria-label={p.visit(project.title)} title={p.newTab}>
                  <ArrowUpRight size={20} strokeWidth={1.75} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </article>)}

        <article className="pj-card pj-wip" id="bacelar-educa" aria-labelledby="bacelar-title">
          <div className="pj-card-top pj-mono pj-reveal">
            <span>03</span>
            <span className="pj-status"><i className="pj-led is-build" aria-hidden="true" />{p.building}</span>
          </div>
          <div className="pj-wip-main">
            <h3 className="pj-wip-title pj-reveal" id="bacelar-title"><span>Bacelar</span> <span>Educa<span className="pj-caret" aria-hidden="true" /></span></h3>
            <div className="pj-wip-body">
              <p className="pj-mono pj-wip-kind pj-reveal">{p.bacelar.kind}</p>
              <p className="pj-desc pj-reveal">{p.bacelar.description}</p>
              <div className="pj-build pj-reveal">
                <span className="pj-build-track" aria-hidden="true"><i /></span>
                <p className="pj-mono"><Lock size={12} strokeWidth={2.25} aria-hidden="true" />{p.bacelar.locked}</p>
              </div>
              <div className="pj-foot pj-reveal">
                <ul className="pj-tech pj-mono" aria-label={p.tech('Bacelar Educa')}><li>Next.js</li><li>TypeScript</li><li>Supabase</li></ul>
                <a className="pj-request" href={whatsapp(p.bacelar.message)} target="_blank" rel="noreferrer">{p.bacelar.request}<ArrowUpRight size={18} aria-hidden="true" /></a>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>

    <ProjectPreview projects={projects} active={active} onSelect={setActive} onClose={close} />
  </section>;
}
