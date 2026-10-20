# Emerson Brandão — Portfólio

Código-fonte editável do portfólio em React + Vite. Inclui os temas dark/light, retrato, três projetos, terminal animado, stack em loop, contatos e currículo PDF.

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

- `src/App.jsx`: textos, projetos, navegação, experiência e contato.
- `src/portfolio.css`: composição e responsividade.
- `src/theme.css`: cores e tokens do tema escuro.
- `src/magic-effects.css`: terminal e tema claro.
- `src/SocialButtons.jsx`: redes sociais (somente links preenchidos aparecem).
- `src/TechStack.jsx`: tecnologias exibidas no loop.
- `src/components/magicui/`: terminal e botão de tema.
- `public/assets/`: retrato e capas dos projetos.
- `public/curriculo.html` e `public/curriculo-emerson-brandao.pdf`: currículo.

O PDF já está incluído e não precisa de Python para executar o site. Se alterar o currículo HTML, o script opcional `scripts/generate-resume.py` permite recriar o PDF com Python, ReportLab e fontes DejaVu Sans instaladas.

## Estado do conteúdo

- UltraEnergy e JJ Style apontam para os respectivos sites.
- Bacelar Educa permanece em desenvolvimento, com solicitação de apresentação por e-mail.
- LinkedIn e Instagram estão sem URL e ficam ocultos até preenchimento.
- O período do emprego e a previsão de conclusão do curso ainda precisam ser completados com dados confirmados no currículo.

## Componentes de terceiros

As licenças dos componentes React Bits e Magic UI estão preservadas junto aos respectivos componentes. Consulte `docs/third-party-notices.md` antes de redistribuir.

## Origem

Exportado da versão `81b3b13f8fc22f9cca6d5da0b57add7b61b22eb5`, de 20/10/2026. As adaptações desta entrega são de empacotamento: build Vite independente e caminhos de arquivos compatíveis com subpastas. O layout, os textos e os efeitos foram mantidos.

O projeto não depende do ChatGPT Sites, de autenticação do ChatGPT ou de serviços de backend para funcionar.
