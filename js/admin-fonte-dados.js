// ==========================================
// PAINEL "FONTE DE DADOS" (ADMIN)
// ==========================================
(function() {
  function textoIndicador(activeSource, somenteLeitura) {
    if (activeSource === "firebase") {
      return "🟢 Firebase";
    }
    if (activeSource === "sheets") {
      return somenteLeitura ? "🟡 Google Sheets — modo de contingência" : "🟡 Google Sheets";
    }
    return "🔴 Nenhuma fonte disponível";
  }

  function atualizarIndicador() {
    var indicador = document.getElementById("indicadorFonteAtual");
    var aviso = document.getElementById("avisoContingenciaAdmin");
    if (!window.DataService) return;

    var configuredSource = DataService.getConfiguredSource();
    var activeSource = DataService.getActiveSource();
    var somenteLeitura = DataService.isReadOnly();

    if (indicador) {
      indicador.textContent = textoIndicador(activeSource, somenteLeitura);
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
