(function() {
  function escaparHtml(valor) {
    return String(valor || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setStatusBusca(texto, tipo) {
    var status = document.getElementById("statusBuscaGeral");
    if (!status) return;
    status.className = "status" + (tipo ? " " + tipo : "");
    status.textContent = texto || "";
  }

  function limparResultados() {
    var container = document.getElementById("resultadosBuscaGeral");
    if (container) container.innerHTML = "";
  }

  function mostrarSecaoBusca(mostrar) {
    var secaoBusca = document.getElementById("buscaGeralAdmin");
    var botaoVoltar = document.getElementById("btnVoltarBusca");
    if (secaoBusca) secaoBusca.hidden = !mostrar;
    if (botaoVoltar) botaoVoltar.hidden = mostrar;
  }

  function esconderRegistroCarregado() {
    var status = document.getElementById("statusAdmin");
    var resultado = document.getElementById("resultadoAdmin");
    if (status) {
      status.className = "status";
      status.textContent = "";
    }
    if (resultado) {
      resultado.classList.add("vazio");
      resultado.innerHTML = "";
      var placeholder = document.createElement("div");
      placeholder.className = "resultado-placeholder";
      placeholder.textContent = "Nenhum dado carregado.";
      resultado.appendChild(placeholder);
    }
  }

  function carregarApartamentoDaBusca(apto, ocorrencia) {
    if (typeof window.adminSimplesCarregarApartamento !== "function") return;

    window.adminSimplesCarregarApartamento(apto, ocorrencia).then(function(sucesso) {
      if (sucesso) {
        mostrarSecaoBusca(false);
      }
    });
  }

  function renderizarResultados(resultados) {
    var container = document.getElementById("resultadosBuscaGeral");
    if (!container) return;

    if (!resultados.length) {
      container.innerHTML = '<p class="sem-itens">Nenhum resultado encontrado.</p>';
      return;
    }

    container.innerHTML = resultados.map(function(item, indice) {
      var titulo = "Apto " + escaparHtml(item.apto) + (item.ocorrencia > 1 ? " (ocorrência " + item.ocorrencia + ")" : "");
      var achados = Array.isArray(item.achados) ? item.achados : [];
      var listaAchados = achados.map(function(a) { return "<li>" + escaparHtml(a) + "</li>"; }).join("");

      return (
        '<div class="resultado-busca-item">' +
          '<div class="resultado-busca-titulo">' + titulo + "</div>" +
          "<ul>" + listaAchados + "</ul>" +
          '<button type="button" class="btn-carregar-resultado" data-apto="' + escaparHtml(item.apto) + '" data-ocorrencia="' + item.ocorrencia + '" data-indice="' + indice + '">Carregar cadastro completo</button>' +
        "</div>"
      );
    }).join("");

    container.querySelectorAll(".btn-carregar-resultado").forEach(function(botao) {
      botao.addEventListener("click", function() {
        var apto = botao.getAttribute("data-apto");
        var ocorrencia = parseInt(botao.getAttribute("data-ocorrencia"), 10) || 1;
        carregarApartamentoDaBusca(apto, ocorrencia);
      });
    });
  }

  function executarBusca() {
    var input = document.getElementById("buscaGeralInput");
    var termo = input ? String(input.value || "").trim() : "";

    if (termo.length < 2) {
      setStatusBusca("Digite ao menos 2 caracteres para buscar.", "erro");
      return;
    }

    setStatusBusca("Buscando...", "");
    limparResultados();

    DataService.buscarTexto(termo)
      .then(function(resposta) {
        if (!resposta || !resposta.sucesso) {
          setStatusBusca((resposta && resposta.mensagem) || "Não foi possível realizar a busca.", "erro");
          return;
        }

        var resultados = Array.isArray(resposta.resultados) ? resposta.resultados : [];
        setStatusBusca(resultados.length ? ("Encontrado(s) " + resultados.length + " apartamento(s).") : "Nenhum resultado encontrado.", resultados.length ? "ok" : "");
        renderizarResultados(resultados);
      })
      .catch(function() {
        setStatusBusca("Backend indisponível. Não foi possível realizar a busca.", "erro");
      });
  }

  document.addEventListener("DOMContentLoaded", function() {
    var botaoBuscar = document.getElementById("btnBuscaGeral");
    var input = document.getElementById("buscaGeralInput");
    var botaoVoltar = document.getElementById("btnVoltarBusca");

    if (botaoBuscar) {
      botaoBuscar.addEventListener("click", executarBusca);
    }

    if (input) {
      var timerBuscaAoDigitar = null;
      input.addEventListener("keydown", function(evento) {
        if (evento.key === "Enter") {
          evento.preventDefault();
          clearTimeout(timerBuscaAoDigitar);
          executarBusca();
        }
      });

      // Busca em tempo real: aguarda uma pausa na digitação para não disparar a cada tecla.
      input.addEventListener("input", function() {
        clearTimeout(timerBuscaAoDigitar);
        var termo = String(input.value || "").trim();
        if (termo.length < 2) {
          setStatusBusca("");
          limparResultados();
          return;
        }
        timerBuscaAoDigitar = setTimeout(executarBusca, 500);
      });
    }

    if (botaoVoltar) {
      botaoVoltar.addEventListener("click", function() {
        esconderRegistroCarregado();
        mostrarSecaoBusca(true);
      });
    }
  });
})();
