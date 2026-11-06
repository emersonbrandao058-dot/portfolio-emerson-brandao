import { useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { useI18n } from './i18n.jsx';

/* Answers (src/locales.js) describe how the work is arranged, never fixed prices, deadlines or support terms:
   those are agreed per project, in the proposal. */
const pad = number => String(number).padStart(2, '0');

/* Between Nox and the contact: the same black, one question open at a time. */
export function Faq() {
  const { t } = useI18n();
  const [open, setOpen] = useState(null);

  return <section className="fq" id="faq" aria-labelledby="fq-title">
    <div className="fq-wrap">
      <header className="fq-head" data-reveal>
        <p className="fq-kicker fq-mono">{t.faq.kicker}</p>
        <h2 className="fq-title" id="fq-title">{t.faq.title[0]}<span className="fq-accent">{t.faq.title[1]}</span></h2>
        <p className="fq-lede">{t.faq.lede}</p>
      </header>

      <ul className="fq-list">
        {t.faq.questions.map(([q, a], index) => {
          const isOpen = open === index;
          const id = 'fq-' + (index + 1);
          return <li key={id} className={'fq-item' + (isOpen ? ' is-open' : '')} data-reveal>
            <h3 className="fq-q">
              <button type="button" className="fq-trigger" id={id + '-trigger'} aria-expanded={isOpen} aria-controls={id + '-panel'}
                onClick={() => setOpen(isOpen ? null : index)}>
                <span className="fq-num fq-mono" aria-hidden="true">{pad(index + 1)}</span>
                <span className="fq-text">{q}</span>
                <span className="fq-icon" aria-hidden="true"><i /><i /></span>
              </button>
            </h3>
            <div className="fq-panel" id={id + '-panel'} role="region" aria-labelledby={id + '-trigger'}>
              <div className="fq-panel-in"><p>{a}</p></div>
            </div>
          </li>;
        })}
      </ul>

      <div className="fq-close" data-reveal>
        <p>{t.faq.closeTitle}</p>
        <a className="fq-link" href="#contato"><span>{t.faq.closeLink}</span><ArrowDown size={18} strokeWidth={1.8} aria-hidden="true" /></a>
      </div>
    </div>
  </section>;
}
