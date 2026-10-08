// ==========================================
// BOLINHAS DE CONTAGEM DO MENU (PENDÊNCIAS, CADASTROS PARA APROVAÇÃO)
// ==========================================
// As contagens só chegam depois que o servidor responde (pré-carga), e isso pode levar alguns
// segundos: a página abria sem a bolinha e ela "pulava" depois. Agora a última contagem fica
// guardada neste navegador (localStorage) e aparece logo que a página abre. Quando o servidor
// responde, a bolinha só muda se o número for outro.
// Só guarda números (nenhum dado de morador). Quem não tem autorização para a página não vê a
// contagem guardada, já que a pré-carga não vai atualizá-la.
(function() {
  var PREFIXO = "contagemMenu:";
  // Bolinha -> autorização exigida (Membros > Autorizações).
  var PERMISSAO = { contadorPendencias: "pendencias", contadorAprovacoes: "aprovacoes" };

  function mostrar(el, total) {
    var texto = total > 99 ? "99+" : (total ? String(total) : "");
    if (el.textContent !== texto) el.textContent = texto;
    el.hidden = !total;
  }

  function podeVer(id) {
    var p = window.AdminAuth && window.AdminAuth.getPermissoes ? window.AdminAuth.getPermissoes() : null;
    return !p || p[PERMISSAO[id]] !== false;
  }

  // Chamado pelas páginas quando a contagem real chega do servidor.
  function definir(id, total) {
    var el = document.getElementById(id);
    total = Math.max(0, parseInt(total, 10) || 0);
    try { localStorage.setItem(PREFIXO + id, String(total)); } catch (e) {}
    if (el) mostrar(el, total);
  }

  // Mostra a última contagem guardada (sem esperar o servidor).
  function restaurar() {
    Object.keys(PERMISSAO).forEach(function(id) {
      var el = document.getElementById(id);
      if (!el || !podeVer(id)) return;
      var guardado = null;
      try { guardado = localStorage.getItem(PREFIXO + id); } catch (e) {}
      if (guardado !== null) mostrar(el, parseInt(guardado, 10) || 0);
    });
  }

  window.BadgeMenu = { definir: definir, restaurar: restaurar };
  restaurar();
  window.addEventListener("admin-auth-success", restaurar);
})();
