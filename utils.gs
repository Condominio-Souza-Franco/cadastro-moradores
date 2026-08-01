// ==========================================
// FUNÇÕES AUXILIARES E UTILITÁRIOS (ATUALIZADAS PARA TEXTO COM MÁSCARA)
// ==========================================

// Converte qualquer texto de data para o padrão ISO AAAA-MM-DD quando necessário
function converterDataParaIso(dataStr) {
  if (!dataStr) return "";

  let valStr = String(dataStr).trim();
  if (valStr.startsWith("'")) {
    valStr = valStr.substring(1).trim();
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(valStr)) {
    let [dia, mes, ano] = valStr.split("/");
    return `${ano}-${mes}-${dia}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(valStr)) {
    return valStr;
  }

  let limpa = valStr.replace(/\D/g, "");
  if (limpa.length === 8) {
    let dia = limpa.substring(0, 2);
    let mes = limpa.substring(2, 4);
    let ano = limpa.substring(4, 8);
    return `${ano}-${mes}-${dia}`;
  }

  return valStr;
}

// Normaliza qualquer entrada de data para DD/MM/AAAA, que é o formato oficial do formulário
function normalizarDataBrasileira(valorCelula) {
  if (!valorCelula) return "";

  if (valorCelula instanceof Date && !isNaN(valorCelula.getTime())) {
    return Utilities.formatDate(valorCelula, Session.getScriptTimeZone(), "dd/MM/yyyy");
  }

  let valStr = String(valorCelula).trim();
  if (valStr.startsWith("'")) {
    valStr = valStr.substring(1).trim();
  }

  if (valStr === "-" || !valStr) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(valStr)) {
    let [ano, mes, dia] = valStr.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(valStr)) {
    return valStr;
  }

  let digitos = valStr.replace(/\D/g, "");
  if (digitos.length === 8) {
    return `${digitos.substring(0, 2)}/${digitos.substring(2, 4)}/${digitos.substring(4, 8)}`;
  }

  return valStr;
}

// Mantida para compatibilidade caso receba objeto Date antigo
function formatarDataParaComparacao(dataObj) {
  if (!dataObj) return "";
  let str = String(dataObj).trim();
  // Se já estiver no formato texto com barra DD/MM/AAAA ou com traço
  if (str.includes("/")) return str; 
  let d = new Date(str);
  if (isNaN(d.getTime())) return str;
  
  let ano = d.getUTCFullYear();
  let mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  let dia = String(d.getUTCDate()).padStart(2, '0');
  return `${dia}/${mes}/${ano}`; // Retorna padrão brasileiro DD/MM/AAAA para bater com o input de texto
}

function formatarNomeProprio(texto) {
  if (!texto) return "";
  var excecoes = ["de", "da", "do", "das", "dos", "e"];
  return texto.toString().toLowerCase().split(" ").map(function(palavra) {
    if (palavra.length === 0) return "";
    if (excecoes.indexOf(palavra) !== -1) return palavra;
    return palavra.charAt(0).toUpperCase() + palavra.slice(1);
  }).join(" ");
}

function obterAba(ss, nome1, nome2) {
  var aba = ss.getSheetByName(nome1);
  if (!aba && nome2) aba = ss.getSheetByName(nome2);
  return aba;
}

const MAPA_GERAL = {
  dataEnvio: 1,
  apto: 2,
  tipoResidente: 3,
  nome: 4,
  cpf: 5,
  nascimento: 6,
  rg: 7,
  orgaoEmissor: 8,
  celular: 9,
  telFixo: 10,
  email: 11,
  linhaVazia12: 12,
  inqPropAdmin: 13,
  inqContato: 14,
  vigencia: 15,
  contrato: 16,
  observacoes: 18
};

function obterValorDaLinhaGeral(colunaCompleta, linhaNumero) {
  var idx = linhaNumero - 1;
  if (!colunaCompleta[idx] || colunaCompleta[idx][0] === undefined || colunaCompleta[idx][0] === null) return "";
  var val = String(colunaCompleta[idx][0]).trim();
  if (val.startsWith("'")) val = val.substring(1).trim();
  return val === "-" ? "" : val;
}

function buscarOuCriarColuna(aba, apartamento, cpf, isMoradorNovo) {
  var ultimaColuna = aba.getLastColumn();
  
  if (ultimaColuna >= 2) {
    var dados = aba.getRange(1, 1, 5, ultimaColuna).getDisplayValues();
    var cpfLimpoEntrada = String(cpf || "").replace(/\D/g, "").trim();
    var aptoLimpoEntrada = String(apartamento || "").trim();

    // Se for uma atualização (não é morador novo), tenta achar pelo CPF ou pelo Apto existente
    if (!isMoradorNovo) {
      if (cpfLimpoEntrada.length > 0) {
        for (var colIdx = 1; colIdx < dados[4].length; colIdx++) {
          var cpfColuna = String(dados[4][colIdx] || "").replace(/\D/g, "").trim();
          if (cpfColuna === cpfLimpoEntrada) {
            return colIdx + 1;
          }
        }
      }

      for (var colIdx = 1; colIdx < dados[1].length; colIdx++) {
        var aptoColuna = String(dados[1][colIdx] || "").trim();
        if (aptoColuna === aptoLimpoEntrada) {
          return colIdx + 1;
        }
      }
    }
  }

  // Se for "Novo cadastro" (ou se não achou nenhum registro anterior), SEMPRE cria uma nova coluna no final
  return ultimaColuna < 2 ? 2 : ultimaColuna + 1;
}

function ordenarAbaPorColunasApto(aba, temLinks) {
  if (!aba) return;
  var ultimaColuna = aba.getLastColumn();
  var ultimaLinha = aba.getLastRow();

  if (ultimaColuna <= 2 || ultimaLinha < 2) return;

  var rangeTotal = aba.getRange(1, 2, ultimaLinha, ultimaColuna - 1);
  var numColunas = ultimaColuna - 1;

  var valores = rangeTotal.getValues();

  // Mapeia colunas e captura a linha do Apto (Linha 2 / Índice 1)
  var colunas = [];
  for (var col = 0; col < numColunas; col++) {
    var valAptoStr = String(valores[1][col] || "").trim();
    var numApto = parseInt(valAptoStr.replace(/\D/g, ""), 10);
    if (isNaN(numApto)) numApto = 999999;

    colunas.push({
      colOriginal: col,
      aptoNum: numApto
    });
  }

  // Ordena pelo número do apartamento
  colunas.sort(function(a, b) {
    return a.aptoNum - b.aptoNum;
  });

  // VERIFICAÇÃO DE VELOCIDADE: Se as colunas já estiverem em ordem, não faz nada!
  var jaOrdenado = true;
  for (var i = 0; i < colunas.length; i++) {
    if (colunas[i].colOriginal !== i) {
      jaOrdenado = false;
      break;
    }
  }
  if (jaOrdenado) return; // Aborta na hora e economiza vários segundos!

  // Se a aba possui links (Aba Geral), salva os RichTexts da Linha 16 na memória ANTES da reordenação
  var richTextLinha16 = null;
  if (temLinks && ultimaLinha >= 16) {
    richTextLinha16 = aba.getRange(16, 2, 1, numColunas).getRichTextValues()[0];
  }

  // Reorganiza a matriz de valores
  var novaMatrizValores = [];
  for (var r = 0; r < ultimaLinha; r++) {
    var linhaValores = [];
    for (var c = 0; c < colunas.length; c++) {
      linhaValores.push(valores[r][colunas[c].colOriginal]);
    }
    novaMatrizValores.push(linhaValores);
  }

  // Escreve os valores reordenados na planilha
  rangeTotal.setValues(novaMatrizValores);

  // Se salvou a Linha 16 (Contratos com Link), restaura os links no lugar certo
  if (temLinks && richTextLinha16) {
    var novaLinha16RichText = [];
    for (var c = 0; c < colunas.length; c++) {
      novaLinha16RichText.push(richTextLinha16[colunas[c].colOriginal]);
    }
    aba.getRange(16, 2, 1, numColunas).setRichTextValues([novaLinha16RichText]);
  }
}

function salvarAbaRepetitiva(ss, nomesAba, coluna, cabecalhoComum, dadosTexto, maxGrupos, tamanhoGrupo, linhaInicial) {
  var nomeAba = Array.isArray(nomesAba) ? nomesAba[0] : nomesAba;
  var aba = obterAba(ss, Array.isArray(nomesAba) ? nomesAba[0] : nomesAba, Array.isArray(nomesAba) ? nomesAba[1] : null) || ss.insertSheet(nomeAba);

  var linhasNecessarias = (linhaInicial - 1) + (maxGrupos * tamanhoGrupo);
  if (aba.getMaxRows() < linhasNecessarias) {
    aba.insertRowsAfter(aba.getMaxRows(), linhasNecessarias - aba.getMaxRows());
  }

  if (aba.getMaxColumns() < coluna) {
    aba.insertColumnsAfter(aba.getMaxColumns(), coluna - aba.getMaxColumns());
  }

  aba.getRange(1, coluna, cabecalhoComum.length, 1).setValues(cabecalhoComum);

  var linhasPreenchimento = [];
  var itens = dadosTexto ? dadosTexto.split("\n") : [];

  for (var i = 0; i < maxGrupos; i++) {
    var linhaTexto = itens[i] ? itens[i] : "";
    var valoresItem = linhaTexto !== "" ? linhaTexto.split(" | ") : [];
    
    while (valoresItem.length < tamanhoGrupo) {
      valoresItem.push("");
    }

    for (var g = 0; g < tamanhoGrupo; g++) {
      var val = valoresItem[g] !== undefined ? String(valoresItem[g]).trim() : "";
      linhasPreenchimento.push([(val === "" || val === "-") ? "" : val]);
    }
  }

  var rangeAlvo = aba.getRange(linhaInicial, coluna, linhasPreenchimento.length, 1);
  rangeAlvo.clearContent();
  rangeAlvo.setValues(linhasPreenchimento);
}

function lerItensMultiplos(aba, coluna, maxGrupos, tamanhoGrupo, linhaInicial) {
  if (!aba) return "";
  if (coluna > aba.getMaxColumns()) return "";
  
  var ultimaLinha = aba.getLastRow();
  if (ultimaLinha < linhaInicial) return "";

  var totalLinhasParaLer = maxGrupos * tamanhoGrupo;
  var linhasDisponiveis = aba.getMaxRows() - linhaInicial + 1;
  if (linhasDisponiveis <= 0) return "";

  var linhasParaLer = Math.min(totalLinhasParaLer, linhasDisponiveis);
  var dados = aba.getRange(linhaInicial, coluna, linhasParaLer, 1).getDisplayValues();

  var resultado = [];
  for (var i = 0; i < maxGrupos; i++) {
    var bloco = [];
    var possuiDado = false;
    
    for (var g = 0; g < tamanhoGrupo; g++) {
      var idx = (i * tamanhoGrupo) + g;
      var val = (idx < dados.length) ? String(dados[idx][0] || "").trim() : "";
      
      if (val !== "" && val !== "-") {
        possuiDado = true;
      }
      var blockVal = (val === "-" || val === "") ? "" : val;
      bloco.push(blockVal);
    }
    
    if (possuiDado) {
      resultado.push(bloco.join(" | "));
    }
  }
  return resultado.join("\n");
}

function limparCpf(cpf) {
  if (!cpf) return "";
  return String(cpf).replace(/\D/g, "");
}