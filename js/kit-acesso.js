// ==========================================
// KIT DE BOAS-VINDAS: popup com as duas formas de acesso
// ==========================================
// O botão do kit não abre nada direto: mostra um popup com
//   1. Acessar o Kit  -> CPF + data de nascimento (mesma conferência e limite de tentativas da
//      consulta do cadastro, rota fbAbrirKit). Deu certo: abre a página kit.html com os documentos.
//   2. Abrir pasta no Drive -> a pasta do kit (abre para quem entrar com a conta Google do e-mail
//      cadastrado).
(function() {
  var URL_PASTA = "https://tinyurl.com/kit-souzafranco";
  var CHAVE = "kitBoasVindas"; // mesma chave que a kit.html lê (sessionStorage desta aba)
  var modal = null;

  function mascarar(el, tipo) {
    el.addEventListener("input", function() {
      var v = el.value.replace(/\D/g, "");
      if (tipo === "cpf") {
        v = v.slice(0, 11);
        if (v.length > 9) v = v.slice(0, 3) + "." + v.slice(3, 6) + "." + v.slice(6, 9) + "-" + v.slice(9);
        else if (v.length > 6) v = v.slice(0, 3) + "." + v.slice(3, 6) + "." + v.slice(6);
        else if (v.length > 3) v = v.slice(0, 3) + "." + v.slice(3);
      } else {
        v = v.slice(0, 8);
        if (v.length > 4) v = v.slice(0, 2) + "/" + v.slice(2, 4) + "/" + v.slice(4);
        else if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
      }
      el.value = v;
    });
  }

  function montar() {
    if (modal) return modal;
    modal = document.createElement("div");
    modal.className = "kit-modal";
    modal.hidden = true;
    modal.innerHTML =
      '<div class="kit-modal-caixa" role="dialog" aria-modal="true" aria-labelledby="kitModalTitulo">' +
        '<div class="kit-modal-topo"><h3 id="kitModalTitulo">Kit de Boas-vindas</h3>' +
          '<button type="button" class="kit-modal-fechar" aria-label="Fechar">&times;</button></div>' +
        '<form class="kit-opcao" novalidate>' +
          '<h4><span class="kit-numero">1</span> Acessar o Kit</h4>' +
          '<p>Informe o CPF e a data de nascimento do seu cadastro de morador.</p>' +
          '<div class="kit-campos">' +
            '<label>CPF<input type="text" name="cpf" inputmode="numeric" autocomplete="off" placeholder="000.000.000-00" maxlength="14"></label>' +
            '<label>Data de nascimento<input type="text" name="nasc" inputmode="numeric" autocomplete="off" placeholder="DD/MM/AAAA" maxlength="10"></label>' +
          '</div>' +
          '<button type="submit" class="kit-btn">Acessar o Kit</button>' +
          '<p class="kit-mensagem" role="status"></p>' +
        '</form>' +
        '<div class="kit-opcao kit-opcao-drive">' +
          '<h4><span class="kit-numero">2</span> Abrir pasta no Drive</h4>' +
          '<p>Para quem entra com a conta Google do e-mail informado no cadastro (depois da aprovação).</p>' +
          '<a class="kit-btn kit-btn-secundario" href="' + URL_PASTA + '" target="_blank" rel="noopener noreferrer">Abrir pasta no Drive</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    var form = modal.querySelector("form");
    mascarar(form.cpf, "cpf");
    mascarar(form.nasc, "data");
    modal.addEventListener("click", function(e) {
      if (e.target === modal || e.target.closest(".kit-modal-fechar")) fechar();
      if (e.target.closest(".kit-btn-secundario")) fechar();
    });
    document.addEventListener("keydown", function(e) { if (e.key === "Escape") fechar(); });
    form.addEventListener("submit", function(e) {
      e.preventDefault();
      var msg = modal.querySelector(".kit-mensagem");
      var cpf = form.cpf.value.replace(/\D/g, "");
      function aviso(t, tipo) { msg.textContent = t; msg.className = "kit-mensagem" + (tipo ? " " + tipo : ""); }
      if (cpf.length !== 11) { aviso("Informe o CPF completo (11 dígitos).", "erro"); form.cpf.focus(); return; }
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(form.nasc.value)) { aviso("Informe a data de nascimento no formato DD/MM/AAAA.", "erro"); form.nasc.focus(); return; }
      var botao = form.querySelector(".kit-btn");
      botao.disabled = true;
      aviso("Conferindo...", "carregando");
      window.Backend.chamar("fbAbrirKit", { cpf: cpf, nascimento: form.nasc.value })
        .then(function(r) {
          if (!r || !r.encontrado) { aviso((r && r.mensagem) || "CPF ou data de nascimento não conferem.", "erro"); return; }
          try { sessionStorage.setItem(CHAVE, JSON.stringify(r)); } catch (e2) {}
          window.location.href = "kit.html";
        })
        .catch(function() { aviso("Não foi possível conectar ao sistema. Tente novamente em instantes.", "erro"); })
        .then(function() { botao.disabled = false; });
    });
    return modal;
  }

  function abrir() {
    var m = montar();
    m.hidden = false;
    document.body.classList.add("kit-modal-aberto");
    setTimeout(function() { m.querySelector("input[name=cpf]").focus(); }, 50);
  }

  function fechar() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("kit-modal-aberto");
  }

  // Fase de captura: antes do popup de links (popup-links.js), que abriria a pasta direto.
  document.addEventListener("click", function(e) {
    var link = e.target.closest("a.btn-kit, a[data-kit]");
    if (!link) return;
    e.preventDefault();
    e.stopPropagation();
    abrir();
  }, true);

  window.KitAcesso = { abrir: abrir, fechar: fechar };
})();
