// ==========================================
// PRÉ-CARGA DAS PÁGINAS DO ADMIN + "ATUALIZADO HÁ ..." AO LADO DO "ATUALIZAR"
// ==========================================
// Logo depois do login, busca em segundo plano (uma de cada vez, para não sobrecarregar o servidor)
// as leituras de Pendências, Membros, Notificações, Gabarito e Bloqueios. Elas ficam no cache da aba
// (DataService), então, quando a pessoa abre a página, ela aparece na hora, sem "Carregando...".
//
// Ao lado de cada "Atualizar", um <span class="atualizado-em" data-leitura="..."> mostra quando os
// dados daquela página foram buscados no servidor pela última vez.
(function() {
  var LEITURAS = ["listarAprovacoes", "listarPendencias", "obterMembros", "obterNotificacoes", "obterGabaritoVagasCompleto", "listarBloqueios"];
  // Leitura -> autorização exigida (Membros > Autorizações). Sem autorização, não pré-carrega.
  var PERMISSAO_LEITURA = { listarAprovacoes: "aprovacoes", listarPendencias: "pendencias", obterMembros: "membros",
    obterNotificacoes: "notificacoes", obterGabaritoVagasCompleto: "gabarito", listarBloqueios: "bloqueios" };

  function preCarregar() {
    if (!window.DataService) return;
    var pode = window.AdminPermissoes ? window.AdminPermissoes.pode : function() { return true; };
    LEITURAS.filter(function(nome) { return pode(PERMISSAO_LEITURA[nome]); }).reduce(function(fila, nome) {
      return fila.then(function() {
        return Promise.resolve(DataService[nome]()).catch(function() {});
      });
    }, Promise.resolve());
  }

  function textoIdade(ms) {
    if (!ms) return "";
    var min = Math.floor((Date.now() - ms) / 60000);
    if (min < 1) return "atualizado agora";
    if (min < 60) return "atualizado há " + min + " min";
    var d = new Date(ms);
    return "atualizado às " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  function atualizarIndicadores() {
    if (!window.DataService || !DataService.infoCacheAdmin) return;
    document.querySelectorAll(".atualizado-em[data-leitura]").forEach(function(el) {
      var em = DataService.infoCacheAdmin(el.getAttribute("data-leitura"));
      el.textContent = textoIdade(em);
      el.title = em ? "Dados buscados no servidor em " + new Date(em).toLocaleString("pt-BR") : "";
    });
  }

  window.addEventListener("admin-auth-success", function() { setTimeout(preCarregar, 1500); });
  window.addEventListener("cache-admin-gravado", atualizarIndicadores);
  window.addEventListener("painel-aberto", function() { setTimeout(atualizarIndicadores, 0); });
  document.addEventListener("DOMContentLoaded", function() {
    atualizarIndicadores();
    setInterval(atualizarIndicadores, 30000);
  });
})();
