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
  function chamarBackend(funcao, payloadExtra, protegido) {
    return window.Backend.chamar(funcao, payloadExtra, protegido, "Firebase");
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
    // "ocorrencia" identifica qual cadastro abrir quando o apartamento tem mais de um.
    obterMoradorPorApto: function(apto, ocorrencia) {
      return chamarBackend("fbObterMoradorPorApto", { apto: apto, ocorrencia: ocorrencia }, true);
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
    // Últimas criações/edições/exclusões (mais recente primeiro).
    listarHistorico: function(limite) {
      return chamarBackend("fbListarHistorico", { limite: limite }, true);
    },
    gerarListaVeiculosPdfDrive: function() {
      return chamarBackend("fbGerarListaVeiculosPdfDrive", {}, true);
    },
    // Último PDF gerado de cada relatório e se ele está desatualizado ("datado").
    situacaoRelatorios: function() {
      return chamarBackend("fbSituacaoRelatorios", {}, true);
    },

    // ---- Escrita ----
    // "ocorrencia" evita excluir o cadastro errado quando o apartamento tem mais de um.
    excluirCadastro: function(apto, ocorrencia) {
      return chamarBackend("fbExcluirCadastro", { apto: apto, ocorrencia: ocorrencia }, true);
    },
    // Novo cadastro, ou atualização com dados.cadastroId + dados.credencialCpf/credencialNasc.
    salvarCadastro: function(dados) {
      return chamarBackend("fbSalvarCadastro", { dados: dados }, false);
    },
    // Edição de um cadastro existente pela administração (exige o login do admin).
    salvarCadastroAdmin: function(dados) {
      return chamarBackend("fbAdminSalvarCadastro", { dados: dados }, true);
    },
    // situacao: "mudou-se" ou "ativo" (só administração).
    definirSituacaoCadastro: function(apto, ocorrencia, situacao) {
      return chamarBackend("fbDefinirSituacaoCadastro", { apto: apto, ocorrencia: ocorrencia, situacao: situacao }, true);
    },

    // Usado pelo botão "Testar conexões" do admin, sem alterar a fonte selecionada.
    testarConexao: function() {
      return chamarBackend("fbTestarConexao", {}, false);
    }
  };
})();
