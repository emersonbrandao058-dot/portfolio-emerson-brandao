import { useEffect, useRef, useState } from 'react';
import { Circle, RotateCcw } from 'lucide-react';

// Magic UI Terminal's window and sequential typing adapted to the existing
// React/CSS stack, with static accessible copy and reduced-motion support.
const lines = [
  { text: '$ emerson --sobre', command: true },
  { text: 'Emerson Brandão', tone: 'terminal-name' },
  { text: 'ADS · UNIFAN · 3º semestre' },
  { text: 'E-commerce + desenvolvimento web' },
  { text: 'Do layout à interface responsiva.' },
  { text: '$ emerson --foco', command: true },
  { text: 'Conteúdo organizado.' },
  { text: 'Navegação clara.' },
  { text: 'Identidade em cada tela.' },
];
export function AboutTerminal() {
  const frame = useRef(null);
  const [started, setStarted] = useState(false);
  const [replay, setReplay] = useState(0);
  const [step, setStep] = useState(-1);
  const [characters, setCharacters] = useState(0);
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    if (!('IntersectionObserver' in window)) setStarted(true);
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setStarted(true); observer.disconnect(); }
    }, { threshold: .15 }) : null;
    observer?.observe(frame.current);
    return () => { media.removeEventListener('change', update); observer?.disconnect(); };
  }, []);

  useEffect(() => {
    if (reduced) { setStep(lines.length); return; }
    if (!started) return;
    let timer;
    let cancelled = false;
    const next = index => {
      if (cancelled) return;
      setStep(index); setCharacters(0);
      if (index >= lines.length) return;
      if (!lines[index].command) { timer = setTimeout(() => next(index + 1), 280); return; }
      let count = 0;
      const type = () => {
        if (cancelled) return;
        count += 1; setCharacters(count);
        timer = count < lines[index].text.length ? setTimeout(type, 28) : setTimeout(() => next(index + 1), 220);
      };
      timer = setTimeout(type, 28);
    };
    next(0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [started, reduced, replay]);

  return <section className="about-terminal" ref={frame} aria-label="Apresentação de Emerson em terminal">
    <p className="sr-only">Sou Emerson Brandão, estudante do 3º semestre de Análise e Desenvolvimento de Sistemas na UNIFAN. Atuo com e-commerce e desenvolvo sites, do layout à interface responsiva. Meu foco é organizar conteúdo, facilitar a navegação e dar identidade a cada tela.</p>
    <div className="terminal-chrome">
      <span className="terminal-lights" aria-hidden="true"><Circle/><Circle/><Circle/></span>
      <span className="terminal-title">emerson / sobre</span>
      {!reduced && <button type="button" className="terminal-replay" aria-label="Repetir apresentação no terminal" title="Repetir apresentação" onClick={() => { setStarted(true); setReplay(value => value + 1); }}><RotateCcw size={14} aria-hidden="true"/></button>}
    </div>
    <div className="terminal-body" aria-hidden="true">{lines.map((line, index) => {
      const visible = reduced || index <= step;
      const active = !reduced && index === step && line.command;
      return <div key={line.text} className={'terminal-line '+(visible ? 'is-visible ' : '')+(line.command ? 'terminal-command ' : '')+(line.tone || '')}>{active ? line.text.slice(0, characters) : line.text}{active && <span className="terminal-caret"/>}</div>;
    })}</div>
  </section>;
}
