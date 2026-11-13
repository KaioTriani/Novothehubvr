# Publicar na Hostinger

O site é estático: não precisa de Node, banco de dados nem build no servidor. Tudo o que está na raiz deste repositório vai para o `public_html`.

> O domínio thehubvr.com.br hoje usa o **Construtor de Sites** da Hostinger. Para publicar este site, ele precisa estar em um plano de **Hospedagem** (Web/Cloud). Se o domínio ainda estiver ligado ao Construtor, desconecte-o primeiro (hPanel → Sites → Construtor → Configurações) e adicione o domínio na hospedagem.

## Opção 1: importar pelo Git (recomendado)

1. No hPanel, abra **Sites → thehubvr.com.br → Avançado → Git**.
2. Faça **backup** do `public_html` atual, se houver algo nele, e esvazie a pasta (o deploy por Git exige a pasta de destino vazia).
3. Em **Criar um novo repositório**:
   - Repositório: `https://github.com/KaioTriani/thehubvr.git`
   - Branch: `main`
   - Diretório: deixe **em branco** (instala direto no `public_html`)
4. Clique em **Criar** e depois em **Implantar**.
5. Se o repositório for **privado**, a Hostinger mostra uma **chave SSH**: adicione-a no GitHub em *Settings → Deploy keys* do repositório e use a URL `git@github.com:KaioTriani/thehubvr.git`.
6. Opcional: ative a **Implantação automática** e cole o webhook em *Settings → Webhooks* do GitHub. A cada `git push` na `main` o site é atualizado sozinho.

## Opção 2: enviar o ZIP pelo Gerenciador de Arquivos

1. No GitHub, **Code → Download ZIP**.
2. Extraia no computador e compacte de novo **o conteúdo** da pasta (não a pasta), garantindo que `.htaccess` está junto.
3. hPanel → **Gerenciador de Arquivos** → `public_html` → envie o ZIP → botão direito → **Extrair**.
4. O resultado precisa ser `public_html/index.html`, `public_html/.htaccess`, `public_html/css/`, `public_html/js/`, `public_html/assets/`.

## Depois de publicar

- [ ] **Segurança → SSL**: certificado ativo (o `.htaccess` força HTTPS e `www`).
- [ ] Abrir https://www.thehubvr.com.br em aba anônima: a tela de carregamento com o minijogo aparece e depois as lentes se abrem.
- [ ] Testar um botão de WhatsApp no celular.
- [ ] https://www.thehubvr.com.br/agendar-experiencia redireciona para a seção de contato.
- [ ] Se aparecer a versão antiga: **Avançado → Cache → Limpar tudo**.
- [ ] Google Search Console: enviar `https://www.thehubvr.com.br/sitemap.xml`.
