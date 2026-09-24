// ==========================================
// FIREBASE REPOSITORY
// ==========================================
// O navegador NÃO fala diretamente com o Firestore (evita expor dados sem Firebase Auth).
// Em vez disso, chama o mesmo backend Apps Script (WEB_APP_URL) com o mesmo token de admin
// já usado pelo GoogleSheetsRepository — o Apps Script é quem acessa o Firestore, usando uma
// service account guardada só nas Propriedades do Script (nunca no código-fonte/frontend).
//
// Leitura (listar/obter apartamento/obter por CPF) e escrita (salvar/excluir cadastro) já
// implementadas no Firestore. O upload do contrato em PDF continua indo para o Google Drive
// (independente da planilha) — só o link fica salvo no documento do Firestore.
// Relatórios/busca geral ainda não foram migrados: rejeitam com codigoFonte "nao-implementado",
// o que faz o DataService usar o Google Sheets automaticamente só para essas operações.
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

  function naoImplementado(mensagem) {
    return function() {
      return Promise.reject(criarErroFonte("nao-implementado", mensagem));
    };
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

    // ---- Ainda não migradas para o Firestore (fallback automático para o Sheets) ----
    obterApartamentosGabarito: naoImplementado("Gabarito de apartamentos ainda não migrado para o Firebase."),
    obterGabaritoVagasCompleto: naoImplementado("Gabarito de vagas ainda não migrado para o Firebase."),
    buscarTexto: naoImplementado("Busca geral ainda não implementada no Firebase."),
    gerarRelatorioApartamentos: naoImplementado("Relatório ainda não implementado no Firebase."),
    gerarRelatorioApartamentosPdfDrive: naoImplementado("Geração de PDF ainda não implementada no Firebase."),

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
    },

    // Migração única: copia o cadastro mais recente de cada apartamento da planilha para o Firestore.
    migrarPlanilha: function() {
      return chamarBackend("fbMigrarPlanilha", {}, true);
    }
  };
})();
