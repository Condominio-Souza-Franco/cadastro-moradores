document.addEventListener('input', function(e) {
  if (e.target.classList.contains('input-erro-destaque')) {
    e.target.classList.remove('input-erro-destaque');
  }
});

document.addEventListener('change', function(e) {
  if (e.target.classList.contains('input-erro-destaque')) {
    e.target.classList.remove('input-erro-destaque');
  }
});

function enviar() {
  limpaMensagemStatus();
  
  // Limpa destaques anteriores
  document.querySelectorAll('.input-erro-destaque').forEach(el => el.classList.remove('input-erro-destaque'));

  let camposFaltantes = [];
  let elementosParaDestacar = [];

  // 1. Regras Padrão
  REGRAS_OBRIGATORIAS.forEach(regra => {
    const el = document.getElementById(regra.id);
    if (el && el.offsetParent !== null) { 
      let estaVazio = false;
      let nomeRegraPersonalizado = null;
      
      if (regra.id === "vagaSituacao" || regra.id === "vagaAptoRelacionado") {
        const situacaoEl = document.getElementById("vagaSituacao");
        const aptoRelEl = document.getElementById("vagaAptoRelacionado");
        
        const situacaoVal = situacaoEl && situacaoEl.value ? situacaoEl.value.trim() : "";
        const aptoRelVal = aptoRelEl && aptoRelEl.value ? aptoRelEl.value.trim() : "";
        
        if ((situacaoVal !== "" && aptoRelVal === "") || (situacaoVal === "" && aptoRelVal !== "")) {
          estaVazio = true;
          nomeRegraPersonalizado = "Vaga alugada: preencha todos os campos";
          if (situacaoVal === "" && situacaoEl) elementosParaDestacar.push(situacaoEl);
          if (aptoRelVal === "" && aptoRelEl) elementosParaDestacar.push(aptoRelEl);
        }
      } else {
        if (regra.tipo === "checkbox") {
          estaVazio = !el.checked;
        } else {
          estaVazio = !el.value || el.value.trim() === "";
        }
      }

      if (estaVazio) {
        let nomeRegra = nomeRegraPersonalizado || regra.nome;
        if (!camposFaltantes.includes(nomeRegra)) {
          camposFaltantes.push(nomeRegra);
        }
        if (regra.id !== "vagaSituacao" && regra.id !== "vagaAptoRelacionado") {
          elementosParaDestacar.push(el);
        }
      }
    }
  });

  // 2. Casos de Emergência (Se preencheu qualquer campo, Nome e Telefone passam a ser obrigatórios)
  const emergencias = document.querySelectorAll('#containerEmergencia .item-emergencia');
  emergencias.forEach((item, index) => {
    const nomeEl = item.querySelector('.em-nome');
    const telEl = item.querySelector('.em-tel');
    const nome = nomeEl ? nomeEl.value.trim() : '';
    const tel = telEl ? telEl.value.trim() : '';

    const preencheuAlgum = Array.from(item.querySelectorAll('input, select')).some(i => i.value.trim() !== "");

    if (preencheuAlgum && (nome === "" || tel === "")) {
      let label = `Caso de emergência ${index + 1} (Preencha Nome e Telefone/Celular)`;
      if (!camposFaltantes.includes(label)) camposFaltantes.push(label);
      if (nome === "" && nomeEl) elementosParaDestacar.push(nomeEl);
      if (tel === "" && telEl) elementosParaDestacar.push(telEl);
    }
  });

  // 3. Demais Ocupantes (Se preencheu qualquer campo, Nome e Vínculo passam a ser obrigatórios)
  const ocupantes = document.querySelectorAll('#containerOcupantes .item-ocupante');
  ocupantes.forEach((item, index) => {
    const nomeEl = item.querySelector('.oc-nome');
    const vinculoEl = item.querySelector('.oc-vinculo');
    const nome = nomeEl ? nomeEl.value.trim() : '';
    const vinculo = vinculoEl ? vinculoEl.value.trim() : '';

    const preencheuAlgum = Array.from(item.querySelectorAll('input, select')).some(i => i.value.trim() !== "");

    if (preencheuAlgum && (nome === "" || vinculo === "")) {
      let label = `Demais ocupantes ${index + 1} (Preencha Nome e Vínculo)`;
      if (!camposFaltantes.includes(label)) camposFaltantes.push(label);
      if (nome === "" && nomeEl) elementosParaDestacar.push(nomeEl);
      if (vinculo === "" && vinculoEl) elementosParaDestacar.push(vinculoEl);
    }
  });

  // 4. Carros (Todos obrigatórios se algum preenchido)
  const carros = document.querySelectorAll('#containerCarros .item-carro');
  carros.forEach((item, index) => {
    const inputs = item.querySelectorAll('input');
    let preencheuAlgum = Array.from(inputs).some(i => i.value.trim() !== "");
    let preencheuTodos = Array.from(inputs).every(i => i.value.trim() !== "");

    if (preencheuAlgum && !preencheuTodos) {
      let label = `Carros ${index + 1} (Preencha Marca e modelo, Cor e Placa)`;
      if (!camposFaltantes.includes(label)) camposFaltantes.push(label);
      inputs.forEach(i => { if (!i.value.trim()) elementosParaDestacar.push(i); });
    }
  });

  // 5. Motos (Todos obrigatórios se algum preenchido)
  const motos = document.querySelectorAll('#containerMotos .item-moto');
  motos.forEach((item, index) => {
    const inputs = item.querySelectorAll('input');
    let preencheuAlgum = Array.from(inputs).some(i => i.value.trim() !== "");
    let preencheuTodos = Array.from(inputs).every(i => i.value.trim() !== "");

    if (preencheuAlgum && !preencheuTodos) {
      let label = `Motos ${index + 1} (Preencha Marca e modelo, Cor e Placa)`;
      if (!camposFaltantes.includes(label)) camposFaltantes.push(label);
      inputs.forEach(i => { if (!i.value.trim()) elementosParaDestacar.push(i); });
    }
  });

  // 6. Bicicletas (Apenas Cor obrigatória se a linha for preenchida)
  const bikes = document.querySelectorAll('#containerBikes .item-bike');
  bikes.forEach((item, index) => {
    const corEl = item.querySelector('.bike-cor'); // Certifique-se de que a classe do input de cor é .bike-cor
    const inputs = item.querySelectorAll('input');
    
    let preencheuAlgum = Array.from(inputs).some(i => i.value.trim() !== "");
    let cor = corEl ? corEl.value.trim() : "";

    if (preencheuAlgum && cor === "") {
      let label = `Bicicletas ${index + 1} (Preencha a cor)`;
      if (!camposFaltantes.includes(label)) camposFaltantes.push(label);
      if (corEl) elementosParaDestacar.push(corEl);
    }
  });

  // 7. Pets (Nome preenchido torna Raça/espécie e Porte obrigatórios)
  const pets = document.querySelectorAll('#containerPets .item-pet');
  pets.forEach((item, index) => {
    const nomeEl = item.querySelector('.pet-nome');
    const racaEspecieEl = item.querySelector('.pet-raca-especie');
    const porteEl = item.querySelector('.pet-porte');

    const nome = nomeEl ? nomeEl.value.trim() : '';
    const racaEspecie = racaEspecieEl ? racaEspecieEl.value.trim() : '';
    const porte = porteEl ? porteEl.value.trim() : '';

    const preencheuAlgum = (nome !== "" || racaEspecie !== "" || porte !== "");
    const preencheuNome = nome !== "";
    const preencheuOutros = (racaEspecie !== "" && porte !== "");

    // Se preencheu o nome mas deixou raça/espécie ou porte vazios
    if (preencheuNome && !preencheuOutros) {
      let label = `Pets ${index + 1} (Preencha Espécie e Raça e Porte)`;
      if (!camposFaltantes.includes(label)) camposFaltantes.push(label);
      
      if (racaEspecie === "" && racaEspecieEl) elementosParaDestacar.push(racaEspecieEl);
      if (porte === "" && porteEl) elementosParaDestacar.push(porteEl);
    } 
    // Caso tenha preenchido os outros campos mas esqueceu o nome
    else if (!preencheuNome && preencheuAlgum) {
      let label = `Pets ${index + 1} (Preencha o Nome)`;
      if (!camposFaltantes.includes(label)) camposFaltantes.push(label);
      if (nomeEl) elementosParaDestacar.push(nomeEl);
    }
  });

  // 8. Prestadores
  const prestadores = document.querySelectorAll('#containerPrestadores .item-prestador');
  prestadores.forEach((item, index) => {
    const inputs = item.querySelectorAll('input, select');
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
      inputs.forEach(i => { if (!i.value.trim()) elementosParaDestacar.push(i); });
    }
  });

  // Ordenação
  camposFaltantes.sort((a, b) => {
    let indexA = ORDEM_DESEJADA.indexOf(a);
    let indexB = ORDEM_DESEJADA.indexOf(b);

    if (a.includes("Vaga alugada")) indexA = ORDEM_DESEJADA.indexOf("Apartamento envolvido (Vaga de garagem)");
    if (b.includes("Vaga alugada")) indexB = ORDEM_DESEJADA.indexOf("Apartamento envolvido (Vaga de garagem)");
    if (a.includes("Caso de emergência")) indexA = ORDEM_DESEJADA.indexOf("Caso de emergência");
    if (b.includes("Caso de emergência")) indexB = ORDEM_DESEJADA.indexOf("Caso de emergência");
    if (a.includes("Demais ocupantes")) indexA = ORDEM_DESEJADA.indexOf("Demais ocupantes");
    if (b.includes("Demais ocupantes")) indexB = ORDEM_DESEJADA.indexOf("Demais ocupantes");
    if (a.includes("Carros")) indexA = ORDEM_DESEJADA.indexOf("Carros");
    if (b.includes("Carros")) indexB = ORDEM_DESEJADA.indexOf("Carros");
    if (a.includes("Motos")) indexA = ORDEM_DESEJADA.indexOf("Motos");
    if (b.includes("Motos")) indexB = ORDEM_DESEJADA.indexOf("Motos");
    if (a.includes("Bicicletas")) indexA = ORDEM_DESEJADA.indexOf("Bicicletas");
    if (b.includes("Bicicletas")) indexB = ORDEM_DESEJADA.indexOf("Bicicletas");
    if (a.includes("Pets")) indexA = ORDEM_DESEJADA.indexOf("Pets");
    if (b.includes("Pets")) indexB = ORDEM_DESEJADA.indexOf("Pets");
    if (a.toLowerCase().includes("prestador")) indexA = ORDEM_DESEJADA.indexOf("Prestador");
    if (b.toLowerCase().includes("prestador")) indexB = ORDEM_DESEJADA.indexOf("Prestador");

    if (indexA === -1) indexA = 99;
    if (indexB === -1) indexB = 99;

    return indexA - indexB;
  });

  if (camposFaltantes.length > 0) {
    elementosParaDestacar.forEach(el => {
      if (el) el.classList.add('input-erro-destaque');
    });

    if (elementosParaDestacar.length > 0) {
      elementosParaDestacar[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      elementosParaDestacar[0].focus();
    }

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

    ocupantesList: (() => {
      const grupos = document.querySelectorAll(".item-ocupante");
      const resultado = [];
      grupos.forEach(g => {
        const nome = g.querySelector(".oc-nome")?.value.trim() || "";
        const tel = g.querySelector(".oc-tel")?.value.trim() || "";
        const nascInput = g.querySelector(".oc-nasc")?.value.trim() || "";
        const vinculo = g.querySelector(".oc-vinculo")?.value.trim() || "";

        if (nome !== "") {
          // Converte AAAA-MM-DD para DD/MM/AAAA na hora
          let nascFormatada = nascInput;
          if (/^\d{4}-\d{2}-\d{2}$/.test(nascInput)) {
            const partes = nascInput.split('-');
            nascFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
          }
          
          resultado.push([nome, tel, nascFormatada, vinculo].join(" | "));
        }
      });
      return resultado.join("\n");
    })(),

    carrosList: coletarDadosGrupados(".item-carro", [".car-marca-modelo", ".car-cor", ".car-placa"]),
    motosList: coletarDadosGrupados(".item-moto", [".moto-marca-modelo", ".moto-cor", ".moto-placa"]),
    bikesList: coletarDadosGrupados(".item-bike", [".bike-marca", ".bike-cor"]),
    petsList: coletarDadosGrupados(".item-pet", [".pet-nome", ".pet-raca-especie", ".pet-porte"]),
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

  document.querySelectorAll('.input-erro-destaque').forEach(el => el.classList.remove('input-erro-destaque'));

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
