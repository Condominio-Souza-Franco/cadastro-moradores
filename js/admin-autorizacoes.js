// ==========================================
// MEMBROS > AUTORIZAÇÕES (o que cada cargo pode fazer)
// ==========================================
// O botão "Autorizações" fica ao lado de "Desfazer" e "Salvar alterações" e alterna (toggle) entre o
// formulário de Membros e uma tabela: cargos nas colunas, páginas/ações nas linhas. Enquanto a tabela
// está aberta, "Desfazer" e "Salvar alterações" valem para ela. Condomínio, Síndico e Desenvolvedor
// editam (a coluna do Condomínio, só o Desenvolvedor; a do Desenvolvedor fica toda marcada);
// os demais veem a tabela desabilitada. O backend (autorizacoes.gs) confere tudo de novo.
(function() {
  var escaparHtml = window.Utils.escaparHtml;
  var NOMES = { condominio: "Condomínio", sindico: "Síndico", administradora: "Administradora", conselho: "Conselho", desenvolvedor: "Desenvolvedor" };
  var CURTOS = { condominio: "Cond.", sindico: "Síndico", administradora: "Adm.", conselho: "Conselho", desenvolvedor: "Dev." };
  var dados = null;       // resposta de fbObterAutorizacoes
  var atual = null;       // permissões sendo editadas
  var originais = "";
  var aberto = false;

  function el(id) { return document.getElementById(id); }

  function setStatus(texto, tipo) {
    var s = el("statusMembros");
    if (!s) return;
    s.className = "status" + (tipo ? " " + tipo : "");
    s.textContent = texto || "";
  }

  function fixa(cargo, chave) {
    return !!(dados && dados.fixas && dados.fixas[cargo] && dados.fixas[cargo].indexOf(chave) !== -1);
  }

  function renderizar() {
    var caixa = el("autorizacoesMembros");
    if (!caixa || !dados) return;
    // No celular, os nomes abreviados (Cond., Síndico, Adm., Conselho, Dev.).
    var cabecalho = "<tr><th>Página / autorização</th>" + dados.cargos.map(function(c) {
      return '<th><span class="rotulo-longo">' + NOMES[c] + '</span><span class="rotulo-curto">' + CURTOS[c] + "</span></th>";
    }).join("") + "</tr>";
    var linhas = dados.linhas.map(function(l) {
      return "<tr><td>" + escaparHtml(l.rotulo) + "</td>" + dados.cargos.map(function(c) {
        var marcado = atual[l.chave] && atual[l.chave][c];
        var travado = !dados.podeEditar || fixa(c, l.chave) || (dados.colunasTravadas || []).indexOf(c) !== -1;
        return '<td class="aut-celula"><label class="aut-check' + (travado ? " travado" : "") + '" title="' + escaparHtml(NOMES[c] + " — " + l.rotulo) + '">' +
          '<input type="checkbox" data-chave="' + l.chave + '" data-cargo="' + c + '"' + (marcado ? " checked" : "") + (travado ? " disabled" : "") + '>' +
          '<span class="aut-caixa" aria-hidden="true"></span></label></td>';
      }).join("") + "</tr>";
    }).join("");
    caixa.innerHTML =
      '<p class="descricao-acao">O Desenvolvedor tem acesso a tudo. A coluna do Condomínio só o Desenvolvedor altera. ' + (dados.podeEditar
        ? "Marque o que cada cargo pode ver e fazer."
        : "Somente visualização: só o Condomínio, o Síndico e o Desenvolvedor alteram as autorizações.") + "</p>" +
      '<div class="aut-tabela-rolagem"><table class="aut-tabela"><thead>' + cabecalho + "</thead><tbody>" + linhas + "</tbody></table></div>";
    atualizarBotoes();
  }

  function alterado() { return JSON.stringify(atual) !== originais; }

  function atualizarBotoes() {
    if (!aberto) return;
    var salvar = el("btnSalvarMembros"), desfazer = el("btnDesfazerMembros");
    var pode = !!(dados && dados.podeEditar);
    if (salvar) { salvar.hidden = !pode; salvar.disabled = !alterado(); }
    if (desfazer) { desfazer.hidden = !pode; desfazer.disabled = !alterado(); }
  }

  function carregar() {
    setStatus("Carregando...", "carregando");
    return window.Backend.chamar("fbObterAutorizacoes", {}, true).then(function(r) {
      if (!r || !r.sucesso) throw new Error((r && r.mensagem) || "Não foi possível carregar as autorizações.");
      dados = r;
      atual = JSON.parse(JSON.stringify(r.permissoes));
      originais = JSON.stringify(atual);
      setStatus("", "");
      renderizar();
    }).catch(function(erro) { setStatus((erro && erro.message) || "Não foi possível carregar as autorizações.", "erro"); });
  }

  function abrir(sim) {
    if (!sim && aberto && alterado() && !window.confirm("Há alterações não salvas nas autorizações. Fechar e descartar?")) return;
    aberto = sim;
    var botao = el("btnAutorizacoes");
    if (botao) { botao.classList.toggle("ativo", sim); botao.setAttribute("aria-pressed", sim ? "true" : "false"); }
    // Uma tela por vez: com Autorizações aberta, somem o formulário e a descrição de Membros.
    el("formMembros").hidden = sim;
    el("autorizacoesMembros").hidden = !sim;
    var titulo = document.querySelector("#painelMembros .painel-topo h2");
    if (titulo) titulo.textContent = sim ? "Membros > Autorizações" : "Membros";
    var descricao = el("descricaoMembros");
    if (descricao) descricao.hidden = sim;
    var atualizar = el("btnAtualizarMembros");
    if (atualizar) atualizar.hidden = sim;
    if (sim) {
      carregar();
    } else {
      setStatus("", "");
      if (typeof window.atualizarBotoesMembros === "function") window.atualizarBotoesMembros();
    }
  }

  function salvar() {
    if (window.setOverlayAdmin) window.setOverlayAdmin(true, "Aguarde: salvando as autorizações...");
    window.Backend.chamar("fbSalvarAutorizacoes", { permissoes: atual }, true).then(function(r) {
      if (!r || !r.sucesso) throw new Error((r && r.mensagem) || "Não foi possível salvar.");
      dados = r;
      atual = JSON.parse(JSON.stringify(r.permissoes));
      originais = JSON.stringify(atual);
      renderizar();
      setStatus("Autorizações salvas. Quem já está logado vê a mudança ao entrar de novo.", "ok");
    }).catch(function(erro) { setStatus((erro && erro.message) || "Não foi possível salvar.", "erro"); })
      .then(function() { if (window.setOverlayAdmin) window.setOverlayAdmin(false); });
  }

  document.addEventListener("DOMContentLoaded", function() {
    var botao = el("btnAutorizacoes");
    if (!botao || !window.Backend) return;
    botao.addEventListener("click", function() { abrir(!aberto); });
    // O × do topo, com Autorizações aberta, volta para Membros (em vez de fechar a página).
    document.querySelector("#painelMembros .btn-fechar-painel").addEventListener("click", function(e) {
      if (!aberto) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      abrir(false);
    }, true);
    el("autorizacoesMembros").addEventListener("change", function(e) {
      var c = e.target.closest("input[data-chave]");
      if (!c) return;
      atual[c.getAttribute("data-chave")][c.getAttribute("data-cargo")] = c.checked;
      atualizarBotoes();
    });
    // Com a tabela aberta, "Desfazer" e "Salvar alterações" valem para ela (fase de captura: antes do Membros).
    el("btnSalvarMembros").addEventListener("click", function(e) {
      if (!aberto) return;
      e.stopImmediatePropagation();
      salvar();
    }, true);
    el("btnDesfazerMembros").addEventListener("click", function(e) {
      if (!aberto) return;
      e.stopImmediatePropagation();
      atual = JSON.parse(originais);
      renderizar();
      setStatus("", "");
    }, true);
    window.addEventListener("painel-aberto", function(e) {
      if (e.detail && e.detail.id !== "painelMembros" && aberto) { aberto = false; abrir(false); }
    });
  });
})();
