import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { DEFAULT_LANGUAGE, LANGUAGES, MESSAGES } from './locales.js';

const STORAGE_KEY = 'emerson-lang';
const LanguageContext = createContext(null);

/* Translated copy wraps differently, so sections above the reader can grow or shrink. Before a switch, the
   section on screen is noted with its offset; right after the new text is in the DOM (before paint and
   before any scroll-driven animation is rebuilt) the page is scrolled back so that section sits exactly
   where it was. Inside Nox's scene this keeps the same point of the scroll-driven take. */
let anchor = null;
const noteAnchor = () => {
  const sections = document.querySelectorAll('main section[id], main footer[id]');
  for (const section of sections) {
    const { top, bottom } = section.getBoundingClientRect();
    if (bottom > 0) { anchor = { section, top }; return; }
  }
  anchor = null;
};
const restoreAnchor = () => {
  if (!anchor) return;
  const shift = anchor.section.getBoundingClientRect().top - anchor.top;
  anchor = null;
  if (Math.abs(shift) >= 1) window.scrollBy({ top: shift, behavior: 'instant' });
};

/* index.html sets <html data-lang> before the first paint from the saved choice; read it back here. */
const initialLanguage = () => {
  const fromDocument = typeof document !== 'undefined' ? document.documentElement.dataset.lang : null;
  return LANGUAGES.includes(fromDocument) ? fromDocument : DEFAULT_LANGUAGE;
};

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLanguage);

  const setLang = useCallback(next => {
    if (!LANGUAGES.includes(next)) return;
    noteAnchor();
    setLangState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* private mode: the choice lasts for this visit */ }
  }, []);

  useLayoutEffect(restoreAnchor, [lang]);

  useEffect(() => {
    const { meta } = MESSAGES[lang];
    const root = document.documentElement;
    root.lang = meta.htmlLang;
    root.dataset.lang = lang;
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t: MESSAGES[lang] }), [lang, setLang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useI18n = () => useContext(LanguageContext);

/* Two short labels in the navigation dock; the active one is filled. Each button names its language
   in that language, so a reader who cannot read the current one still finds theirs. */
export function LanguageSwitch() {
  const { lang, setLang, t } = useI18n();
  return <div className="lang-switch" role="group" aria-label={t.language.group}>
    {LANGUAGES.map(code => <button key={code} type="button" lang={MESSAGES[code].meta.htmlLang}
      className={'lang-option' + (code === lang ? ' is-active' : '')} aria-pressed={code === lang}
      aria-label={t.language[code]} title={MESSAGES[code].language[code]} onClick={() => code !== lang && setLang(code)}>
      {code.toUpperCase()}
    </button>)}
  </div>;
}
