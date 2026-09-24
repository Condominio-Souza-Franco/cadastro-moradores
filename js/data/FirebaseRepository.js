// ==========================================
// FIREBASE REPOSITORY (STUB)
// ==========================================
// Implementação futura da fonte de dados principal (Firestore).
// Hoje este repositório não está configurado: todos os métodos rejeitam com
// codigoFonte "nao-configurado", o que o DataService interpreta como
// "fonte indisponível" (aciona fallback automático no modo "auto").
//
// COMO ATIVAR NO FUTURO:
// 1. Crie o projeto no console do Firebase e habilite o Firestore.
// 2. Adicione o Firebase Web SDK (via <script type="module"> + CDN, ou npm caso o projeto passe a ter build).
//    As chaves do Web SDK (apiKey, authDomain, projectId...) são PÚBLICAS por natureza — não são segredo.
//    A proteção real dos dados vem das Firestore Security Rules + Firebase Authentication.
// 3. Chame firebase.initializeApp({...}) uma vez (ex.: em um novo js/firebase-config.js) e troque
//    FIREBASE_CONFIGURADO para true assim que o app estiver inicializado corretamente.
// 4. Implemente cada método abaixo usando o SDK do Firestore (getDocs/getDoc/addDoc/updateDoc/deleteDoc),
//    mantendo a mesma assinatura e o mesmo formato de retorno usados pelo GoogleSheetsRepository.js,
//    para que o DataService continue funcionando sem mudanças.
(function() {
  function criarErroFonte(codigo, mensagem) {
    var erro = new Error(mensagem);
    erro.codigoFonte = codigo;
    return erro;
  }

  var FIREBASE_CONFIGURADO = false;

  function naoConfigurado() {
    return Promise.reject(criarErroFonte("nao-configurado", "Firebase ainda não foi configurado neste projeto."));
  }

  window.FirebaseRepository = {
    nome: "firebase",

    isConfigured: function() {
      return FIREBASE_CONFIGURADO;
    },

    // ---- Leitura ----
    listarApartamentos: naoConfigurado,
    obterApartamentosGabarito: naoConfigurado,
    obterGabaritoVagasCompleto: naoConfigurado,
    obterMoradorPorApto: naoConfigurado,
    obterMoradorPorCpf: naoConfigurado,
    buscarTexto: naoConfigurado,
    gerarRelatorioApartamentos: naoConfigurado,
    gerarRelatorioApartamentosPdfDrive: naoConfigurado,

    // ---- Escrita ----
    excluirCadastro: naoConfigurado,
    salvarCadastro: naoConfigurado,

    // Não existe conceito de "ordenar planilha" no Firestore; é um no-op seguro.
    ordenarAposOperacao: function() {
      return Promise.resolve({ sucesso: true });
    },

    // Usado pelo botão "Testar conexões" do admin, sem alterar a fonte selecionada.
    testarConexao: function() {
      return Promise.resolve({ ok: false, mensagem: "Firebase ainda não foi configurado." });
    }
  };
})();
