// ==========================================
// MENU DO ADMIN: PAINÉIS QUE ABREM E FECHAM
// ==========================================
// Cada botão do menu abre/fecha a sua página (Consulta por apartamento, Busca geral, Relatórios,
// Links úteis). Só uma página fica aberta: abrir outra substitui a atual. Cada página tem um ×
// que fecha e volta para a home ("Últimas alterações cadastrais"). Outros scripts abrem um painel com window.AdminPaineis.abrir(id) — por
// exemplo, ao carregar um cadastro (a partir da busca ou ao voltar da edição).
(function() {
  function botaoDoPainel(id) {
    return document.querySelector('.menu-admin [data-painel="' + id + '"]');
  }

  function marcarBotao(id, aberto) {
    var botao = botaoDoPainel(id);
    if (!botao) return;
    botao.classList.toggle("ativo", aberto);
    botao.setAttribute("aria-pressed", aberto ? "true" : "false");
  }

  // "Últimas alterações cadastrais" é a home: só aparece com todas as páginas fechadas.
  function atualizarHome() {
    var historico = document.getElementById("historicoAdmin");
    if (!historico) return;
    historico.hidden = !!document.querySelector(".painel-admin:not([hidden])");
  }

  function abrir(id) {
    var painel = document.getElementById(id);
    if (!painel) return;
    // Só uma página por vez: abrir uma fecha a outra.
    document.querySelectorAll(".painel-admin").forEach(function(outro) {
      if (outro !== painel && !outro.hidden) {
        outro.hidden = true;
        marcarBotao(outro.id, false);
      }
    });
    painel.hidden = false;
    marcarBotao(id, true);
    atualizarHome();
  }

  function fechar(id) {
    var painel = document.getElementById(id);
    if (!painel) return;
    painel.hidden = true;
    marcarBotao(id, false);
    atualizarHome();
  }

  function alternar(id) {
    var painel = document.getElementById(id);
    if (!painel) return;
    if (painel.hidden) abrir(id); else fechar(id);
  }

  window.AdminPaineis = { abrir: abrir, fechar: fechar, alternar: alternar };

  document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll(".menu-admin [data-painel]").forEach(function(botao) {
      botao.addEventListener("click", function() { alternar(botao.getAttribute("data-painel")); });
    });
    document.querySelectorAll(".painel-admin .btn-fechar-painel").forEach(function(botao) {
      botao.addEventListener("click", function() { fechar(botao.closest(".painel-admin").id); });
    });
  });
})();
