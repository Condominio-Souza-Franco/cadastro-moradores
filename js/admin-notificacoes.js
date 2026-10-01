// ==========================================
// NOTIFICAÇÕES (ADMIN): quem recebe o e-mail com as alterações cadastrais
// ==========================================
// Lista os membros da administração (página Membros) com uma caixinha cada. O backend
// (notificacoes.gs) confere de novo ao salvar:
//   condomínio, desenvolvedor e síndico: marcam/desmarcam qualquer um;
//   conselho: só o próprio e-mail (os outros aparecem travados).
(function() {
  var escaparHtml = window.Utils.escaparHtml;
  var membros = [];
  var originais = "";
  var carregado = false;
  var carregando = false;

  function setStatus(texto, tipo) {
    var el = document.getElementById("statusNotificacoes");
    if (!el) return;
    el.className = "status" + (tipo ? " " + tipo : "");
    el.textContent = texto || "";
  }

  function marcados() {
    return membros.filter(function(m) { return m.marcado; }).map(function(m) { return m.email; }).sort();
  }

  function atualizarBotoes() {
    var alterado = JSON.stringify(marcados()) !== originais;
    document.getElementById("btnSalvarNotificacoes").disabled = !alterado;
    document.getElementById("btnDesfazerNotificacoes").disabled = !alterado;
  }

  function renderizar() {
    var lista = document.getElementById("listaNotificacoes");
    lista.innerHTML = membros.map(function(m, i) {
      var quem = m.nome ? escaparHtml(m.nome) + (m.apto ? " <span class=\"notif-apto\">· apto " + escaparHtml(m.apto) + "</span>" : "") : escaparHtml(m.cargos.join(", "));
      return '<label class="item-notificacao' + (m.editavel ? "" : " travado") + '">' +
        '<input type="checkbox" data-i="' + i + '"' + (m.marcado ? " checked" : "") + (m.editavel ? "" : " disabled") + ">" +
        '<span class="notif-texto">' +
          '<span class="notif-nome">' + quem + "</span>" +
          (m.nome ? '<span class="notif-cargo">' + escaparHtml(m.cargos.join(", ")) + "</span>" : "") +
          '<span class="notif-email">' + escaparHtml(m.email) + "</span>" +
        "</span>" +
      "</label>";
    }).join("") || '<p class="sem-itens">Nenhum membro cadastrado. Preencha a página Membros primeiro.</p>';
    atualizarBotoes();
  }

  function aplicar(r) {
    membros = r.membros || [];
    originais = JSON.stringify(marcados());
    renderizar();
  }

  function carregar() {
    if (carregando) return;
    carregando = true;
    setStatus("Carregando...", "carregando");
    DataService.obterNotificacoes()
      .then(function(r) {
        if (!r || !r.sucesso) throw new Error((r && r.mensagem) || "Não foi possível carregar as notificações.");
        carregado = true;
        document.getElementById("painelNotificacoes").classList.add("conteudo-carregado");
        setStatus(r.configurado ? "" : "Ainda não configurado: por enquanto o e-mail vai só para a lista inicial.", "");
        aplicar(r);
      })
      .catch(function(erro) { setStatus((erro && erro.message) || "Não foi possível carregar as notificações.", "erro"); })
      .then(function() { carregando = false; });
  }

  function salvar() {
    document.getElementById("btnSalvarNotificacoes").disabled = true;
    if (window.setOverlayAdmin) window.setOverlayAdmin(true, "Aguarde: salvando...");
    DataService.salvarNotificacoes(marcados())
      .then(function(r) {
        if (!r || !r.sucesso) throw new Error((r && r.mensagem) || "Não foi possível salvar.");
        aplicar(r);
        var n = marcados().length;
        setStatus(n ? "Salvo. O próximo e-mail vai para " + n + (n === 1 ? " pessoa." : " pessoas.") : "Salvo. Ninguém está marcado: nenhum e-mail será enviado.", "ok");
      })
      .catch(function(erro) {
        setStatus((erro && erro.message) || "Não foi possível salvar.", "erro");
        atualizarBotoes();
      })
      .then(function() { if (window.setOverlayAdmin) window.setOverlayAdmin(false); });
  }

  document.addEventListener("DOMContentLoaded", function() {
    var lista = document.getElementById("listaNotificacoes");
    if (!lista || !window.DataService) return;

    window.addEventListener("painel-aberto", function(e) {
      if (e.detail && e.detail.id === "painelNotificacoes" && !carregado) carregar();
    });
    // Membros mudaram: recarrega da próxima vez que a página for aberta.
    window.addEventListener("cadastro-alterado", function() { carregado = false; });
    lista.addEventListener("change", function(e) {
      var i = e.target.getAttribute("data-i");
      if (i === null) return;
      membros[Number(i)].marcado = e.target.checked;
      atualizarBotoes();
    });
    document.getElementById("btnSalvarNotificacoes").addEventListener("click", salvar);
    document.getElementById("btnDesfazerNotificacoes").addEventListener("click", function() {
      carregado = false;
      carregar();
    });
  });
})();
