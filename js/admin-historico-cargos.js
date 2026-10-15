// ==========================================
// DADOS > HISTÓRICO DE CARGOS
// ==========================================
// Registro, preenchido à mão, de quem ocupou cada cargo (síndico, subsíndico, conselho...) e por
// quanto tempo. O morador pode ser escolhido na lista de cadastros do sistema (o e-mail vem do
// cadastro) ou digitado (nome à mão, e-mail opcional). Cada ação (adicionar, editar, remover) grava a
// lista inteira no servidor. O e-mail serve para o chip "Ex-síndico (2026)" em "Últimas alterações
// cadastrais" quando quem alterou um cadastro já não tem o cargo.
// Ler: autorização "dados"; gravar: "dadosEscrever" (o backend confere de novo).
(function() {
  var escaparHtml = window.Utils.escaparHtml;
  var itens = [];
  var carregado = false;
  var carregando = false;
  var moradoresCarregados = false;
  var editandoId = "";

  function el(id) { return document.getElementById(id); }

  function setStatus(texto, tipo) {
    var s = el("statusHistoricoCargos");
    if (!s) return;
    s.className = "status" + (tipo ? " " + tipo : "");
    s.textContent = texto || "";
  }

  function podeEscrever() {
    return !window.AdminPermissoes || window.AdminPermissoes.pode("dadosEscrever");
  }

  function novoId() {
    return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // "2026-03-01" -> "01/03/2026"
  function dataBr(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return m ? m[3] + "/" + m[2] + "/" + m[1] : "";
  }

  // Tempo no cargo: "2 anos e 3 meses" (até hoje, se ainda em exercício).
  function duracao(inicio, fim) {
    var a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(inicio || "");
    if (!a) return "";
    var f = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fim || "");
    var hoje = new Date();
    var ano2 = f ? +f[1] : hoje.getFullYear(), mes2 = f ? +f[2] : hoje.getMonth() + 1, dia2 = f ? +f[3] : hoje.getDate();
    var meses = (ano2 - +a[1]) * 12 + (mes2 - +a[2]) - (dia2 < +a[3] ? 1 : 0);
    if (meses < 0) return "";
    var anos = Math.floor(meses / 12), resto = meses % 12;
    var partes = [];
    if (anos) partes.push(anos + (anos === 1 ? " ano" : " anos"));
    if (resto) partes.push(resto + (resto === 1 ? " mês" : " meses"));
    return partes.length ? partes.join(" e ") : "menos de 1 mês";
  }

  function ordenados() {
    return itens.slice().sort(function(x, y) { return x.inicio < y.inicio ? 1 : (x.inicio > y.inicio ? -1 : 0); });
  }

  function renderizar() {
    var lista = el("listaHistoricoCargos");
    if (!lista) return;
    var escreve = podeEscrever();
    if (!itens.length) {
      lista.innerHTML = '<p class="sem-itens">Nenhum registro ainda.</p>';
      return;
    }
    lista.innerHTML = ordenados().map(function(i) {
      var periodo = dataBr(i.inicio) + " → " + (i.fim ? dataBr(i.fim) : "em exercício");
      var tempo = duracao(i.inicio, i.fim);
      return '<div class="cargo-hist-item' + (i.fim ? "" : " atual") + '">' +
        '<div class="cargo-hist-topo"><strong>' + escaparHtml(i.cargo) + "</strong>" +
          '<span class="cargo-hist-acoes">' +
            '<button type="button" class="btn-cargo-editar" data-id="' + escaparHtml(i.id) + '" title="Editar"' + (escreve ? "" : " disabled") + ">Editar</button>" +
            '<button type="button" class="btn-cargo-remover" data-id="' + escaparHtml(i.id) + '" title="Remover" aria-label="Remover"' + (escreve ? "" : " disabled") + ">&times;</button>" +
          "</span></div>" +
        '<div class="cargo-hist-nome">' + escaparHtml(i.nome) + (i.apto ? " · apto " + escaparHtml(i.apto) : "") + "</div>" +
        '<div class="cargo-hist-periodo">' + escaparHtml(periodo) + (tempo ? " · " + escaparHtml(tempo) : "") + "</div>" +
      "</div>";
    }).join("");
  }

  function limparFormulario() {
    editandoId = "";
    ["cargoHistCargo", "cargoHistNome", "cargoHistEmail", "cargoHistInicio", "cargoHistFim"].forEach(function(id) { el(id).value = ""; });
    el("cargoHistMorador").value = "";
    el("cargoHistNome").readOnly = false;
    el("btnSalvarCargoHist").textContent = "Adicionar";
    el("btnCancelarCargoHist").hidden = true;
  }

  // ---- gravação (a lista inteira)
  function gravar(novaLista, mensagemOk) {
    if (window.setOverlayAdmin) window.setOverlayAdmin(true, "Aguarde: salvando");
    return DataService.salvarHistoricoCargos(novaLista).then(function(r) {
      if (!r || !r.sucesso) throw new Error((r && r.mensagem) || "Não foi possível salvar.");
      itens = r.itens || novaLista;
      renderizar();
      setStatus(mensagemOk, "ok");
      return true;
    }).catch(function(erro) {
      setStatus((erro && erro.message) || "Não foi possível salvar.", "erro");
      return false;
    }).then(function(ok) {
      if (window.setOverlayAdmin) window.setOverlayAdmin(false);
      return ok;
    });
  }

  function salvarFormulario(e) {
    e.preventDefault();
    if (!podeEscrever()) return;
    var cargo = el("cargoHistCargo").value.trim();
    var nome = el("cargoHistNome").value.trim();
    var inicio = el("cargoHistInicio").value;
    var fim = el("cargoHistFim").value;
    if (!cargo) { setStatus("Informe o cargo.", "erro"); return; }
    if (!nome) { setStatus("Escolha um morador ou digite o nome.", "erro"); return; }
    if (!inicio) { setStatus("Informe a data de início.", "erro"); return; }
    if (fim && fim < inicio) { setStatus("O fim não pode ser antes do início.", "erro"); return; }

    var sel = el("cargoHistMorador");
    var opcao = sel.options[sel.selectedIndex];
    var novo = {
      id: editandoId || novoId(), cargo: cargo, nome: nome,
      apto: opcao && sel.value ? opcao.getAttribute("data-apto") || "" : "",
      cadastroId: opcao && sel.value ? opcao.getAttribute("data-id") || "" : "",
      email: el("cargoHistEmail").value.trim(), inicio: inicio, fim: fim
    };
    // Editando sem trocar de morador: mantém o apto e o cadastro que já estavam.
    if (editandoId && !sel.value) {
      var antigo = itens.filter(function(i) { return i.id === editandoId; })[0];
      if (antigo && antigo.nome === nome) { novo.apto = antigo.apto; novo.cadastroId = antigo.cadastroId; }
    }
    var nova = editandoId
      ? itens.map(function(i) { return i.id === editandoId ? novo : i; })
      : itens.concat([novo]);
    gravar(nova, editandoId ? "Registro atualizado." : "Registro adicionado.").then(function(ok) { if (ok) limparFormulario(); });
  }

  function editar(id) {
    var i = itens.filter(function(x) { return x.id === id; })[0];
    if (!i) return;
    editandoId = id;
    el("cargoHistCargo").value = i.cargo;
    el("cargoHistNome").value = i.nome;
    el("cargoHistEmail").value = i.email || "";
    el("cargoHistInicio").value = i.inicio;
    el("cargoHistFim").value = i.fim || "";
    el("cargoHistMorador").value = "";
    el("btnSalvarCargoHist").textContent = "Salvar alterações";
    el("btnCancelarCargoHist").hidden = false;
    setStatus("", "");
    el("formCargoHist").scrollIntoView({ block: "nearest" });
  }

  function remover(id) {
    var i = itens.filter(function(x) { return x.id === id; })[0];
    if (!i || !podeEscrever()) return;
    if (!window.confirm("Remover do histórico: " + i.cargo + " — " + i.nome + "?")) return;
    gravar(itens.filter(function(x) { return x.id !== id; }), "Registro removido.");
  }

  // ---- carregamento
  function carregar() {
    if (carregando) return;
    carregando = true;
    setStatus("Carregando", "carregando");
    DataService.obterHistoricoCargos().then(function(r) {
      if (!r || !r.sucesso) throw new Error((r && r.mensagem) || "Não foi possível carregar o histórico de cargos.");
      itens = r.itens || [];
      carregado = true;
      setStatus("", "");
      renderizar();
    }).catch(function(erro) {
      setStatus((erro && erro.message) || "Não foi possível carregar o histórico de cargos.", "erro");
    }).then(function() { carregando = false; });
  }

  // Moradores com cadastro (mesma lista da Consulta por apartamento), para escolher em vez de digitar.
  function carregarMoradores() {
    if (moradoresCarregados) return;
    moradoresCarregados = true;
    DataService.listarApartamentos().then(function(r) {
      var sel = el("cargoHistMorador");
      var html = '<option value="">Digitar o nome à mão</option>';
      ((r && r.itens) || []).forEach(function(item) {
        (item.opcoes || []).forEach(function(o) {
          var id = String(o.id || o.ocorrencia || "").trim();
          if (!id) return;
          html += '<option value="' + escaparHtml(item.apto + "__" + id) + '" data-apto="' + escaparHtml(item.apto) + '" data-id="' + escaparHtml(id) +
            '" data-nome="' + escaparHtml(String(o.label || "").replace(/^\s*[^-–—]*[-–—]\s*/, "")) + '">' + escaparHtml(o.label || item.apto) + "</option>";
        });
      });
      sel.innerHTML = html;
    }).catch(function() { moradoresCarregados = false; });
  }

  function trocarAba(aba) {
    var historico = aba === "historico";
    el("dadosGeral").hidden = historico;
    el("dadosHistorico").hidden = !historico;
    el("abaDadosGeral").classList.toggle("ativo", !historico);
    el("abaDadosHistorico").classList.toggle("ativo", historico);
    if (historico) {
      if (!carregado) carregar();
      carregarMoradores();
      var escreve = podeEscrever();
      Array.prototype.forEach.call(el("formCargoHist").elements, function(c) { c.disabled = !escreve; });
      el("avisoSoLeituraCargos").hidden = escreve;
    }
  }

  document.addEventListener("DOMContentLoaded", function() {
    if (!el("dadosHistorico") || !window.DataService) return;
    el("abaDadosGeral").addEventListener("click", function() { trocarAba("geral"); });
    el("abaDadosHistorico").addEventListener("click", function() { trocarAba("historico"); });
    el("formCargoHist").addEventListener("submit", salvarFormulario);
    el("btnCancelarCargoHist").addEventListener("click", function() { limparFormulario(); setStatus("", ""); });
    el("cargoHistMorador").addEventListener("change", function() {
      var sel = el("cargoHistMorador");
      var op = sel.options[sel.selectedIndex];
      var nomeEl = el("cargoHistNome");
      if (sel.value && op) { nomeEl.value = op.getAttribute("data-nome") || nomeEl.value; nomeEl.readOnly = true; }
      else { nomeEl.readOnly = false; }
    });
    el("listaHistoricoCargos").addEventListener("click", function(e) {
      var b = e.target.closest("button[data-id]");
      if (!b) return;
      if (b.classList.contains("btn-cargo-editar")) editar(b.getAttribute("data-id"));
      else if (b.classList.contains("btn-cargo-remover")) remover(b.getAttribute("data-id"));
    });
    // Sempre que a página Dados é aberta, volta para a visão geral.
    var abrir = el("btnAbrirFonteDados");
    if (abrir) abrir.addEventListener("click", function() { trocarAba("geral"); });
  });
})();
