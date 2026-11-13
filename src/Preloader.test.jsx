import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Preloader, PRELOADER_DONE_EVENT, PRELOADER_TIMING, whenPreloaderDone } from './Preloader.jsx';

const { min, max, fade, lift, reducedFade } = PRELOADER_TIMING;
const EXIT = fade + lift;

const advance = ms => act(() => vi.advanceTimersByTimeAsync(ms));
const preloader = () => document.querySelector('.preloader');
const counter = () => document.querySelector('.preloader-count')?.textContent;
const isLocked = () => document.documentElement.classList.contains('is-preloading')
  && document.body.style.overflow === 'hidden';

function mockReducedMotion(reduce) {
  window.matchMedia = vi.fn(query => ({
    matches: reduce && query.includes('prefers-reduced-motion: reduce'),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
}

// <img> que só "carrega" quando o teste disparar o evento load.
function addPendingImage({ lazy = false } = {}) {
  const image = document.createElement('img');
  image.setAttribute('src', '/assets/pendente.webp');
  if (lazy) image.setAttribute('loading', 'lazy');
  Object.defineProperty(image, 'complete', { value: false });
  document.body.append(image);
  return image;
}

function listenDone() {
  const calls = [];
  const listener = () => calls.push({ preloaderInDom: Boolean(preloader()) });
  window.addEventListener(PRELOADER_DONE_EVENT, listener);
  return { calls, stop: () => window.removeEventListener(PRELOADER_DONE_EVENT, listener) };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
  mockReducedMotion(false);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue({ clearRect: vi.fn(), fillRect: vi.fn(), fillStyle: '' });
  document.body.style.overflow = '';
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  document.documentElement.classList.remove('is-preloading');
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Preloader', () => {
  it('trava o scroll ao montar e restaura o overflow anterior ao terminar', async () => {
    document.body.style.overflow = 'auto';
    render(<Preloader />);
    expect(isLocked()).toBe(true);

    await advance(max + EXIT);

    expect(document.documentElement.classList.contains('is-preloading')).toBe(false);
    expect(document.body.style.overflow).toBe('auto');
    expect(preloader()).toBeNull();
  });

  it('dispara "preloader:done" uma única vez, já desmontado e com o scroll liberado', async () => {
    const done = listenDone();
    render(<Preloader />);

    await advance(min);
    expect(done.calls).toHaveLength(0);

    await advance(max + EXIT);
    expect(done.calls).toEqual([{ preloaderInDom: false }]);
    expect(isLocked()).toBe(false);
    done.stop();
  });

  it('segura no máximo 96% enquanto o tempo mínimo não passou, mesmo com tudo carregado', async () => {
    render(<Preloader />);

    await advance(min - 1);
    expect(counter()).toBe('96%');
    expect(preloader().classList.contains('is-leaving')).toBe(false);

    await advance(600);
    expect(preloader().classList.contains('is-leaving')).toBe(true);
  });

  it('avança o progresso conforme cada asset carrega', async () => {
    const [first, second] = [addPendingImage(), addPendingImage()];
    render(<Preloader />);

    await advance(300);
    expect(counter()).toBe('0%');

    first.dispatchEvent(new Event('load'));
    await advance(600);
    expect(counter()).toBe('48%');

    second.dispatchEvent(new Event('error')); // erro conta como "resolvido", não trava
    await advance(600);
    expect(['96%', '100%']).toContain(counter());
  });

  it('respeita a trava máxima: sai em 2,5s mesmo com uma imagem que nunca carrega', async () => {
    addPendingImage();
    const done = listenDone();
    render(<Preloader />);

    await advance(max - 1);
    expect(preloader().classList.contains('is-leaving')).toBe(false);
    expect(isLocked()).toBe(true);

    await advance(1);
    expect(preloader().classList.contains('is-leaving')).toBe(true);
    expect(counter()).toBe('100%');

    await advance(fade);
    expect(preloader().classList.contains('is-lifting')).toBe(true);

    await advance(lift);
    expect(preloader()).toBeNull();
    expect(done.calls).toHaveLength(1);
    expect(isLocked()).toBe(false);
    done.stop();
  });

  it('ignora imagens lazy, que não carregariam com o scroll travado', async () => {
    addPendingImage({ lazy: true });
    const done = listenDone();
    render(<Preloader />);

    await advance(max - 1);
    expect(done.calls).toHaveLength(1);
    done.stop();
  });

  it('com prefers-reduced-motion mostra só contador e barra e sai com fade simples', async () => {
    mockReducedMotion(true);
    addPendingImage(); // segura até a trava máxima para medir a saída
    const done = listenDone();
    render(<Preloader />);

    expect(document.querySelector('canvas')).toBeNull();
    expect(document.querySelector('.preloader-obstacle')).toBeNull();
    expect(document.querySelector('.preloader-count')).not.toBeNull();
    expect(document.querySelector('.preloader-bar')).not.toBeNull();

    await advance(max + fade);
    expect(preloader().classList.contains('is-leaving')).toBe(true);
    expect(preloader().classList.contains('is-lifting')).toBe(false); // sem cortina
    await advance(reducedFade - fade);
    expect(preloader()).toBeNull();
    expect(done.calls).toHaveLength(1);
    done.stop();
  });

  // Regressão: com o pulo só por tempo, o boneco às vezes ficava no chão em cima do
  // primeiro obstáculo (progresso rápido ou parado perto dele). Testa em desktop e mobile.
  it.each([1280, 375])('o boneco nunca encosta num obstáculo enquanto está no chão (%ipx)', async width => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(width);
    const images = [addPendingImage(), addPendingImage(), addPendingImage(), addPendingImage()];
    render(<Preloader />);
    const runner = document.querySelector('.preloader-runner');
    const obstacleCenters = [0.28, 0.55, 0.8].map(at => at * (width - 32) + 16);
    let maxHeight = 0;
    let lastX = 0;

    const sample = async ms => {
      for (let elapsed = 0; elapsed < ms; elapsed += 16) {
        await advance(16);
        if (!runner.isConnected) return;
        const [, x, y] = runner.style.transform.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/).map(Number);
        maxHeight = Math.max(maxHeight, -y);
        expect(x).toBeGreaterThanOrEqual(lastX - 0.001); // só anda para frente
        lastX = x;
        if (y === 0) {
          for (const center of obstacleCenters) expect(Math.abs(x + 16 - center)).toBeGreaterThanOrEqual(20);
        }
      }
    };

    // Progresso parando perto dos obstáculos: 24%, 48%, 72%, 96%.
    for (const image of images) {
      image.dispatchEvent(new Event('load'));
      await sample(200);
    }
    await sample(max);
    expect(maxHeight).toBeGreaterThan(40);
    expect(maxHeight).toBeLessThanOrEqual(46);
  });

  // O boneco era desenhado num effect que só rodava depois da montagem do site inteiro: o primeiro
  // paint mostrava o canvas vazio e ele só aparecia depois do primeiro travamento.
  it('desenha o boneco já no primeiro paint (layout effect)', () => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    render(<Preloader />, { legacyRoot: false });
    const context = getContext.mock.results[0].value;
    expect(context.fillRect).toHaveBeenCalled();
  });

  it('marca o preloader como aria-hidden', () => {
    render(<Preloader />);
    expect(preloader().getAttribute('aria-hidden')).toBe('true');
  });
});

describe('whenPreloaderDone', () => {
  it('chama na hora quando não há preloader ativo', () => {
    const callback = vi.fn();
    whenPreloaderDone(callback);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('espera o evento enquanto o preloader está na tela', async () => {
    const callback = vi.fn();
    render(<Preloader />);
    whenPreloaderDone(callback);
    expect(callback).not.toHaveBeenCalled();

    await advance(max + EXIT);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
