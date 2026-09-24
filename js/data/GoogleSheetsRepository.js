// ==========================================
// GOOGLE SHEETS REPOSITORY
// ==========================================
// Encapsula todas as chamadas ao backend Apps Script (WEB_APP_URL) em um único lugar.
// Reaproveita exatamente as mesmas rotas (`funcao`) já existentes no backend — nenhuma
// função nova foi criada no Apps Script além da verificação de token admin já em produção.
//
// Funções "protegidas" (protegido=true) enviam automaticamente o ID token do admin logado
// (window.AdminAuth.getIdToken()), exigido pelo backend para as rotas administrativas.
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
        throw criarErroFonte("unavailable", "Não foi possível conectar ao Google Sheets.");
      });
  }

  window.GoogleSheetsRepository = {
    nome: "sheets",

    // O Sheets já existe e funciona hoje; é sempre considerado "configurado".
    isConfigured: function() {
      return true;
    },

    // ---- Leitura ----
    listarApartamentos: function() {
      return chamarBackend("listarApartamentosParaAdminSimples", {}, true);
    },
    obterApartamentosGabarito: function() {
      return chamarBackend("obterApartamentosGabaritoVagas", {}, false);
    },
    obterGabaritoVagasCompleto: function() {
      return chamarBackend("obterTodoGabaritoVagas", {}, false);
    },
    obterMoradorPorApto: function(apto, ocorrencia) {
      return chamarBackend("buscarDadosPorApartamentoSimples", { apto: apto, ocorrencia: ocorrencia }, true);
    },
    obterMoradorPorCpf: function(cpf, nascimento) {
      return chamarBackend("buscarDadosPorCpfESeguranca", { cpf: cpf, nascimento: nascimento }, false);
    },
    buscarTexto: function(termo) {
      return chamarBackend("buscarTextoNaPlanilha", { termo: termo }, true);
    },
    gerarRelatorioApartamentos: function() {
      return chamarBackend("gerarRelatorioApartamentos", {}, true);
    },
    gerarRelatorioApartamentosPdfDrive: function() {
      return chamarBackend("gerarRelatorioApartamentosPdfDrive", {}, true);
    },

    // ---- Escrita ----
    excluirCadastro: function(apto, ocorrencia) {
      return chamarBackend("excluirCadastroPorApartamentoSimples", { apto: apto, ocorrencia: ocorrencia }, true);
    },
    salvarCadastro: function(dados) {
      return chamarBackend("processarFormulario", { dados: dados }, false);
    },
    ordenarAposOperacao: function() {
      return chamarBackend("executarOrdenacaoAposOperacao", {}, false);
    },

    // Usado pelo botão "Testar conexões" do admin, sem alterar a fonte selecionada.
    testarConexao: function() {
      return chamarBackend("obterApartamentosGabaritoVagas", {}, false)
        .then(function() { return { ok: true }; })
        .catch(function(erro) { return { ok: false, mensagem: erro.message }; });
    }
  };
})();
