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

function alterarTextoBotaoEnviar(novoTexto) {
  const btnSubmit = document.getElementById("btnEnviarForm") || document.querySelector("button[onclick='enviar()']");
  if (btnSubmit) {
    btnSubmit.textContent = novoTexto;
    btnSubmit.innerText = novoTexto;
  }
}

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

  // 2. Casos de Emergência
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

  // 3. Demais Ocupantes
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

  // 4. Carros
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

  // 5. Motos
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

  // 6. Bicicletas
  const bikes = document.querySelectorAll('#containerBikes .item-bike');
  bikes.forEach((item, index) => {
    const corEl = item.querySelector('.bike-cor');
    const inputs = item.querySelectorAll('input');
    
    let preencheuAlgum = Array.from(inputs).some(i => i.value.trim() !== "");
    let cor = corEl ? corEl.value.trim() : "";

    if (preencheuAlgum && cor === "") {
      let label = `Bicicletas ${index + 1} (Preencha a cor)`;
      if (!camposFaltantes.includes(label)) camposFaltantes.push(label);
      if (corEl) elementosParaDestacar.push(corEl);
    }
  });

  // 7. Pets
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

    if (preencheuNome && !preencheuOutros) {
      let label = `Pets ${index + 1} (Preencha Espécie e Raça e Porte)`;
      if (!camposFaltantes.includes(label)) camposFaltantes.push(label);
      
      if (racaEspecie === "" && racaEspecieEl) elementosParaDestacar.push(racaEspecieEl);
      if (porte === "" && porteEl) elementosParaDestacar.push(porteEl);
    } 
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

  // Tratamento da data do morador principal
  const nascInputPrincipal = document.getElementById("moradorNasc").value.trim();
  let moradorNascFormatada = nascInputPrincipal;
  if (/^\d{4}-\d{2}-\d{2}$/.test(nascInputPrincipal)) {
    const partes = nascInputPrincipal.split('-');
    moradorNascFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  // Descobre a vaga e o andar baseado no apartamento selecionado usando o cache do gabarito
  let vagaNumeroEncontrada = "";
  let vagaAndarEncontrado = "";
  const aptoAtual = document.getElementById("apto").value.trim().toLowerCase();
  
  if (typeof gabaritoVagasCache !== 'undefined' && gabaritoVagasCache.length > 0) {
    for (let i = 0; i < gabaritoVagasCache.length; i++) {
      const linha = gabaritoVagasCache[i];
      const aptoPlanilha = String(linha[0] || "").trim().toLowerCase();
      if (aptoPlanilha === aptoAtual) {
        vagaAndarEncontrado = String(linha[1] || "").trim(); // Coluna B = Andar
        vagaNumeroEncontrada = String(linha[2] || "").trim(); // Coluna C = Número
        break;
      }
    }
  }

  const dados = {
    apto: document.getElementById("apto").value,
    acao: isMoradorNovo ? "Sou morador novo" : "Atualizar dados cadastrais",
    tipoResidente: document.getElementById("tipoResidente").value,
    
    moradorNome: document.getElementById("moradorNome").value,
    moradorCpf: document.getElementById("moradorCpf").value,
    moradorRg: document.getElementById("moradorRg").value,
    moradorOrgaoEmissor: document.getElementById("moradorOrgaoEmissor") ? document.getElementById("moradorOrgaoEmissor").value : "",
    moradorNasc: moradorNascFormatada,
    moradorCelular: document.getElementById("moradorCelular").value,
    moradorTel: document.getElementById("moradorTel").value,
    moradorEmail: document.getElementById("moradorEmail").value,
    
    vagaNumero: vagaNumeroEncontrada,
    vagaAndar: vagaAndarEncontrado,
    
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

// Variável global para armazenar os contratos carregados na tela
let meustHistoricoContratos = [];

function renderizarHistoricoContratos(listaContratos) {
  const containerHistorico = document.getElementById("containerHistoricoContratos");
  const listaEl = document.getElementById("listaHistoricoContratos");

  if (!containerHistorico || !listaEl) return;

  // Se uma nova lista for passada como parâmetro, atualiza o estado local
  if (Array.isArray(listaContratos)) {
    meustHistoricoContratos = [...listaContratos];
  }

  // Limpa apenas o conteúdo da lista, mantendo o título (<label>) intacto
  listaEl.innerHTML = "";

  // Se a lista estiver vazia ou não existir, garante que o contêiner fique oculto
  if (!meustHistoricoContratos || meustHistoricoContratos.length === 0) {
    containerHistorico.classList.add("hidden");
    return;
  }

  // Remove a classe hidden para exibir o histórico na tela
  containerHistorico.classList.remove("hidden");

  // Renderiza cada item com seu respectivo botão de remoção
  meustHistoricoContratos.forEach((item, index) => {
    // 1. Contêiner da linha
    const itemDiv = document.createElement("div");
    itemDiv.className = "item-historico-contrato";

    // 2. Elemento <a> com o link do contrato
    const a = document.createElement("a");
    a.className = "link-historico-contrato";
    a.href = item.url;
    a.target = "_blank";
    a.textContent = "📄 " + item.texto;

    // 3. Botão de exclusão (X)
    const btnRemover = document.createElement("button");
    btnRemover.type = "button";
    btnRemover.className = "btn-remover-historico";
    btnRemover.title = "Remover este contrato do histórico";
    btnRemover.textContent = "✕";

    // Ação ao clicar no "X"
    btnRemover.addEventListener("click", function() {
      removerItemHistorico(index);
    });

    // Monta a estrutura da linha
    itemDiv.appendChild(a);
    itemDiv.appendChild(btnRemover);

    // Injeta na lista do HTML
    listaEl.appendChild(itemDiv);
  });
}

// Função para remover o item do array e atualizar a tela
function removerItemHistorico(index) {
  meustHistoricoContratos.splice(index, 1);
  renderizarHistoricoContratos(); // Re-renderiza sem o item excluído
}

function voltarTelaInicial() {
  try {
    // 1. Limpeza rigorosa do preview, variáveis e histórico de contratos
    var containerPreview = document.getElementById('containerPreviewContrato');
    var nomeArquivoSpan = document.getElementById('nomeArquivoSelecionado');
    var inputContrato = document.getElementById('arquivoContrato');
    var containerHistorico = document.getElementById('containerHistoricoContratos');
    
    if (containerPreview) {
      containerPreview.classList.add('hidden');
      containerPreview.style.display = ''; 
    }
    if (nomeArquivoSpan) nomeArquivoSpan.textContent = '';
    if (inputContrato) inputContrato.value = '';
    if (containerHistorico) containerHistorico.innerHTML = '';
    if (typeof arquivoContratoObjeto !== 'undefined') {
      arquivoContratoObjeto = null;
    }

    // 2. Reseta o formulário principal
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
      btnBuscarCpf.innerText = "Buscar Cadastro"; 
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

    // 3. Reseta as seções ocultando e limpando o style.display inline
    var secoesParaEsconder = [
      'secTipoResidente',
      'secApto',
      'secInquilino',
      'secRestoFormulario'
    ];

    secoesParaEsconder.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) {
        el.classList.add('hidden');
        el.style.display = ''; 
      }
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

    if (typeof redefinirBotoesParaNovoCadastro === 'function') {
      redefinirBotoesParaNovoCadastro();
    }

  } catch (erro) {
    console.error("Erro ao voltar para a tela inicial: ", erro);
    window.location.reload();
  }
}

function tratarMoradorNovo(isMarcado) {
  var secTipoResidente = document.getElementById('secTipoResidente');
  var cpfConsulta = document.getElementById('cpfConsulta');
  var nascConsulta = document.getElementById('nascConsulta');
  var btnBuscarCpf = document.getElementById('btnBuscarCpf');
  var chkMoradorNovo = document.getElementById('chkMoradorNovo');

  if (isMarcado) {
    voltarTelaInicial();  
    
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
      secTipoResidente.style.display = 'block'; 
      rolarParaSecao('secTipoResidente');
    }
  } else {
    voltarTelaInicial();
  }
}

let gabaritoVagasCache = [];

document.addEventListener("DOMContentLoaded", () => {
  if (typeof WEB_APP_URL !== 'undefined') {
    fetch(WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({ funcao: 'obterTodoGabaritoVagas' })
    })
    .then(response => response.json())
    .then(res => {
      if (res && res.sucesso) {
        gabaritoVagasCache = res.dados;
        console.log("SUCESSO: Gabarito carregado via fetch. Total de linhas:", gabaritoVagasCache.length);
      } else {
        console.warn("FALHA: O servidor retornou sucesso=false ao buscar o gabarito.");
      }
    })
    .catch(err => {
      console.error("ERRO CRÍTICO ao carregar gabarito via fetch:", err);
    });
  }

  const selectApto = document.getElementById("apto");
  if (selectApto) {
    selectApto.addEventListener("change", (e) => {
      atualizarInfoVagaLocal(e.target.value);
    });
    selectApto.addEventListener("input", (e) => {
      atualizarInfoVagaLocal(e.target.value);
    });
  }
});

function atualizarInfoVagaLocal(apto) {
  const divVaga = document.getElementById("infoVagaGaragem");
  if (!divVaga) return;

  if (!apto || apto.trim() === "") {
    divVaga.style.display = "none";
    divVaga.innerText = "";
    return;
  }

  let vagaEncontrada = null;
  for (let i = 0; i < gabaritoVagasCache.length; i++) {
    const linha = gabaritoVagasCache[i];
    const aptoPlanilha = String(linha[0]).trim().toLowerCase();
    
    if (aptoPlanilha === String(apto).trim().toLowerCase()) {
      const andar = linha[1]; // Coluna B
      const numero = linha[2]; // Coluna C
      
      if (numero && andar) {
        vagaEncontrada = `Sua vaga é a <strong>${numero}</strong> e fica no <strong>${andar}</strong>.`;
      }
      break;
    }
  }

  if (vagaEncontrada) {
    divVaga.innerHTML = vagaEncontrada;
    divVaga.style.display = "block";
  } else {
    divVaga.style.display = "none";
  }
}

// --- LÓGICA DE UPLOAD E PREVIEW DO CONTRATO ---
let arquivoContratoObjeto = null; // Variável global para o JSON

document.addEventListener("DOMContentLoaded", function() {
  const inputContrato = document.getElementById('arquivoContrato');
  const containerPreview = document.getElementById('containerPreviewContrato');
  const nomeArquivoSpan = document.getElementById('nomeArquivoSelecionado');
  const btnRemoverContrato = document.getElementById('btnRemoverContrato');

  if (inputContrato) {
    inputContrato.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        if (file.type !== "application/pdf") {
          alert("Por favor, selecione apenas arquivos no formato PDF.");
          inputContrato.value = "";
          return;
        }

        const reader = new FileReader();
        reader.onload = function(uploadEvent) {
          const base64String = uploadEvent.target.result.split(',')[1];
          
          arquivoContratoObjeto = {
            name: file.name,
            type: file.type,
            base64: base64String
          };

          // Define o nome e exibe a caixinha
          nomeArquivoSpan.textContent = "📎 " + file.name;
          containerPreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (btnRemoverContrato) {
    btnRemoverContrato.addEventListener('click', function() {
      inputContrato.value = "";
      arquivoContratoObjeto = null;
      containerPreview.classList.add('hidden');
      nomeArquivoSpan.textContent = "";
    });
  }
});
