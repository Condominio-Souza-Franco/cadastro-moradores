// ==========================================
// FIREBASE REPOSITORY
// ==========================================
// O navegador NÃO fala diretamente com o Firestore (evita expor dados sem Firebase Auth).
// Em vez disso, chama o mesmo backend Apps Script (WEB_APP_URL) com o mesmo token de admin
// já usado pelo GoogleSheetsRepository — o Apps Script é quem acessa o Firestore, usando uma
// service account guardada só nas Propriedades do Script (nunca no código-fonte/frontend).
//
// Leitura, escrita e exclusão de cadastros, gabarito, busca geral e relatórios em PDF
// já implementados no Firestore. O upload do contrato em PDF continua indo para o Google
// Drive (independente da planilha) — só o link fica salvo no documento do Firestore.
(function() {
  function criarErroFonte(codigo, mensagem) {
    var erro = new Error(mensagem);
    erro.codigoFonte = codigo;
    return erro;
  }

  function chamarBackend(funcao, payloadExtra, protegido) {
    if (typeof WEB_APP_URL === "undefined" || !WEB_APP_URL) {
      return Promise.reject(criarErroFonte("nao-configurado", "WEB_APP_URL não definido."));
    }

    var corpo = Object.assign({ funcao: funcao }, payloadExtra || {});
    if (protegido && window.AdminAuth && typeof window.AdminAuth.getIdToken === "function") {
      corpo.idToken = window.AdminAuth.getIdToken();
    }

    return fetch(WEB_APP_URL, { method: "POST", body: JSON.stringify(corpo) })
      .then(function(response) {
        return response.text().then(function(texto) {
          var conteudo = String(texto || "").trim();

          if (!response.ok) {
            throw criarErroFonte("unavailable", "Backend indisponível (HTTP " + response.status + ").");
          }
          if (!conteudo || conteudo.charAt(0) !== "{") {
            throw criarErroFonte("unavailable", "Backend não retornou JSON válido.");
          }

          var json = JSON.parse(conteudo);
          if (json && json.autorizado === false) {
            throw criarErroFonte("nao-autorizado", json.mensagem || "Não autorizado. Faça login novamente.");
          }
          return json;
        });
      })
      .catch(function(erro) {
        if (erro && erro.codigoFonte) throw erro;
        throw criarErroFonte("unavailable", "Não foi possível conectar ao Firebase.");
      });
  }

  window.FirebaseRepository = {
    nome: "firebase",

    // Reflete apenas se o frontend está pronto para tentar o Firebase; a checagem real das
    // credenciais (Propriedades do Script) acontece no backend a cada chamada fb*.
    isConfigured: function() {
      return true;
    },

    // ---- Leitura (implementadas no Firestore) ----
    listarApartamentos: function() {
      return chamarBackend("fbListarApartamentos", {}, true);
    },
    obterMoradorPorApto: function(apto) {
      return chamarBackend("fbObterMoradorPorApto", { apto: apto }, true);
    },
    obterMoradorPorCpf: function(cpf, nascimento) {
      return chamarBackend("fbObterMoradorPorCpf", { cpf: cpf, nascimento: nascimento }, false);
    },
    obterApartamentosGabarito: function() {
      return chamarBackend("fbObterApartamentosGabarito", {}, false);
    },
    obterGabaritoVagasCompleto: function() {
      return chamarBackend("fbObterGabaritoVagasCompleto", {}, false);
    },
    buscarTexto: function(termo) {
      return chamarBackend("fbBuscarTexto", { termo: termo }, true);
    },
    gerarRelatorioApartamentos: function() {
      return chamarBackend("fbGerarRelatorioApartamentos", {}, true);
    },
    gerarRelatorioApartamentosPdfDrive: function() {
      return chamarBackend("fbGerarRelatorioApartamentosPdfDrive", {}, true);
    },

    // ---- Escrita ----
    excluirCadastro: function(apto) {
      return chamarBackend("fbExcluirCadastro", { apto: apto }, true);
    },
    salvarCadastro: function(dados) {
      return chamarBackend("fbSalvarCadastro", { dados: dados }, false);
    },
    ordenarAposOperacao: function() {
      return Promise.resolve({ sucesso: true }); // Não existe "ordenar" no Firestore.
    },

    // Usado pelo botão "Testar conexões" do admin, sem alterar a fonte selecionada.
    testarConexao: function() {
      return chamarBackend("fbTestarConexao", {}, false);
    }
  };
})();
