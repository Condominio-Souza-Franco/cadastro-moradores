// ==========================================
// ÚLTIMAS ALTERAÇÕES (ADMIN)
// ==========================================
// Seção recolhível (<details>), fechada por padrão. As 10 últimas criações, edições e exclusões
// só são buscadas quando a seção é aberta — assim a página não faz uma chamada a mais ao carregar.
(function() {
  var LIMITE = 10;
  var escaparHtml = window.Utils.escaparHtml;
  var carregado = false;
  var carregando = false;

  var CLASSE_TIPO = { "criação": "criacao", "edição": "edicao", "exclusão": "exclusao", "mudou-se": "mudouse", "reativação": "criacao" };

  function setStatus(texto, tipo) {
    var status = document.getElementById("statusHistorico");
    if (!status) return;
    status.className = "status" + (tipo ? " " + tipo : "");
    status.textContent = texto || "";
  }

  function formatarQuando(iso) {
    var data = new Date(iso);
    if (isNaN(data.getTime())) return "";
    function dois(n) { return String(n).padStart(2, "0"); }
    return dois(data.getDate()) + "/" + dois(data.getMonth() + 1) + "/" + data.getFullYear() +
      " " + dois(data.getHours()) + ":" + dois(data.getMinutes());
  }

  function itemHtml(item) {
    var tipo = String(item.tipo || "");
    var quem = item.nome ? escaparHtml(item.nome) + (item.cadastroTipo ? " (" + escaparHtml(item.cadastroTipo) + ")" : "") : "";
    return (
      "<li>" +
        '<div class="historico-linha">' +
          '<span class="historico-tipo ' + (CLASSE_TIPO[tipo] || "") + '">' + escaparHtml(tipo) + "</span>" +
          "<strong>Apto " + escaparHtml(item.apto) + "</strong>" +
          (quem ? "<span>" + quem + "</span>" : "") +
        "</div>" +
        '<div class="historico-linha">' +
          '<span class="historico-quando">' + escaparHtml(formatarQuando(item.quando)) + "</span>" +
          '<span class="historico-autor">por ' + escaparHtml(item.autor || "—") + "</span>" +
        "</div>" +
        (item.detalhe ? '<div class="historico-detalhe">' + escaparHtml(item.detalhe) + "</div>" : "") +
      "</li>"
    );
  }

  function carregar() {
    if (carregando) return;
    carregando = true;
    setStatus("Carregando...", "");

    DataService.listarHistorico(LIMITE)
      .then(function(resposta) {
        var lista = document.getElementById("listaHistorico");
        if (!resposta || !resposta.sucesso) {
          setStatus((resposta && resposta.mensagem) || "Não foi possível carregar o histórico.", "erro");
          return;
        }
        var itens = Array.isArray(resposta.itens) ? resposta.itens : [];
        if (lista) lista.innerHTML = itens.map(itemHtml).join("");
        setStatus(itens.length ? "" : "Nenhuma alteração registrada ainda.", "");
        carregado = true;
      })
      .catch(function(erro) {
        setStatus((erro && erro.message) || "Não foi possível carregar o histórico.", "erro");
      })
      .then(function() {
        carregando = false;
      });
  }

  document.addEventListener("DOMContentLoaded", function() {
    var secao = document.getElementById("historicoAdmin");
    var botao = document.getElementById("btnAtualizarHistorico");
    if (!secao || !window.DataService) return;

    secao.addEventListener("toggle", function() {
      if (secao.open && !carregado) carregar();
    });
    if (botao) botao.addEventListener("click", carregar);

    // Depois de excluir um cadastro, a lista aberta se atualiza; fechada, recarrega ao abrir.
    function recarregarSeAberto() {
      carregado = false;
      if (secao.open) carregar();
    }
    window.addEventListener("cadastro-excluido", recarregarSeAberto);
    window.addEventListener("cadastro-alterado", recarregarSeAberto);
  });
})();
