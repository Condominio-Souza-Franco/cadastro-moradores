(function() {
  function popularAptos() {
    var select = document.getElementById("aptoAdmin");
    if (!select) return;

    for (var andar = 2; andar <= 8; andar++) {
      for (var pos = 1; pos <= 6; pos++) {
        var numApto = String(andar) + "0" + String(pos);
        select.add(new Option(numApto, numApto));
      }
    }
    select.add(new Option("901", "901"));
  }

  function setStatus(texto, tipo) {
    var status = document.getElementById("statusAdmin");
    if (!status) return;
    status.className = "status" + (tipo ? " " + tipo : "");
    status.textContent = texto || "";
  }

  function textoLimpo(valor) {
    return String(valor || "").trim();
  }

  function renderizarDados(dados) {
    var resultado = document.getElementById("resultadoAdmin");
    if (!resultado) return;

    var blocos = [];
    blocos.push("Apartamento: " + textoLimpo(dados.apto));
    blocos.push("Tipo: " + textoLimpo(dados.tipo));
    blocos.push("Nome: " + textoLimpo(dados.nome));
    blocos.push("CPF: " + textoLimpo(dados.cpf));
    blocos.push("Nascimento: " + textoLimpo(dados.nasc));
    blocos.push("RG: " + textoLimpo(dados.rg));
    blocos.push("Orgão emissor: " + textoLimpo(dados.orgaoEmissor));
    blocos.push("Celular: " + textoLimpo(dados.celular));
    blocos.push("Telefone: " + textoLimpo(dados.telFixo));
    blocos.push("E-mail: " + textoLimpo(dados.email));
    blocos.push("Proprietário/Administradora: " + textoLimpo(dados.inqPropAdmin));
    blocos.push("Contato locação: " + textoLimpo(dados.inqContato));
    blocos.push("Vigência contrato: " + textoLimpo(dados.inqVigencia));
    blocos.push("Vaga situação: " + textoLimpo(dados.vagaSituacao));
    blocos.push("Vaga apto relacionado: " + textoLimpo(dados.vagaAptoRelacionado));
    blocos.push("Observações: " + textoLimpo(dados.observacoes));

    var historico = Array.isArray(dados.historicoContratos) ? dados.historicoContratos : [];
    if (historico.length > 0) {
      blocos.push("Contratos:");
      historico.forEach(function(item) {
        var texto = textoLimpo(item && item.texto);
        var url = textoLimpo(item && item.url);
        blocos.push("- " + texto + " | " + url);
      });
    }

    var camposMultilinha = [
      { nome: "Emergências", valor: dados.emergencias },
      { nome: "Ocupantes", valor: dados.ocupantes },
      { nome: "Carros", valor: dados.carros },
      { nome: "Motos", valor: dados.motos },
      { nome: "Bicicletas", valor: dados.bikes },
      { nome: "Pets", valor: dados.pets },
      { nome: "Prestadores", valor: dados.prestadores }
    ];

    camposMultilinha.forEach(function(item) {
      var valor = textoLimpo(item.valor);
      blocos.push(item.nome + ":");
      blocos.push(valor || "(vazio)");
    });

    resultado.textContent = blocos.join("\n");
  }

  function buscarPorApartamento() {
    var select = document.getElementById("aptoAdmin");
    var apto = select ? select.value : "";
    if (!apto) {
      setStatus("Selecione um apartamento.", "erro");
      return;
    }

    setStatus("Carregando...", "");

    fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({
        funcao: "buscarDadosPorApartamentoSimples",
        apto: apto
      })
    })
      .then(function(response) {
        return response.json();
      })
      .then(function(resposta) {
        if (!resposta || !resposta.encontrado) {
          setStatus((resposta && resposta.mensagem) || "Apartamento não encontrado.", "erro");
          return;
        }

        setStatus("Dados carregados com sucesso.", "ok");
        renderizarDados(resposta.dados || {});
      })
      .catch(function(err) {
        setStatus("Falha ao buscar dados: " + String((err && err.message) || err || "erro desconhecido"), "erro");
      });
  }

  document.addEventListener("DOMContentLoaded", function() {
    popularAptos();
    var botao = document.getElementById("btnBuscarApto");
    if (botao) {
      botao.addEventListener("click", buscarPorApartamento);
    }
  });
})();