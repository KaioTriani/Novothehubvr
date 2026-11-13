# The Hub VR · site oficial

Site de [thehubvr.com.br](https://www.thehubvr.com.br): arena de realidade virtual em João Pessoa, PB, com Meta Quest 3 e Meta Quest 3S, agora no Shopping Tambiá e em eventos.

Site 100% estático (HTML, CSS e JavaScript próprios, sem build e sem dependências). Os arquivos já estão prontos na raiz do repositório para irem direto para o `public_html`.

## Estrutura

```
index.html            página principal (conteúdo, SEO e dados estruturados)
404.html              página de erro
.htaccess             HTTPS + www, cache, compressão, redirecionamentos do site antigo
robots.txt            regras para buscadores
sitemap.xml           mapa do site para o Google
manifest.webmanifest  ícones e cores do app
css/main.css          visual
js/loader.js          tela de carregamento com minijogo
js/main.js            interações (menu, filtros de jogos, trailers, mapa, WhatsApp)
assets/img/           fotos e ícones (WebP otimizado)
assets/fonts/         fontes hospedadas no próprio site
```

## Publicar na Hostinger

Veja o passo a passo em [HOSTINGER.md](HOSTINGER.md).

## Rodar no computador

Qualquer servidor estático serve. Com Node instalado:

```bash
npx serve .
```

## Onde editar

- Textos, unidades, jogos e perguntas frequentes: `index.html`
- Número do WhatsApp: procure `5583993035168` em `index.html` e `js/main.js`
- Cores, fontes e espaçamentos: variáveis no início de `css/main.css`

Desenvolvido por [ZionHub](https://www.zionhb.com.br).
