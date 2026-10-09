// ==========================================
// BOLINHAS DE CONTAGEM DO MENU (PENDÊNCIAS, CADASTROS PARA APROVAÇÃO, ÚLTIMAS ALTERAÇÕES)
// ==========================================
// Cada número fica guardado no servidor (config/contadores). Ao entrar na administração, a página lê
// os três de uma vez e a bolinha aparece logo, em qualquer navegador. Quando uma lista carrega, a página
// grava o número novo no servidor; se mudou, a bolinha muda sozinha.
// Se o número for 0, a bolinha fica verde com "OK".
// Só guarda números (nenhum dado de morador). Quem não tem autorização para a página não vê a bolinha.
(function() {
  // Bolinha -> autorização exigida (Membros > Autorizações).
  var PERMISSAO = { contadorPendencias: "pendencias", contadorAprovacoes: "aprovacoes", contadorHistorico: "historico" };
  var ultimo = {}; // último número conhecido (lido ou gravado), para não gravar à toa

  function mostrar(el, total) {
    var ok = total === 0;
    var texto = ok ? "OK" : (total > 99 ? "99+" : String(total));
    if (el.textContent !== texto) el.textContent = texto;
    el.classList.toggle("ok", ok);
    el.hidden = false;
  }

  function podeVer(id) {
    var p = window.AdminAuth && window.AdminAuth.getPermissoes ? window.AdminAuth.getPermissoes() : null;
    return !p || p[PERMISSAO[id]] !== false;
  }

  // Chamado pelas páginas quando a contagem real chega (lista carregada): mostra e grava no servidor.
  function definir(id, total) {
    total = Math.max(0, parseInt(total, 10) || 0);
    var el = document.getElementById(id);
    if (el && podeVer(id)) mostrar(el, total);
    if (ultimo[id] === total) return;
    ultimo[id] = total;
    if (window.DataService && DataService.salvarContador) {
      Promise.resolve(DataService.salvarContador(id, total)).catch(function() {});
    }
  }

  // Lê os números guardados no servidor (só os que a pessoa pode ver) e mostra nas bolinhas.
  function restaurar() {
    if (!window.DataService || !DataService.obterContadores) return;
    if (!window.AdminAuth || !window.AdminAuth.getIdToken || !window.AdminAuth.getIdToken()) return;
    DataService.obterContadores().then(function(r) {
      if (!r || !r.sucesso) return;
      Object.keys(PERMISSAO).forEach(function(id) {
        if (r[id] === undefined || r[id] === null) return;
        ultimo[id] = r[id];
        var el = document.getElementById(id);
        if (el && podeVer(id)) mostrar(el, r[id]);
      });
    }).catch(function() {});
  }

  window.BadgeMenu = { definir: definir, restaurar: restaurar };
  document.addEventListener("DOMContentLoaded", restaurar);
  window.addEventListener("admin-auth-success", restaurar);
})();
