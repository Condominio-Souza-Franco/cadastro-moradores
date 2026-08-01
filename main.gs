// ==========================================
// ROTEADOR DE REQUISIÇÕES EXTERNAS (FETCH)
// ==========================================
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Requisição sem conteúdo.");
    }

    var dadosRequisicao = JSON.parse(e.postData.contents);
    if (!dadosRequisicao || typeof dadosRequisicao !== "object") {
      throw new Error("Payload inválido.");
    }

    var funcao = String(dadosRequisicao.funcao || "").trim();
    if (!funcao) {
      throw new Error("Função não informada.");
    }

    var resultado;

    if (funcao === 'buscarDadosPorCpfESeguranca') {
      resultado = buscarDadosPorCpfESeguranca(dadosRequisicao.cpf, dadosRequisicao.nascimento);
    } else if (funcao === 'processarFormulario') {
      resultado = processarFormulario(dadosRequisicao.dados);
    } else if (funcao === 'obterTodoGabaritoVagas') {
      // Rota para buscar o gabarito inteiro de vagas para o cache local
      try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const aba = ss.getSheetByName("Gabarito Vagas de garagem");
        if (!aba) {
          resultado = { sucesso: false, dados: [] };
        } else {
          const dados = aba.getRange("A2:C" + aba.getLastRow()).getValues();
          resultado = { sucesso: true, dados: dados };
        }
      } catch (err) {
        resultado = { sucesso: false, dados: [] };
      }
    } else {
      throw new Error("Função não encontrada: " + funcao);
    }

    return ContentService.createTextOutput(JSON.stringify(resultado))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (erro) {
    return ContentService.createTextOutput(JSON.stringify({
      sucesso: false,
      mensagem: "Erro no servidor: " + erro.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Cadastro de Moradores - Condomínio Souza Franco')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function incluir(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}