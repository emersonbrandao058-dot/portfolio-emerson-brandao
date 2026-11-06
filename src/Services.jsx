import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ArrowUpRight } from 'lucide-react';
import { SERVICE_IDS, whatsappUrl } from './services-data.js';
import { FOLLOW, focusWords } from './motion.js';
import { useI18n } from './i18n.jsx';

gsap.registerPlugin(ScrollTrigger, SplitText);

const pad = number => String(number).padStart(2, '0');
/* Above this width the rows keep a fixed height and hover is safe; below it they open as an accordion. */
const isIndex = () => matchMedia('(min-width: 1101px)').matches;

export function Services() {
  const { lang, t } = useI18n();
  const s = t.services;
  const root = useRef(null);
  const [active, setActive] = useState(0);
  /* The black band travels in the direction of the selection: down when the next item is below. */
  const [direction, setDirection] = useState('down');

  const select = index => {
    if (index === active) return;
    setDirection(index > active ? 'down' : 'up');
    setActive(index);
  };
  /* A mouse selects by hovering; touch and keyboard select by activating. In the accordion the open item can also be closed. */
  const hover = (index, event) => { if (event.pointerType === 'mouse' && isIndex()) select(index); };
  const toggle = index => {
    if (index === active && !isIndex()) setActive(null);
    else select(index);
  };

  /* The opening is split by SplitText, so it is rebuilt with each language (the title and lede are keyed by it). */
  useEffect(() => {
    const q = gsap.utils.selector(root.current);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const cleanups = [];
      const [head] = q('.sv-head');
      const [title] = q('.sv-title');
      const titleSplit = SplitText.create(title, {
        type: 'lines', mask: 'lines', linesClass: 'sv-split-line', autoSplit: true,
        onSplit: self => gsap.from(self.lines, { yPercent: 105, duration: 1.05, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: head, start: 'top 82%', once: true } }),
      });
      const [lede] = q('.sv-lede');
      /* Same entrance as the projects' opening: lines rise out of a mask, then the lede comes into focus word by word. */
      const ledeSplit = SplitText.create(lede, {
        type: 'words', autoSplit: true,
        onSplit: self => focusWords(self.words, { trigger: head, start: 'top 82%', once: true }),
      });
      cleanups.push(() => { titleSplit.revert(); ledeSplit.revert(); });
      return () => cleanups.forEach(cleanup => cleanup());
    });
    return () => media.revert();
  }, [lang]);

  useEffect(() => {
    const section = root.current;
    const q = gsap.utils.selector(section);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const cleanups = [];
      /* Hand-off from the projects: as this section's edge rises over them, they recede and fade into black. */
      const previous = document.querySelector('#projetos .pj-wrap');
      if (previous) {
        gsap.set(previous, { transformOrigin: '50% 100%' });
        gsap.to(previous, {
          scale: .93, y: 56, opacity: .12, ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'top 18%', scrub: FOLLOW },
        });
      }

      for (const rule of q('.sv-rule')) {
        gsap.from(rule, { scaleX: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: rule, start: 'top 94%', once: true } });
      }
      q('.sv-item').forEach(item => {
        gsap.timeline({ scrollTrigger: { trigger: item, start: 'top 86%', once: true } })
          .from(item.querySelectorAll('.sv-line>span'), { yPercent: 112, duration: 1.05, stagger: .09, ease: 'expo.out' }, 0)
          .from(item.querySelectorAll('.sv-num, .sv-keys li, .sv-toggle'), { opacity: 0, y: 14, duration: .7, stagger: .05, ease: 'power3.out' }, .25);
      });
      gsap.from(q('.sv-close>*'), { opacity: 0, y: 22, duration: .8, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: q('.sv-close')[0], start: 'top 92%', once: true } });

      return () => cleanups.forEach(cleanup => cleanup());
    });
    return () => media.revert();
  }, []);

  return <section ref={root} className="sv" id="servicos" tabIndex={-1} aria-labelledby="sv-title">
    <div className="sv-wrap">
      <header className="sv-head">
        <h2 key={'title-' + lang} className="sv-title" id="sv-title">{s.title[0]}<span className="sv-accent">{s.title[1]}</span>{s.title[2]}</h2>
        <p key={'lede-' + lang} className="sv-lede">{s.lede}</p>
      </header>
    </div>

    <ol className="sv-list">
      {SERVICE_IDS.map((serviceId, index) => {
        const service = { id: serviceId, ...s.items[serviceId] };
        const isActive = active === index;
        const id = 'sv-' + service.id;
        return <li key={service.id} className={'sv-item' + (isActive ? ' is-active' : '')}
          style={{ '--sv-origin': isActive === (direction === 'down') ? '50% 0%' : '50% 100%' }}
          onPointerEnter={event => hover(index, event)}>
          <span className="sv-rule" aria-hidden="true" />
          <div className="sv-row">
            <span className="sv-num sv-mono" aria-hidden="true">{pad(index + 1)}</span>
            <h3 className="sv-name">
              <button type="button" className="sv-trigger" id={id + '-trigger'} aria-expanded={isActive} aria-controls={id + '-panel'} onClick={() => toggle(index)}>
                {service.name.map((line, i) => <span key={i}><span className="sv-line"><span>{line}</span></span>{i < service.name.length - 1 && ' '}</span>)}
              </button>
            </h3>
            <ul className="sv-keys sv-mono" aria-label={s.summary(service.label)}>{service.keys.map((key, i) => <li key={i}>{key}</li>)}</ul>
            <span className="sv-toggle" aria-hidden="true"><i /><i /></span>

            <div className="sv-panel" id={id + '-panel'} role="region" aria-labelledby={id + '-trigger'}>
              <div className="sv-panel-in">
                <p className="sv-promise">{service.promise}</p>
                <p className="sv-desc">{service.description}</p>
                <ul className="sv-deliver sv-mono" aria-label={s.included}>{service.deliverables.map(item => <li key={item}>{item}</li>)}</ul>
                <a className="sv-cta" href={whatsappUrl(s.quote(service))} target="_blank" rel="noreferrer">
                  <span>{s.cta}</span><span className="sv-cta-icon" aria-hidden="true"><ArrowUpRight size={18} strokeWidth={2} /></span>
                </a>
              </div>
            </div>
          </div>
        </li>;
      })}
    </ol>
    <span className="sv-rule" aria-hidden="true" />

    <div className="sv-wrap">
      <div className="sv-close">
        <p>{s.closeTitle}<span>{s.closeText}</span></p>
        <a className="sv-talk" href={whatsappUrl(s.talkMessage)} target="_blank" rel="noreferrer">
          <span>{s.talk}</span><span className="sv-talk-icon" aria-hidden="true"><ArrowUpRight size={18} strokeWidth={2} /></span>
        </a>
      </div>
    </div>
  </section>;
}
