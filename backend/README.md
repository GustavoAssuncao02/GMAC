# GMAC BACKEND

API Node.js independente do site, sem banco de dados e sem arquivos permanentes. Recebe `POST /api/quotes` em multipart/form-data e envia os campos e anexos para **comercial@gmacmetalurgica.com.br**. O endereço do cliente fica no Reply-To, permitindo responder diretamente a ele.

## Configuração

1. Use Node.js 22.16 ou superior e execute `npm ci` nesta pasta.
2. Copie `.env.example` para `.env` no ambiente local, ou cadastre as variáveis no ambiente da hospedagem.
3. Servidor, porta, usuário e remetente já estão preenchidos para `smtp.office365.com:587`, usando `comercial@gmacmetalurgica.com.br`. O `.env` local e o pacote privado já contêm a credencial fornecida; o exemplo permanece sem senha. O teste real identificou que SMTP AUTH está desabilitado no Microsoft 365 e precisa ser liberado pelo administrador. Consulte [../LEIA-ANTES-DE-SUBIR.md](../LEIA-ANTES-DE-SUBIR.md).
4. Configure `SMTP_SECURE=true` para TLS direto (normalmente porta 465). Para STARTTLS (normalmente 587), use `false`; o backend exige TLS também nesse caso. Confirme os valores com o provedor.
5. Inicie com `npm start`. A API verifica a conexão/autenticação SMTP. Sem credenciais ou com SMTP indisponível, o processo permanece ativo, mas os orçamentos e o health retornam 503. Com credenciais presentes, tenta verificar novamente a cada 60 segundos e habilita os envios após a verificação. Ao alterar o `.env`, reinicie o processo.

## SaveInCloud

**Neste pacote, com Filminhos:** siga [../SUBIR-NA-SAVEINCLOUD.md](../SUBIR-NA-SAVEINCLOUD.md). Na raiz, `npm install` instala as dependências e `npm start` inicia os dois processos. O endereço público da API será `https://movies.ce.br.saveincloud.net.br/gmac`, usando o proxy interno do Filminhos. O backend escuta apenas em `127.0.0.1:3001`; não publique essa porta.

**Se publicar esta pasta isoladamente:**

O serviço está preparado para um ambiente Node.js: envie somente esta pasta, sem node_modules e sem credenciais versionadas, instale com `npm ci --omit=dev` e configure `npm start` como comando de execução. Se o produto contratado usar contêiner, há um Dockerfile incluído.

Cadastre as variáveis de `.env.example`, mas ajuste `GMAC_HOST=0.0.0.0` para receber conexões do proxy externo ou da rede do container. Exponha a porta `PORT` (padrão 3001) pelo proxy HTTPS e configure reinício automático. A modalidade/plano, domínio e topologia da SaveInCloud ainda precisam ser confirmados; as etapas exatas do painel dependem desse ambiente. Configure `TRUST_PROXY_HOPS` somente com a quantidade confirmada de proxies confiáveis entre o público e o Node, ou `0` se não houver proxy confiável. Mantenha acesso direto ao Node bloqueado quando confiar em um proxy.

`GET /api/health` retorna `{"ok":true,"service":"gmac-backend","smtpReady":true}` quando o SMTP foi verificado, ou HTTP 503 com os booleanos falsos enquanto o envio estiver indisponível. Isso não testa entregabilidade de e-mail. A saída SMTP precisa estar liberada na hospedagem. Configure o proxy para aceitar uploads de pelo menos 26 MB e tempo suficiente para envio dos anexos.

## Conectar o GitHub Pages

Este pacote não inclui o frontend GMAC. A integração e a variável de build estão descritas em [../SUBIR-NA-SAVEINCLOUD.md](../SUBIR-NA-SAVEINCLOUD.md).

No repositório GitHub, crie a variável de Actions **VITE_API_URL** com a URL HTTPS pública do backend, sem `/api/quotes`. O workflow de Pages já passa essa variável ao build. Execute uma nova publicação depois de configurar ou alterar a URL. Em `ALLOWED_ORIGINS`, informe a origem do site (por exemplo `https://gustavoassuncao02.github.io`), sem o caminho `/GMAC/`. Inclua a origem de um domínio personalizado caso seja utilizado.

Localmente, crie `.env.local` na raiz do frontend com `VITE_API_URL=http://localhost:3000/gmac` ao executar o pacote completo; permita `http://localhost:5173` no backend e reinicie o Vite. Se executar só a API, use `http://localhost:3001`.

## Limites e operação

- Até 10 anexos: PDF, DWG, DXF, JPG, JPEG e PNG; 10 MB por arquivo, 25 MB somados.
- Até 5 tentativas por IP em 15 minutos e 2 uploads simultâneos por instância. O controle é em memória e reinicia com o processo; múltiplas instâncias exigem limite compartilhado ou no proxy.
- CORS restringe navegadores; não é proteção completa contra bots. Se houver abuso, adicionar CAPTCHA e proteção no proxy.
- Os anexos ficam em memória durante a requisição. O limite SMTP do provedor deve suportar o tamanho final da mensagem: 25 MB de anexos viram aproximadamente 34 MB com a codificação do e-mail. Confirme esse limite antes da publicação.
- O backend só responde sucesso após o SMTP aceitar o destinatário. Isso não garante chegada à caixa de entrada; verifique spam, SPF/DKIM e eventuais devoluções com o provedor.
- Não há fila, persistência ou reenvio automático. Em erro o frontend mantém os dados. Uma conexão interrompida depois da aceitação SMTP pode causar duplicidade se o usuário reenviar.

## Verificação

Na raiz do pacote, `npm run check:smtp` testa a conexão TLS e a autenticação reais sem enviar e-mail. Dentro desta pasta, o mesmo comando também funciona. O diagnóstico identifica `SMTP_AUTH_DISABLED`, `SMTP_AUTH_FAILED` ou `SMTP_CONNECTION_FAILED` conforme a resposta recebida. `GET /api/health` pode incluir `smtpError` quando o envio estiver indisponível.

`npm test` testa a API HTTP com transporte de e-mail substituído para inspecionar mensagem e anexos, sem enviar mensagens reais. Para concluir a implantação, configurar SMTP e URL pública, publicar o frontend e enviar um orçamento de teste, verificando recebimento e anexos no comercial.

Referências: [SMTP Nodemailer](https://nodemailer.com/smtp), [anexos](https://nodemailer.com/message/attachments), [limites Multer](https://expressjs.com/en/resources/middleware/multer/).
