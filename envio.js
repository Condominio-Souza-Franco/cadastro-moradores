//Responsável pelo disparo do envio do formulário, processamento de arquivos via FileReader e rotinas de reset
  
function enviar() {
  limpaMensagemStatus();
  
  let camposFaltantes = [];

  REGRAS_OBRIGATORIAS.forEach(regra => {
    const el = document.getElementById(regra.id);
    if (el && el.offsetParent !== null) { 
      let estaVazio = false;
      
      if (regra.id === "vagaAptoRelacionado") {
        const situacaoEl = document.getElementById("vagaSituacao");
        const temSituacao = situacaoEl && situacaoEl.value.trim() !== "";
        if (temSituacao && (!el.value || el.value.trim() === "")) {
          estaVazio = true;
        }
      } else {
        if (regra.tipo === "checkbox") {
          estaVazio = !el.checked;
        } else {
          estaVazio = !el.value || el.value.trim() === "";
        }
      }

      if (estaVazio) {
        camposFaltantes.push(regra.nome);
      }
    }
  });

  const prestadores = document.querySelectorAll('#containerPrestadores .item-prestador');
  prestadores.forEach((item, index) => {
    const nomeEl = item.querySelector('.pr-nome');
    const servicoEl = item.querySelector('.pr-servico');
    const telEl = item.querySelector('.pr-tel');
    const chaveEl = item.querySelector('.pr-chave');

    const nome = nomeEl ? nomeEl.value.trim() : '';
    const servico = servicoEl ? servicoEl.value.trim() : '';
    const tel = telEl ? telEl.value.trim() : '';
    const chave = chaveEl ? chaveEl.value : '';

    const preencheuAlgum = (nome !== "" || servico !== "" || tel !== "" || chave !== "");
    const preencheuTodos = (nome !== "" && servico !== "" && tel !== "" && chave !== "");

    if (preencheuAlgum && !preencheuTodos) {
      let labelPrestador = `Prestador ${index + 1} (Preencha todos os campos obrigatórios: Nome, Serviço, Telefone e Chave)`;
      if (!camposFaltantes.includes(labelPrestador)) {
        camposFaltantes.push(labelPrestador);
      }
    }
  });

  camposFaltantes.sort((a, b) => {
    let indexA = ORDEM_DESEJADA.findIndex(item => a.includes(item) || item.includes(a));
    let indexB = ORDEM_DESEJADA.findIndex(item => b.includes(item) || item.includes(b));

    if (a.toLowerCase().includes("prestador")) {
      indexA = ORDEM_DESEJADA.indexOf("Prestador");
    }
    if (b.toLowerCase().includes("prestador")) {
      indexB = ORDEM_DESEJADA.indexOf("Prestador");
    }

    if (indexA === -1) indexA = 99;
    if (indexB === -1) indexB = 99;

    return indexA - indexB;
  });

  if (camposFaltantes.length > 0) {
    alert("Por favor, preencha os seguintes campos obrigatórios:\n\n• " + camposFaltantes.join("\n• "));
    return;
  }

  const btnSubmit = document.getElementById("btnEnviarForm") || document.querySelector("button[onclick='enviar()']");
  const textoAtual = btnSubmit ? btnSubmit.innerText : "";
  const eAtualizacao = textoAtual.toLowerCase().includes("atualizar");

  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerText = eAtualizacao ? "Atualizando..." : "Enviando...";
  }

  const fileInput = document.getElementById("arquivoContrato");
  const file = fileInput && fileInput.files ? fileInput.files[0] : null;

  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const fileData = {
        base64: e.target.result.split(',')[1],
        name: file.name,
        type: file.type
      };
      executarEnvio(fileData, eAtualizacao);
    };
    reader.readAsDataURL(file);
  } else {
    executarEnvio(null, eAtualizacao);
  }
}

function executarEnvio(fileData, eAtualizacao) {
  const chkNovo = document.getElementById("chkMoradorNovo");
  const isMoradorNovo = chkNovo ? chkNovo.checked : false;

  const dados = {
    apto: document.getElementById("apto").value,
    acao: isMoradorNovo ? "Sou morador novo" : "Atualizar dados cadastrais",
    tipoResidente: document.getElementById("tipoResidente").value,
    
    moradorNome: document.getElementById("moradorNome").value,
    moradorCpf: document.getElementById("moradorCpf").value,
    moradorRg: document.getElementById("moradorRg").value,
    moradorOrgaoEmissor: document.getElementById("moradorOrgaoEmissor") ? document.getElementById("moradorOrgaoEmissor").value : "",
    moradorNasc: document.getElementById("moradorNasc").value,
    moradorCelular: document.getElementById("moradorCelular").value,
    moradorTel: document.getElementById("moradorTel").value,
    moradorEmail: document.getElementById("moradorEmail").value,
    
    vagaSituacao: document.getElementById("vagaSituacao").value,
    vagaAptoRelacionado: document.getElementById("vagaAptoRelacionado").value,

    emergenciasList: coletarDadosGrupados(".item-emergencia", [".em-nome", ".em-tel", ".em-end", ".em-vinculo"]),
    
    inqPropAdmin: document.getElementById("inqPropAdmin").value,
    inqContato: document.getElementById("inqContato").value,
    inqVigencia: document.getElementById("inqVigencia").value,
    arquivoContrato: fileData,

    ocupantesList: coletarDadosGrupados(".item-ocupante", [".oc-nome", ".oc-tel", ".oc-nasc", ".oc-vinculo"]),
    carrosList: coletarDadosGrupados(".item-carro", [".car-marca", ".car-modelo", ".car-cor", ".car-placa"]),
    motosList: coletarDadosGrupados(".item-moto", [".moto-marca", ".moto-modelo", ".moto-cor", ".moto-placa"]),
    bikesList: coletarDadosGrupados(".item-bike", [".bike-marca", ".bike-cor"]),
    petsList: coletarDadosGrupados(".item-pet", [".pet-nome", ".pet-especie", ".pet-raca", ".pet-porte"]),
    prestadorList: coletarDadosGrupados(".item-prestador", [".pr-nome", ".pr-servico", ".pr-tel", ".pr-chave"]),
    
    observacoes: document.getElementById("observacoes").value,
    declaracao: document.getElementById("declaracao").checked
  };

  fetch(WEB_APP_URL, {
    method: 'POST',
    body: JSON.stringify({
      funcao: 'processarFormulario',
      dados: dados
    })
  })
  .then(response => response.json())
  .then(res => {
    const btnSubmit = document.getElementById("btnEnviarForm") || document.querySelector("button[onclick='enviar()']");
    if (btnSubmit) btnSubmit.disabled = false;

    alert(res.mensagem);

    if (res.sucesso) {
      voltarTelaInicial();
    } else {
      alterarTextoBotaoEnviar(eAtualizacao ? "Atualizar cadastro" : "Enviar cadastro");
    }
  })
  .catch(err => {
    const btnSubmit = document.getElementById("btnEnviarForm") || document.querySelector("button[onclick='enviar()']");
    if (btnSubmit) btnSubmit.disabled = false;

    alterarTextoBotaoEnviar(eAtualizacao ? "Atualizar cadastro" : "Enviar cadastro");
    alert("Erro no envio: " + err);
  });
}

function redefinirBotoesParaNovoCadastro() {
  var btnEnviar = document.getElementById('btnEnviarForm');
  var btnSair = document.getElementById('btnSairSemAlterar');

  if (btnEnviar) {
    btnEnviar.textContent = 'Enviar Cadastro';
    btnEnviar.innerText = 'Enviar Cadastro';
  }

  if (btnSair) {
    btnSair.textContent = 'Sair';
    btnSair.innerText = 'Sair';
  }
}

function voltarTelaInicial() {
  var form = document.getElementById('cadForm');
  if (form) {
    form.reset();
  }

  var cpfConsulta = document.getElementById('cpfConsulta');
  var btnBuscarCpf = document.getElementById('btnBuscarCpf');
  
  if (cpfConsulta) {
    cpfConsulta.value = '';
    cpfConsulta.disabled = false;
  }
  if (btnBuscarCpf) {
    btnBuscarCpf.disabled = false;
  }

  var aptoSelect = document.getElementById('apto');
  if (aptoSelect) aptoSelect.value = '';

  var containersDinamicos = [
    'containerEmergencia',
    'containerOcupantes',
    'containerCarros',
    'containerMotos',
    'containerBikes',
    'containerPets',
    'containerPrestadores'
  ];

  containersDinamicos.forEach(function(id) {
    var container = document.getElementById(id);
    if (container) container.innerHTML = '';
  });

  var statusMessage = document.getElementById('statusMessage');
  if (statusMessage) {
    statusMessage.innerHTML = '';
    statusMessage.classList.add('hidden');
  }

  var secoesParaEsconder = [
    'secTipoResidente',
    'secApto',
    'secInquilino',
    'secRestoFormulario'
  ];

  secoesParaEsconder.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  var chkMoradorNovo = document.getElementById('chkMoradorNovo');
  if (chkMoradorNovo) {
    chkMoradorNovo.checked = false;
  }

  var nascConsulta = document.getElementById('nascConsulta');
  if (nascConsulta) {
    nascConsulta.value = '';
    nascConsulta.disabled = false;
  }

  redefinirBotoesParaNovoCadastro();
}

function tratarMoradorNovo(isMarcado) {
  var secTipoResidente = document.getElementById('secTipoResidente');
  var cpfConsulta = document.getElementById('cpfConsulta');
  var nascConsulta = document.getElementById('nascConsulta');
  var btnBuscarCpf = document.getElementById('btnBuscarCpf');

  if (isMarcado) {
    voltarTelaInicial(); 
    
    var chkMoradorNovo = document.getElementById('chkMoradorNovo');
    if (chkMoradorNovo) chkMoradorNovo.checked = true;

    if (cpfConsulta) {
      cpfConsulta.value = '';
      cpfConsulta.disabled = true;
    }
    if (nascConsulta) {
      nascConsulta.value = '';
      nascConsulta.disabled = true;
    }
    if (btnBuscarCpf) {
      btnBuscarCpf.disabled = true;
    }

    redefinirBotoesParaNovoCadastro();

    if (secTipoResidente) {
      secTipoResidente.classList.remove('hidden');
      rolarParaSecao('secTipoResidente');
    }
  } else {
    voltarTelaInicial();
  }
}
