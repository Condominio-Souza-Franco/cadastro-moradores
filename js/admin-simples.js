(function() {
  function popularAptosFallback() {
    var select = document.getElementById("aptoAdmin");
    if (!select) return;

    select.innerHTML = "";
    select.add(new Option("Selecione...", ""));

    for (var andar = 2; andar <= 8; andar++) {
      for (var pos = 1; pos <= 6; pos++) {
        var numApto = String(andar) + "0" + String(pos);
        select.add(new Option(numApto, numApto + "__1"));
      }
    }

    select.add(new Option("901", "901__1"));
  }

  function popularAptosComInventario(itens) {
    var select = document.getElementById("aptoAdmin");
    if (!select) return;

    select.innerHTML = "";
    select.add(new Option("Selecione...", ""));

    (Array.isArray(itens) ? itens : []).forEach(function(item) {
      if (!item || !item.apto) return;

      var total = parseInt(item.totalRegistros, 10) || 0;
      if (total <= 0) {
        var optionVazia = new Option(item.apto + " (sem cadastro)", "");
        optionVazia.disabled = true;
        select.add(optionVazia);
        return;
      }

      var opcoes = Array.isArray(item.opcoes) ? item.opcoes : [];
      if (opcoes.length === 0) {
        var valorPadrao = item.apto + "__1";
        select.add(new Option(item.apto, valorPadrao));
        return;
      }

      opcoes.forEach(function(opcao) {
        var ocorrencia = parseInt(opcao && opcao.ocorrencia, 10) || 1;
        var label = String((opcao && opcao.label) || item.apto).trim();
        var valor = item.apto + "__" + ocorrencia;
        select.add(new Option(label, valor));
      });
    });
  }

  function carregarAptosDoServidor() {
    if (typeof WEB_APP_URL === "undefined" || !WEB_APP_URL) {
      setStatus("URL do backend não encontrada. Usando lista padrão.", "erro");
      return;
    }

    return fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({ funcao: "listarApartamentosParaAdminSimples" })
    })
      .then(function(response) {
        return response.text().then(function(texto) {
          var conteudo = String(texto || "").trim();
          if (!response.ok) {
            throw new Error("Backend indisponível (HTTP " + response.status + ").");
          }

          if (!conteudo || conteudo.charAt(0) !== "{") {
            throw new Error("Backend não retornou JSON válido.");
          }

          return JSON.parse(conteudo);
        });
      })
      .then(function(resposta) {
        if (resposta && resposta.sucesso && Array.isArray(resposta.itens)) {
          popularAptosComInventario(resposta.itens);
          setStatus("Lista de apartamentos carregada.", "ok");
          return;
        }

        popularAptosFallback();
        setStatus("Lista local carregada.", "ok");
      })
      .catch(function(erro) {
        popularAptosFallback();
        setStatus("Backend indisponível. Lista local carregada.", "erro");
      });
  }

  function setStatus(texto, tipo) {
    var status = document.getElementById("statusAdmin");
    if (!status) return;
    status.className = "status" + (tipo ? " " + tipo : "");
    status.textContent = texto || "";
  }

  function textoLimpo(valor) {
    return String(valor || "").trim();
  }

  function escaparHtml(valor) {
    return String(valor || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizarCampo(valor) {
    var texto = textoLimpo(valor);
    return texto ? texto : "Não preenchido";
  }

  function normalizarTelefoneParaHref(valor) {
    var texto = String(valor || "").trim();
    if (!texto || /[a-z]/i.test(texto) || texto.indexOf("@") !== -1) return "";

    var apenasTelefone = /^[\d\s()+\-.]+$/.test(texto);
    if (!apenasTelefone) return "";

    var digitos = texto.replace(/\D+/g, "");
    if (digitos.length < 10 || digitos.length > 13) return "";

    if (digitos.length === 10 || digitos.length === 11) {
      return "tel:+55" + digitos;
    }

    return "tel:+" + digitos;
  }

  function renderizarTelefonesHtml(valor) {
    var texto = textoLimpo(valor);
    if (!texto) return "Não preenchido";

    var regexTelefone = /(?:\+?\d[\d\s().\-]{8,}\d)/g;
    var html = "";
    var ultimoIndice = 0;
    var encontrouTelefone = false;

    texto.replace(regexTelefone, function(matched, indice) {
      var href = normalizarTelefoneParaHref(matched);
      if (!href) return matched;

      encontrouTelefone = true;
      html += escaparHtml(texto.slice(ultimoIndice, indice));
      html += '<a class="campo-link-telefone" href="' + href + '">' + escaparHtml(matched) + '</a>';
      ultimoIndice = indice + matched.length;
      return matched;
    });

    if (!encontrouTelefone) {
      return escaparHtml(texto);
    }

    html += escaparHtml(texto.slice(ultimoIndice));
    return html;
  }

  function estaVazio(valor) {
    return !textoLimpo(valor);
  }

  function formatarDataBr(valor) {
    var texto = textoLimpo(valor);
    if (!texto) return "";

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
      return texto;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
      var partesIso = texto.split("-");
      return partesIso[2] + "/" + partesIso[1] + "/" + partesIso[0];
    }

    var data = new Date(texto);
    if (!isNaN(data.getTime())) {
      var dia = String(data.getDate()).padStart(2, "0");
      var mes = String(data.getMonth() + 1).padStart(2, "0");
      var ano = String(data.getFullYear());
      return dia + "/" + mes + "/" + ano;
    }

    return texto;
  }

  function calcularIdade(dataBr) {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dataBr)) return null;

    var partes = dataBr.split("/");
    var dia = parseInt(partes[0], 10);
    var mes = parseInt(partes[1], 10) - 1;
    var ano = parseInt(partes[2], 10);
    var nascimento = new Date(ano, mes, dia);
    if (isNaN(nascimento.getTime())) return null;

    var hoje = new Date();
    var idade = hoje.getFullYear() - nascimento.getFullYear();
    var mesDiff = hoje.getMonth() - nascimento.getMonth();
    if (mesDiff < 0 || (mesDiff === 0 && hoje.getDate() < nascimento.getDate())) {
      idade -= 1;
    }

    return idade >= 0 ? idade : null;
  }

  function formatarNascimentoComIdade(valor) {
    var dataBr = formatarDataBr(valor);
    if (!dataBr) return "";

    var idade = calcularIdade(dataBr);
    if (idade === null) return dataBr;
    return dataBr + " (" + idade + " anos)";
  }

  function campoHtml(titulo, valor) {
    var vazio = estaVazio(valor);
    var valorFinal = normalizarCampo(valor);
    var tituloTexto = String(titulo || "");
    var ehTelefone = /telefone|celular/i.test(tituloTexto);
    var valorHtml = ehTelefone ? renderizarTelefonesHtml(valor) : escaparHtml(valorFinal);

    return '<div class="campo' + (vazio ? ' vazio' : '') + '"><p class="campo-titulo">' + escaparHtml(tituloTexto) + '</p><p class="campo-valor">' + valorHtml + '</p></div>';
  }

  function situacaoVagaHtml(situacao, aptoRelacionado) {
    var textoSituacao = textoLimpo(situacao);
    var textoApto = textoLimpo(aptoRelacionado);

    if (!textoSituacao && !textoApto) {
      return '<div class="campo vazio campo-frase"><p class="campo-valor">Não preenchido</p></div>';
    }

    if (!textoApto) {
      return '<div class="campo campo-frase"><p class="campo-valor">' + escaparHtml(textoSituacao || "Não preenchido") + '</p></div>';
    }

    var base = textoSituacao ? textoSituacao.replace(/\s+o\s*$/i, "") : "Minha vaga está alugada para";
    return '<div class="campo campo-frase"><p class="campo-valor">' + escaparHtml(base) + ' o <strong>' + escaparHtml(textoApto) + '</strong></p></div>';
  }

  function secaoHtml(titulo, camposHtml) {
    return '<section class="secao"><h2>' + titulo + '</h2><div class="grid-campos">' + camposHtml.join("") + '</div></section>';
  }

  function extrairCamposLinha(valor, quantidade) {
    var texto = textoLimpo(valor);
    if (!texto) {
      return new Array(quantidade).fill("");
    }

    var partes = texto.split(/\s*\|\s*/);
    while (partes.length < quantidade) {
      partes.push("");
    }
    return partes.slice(0, quantidade);
  }

  function registroEmBoxes(titulo, linhas, nomesCampos) {
    var lista = Array.isArray(linhas) ? linhas : [];
    if (!lista.length) {
      return '<div class="subsecao"><h3>' + titulo + '</h3><p class="sem-itens">Não preenchido</p></div>';
    }

    var html = ['<div class="subsecao"><h3>' + titulo + '</h3><div class="registro-lista">'];
    lista.forEach(function(linha, indice) {
      var campos = extrairCamposLinha(linha, nomesCampos.length);
      html.push('<div class="registro-bloco"><div class="registro-titulo">' + titulo + ' ' + (indice + 1) + '</div><div class="grid-campos">');
      nomesCampos.forEach(function(nomeCampo, idx) {
        html.push(campoHtml(nomeCampo, campos[idx]));
      });
      html.push('</div></div>');
    });
    html.push('</div></div>');
    return html.join('');
  }

  function renderizarDados(dados) {
    var resultado = document.getElementById("resultadoAdmin");
    if (!resultado) return;

    resultado.classList.remove("vazio");

    var secoes = [];
    var camposPrincipaisUnidade = [
      campoHtml("Apartamento", dados.apto),
      campoHtml("Tipo", dados.tipo),
      campoHtml("Nome", dados.nome),
      campoHtml("CPF", dados.cpf),
      campoHtml("Nascimento", formatarNascimentoComIdade(dados.nasc)),
      campoHtml("RG", dados.rg),
      campoHtml("Orgão emissor", dados.orgaoEmissor),
      campoHtml("Celular", dados.celular),
      campoHtml("Telefone", dados.telFixo),
      campoHtml("E-mail", dados.email)
    ];

    secoes.push(
      '<section class="secao">' +
        '<h2>Dados da unidade</h2>' +
        '<div class="grid-campos">' + camposPrincipaisUnidade.join("") + '</div>' +
          registroEmBoxes("Em caso de emergência procurar por", dados.emergencias ? dados.emergencias.split("\n") : [], ["Nome", "Telefone/Celular", "Endereço", "Vínculo/Parentesco"]) +
          registroEmBoxes("Demais Ocupantes", dados.ocupantes ? dados.ocupantes.split("\n") : [], ["Nome", "Telefone/Celular", "Data de nascimento", "Vínculo/Parentesco"]) +
      '</section>'
    );

    var ehInquilino = textoLimpo(dados.tipo) === "Inquilino";
    if (ehInquilino) {
      secoes.push('<section class="secao"><h2>Locação</h2><div class="grid-campos">' + [
          campoHtml("Nome do Proprietário/Administradora", dados.inqPropAdmin),
          campoHtml("Contato do Proprietário/Administradora (Telefone/Celular/E-mail)", dados.inqContato),
          campoHtml("Vigência do Contrato", dados.inqVigencia)
      ].join("") + '</div></section>');
    }

    secoes.push('<section class="secao"><h2>Dados complementares</h2>' +
      situacaoVagaHtml(dados.vagaSituacao, dados.vagaAptoRelacionado) +
      registroEmBoxes("Carros", dados.carros ? dados.carros.split("\n") : [], ["Marca e modelo", "Cor", "Placa"]) +
      registroEmBoxes("Motos", dados.motos ? dados.motos.split("\n") : [], ["Marca e modelo", "Cor", "Placa"]) +
      registroEmBoxes("Bicicletas", dados.bikes ? dados.bikes.split("\n") : [], ["Marca", "Cor"]) +
        registroEmBoxes("Pets", dados.pets ? dados.pets.split("\n") : [], ["Nome", "Espécie e raça", "Porte"]) +
      registroEmBoxes("Prestadores", dados.prestadores ? dados.prestadores.split("\n") : [], ["Nome", "Serviço", "Telefone/Celular", "Possui chave?"]) +
      '<div class="subsecao"><h3>Observações</h3>' + campoHtml("Observações", dados.observacoes) + '</div>' +
      '</section>');

    var historico = Array.isArray(dados.historicoContratos) ? dados.historicoContratos : [];
    if (historico.length > 0) {
      var contratosHtml = ['<section class="secao"><h2>Contratos</h2><ul class="lista-contratos">'];
      historico.forEach(function(item) {
        var texto = textoLimpo(item && item.texto);
        var url = textoLimpo(item && item.url);
        var legenda = texto || "Contrato";
        var conteudo = url ? '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + legenda + '</a>' : legenda;
        contratosHtml.push("<li>" + conteudo + "</li>");
      });
      contratosHtml.push("</ul></section>");
      secoes.push(contratosHtml.join(""));
    }

    resultado.innerHTML = secoes.join("");
  }

  function buscarPorApartamento() {
    var select = document.getElementById("aptoAdmin");
    var valorSelecionado = select ? String(select.value || "") : "";
    if (!valorSelecionado) {
      setStatus("Selecione um apartamento.", "erro");
      return;
    }

    var partesSelecao = valorSelecionado.split("__");
    var apto = String(partesSelecao[0] || "").trim();
    var ocorrencia = parseInt(partesSelecao[1], 10);
    if (isNaN(ocorrencia) || ocorrencia < 1) {
      ocorrencia = 1;
    }

    setStatus("Carregando...", "");

    function chamarFuncao(nomeFuncao) {
      return fetch(WEB_APP_URL, {
        method: "POST",
        body: JSON.stringify({
          funcao: nomeFuncao,
          apto: apto,
          ocorrencia: ocorrencia
        })
      }).then(function(response) {
        return response.text().then(function(texto) {
          var conteudo = String(texto || "").trim();
          if (!response.ok) {
            throw new Error("Backend indisponível (HTTP " + response.status + ").");
          }

          if (!conteudo || conteudo.charAt(0) !== "{") {
            throw new Error("Backend não retornou JSON válido.");
          }

          return JSON.parse(conteudo);
        });
      });
    }

    chamarFuncao("buscarDadosPorApartamentoSimples")
      .then(function(resposta) {
        var msg = String((resposta && resposta.mensagem) || "");
        if (msg.indexOf("Função não encontrada") !== -1) {
          return chamarFuncao("buscarDadosPorApartamento");
        }
        return resposta;
      })
      .then(function(respostaFinal) {
        if (!respostaFinal || !respostaFinal.encontrado) {
          var msgFinal = String((respostaFinal && respostaFinal.mensagem) || "");
          if (msgFinal.indexOf("Função não encontrada") !== -1) {
            setStatus("Função de consulta por apartamento ainda não está publicada no Apps Script. Publique uma nova versão do Web App e tente novamente.", "erro");
            return;
          }

          setStatus(msgFinal || "Apartamento não encontrado.", "erro");
          var resultado = document.getElementById("resultadoAdmin");
          if (resultado) {
            resultado.classList.add("vazio");
            resultado.innerHTML = "";
          }
          return;
        }

        setStatus("Dados carregados com sucesso.", "ok");
        renderizarDados(respostaFinal.dados || {});
      })
      .catch(function(err) {
        setStatus("Backend indisponível. Não foi possível buscar os dados.", "erro");
      });
  }

  document.addEventListener("DOMContentLoaded", function() {
    // Sempre popula imediatamente para nunca deixar o menu vazio.
    popularAptosFallback();
    carregarAptosDoServidor();
    var botao = document.getElementById("btnBuscarApto");
    if (botao) {
      botao.addEventListener("click", buscarPorApartamento);
    }
  });
})();