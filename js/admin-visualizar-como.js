// ==========================================
// VISUALIZAR COMO (SÓ PARA O DESENVOLVEDOR)
// ==========================================
// Menu "Visualizar como" no topo da administração: o desenvolvedor escolhe um cargo (Condomínio, Síndico,
// Administradora, Conselho) e a tela passa a mostrar o que aquele cargo vê e pode usar (páginas, bolinhas e
// botões desativados), com as autorizações que estão salvas em Membros > Autorizações.
//
// É só uma simulação da TELA: o servidor continua conferindo tudo com as permissões reais do desenvolvedor,
// então nada é gravado "como" outra pessoa e nenhum dado a mais é exposto. A escolha fica só nesta aba
// (sessionStorage) e some ao sair. Ao trocar, a página recarrega para a administração inteira (menu,
// bolinhas, pré-carga) nascer já com as permissões escolhidas.
(function() {
  var NOMES = { condominio: "Condomínio", sindico: "Síndico", administradora: "Administradora", conselho: "Conselho (membro)" };

  function el(id) { return document.getElementById(id); }

  function atual() {
    var s = window.AdminAuth && window.AdminAuth.getSimulacao ? window.AdminAuth.getSimulacao() : null;
    return s ? s.cargo : "desenvolvedor";
  }

  // Autorizações salvas -> { chave: true/false } do cargo escolhido (a tabela já vem normalizada do servidor).
  function permissoesDoCargo(r, cargo) {
    var out = {};
    Object.keys(r.permissoes || {}).forEach(function(chave) {
      out[chave] = !!(r.permissoes[chave] && r.permissoes[chave][cargo]);
    });
    return out;
  }

  function trocar(cargo) {
    var A = window.AdminAuth;
    if (cargo === "desenvolvedor") { A.limparSimulacao(); window.location.reload(); return; }
    if (window.setOverlayAdmin) window.setOverlayAdmin(true, "Aguarde: preparando a visualização");
    window.Backend.chamar("fbObterAutorizacoes", {}, true).then(function(r) {
      if (!r || !r.sucesso) throw new Error((r && r.mensagem) || "Não foi possível ler as autorizações.");
      A.definirSimulacao(cargo, permissoesDoCargo(r, cargo));
      window.location.reload();
    }).catch(function(erro) {
      if (window.setOverlayAdmin) window.setOverlayAdmin(false);
      el("visualizarComoSelect").value = atual();
      window.alert((erro && erro.message) || "Não foi possível trocar a visualização.");
    });
  }

  function montar() {
    var A = window.AdminAuth;
    var caixa = el("visualizarComo");
    if (!caixa || !A || A.getPapelReal() !== "desenvolvedor") return;
    caixa.hidden = false;
    var select = el("visualizarComoSelect");
    select.value = atual();
    var banner = el("avisoVisualizarComo");
    var sim = A.getSimulacao();
    if (banner) {
      banner.hidden = !sim;
      if (sim) el("avisoVisualizarComoTexto").textContent = "Visualizando como " + (NOMES[sim.cargo] || sim.cargo) +
        " (só a tela; o servidor continua com as suas permissões de desenvolvedor).";
    }
  }

  document.addEventListener("DOMContentLoaded", function() {
    var select = el("visualizarComoSelect");
    if (!select) return;
    select.addEventListener("change", function() { trocar(select.value); });
    var voltar = el("btnVoltarVisualizarComo");
    if (voltar) voltar.addEventListener("click", function() { trocar("desenvolvedor"); });
    montar();
  });
  window.addEventListener("admin-auth-success", montar);
})();
