import { assetUrl } from './asset-url.js';
import React, { useEffect, useRef, useState } from 'react';
import { Menu, X, ArrowUpRight, ArrowDown, Download } from 'lucide-react';
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
  { name: 'Bacelar Educa', description: 'Plataforma de reforço escolar com questões, listas e perfis de acesso. A versão pública está em preparação.', url: 'mailto:emersonbrandao058@gmail.com?subject=Apresenta%C3%A7%C3%A3o%20do%20Bacelar%20Educa', cover: assetUrl('/assets/bacelar-cover.svg'), technologies: ['Next.js', 'TypeScript', 'Supabase'], inProgress: true },
];

export function App() {
  const [menu, setMenu] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const root = useRef(null);
  const menuButton = useRef(null);
  const close = () => setMenu(false);

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
    const update = () => setShowMenu(hero.getBoundingClientRect().bottom <= 96);
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);

  useEffect(() => {
    const motion = gsap.matchMedia();
    motion.add('(prefers-reduced-motion: no-preference)', () => {
      const cleanup = [];
      const ctx = gsap.context(() => {
      // Each element has one opacity owner. Scroll never fades the opening copy.
      gsap.fromTo('.hero-copy-reveal,.portrait-name,.topbar',
        { y: 20, opacity: .3 },
        { y: 0, opacity: 1, duration: 1.1, stagger: .1, ease: 'power3.out' });
      gsap.fromTo('.portrait-photo', { y: 24 }, { y: 0, duration: 1.25, ease: 'power3.out' });
      gsap.to('.portrait-photo img', { y: 25, ease: 'none', scrollTrigger: { trigger: '#inicio', start: 'top top', end: 'bottom top', scrub: 1 } });
      for (const element of gsap.utils.toArray('[data-reveal]')) {
        gsap.fromTo(element, { y: 32, opacity: .3 }, {
          y: 0, opacity: 1, duration: .85, ease: 'power3.out', immediateRender: false,
          scrollTrigger: { trigger: element, start: 'top 94%', once: true },
        });
      }
      gsap.fromTo('.footer-curve', { height: 90 }, { height: 12, ease: 'none', scrollTrigger: { trigger: 'footer', start: 'top bottom', end: 'top 20%', scrub: 1 } });
      if (matchMedia('(pointer:fine)').matches) {
        for (const item of root.current.querySelectorAll('.menu-button,.hero-project-link')) {
          const move = e => { const b = item.getBoundingClientRect(); gsap.to(item, { x: (e.clientX - b.left - b.width / 2) * .12, y: (e.clientY - b.top - b.height / 2) * .12, duration: .5, overwrite: 'auto' }); };
          const leave = () => gsap.to(item, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.5)', overwrite: 'auto' });
          item.addEventListener('pointermove', move); item.addEventListener('pointerleave', leave);
          cleanup.push(() => { item.removeEventListener('pointermove', move); item.removeEventListener('pointerleave', leave); });
        }
      }
    }, root);
      return () => { cleanup.forEach(fn => fn()); ctx.revert(); };
    });
    return () => motion.revert();
  }, []);

  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape' && menu) { close(); menuButton.current?.focus(); }
      if (e.key === 'Tab' && menu) {
        const items = [menuButton.current, root.current.querySelector('.theme-switcher'), ...root.current.querySelectorAll('.menu-overlay a')].filter(Boolean);
        const first = items[0], last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = menu ? 'hidden' : '';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [menu]);

  return <main ref={root}>
    <a className="skip" href="#projetos">Pular para projetos</a>
    <section className="hero portrait-hero" id="inicio" aria-label="Apresentação">
      <header className="topbar content">
        <a href="#inicio">Emerson Brandão<span className="brand-dot">.</span></a>
        <nav aria-label="Principal"><a href="#projetos">Projetos</a><a href="#sobre">Sobre</a><a href="#contato">Contato</a></nav>
      </header>
      <div className="hero-stage content"><h1 className="portrait-name"><span>Emerson</span><span>Brandão</span></h1>
      <div className="portrait-photo"><img src={assetUrl("/assets/emerson-portrait.webp")} alt="Retrato de Emerson Brandão" width="1254" height="1254" fetchPriority="high" /></div>
      <div className="hero-intro"><div className="hero-copy-reveal">
        <h2>Web designer<br/>{' '}e desenvolvedor.</h2>
        <p>Crio sites que unem identidade visual, navegação clara e cuidado em cada detalhe.</p>
        <a className="hero-project-link" href="#projetos"><span>Conheça meus projetos</span><ArrowUpRight size={20} aria-hidden="true"/></a>
      </div></div></div>
      <div className="hero-bottom content"><a href="#sobre"><ArrowDown size={16} aria-hidden="true"/> Explore o portfólio</a><span>Feira de Santana · Bahia</span><a href={assetUrl("/curriculo.html")} target="_blank" rel="noreferrer">Ver currículo <ArrowUpRight size={16} aria-hidden="true"/></a></div>
    </section>
    <button ref={menuButton} className={'menu-button '+((showMenu||menu)?'is-visible ':'')+(menu?'active':'')} aria-hidden={!(showMenu||menu)} tabIndex={(showMenu||menu)?0:-1} aria-expanded={menu} aria-controls="site-menu" aria-label={menu?'Fechar menu':'Abrir menu'} onClick={()=>setMenu(!menu)}>{menu?<X size={24} strokeWidth={1.2}/>:<Menu size={24} strokeWidth={1.2}/>}</button>
    <AnimatedThemeToggler className={'theme-switcher '+((showMenu||menu)?'with-menu':'')} duration={450}/>
    {menu&&<div className="menu-overlay" id="site-menu"><p>NAVEGAÇÃO</p><nav aria-label="Menu da página">{[['Início','inicio'],['Projetos','projetos'],['Sobre','sobre'],['Contato','contato']].map(([label,id])=><a key={id} onClick={close} href={'#'+id}>{label}<ArrowUpRight size={25} aria-hidden="true"/></a>)}</nav><a href="mailto:emersonbrandao058@gmail.com">emersonbrandao058@gmail.com</a></div>}
    <section className="intro content" id="sobre">
      <h2 data-reveal>Entre o visual<br/>e o funcional.</h2>
      <div className="intro-copy"><AboutTerminal/><a className="text-link" href={assetUrl("/curriculo.html")} target="_blank" rel="noreferrer">Conheça minha trajetória <ArrowUpRight size={16} aria-hidden="true"/></a></div>
    </section>
    <TechStack/>
    <section className="work content text-projects" id="projetos">
      <h2 className="section-title" data-reveal>Projetos selecionados<span>{String(projects.length).padStart(2, '0')}</span></h2>
      <div className="project-list">{projects.map(project => <article className="project-card" key={project.name} data-reveal>
        <a className="project-card-link" href={project.url} target={project.inProgress ? undefined : '_blank'} rel={project.inProgress ? undefined : 'noreferrer'} aria-label={project.inProgress ? 'Solicitar apresentação de '+project.name : 'Visitar '+project.name}>
          <div className="project-cover"><img src={project.cover} alt={project.inProgress ? 'Capa do projeto Bacelar Educa' : 'Prévia do site '+project.name} width="1200" height="824" loading="lazy" decoding="async"/></div>
          <div className="project-details"><div className="project-title-line"><h3>{project.name}</h3>{project.inProgress && <span className="project-status">Em desenvolvimento</span>}</div>
            <p>{project.description}</p>
            <ul className="project-technologies" aria-label={'Tecnologias de '+project.name}>{project.technologies.map(technology => <li key={technology}>{technology}</li>)}</ul>
            <span className="project-visit">{project.inProgress ? 'Solicitar apresentação' : 'Ver projeto'}<ArrowUpRight size={20} strokeWidth={1.5} aria-hidden="true"/></span>
          </div>
        </a>
      </article>)}</div>
    </section>
    <section className="experience content experience-editorial" id="experiencia">
      <div data-reveal><h2>Design na rotina.<br/>Organização<br/>na operação.</h2><p className="experience-note">A prática do e-commerce faz parte do meu jeito de pensar e construir para a web.</p></div>
      <article className="employment" data-reveal><div className="employment-heading"><span className="employment-status">Atualmente</span><h3>Armazém dos Cosméticos</h3><p>Auxiliar de e-commerce júnior</p></div><ul><li>Criação de banners e peças visuais para o e-commerce.</li><li>Cadastro de produtos e organização do conteúdo e da apresentação do site.</li><li>Rotinas no Bling e preparação de campanhas de e-mail no RD Marketing.</li></ul><div className="skills" aria-label="Ferramentas e atuação"><span>E-commerce</span><span>Canva</span><span>Figma</span><span>Bling</span><span>RD Marketing</span></div></article>
    </section>
    <footer id="contato"><div className="footer-curve"/><div className="content contact">
      <div className="contact-heading"><h2 data-reveal>Vamos tirar sua<br/>ideia do papel.</h2><a className="contact-circle" href="https://wa.me/5575999312633" target="_blank" rel="noreferrer">Vamos conversar <ArrowUpRight size={20} aria-hidden="true"/></a></div>
      <div className="contact-links" data-reveal><a href="mailto:emersonbrandao058@gmail.com">emersonbrandao058@gmail.com <ArrowUpRight size={18} aria-hidden="true"/></a><a href="https://wa.me/5575999312633" target="_blank" rel="noreferrer">(75) 99931-2633 <ArrowUpRight size={18} aria-hidden="true"/></a><a href={assetUrl("/curriculo-emerson-brandao.pdf")} download="Curriculo-Emerson-Brandao.pdf">Baixar currículo <Download size={18} aria-hidden="true"/></a></div>
      <SocialButtons/><div className="footer-bottom"><span>© 2026 Emerson Brandão</span><span>Feira de Santana · Bahia</span><a href="https://github.com/emersonbrandao058-dot" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={16} aria-hidden="true"/></a></div></div></footer>
  </main>;
}
