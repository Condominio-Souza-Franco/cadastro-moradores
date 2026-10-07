// ==========================================
// MEMBROS DA ADMINISTRAÇÃO (ADMIN)
// ==========================================
// Define quem acessa a área restrita: e-mail do condomínio, síndico, 3 membros do conselho e
// desenvolvedor. Para cada cargo (menos o condomínio) escolhe-se o morador; aparecem nome e
// telefone, e o e-mail de acesso pode ser o do cadastro (padrão, campo travado) ou outro.
//
// A tela já trava o que o papel de quem está logado não pode mudar; o backend (membros.gs)
// confere de novo ao salvar:
//   condomínio e desenvolvedor: tudo;
//   síndico: não troca o síndico; edita o próprio e-mail de acesso e o conselho;
//   conselho: cada membro edita só o próprio e-mail de acesso.
(function() {
  var escaparHtml = window.Utils.escaparHtml;
  var CARGOS = [
    { chave: "sindico", titulo: "Síndico" },
    { chave: "conselho", indice: 0, titulo: "Conselho — membro 1" },
    { chave: "conselho", indice: 1, titulo: "Conselho — membro 2" },
    { chave: "conselho", indice: 2, titulo: "Conselho — membro 3" },
    { chave: "desenvolvedor", titulo: "Desenvolvedor" }
  ];

  var membros = null;      // o que está na tela
  var originais = "";      // JSON do que veio do backend
  var candidatos = [];     // moradores que podem ser escolhidos
  var papel = "";
  var indicePapel = null;
  var carregado = false;
  var carregando = false;

  function setStatus(texto, tipo) {
    var el = document.getElementById("statusMembros");
    if (!el) return;
    el.className = "status" + (tipo ? " " + tipo : "");
    el.textContent = texto || "";
  }

  function candidatoPorId(id) {
    return candidatos.filter(function(c) { return c.id === id; })[0] || null;
  }

  function cargoDe(def) {
    return def.chave === "conselho" ? membros.conselho[def.indice] : membros[def.chave];
  }

  // O que o papel logado pode editar em cada parte da tela.
  function pode(parte, def) {
    if (papel === "condominio" || papel === "desenvolvedor") return true;
    if (papel === "sindico") {
      if (parte === "condominio") return false;
      if (parte === "administradora") return true;
      if (def && def.chave === "desenvolvedor") return false;
      if (def && def.chave === "sindico") return parte === "email"; // não troca o síndico
      if (def && def.chave === "conselho") return true;
      return false;
    }
    if (papel === "conselho") {
      return !!def && def.chave === "conselho" && def.indice === indicePapel && parte === "email";
    }
    return false;
  }

  function opcoesMoradores(selecionado) {
    return '<option value="">— ninguém —</option>' + candidatos.map(function(c) {
      var rotulo = c.apto + " · " + (c.nome || "(sem nome)") + (c.tipo ? " (" + c.tipo + ")" : "");
      return '<option value="' + escaparHtml(c.id) + '"' + (c.id === selecionado ? " selected" : "") + ">" + escaparHtml(rotulo) + "</option>";
    }).join("");
  }

  function cargoHtml(def, i) {
    var cargo = cargoDe(def);
    var morador = candidatoPorId(cargo.cadastroId);
    var podeMorador = pode("morador", def);
    var podeEmail = pode("email", def) && !!cargo.cadastroId;
    var emailMostrado = cargo.usarEmailCadastro ? ((morador && morador.email) || "") : cargo.email;
    var info = morador
      ? escaparHtml(morador.nome || "(sem nome)") + (morador.celular ? " · " + escaparHtml(morador.celular) : " · sem telefone")
      : (cargo.cadastroId ? "Morador não encontrado (pode ter se mudado)" : "");
    var semEmailNoCadastro = morador && cargo.usarEmailCadastro && !morador.email;
    return '<div class="cargo-membro" data-i="' + i + '">' +
      '<div class="cargo-titulo">' + escaparHtml(def.titulo) + "</div>" +
      '<select data-campo="cadastroId" aria-label="Apartamento do ' + escaparHtml(def.titulo) + '"' + (podeMorador ? "" : " disabled") + ">" + opcoesMoradores(cargo.cadastroId) + "</select>" +
      (info ? '<div class="cargo-info">' + info + "</div>" : "") +
      '<input type="email" data-campo="email" placeholder="' + (cargo.usarEmailCadastro ? (semEmailNoCadastro ? "o cadastro não tem e-mail" : "e-mail do cadastro") : "e-mail de acesso") +
        '" aria-label="E-mail de acesso" value="' + escaparHtml(emailMostrado || "") + '"' + (podeEmail && !cargo.usarEmailCadastro ? "" : " disabled") + ">" +
      '<label class="cargo-check"><input type="checkbox" data-campo="usarEmailCadastro"' + (cargo.usarEmailCadastro ? " checked" : "") + (podeEmail ? "" : " disabled") +
        "> Utilizar mesmo e-mail do cadastro</label>" +
      (semEmailNoCadastro ? '<div class="cargo-aviso">⚠️ O cadastro deste morador não tem e-mail: desmarque e informe um.</div>' : "") +
    "</div>";
  }

  function renderizar() {
    var form = document.getElementById("formMembros");
    if (!form || !membros) return;
    form.innerHTML =
      '<div class="cargo-membro"><div class="cargo-titulo">Condomínio</div>' +
        '<input type="email" id="emailCondominio" placeholder="e-mail de acesso do condomínio" aria-label="E-mail de acesso do condomínio" value="' +
        escaparHtml(membros.condominio.email || "") + '"' + (pode("condominio") ? "" : " disabled") + "></div>" +
      CARGOS.map(cargoHtml).join("") +
      // Administradora: só visualiza a Consulta por apartamento e a Busca geral (o backend barra o resto).
      '<div class="cargo-membro"><div class="cargo-titulo">Administradora <span class="cargo-nota">(só visualização: consulta por apartamento e busca geral)</span></div>' +
        '<input type="email" id="emailAdministradora" placeholder="e-mail de acesso da administradora (opcional)" aria-label="E-mail de acesso da administradora" value="' +
        escaparHtml((membros.administradora && membros.administradora.email) || "") + '"' + (pode("administradora") ? "" : " disabled") + "></div>";
    atualizarBotoes();
  }

  function paraEnviar() {
    var copia = JSON.parse(JSON.stringify(membros));
    [copia.sindico, copia.desenvolvedor].concat(copia.conselho).forEach(function(c) { if (c.usarEmailCadastro) c.email = ""; });
    return copia;
  }

  function atualizarBotoes() {
    var alterado = JSON.stringify(paraEnviar()) !== originais;
    var salvar = document.getElementById("btnSalvarMembros");
    var desfazer = document.getElementById("btnDesfazerMembros");
    var podeAlgo = !!papel;
    if (salvar) { salvar.disabled = !alterado; salvar.hidden = !podeAlgo; }
    if (desfazer) { desfazer.disabled = !alterado; desfazer.hidden = !podeAlgo; }
  }

  function carregar() {
    if (carregando) return;
    carregando = true;
    setStatus("Carregando...", "carregando");
    DataService.obterMembros()
      .then(function(r) {
        if (!r || !r.sucesso) throw new Error((r && r.mensagem) || "Não foi possível carregar os membros.");
        membros = r.membros;
        candidatos = r.candidatos || [];
        papel = r.papel || "";
        indicePapel = r.indice;
        originais = JSON.stringify(paraEnviar());
        carregado = true;
        document.getElementById("painelMembros").classList.add("conteudo-carregado");
        var quem = r.nomePapel ? "Você está como " + r.nomePapel + (papel === "conselho" ? " (membro " + (indicePapel + 1) + ")" : "") + "." : "";
        setStatus((r.configurado ? "" : "Ainda não configurado: o acesso segue a lista inicial até o primeiro Salvar. ") + quem, "");
        renderizar();
      })
      .catch(function(erro) { setStatus((erro && erro.message) || "Não foi possível carregar os membros.", "erro"); })
      .then(function() { carregando = false; });
  }

  function salvar() {
    var botao = document.getElementById("btnSalvarMembros");
    if (botao) botao.disabled = true;
    if (window.setOverlayAdmin) window.setOverlayAdmin(true, "Aguarde: salvando os membros...");
    DataService.salvarMembros(paraEnviar())
      .then(function(r) {
        if (!r || !r.sucesso) throw new Error((r && r.mensagem) || "Não foi possível salvar.");
        membros = r.membros;
        originais = JSON.stringify(paraEnviar());
        renderizar();
        var comp = r.compartilhamento || {};
        var extra = (comp.adicionados && comp.adicionados.length ? " Pasta do Drive compartilhada com: " + comp.adicionados.join(", ") + "." : "") +
          (comp.removidos && comp.removidos.length ? " Acesso à pasta retirado de: " + comp.removidos.join(", ") + "." : "") +
          (comp.falhas && comp.falhas.length ? " Não foi possível compartilhar a pasta com: " + comp.falhas.join(", ") + " (precisa ser conta Google)." : "");
        setStatus("Salvo. O acesso à área restrita já segue esta lista." + extra, "ok");
        window.dispatchEvent(new CustomEvent("cadastro-alterado"));
      })
      .catch(function(erro) {
        setStatus((erro && erro.message) || "Não foi possível salvar.", "erro");
        atualizarBotoes();
      })
      .then(function() { if (window.setOverlayAdmin) window.setOverlayAdmin(false); });
  }

  document.addEventListener("DOMContentLoaded", function() {
    var form = document.getElementById("formMembros");
    if (!form || !window.DataService) return;

    // Cache da área admin (DataService): abre na hora com o último resultado e revalida em segundo plano.
    window.addEventListener("painel-aberto", function(e) {
      if (e.detail && e.detail.id === "painelMembros" && (!carregado || JSON.stringify(paraEnviar()) === originais)) carregar();
    });
    window.addEventListener("dados-admin-atualizados", function(e) {
      var painelEl = document.getElementById("painelMembros");
      if (e.detail && e.detail.nome === "obterMembros" && painelEl && !painelEl.hidden && (!carregado || JSON.stringify(paraEnviar()) === originais)) setTimeout(carregar, 50); // depois do carregamento em andamento
    });
    document.getElementById("btnAtualizarMembros").addEventListener("click", function() {
      if (!((!carregado || JSON.stringify(paraEnviar()) === originais)) && !window.confirm("Há alterações não salvas. Atualizar e descartar?")) return;
      DataService.limparCacheAdmin("obterMembros");
      carregar();
    });

    form.addEventListener("input", function(e) {
      if (e.target.id === "emailCondominio") { membros.condominio.email = e.target.value.trim().toLowerCase(); atualizarBotoes(); return; }
      if (e.target.id === "emailAdministradora") { membros.administradora = { email: e.target.value.trim().toLowerCase() }; atualizarBotoes(); return; }
      var bloco = e.target.closest(".cargo-membro[data-i]");
      if (!bloco || e.target.getAttribute("data-campo") !== "email") return;
      cargoDe(CARGOS[Number(bloco.getAttribute("data-i"))]).email = e.target.value.trim().toLowerCase();
      atualizarBotoes();
    });

    form.addEventListener("change", function(e) {
      var bloco = e.target.closest(".cargo-membro[data-i]");
      if (!bloco) return;
      var cargo = cargoDe(CARGOS[Number(bloco.getAttribute("data-i"))]);
      var campo = e.target.getAttribute("data-campo");
      if (campo === "cadastroId") {
        cargo.cadastroId = e.target.value;
        cargo.usarEmailCadastro = true;   // ao trocar o morador, volta a usar o e-mail do cadastro
        cargo.email = "";
      } else if (campo === "usarEmailCadastro") {
        cargo.usarEmailCadastro = e.target.checked;
        // Ao desmarcar, começa com o e-mail do cadastro para facilitar a edição.
        if (!cargo.usarEmailCadastro && !cargo.email) {
          var morador = candidatoPorId(cargo.cadastroId);
          cargo.email = (morador && morador.email) || "";
        }
      } else {
        return;
      }
      renderizar();
    });

    document.getElementById("btnSalvarMembros").addEventListener("click", salvar);
    document.getElementById("btnDesfazerMembros").addEventListener("click", function() {
      membros = JSON.parse(originais);
      renderizar();
      setStatus("", "");
    });
  });
})();
