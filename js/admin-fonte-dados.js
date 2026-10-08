// ==========================================
// PAINEL "FONTE DE DADOS" (ADMIN)
// ==========================================
(function() {
  function textoIndicador(activeSource, somenteLeitura, falhaTotal) {
    if (activeSource === "firebase") {
      return "🟢 Firebase";
    }
    if (activeSource === "sheets") {
      return somenteLeitura ? "🟡 Google Sheets — modo de contingência" : "🟡 Google Sheets";
    }
    return falhaTotal ? "🔴 Nenhuma fonte disponível" : "⚪ Ainda não consultado nesta sessão";
  }

  function atualizarIndicador() {
    var indicador = document.getElementById("indicadorFonteAtual");
    var aviso = document.getElementById("avisoContingenciaAdmin");
    if (!window.DataService) return;

    var configuredSource = DataService.getConfiguredSource();
    var activeSource = DataService.getActiveSource();
    var somenteLeitura = DataService.isReadOnly();
    var falhaTotal = DataService.houveFalhaTotal();

    if (indicador) {
      indicador.textContent = textoIndicador(activeSource, somenteLeitura, falhaTotal);
    }
    if (aviso) {
      aviso.hidden = !somenteLeitura;
    }

    document.querySelectorAll('input[name="fonteDados"]').forEach(function(radio) {
      radio.checked = radio.value === configuredSource;
    });
  }

  // Conselho só visualiza esta página: opções e botão desabilitados.
  function aplicarPermissaoDados() {
    var papel = window.AdminAuth && window.AdminAuth.getPapel ? window.AdminAuth.getPapel() : "";
    var podeEditar = papel === "sindico" || papel === "condominio" || papel === "desenvolvedor";
    document.querySelectorAll('input[name="fonteDados"]').forEach(function(radio) { radio.disabled = !podeEditar; });
    var botao = document.getElementById("btnTestarConexoes");
    if (botao) botao.disabled = !podeEditar;
    var aviso = document.getElementById("avisoSomenteLeituraDados");
    if (aviso) aviso.hidden = podeEditar;
  }

  function testarConexoes() {
    var resultado = document.getElementById("resultadoTesteConexoes");
    if (!resultado || !window.DataService) return;

    resultado.textContent = "Testando...";

    DataService.testarConexoes().then(function(status) {
      var linhas = [];

      linhas.push("Firebase: " + (status.firebase.ok ? "✅ disponível" : "❌ " + (status.firebase.mensagem || "indisponível")));
      linhas.push("Google Sheets: " + (status.sheets.ok ? "✅ disponível" : "❌ " + (status.sheets.mensagem || "indisponível")));

      resultado.innerHTML = linhas.map(function(l) { return "<div>" + l + "</div>"; }).join("");
    });
  }

  // Gráficos de barras (HTML/CSS) com o perfil dos moradores.
  function grafico(titulo, itens, total, classe) {
    var maior = Math.max.apply(null, itens.map(function(i) { return i.total; }).concat([1]));
    return '<div class="grafico-perfil ' + classe + '"><h3>' + titulo + "</h3>" + itens.map(function(i) {
      var pct = total ? Math.round(i.total * 100 / total) : 0;
      return '<div class="barra-linha"><span class="barra-rotulo">' + i.rotulo + '</span>' +
        '<span class="barra-trilho"><span class="barra" style="width:' + (i.total * 100 / maior).toFixed(1) + '%"></span></span>' +
        '<span class="barra-valor">' + i.total + ' <small>(' + pct + '%)</small></span></div>';
    }).join("") + "</div>";
  }

  // 12 cartões com os números gerais (4 x 3 na tela larga, 2 x 6 no celular: linhas sempre cheias).
  function cartoesResumo(x) {
    if (!x) return "";
    var itens = [
      [x.moradores, "moradores"], [x.proprietarios, "proprietários"], [x.inquilinos, "inquilinos"], [x.ocupantes, "demais ocupantes"],
      [x.proprietariosNaoMoram, "proprietários que não moram"], [x.semCadastro, "apartamentos sem cadastro", "de " + x.apartamentos],
      [x.alugados, "apartamentos alugados"], [x.desocupados, "apartamentos desocupados"],
      [x.menores, "crianças e adolescentes", "até 17 anos"], [x.idosos, "com 60 anos ou mais"], [x.pets, "pets"], [x.veiculos, "carros e motos"]
    ];
    return '<div class="cartoes-resumo">' + itens.map(function(i) {
      return '<div class="cartao-resumo"><strong>' + i[0] + '</strong><span>' + i[1] + (i[2] ? ' <small>(' + i[2] + ')</small>' : '') + '</span></div>';
    }).join('') + '</div>';
  }

  function carregarPerfil() {
    var alvo = document.getElementById("graficosPerfil");
    var status = document.getElementById("statusPerfil");
    if (!alvo || !DataService.estatisticas) return;
    status.className = "status carregando";
    status.textContent = "Carregando...";
    DataService.estatisticas().then(function(r) {
      if (!r || !r.sucesso) throw new Error((r && r.mensagem) || "Não foi possível carregar o perfil.");
      status.className = "status";
      status.textContent = r.total + " moradores contados" + (typeof r.titulares === "number" ? ": " + r.titulares + " titulares e " + r.ocupantes + " demais ocupantes." : ".");
      var genero = r.genero.filter(function(g) { return g.total || g.rotulo !== "Sem nome"; });
      var idade = r.idade.filter(function(f) { return f.total || f.rotulo !== "Sem data"; });
      alvo.innerHTML = cartoesResumo(r.resumo) + grafico("Idade", idade, r.total, "grafico-idade") + grafico("Gênero (estimado)", genero, r.total, "grafico-genero");
    }).catch(function(erro) {
      status.className = "status erro";
      status.textContent = (erro && erro.message) || "Não foi possível carregar o perfil.";
    });
  }

  document.addEventListener("DOMContentLoaded", function() {
    if (!window.DataService) return;

    atualizarIndicador();

    var botaoAbrir = document.getElementById("btnAbrirFonteDados");
    var painel = document.getElementById("fonteDadosAdmin");
    var conteudoPrincipal = document.getElementById("conteudoPrincipalAdmin");
    if (botaoAbrir && painel) {
      botaoAbrir.addEventListener("click", function() {
        var vaiAbrir = painel.hidden;
        if (vaiAbrir) { aplicarPermissaoDados(); carregarPerfil(); }
        painel.hidden = !vaiAbrir;
        if (conteudoPrincipal) conteudoPrincipal.hidden = vaiAbrir;
        botaoAbrir.textContent = vaiAbrir ? "Voltar" : "Dados";
      });
    }

    document.querySelectorAll('input[name="fonteDados"]').forEach(function(radio) {
      radio.addEventListener("change", function() {
        if (!radio.checked) return;
        DataService.setConfiguredSource(radio.value);
      });
    });

    var botaoTestar = document.getElementById("btnTestarConexoes");
    if (botaoTestar) {
      botaoTestar.addEventListener("click", testarConexoes);
    }

    window.addEventListener("datasource-changed", atualizarIndicador);
    window.addEventListener("admin-auth-success", aplicarPermissaoDados);
  });
})();
