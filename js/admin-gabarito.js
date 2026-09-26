// ==========================================
// GABARITO DE VAGAS (ADMIN)
// ==========================================
// Tabela editável Apto | Garagem | Vaga, uma linha por vaga (o 901, com 3 vagas, tem 3 linhas).
// Carrega ao abrir a página pela primeira vez. Cada linha é conferida com o desenho da garagem
// (os SVGs em mapas/, onde cada vaga é um <g data-vaga>): avisa quando a vaga não existe no
// desenho, é do condomínio ou já está com outro apto — mas deixa salvar mesmo assim.
// Modo "Mapa": o mesmo gabarito desenhado na planta; tocar numa vaga abre um seletor de apto.
// Tabela e mapa editam as mesmas linhas, e o "Salvar alterações" vale para os dois.
(function() {
  var escaparHtml = window.Utils.escaparHtml;
  var GARAGENS = ["G1", "G2"];

  var aptos = [];          // todos os apartamentos (ordem do gabarito)
  var linhas = [];         // [{ apto, garagem, vaga }]
  var originais = "";      // JSON das linhas carregadas (para saber se há alterações)
  var desenho = null;      // { "G1": { "17": { condominio, desativada }, ... }, "G2": {...} }
  var carregado = false;
  var carregando = false;
  var svgs = {};           // texto dos SVGs de cada garagem (modo mapa)
  var modo = "tabela";
  var garagemMapa = "G1";
  var vagaEditada = null;  // número da vaga aberta no editor do mapa ("14", "1/2"...)

  function setStatus(texto, tipo) {
    var el = document.getElementById("statusGabarito");
    if (!el) return;
    el.className = "status" + (tipo ? " " + tipo : "");
    el.textContent = texto || "";
  }

  // "10, 25 e 26" -> ["10","25","26"]; "1 / 2" -> ["1","2"]; "?" -> [].
  function separarVagas(texto) {
    var t = String(texto || "").trim();
    if (!t || t === "?") return [];
    return t.split(/,|\se\s|\//).map(function(s) { return s.trim(); }).filter(Boolean);
  }

  // Vagas de cada garagem segundo o desenho (lidas dos próprios SVGs dos mapas).
  function carregarDesenho() {
    return Promise.all(GARAGENS.map(function(g) {
      return fetch("mapas/mapa-garagem-" + g + ".svg", { cache: "no-cache" })
        .then(function(r) { return r.ok ? r.text() : ""; })
        .catch(function() { return ""; });
    })).then(function(textos) {
      var mapa = {};
      textos.forEach(function(svg, i) {
        svgs[GARAGENS[i]] = svg;
        var vagas = {};
        if (svg) {
          var doc = new DOMParser().parseFromString(svg, "image/svg+xml");
          doc.querySelectorAll("g[data-vaga]").forEach(function(el) {
            var classes = el.getAttribute("class") || "";
            vagas[el.getAttribute("data-vaga")] = {
              condominio: classes.indexOf("condominio") !== -1,
              desativada: classes.indexOf("desativada") !== -1
            };
          });
        }
        mapa[GARAGENS[i]] = vagas;
      });
      return mapa;
    });
  }

  // Vaga dupla "1/2" do G2: no gabarito aparece como as vagas 1 e 2.
  function vagaNoDesenho(garagem, vaga) {
    var vagas = (desenho && desenho[garagem]) || {};
    if (vagas[vaga]) return vagas[vaga];
    if (garagem === "G2" && (vaga === "1" || vaga === "2")) return vagas["1/2"] || null;
    return null;
  }

  function avisosDaLinha(linha, indice) {
    var avisos = [];
    if (!linha.apto) avisos.push({ erro: true, texto: "Escolha o apartamento." });
    if (!linha.garagem) avisos.push({ erro: true, texto: "Escolha a garagem." });
    if (!linha.vaga) avisos.push({ erro: true, texto: "Informe o número da vaga." });
    if (!linha.apto || !linha.garagem || !linha.vaga) return avisos;

    if (desenho && Object.keys(desenho[linha.garagem] || {}).length) {
      var noDesenho = vagaNoDesenho(linha.garagem, linha.vaga);
      if (!noDesenho) avisos.push({ texto: "A vaga " + linha.vaga + " não existe no desenho do " + linha.garagem + "." });
      else if (noDesenho.desativada) avisos.push({ texto: "No desenho, a vaga " + linha.vaga + " do " + linha.garagem + " está desativada." });
      else if (noDesenho.condominio) avisos.push({ texto: "No desenho, a vaga " + linha.vaga + " do " + linha.garagem + " é do condomínio." });
    }
    linhas.forEach(function(outra, j) {
      if (j !== indice && outra.apto && outra.apto !== linha.apto && outra.garagem === linha.garagem && outra.vaga === linha.vaga) {
        avisos.push({ texto: "Vaga também atribuída ao apto " + outra.apto + "." });
      }
    });
    var outraGaragem = linhas.some(function(outra) { return outra.apto === linha.apto && outra.garagem && outra.garagem !== linha.garagem; });
    if (outraGaragem) avisos.push({ erro: true, texto: "O apto " + linha.apto + " tem vagas no G1 e no G2; o sistema guarda uma garagem por apartamento." });
    return avisos;
  }

  function opcoes(lista, selecionado, vazio) {
    return '<option value="">' + vazio + "</option>" + lista.map(function(v) {
      return '<option value="' + escaparHtml(v) + '"' + (v === selecionado ? " selected" : "") + ">" + escaparHtml(v) + "</option>";
    }).join("");
  }

  function renderizar() {
    var tabela = document.getElementById("tabelaGabarito");
    if (!tabela) return;
    tabela.innerHTML = linhas.map(function(l, i) {
      var avisos = avisosDaLinha(l, i);
      return '<div class="gabarito-linha' + (avisos.length ? " com-aviso" : "") + '" data-indice="' + i + '">' +
        '<select data-campo="apto" aria-label="Apartamento">' + opcoes(aptos, l.apto, "Apto") + "</select>" +
        '<select data-campo="garagem" aria-label="Garagem">' + opcoes(GARAGENS, l.garagem, "—") + "</select>" +
        '<input data-campo="vaga" type="text" inputmode="numeric" maxlength="2" placeholder="nº" aria-label="Vaga" value="' + escaparHtml(l.vaga) + '">' +
        '<button type="button" class="btn-remover-linha" title="Remover esta vaga" aria-label="Remover esta vaga">&times;</button>' +
        (avisos.length ? '<div class="gabarito-avisos">' + avisos.map(function(a) {
          return '<span class="' + (a.erro ? "aviso-erro" : "aviso") + '">' + (a.erro ? "⛔ " : "⚠️ ") + escaparHtml(a.texto) + "</span>";
        }).join("") + "</div>" : "") +
      "</div>";
    }).join("") || '<p class="sem-itens">Nenhuma vaga no gabarito.</p>';
    atualizarBotoes();
    if (modo === "mapa") renderizarMapa();
  }

  // ---------- Modo mapa ----------
  // Números do gabarito que correspondem a uma vaga do desenho ("1/2" do G2 = vagas 1 e 2).
  function numerosDaVaga(garagem, vagaDesenho) {
    return garagem === "G2" && vagaDesenho === "1/2" ? ["1", "2"] : [vagaDesenho];
  }

  function indicesDaVaga(garagem, vagaDesenho) {
    var numeros = numerosDaVaga(garagem, vagaDesenho);
    var indices = [];
    linhas.forEach(function(l, i) { if (l.garagem === garagem && numeros.indexOf(l.vaga) !== -1) indices.push(i); });
    return indices;
  }

  function criarTextoSvg(g, texto, y, tamanho, cor) {
    var rect = g.querySelector("rect");
    var el = document.createElementNS("http://www.w3.org/2000/svg", "text");
    el.setAttribute("x", Number(rect.getAttribute("x")) + Number(rect.getAttribute("width")) / 2);
    el.setAttribute("y", y);
    el.setAttribute("text-anchor", "middle");
    el.setAttribute("font-size", tamanho);
    el.setAttribute("font-weight", "bold");
    el.setAttribute("fill", cor);
    el.textContent = texto;
    g.appendChild(el);
  }

  function renderizarMapa() {
    var container = document.getElementById("mapaGabarito");
    if (!container) return;
    if (!svgs[garagemMapa]) {
      container.innerHTML = '<p class="sem-itens">Não foi possível carregar o desenho do ' + garagemMapa + ".</p>";
      return;
    }
    container.innerHTML = svgs[garagemMapa];
    container.querySelectorAll("g[data-vaga]").forEach(function(g) {
      var n = g.getAttribute("data-vaga");
      var indices = indicesDaVaga(garagemMapa, n);
      var aptosDaVaga = indices.map(function(i) { return linhas[i].apto; })
        .filter(function(a, i, lista) { return a && lista.indexOf(a) === i; });
      var comAviso = indices.some(function(i) { return avisosDaLinha(linhas[i], i).length; });

      // Troca o apto escrito no desenho pelo do gabarito atual (que é o que vale).
      g.querySelectorAll("text[data-campo]").forEach(function(t) { t.remove(); });
      var rect = g.querySelector("rect");
      var meio = Number(rect.getAttribute("y")) + Number(rect.getAttribute("height")) / 2 + 12;
      if (aptosDaVaga.length) {
        criarTextoSvg(g, aptosDaVaga.join(" / "), meio, aptosDaVaga.length > 1 ? 28 : 40, "#1d2b3a");
      } else {
        var condominio = (g.getAttribute("class") || "").indexOf("condominio") !== -1;
        criarTextoSvg(g, condominio ? "CONDOMÍNIO" : "livre", meio, 22, condominio ? "#4a6b8a" : "#9aa5b1");
      }
      g.classList.toggle("com-aviso", comAviso);
      g.classList.toggle("selecionada", n === vagaEditada);
    });
  }

  function abrirEditorVaga(n) {
    vagaEditada = n;
    var indices = indicesDaVaga(garagemMapa, n);
    var atual = indices.length ? linhas[indices[0]].apto : "";
    document.getElementById("editorVagaTitulo").textContent = "Vaga " + n + " · " + garagemMapa;
    document.getElementById("editorVagaApto").innerHTML = '<option value="">— livre —</option>' + aptos.map(function(a) {
      return '<option value="' + escaparHtml(a) + '"' + (a === atual ? " selected" : "") + ">" + escaparHtml(a) + "</option>";
    }).join("");
    var noDesenho = vagaNoDesenho(garagemMapa, numerosDaVaga(garagemMapa, n)[0]);
    var avisos = [];
    if (noDesenho && noDesenho.desativada) avisos.push("No desenho, esta vaga está desativada.");
    else if (noDesenho && noDesenho.condominio) avisos.push("No desenho, esta vaga é do condomínio.");
    indices.forEach(function(i) {
      avisosDaLinha(linhas[i], i).forEach(function(a) { if (avisos.indexOf(a.texto) === -1 && !/do condomínio|desativada/.test(a.texto)) avisos.push(a.texto); });
    });
    document.getElementById("editorVagaAvisos").innerHTML = avisos.map(function(a) { return '<span class="aviso">⚠️ ' + escaparHtml(a) + "</span>"; }).join("");
    document.getElementById("editorVagaMapa").hidden = false;
    renderizarMapa();
  }

  function fecharEditorVaga() {
    vagaEditada = null;
    document.getElementById("editorVagaMapa").hidden = true;
    renderizarMapa();
  }

  // Dá a vaga ao apto escolhido (ou deixa livre): tira quem estava nela e acrescenta a linha nova.
  function aplicarEditorVaga() {
    if (vagaEditada === null) return;
    var apto = document.getElementById("editorVagaApto").value;
    var remover = indicesDaVaga(garagemMapa, vagaEditada);
    linhas = linhas.filter(function(l, i) { return remover.indexOf(i) === -1; });
    if (apto) {
      numerosDaVaga(garagemMapa, vagaEditada).forEach(function(v) {
        linhas.push({ apto: apto, garagem: garagemMapa, vaga: v });
      });
    }
    ordenar();
    vagaEditada = null;
    document.getElementById("editorVagaMapa").hidden = true;
    renderizar();
  }

  function trocarModo(novo) {
    modo = novo;
    document.querySelectorAll(".gabarito-modos [data-modo]").forEach(function(b) {
      b.classList.toggle("ativo", b.getAttribute("data-modo") === novo);
    });
    document.getElementById("modoTabelaGabarito").hidden = novo !== "tabela";
    document.getElementById("modoMapaGabarito").hidden = novo !== "mapa";
    document.getElementById("btnAdicionarVagaGabarito").hidden = novo !== "tabela";
    if (novo === "mapa") renderizarMapa();
  }

  function haAlteracoes() {
    return JSON.stringify(linhasParaEnviar()) !== originais;
  }

  function atualizarBotoes() {
    var alterado = haAlteracoes();
    var salvar = document.getElementById("btnSalvarGabarito");
    var desfazer = document.getElementById("btnDesfazerGabarito");
    if (salvar) salvar.disabled = !alterado;
    if (desfazer) desfazer.disabled = !alterado;
  }

  function linhasParaEnviar() {
    return linhas.filter(function(l) { return l.apto || l.garagem || l.vaga; })
      .map(function(l) { return { apto: l.apto, garagem: l.garagem, vaga: l.vaga }; });
  }

  function ordenar() {
    linhas.sort(function(a, b) {
      var ia = aptos.indexOf(a.apto), ib = aptos.indexOf(b.apto);
      if (ia !== ib) return (ia === -1 ? 1e9 : ia) - (ib === -1 ? 1e9 : ib);
      return Number(a.vaga) - Number(b.vaga);
    });
  }

  function carregar() {
    if (carregando) return;
    carregando = true;
    setStatus("Carregando o gabarito...", "");
    Promise.all([DataService.obterGabaritoVagasCompleto(), desenho ? Promise.resolve(desenho) : carregarDesenho()])
      .then(function(r) {
        var resposta = r[0];
        desenho = r[1];
        if (!resposta || !resposta.sucesso || !Array.isArray(resposta.dados)) {
          setStatus((resposta && resposta.mensagem) || "Não foi possível carregar o gabarito.", "erro");
          return;
        }
        aptos = [];
        linhas = [];
        resposta.dados.forEach(function(d) {
          var apto = String(d[0] || "").trim();
          if (!apto) return;
          if (aptos.indexOf(apto) === -1) aptos.push(apto);
          var garagem = String(d[1] || "").trim().toUpperCase();
          separarVagas(d[2]).forEach(function(v) {
            linhas.push({ apto: apto, garagem: GARAGENS.indexOf(garagem) !== -1 ? garagem : "", vaga: v });
          });
        });
        aptos.sort(function(a, b) {
          var na = parseInt(a.replace(/\D/g, ""), 10) || Infinity, nb = parseInt(b.replace(/\D/g, ""), 10) || Infinity;
          return na !== nb ? (na < nb ? -1 : 1) : (a < b ? -1 : 1);
        });
        ordenar();
        originais = JSON.stringify(linhasParaEnviar());
        carregado = true;
        setStatus("", "");
        renderizar();
      })
      .catch(function(erro) {
        setStatus((erro && erro.message) || "Não foi possível carregar o gabarito.", "erro");
      })
      .then(function() { carregando = false; });
  }

  function salvar() {
    var enviar = linhasParaEnviar();
    var todosAvisos = [];
    var erros = [];
    linhas.forEach(function(l, i) {
      avisosDaLinha(l, i).forEach(function(a) { (a.erro ? erros : todosAvisos).push((l.apto || "?") + ": " + a.texto); });
    });
    if (erros.length) {
      setStatus("Corrija antes de salvar: " + erros[0], "erro");
      return;
    }
    if (todosAvisos.length && !window.confirm("Há " + todosAvisos.length + " aviso(s):\n\n" + todosAvisos.slice(0, 8).join("\n") +
      (todosAvisos.length > 8 ? "\n..." : "") + "\n\nSalvar mesmo assim?")) {
      return;
    }

    var botao = document.getElementById("btnSalvarGabarito");
    if (botao) botao.disabled = true;
    if (window.setOverlayAdmin) window.setOverlayAdmin(true, "Aguarde: salvando o gabarito de vagas...");
    DataService.salvarGabarito(enviar)
      .then(function(resposta) {
        if (!resposta || !resposta.sucesso) throw new Error((resposta && resposta.mensagem) || "Não foi possível salvar.");
        originais = JSON.stringify(linhasParaEnviar());
        var mudancas = resposta.mudancas || [];
        setStatus(mudancas.length
          ? "Salvo. " + mudancas.map(function(m) { return m.apto + ": " + m.de + " → " + m.para; }).join("; ")
          : (resposta.mensagem || "Nada mudou."), "ok");
        renderizar();
        // Histórico e relatórios se atualizam (a vaga aparece na lista de veículos e no mapa).
        if (mudancas.length) window.dispatchEvent(new CustomEvent("cadastro-alterado"));
      })
      .catch(function(erro) {
        setStatus((erro && erro.message) || "Não foi possível salvar o gabarito.", "erro");
        atualizarBotoes();
      })
      .then(function() {
        if (window.setOverlayAdmin) window.setOverlayAdmin(false);
      });
  }

  document.addEventListener("DOMContentLoaded", function() {
    var tabela = document.getElementById("tabelaGabarito");
    if (!tabela || !window.DataService) return;

    window.addEventListener("painel-aberto", function(e) {
      if (e.detail && e.detail.id === "painelGabarito" && !carregado) carregar();
    });

    tabela.addEventListener("input", function(e) {
      var campo = e.target.getAttribute("data-campo");
      var linhaEl = e.target.closest(".gabarito-linha");
      if (!campo || !linhaEl) return;
      if (campo === "vaga") e.target.value = e.target.value.replace(/\D/g, "").slice(0, 2);
      linhas[Number(linhaEl.getAttribute("data-indice"))][campo] = e.target.value;
      atualizarBotoes();
    });
    // Os avisos são recalculados ao sair do campo (e não a cada tecla, para não perder o foco).
    tabela.addEventListener("change", function(e) {
      if (e.target.getAttribute("data-campo")) renderizar();
    });
    tabela.addEventListener("click", function(e) {
      var botao = e.target.closest(".btn-remover-linha");
      if (!botao) return;
      linhas.splice(Number(botao.closest(".gabarito-linha").getAttribute("data-indice")), 1);
      renderizar();
    });

    document.getElementById("btnAdicionarVagaGabarito").addEventListener("click", function() {
      linhas.push({ apto: "", garagem: "", vaga: "" });
      renderizar();
      var novos = tabela.querySelectorAll('.gabarito-linha select[data-campo="apto"]');
      if (novos.length) novos[novos.length - 1].focus();
    });
    document.getElementById("btnDesfazerGabarito").addEventListener("click", function() {
      if (!haAlteracoes() || window.confirm("Descartar as alterações no gabarito?")) {
        carregado = false;
        carregar();
      }
    });
    document.getElementById("btnSalvarGabarito").addEventListener("click", salvar);

    document.querySelectorAll(".gabarito-modos [data-modo]").forEach(function(b) {
      b.addEventListener("click", function() { trocarModo(b.getAttribute("data-modo")); });
    });
    document.querySelectorAll(".gabarito-garagens [data-garagem]").forEach(function(b) {
      b.addEventListener("click", function() {
        garagemMapa = b.getAttribute("data-garagem");
        document.querySelectorAll(".gabarito-garagens [data-garagem]").forEach(function(o) { o.classList.toggle("ativo", o === b); });
        fecharEditorVaga();
      });
    });
    document.getElementById("mapaGabarito").addEventListener("click", function(e) {
      var g = e.target.closest && e.target.closest("g[data-vaga]");
      if (g) abrirEditorVaga(g.getAttribute("data-vaga"));
    });
    document.getElementById("editorVagaAplicar").addEventListener("click", aplicarEditorVaga);
    document.getElementById("editorVagaCancelar").addEventListener("click", fecharEditorVaga);
  });
})();
