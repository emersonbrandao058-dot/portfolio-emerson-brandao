import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Palette } from 'lucide-react';
import { SiHtml5, SiCss, SiJavascript, SiTypescript, SiReact, SiNextdotjs, SiTailwindcss, SiBootstrap, SiSupabase, SiGit, SiGithub, SiFigma } from 'react-icons/si';
import { useI18n } from './i18n.jsx';

/* The tools listed in the résumé. Canva has no mark in the icon set, so it takes a neutral palette. */
const TOOLS = [
  ['HTML', SiHtml5], ['CSS', SiCss], ['JavaScript', SiJavascript], ['TypeScript', SiTypescript],
  ['React', SiReact], ['Next.js', SiNextdotjs], ['Tailwind CSS', SiTailwindcss], ['Bootstrap', SiBootstrap],
  ['Supabase', SiSupabase], ['Git', SiGit], ['GitHub', SiGithub], ['Figma', SiFigma], ['Canva', Palette],
];
const INTERVAL = 2200;
const WIDE = '(min-width: 1001px)';

const slotCount = () => matchMedia(WIDE).matches ? 4 : 3;
const toolAt = index => TOOLS[((index % TOOLS.length) + TOOLS.length) % TOOLS.length];

function Logo({ tool: [name, Icon], className = '', index }) {
  return <span className={'ab-logo ' + className} style={{ '--i': index }}>
    <Icon aria-hidden="true" focusable="false" /><span>{name}</span>
  </span>;
}

/* A single row of slots, after Aceternity's single-row logo cloud. On a clock of its own,
   independent of the scroll, the whole row hands over to the next batch: each name blurs
   and rises out while the next rises in, slot after slot. It only runs while `active`. */
export function StackCloud({ active = true }) {
  const { t } = useI18n();
  const cloud = useRef(null);
  const [slots, setSlots] = useState(() => typeof window === 'undefined' ? 4 : slotCount());
  const [batch, setBatch] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const wide = matchMedia(WIDE);
    const onMotion = () => setReduced(motion.matches);
    const onSize = () => { setSlots(slotCount()); setBatch(0); };
    motion.addEventListener('change', onMotion);
    wide.addEventListener('change', onSize);
    const observer = new IntersectionObserver(entries => setVisible(entries.at(-1).isIntersecting));
    observer.observe(cloud.current);
    return () => { motion.removeEventListener('change', onMotion); wide.removeEventListener('change', onSize); observer.disconnect(); };
  }, []);

  const running = active && visible && !paused && !hovered && !reduced;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => { if (!document.hidden) setBatch(value => value + 1); }, INTERVAL);
    return () => clearInterval(timer);
  }, [running]);

  return <div className="ab-cloud-wrap">
    {/* Screen readers get the whole list at once; the animated row is visual only. */}
    <ul className="sr-only" aria-label={t.about.tools}>{TOOLS.map(([name]) => <li key={name}>{name}</li>)}</ul>

    <div ref={cloud} className={'ab-cloud' + (reduced ? ' is-static' : '')} style={{ '--slots': slots }} aria-hidden="true"
      onPointerEnter={event => event.pointerType === 'mouse' && setHovered(true)} onPointerLeave={() => setHovered(false)}>
      {reduced
        ? TOOLS.map((tool, index) => <Logo key={tool[0]} tool={tool} index={index} />)
        : Array.from({ length: slots }, (_, index) => <span className="ab-slot" key={index}>
            {batch > 0 && <Logo key={'out' + batch} tool={toolAt((batch - 1) * slots + index)} className="is-out" index={index} />}
            <Logo key={'in' + batch} tool={toolAt(batch * slots + index)} className={batch > 0 ? 'is-in' : ''} index={index} />
          </span>)}
    </div>

    {!reduced && <button type="button" className="ab-pause ab-mono" aria-pressed={paused} onClick={() => setPaused(value => !value)}>
      {paused ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}{paused ? t.about.resume : t.about.pause}
    </button>}
  </div>;
}
