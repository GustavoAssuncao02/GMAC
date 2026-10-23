# SEO da GMAC Metalúrgica

Endereço público confirmado: https://gmacmetalurgica.com.br/.
O endereço antigo do GitHub Pages redireciona para esse domínio, assim como
`http://` e `www.`.

## Implementação

- Título, descrição e conteúdo identificam a GMAC Metalúrgica, caldeiraria,
  usinagem, manutenção industrial e Feira de Santana, BA. A descrição também
  cita tornearia, solda e corte a laser (ver "Palavras-chave").
- URL canônica, compartilhamento e dados estruturados usam o domínio público.
  A imagem de compartilhamento (`assets/og-gmac-metalurgica.jpg`, 1200×630)
  é um recorte da foto real do topo do site.
- Dados estruturados (`@graph` em `index.html`) descrevem a empresa, o site e
  a página: serviços, endereço, telefone, horário, fotos reais, razão social,
  CNPJ e data de abertura, sem inventar avaliações, preços ou certificações.
  Endereço, CEP e horário (seg. a qui. 07:30–17:30, sex. 07:30–16:30) foram
  copiados do Perfil da Empresa no Google em 10/10/2026; se mudarem lá,
  atualize `index.html` e `businessHours` em `src/App.tsx`. Razão social, CNPJ
  e abertura (28/05/2008) vêm do cadastro público da Receita Federal.
- `public/sitemap.xml` lista a página principal com suas fotos reais e as
  páginas legais, com a data da última alteração (`lastmod`). Atualize essa
  data quando o conteúdo mudar. As seções com `#` não são páginas
  independentes. `public/robots.txt` permite rastreamento e indica o sitemap.
  `public/CNAME` mantém o domínio já configurado no GitHub Pages.
- As fotos têm texto alternativo que descreve o que aparece nelas; na galeria,
  ele complementa a legenda visível em vez de repeti-la.
- `npm run build` gera o HTML da mesma aplicação React com o conteúdo completo
  antes de executar JavaScript e pré-carrega a fonte Inter usada na primeira
  pintura. Animações começam visíveis na renderização estática e retomam seu
  comportamento normal quando o aplicativo inicia.
- Na cópia `GMAC/`, a alternativa `/design2/` recebe `noindex, follow` para
  não competir com a página principal.

## Desempenho

A cena 3D da transformação do aço compila shaders que travavam o celular por
cerca de 5 s na abertura da página. Ela agora começa a carregar na primeira
interação do visitante (rolar, tocar, clicar ou teclar) ou quando parte da
seção aparece na tela; quem rola até ela vê a mesma animação. Os logos de
clientes usam WebP no tamanho de exibição e o logo do cabeçalho tem uma versão
de 192 px.

Lighthouse 12 no build local, 22/10/2026 (antes → depois):

| | Celular | Desktop |
|---|---|---|
| Desempenho | 47–49 → 87–90 | 73–76 → 100 |
| Bloqueio da thread (TBT) | 1,9–2,4 s → 0,02–0,11 s | 0,5–0,6 s → 0 |
| Acessibilidade | 97 → 100 | 100 → 100 |

O LCP no celular (≈3,6 s) é o título do topo: o React recria a página ao
iniciar e o título reaparece com a animação de entrada. Reduzir isso exigiria
mudar a animação ou hidratar o HTML estático, com risco de o título piscar.

## Palavras-chave

Pesquisa feita em 22/10/2026 no autocompletar do Google (a mesma fonte do
Answer the Public). Buscas locais com volume: "metalúrgica feira de santana",
"usinagem feira de santana", "caldeiraria feira de santana", "tornearia feira
de santana", "solda feira de santana" (inclusive inox e alumínio), "corte a
laser feira de santana" e "manutenção industrial feira de santana", além das
variações "perto de mim", decididas pelo Perfil da Empresa no Google. Na busca
orgânica quase não há sites de empresas locais para esses termos, só
diretórios; é a oportunidade mais rápida.

"Tornearia" aparece bastante nas buscas e não está no texto visível do site;
hoje está só na descrição, nos dados estruturados e nos textos alternativos.

Google Trends, Planejador de palavras-chave, Search Console e Ubersuggest
exigem login ou bloqueiam acesso automatizado e não foram consultados.

## Depois da publicação

1. Confirmar HTTP 200 no domínio, em `/robots.txt` e em `/sitemap.xml`.
2. No [Google Search Console](https://search.google.com/search-console),
   adicionar/verificar a propriedade `https://gmacmetalurgica.com.br/` com a
   conta responsável. A verificação exige o código ou registro fornecido pelo
   próprio Google; nenhum código de verificação foi inventado neste projeto.
3. Enviar `https://gmacmetalurgica.com.br/sitemap.xml` na seção Sitemaps.
4. Inspecionar a URL principal, testar a versão publicada e solicitar indexação.
   Conferir os dados estruturados no
   [Teste de pesquisa aprimorada](https://search.google.com/test/rich-results).
5. No Perfil da Empresa no Google, conferir se o campo site aponta para esse
   mesmo domínio e se nome, endereço e telefone correspondem aos dados reais.
   Incluir categorias e serviços com os termos acima (usinagem, tornearia,
   caldeiraria, solda, corte a laser), publicar fotos da oficina e pedir
   avaliações a clientes: é o que decide as buscas "perto de mim".

As alterações de código não equivalem a uma publicação ou a uma solicitação
de indexação. Não há garantia de posição ou prazo: isso depende do Google.

Validação: `node scripts/verify-seo.mjs <playwright/index.mjs> <url do build>`.

Referências:
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/appearance/structured-data/local-business
