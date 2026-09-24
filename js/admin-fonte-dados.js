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

  function migrarPlanilha() {
    var resultado = document.getElementById("resultadoTesteConexoes");
    if (!resultado || !window.DataService) return;

    var confirmar = window.confirm("Isso vai copiar o cadastro mais recente de cada apartamento da planilha para o Firebase, substituindo o que já estiver lá. Continuar?");
    if (!confirmar) return;

    resultado.textContent = "Migrando...";

    DataService.migrarPlanilhaParaFirebase()
      .then(function(resposta) {
        resultado.textContent = (resposta && resposta.mensagem) || "Migração concluída.";
      })
      .catch(function(erro) {
        resultado.textContent = "Erro na migração: " + ((erro && erro.message) || "erro desconhecido.");
      });
  }

  document.addEventListener("DOMContentLoaded", function() {
    if (!window.DataService) return;

    atualizarIndicador();

    var botaoAbrir = document.getElementById("btnAbrirFonteDados");
    var painel = document.getElementById("fonteDadosAdmin");
    if (botaoAbrir && painel) {
      botaoAbrir.addEventListener("click", function() {
        painel.hidden = !painel.hidden;
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

    var botaoMigrar = document.getElementById("btnMigrarFirebase");
    if (botaoMigrar) {
      botaoMigrar.addEventListener("click", migrarPlanilha);
    }

    window.addEventListener("datasource-changed", atualizarIndicador);
  });
})();
