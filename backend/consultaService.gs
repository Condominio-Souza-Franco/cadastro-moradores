// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================
function lerDadoUnicoAba(aba, colunaIdx, linhaIdx) {
  if (!aba) return "";
  try {
    let valor = aba.getRange(linhaIdx, colunaIdx).getValue();
    let valStr = String(valor || "").trim();
    if (valStr.startsWith("'")) valStr = valStr.substring(1).trim();
    return valStr === "-" ? "" : valStr;
  } catch (e) {
    return "";
  }
}

// Função auxiliar para padronizar qualquer tipo de data vinda do Google Sheets para DD/MM/AAAA
function formatarDataPlanilhaParaString(valorCelula) {
  return normalizarDataBrasileira(valorCelula);
}

function extrairLinksContratoDaCelula(celulaContratoRef) {
  const listaContratosHistorico = [];

  try {
    const richTextContrato = celulaContratoRef.getRichTextValue();
    if (richTextContrato) {
      const runs = richTextContrato.getRuns();
      for (let r = 0; r < runs.length; r++) {
        const run = runs[r];
        const textoRun = String(run.getText() || "").replace(/\n/g, "").trim();
        const urlRun = String(run.getLinkUrl() || "").trim();

        if (!textoRun || textoRun === "|" || textoRun === "") {
          continue;
        }

        if (urlRun && urlRun.startsWith("http")) {
          listaContratosHistorico.push({ texto: textoRun, url: urlRun });
        } else if (textoRun.startsWith("http")) {
          const matchData = textoRun.match(/\d{2}\/\d{2}\/\d{4}/);
          const txtAmigavel = matchData ? "Contrato_" + matchData[0] : "Contrato_Anterior";
          listaContratosHistorico.push({ texto: txtAmigavel, url: textoRun });
        }
      }
    }

    if (listaContratosHistorico.length === 0) {
      const textoPuroAntigo = String(celulaContratoRef.getValue() || "").trim();
      if (textoPuroAntigo && textoPuroAntigo !== "-") {
        const itensPuros = textoPuroAntigo.split(/[\n\|]+/);
        for (let lp = 0; lp < itensPuros.length; lp++) {
          const itemTrim = String(itensPuros[lp] || "").trim();
          if (!itemTrim || itemTrim === "-" || itemTrim === "|") {
            continue;
          }

          const urlMatch = itemTrim.match(/https?:\/\/[^\s]+/);
          const urlExtraida = urlMatch ? urlMatch[0] : itemTrim;
          const matchData = itemTrim.match(/\d{2}\/\d{2}\/\d{4}/);
          const txtAmigavel = matchData ? "Contrato_" + matchData[0] : "Contrato_Anterior";

          if (urlExtraida.startsWith("http")) {
            listaContratosHistorico.push({ texto: txtAmigavel, url: urlExtraida });
          }
        }
      }
    }
  } catch (e) {
    return [];
  }

  return listaContratosHistorico;
}

// ==========================================
// VALIDAÇÃO DA CONSULTA NO SERVIDOR
// ==========================================
function validarConsultaCpfESeguranca(cpfInput, dataNascInformada) {
  if (!cpfInput || typeof cpfInput !== "string") {
    return { ok: false, mensagem: "CPF inválido ou não informado." };
  }

  var cpfDigitos = String(cpfInput).replace(/\D/g, "").trim();
  if (cpfDigitos.length !== 11) {
    return { ok: false, mensagem: "CPF inválido ou não informado." };
  }

  var dataNormalizada = normalizarDataBrasileira(dataNascInformada || "");
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dataNormalizada)) {
    return { ok: false, mensagem: "Data de nascimento inválida." };
  }

  return { ok: true, cpfDigitos: cpfDigitos, dataNormalizada: dataNormalizada };
}

// ==========================================
// CONSULTA COMPLETA DE DADOS POR CPF (GABARITO OFICIAL)
// ==========================================
function buscarDadosPorCpfESeguranca(cpfInput, dataNascInformada) {
  try {
    var validacaoConsulta = validarConsultaCpfESeguranca(cpfInput, dataNascInformada);
    if (!validacaoConsulta.ok) {
      return { encontrado: false, mensagem: validacaoConsulta.mensagem };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetGeral = ss.getSheetByName("Geral");
    if (!sheetGeral) {
      return { encontrado: false, mensagem: "Aba 'Geral' não encontrada." };
    }

    const ultimaColuna = sheetGeral.getLastColumn();
    if (ultimaColuna < 2) {
      return { encontrado: false, mensagem: "Nenhum cadastro encontrado na base de dados." };
    }

    const cpfBuscaStr = String(cpfInput || "").trim();
    const dataNascBuscaLimpa = validacaoConsulta.dataNormalizada;

    // Pega a linha 5 (CPF) e a linha 6 (Data de Nascimento)
    const dadosGeralMatriz = sheetGeral.getRange(5, 1, 2, ultimaColuna).getValues();
    const cpfsLinha = dadosGeralMatriz[0]; 
    const datasNascLinha = dadosGeralMatriz[1]; 

    // Começa do índice 1 (Coluna B em diante)
    for (let col = 1; col < cpfsLinha.length; col++) {
      let valorCelulaCpf = String(cpfsLinha[col] || "").trim();

      if (valorCelulaCpf.startsWith("'")) {
        valorCelulaCpf = valorCelulaCpf.substring(1).trim();
      }

      let cpfBuscaDigitos = cpfBuscaStr.replace(/\D/g, "");
      let cpfCelulaDigitos = valorCelulaCpf.replace(/\D/g, "");

      if (valorCelulaCpf === cpfBuscaStr || (cpfBuscaDigitos.length === 11 && cpfCelulaDigitos === cpfBuscaDigitos)) {
        
        // Formata corretamente a data extraída da linha 6 da planilha
        let dataNascPlanilhaStr = formatarDataPlanilhaParaString(datasNascLinha[col]);

        if (dataNascBuscaLimpa && dataNascPlanilhaStr && dataNascBuscaLimpa !== dataNascPlanilhaStr) {
          return { 
            encontrado: false, 
            mensagem: "A data de nascimento não confere com este CPF. Verifique os dados informados." 
          };
        }

        let colunaIdx = col + 1; // Índice real da coluna 1-based
        let colunaCompleta = sheetGeral.getRange(1, colunaIdx, 30, 1).getValues();

        const valorReal = (linhaNumero) => obterValorDaLinhaGeral(colunaCompleta, linhaNumero);

        // ==========================================
        // EXTRAÇÃO ROBUSTA DOS CONTRATOS (LINHA 16)
        // ==========================================
        let celulaContratoRef = sheetGeral.getRange(16, colunaIdx);
        let listaContratosHistorico = extrairLinksContratoDaCelula(celulaContratoRef);

        let abaEmergencia = obterAba(ss, "Emergências", "Emergencia");
        let abaOcupantes = obterAba(ss, "Ocupantes", "Ocupante");
        let abaCarros = obterAba(ss, "Carros", "Carro");
        let abaMotos = obterAba(ss, "Motos", "Moto");
        let abaBikes = obterAba(ss, "Bicicletas", "Bicicleta");
        let abaPets = obterAba(ss, "Pets", "Pet");
        let abaPrestadores = obterAba(ss, "Prestadores", "Prestador");

        return {
          encontrado: true,
          dados: {
            apto: valorReal(MAPA_GERAL.apto),
            tipo: valorReal(MAPA_GERAL.tipoResidente),
            nome: valorReal(MAPA_GERAL.nome),
            cpf: valorCelulaCpf,
            nasc: dataNascPlanilhaStr,
            rg: valorReal(MAPA_GERAL.rg),
            orgaoEmissor: valorReal(MAPA_GERAL.orgaoEmissor),
            celular: valorReal(MAPA_GERAL.celular),
            telFixo: valorReal(MAPA_GERAL.telFixo),
            email: valorReal(MAPA_GERAL.email),
            inqPropAdmin: valorReal(MAPA_GERAL.inqPropAdmin),
            inqContato: valorReal(MAPA_GERAL.inqContato),
            inqVigencia: valorReal(MAPA_GERAL.vigencia),

            // Retorna o array limpo de objetos em ambos os nomes para evitar incompatibilidades
            linkContratoHistorico: listaContratosHistorico,
            historicoContratos: listaContratosHistorico,

            observacoes: valorReal(MAPA_GERAL.observacoes),
            
            vagaSituacao: lerDadoUnicoAba(abaCarros, colunaIdx, 7),     
            vagaAptoRelacionado: lerDadoUnicoAba(abaCarros, colunaIdx, 8), 

            emergencias: lerItensMultiplos(abaEmergencia, colunaIdx, 3, 4, 7),   
            ocupantes: lerItensMultiplos(abaOcupantes, colunaIdx, 5, 4, 7),      
            carros: lerItensMultiplos(abaCarros, colunaIdx, 4, 3, 10),         
            motos: lerItensMultiplos(abaMotos, colunaIdx, 4, 3, 10),            
            bikes: lerItensMultiplos(abaBikes, colunaIdx, 5, 2, 7),             
            pets: lerItensMultiplos(abaPets, colunaIdx, 5, 3, 7),               
            prestadores: lerItensMultiplos(abaPrestadores, colunaIdx, 5, 4, 7)   
          }
        };
      }
    }

    return { encontrado: false, mensagem: "CPF não localizado na base de dados." };

  } catch (error) {
    throw new Error("Erro ao consultar dados: " + error.message);
  }
}