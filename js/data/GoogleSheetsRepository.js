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
  function chamarBackend(funcao, payloadExtra, protegido) {
    return window.Backend.chamar(funcao, payloadExtra, protegido, "Google Sheets");
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
    // O histórico de alterações só existe no Firebase.
    listarHistorico: function() {
      return Promise.resolve({ sucesso: false, mensagem: "O histórico de alterações só está disponível com o Firebase.", itens: [] });
    },

    // ---- Escrita ----
    excluirCadastro: function(apto, ocorrencia) {
      return chamarBackend("excluirCadastroPorApartamentoSimples", { apto: apto, ocorrencia: ocorrencia }, true);
    },
    // A planilha é só leitura (contingência): toda gravação vai para o Firebase, e a rota
    // pública "processarFormulario" foi desativada no backend.
    salvarCadastro: function() {
      return Promise.reject(window.Backend.criarErroFonte("somente-leitura", "O Google Sheets está disponível apenas para leitura."));
    },
    salvarCadastroAdmin: function() {
      return Promise.reject(window.Backend.criarErroFonte("somente-leitura", "O Google Sheets está disponível apenas para leitura."));
    },

    // Usado pelo botão "Testar conexões" do admin, sem alterar a fonte selecionada.
    testarConexao: function() {
      return chamarBackend("obterApartamentosGabaritoVagas", {}, false)
        .then(function() { return { ok: true }; })
        .catch(function(erro) { return { ok: false, mensagem: erro.message }; });
    }
  };
})();
