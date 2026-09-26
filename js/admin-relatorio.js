// ==========================================
// RELATÓRIOS EM PDF (ADMIN): contatos e lista de veículos
// ==========================================
// Cada relatório tem um botão, uma área de status (resultado da última geração nesta sessão) e
// uma "situação": quando foi gerado pela última vez e se está desatualizado — houve alguma
// alteração cadastral depois disso. A situação é carregada ao entrar no painel e depois de
// cada geração ou alteração.
(function() {
  var escaparHtml = window.Utils.escaparHtml;

  var RELATORIOS = {
    contatos: {
      botao: "btnRelatorioPdfDrive",
      status: "statusRelatorioPdfDrive",
      situacao: "situacaoRelatorioContatos",
      gerar: function() { return DataService.gerarRelatorioApartamentosPdfDrive(); },
      aguarde: "Aguarde: gerando o relatório de contatos e salvando no Drive...",
      nome: "relatório de contatos"
    },
    veiculos: {
      botao: "btnListaVeiculosPdf",
      status: "statusListaVeiculos",
      situacao: "situacaoListaVeiculos",
      gerar: function() { return DataService.gerarListaVeiculosPdfDrive(); },
      aguarde: "Aguarde: gerando a lista de veículos e salvando no Drive...",
      nome: "lista de veículos"
    }
  };

  function setOverlay(visivel, mensagem) {
    if (typeof window.setOverlayAdmin === "function") {
      window.setOverlayAdmin(visivel, mensagem);
      return;
    }
    var overlay = document.getElementById("overlayProcessamento");
    var mensagemEl = document.getElementById("overlayProcessamentoMensagem");
    if (!overlay) return;
    if (mensagemEl && mensagem) mensagemEl.textContent = mensagem;
    overlay.classList.toggle("hidden", !visivel);
  }

  function setHtml(id, html, classe) {
    var el = document.getElementById(id);
    if (!el) return;
    if (classe !== undefined) el.className = classe;
    el.innerHTML = html || "";
  }

  function formatarDataHora(iso) {
    var data = new Date(iso);
    if (isNaN(data.getTime())) return "";
    function dois(n) { return String(n).padStart(2, "0"); }
    return dois(data.getDate()) + "/" + dois(data.getMonth() + 1) + "/" + data.getFullYear() + " às " +
      dois(data.getHours()) + ":" + dois(data.getMinutes());
  }

  // "Último gerado em 26/09/2026 às 10:32 (abrir)" + aviso de desatualizado, se for o caso.
  function mostrarSituacao(config, info) {
    if (!info) {
      setHtml(config.situacao, "", "situacao-relatorio");
      return;
    }
    var partes = [];
    if (info.nunca) {
      partes.push("Ainda não foi gerado nenhum PDF.");
    } else {
      var url = window.Utils.urlSegura(info.url);
      partes.push("Último gerado em " + escaparHtml(formatarDataHora(info.geradoEm)) +
        (url ? ' (<a href="' + escaparHtml(url) + '" target="_blank" rel="noopener noreferrer">abrir</a>)' : "") + ".");
    }
    if (info.datado && !info.nunca) {
      partes.push('<span class="aviso-datado">⚠️ Desatualizado: houve alterações cadastrais depois dele. Gere um novo antes de usar.</span>');
    }
    setHtml(config.situacao, partes.join(" "), "situacao-relatorio" + (info.datado && !info.nunca ? " datado" : ""));
  }

  var carregandoSituacao = false;
  function carregarSituacao() {
    if (carregandoSituacao || !window.DataService || typeof DataService.situacaoRelatorios !== "function") return;
    carregandoSituacao = true;
    DataService.situacaoRelatorios()
      .then(function(resposta) {
        if (!resposta || !resposta.sucesso) return;
        mostrarSituacao(RELATORIOS.contatos, resposta.contatos);
        mostrarSituacao(RELATORIOS.veiculos, resposta.veiculos);
      })
      .catch(function() { /* sem a situação, os botões continuam funcionando */ })
      .then(function() { carregandoSituacao = false; });
  }

  function gerar(config) {
    setHtml(config.status, "", "status");
    setOverlay(true, config.aguarde);

    config.gerar()
      .then(function(resposta) {
        setOverlay(false);
        var urlPdf = resposta ? window.Utils.urlSegura(resposta.url) : "";
        if (!resposta || !resposta.sucesso || !urlPdf) {
          setHtml(config.status, escaparHtml((resposta && resposta.mensagem) || "Não foi possível gerar o PDF."), "status erro");
          return;
        }
        setHtml(config.status,
          'PDF gerado: <a href="' + escaparHtml(urlPdf) + '" target="_blank" rel="noopener noreferrer">' + escaparHtml(resposta.nomeArquivo) + "</a>",
          "status ok");
        carregarSituacao();
      })
      .catch(function(erro) {
        setOverlay(false);
        setHtml(config.status, escaparHtml((erro && erro.message) || "Backend indisponível. Não foi possível gerar o " + config.nome + "."), "status erro");
      });
  }

  // Registrado cedo: o login pode liberar o painel antes do DOMContentLoaded deste script.
  window.addEventListener("admin-auth-success", carregarSituacao);
  window.addEventListener("cadastro-excluido", carregarSituacao);
  window.addEventListener("cadastro-alterado", carregarSituacao);

  document.addEventListener("DOMContentLoaded", function() {
    Object.keys(RELATORIOS).forEach(function(chave) {
      var config = RELATORIOS[chave];
      var botao = document.getElementById(config.botao);
      if (botao) botao.addEventListener("click", function() { gerar(config); });
    });
  });
})();
