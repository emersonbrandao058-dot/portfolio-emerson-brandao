# Emerson Brandão — Portfólio

Código-fonte editável do portfólio em React + Vite: identidade escura em preto, branco e vermelho, hero com retrato, projetos com prévia navegável, serviços, apresentação interativa do Nox (GSAP + 188 frames), FAQ, contato e currículo PDF. Disponível em português (padrão) e inglês.

## Rodar no computador

Requisitos: Node.js 20.19 ou superior e npm.

```bash
npm ci
npm run dev
```

Abra o endereço mostrado no terminal, normalmente `http://localhost:5173`.

## Gerar o site para publicação

```bash
npm run build
npm run preview
```

A pasta `dist/` contém o site estático pronto. Na Vercel, use o preset **Vite**, comando `npm run build` e saída `dist`. Se conectar o repositório `portfolio`, selecione `emerson-portfolio` como diretório raiz do projeto. Netlify e Cloudflare Pages podem usar o mesmo comando e diretório de saída.

Para gerar uma versão para subpastas (por exemplo, GitHub Pages), ajuste a base:

```bash
npm run build -- --base=/portfolio/
```

Os caminhos das imagens e dos currículos respeitam a base configurada no Vite.

## Onde editar

- `src/locales.js`: **todos os textos**, em português (`pt`) e inglês (`en`). Ao editar um idioma, mantenha o outro em sincronia.
- `src/i18n.jsx`: idioma atual, preferência salva (`localStorage`) e seletor PT / EN do cabeçalho.
- `src/App.jsx`: estrutura da página, navegação e contato.
- `src/Hero.jsx`, `src/Projects.jsx`, `src/ProjectPreview.jsx`, `src/Services.jsx`, `src/About.jsx` (Nox), `src/StackCloud.jsx`, `src/Faq.jsx`: seções.
- `src/projects-data.js` e `src/services-data.js`: links, imagens e ids (sem texto).
- `src/base.css`: reset e tokens; `src/portfolio.css`: navegação e contato; `src/language-switch.css`: seletor de idioma; demais `*.css`: uma folha por seção.
- `public/assets/`: retrato, capturas dos projetos e frames do Nox.
- `public/curriculo-emerson-brandao.pdf`: currículo em português (o mesmo arquivo nos dois idiomas).

## Estado do conteúdo

- UltraEnergy e JJ Style apontam para os respectivos sites.
- Bacelar Educa permanece em desenvolvimento, com solicitação de apresentação pelo WhatsApp.
- LinkedIn e Instagram estão sem URL e ficam ocultos até preenchimento.
- O período do emprego e a previsão de conclusão do curso ainda precisam ser completados com dados confirmados no currículo.

## Origem

Exportado da versão `81b3b13f8fc22f9cca6d5da0b57add7b61b22eb5`, de 20/10/2026. As adaptações desta entrega são de empacotamento: build Vite independente e caminhos de arquivos compatíveis com subpastas. O layout, os textos e os efeitos foram mantidos.

O projeto não depende do ChatGPT Sites, de autenticação do ChatGPT ou de serviços de backend para funcionar.
