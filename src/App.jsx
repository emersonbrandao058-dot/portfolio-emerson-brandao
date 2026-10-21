import { assetUrl } from './asset-url.js';
import React, { useEffect, useRef, useState } from 'react';
import { Menu, X, ArrowUpRight, ArrowDown } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SocialButtons } from './SocialButtons.jsx';
import { TechStack } from './TechStack.jsx';
import { AboutTerminal } from './components/magicui/AboutTerminal.jsx';
import { AnimatedThemeToggler } from './components/magicui/AnimatedThemeToggler.jsx';

gsap.registerPlugin(ScrollTrigger);
const projects = [
  { name: 'UltraEnergy', description: 'Site institucional para uma empresa de energia solar, com apresentação de serviços e demonstração de monitoramento.', url: 'https://ultraenergy.vercel.app/', cover: assetUrl('/assets/ultraenergy-preview.webp'), technologies: ['HTML', 'CSS', 'JavaScript'] },
  { name: 'JJ Style', description: 'Catálogo de moda masculina com navegação por produtos e contato direto pelo WhatsApp.', url: 'https://jj-style.vercel.app/', cover: assetUrl('/assets/jjstyle-preview.webp'), technologies: ['HTML', 'CSS', 'Bootstrap'] },
  { name: 'Bacelar Educa', description: 'Plataforma de reforço escolar com questões, listas e perfis de acesso. A versão pública está em preparação.', url: 'https://wa.me/5575999312633?text=Ol%C3%A1%2C%20gostaria%20de%20solicitar%20uma%20apresenta%C3%A7%C3%A3o%20do%20Bacelar%20Educa.', cover: assetUrl('/assets/bacelar-cover.svg'), technologies: ['Next.js', 'TypeScript', 'Supabase'], inProgress: true },
];

function PortraitColorReveal() {
  const photo = useRef(null);
  const canvas = useRef(null);

  useEffect(() => {
    const image = photo.current;
    const overlay = canvas.current;
    const context = overlay.getContext('2d');
    if (!context) return;
    const interaction = gsap.matchMedia();
    interaction.add('(pointer: fine) and (hover: hover)', () => {
      const area = image.parentElement;
      let pointer = null;
      let width = 0, height = 0, dpr = 1;
      let drawWidth = 0, drawHeight = 0, x = 0, y = 0;

      const draw = () => {
        if (!width || !height || !image.naturalWidth) return;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.clearRect(0, 0, width, height);
        if (!pointer) return;
        // Match object-fit: contain and the image's responsive object-position.
        context.globalCompositeOperation = 'source-over';
        context.drawImage(image, x, y, drawWidth, drawHeight);
        const radius = Math.min(130, drawWidth * .3);
        const feather = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, radius);
        feather.addColorStop(0, '#000');
        feather.addColorStop(.3, '#000');
        feather.addColorStop(.65, 'rgba(0,0,0,.5)');
        feather.addColorStop(1, 'rgba(0,0,0,0)');
        context.globalCompositeOperation = 'destination-in';
        context.fillStyle = feather;
        context.fillRect(0, 0, width, height);
        context.globalCompositeOperation = 'source-over';
      };

      const measure = () => {
        pointer = null;
        const bounds = image.getBoundingClientRect();
        width = bounds.width;
        height = bounds.height;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        overlay.width = Math.round(width * dpr);
        overlay.height = Math.round(height * dpr);
        if (!image.naturalWidth) return;
        const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
        drawWidth = image.naturalWidth * scale;
        drawHeight = image.naturalHeight * scale;
        const [horizontal, vertical] = getComputedStyle(image).objectPosition.split(' ').map(parseFloat);
        x = (width - drawWidth) * horizontal / 100;
        y = (height - drawHeight) * vertical / 100;
        draw();
      };

      const move = event => {
        if (event.pointerType === 'touch') return;
        const bounds = overlay.getBoundingClientRect();
        pointer = { x: (event.clientX - bounds.left) * width / bounds.width, y: (event.clientY - bounds.top) * height / bounds.height };
        draw();
      };
      const leave = () => { pointer = null; draw(); };
      const observer = new ResizeObserver(measure);
      observer.observe(image);
      image.addEventListener('load', measure);
      window.addEventListener('resize', measure);
      area.addEventListener('pointerenter', move);
      area.addEventListener('pointermove', move);
      area.addEventListener('pointerleave', leave);
      area.addEventListener('pointercancel', leave);
      measure();
      return () => {
        image.removeEventListener('load', measure);
        window.removeEventListener('resize', measure);
        area.removeEventListener('pointerenter', move);
        area.removeEventListener('pointermove', move);
        area.removeEventListener('pointerleave', leave);
        area.removeEventListener('pointercancel', leave);
        observer.disconnect();
        overlay.width = overlay.height = 0;
      };
    });
    return () => interaction.revert();
  }, []);

  return <div className="portrait-photo">
    <img ref={photo} src={assetUrl('/assets/emerson-portrait.webp')} alt="Retrato de Emerson Brandão" width="1254" height="1254" fetchPriority="high" />
    <canvas ref={canvas} className="portrait-color" aria-hidden="true" />
  </div>;
}

export function App() {
  const [menu, setMenu] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const root = useRef(null);
  const menuButton = useRef(null);
  const navigation = useRef(null);
  const glassTitle = useRef(null);
  const close = () => {
    setMenu(false);
    menuButton.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    const title = glassTitle.current;
    const media = matchMedia('(pointer: fine) and (hover: hover) and (prefers-reduced-motion: no-preference)');
    let frame = 0;
    let position = { x: 50, y: 42 };
    const paint = () => {
      title.style.setProperty('--glass-x', `${position.x}%`);
      title.style.setProperty('--glass-y', `${position.y}%`);
      frame = 0;
    };
    const move = event => {
      if (!media.matches || event.pointerType === 'touch') return;
      const bounds = title.getBoundingClientRect();
      position = {
        x: Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)),
        y: Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100)),
      };
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      position = { x: 50, y: 42 };
      paint();
    };
    title.addEventListener('pointermove', move);
    title.addEventListener('pointerleave', reset);
    title.addEventListener('pointercancel', reset);
    media.addEventListener('change', reset);
    return () => {
      cancelAnimationFrame(frame);
      title.removeEventListener('pointermove', move);
      title.removeEventListener('pointerleave', reset);
      title.removeEventListener('pointercancel', reset);
      media.removeEventListener('change', reset);
    };
  }, []);

  useEffect(() => {
    if (!window.location.hash) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'instant', block: 'start' });
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const hero = root.current.querySelector('#inicio');
    const update = () => setShowMenu(hero.getBoundingClientRect().bottom <= 0);
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);

  useEffect(() => {
    if (!showMenu && !menu && document.activeElement === menuButton.current) {
      navigation.current.querySelector('.theme-switcher')?.focus({ preventScroll: true });
    }
  }, [showMenu, menu]);

  useEffect(() => {
    const motion = gsap.matchMedia();
    motion.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
      // Each element has one opacity owner. Scroll never fades the opening copy.
      gsap.fromTo('.hero-copy-reveal,.portrait-name,.topbar,.portrait-photo',
        { y: 12, opacity: .8 },
        { y: 0, opacity: 1, duration: .7, stagger: .06, ease: 'power3.out' });
      for (const element of gsap.utils.toArray('[data-reveal]')) {
        gsap.fromTo(element, { y: 32, opacity: .3 }, {
          y: 0, opacity: 1, duration: .85, ease: 'power3.out', immediateRender: false,
          scrollTrigger: { trigger: element, start: 'top 94%', once: true },
        });
      }
    }, root);
      return () => ctx.revert();
    });
    return () => motion.revert();
  }, []);

  useEffect(() => {
    if (!menu) return;
    const previousOverflow = document.body.style.overflow;
    navigation.current.querySelector('.menu-overlay a')?.focus({ preventScroll: true });
    const handler = e => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') {
        const items = [...navigation.current.querySelectorAll('button, .menu-overlay a')];
        const first = items[0], last = items.at(-1);
        if (!navigation.current.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = previousOverflow; };
  }, [menu]);

  return <main ref={root}>
    <div className="page-content" inert={menu}>
    <a className="skip" href="#projetos" onClick={() => document.getElementById('projetos')?.focus({ preventScroll: true })}>Pular para projetos</a>
    <section className="hero portrait-hero" id="inicio" aria-label="Apresentação">
      <header className="topbar content">
        <a href="#inicio">Emerson Brandão<span className="brand-dot">.</span></a>
        <nav aria-label="Principal"><a href="#projetos">Projetos</a><a href="#sobre">Sobre</a><a href="#contato">Contato</a></nav>
      </header>
      <div className="hero-stage content"><h1 className="portrait-name"><span>Emerson</span><span>Brandão</span></h1>
      <PortraitColorReveal />
      <div className="hero-intro"><div className="hero-copy-reveal">
        <h2>Web designer<br/>{' '}e desenvolvedor.</h2>
        <p>Crio sites que unem identidade visual, navegação clara e cuidado em cada detalhe.</p>
        <a className="hero-project-link" href="#projetos"><span>Conheça meus projetos</span><ArrowUpRight size={20} aria-hidden="true"/></a>
      </div></div></div>
      <div className="hero-bottom content"><a href="#sobre"><ArrowDown size={16} aria-hidden="true"/> Explore o portfólio</a><span>Feira de Santana · Bahia</span><a href={assetUrl("/curriculo.html")} target="_blank" rel="noreferrer">Ver currículo <ArrowUpRight size={16} aria-hidden="true"/></a></div>
    </section>
    <section className="intro content" id="sobre">
      <h2 data-reveal>Entre o visual<br/>e o funcional.</h2>
      <div className="intro-copy"><AboutTerminal/><a className="text-link" href={assetUrl("/curriculo.html")} target="_blank" rel="noreferrer">Conheça minha trajetória <ArrowUpRight size={16} aria-hidden="true"/></a></div>
    </section>
    <TechStack/>
    <section className="work content text-projects" id="projetos" tabIndex={-1}>
      <h2 className="section-title" data-reveal>Projetos selecionados<span>{String(projects.length).padStart(2, '0')}</span></h2>
      <div className="project-list">{projects.map(project => <article className="project-card" key={project.name} data-reveal>
        <a className="project-card-link" href={project.url} target="_blank" rel="noreferrer" aria-label={project.inProgress ? 'Solicitar apresentação de '+project.name : 'Visitar '+project.name}>
          <div className="project-cover"><img src={project.cover} alt={project.inProgress ? 'Capa do projeto Bacelar Educa' : 'Prévia do site '+project.name} width="1200" height="824" loading="lazy" decoding="async"/></div>
          <div className="project-details"><div className="project-title-line"><h3>{project.name}</h3>{project.inProgress && <span className="project-status">Em desenvolvimento</span>}</div>
            <p>{project.description}</p>
            <ul className="project-technologies" aria-label={'Tecnologias de '+project.name}>{project.technologies.map(technology => <li key={technology}>{technology}</li>)}</ul>
            <span className="project-visit">{project.inProgress ? 'Solicitar apresentação' : 'Ver projeto'}<ArrowUpRight size={20} strokeWidth={1.5} aria-hidden="true"/></span>
          </div>
        </a>
      </article>)}</div>
    </section>
    <footer id="contato" className="contact-footer"><div className="content contact">
      <div className="contact-main">
        <p className="contact-label">Contato</p>
        <h2 ref={glassTitle} className="contact-glass" data-text="Vamos conversar.">Vamos conversar.</h2>
        <div className="contact-actions">
          <a href="mailto:emersonbrandao058@gmail.com">Enviar e-mail <ArrowUpRight size={18} aria-hidden="true"/></a>
          <a href="https://wa.me/5575999312633" target="_blank" rel="noreferrer">WhatsApp <ArrowUpRight size={18} aria-hidden="true"/></a>
          <a href={assetUrl('/curriculo-emerson-brandao.pdf')} download="Curriculo-Emerson-Brandao.pdf">Baixar currículo <ArrowDown size={18} aria-hidden="true"/></a>
        </div>
      </div>
      <div className="contact-colophon"><SocialButtons/><div className="contact-credit"><a className="contact-credit-email" href="mailto:emersonbrandao058@gmail.com">emersonbrandao058@gmail.com</a><span>© 2026 Emerson Brandão</span><span>Feira de Santana · Bahia</span></div></div>
    </div></footer>
    </div>
    <div ref={navigation} className={'global-navigation'+(showMenu||menu?' has-menu':'')+(menu?' is-open':'')} role={menu?'dialog':undefined} aria-modal={menu?true:undefined} aria-label={menu?'Navegação':undefined}>
      <div className="navigation-dock">
        <AnimatedThemeToggler className="theme-switcher" duration={250}/>
        <button type="button" ref={menuButton} className={'menu-button '+((showMenu||menu)?'is-visible ':'')+(menu?'active':'')} aria-hidden={!(showMenu||menu)} tabIndex={(showMenu||menu)?0:-1} aria-expanded={menu} aria-controls="site-menu" aria-label={menu?'Fechar menu':'Abrir menu'} onClick={()=>menu?close():setMenu(true)}>{menu?<X size={22} strokeWidth={1.5}/>:<Menu size={22} strokeWidth={1.5}/>}</button>
      </div>
      <div className="menu-overlay" id="site-menu" hidden={!menu}>
        <p>NAVEGAÇÃO</p><nav aria-label="Menu da página">{[['Início','inicio'],['Projetos','projetos'],['Sobre','sobre'],['Contato','contato']].map(([label,id])=><a key={id} onClick={close} href={'#'+id}>{label}<ArrowUpRight size={25} aria-hidden="true"/></a>)}</nav><a href="mailto:emersonbrandao058@gmail.com">emersonbrandao058@gmail.com</a>
      </div>
    </div>
  </main>;
}
