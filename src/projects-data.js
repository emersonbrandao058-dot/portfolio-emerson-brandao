import { assetUrl } from './asset-url.js';

/* Texts (type, sector, description, alt) live in src/locales.js, under projects.items[id]. */
export const PROJECTS = [
  {
    id: 'ultra-energy',
    title: 'Ultra Energy',
    technologies: ['HTML', 'CSS', 'JavaScript'],
    url: 'https://ultraenergy.vercel.app/',
    domain: 'ultraenergy.vercel.app',
    shot: 'ultraenergy-shot',
    width: 1351,
    height: 652,
  },
  {
    id: 'jj-style',
    title: 'JJ Style',
    technologies: ['HTML', 'CSS', 'Bootstrap'],
    url: 'https://jj-style.vercel.app/',
    domain: 'jj-style.vercel.app',
    shot: 'jjstyle-shot',
    width: 1351,
    height: 648,
  },
];

export const shotSrc = (project, size = 1351) => assetUrl(`/assets/${project.shot}-${size}.webp`);
