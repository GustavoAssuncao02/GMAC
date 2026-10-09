# SEO da GMAC Metalúrgica

Endereço público confirmado: https://gmacmetalurgica.com.br/.
O endereço antigo do GitHub Pages redireciona para esse domínio.

## Implementação

- Título, descrição e conteúdo identificam a GMAC Metalúrgica, caldeiraria,
  usinagem, manutenção industrial e Feira de Santana, BA.
- URL canônica, compartilhamento e dados estruturados usam o domínio público.
- Dados estruturados descrevem os serviços, endereço e telefone já existentes
  no site, sem inventar avaliações, horários ou certificações.
- `public/sitemap.xml` lista apenas a página principal. As seções com `#` não
  são páginas independentes. `public/robots.txt` permite rastreamento e indica
  o sitemap. `public/CNAME` mantém o domínio já configurado no GitHub Pages.
- `npm run build` gera o HTML da mesma aplicação React com o conteúdo completo
  antes de executar JavaScript. Animações começam visíveis na renderização
  estática e retomam seu comportamento normal quando o aplicativo inicia.
- Na cópia `GMAC/`, a alternativa `/design2/` recebe `noindex, follow` para
  não competir com a página principal.

## Depois da publicação

1. Confirmar HTTP 200 no domínio, em `/robots.txt` e em `/sitemap.xml`.
2. No [Google Search Console](https://search.google.com/search-console),
   adicionar/verificar a propriedade `https://gmacmetalurgica.com.br/` com a
   conta responsável. A verificação exige o código ou registro fornecido pelo
   próprio Google; nenhum código de verificação foi inventado neste projeto.
3. Enviar `https://gmacmetalurgica.com.br/sitemap.xml` na seção Sitemaps.
4. Inspecionar a URL principal, testar a versão publicada e solicitar indexação.
5. No Perfil da Empresa no Google, conferir se o campo site aponta para esse
   mesmo domínio e se nome, endereço e telefone correspondem aos dados reais.

As alterações de código não equivalem a uma publicação ou a uma solicitação
de indexação. Não há garantia de posição ou prazo: isso depende do Google.

Referências:
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
