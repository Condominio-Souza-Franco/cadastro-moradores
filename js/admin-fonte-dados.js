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
    var barraContainer = document.getElementById("barraProgressoMigracaoContainer");
    var barra = document.getElementById("barraProgressoMigracao");
    if (!resultado || !window.FirebaseRepository) return;

    var confirmar = window.confirm("Isso vai copiar o cadastro mais recente de cada apartamento da planilha para o Firebase, substituindo o que já estiver lá. Continuar?");
    if (!confirmar) return;

    if (barraContainer) barraContainer.hidden = false;
    if (barra) barra.style.width = "0%";
    resultado.textContent = "Preparando migração...";

    FirebaseRepository.listarApartamentosParaMigrar()
      .then(function(resposta) {
        if (!resposta || !resposta.sucesso) {
          throw new Error((resposta && resposta.mensagem) || "Erro ao listar apartamentos.");
        }

        var apartamentos = resposta.apartamentos || [];
        var total = apartamentos.length + 1; // +1 para a etapa final do gabarito
        var comErro = [];

        function atualizarProgresso(concluidos, rotulo) {
          var pct = Math.round((concluidos / total) * 100);
          if (barra) barra.style.width = pct + "%";
          resultado.textContent = "Migrando (" + pct + "%): " + rotulo;
        }

        function migrarProximo(indice) {
          if (indice >= apartamentos.length) {
            atualizarProgresso(apartamentos.length, "gabarito...");
            return FirebaseRepository.migrarGabarito().then(function() {
              if (barra) barra.style.width = "100%";
              resultado.textContent = "Migração concluída: " + (apartamentos.length - comErro.length) + " apartamento(s)" +
                (comErro.length ? (", " + comErro.length + " com erro (" + comErro.join(", ") + ")") : "") +
                ". Gabarito atualizado.";
            });
          }

          var apto = apartamentos[indice];
          atualizarProgresso(indice, "apto " + apto);

          return FirebaseRepository.migrarApartamentoUnico(apto)
            .then(function(resp) {
              if (!resp || !resp.sucesso) comErro.push(apto);
            })
            .catch(function() {
              comErro.push(apto);
            })
            .then(function() {
              return migrarProximo(indice + 1);
            });
        }

        return migrarProximo(0);
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

    var botaoMigrar = document.getElementById("btnMigrarFirebase");
    if (botaoMigrar) {
      botaoMigrar.addEventListener("click", migrarPlanilha);
    }

    window.addEventListener("datasource-changed", atualizarIndicador);
  });
})();
