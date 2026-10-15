// ==========================================
// DADOS > HISTÓRICO DE CARGOS
// ==========================================
// Registro, preenchido à mão, de quem ocupou cada cargo (síndico, subsíndico, conselheiro) e por quanto
// tempo. O morador pode ser escolhido na lista de cadastros do sistema (apto preenchido sozinho) ou
// digitado à mão, com o apto. Início e fim usam a mesma máscara de data do login do morador
// (js/mascaras.js, DD/MM/AAAA); fim vazio = em exercício. "Cargos atuais" mostra, a partir de Membros,
// quem ocupa hoje Síndico e Conselho e ainda não está no histórico: "Registrar" preenche o formulário e
// só falta a data de início. Cada ação (adicionar, editar, remover) grava a lista inteira no servidor.
// O servidor guarda também o e-mail (do cadastro) só para o chip "Ex-síndico (2026)" em "Últimas
// alterações cadastrais". Ler: autorização "dados"; gravar: "dadosEscrever" (o backend confere de novo).
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

  // ---- datas: o campo mostra DD/MM/AAAA; o servidor guarda AAAA-MM-DD
  function dataBrParaIso(br) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(br || "").trim());
    if (!m) return "";
    var d = new Date(+m[3], +m[2] - 1, +m[1]);
    return d.getFullYear() === +m[3] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[1] ? m[3] + "-" + m[2] + "-" + m[1] : "";
  }

  function dataIsoParaBr(iso) {
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
    } else {
      lista.innerHTML = ordenados().map(function(i) {
        var periodo = dataIsoParaBr(i.inicio) + " → " + (i.fim ? dataIsoParaBr(i.fim) : "em exercício");
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
    renderizarCargosAtuais();
  }

  // ---- cargos atuais (de Membros) que ainda não estão no histórico
  var atuais = [];   // [{ cargo, nome, apto, cadastroId }]

  function jaRegistrado(a) {
    return itens.some(function(i) { return !i.fim && i.cargo === a.cargo && i.cadastroId === a.cadastroId; });
  }

  function renderizarCargosAtuais() {
    var caixa = el("cargosAtuais");
    if (!caixa) return;
    var faltam = atuais.filter(function(a) { return !jaRegistrado(a); });
    caixa.hidden = !faltam.length || !podeEscrever();
    if (caixa.hidden) return;
    el("listaCargosAtuais").innerHTML = faltam.map(function(a, n) {
      return '<div class="cargo-atual-linha"><span><strong>' + escaparHtml(a.cargo) + "</strong> · " + escaparHtml(a.nome) +
        (a.apto ? " · apto " + escaparHtml(a.apto) : "") + '</span><button type="button" class="btn-registrar-cargo-atual" data-n="' + n + '">Registrar</button></div>';
    }).join("");
    caixa._faltam = faltam;
  }

  function carregarCargosAtuais() {
    if (!window.DataService || (window.AdminPermissoes && !window.AdminPermissoes.pode("membros"))) return;
    DataService.obterMembros().then(function(r) {
      if (!r || !r.sucesso || !r.membros) return;
      var porId = {};
      (r.candidatos || []).forEach(function(c) { porId[c.id] = c; });
      var lista = [];
      function add(cargo, c) {
        var cad = c && c.cadastroId ? porId[c.cadastroId] : null;
        if (cad) lista.push({ cargo: cargo, nome: cad.nome || "(sem nome)", apto: cad.apto || "", cadastroId: cad.id });
      }
      add("Síndico", r.membros.sindico);
      (r.membros.conselho || []).forEach(function(c) { add("Conselheiro", c); });
      atuais = lista;
      renderizarCargosAtuais();
    }).catch(function() {});
  }

  // ---- formulário
  function limparFormulario() {
    editandoId = "";
    ["cargoHistNome", "cargoHistApto", "cargoHistInicio", "cargoHistFim"].forEach(function(id) { el(id).value = ""; });
    el("cargoHistCargo").value = "";
    el("cargoHistMorador").value = "";
    el("cargoHistNome").readOnly = false;
    el("cargoHistApto").readOnly = false;
    el("btnSalvarCargoHist").textContent = "Adicionar";
    el("btnCancelarCargoHist").hidden = true;
  }

  // Seleciona o cargo na lista; se for um cargo fora da lista (registro antigo), acrescenta como opção.
  function escolherCargo(cargo) {
    var sel = el("cargoHistCargo");
    var existe = Array.prototype.some.call(sel.options, function(o) { return o.value === cargo; });
    if (cargo && !existe) {
      var o = document.createElement("option");
      o.value = cargo; o.textContent = cargo;
      sel.appendChild(o);
    }
    sel.value = cargo || "";
  }

  function escolherMorador(cadastroId, apto) {
    var sel = el("cargoHistMorador");
    var achou = "";
    Array.prototype.forEach.call(sel.options, function(o) {
      if (cadastroId && o.getAttribute("data-id") === cadastroId && (!apto || o.getAttribute("data-apto") === apto)) achou = o.value;
    });
    sel.value = achou;
    return !!achou;
  }

  function aplicarMoradorSelecionado() {
    var sel = el("cargoHistMorador");
    var op = sel.options[sel.selectedIndex];
    var nomeEl = el("cargoHistNome"), aptoEl = el("cargoHistApto");
    if (sel.value && op) {
      nomeEl.value = op.getAttribute("data-nome") || nomeEl.value;
      aptoEl.value = op.getAttribute("data-apto") || "";
      nomeEl.readOnly = true;
      aptoEl.readOnly = true;
    } else {
      nomeEl.readOnly = false;
      aptoEl.readOnly = false;
    }
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
    var cargo = el("cargoHistCargo").value;
    var nome = el("cargoHistNome").value.trim();
    var apto = el("cargoHistApto").value.trim();
    var inicio = dataBrParaIso(el("cargoHistInicio").value);
    var fimTexto = el("cargoHistFim").value.trim();
    var fim = fimTexto ? dataBrParaIso(fimTexto) : "";
    if (!cargo) { setStatus("Escolha o cargo.", "erro"); return; }
    if (!nome) { setStatus("Escolha um morador ou digite o nome.", "erro"); return; }
    if (!inicio) { setStatus("Informe a data de início (DD/MM/AAAA).", "erro"); return; }
    if (fimTexto && !fim) { setStatus("Data de fim inválida (DD/MM/AAAA), ou deixe vazio se continua em exercício.", "erro"); return; }
    if (fim && fim < inicio) { setStatus("O fim não pode ser antes do início.", "erro"); return; }

    var sel = el("cargoHistMorador");
    var op = sel.options[sel.selectedIndex];
    var antigo = editandoId ? itens.filter(function(i) { return i.id === editandoId; })[0] : null;
    var novo = {
      id: editandoId || novoId(), cargo: cargo, nome: nome, apto: apto,
      cadastroId: sel.value && op ? op.getAttribute("data-id") || "" : (antigo && antigo.nome === nome ? antigo.cadastroId : ""),
      email: antigo && antigo.nome === nome ? antigo.email || "" : "",
      inicio: inicio, fim: fim
    };
    var nova = editandoId
      ? itens.map(function(i) { return i.id === editandoId ? novo : i; })
      : itens.concat([novo]);
    gravar(nova, editandoId ? "Registro atualizado." : "Registro adicionado.").then(function(ok) { if (ok) limparFormulario(); });
  }

  function editar(id) {
    var i = itens.filter(function(x) { return x.id === id; })[0];
    if (!i) return;
    limparFormulario();
    editandoId = id;
    escolherCargo(i.cargo);
    el("cargoHistNome").value = i.nome;
    el("cargoHistApto").value = i.apto || "";
    el("cargoHistInicio").value = dataIsoParaBr(i.inicio);
    el("cargoHistFim").value = dataIsoParaBr(i.fim);
    if (escolherMorador(i.cadastroId, i.apto)) aplicarMoradorSelecionado();
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

  // "Registrar" num cargo atual: preenche o formulário; falta só a data de início.
  function registrarAtual(a) {
    limparFormulario();
    escolherCargo(a.cargo);
    if (escolherMorador(a.cadastroId, a.apto)) aplicarMoradorSelecionado();
    else { el("cargoHistNome").value = a.nome; el("cargoHistApto").value = a.apto; }
    setStatus("Informe a data de início de " + a.cargo + " e toque em Adicionar.", "");
    el("cargoHistInicio").focus();
    el("formCargoHist").scrollIntoView({ block: "nearest" });
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
      carregarCargosAtuais();
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
    el("cargoHistMorador").addEventListener("change", aplicarMoradorSelecionado);
    el("listaHistoricoCargos").addEventListener("click", function(e) {
      var b = e.target.closest("button[data-id]");
      if (!b) return;
      if (b.classList.contains("btn-cargo-editar")) editar(b.getAttribute("data-id"));
      else if (b.classList.contains("btn-cargo-remover")) remover(b.getAttribute("data-id"));
    });
    el("cargosAtuais").addEventListener("click", function(e) {
      var b = e.target.closest(".btn-registrar-cargo-atual");
      var faltam = el("cargosAtuais")._faltam || [];
      if (b && faltam[+b.getAttribute("data-n")]) registrarAtual(faltam[+b.getAttribute("data-n")]);
    });
    // Sempre que a página Dados é aberta, volta para a visão geral.
    var abrir = el("btnAbrirFonteDados");
    if (abrir) abrir.addEventListener("click", function() { trocarAba("geral"); });
  });
})();
