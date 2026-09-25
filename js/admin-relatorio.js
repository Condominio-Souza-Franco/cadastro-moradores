(function() {
  var escaparHtml = window.Utils.escaparHtml;

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

  function setStatusDrive(texto, tipo) {
    var status = document.getElementById("statusRelatorioPdfDrive");
    if (!status) return;
    status.className = "status" + (tipo ? " " + tipo : "");
    status.innerHTML = texto || "";
  }

  function gerarRelatorioPdfNoDrive() {
    setStatusDrive("");
    setOverlay(true, "Aguarde: gerando PDF e salvando no Drive...");

    DataService.gerarRelatorioApartamentosPdfDrive()
      .then(function(resposta) {
        setOverlay(false);

        var urlPdf = resposta ? window.Utils.urlSegura(resposta.url) : "";
        if (!resposta || !resposta.sucesso || !urlPdf) {
          setStatusDrive(escaparHtml((resposta && resposta.mensagem) || "Não foi possível gerar o PDF."), "erro");
          return;
        }

        setStatusDrive(
          'PDF gerado: <a href="' + escaparHtml(urlPdf) + '" target="_blank" rel="noopener noreferrer">' + escaparHtml(resposta.nomeArquivo) + '</a>',
          "ok"
        );
      })
      .catch(function(erro) {
        setOverlay(false);
        setStatusDrive(escaparHtml((erro && erro.message) || "Backend indisponível. Não foi possível gerar o relatório."), "erro");
      });
  }

  document.addEventListener("DOMContentLoaded", function() {
    var botaoDrive = document.getElementById("btnRelatorioPdfDrive");
    if (botaoDrive) {
      botaoDrive.addEventListener("click", gerarRelatorioPdfNoDrive);
    }
  });
})();
