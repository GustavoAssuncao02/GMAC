# Revisão do site GMAC — 11/10/2026

Esta é uma revisão técnica orientada pela legislação brasileira. Não certifica conformidade jurídica integral da empresa. O texto publicado deve corresponder à operação real, inclusive ao que ocorre fora do frontend.

## Dados confirmados pelo responsável

- Nome utilizado no site: GMAC Metalúrgica.
- Endereço: Av. Banco do Nordeste, 35 — CIS, Feira de Santana — BA, 44010-665.
- Canal autorizado para direitos de privacidade: telefone/WhatsApp (75) 3616-6626.
- Prazo informado para pedidos que não resultem em contratação: 30 dias. O texto conta esse prazo do recebimento da solicitação.
- Razão social completa e CNPJ: não localizados no site nem informados nesta revisão. Não foram preenchidos com dados presumidos.
- Acesso individual às mensagens, configuração da caixa postal, fornecedores atuais e uso posterior para marketing: não confirmados pelo responsável. As regras propostas limitam o uso ao atendimento do pedido e não autorizam publicidade genericamente.

## Constatações da versão pública antes da alteração

Inspeção de https://gmacmetalurgica.com.br/ em navegador Chrome, sem conta do visitante:

- O formulário coletava contato e informações técnicas, com anexos, sem aviso de privacidade ou links para documentos legais.
- O texto existente dizia apenas “Seus dados estão seguros conosco”. Essa frase não informa o tratamento e não constitui prova de segurança.
- O rodapé não mostrava CNPJ nem identificação jurídica completa.
- Ao chegar à seção de contato, o mapa gerava conexões com Google, Google Maps e seus serviços de fontes, sem uma escolha prévia do visitante.
- Não foram observados cookies, chaves de localStorage ou sessionStorage nesse perfil. Isso não prova ausência de cookies em todos os navegadores e integrações futuras.
- O carrossel iniciava automaticamente e não oferecia um controle permanente de pausa.

A evidência técnica local desta inspeção está em `artifacts/public-privacy-before.json` (ignorado pelo Git, sem valores de cookies nem conteúdo de formulários).

## Alterações preparadas

- Aviso junto ao envio, com Política de Privacidade e Regras da Solicitação, sem impor consentimento genérico ou aceite de marketing.
- Documentos em HTML acessíveis sem JavaScript, com dados coletados, finalidades, destinatários por categoria, retenção, direitos e contatos.
- Retenção de até 30 dias para solicitações sem contratação; documentos contratuais e obrigações legais são tratados separadamente.
- Google Maps carregado apenas após ação expressa do visitante, com informação sobre o serviço externo; o endereço permanece disponível em texto.
- Mensagens de erro do formulário associadas aos campos. O carrossel mantém rotação automática; o botão de pausa foi removido conforme solicitado pelo responsável.
- Links legais no rodapé e página de informações de acessibilidade. A existência dessa página não equivale a certificação de acessibilidade.
- Os mesmos avisos e mapa sob escolha foram aplicados ao componente da proposta `/design2`.

## Pendências efetivas

| Tema | O que falta confirmar ou executar | Referência |
| --- | --- | --- |
| Identificação | Informar razão social e CNPJ corretos, sem confundir com o CNPJ de quem pede orçamento. Publicar identificação do controlador e fornecedor conforme o contexto. | LGPD, art. 9º; Decreto 7.962/2013, art. 2º, quando aplicável à oferta/contratação de consumo por meio eletrônico. |
| Retenção real | Aplicar o descarte de mensagens, anexos e cópias do atendimento, não apenas escrever “30 dias”. A caixa de e-mail não é gerida por este frontend. | LGPD, arts. 6º, 15 e 16. |
| Acesso | Definir quem da GMAC pode acessar pedidos, restringir permissões e proteger as contas que recebem os e-mails. | LGPD, art. 46. |
| Bases legais | Registrar finalidade e base para cada operação. Em contatos B2B, verificar e documentar o legítimo interesse referente ao representante; não usar art. 7º, V automaticamente quando o titular não é parte do contrato. | LGPD, arts. 7º, 10 e 37. |
| Fornecedores | Confirmar o serviço de API em produção, os provedores de e-mail/hospedagem, seus contratos, acesso, retenção, subcontratação e eventuais transferências internacionais. A fonte local do backend não comprova a configuração em produção. | LGPD, arts. 9º, 33, 37 e 39; regulamentação ANPD sobre transferências. |
| Direitos | Manter um processo real de recebimento, verificação proporcional de identidade e resposta a acesso/correção/exclusão pelo canal aprovado. Identificar encarregado se exigido. A dispensa para pequeno porte depende de enquadramento na regulamentação e não elimina o canal. | LGPD, arts. 18, 19 e 41; Resolução CD/ANPD 2/2022. |
| Segurança e incidentes | Verificar infraestrutura e caixa postal reais, controle de acesso, descarte, atualização dos serviços e procedimento de resposta/comunicação de incidentes. Validação de extensão de arquivo não substitui análise de conteúdo malicioso. | LGPD, arts. 46 e 48; Resolução CD/ANPD 15/2024. |
| Acessibilidade | Fazer avaliação completa de contraste, teclado, zoom, leitor de tela, mensagens, conteúdo animado e alternativas. Os ajustes realizados atendem pontos específicos, não toda a LBI/WCAG. | Lei 13.146/2015, art. 63; WCAG 2.2. |
| Imagens e marcas | Confirmar autorização ou fundamento para fotos de pessoas, imagens, projetos e marcas de clientes. A revisão do código não verifica contratos ou autorizações. | Código Civil, art. 20; legislação autoral e marcária conforme o material. |
| Regras comerciais | Se houver venda/contratação pela internet, incluir informações comerciais e atendimento exigidos para esse fluxo. O formulário atual inicia orçamento; não foi identificado checkout ou cobrança online. | CDC e Decreto 7.962/2013, conforme sua aplicação ao caso. |
| Registros de acesso | Avaliar com a hospedagem/API a obrigação de guarda de registros de acesso prevista no Marco Civil. Não aplicar o prazo dos orçamentos indistintamente a registros técnicos sujeitos a outra obrigação. | Lei 12.965/2014, art. 15. |

## Procedimento para cumprir os 30 dias

1. Registrar a data de recebimento e identificar pedidos que resultaram em contratação.
2. Revisar diariamente solicitações sem contratação que completarem 30 dias.
3. Confirmar se existe obrigação legal concreta que justifique conservar informação específica.
4. Eliminar as mensagens e anexos correspondentes, incluindo cópias de trabalho e exportações sob controle da GMAC; verificar também lixeira, arquivos, retenção administrativa e backups com o administrador do e-mail.
5. Registrar o descarte sem conservar desnecessariamente o conteúdo original ou os dados pessoais que deveriam ser eliminados.
6. Se uma obrigação específica impedir a exclusão de determinada informação, documentar o motivo, a informação conservada e seu prazo, mantendo os demais dados limitados ao necessário.

Não foi implementada exclusão automática de e-mails nem executada exclusão de dados nesta tarefa.

## Observação sobre o formulário e a API

O frontend atual torna empresa, CNPJ e serviço opcionais. A cópia local de `GMAC BACKEND/src/app.js` ainda exige esses campos, e `toQuotePayload()` preenche ausências com marcadores, incluindo `00.000.000/0000-00` para CNPJ. Esse marcador não é um CNPJ fornecido pelo solicitante e não deve ser apresentado como identificação cadastral válida. Recomenda-se alinhar os campos opcionais com a API real, sem depender de valores cadastrais fictícios. Não houve envio real de mensagem nesta revisão nem validação do código instalado no servidor; não foi estabelecida entrega de e-mail em produção.

## Fontes oficiais consultadas

- [LGPD — texto compilado](https://planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm).
- [Direitos dos titulares — ANPD](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares).
- [Resolução CD/ANPD 2/2022 — agentes de pequeno porte](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022).
- [Guia de cookies — ANPD](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_cookies_e_protecao_de_dados_pessoais).
- [Resolução CD/ANPD 19/2024 — transferências internacionais](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024).
- [Decreto 7.962/2013](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm).
- [Lei Brasileira de Inclusão](https://planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm).
- [Marco Civil da Internet](https://planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm).
- [Código Civil — proteção da imagem](https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm).
- [Lei de Direitos Autorais](https://www.planalto.gov.br/ccivil_03/leis/l9610.htm).
- [WCAG — pausar, parar, ocultar](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).
- [Dados de visitantes do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection).
