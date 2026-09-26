// ==========================================
// MENU DO ADMIN: PAINÉIS QUE ABREM E FECHAM
// ==========================================
// Cada botão do menu abre/fecha o seu painel (Links úteis, Relatórios, Consulta por apartamento,
// Busca geral). Vários podem ficar abertos: o último aberto aparece em cima dos outros. Cada painel
// tem um × para fechar. Outros scripts abrem um painel com window.AdminPaineis.abrir(id) — por
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
    var container = document.getElementById("paineisAdmin");
    if (!painel || !container) return;
    // O último aberto vai para o topo da pilha (mesmo se já estava aberto).
    if (container.firstElementChild !== painel) container.insertBefore(painel, container.firstElementChild);
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
