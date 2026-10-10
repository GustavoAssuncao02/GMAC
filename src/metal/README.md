# Animação de fabricação

Inserida entre `Hero` e `About` no `App.tsx`, em uma seção de uma tela.
Arraste horizontal com mouse ou toque avança ou volta uma etapa (`steps.ts`).
As setas visíveis permitem pular operações em andamento e os botões numerados
acessam diretamente cada etapa. Com foco na seção, use as teclas esquerda/direita.
A rolagem vertical permanece livre e não altera a animação. Os controles de
anterior/próxima ficam desabilitados nos respectivos limites.
Quando mais da metade da seção está visível, a sequência avança sozinha uma
vez, etapa por etapa, até a peça final. Qualquer interação (arraste, setas,
teclado ou botões de etapa) encerra a reprodução automática; fora da tela ela
pausa. Não há reprodução automática com redução de movimento.
Validação da navegação: `node scripts/verify-metal-horizontal.mjs <playwright/index.mjs>`.

`storyboard.json` contém os 80 targets do `STORYBOARD_80.json` fornecido no
ZIP V3. Apenas metadados descritivos, referências a imagens e deltas redundantes
foram removidos por `scripts/import-metal-storyboard.mjs`. Os JPGs do ZIP não
são carregados pelo site. `timeline.ts` interpola targets adjacentes com easing
e caminho angular curto.

`mandrel.ts` constrói o mandril, ferramentas e transformações em Three.js.
`scene.ts` cuida do enquadramento, iluminação de estúdio, efeitos e sombras.
A geometria e os materiais são uma interpretação 3D das referências, não uma
reprodução fotográfica. O módulo 3D carrega apenas ao se aproximar da seção.
As transições comuns duram 620 ms; operações duram entre 2,4 e 4,2 s,
com movimento próprio de ferramenta/peça, e depois param. Clicar novamente
na etapa reproduz a operação. Os textos ficam estáveis e somente
um bloco é mostrado por etapa. O material usa mapas de cor, rugosidade e relevo
de aço escovado. O polimento mistura progressivamente os mapas 1K fornecidos
em `Poliigon_MetalSteelBrushed_7174.zip`, convertidos para WebP em `public/assets/steel`.
Faíscas recebem bloom e luz local sem desfocar o conjunto.
Em redução de movimento, fica no estado final
com altura normal. Sem WebGL, há uma composição SVG estática e CTA funcional.

A matéria-prima para no frame 8. A revisão do mandril segue a foto fornecida
em 18/09/2026: corpo circular elevado, abertura com guias internas e duas abas.
A sequência é ilustrativa, sem inferir medidas de fabricação da foto.

- Corte: laser contorna o quadrado, remove sobras e deixa centro e laterais separados, com pequenas dobras nas abas.
- Dobra: ferramentas corrigem o desalinhamento e ajustam as bordas, mantendo as partes separadas.
- Solda: laterais se aproximam do centro e a tocha percorre as duas junções, deixando cordões de solda.
- Usinagem: broca abre quatro furos sequenciais; as abas usam geometria sólida até cada furação.
- Acabamento: a politriz gira o disco sobre o anel e as duas abas, levantando entre superfícies. O polimento reduz rugosidade e marcas, mantendo cinza aço e reflexos metálicos sem embranquecer o material.
- Montagem: quatro parafusos com arruelas descem girando sobre as mesmas coordenadas dos furos.
- Qualidade: checklist de seis detalhes no painel lateral, com traçado progressivo do check. A sequência dura 3,8 s e reinicia ao clicar novamente na etapa.

Ferramentas e geometrias compartilham o espaço local da peça. As variantes dos
furos são criadas uma única vez, e a cena deixa de renderizar ao concluir cada operação.

A passagem de Qualidade para Peça final dura 1,6 s: aproximação, ampliação e
rotação suave para uma vista de três quartos. `presentationStateAt` preserva
os targets da apresentação; a cena enquadra o mandril de acordo com a tela.
A sombra de contato acompanha a composição. `scripts/verify-metal-landing.mjs`
verifica a aproximação, a rotação e o contato no desktop/mobile.

Em desenvolvimento:

```js
window.__METALURGICA_SCROLL__.setProgress(39 / 79)
window.__METALURGICA_SCROLL__.setStepPhase(3, 0.5) // dobra, metade da operação
window.__METALURGICA_SCROLL__.getState()
window.__METALURGICA_SCROLL__.clearOverride()
```

Validação com servidor local na porta 5173:

```sh
npm run build
node scripts/verify-metal-steps.mjs /caminho/para/playwright/index.mjs
node scripts/verify-mandrel.mjs /caminho/para/playwright/index.mjs
node scripts/verify-finish-quality.mjs /caminho/para/playwright/index.mjs
```

O verificador de etapas usa Edge, confere roda para frente/trás, navegação direta,
matéria-prima isolada, progressão de corte/dobra/montagem, texto único,
bloom da solda, retorno à nitidez, saída da seção,
mobile e reduced motion. Salva capturas em `artifacts/metal-steps`.
O script complementar `verify-metal-scroll.mjs` confere os 80 targets do modo
de depuração, sticky, congelamento após a transição, CTA e reduced motion.
`verify-mandrel.mjs` verifica a continuidade entre operações, o instante de abertura
de cada furo, a instalação dos parafusos, retorno para etapas anteriores, repouso,
ausência de erros no navegador e capturas a 1440, 1024, 390 e 360 px.
`verify-finish-quality.mjs` confere o trajeto da politriz, sincronização do checklist
com a peça, repetição, saída da etapa, repouso e layout em telas menores.

A renderização usa tempo real na taxa da tela e MSAA nativo. O brilho da solda
usa bloom HDR seletivo no arco e nas faíscas, respeitando a profundidade,
ativo só enquanto há metal incandescente. A sombra de contato
também é pré-calculada. Partes rígidas são agrupadas por material, e o cordão usa
instâncias da mesma geometria. Textos e navegação são atualizados ao trocar a etapa.
Não renderiza continuamente em repouso, fora da seção ou em aba oculta.
A preparação compila e desenha as ferramentas antes da primeira operação.
O checklist fica apenas no painel, sem sinais verdes sobre o mandril.

`verify-metal-revision.mjs` verifica pulo de operações, entrada e saída da peça final,
CTA durante a animação, 60 fps, repouso, contato da prensa antes da dobra, fotos reais
e gestos de toque/CTA no celular. `profile-metal-transition.mjs` registra os intervalos
da interface durante a primeira transição para o corte.

## Efeito visual da solda

`weldingEffects.ts` cuida da camada visual da solda: arco azul/branco com
cintilação, poça incandescente, faíscas, respingos, fumaça e um pico de brilho
na ignição. O módulo consulta `sampleWeldContact` e `weldWindows` (`mandrel.ts`).

A tocha desce até o primeiro cordão, percorre cada passe em velocidade constante
(acelera e freia só nas pontas), troca de lado em um arco sobre o colar e sobe
ao terminar. O cordão cresce continuamente e o metal recém-depositado esfria
de branco para laranja e vermelho escuro (`hotSeam`).

As faíscas são simuladas a partir do instante de emissão, com gravidade,
arrasto e quique na chapa e no colar. A cor segue uma rampa de corpo negro e
perde calor a cada impacto. Elas são desenhadas como cápsulas com motion blur,
na direção da velocidade em tela (`sparks.ts`, compartilhado com o laser). Os respingos grudam na chapa e esfriam.
A reprodução e o retorno entre fases continuam determinísticos.

`bloom.ts` aplica um bloom HDR seletivo. Só os objetos na camada `BLOOM_LAYER`
(faíscas, arco, cordão quente, feixe, sangria quente e faíscas do laser) brilham, e a peça os oculta
corretamente. O passe roda em meia resolução com uma cadeia de mips e só
quando há algo incandescente na tela. A fumaça fica na `PLAIN_LAYER`.

Os ajustes ficam em `weldingVisuals`: intensidade do arco e do bloom,
quantidade, velocidade, largura e vida das faíscas e respingos, gravidade,
arrasto, obturador (comprimento do rastro), fumaça e profundidade de campo.

A renderização acompanha a taxa de atualização da tela (60/120/144 Hz).
Laser e tocha entram e saem com movimento, e a broca desliza entre os furos.

`verify-welding-effects.mjs` verifica ignição, bloom, troca de passe, resíduos,
retorno determinístico, repouso, mobile, reduced motion e FPS durante a operação.

## Efeito visual do corte a laser

`laserEffects.ts` segue a mesma abordagem da solda, consultando `sampleCutContact`
e `cutWindows` (`mandrel.ts`). O percurso tem quatro contornos (perfil, furo central
e as duas linhas das abas). Em cada um, o feixe perfura com um clarão curto e depois
corta com cintilação; entre contornos ele apaga enquanto o bico salta.

No ponto de corte há núcleo branco-amarelado, halo quente, reflexo anamórfico,
poça incandescente e luz local. As faíscas saem da sangria para cima e para trás
do bico, se espalham em todas as direções na perfuração, quicam e deslizam na chapa
e caem livres além da borda. As gotas de borra grudam na chapa e esfriam. Depois que
o centro e a moldura caem, as faíscas deixam de quicar onde não há mais chapa.

A sangria é uma faixa sobre o percurso que termina exatamente sob o bico: um sulco
escuro e, por cima, uma camada aditiva que sai branca, passa a laranja e vermelho e
apaga em poucos décimos de segundo. Os ajustes ficam em `laserVisuals`.

`verify-laser-effects.mjs` verifica perfuração, bloom, faíscas, feixe apagado entre
contornos, resíduos, retorno determinístico, repouso, mobile, reduced motion e FPS.
