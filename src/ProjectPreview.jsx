import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Lock, Monitor, RotateCw, Smartphone, X } from 'lucide-react';
import { shotSrc } from './projects-data.js';
import { useI18n } from './i18n.jsx';

const REVEAL_AFTER = 2500;
/* After this long without a load event the viewer offers the new-tab route. */
const SLOW_AFTER = 12000;
const CLOSE_MS = 260;

/* A small browser inside the portfolio: one tab per live project, the real site in an iframe,
   a desktop / phone width switch and a way out to the real page at every moment. */
export function ProjectPreview({ projects, active, onSelect, onClose }) {
  const { t: { preview: t } } = useI18n();
  const dialog = useRef(null);
  const [device, setDevice] = useState('desktop');
  const [status, setStatus] = useState('loading');
  const [reload, setReload] = useState(0);
  const [closing, setClosing] = useState(false);
  const project = active == null ? null : projects[active];

  /* Open / close the native modal: it brings focus trapping, Esc and an inert page for free. */
  useEffect(() => {
    const element = dialog.current;
    if (project && !element.open) {
      element.showModal();
      element.querySelector('.pv-close')?.focus();
      document.documentElement.classList.add('pv-locked');
    }
    if (!project && element.open) element.close();
    if (!project) document.documentElement.classList.remove('pv-locked');
  }, [project]);
  useEffect(() => () => document.documentElement.classList.remove('pv-locked'), []);

  /* A cross-origin page only reports its full load, which can lag well behind its first paint.
     So the veil lifts at load or after a short wait, whichever comes first; the progress line
     keeps running until load, and a page that never answers gets a quiet way out. */
  useEffect(() => {
    if (!project) return undefined;
    setStatus('loading');
    const reveal = setTimeout(() => setStatus(current => current === 'loading' ? 'painting' : current), REVEAL_AFTER);
    const slow = setTimeout(() => setStatus(current => current === 'ready' ? current : 'slow'), SLOW_AFTER);
    return () => { clearTimeout(reveal); clearTimeout(slow); };
  }, [project?.id, reload]); // by id: a language switch must not restart the load

  const requestClose = () => {
    if (closing) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { onClose(); return; }
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, CLOSE_MS);
  };

  const onKeyDown = event => {
    if (!project || event.target.closest?.('.pv-tabs') == null) return;
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = (active + (event.key === 'ArrowRight' ? 1 : -1) + projects.length) % projects.length;
    onSelect(next);
    dialog.current.querySelector(`#pv-tab-${projects[next].id}`)?.focus();
  };

  return <dialog
    ref={dialog}
    className={'pv' + (closing ? ' is-closing' : '')}
    aria-labelledby="pv-heading"
    onCancel={event => { event.preventDefault(); requestClose(); }}
    onClick={event => { if (event.target === dialog.current) requestClose(); }}
    onKeyDown={onKeyDown}
  >
    {project && <div className="pv-panel">
      <h2 className="pv-heading" id="pv-heading">{t.heading(project.title)}</h2>
      <div className="pv-bar">
        <div className="pv-tabs" role="tablist" aria-label={t.tabs}>
          {projects.map((item, index) => <button
            key={item.id} id={'pv-tab-' + item.id} type="button" role="tab" className="pv-tab"
            aria-selected={index === active} aria-controls="pv-stage" tabIndex={index === active ? 0 : -1}
            onClick={() => onSelect(index)}>
            <span className="pv-tab-num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{item.title}
          </button>)}
        </div>

        <div className="pv-address">
          <Lock size={12} strokeWidth={2.5} aria-hidden="true" />
          <span className="pv-url"><span className="pv-url-scheme">https://</span>{project.domain}</span>
          <button type="button" className="pv-icon pv-reload" onClick={() => setReload(value => value + 1)} aria-label={t.reload} title={t.reloadTitle}>
            <RotateCw size={15} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="pv-tools">
          <div className="pv-devices" role="group" aria-label={t.width}>
            <button type="button" data-device="desktop" aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')} title={t.desktop}>
              <Monitor size={16} strokeWidth={1.75} aria-hidden="true" /><span>{t.desktop}</span>
            </button>
            <button type="button" data-device="mobile" aria-pressed={device === 'mobile'} onClick={() => setDevice('mobile')} title={t.mobile}>
              <Smartphone size={16} strokeWidth={1.75} aria-hidden="true" /><span>{t.mobile}</span>
            </button>
          </div>
          <a className="pv-open" href={project.url} target="_blank" rel="noreferrer">
            <span>{t.open}</span><ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" />
          </a>
          <button type="button" className="pv-icon pv-close" onClick={requestClose} aria-label={t.close}>
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={'pv-stage is-' + device} id="pv-stage" role="tabpanel" aria-labelledby={'pv-tab-' + project.id}>
        <div className="pv-viewport">
          <iframe
            key={project.id + '-' + reload}
            src={project.url}
            title={t.frame(project.title)}
            onLoad={() => setStatus('ready')}
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
          <div className={'pv-veil' + (status === 'loading' ? '' : ' is-gone')} aria-hidden="true">
            <img src={shotSrc(project, 800)} alt="" />
            <div className="pv-veil-note"><span className="pv-spinner" />{t.loading(project.domain)}</div>
          </div>
          <span key={'progress-' + project.id + '-' + reload} className={'pv-progress' + (status === 'ready' ? ' is-done' : '')} aria-hidden="true" />
          <p className="pv-sr" role="status">{status === 'ready' ? t.loaded(project.title) : ''}</p>
          {status === 'slow' && <div className="pv-slow" role="alert">
            <p>{t.slow}</p>
            <a href={project.url} target="_blank" rel="noreferrer">{t.newTab}<ArrowUpRight size={15} aria-hidden="true" /></a>
            <button type="button" onClick={() => setReload(value => value + 1)}>{t.retry}</button>
          </div>}
        </div>
      </div>
    </div>}
  </dialog>;
}
