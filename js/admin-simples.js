(function() {
  var appInicializado = false;

  // Register early so we don't miss auth events fired during DOMContentLoaded in other scripts.
  window.addEventListener("admin-auth-success", iniciarAppAdmin);
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
    select.disabled = false;
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

    select.disabled = false;
  }

  function carregarAptosDoServidor() {
    var select = document.getElementById("aptoAdmin");
    if (select) select.disabled = true;
    setStatus("", "");

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
        if (resposta && Array.isArray(resposta.itens) && resposta.itens.length > 0) {
          popularAptosComInventario(resposta.itens);
          return resposta;
        }

        popularAptosFallback();
        return resposta;
      })
      .catch(function() {
        popularAptosFallback();
      });
  }

  function setStatus(texto, tipo) {
    var status = document.getElementById("statusAdmin");
    if (!status) return;
    status.className = "status" + (tipo ? " " + tipo : "");
    status.textContent = texto || "";
  }

  function setOverlayAdmin(visivel, mensagem) {
    var overlay = document.getElementById("overlayProcessamento");
    var mensagemEl = document.getElementById("overlayProcessamentoMensagem");
    if (!overlay || !mensagemEl) return;

    if (mensagem) {
      mensagemEl.textContent = mensagem;
    }

    if (visivel) {
      overlay.classList.remove("hidden");
    } else {
      overlay.classList.add("hidden");
    }
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
    if (digitos.length < 8 || digitos.length > 13) return "";

    if (digitos.length === 10 || digitos.length === 11) {
      return "tel:+55" + digitos;
    }

    if (digitos.length === 12 || digitos.length === 13) {
      return "tel:+" + digitos;
    }

    // For short local numbers (8-9 digits), keep plain tel so mobile dialers can still handle them.
    return "tel:" + digitos;
  }

  function renderizarTelefonesHtml(valor) {
    var texto = textoLimpo(valor);
    if (!texto) return "Não preenchido";

    var regexTelefone = /(?:\+?\d[\d\s().\-]{6,}\d)/g;
    var links = [];
    texto.replace(regexTelefone, function(matched) {
      var numero = textoLimpo(matched);
      var href = normalizarTelefoneParaHref(numero);
      if (!href) return matched;
      links.push('<a class="campo-link-telefone" href="' + href + '">' + escaparHtml(numero) + '</a>');
      return matched;
    });

    if (!links.length) {
      return escaparHtml(texto);
    }

    return links.join("<br>");
  }

  function renderizarEnderecosHtml(valor) {
    var texto = textoLimpo(valor);
    if (!texto) return "Não preenchido";

    var partes = texto
      .split(/\s*(?:\n|;|\||\bou\b)\s*/i)
      .map(function(item) { return textoLimpo(item); })
      .filter(function(item) { return !!item; });

    if (!partes.length) {
      return escaparHtml(texto);
    }

    return partes.map(function(endereco) {
      var href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(endereco);
      return '<a class="campo-link-endereco" href="' + href + '" target="_blank" rel="noopener noreferrer">' + escaparHtml(endereco) + '</a>';
    }).join("<br>");
  }

  function renderizarEmailsHtml(valor) {
    var texto = textoLimpo(valor);
    if (!texto) return "Não preenchido";

    var regexEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
    var html = [];
    var ultimoIndice = 0;
    var correspondencia;

    while ((correspondencia = regexEmail.exec(texto)) !== null) {
      html.push(escaparHtml(texto.slice(ultimoIndice, correspondencia.index)));
      var email = correspondencia[0];
      html.push('<a class="campo-link-email" href="mailto:' + escaparHtml(email) + '">' + escaparHtml(email) + '</a>');
      ultimoIndice = correspondencia.index + email.length;
    }

    html.push(escaparHtml(texto.slice(ultimoIndice)));
    return html.join("").replace(/\n/g, "<br>");
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
    var possuiEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(String(valor || ""));
    var ehTelefone = /telefone|celular/i.test(tituloTexto);
    var ehEndereco = /endereco|endereço/i.test(tituloTexto);
    var valorHtml = possuiEmail
      ? renderizarEmailsHtml(valor)
      : (ehTelefone
      ? renderizarTelefonesHtml(valor)
      : (ehEndereco ? renderizarEnderecosHtml(valor) : escaparHtml(valorFinal)));

    return '<div class="campo' + (vazio ? ' vazio' : '') + (ehTelefone ? ' campo-telefone' : '') + '"><p class="campo-titulo">' + escaparHtml(tituloTexto) + '</p><p class="campo-valor">' + valorHtml + '</p></div>';
  }

  function vagaPrincipalHtml(dados) {
    var numero = textoLimpo(dados && dados.vagaNumero);
    var bloco = textoLimpo(dados && dados.vagaBloco);
    var numeroFinal = numero || '9';
    var blocoFinal = bloco || 'G2';
    return '<div class="campo campo-vaga-principal"><p class="campo-valor">Vaga <strong>' + escaparHtml(numeroFinal) + '</strong> no <strong>' + escaparHtml(blocoFinal) + '</strong></p></div>';
  }

  function situacaoVagaHtml(situacao, aptoRelacionado) {
    var textoSituacao = textoLimpo(situacao);
    var textoApto = textoLimpo(aptoRelacionado);

    if (!textoSituacao && !textoApto) {
      return '<div class="campo campo-frase"><p class="campo-valor">Não aluga vaga</p></div>';
    }

    if (!textoApto) {
      return '<div class="campo campo-frase"><p class="campo-valor">' + escaparHtml(textoSituacao || "Não aluga vaga") + '</p></div>';
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

  function registroEmBoxes(titulo, linhas, nomesCampos, opcoes) {
    var lista = Array.isArray(linhas) ? linhas : [];
    var mostrarTitulo = !opcoes || opcoes.tituloVisivel !== false;
    if (!lista.length) {
      return '<div class="subsecao">' + (mostrarTitulo ? '<h3>' + titulo + '</h3>' : '') + '<p class="sem-itens">Não preenchido</p></div>';
    }

    var mostrarTituloNumerico = !opcoes || opcoes.tituloNumerico !== false;
    var ordemCampos = opcoes && Array.isArray(opcoes.ordemCampos) ? opcoes.ordemCampos : null;
    var subsecaoClasse = opcoes && opcoes.classeSubsecao ? String(opcoes.classeSubsecao) : '';
    var html = ['<div class="subsecao' + (subsecaoClasse ? (' ' + subsecaoClasse) : '') + '">' + (mostrarTitulo ? '<h3>' + titulo + '</h3>' : '') + '<div class="registro-lista">'];
    lista.forEach(function(linha, indice) {
      var campos = extrairCamposLinha(linha, nomesCampos.length);
      var tituloRegistro = mostrarTituloNumerico ? String(indice + 1) : (titulo + ' ' + (indice + 1));
      html.push('<div class="registro-bloco"><div class="registro-titulo">' + tituloRegistro + '</div><div class="registro-conteudo"><div class="grid-campos">');
      nomesCampos.forEach(function(nomeCampo, idx) {
        var indiceCampo = ordemCampos && typeof ordemCampos[idx] === "number" ? ordemCampos[idx] : idx;
        html.push(campoHtml(nomeCampo, campos[indiceCampo]));
      });
      html.push('</div></div></div>');
    });
    html.push('</div></div>');
    return html.join('');
  }

  function montarHtmlRegistro(dados, indiceRegistro) {
    var secoes = [];
    var tituloRegistro = indiceRegistro > 0 ? 'Ocorrência ' + (indiceRegistro + 1) : 'Registro';
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

    var logs = Array.isArray(dados.logsAtualizacao)
      ? dados.logsAtualizacao
      : (Array.isArray(dados.logs) ? dados.logs : []);
    var logsHtml = ['<details class="logs-atualizacao"><summary>Clique aqui para visualizar os logs de atualização</summary>'];
    if (logs.length) {
      logsHtml.push('<ul>');
      logs.forEach(function(log) {
        logsHtml.push('<li>' + escaparHtml(log) + '</li>');
      });
      logsHtml.push('</ul>');
    } else {
      logsHtml.push('<p><em>Não preenchido</em></p>');
    }
    logsHtml.push('</details>');

    secoes.push(
      '<div class="registro-cabecalho">' +
        '<div class="data-envio">Data do último envio: <strong>' + escaparHtml(formatarDataBr(dados.dataUltimoEnvio || dados.dataEnvio) || "Não preenchido") + '</strong></div>' +
        logsHtml.join("") +
      '</div>' +
      '<section class="secao">' +
        '<h2>' + tituloRegistro + '</h2>' +
        '<div class="grid-campos">' + camposPrincipaisUnidade.join("") + '</div>' +
      '</section>'
    );

    secoes.push(
      '<section class="secao">' +
        '<h2>Em caso de emergência procurar por</h2>' +
        registroEmBoxes("Em caso de emergência procurar por", dados.emergencias ? dados.emergencias.split("\n") : [], ["Nome", "Telefone/Celular", "Vínculo/Parentesco", "Endereço"], { ordemCampos: [0, 1, 3, 2], classeSubsecao: "subsecao-emergencia", tituloVisivel: false }) +
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

    var historico = Array.isArray(dados.historicoContratos) ? dados.historicoContratos : [];
    if (ehInquilino) {
      var contratosHtml = ['<section class="secao"><h2>Contratos</h2>'];
      if (historico.length > 0) {
        contratosHtml.push('<ul class="lista-contratos">');
        historico.forEach(function(item) {
          var texto = textoLimpo(item && item.texto);
          var url = textoLimpo(item && item.url);
          var legenda = texto || "Contrato";
          var conteudo = url ? '<a href="' + escaparHtml(url) + '" target="_blank" rel="noopener noreferrer">' + escaparHtml(legenda) + '</a>' : escaparHtml(legenda);
          contratosHtml.push("<li>" + conteudo + "</li>");
        });
        contratosHtml.push("</ul>");
      } else {
        contratosHtml.push('<p class="contratos-vazio"><em>Não preenchido</em></p>');
      }
      contratosHtml.push("</section>");
      secoes.push(contratosHtml.join(""));
    }

    secoes.push(
      '<section class="secao">' +
        '<h2>Demais Ocupantes</h2>' +
        registroEmBoxes("Demais Ocupantes", dados.ocupantes ? dados.ocupantes.split("\n") : [], ["Nome", "Telefone/Celular", "Data de nascimento", "Vínculo/Parentesco"], { tituloVisivel: false }) +
      '</section>'
    );

    secoes.push('<section class="secao"><h2>Dados complementares</h2>' +
      '<div class="linha-vaga-topo">' +
        vagaPrincipalHtml(dados) +
        situacaoVagaHtml(dados.vagaSituacao, dados.vagaAptoRelacionado) +
      '</div>' +
      '<div class="subsecoes-lado-a-lado">' +
        registroEmBoxes("Carros", dados.carros ? dados.carros.split("\n") : [], ["Marca e modelo", "Cor", "Placa"]) +
        registroEmBoxes("Motos", dados.motos ? dados.motos.split("\n") : [], ["Marca e modelo", "Cor", "Placa"]) +
        registroEmBoxes("Bicicletas", dados.bikes ? dados.bikes.split("\n") : [], ["Marca", "Cor"]) +
      '</div>' +
      registroEmBoxes("Pets", dados.pets ? dados.pets.split("\n") : [], ["Nome", "Espécie e raça", "Porte"]) +
      registroEmBoxes("Prestadores de serviço", dados.prestadores ? dados.prestadores.split("\n") : [], ["Nome", "Serviço", "Telefone/Celular", "Possui chave?"]) +
      '<div class="subsecao"><h3>Observações</h3><p class="observacoes-valor' + (estaVazio(dados.observacoes) ? ' vazio' : '') + '">' + (estaVazio(dados.observacoes) ? '<em>Não preenchido</em>' : escaparHtml(dados.observacoes)) + '</p></div>' +
      '</section>');

    var btnExcluir = '<div class="admin-acoes-registro"><button type="button" class="btn-excluir-cadastro" data-apto="' + escaparHtml(dados.apto || "") + '" data-ocorrencia="' + (indiceRegistro + 1) + '">Excluir cadastro</button></div>';
    return '<div class="admin-registro-card">' + secoes.join("") + btnExcluir + '</div>';
  }

  function renderizarDados(dados) {
    var resultado = document.getElementById("resultadoAdmin");
    if (!resultado) return;

    resultado.classList.remove("vazio");

    var lista = Array.isArray(dados) ? dados : [dados];
    resultado.innerHTML = lista.map(function(item, index) {
      return montarHtmlRegistro(item, index);
    }).join("");

    resultado.querySelectorAll(".btn-excluir-cadastro").forEach(function(botao) {
      botao.addEventListener("click", function() {
        var apto = botao.getAttribute("data-apto");
        var ocorrencia = parseInt(botao.getAttribute("data-ocorrencia"), 10) || 1;
        if (!apto) return;

        var confirmar = window.confirm("Deseja realmente excluir este cadastro do apartamento " + apto + " e apagar os dados da planilha em todas as abas?");
        if (!confirmar) return;

        setOverlayAdmin(true, "Aguarde: excluindo cadastro...");
        fetch(WEB_APP_URL, {
          method: "POST",
          body: JSON.stringify({ funcao: "excluirCadastroPorApartamentoSimples", apto: apto, ocorrencia: ocorrencia })
        })
          .then(function(response) {
            return response.text().then(function(texto) {
              var conteudo = String(texto || "").trim();
              if (!response.ok) throw new Error("Backend indisponível (HTTP " + response.status + ").");
              if (!conteudo || conteudo.charAt(0) !== "{") throw new Error("Backend não retornou JSON válido.");
              return JSON.parse(conteudo);
            });
          })
          .then(function(resposta) {
            setOverlayAdmin(false);
            if (resposta && resposta.sucesso) {
              setStatus("Cadastro excluído com sucesso.", "ok");
              setTimeout(function() {
                carregarAptosDoServidor();
                var select = document.getElementById("aptoAdmin");
                if (select) select.value = "";
                resultado.innerHTML = "";
                resultado.classList.add("vazio");
                var placeholder = document.createElement("div");
                placeholder.className = "resultado-placeholder";
                placeholder.textContent = "Nenhum dado carregado.";
                resultado.appendChild(placeholder);
              }, 300);
              return;
            }
            setStatus((resposta && resposta.mensagem) || "Não foi possível excluir o cadastro.", "erro");
          })
          .catch(function(err) {
            setOverlayAdmin(false);
            setStatus("Não foi possível excluir o cadastro.", "erro");
          });
      });
    });
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

    setStatus("", "");
    setOverlayAdmin(true, "Aguarde: buscando cadastro...");

    function chamarFuncao(nomeFuncao, aptoBusca, ocorrenciaBusca) {
      return fetch(WEB_APP_URL, {
        method: "POST",
        body: JSON.stringify({
          funcao: nomeFuncao,
          apto: aptoBusca,
          ocorrencia: ocorrenciaBusca
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

    function obterOcorrenciasDoApartamento() {
      var lista = [];
      if (!select) return lista;
      Array.from(select.options).forEach(function(option) {
        var valor = String(option.value || "");
        if (!valor) return;
        var partes = valor.split("__");
        var aptoAtual = String(partes[0] || "").trim();
        var ocorrenciaAtual = parseInt(partes[1], 10);
        if (aptoAtual === apto && ocorrenciaAtual >= 1) {
          lista.push(ocorrenciaAtual);
        }
      });
      return lista.sort(function(a, b) { return a - b; });
    }

    var ocorrencias = obterOcorrenciasDoApartamento();
    var promessas = ocorrencias.length > 1
      ? ocorrencias.map(function(occ) { return chamarFuncao("buscarDadosPorApartamentoSimples", apto, occ); })
      : [chamarFuncao("buscarDadosPorApartamentoSimples", apto, ocorrencia)];

    Promise.all(promessas)
      .then(function(respostas) {
        setOverlayAdmin(false);

        var validas = respostas.filter(function(resposta) {
          return resposta && resposta.encontrado && resposta.dados;
        }).map(function(resposta) {
          return resposta.dados;
        });

        if (!validas.length) {
          var primeiraResposta = respostas[0] || {};
          var msgFinal = String((primeiraResposta && primeiraResposta.mensagem) || "");
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
        renderizarDados(validas);
      })
      .catch(function(err) {
        setOverlayAdmin(false);
        setStatus("Backend indisponível. Não foi possível buscar os dados.", "erro");
      });
  }

  function iniciarAppAdmin() {
    if (appInicializado) return;
    appInicializado = true;

    // Mantém somente a lista local de apartamentos.
    carregarAptosDoServidor();
    var botao = document.getElementById("btnBuscarApto");
    if (botao) {
      botao.addEventListener("click", buscarPorApartamento);
    }
  }

  document.addEventListener("DOMContentLoaded", function() {
    // Se não houver módulo de autenticação, inicializa direto para não quebrar ambientes legados.
    if (!document.getElementById("authGate")) {
      iniciarAppAdmin();
    }

    // If session restoration already unlocked the admin area before this callback,
    // initialize immediately to ensure apartment list is populated.
    var adminArea = document.getElementById("adminArea");
    if (adminArea && adminArea.hidden === false) {
      iniciarAppAdmin();
    }
  });
})();