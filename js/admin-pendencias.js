// ==========================================
// PENDÊNCIAS (ADMIN)
// ==========================================
// O que precisa de atenção na base, em grupos recolhíveis (aptos sem cadastro, contratos de
// locação vencendo, cadastros antigos, dados faltando, vagas...). Carrega ao abrir a página e
// depois de cada alteração. Tocar num item com cadastro abre esse cadastro na Consulta.
(function() {
  var escaparHtml = window.Utils.escaparHtml;
  var carregado = false;
  var carregando = false;

  function setStatus(texto, tipo) {
    var el = document.getElementById("statusPendencias");
    if (!el) return;
    el.className = "status" + (tipo ? " " + tipo : "");
    el.textContent = texto || "";
  }

  function itemHtml(it) {
    var texto = "<strong>" + escaparHtml(it.apto) + "</strong>" +
      (it.nome ? " · " + escaparHtml(it.nome) + (it.tipo ? " (" + escaparHtml(it.tipo) + ")" : "") : "") +
      (it.detalhe ? '<span class="pendencia-detalhe">' + escaparHtml(it.detalhe) + "</span>" : "");
    return it.id
      ? '<li><button type="button" class="pendencia-item" data-apto="' + escaparHtml(it.apto) + '" data-id="' + escaparHtml(it.id) + '">' + texto + "</button></li>"
      : '<li><span class="pendencia-item sem-link">' + texto + "</span></li>";
  }

  function renderizar(grupos) {
    var lista = document.getElementById("listaPendencias");
    if (!lista) return;
    var total = grupos.reduce(function(s, g) { return s + g.itens.length; }, 0);
    lista.innerHTML = grupos.map(function(g) {
      var n = g.itens.length;
      return '<details class="grupo-pendencia' + (n ? "" : " vazio") + '">' +
        "<summary><span>" + escaparHtml(g.titulo) + '</span><span class="contador-pendencia">' + n + "</span></summary>" +
        (n ? "<ul>" + g.itens.map(itemHtml).join("") + "</ul>" : "") +
      "</details>";
    }).join("");
    setStatus(total ? "" : "Nenhuma pendência. 🎉", total ? "" : "ok");
  }

  function carregar() {
    if (carregando) return;
    carregando = true;
    setStatus("Verificando a base...", "");
    DataService.listarPendencias()
      .then(function(resposta) {
        if (!resposta || !resposta.sucesso) {
          setStatus((resposta && resposta.mensagem) || "Não foi possível verificar as pendências.", "erro");
          return;
        }
        carregado = true;
        renderizar(resposta.grupos || []);
      })
      .catch(function(erro) {
        setStatus((erro && erro.message) || "Não foi possível verificar as pendências.", "erro");
      })
      .then(function() { carregando = false; });
  }

  document.addEventListener("DOMContentLoaded", function() {
    var lista = document.getElementById("listaPendencias");
    if (!lista || !window.DataService) return;

    window.addEventListener("painel-aberto", function(e) {
      if (e.detail && e.detail.id === "painelPendencias" && !carregado) carregar();
    });
    // Depois de uma alteração, recarrega na próxima vez que a página for aberta.
    window.addEventListener("cadastro-alterado", function() { carregado = false; });
    window.addEventListener("cadastro-excluido", function() { carregado = false; });

    document.getElementById("btnAtualizarPendencias").addEventListener("click", carregar);

    // Abre o cadastro na página "Consulta por apartamento".
    lista.addEventListener("click", function(e) {
      var botao = e.target.closest("button.pendencia-item");
      if (!botao || typeof window.adminSimplesCarregarApartamento !== "function") return;
      var select = document.getElementById("aptoAdmin");
      var valor = botao.getAttribute("data-apto") + "__" + botao.getAttribute("data-id");
      if (select && Array.prototype.some.call(select.options, function(o) { return o.value === valor; })) select.value = valor;
      window.adminSimplesCarregarApartamento(botao.getAttribute("data-apto"), botao.getAttribute("data-id"));
    });
  });
})();
