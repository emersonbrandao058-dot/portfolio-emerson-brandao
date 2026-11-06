import gsap from 'gsap';

/* A lede comes into focus word by word. Each word holds a layer of its own only while it animates:
   without one, ~25 blurs repainted on the main thread at once were the costliest moment of an opening. */
export function focusWords(words, scrollTrigger) {
  return gsap.from(words, {
    opacity: 0, filter: 'blur(8px)', y: 8, duration: .8, stagger: .018, ease: 'power2.out', delay: .32,
    scrollTrigger,
    onStart: () => gsap.set(words, { willChange: 'transform, opacity, filter' }),
    onComplete: () => gsap.set(words, { clearProps: 'willChange,filter' }),
  });
}

/* Scroll-linked moves catch up with the scroll in this long: enough to smooth a wheel's steps,
   short enough that nothing keeps drifting once the reader stops. */
export const FOLLOW = .3;
