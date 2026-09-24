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

  document.addEventListener("DOMContentLoaded", function() {
    if (!window.DataService) return;

    atualizarIndicador();

    var botaoAbrir = document.getElementById("btnAbrirFonteDados");
    var painel = document.getElementById("fonteDadosAdmin");
    var conteudoPrincipal = document.getElementById("conteudoPrincipalAdmin");
    if (botaoAbrir && painel) {
      botaoAbrir.addEventListener("click", function() {
        var vaiAbrir = painel.hidden;
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
  });
})();
