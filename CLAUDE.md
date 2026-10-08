# CLAUDE.md

Cadastro de moradores do Condomínio Souza Franco. Site estático (HTML, CSS e JavaScript puro, sem build e sem dependências npm), publicado pelo GitHub Pages em https://condominio-souza-franco.github.io/cadastro-moradores/.

## Estrutura

- `index.html`: formulário do morador (cadastro novo e atualização).
- `admin.html`: painel da administração, com login Google (`js/admin-auth.js`).
- `kit.html`, `mapa-vaga.html`, `seguranca.html`: páginas avulsas (kit de boas-vindas, mapa da vaga, documentação de segurança).
- `js/regras.js`: configuração global (`WEB_APP_URL` do Apps Script, `ADMIN_AUTH_CONFIG`) e regras de validação. É carregado primeiro.
- `js/data/`: camada de dados.
  - `backend.js`: `window.Backend.chamar()`, a única função que faz `fetch` ao Apps Script. Rotas protegidas mandam o ID token do admin; resposta `{ autorizado: false }` dispara o evento `admin-auth-expired`.
  - `FirebaseRepository.js` e `GoogleSheetsRepository.js`: mesma interface, rotas diferentes no mesmo Apps Script. O navegador nunca fala direto com o Firestore.
  - `DataService.js`: o resto do app só chama `window.DataService.*`. Modos `auto` (Firebase com fallback para Sheets), `firebase` e `sheets` (somente leitura).
- `js/admin-*.js`: um arquivo por painel/função do admin.
- `css/`: estilos do formulário divididos por assunto (`responsivo.css` concentra as media queries); `css/admin.css` é o do painel.
- O backend (Apps Script, `*.gs`) fica em um projeto privado separado e está no `.gitignore`. Mudanças que precisem de rota nova no backend devem ser apontadas no PR, não inventadas aqui.

## Rodar localmente

Não há build. Sirva a pasta com qualquer servidor estático, por exemplo:

```sh
python3 -m http.server 8000
```

e abra `http://localhost:8000/index.html` ou `/admin.html`. Os dados vêm do Apps Script de produção (`WEB_APP_URL`), então cuidado com ações de escrita. O login Google do admin só funciona nas origens autorizadas no Client ID.

## Convenções

- Código, comentários, nomes de funções e textos da interface em português do Brasil.
- JavaScript em ES5 dentro de IIFEs `(function() { ... })();`, expondo módulos em `window.*`. Sem frameworks, sem módulos ES, sem bundler.
- Scripts e CSS são incluídos com `?v=AAAAMMDDx` para furar o cache. Ao mudar um arquivo, atualize a versão nas tags que o carregam (`index.html`, `admin.html` etc.).
- Comentários de cabeçalho no topo de cada arquivo explicam o porquê das decisões; mantenha esse estilo.
- Nunca registre dados pessoais de moradores no `console`.
- Links externos abrem em popup (`js/popup-links.js`), não em nova aba.
- `js/sem-conectivos.js` impede que artigos e preposições fiquem sozinhos no fim da linha; não é preciso tratar isso à mão nos textos.

## Regras

- Teste toda mudança de interface também em largura de celular (por volta de 375px), além do desktop.
- Não proponha migrar a hospedagem para Cloudflare (decisão de 08/10/2026). A hospedagem continua no GitHub Pages.
- Entregue mudanças como PR em rascunho, com explicação em linguagem simples.
