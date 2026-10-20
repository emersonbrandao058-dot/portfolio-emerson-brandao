import { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { SiHtml5, SiCss, SiJavascript, SiTypescript, SiReact, SiNextdotjs, SiTailwindcss, SiSupabase, SiGit, SiFigma } from 'react-icons/si';
import LogoLoop from './components/LogoLoop/LogoLoop.jsx';
import './tech-stack.css';

const technologies = [
  ['HTML', SiHtml5], ['CSS', SiCss], ['JavaScript', SiJavascript], ['TypeScript', SiTypescript],
  ['React', SiReact], ['Next.js', SiNextdotjs], ['Tailwind CSS', SiTailwindcss],
  ['Supabase', SiSupabase], ['Git', SiGit], ['Figma', SiFigma],
];
const logos = technologies.map(([title, Icon]) => ({
  node: <Icon aria-hidden="true" focusable="false" />, title, hoverColor: '#b3bdff',
}));

export function TechStack() {
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReducedMotion(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);

  return <section id="stack" className="tech-stack content" aria-labelledby="stack-heading">
    <div className="stack-heading">
      <div><h2 id="stack-heading">Minha stack.</h2><p>Tecnologias e ferramentas que uso nos meus projetos.</p></div>
      {!reducedMotion && <button type="button" className="stack-pause" aria-pressed={paused} aria-label={paused ? 'Retomar animação da stack' : 'Pausar animação da stack'} onClick={() => setPaused(value => !value)}>
        {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}<span>{paused ? 'Retomar' : 'Pausar'}</span>
      </button>}
    </div>
    <div className="stack-strip">
      {reducedMotion ? <ul className="stack-static" aria-label="Tecnologias e ferramentas">{technologies.map(([title, Icon]) => <li key={title}><Icon aria-hidden="true"/><span>{title}</span></li>)}</ul> :
        <LogoLoop logos={logos} speed={paused ? 0 : 65} direction="left" logoHeight={32} gap={48} labels="inline" intro={false} pauseOnHover fadeOut fadeOutWidth={.07} scaleOnHover draggable ariaLabel="Tecnologias e ferramentas usadas nos projetos" />}
    </div>
  </section>;
}
