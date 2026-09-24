(function() {
  function escaparHtml(valor) {
    return String(valor || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function textoOuTraco(valor) {
    var texto = String(valor || "").trim();
    return texto ? escaparHtml(texto) : "-";
  }

  function listaPessoasHtml(pessoas) {
    var lista = Array.isArray(pessoas) ? pessoas.filter(function(p) { return p && (p.nome || p.celular); }) : [];
    if (!lista.length) {
      return '<div class="vazio">Não preenchido</div>';
    }

    return lista.map(function(p) {
      var nome = textoOuTraco(p.nome);
      var celular = String(p.celular || "").trim();
      return '<div class="item">' + nome + (celular ? " - " + escaparHtml(celular) : "") + "</div>";
    }).join("");
  }

  function montarCardApartamento(item) {
    var apto = escaparHtml(item.apto);
    var temCadastro = !!(item.tipo || item.nome || item.celular);

    if (!temCadastro) {
      return (
        '<div class="apto-card">' +
          "<h2>Apto " + apto + "</h2>" +
          '<div class="vazio">Sem cadastro</div>' +
        "</div>"
      );
    }

    var tipo = textoOuTraco(item.tipo);
    var nome = textoOuTraco(item.nome);
    var celular = String(item.celular || "").trim();

    return (
      '<div class="apto-card">' +
        "<h2>Apto " + apto + "</h2>" +
        '<div class="linha-principal">' + tipo + ": " + nome + "</div>" +
        '<div class="item">Cel.: ' + (celular ? escaparHtml(celular) : "-") + "</div>" +
        '<div class="grupo">' +
          '<div class="grupo-titulo">Emergência</div>' +
          listaPessoasHtml(item.emergencias) +
        "</div>" +
        '<div class="grupo">' +
          '<div class="grupo-titulo">Ocupantes</div>' +
          listaPessoasHtml(item.ocupantes) +
        "</div>" +
        '<div class="grupo">' +
          '<div class="grupo-titulo">Prestadores</div>' +
          listaPessoasHtml(item.prestadores) +
        "</div>" +
      "</div>"
    );
  }

  function formatarDataHoraAtual() {
    var agora = new Date();
    var dia = String(agora.getDate()).padStart(2, "0");
    var mes = String(agora.getMonth() + 1).padStart(2, "0");
    var ano = agora.getFullYear();
    var hora = String(agora.getHours()).padStart(2, "0");
    var minuto = String(agora.getMinutes()).padStart(2, "0");
    return dia + "/" + mes + "/" + ano + " " + hora + ":" + minuto;
  }

  function montarHtmlRelatorio(apartamentos) {
    var cards = (Array.isArray(apartamentos) ? apartamentos : []).map(montarCardApartamento).join("");

    return (
      "<!DOCTYPE html>" +
      '<html lang="pt-BR">' +
      "<head>" +
      '<meta charset="UTF-8">' +
      "<title>Relatório de Contatos - Apartamentos</title>" +
      "<style>" +
      "@page { size: A4 landscape; margin: 8mm; }" +
      "* { box-sizing: border-box; }" +
      "body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; color: #111; }" +
      ".barra-acoes { text-align: center; margin: 10px 0; }" +
      ".barra-acoes button { font-size: 14px; padding: 8px 16px; cursor: pointer; }" +
      ".cabecalho { text-align: center; margin-bottom: 4mm; }" +
      ".cabecalho h1 { font-size: 13pt; margin: 0 0 1mm; }" +
      ".cabecalho .data-geracao { font-size: 7.5pt; color: #555; }" +
      ".colunas { column-count: 4; column-gap: 3mm; }" +
      ".apto-card { break-inside: avoid; -webkit-column-break-inside: avoid; page-break-inside: avoid; border: 0.3pt solid #999; border-radius: 2px; padding: 1.4mm 1.8mm; margin: 0 0 1.6mm; font-size: 6.4pt; line-height: 1.2; }" +
      ".apto-card h2 { font-size: 7.4pt; margin: 0 0 0.6mm; padding-bottom: 0.6mm; border-bottom: 0.3pt solid #ccc; }" +
      ".apto-card .linha-principal { font-weight: bold; }" +
      ".apto-card .grupo { margin-top: 0.9mm; }" +
      ".apto-card .grupo-titulo { font-weight: bold; text-decoration: underline; }" +
      ".apto-card .item { overflow-wrap: break-word; }" +
      ".apto-card .vazio { color: #888; font-style: italic; }" +
      "@media print { .barra-acoes { display: none; } }" +
      "</style>" +
      "</head>" +
      "<body>" +
      '<div class="barra-acoes"><button type="button" onclick="window.print()">Imprimir / Salvar PDF</button></div>' +
      '<div class="cabecalho">' +
        "<h1>Relatório de Contatos por Apartamento</h1>" +
        '<div class="data-geracao">Gerado em ' + formatarDataHoraAtual() + "</div>" +
      "</div>" +
      '<div class="colunas">' + cards + "</div>" +
      "</body>" +
      "</html>"
    );
  }

  function setOverlay(visivel, mensagem) {
    var overlay = document.getElementById("overlayProcessamento");
    var mensagemEl = document.getElementById("overlayProcessamentoMensagem");
    if (!overlay) return;
    if (mensagemEl && mensagem) mensagemEl.textContent = mensagem;
    overlay.classList.toggle("hidden", !visivel);
  }

  function gerarRelatorio() {
    var janela = window.open("", "_blank");
    if (!janela) {
      window.alert("Não foi possível abrir a janela do relatório. Permita pop-ups para este site e tente novamente.");
      return;
    }

    janela.document.write("<p style=\"font-family: sans-serif; padding: 20px;\">Gerando relatório, aguarde...</p>");

    setOverlay(true, "Aguarde: gerando relatório...");

    fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({ funcao: "gerarRelatorioApartamentos" })
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
        setOverlay(false);

        if (!resposta || !resposta.sucesso) {
          var mensagemErro = (resposta && resposta.mensagem) || "Não foi possível gerar o relatório.";
          janela.document.open();
          janela.document.write("<p style=\"font-family: sans-serif; padding: 20px; color: #a12622;\">" + escaparHtml(mensagemErro) + "</p>");
          janela.document.close();
          return;
        }

        var html = montarHtmlRelatorio(resposta.apartamentos);
        janela.document.open();
        janela.document.write(html);
        janela.document.close();
      })
      .catch(function(erro) {
        setOverlay(false);
        janela.document.open();
        janela.document.write("<p style=\"font-family: sans-serif; padding: 20px; color: #a12622;\">Backend indisponível. Não foi possível gerar o relatório.</p>");
        janela.document.close();
      });
  }

  document.addEventListener("DOMContentLoaded", function() {
    var botao = document.getElementById("btnRelatorioPdf");
    if (botao) {
      botao.addEventListener("click", gerarRelatorio);
    }
  });
})();
