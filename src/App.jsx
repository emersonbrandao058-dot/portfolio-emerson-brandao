import { assetUrl } from './asset-url.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Menu, X, ArrowUpRight, ArrowDown } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SocialButtons } from './SocialButtons.jsx';
import { LanguageSwitch, useI18n } from './i18n.jsx';
import { Hero } from './Hero.jsx';
import { Projects } from './Projects.jsx';
import { Services } from './Services.jsx';
import { About } from './About.jsx';
import { Faq } from './Faq.jsx';

gsap.registerPlugin(ScrollTrigger);


export function App() {
  const { lang, t } = useI18n();
  const [menu, setMenu] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [overDark, setOverDark] = useState(false);
  const [overServices, setOverServices] = useState(false);
  const root = useRef(null);
  const menuButton = useRef(null);
  const navigation = useRef(null);
  const glassTitle = useRef(null);
  /* The navigation changes colour at every section boundary; the sections are not re-rendered with it
     (a whole-page render landed on exactly those frames). They are rebuilt only when the language changes. */
  const sections = useMemo(() => <><Hero/><Projects/><Services/><About/><Faq/></>, [lang]);
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

  /* After a language switch the sections have rebuilt their split headings and Nox's timeline (child effects
     run first); every other trigger below a changed line is re-measured here. */
  const firstLanguage = useRef(lang);
  useEffect(() => {
    if (lang === firstLanguage.current) return;
    firstLanguage.current = null;
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(frame);
  }, [lang]);

  useEffect(() => {
    if (!window.location.hash) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'instant', block: 'start' });
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    // The menu button appears once the hero has fully left the screen; an observer instead of a
    // measurement on every scroll event, which forced a layout in the middle of the scroll.
    const hero = root.current.querySelector('#inicio');
    // Several records can arrive at once after a fast scroll: the last one is the current state.
    const observer = new IntersectionObserver(entries => {
      const entry = entries.at(-1);
      setShowMenu(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // The fixed navigation band takes the black of the projects, the about and the FAQ, or the graphite of the services, while it sits over them.
    const seen = { projetos: false, servicos: false, sobre: false, faq: false };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) seen[entry.target.id] = entry.isIntersecting;
      setOverServices(seen.servicos);
      setOverDark((seen.projetos || seen.sobre || seen.faq) && !seen.servicos);
    }, { rootMargin: '0px 0px -90% 0px' });
    observer.observe(document.getElementById('projetos'));
    observer.observe(document.getElementById('servicos'));
    observer.observe(document.getElementById('sobre'));
    observer.observe(document.getElementById('faq'));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!showMenu && !menu && document.activeElement === menuButton.current) {
      navigation.current.querySelector('.lang-option.is-active')?.focus({ preventScroll: true });
    }
  }, [showMenu, menu]);

  useEffect(() => {
    const motion = gsap.matchMedia();
    motion.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
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
    <a className="skip" href="#projetos" onClick={() => document.getElementById('projetos')?.focus({ preventScroll: true })}>{t.nav.skip}</a>
    {sections}

    <footer id="contato" className="contact-footer"><div className="content contact">
      <div className="contact-main">
        <p className="contact-label"><span className="contact-pulse" aria-hidden="true"/>{t.contact.label}<span className="contact-label-more">{t.contact.labelMore}</span></p>
        <h2 ref={glassTitle} className="contact-glass" data-text={t.contact.title}>{t.contact.title}</h2>
        <p className="contact-lead">{t.contact.lead}</p>
        <div className="contact-actions">
          <a className="contact-primary" href="https://wa.me/5575999312633" target="_blank" rel="noreferrer"><span>{t.contact.whatsapp}</span><span className="contact-primary-dot" aria-hidden="true"><ArrowUpRight size={20}/></span></a>
          <a className="contact-secondary" href="mailto:emersonbrandao058@gmail.com"><span className="contact-secondary-hint">{t.contact.emailHint}</span><span className="contact-secondary-mail">emersonbrandao058@gmail.com <ArrowUpRight size={16} aria-hidden="true"/></span></a>
        </div>
      </div>
      <div className="contact-colophon">
        <div className="contact-colophon-links"><SocialButtons/><a className="contact-resume" href={assetUrl('/curriculo-emerson-brandao.pdf')} download="Curriculo-Emerson-Brandao.pdf">{t.contact.resume} <ArrowDown size={15} aria-hidden="true"/></a></div>
        <div className="contact-credit"><a className="contact-credit-email" href="mailto:emersonbrandao058@gmail.com">emersonbrandao058@gmail.com</a><span>© 2026 Emerson Brandão</span><span>{t.contact.location}</span></div>
      </div>
    </div></footer>
    </div>
    <div ref={navigation} className={'global-navigation'+(showMenu||menu?' has-menu':'')+(menu?' is-open':'')+(overDark?' over-dark':'')+(overServices?' over-services':'')} role={menu?'dialog':undefined} aria-modal={menu?true:undefined} aria-label={menu?t.nav.dialog:undefined}>
      <div className="navigation-dock">
        <LanguageSwitch/>
        <button type="button" ref={menuButton} className={'menu-button '+((showMenu||menu)?'is-visible ':'')+(menu?'active':'')} aria-hidden={!(showMenu||menu)} tabIndex={(showMenu||menu)?0:-1} aria-expanded={menu} aria-controls="site-menu" aria-label={menu?t.nav.close:t.nav.open} onClick={()=>menu?close():setMenu(true)}>{menu?<X size={22} strokeWidth={1.5}/>:<Menu size={22} strokeWidth={1.5}/>}</button>
      </div>
      <div className="menu-overlay" id="site-menu" hidden={!menu}>
        <p>{t.nav.heading}</p><nav aria-label={t.nav.menu}>{Object.entries(t.nav.links).map(([id,label])=><a key={id} onClick={close} href={'#'+id}>{label}<ArrowUpRight size={25} aria-hidden="true"/></a>)}</nav><a href="mailto:emersonbrandao058@gmail.com">emersonbrandao058@gmail.com</a>
      </div>
    </div>
  </main>;
}
