const WHATSAPP = 'https://wa.me/5575999312633';

/* Each service speaks to the client's outcome first, then to what is delivered.
   Its texts live in src/locales.js, under services.items[id]. */
export const SERVICE_IDS = ['sites-institucionais', 'landing-pages', 'sistemas-web'];

export const whatsappUrl = message => `${WHATSAPP}?text=${encodeURIComponent(message)}`;
