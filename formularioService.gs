// ==========================================
// CONFIGURAÇÃO DE COMPARTILHAMENTO DE CONTRATOS
// ==========================================
var EMAIL_CONTRATO_COMPARTILHADO = "SEU_EMAIL_AQUI@DOMINIO.COM";

// ==========================================
// VALIDAÇÃO DEFENSIVA DO PAYLOAD NO SERVIDOR
// ==========================================
function validarPayloadFormulario(dados) {
  if (!dados || typeof dados !== "object") {
    return { ok: false, mensagem: "Dados do formulário inválidos." };
  }

  var tipoResidente = String(dados.tipoResidente || dados.tipo || "").trim();
  dados.tipoResidente = tipoResidente;
  var ehInquilino = tipoResidente === "Inquilino";

  var camposObrigatorios = [
    { chave: "apto", nome: "Apartamento" },
    { chave: "tipoResidente", nome: "Identificação do imóvel" },
    { chave: "moradorNome", nome: "Nome do responsável" },
    { chave: "moradorNasc", nome: "Data de nascimento" },
    { chave: "moradorCpf", nome: "CPF" },
    { chave: "moradorCelular", nome: "Celular" }
  ];

  if (ehInquilino) {
    camposObrigatorios = camposObrigatorios.concat([
      { chave: "inqPropAdmin", nome: "Proprietário / administradora" },
      { chave: "inqContato", nome: "Contato do proprietário / administradora" },
      { chave: "inqVigencia", nome: "Vigência do contrato" }
    ]);
  }

  for (var i = 0; i < camposObrigatorios.length; i++) {
    var campo = camposObrigatorios[i];
    var valor = String(dados[campo.chave] || "").trim();
    if (!valor) {
      return { ok: false, mensagem: "Campo obrigatório ausente: " + campo.nome + "." };
    }
  }

  var cpfDigitos = String(dados.moradorCpf || "").replace(/\D/g, "").trim();
  if (cpfDigitos.length !== 11) {
    return { ok: false, mensagem: "CPF deve conter 11 dígitos válidos." };
  }

  var dataNasc = normalizarDataBrasileira(dados.moradorNasc || "");
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dataNasc)) {
    return { ok: false, mensagem: "Data de nascimento inválida. Utilize o formato DD/MM/AAAA." };
  }

  var partesData = dataNasc.split("/");
  var dia = parseInt(partesData[0], 10);
  var mes = parseInt(partesData[1], 10);
  var ano = parseInt(partesData[2], 10);
  var dataValida = new Date(ano, mes - 1, dia);
  if (dataValida.getFullYear() !== ano || dataValida.getMonth() !== mes - 1 || dataValida.getDate() !== dia) {
    return { ok: false, mensagem: "Data de nascimento inválida." };
  }

  if (String(dados.declaracao || "") !== "true") {
    return { ok: false, mensagem: "É necessário confirmar a declaração para enviar o cadastro." };
  }

  if (dados.arquivoContrato && dados.arquivoContrato.base64) {
    var tamanhoBase64 = String(dados.arquivoContrato.base64 || "").length;
    var tamanhoEstimadoBytes = Math.round(tamanhoBase64 * 0.75);
    if (tamanhoEstimadoBytes > 5 * 1024 * 1024) {
      return { ok: false, mensagem: "O arquivo de contrato é muito grande. Use um arquivo de até 5 MB." };
    }

    var tipoArquivo = String(dados.arquivoContrato.type || "").toLowerCase();
    if (tipoArquivo && tipoArquivo.indexOf("pdf") === -1) {
      return { ok: false, mensagem: "O contrato deve ser enviado em PDF." };
    }
  }

  return { ok: true };
}

// ==========================================
// PROCESSAMENTO DO FORMULÁRIO
// ==========================================
function processarFormulario(dados) {
  var lock = LockService.getScriptLock();
  // Aguarda até 30 segundos para obter acesso exclusivo e evitar concorrência
  try {
    lock.waitLock(30000);
  } catch (e) {
    return { sucesso: false, mensagem: "O sistema está ocupado processando outra requisição. Tente novamente em instantes." };
  }

  try {
    var validacao = validarPayloadFormulario(dados);
    if (!validacao.ok) {
      return { sucesso: false, mensagem: validacao.mensagem };
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var dataEnvio = new Date();
    var abaGeral = obterAba(ss, "Geral") || ss.insertSheet("Geral");

    // Limpeza rigorosa do CPF para padronizar comparação com 11 dígitos
    var cpfLimpoEntrada = String(dados.moradorCpf || "").replace(/\D/g, "").trim().padStart(11, '0');
    var isMoradorNovo = (dados.acao === "Sou morador novo");

    var nomeFormatado = dados.moradorNome ? formatarNomeProprio(dados.moradorNome) : "-";

    // Tratamento estrito para garantir que a data permaneça como texto puro formatado DD/MM/AAAA
    var dataNascTratada = normalizarDataBrasileira(dados.moradorNasc || "");

    if (isMoradorNovo && cpfLimpoEntrada.length > 0) {
      var ultimaColunaChecagem = abaGeral.getLastColumn();
      if (ultimaColunaChecagem >= 2) {
        var cpfsExistentes = abaGeral.getRange(5, 1, 1, ultimaColunaChecagem).getDisplayValues()[0];
        for (var c = 1; c < cpfsExistentes.length; c++) {
          var cpfColuna = String(cpfsExistentes[c] || "").replace(/\D/g, "").trim();
          if (cpfColuna === cpfLimpoEntrada) {
            return {
              success: false,
              sucesso: false,
              mensagem: "Este CPF já possui cadastro no condomínio. Para atualizar seus dados ou realizar alterações, utilize a busca por CPF na tela inicial ou procure o síndico."
            };
          }
        }
      }
    }

    var ultimaColunaAntes = abaGeral.getLastColumn();
    var coluna = buscarOuCriarColuna(abaGeral, dados.apto, dados.moradorCpf, isMoradorNovo);
    var ehAtualizacao = (dados.acao && dados.acao.toLowerCase().indexOf("atualiz") !== -1) || (coluna <= ultimaColunaAntes);

    // ==========================================
    // 1. EXTRAÇÃO E MAPEAMENTO DOS LINKS ANTIGOS NA CELULA
    // ==========================================
    var celulaContrato = abaGeral.getRange(16, coluna);
    var urlsAntigasNaCelula = [];

    var richTextAntigo = celulaContrato.getRichTextValue();
    var textoBrutoCel = celulaContrato.getDisplayValue();
    var formulaAntiga = celulaContrato.getFormula();

    if (formulaAntiga && formulaAntiga.indexOf("HYPERLINK") !== -1) {
      var regexFormula = /"([^"]+)"/g;
      var match;
      while ((match = regexFormula.exec(formulaAntiga)) !== null) {
        if (match[1].startsWith("http") && urlsAntigasNaCelula.indexOf(match[1]) === -1) {
          urlsAntigasNaCelula.push(match[1]);
        }
      }
    }

    if (richTextAntigo) {
      var runs = richTextAntigo.getRuns();
      for (var r = 0; r < runs.length; r++) {
        var u = runs[r].getLinkUrl();
        var t = runs[r].getText().trim();
        if (!u && t && t.startsWith("http")) u = t;
        if (u && u.startsWith("http") && urlsAntigasNaCelula.indexOf(u) === -1) {
          urlsAntigasNaCelula.push(u);
        }
      }
    }

    if (textoBrutoCel && textoBrutoCel !== "-") {
      var regexUrls = /https?:\/\/[^\s\|]+/g;
      var urlsEncontradas = textoBrutoCel.match(regexUrls);
      if (urlsEncontradas) {
        for (var i = 0; i < urlsEncontradas.length; i++) {
          var urlU = urlsEncontradas[i].trim();
          if (urlsAntigasNaCelula.indexOf(urlU) === -1) {
            urlsAntigasNaCelula.push(urlU);
          }
        }
      }
    }

    // Define a nova lista de links ativa com base no que o Front-End enviou ou no fallback
    var listaDeLinks = [];
    if (Array.isArray(dados.historicoContratos)) {
      listaDeLinks = dados.historicoContratos.map(function(item) {
        return { texto: item.texto, url: item.url };
      });
    } else {
      // Fallback usando a lista extraída
      listaDeLinks = urlsAntigasNaCelula.map(function(url) {
        var matchData = textoBrutoCel.match(/\d{2}\/\d{2}\/\d{4}/);
        return { texto: matchData ? "Contrato_" + matchData[0] : "Contrato_Anterior", url: url };
      });
    }

    // ==========================================
    // 2. UPLOAD DO NOVO ARQUIVO EM PASTA ESPECÍFICA (APTO_CPF)
    // ==========================================
    var linkNovo = "-";
    if (dados.arquivoContrato && dados.arquivoContrato.base64) {
      var idDaPastaPai = "1suzcg7X3weWwFU44TM9MauYu63jddAxP"; 
      var pastaPai = DriveApp.getFolderById(idDaPastaPai);

      // Nome da pasta ex: 606_14010041722
      var nomePastaSub = String(dados.apto || "").trim() + "_" + cpfLimpoEntrada;
      
      // Busca a pasta do apartamento ou cria se não existir
      var pastasExistentes = pastaPai.getFoldersByName(nomePastaSub);
      var pastaDestino = pastasExistentes.hasNext() ? pastasExistentes.next() : pastaPai.createFolder(nomePastaSub);

      // Formata o nome do arquivo para: DD_MM_AAAA_nome_original.pdf
      var dataPrefixArquivo = Utilities.formatDate(dataEnvio, Session.getScriptTimeZone(), "dd_MM_yyyy");
      var nomeArquivoFinal = dataPrefixArquivo + "_" + dados.arquivoContrato.name;

      var blob = Utilities.newBlob(
        Utilities.base64Decode(dados.arquivoContrato.base64),
        dados.arquivoContrato.type,
        nomeArquivoFinal
      );
      var arquivoSalvo = pastaDestino.createFile(blob);
      
      try {
        arquivoSalvo.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);
        if (EMAIL_CONTRATO_COMPARTILHADO && EMAIL_CONTRATO_COMPARTILHADO !== "SEU_EMAIL_AQUI@DOMINIO.COM") {
          arquivoSalvo.addViewer(EMAIL_CONTRATO_COMPARTILHADO);
        }
      } catch (e) {}

      linkNovo = arquivoSalvo.getUrl();
    }

    if (linkNovo && linkNovo !== "-") {
      var dataFormatadaLink = Utilities.formatDate(dataEnvio, Session.getScriptTimeZone(), "dd/MM/yyyy");
      var textoAmigavelNovo = "Contrato_" + dataFormatadaLink;
      
      listaDeLinks = listaDeLinks.filter(function(item) { return item.url !== linkNovo; });
      listaDeLinks.push({ texto: textoAmigavelNovo, url: linkNovo });
    }

    // ==========================================
    // 3. EXCLUSÃO NO GOOGLE DRIVE DOS CONTRATOS REMOVIDOS
    // ==========================================
    urlsAntigasNaCelula.forEach(function(urlAntiga) {
      var aindaExiste = listaDeLinks.some(function(item) { return item.url === urlAntiga; });
      if (!aindaExiste) {
        try {
          var matchId = urlAntiga.match(/[-\w]{25,}/);
          if (matchId) {
            DriveApp.getFileById(matchId[0]).setTrashed(true);
          }
        } catch (e) {
          // Arquivo já excluído ou sem permissão
        }
      }
    });

    var alteracoesDoEnvio = [];
    if (ehAtualizacao) {
      var dadosAntigosGeral = abaGeral.getRange(1, coluna, 20, 1).getDisplayValues();
      
      var mapaCamposGeral = [
        { label: "Apto", idx: 1, novo: dados.apto },
        { label: "Identificação do imóvel", idx: 2, novo: dados.tipoResidente },
        { label: "Nome do responsável", idx: 3, novo: nomeFormatado },
        { label: "CPF", idx: 4, novo: dados.moradorCpf },
        { label: "Data de nascimento", idx: 5, novo: dataNascTratada },
        { label: "Identidade RG", idx: 6, novo: dados.moradorRg },
        { label: "Orgão emissor", idx: 7, novo: dados.moradorOrgaoEmissor },
        { label: "Celular", idx: 8, novo: dados.moradorCelular },
        { label: "Telefone residencial / comercial", idx: 9, novo: dados.moradorTel },
        { label: "E-mail", idx: 10, novo: dados.moradorEmail },
        { label: "Nome do proprietário / administradora", idx: 12, novo: dados.inqPropAdmin },
        { label: "Contato do proprietário / administradora", idx: 13, novo: dados.inqContato },
        { label: "Vigência do contrato", idx: 14, novo: dados.inqVigencia },
        { label: "Cópia do contrato (PDF)", idx: 15, novo: linkNovo !== "-" ? "Enviado" : "" },
        { label: "Observações", idx: 17, novo: dados.observacoes }
      ];

      mapaCamposGeral.forEach(function(item) {
        var valAntigo = (dadosAntigosGeral[item.idx][0] || "").trim();
        var valNovo = (item.novo || "").trim();
        
        if (item.label === "CPF") {
          valAntigo = valAntigo.replace(/\D/g, "");
          valNovo = valNovo.replace(/\D/g, "");
        }

        if (valAntigo !== valNovo && (valAntigo !== "-" || valNovo !== "")) {
          alteracoesDoEnvio.push(item.label);
        }
      });

      var normalizarTexto = function(txt) {
        if (!txt) return "";
        return txt.replace(/\r\n/g, "\n")
                  .split("\n")
                  .map(function(l) { 
                    return l.split("|")
                            .map(function(c) { return c.trim(); })
                            .join(" | "); 
                  })
                  .map(function(l) { return l.replace(/^[\|\s]+|[\|\s]+$/g, ""); })
                  .filter(function(l) { return l !== "" && l !== " | " && l !== "||"; })
                  .sort()
                  .join("\n").trim();
      };

      var checarAba = function(nomesAba, dadosNovos, label, tamGrupo, linhaIni) {
        var aba = obterAba(ss, nomesAba[0], nomesAba[1]);
        var antigo = normalizarTexto(lerItensMultiplos(aba, coluna, 10, tamGrupo || 4, linhaIni));
        var novo = normalizarTexto(dadosNovos);
        if (antigo !== novo) {
          alteracoesDoEnvio.push(label);
        }
      };

      checarAba(["Emergências", "Emergencia"], dados.emergenciasList, "Emergências", 4, 7);
      checarAba(["Ocupantes", "Ocupante"], dados.ocupantesList, "Ocupantes", 4, 7);
      checarAba(["Carros", "Carro"], dados.carrosList, "Carros", 3, 10);
      checarAba(["Motos", "Moto"], dados.motosList, "Motos", 3, 10);
      checarAba(["Bicicletas", "Bicicleta"], dados.bikesList, "Bicicletas", 2, 7);
      checarAba(["Pets", "Pet"], dados.petsList, "Pets", 3, 7);
      checarAba(["Prestadores", "Prestador"], dados.prestadorList, "Prestadores", 5, 7);
    }

    var vagaNumeroAndarStr = "";
    var numTela = String(dados.vagaNumero || "").trim();
    var andarTela = String(dados.vagaAndar || "").trim();

    if (numTela && andarTela) {
      vagaNumeroAndarStr = numTela + " / " + andarTela;
    } else if (numTela) {
      vagaNumeroAndarStr = numTela;
    }

    var cpfFormatadoTexto = "'" + (dados.moradorCpf ? String(dados.moradorCpf).trim() : "-");
    var dataNascFormatadaTexto = dataNascTratada ? "'" + dataNascTratada : "";

    var cabecalhoComum = [
      [dataEnvio],                                       
      [dados.apto],                                      
      [dados.tipoResidente || "-"],                      
      [nomeFormatado],                                  
      [cpfFormatadoTexto]                                
    ];

    var cabecalhoVeiculos = [
      cabecalhoComum[0],                                 
      cabecalhoComum[1],                                 
      cabecalhoComum[2],                                 
      cabecalhoComum[3],                                 
      cabecalhoComum[4],                                 
      [vagaNumeroAndarStr],                              
      [dados.vagaSituacao || ""],                        
      [dados.vagaAptoRelacionado || ""],                 
      [""],                                              
      [""]                                               
    ];

    // Grava as linhas 1 a 15
    var dadosGeralParte1 = [
      cabecalhoComum[0],                                 // L1
      cabecalhoComum[1],                                 // L2
      cabecalhoComum[2],                                 // L3
      cabecalhoComum[3],                                 // L4
      cabecalhoComum[4],                                 // L5
      [dataNascFormatadaTexto],                          // L6
      [dados.moradorRg || ""],                           // L7
      [dados.moradorOrgaoEmissor || ""],                 // L8
      [dados.moradorCelular || ""],                      // L9
      [dados.moradorTel || ""],                          // L10
      [dados.moradorEmail || ""],                        // L11
      [""],                                              // L12
      [dados.inqPropAdmin || ""],                        // L13
      [dados.inqContato || ""],                          // L14
      [dados.inqVigencia || ""]                          // L15
    ];

    abaGeral.getRange(1, coluna, dadosGeralParte1.length, 1).setValues(dadosGeralParte1);

    // Grava apenas as linhas 18 e 19 (deixa a linha 20 em diante livre para logs)
    var dadosGeralParte2 = [
      [dados.observacoes || ""],                         // L18
      [""]                                               // L19
    ];
    abaGeral.getRange(18, coluna, dadosGeralParte2.length, 1).setValues(dadosGeralParte2);

    // ==========================================
    // 4. GRAVAÇÃO DO RICHTEXT ATUALIZADO NA LINHA 16
    // ==========================================
    if (listaDeLinks.length > 0) {
      var textoCompleto = listaDeLinks.map(function(item) {
        return item.texto;
      }).join(" | ");

      var builder = SpreadsheetApp.newRichTextValue();
      builder.setText(textoCompleto);

      var cursor = 0;
      for (var l = 0; l < listaDeLinks.length; l++) {
        var item = listaDeLinks[l];
        var txtLink = item.texto;
        var urlTarget = (item.url || "").trim();

        var startIdx = textoCompleto.indexOf(txtLink, cursor);
        
        if (startIdx !== -1 && urlTarget.startsWith("http")) {
          var endIdx = startIdx + txtLink.length;
          builder.setLinkUrl(startIdx, endIdx, urlTarget);
          cursor = endIdx;
        }
      }

      celulaContrato.clearContent();
      celulaContrato.clearFormat();
      celulaContrato.setRichTextValue(builder.build());
    } else {
      celulaContrato.clearContent();
      celulaContrato.setValue("");
    }

    // ==========================================
    // 5. REGISTRO DE LOGS (mais recente primeiro)
    // ==========================================
    var maxLinhasLog = Math.max(1, abaGeral.getMaxRows() - 19);
    var rangeLog = abaGeral.getRange(20, coluna, maxLinhasLog, 1);
    var valoresLog = rangeLog.getDisplayValues();

    var logsJaExistentes = [];
    for (var i = 0; i < valoresLog.length; i++) {
      if (String(valoresLog[i][0] || "").trim() !== "") {
        logsJaExistentes.push(valoresLog[i][0]);
      }
    }

    var dataHoraStr = Utilities.formatDate(dataEnvio, ss.getSpreadsheetTimeZone(), "dd/MM/yyyy HH:mm");
    var textoEvento = !ehAtualizacao 
      ? "Novo cadastro realizado" 
      : (alteracoesDoEnvio.length > 0 ? "Alterou: " + alteracoesDoEnvio.join(", ") : "Reenviado sem alterações");

    var entradaNovoLog = "[" + dataHoraStr + "] " + textoEvento + " (CPF: " + (dados.moradorCpf || "-") + ")";

    var logsOrdenadosNovos = [entradaNovoLog].concat(logsJaExistentes);
    if (logsOrdenadosNovos.length > maxLinhasLog) {
      logsOrdenadosNovos = logsOrdenadosNovos.slice(0, maxLinhasLog);
    }

    rangeLog.clearContent();
    if (logsOrdenadosNovos.length > 0) {
      abaGeral.getRange(20, coluna, logsOrdenadosNovos.length, 1).setValues(logsOrdenadosNovos.map(function(item) {
        return [item];
      }));
    }

    // ==========================================
    // 6. SALVAMENTO NAS ABAS SECUNDÁRIAS
    // ==========================================
    salvarAbaRepetitiva(ss, ["Emergências", "Emergencia"], coluna, cabecalhoComum, dados.emergenciasList, 10, 4, 7);
    salvarAbaRepetitiva(ss, ["Ocupantes", "Ocupante"], coluna, cabecalhoComum, dados.ocupantesList, 10, 4, 7);
    salvarAbaRepetitiva(ss, ["Carros", "Carro"], coluna, cabecalhoVeiculos, dados.carrosList, 10, 3, 10);
    salvarAbaRepetitiva(ss, ["Motos", "Moto"], coluna, cabecalhoVeiculos, dados.motosList, 10, 3, 10);
    salvarAbaRepetitiva(ss, ["Bicicletas", "Bicicleta"], coluna, cabecalhoComum, dados.bikesList, 10, 2, 7);
    salvarAbaRepetitiva(ss, ["Pets", "Pet"], coluna, cabecalhoComum, dados.petsList, 10, 3, 7);
    salvarAbaRepetitiva(ss, ["Prestadores", "Prestador"], coluna, cabecalhoComum, dados.prestadorList, 10, 5, 7);

    // ==========================================
    // 7. ORDENAÇÃO CONSISTENTE ENTRE AS ABAS
    // ==========================================
    ordenarAbaPorColunasApto(abaGeral, true);

    var nomesAbasSecundarias = [
      ["Emergências", "Emergencia"],
      ["Ocupantes", "Ocupante"],
      ["Carros", "Carro"],
      ["Motos", "Moto"],
      ["Bicicletas", "Bicicleta"],
      ["Pets", "Pet"],
      ["Prestadores", "Prestador"]
    ];

    nomesAbasSecundarias.forEach(function(parNomes) {
      var abaSec = obterAba(ss, parNomes[0], parNomes[1]);
      if (abaSec) {
        ordenarAbaPorColunasApto(abaSec, false);
      }
    });

    return { 
      sucesso: true, 
      mensagem: ehAtualizacao ? "Cadastro atualizado com sucesso!" : "Cadastro salvo com sucesso!" 
    };
  } catch (erro) {
    return { sucesso: false, mensagem: "Erro ao processar: " + erro.toString() };
  } finally {
    lock.releaseLock();
  }
}