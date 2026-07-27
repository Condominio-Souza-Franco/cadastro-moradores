// ==========================================
// CONFIGURAÇÃO DA API (GOOGLE APPS SCRIPT)
// ==========================================
// Substitua pela URL da Web App gerada ao publicar seu projeto no Google Apps Script
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxqfR0tDzvIfqFn8syMiVufHqA48lmN4qMHpFM9TIozDfN5QOAc0hOyJZAig3E8zJ4B/exec";

// ==========================================
// INICIALIZAÇÃO DO DOCUMENTO
// ==========================================

window.addEventListener('DOMContentLoaded', function() {
  popularDropdownApto();
  popularDropdownAptos();
  
  const inputCpf = document.getElementById('cpfConsulta');
  const inputNasc = document.getElementById('nascConsulta');

  function dispararBuscaEnter(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      consultarPorCpf();
    }
  }

  if (inputCpf) {
    inputCpf.addEventListener('keydown', dispararBuscaEnter);
  }

  if (inputNasc) {
    inputNasc.addEventListener('focus', function() {
      this.type = 'date';
    });
    
    inputNasc.addEventListener('blur', function() {
      if (!this.value) {
        this.type = 'text';
        this.placeholder = 'dd/mm/aaaa';
      }
    });

    inputNasc.addEventListener('keydown', dispararBuscaEnter);
  }
});
    

// --- FUNÇÃO AUXILIAR DE ROLAGEM AUTOMÁTICA --- //
function rolarParaSecao(secaoId) {
  const elemento = document.getElementById(secaoId);
  if (elemento) {
    elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// --- GERADORES DE DROPDOWNS DE APARTAMENTOS --- //

function popularDropdownAptos() {
  const select = document.getElementById('vagaAptoRelacionado');
  if (!select) return;
  select.innerHTML = '<option value="">Apto envolvido...</option>';

  for (let andar = 2; andar <= 8; andar++) {
    for (let pos = 1; pos <= 6; pos++) {
      const numApto = `${andar}0${pos}`;
      select.add(new Option(numApto, numApto));
    }
  }
  select.add(new Option('901', '901'));
}

function popularDropdownApto() {
  const select = document.getElementById('apto');
  if (!select) return;

  select.innerHTML = '<option value="">Selecione o apartamento...</option>';

  for (let andar = 2; andar <= 8; andar++) {
    for (let pos = 1; pos <= 6; pos++) {
      const numApto = `${andar}0${pos}`;
      select.add(new Option(numApto, numApto));
    }
  }
  select.add(new Option('901', '901'));

  select.onchange = function() {
    const valor = this.value;
    const secResto = document.getElementById('secRestoFormulario');

    if (valor) {
      if (secResto) {
        secResto.classList.remove('hidden');
        secResto.style.display = 'block';
        rolarParaSecao('secRestoFormulario');
      }

      if (typeof addEmergencia === 'function' && document.querySelectorAll('.item-emergencia').length === 0) {
        addEmergencia();
      }
    } else {
      if (secResto) {
        secResto.classList.add('hidden');
        secResto.style.display = 'none';
      }
    }
  };
}

// --- MASCARA E CONTROLE DO CPF / MORADOR NOVO --- //

function limparCpf(cpf) {
  if (!cpf) return "";
  return cpf.replace(/\D/g, "");
}

function tratarDigitacaoCPF(input) {
  let value = input.value.replace(/\D/g, "");
  if (value.length > 11) value = value.slice(0, 11);
  input.value = value;
}

function limpaMensagemStatus() {
  const statusMsg = document.getElementById("statusMessage");
  if (statusMsg) {
    statusMsg.innerText = "";
    statusMsg.className = "hidden";
    statusMsg.style.display = "none";
  }
}

function exibirPassoTipoResidente() {
  const secTipo = document.getElementById('secTipoResidente');
  if (secTipo) {
    secTipo.classList.remove('hidden');
    secTipo.style.display = 'block';
    rolarParaSecao('secTipoResidente');
  }
}

function tratarEscolhaTipoResidente(valor) {
  const secApto = document.getElementById('secApto');
  const secInquilino = document.getElementById('secInquilino');

  if (valor) {
    if (secApto) {
      secApto.classList.remove('hidden');
      secApto.style.display = 'block';
      rolarParaSecao('secApto');
    }

    const titulo = document.getElementById('tituloDadosPessoais');
    if (titulo) titulo.innerText = `Dados do ${valor}`;

    if (valor === 'Inquilino') {
      if (secInquilino) {
        secInquilino.classList.remove('hidden');
        secInquilino.style.display = 'block';
      }
    } else {
      if (secInquilino) {
        secInquilino.classList.add('hidden');
        secInquilino.style.display = 'none';
      }
    }
  } else {
    if (secApto) {
      secApto.classList.add('hidden');
      secApto.style.display = 'none';
    }
  }
}

function alterarTextoBotaoEnviar(novoTexto) {
  const btnSubmit = document.getElementById("btnEnviarForm") || document.querySelector("button[onclick='enviar()']");
  if (btnSubmit) {
    btnSubmit.innerText = novoTexto;
  }
}

// --- CONSULTA CPF VIA FETCH (EXTERNO) --- //

function consultarPorCpf() {
  limpaMensagemStatus();
  const inputCpf = document.getElementById("cpfConsulta");
  const inputNasc = document.getElementById("nascConsulta");
  const btnBusca = document.getElementById("btnBuscarCpf");
  
  const cpfInput = inputCpf ? inputCpf.value.trim() : "";
  const cpfLimpo = limparCpf(cpfInput);
  const nascInput = inputNasc ? inputNasc.value : "";
  
  if (cpfLimpo.length !== 11) {
    alert("Por favor, digite um CPF válido com 11 dígitos.");
    return;
  }

  if (!nascInput) {
    alert("Por favor, informe também a sua data de nascimento para confirmar a identidade.");
    if (inputNasc) inputNasc.focus();
    return;
  }

  let textoOriginalBtn = "Buscar Cadastro";
  if (btnBusca) {
    textoOriginalBtn = btnBusca.innerText;
    btnBusca.innerText = "Buscando...";
    btnBusca.disabled = true;
  }
  if (inputCpf) inputCpf.disabled = true;
  if (inputNasc) inputNasc.disabled = true;

  // Requisição Fetch para a função buscarDadosPorCpfESeguranca no Apps Script
  fetch(WEB_APP_URL, {
    method: 'POST',
    body: JSON.stringify({
      funcao: 'buscarDadosPorCpfESeguranca',
      cpf: cpfLimpo,
      nascimento: nascInput
    })
  })
  .then(response => response.json())
  .then(resposta => {
    if (btnBusca) {
      btnBusca.innerText = textoOriginalBtn;
      btnBusca.disabled = false;
    }

    if (resposta && resposta.encontrado) {
      const d = resposta.dados;

      if (inputCpf) {
        inputCpf.disabled = true;
        inputCpf.value = d.cpf || cpfLimpo;
      }
      if (inputNasc) {
        inputNasc.disabled = true;
      }
      if (btnBusca) {
        btnBusca.disabled = true; 
      }

      if (document.getElementById("moradorNome")) document.getElementById("moradorNome").value = d.nome || "";
      if (document.getElementById("moradorCpf")) document.getElementById("moradorCpf").value = d.cpf || "";
      if (document.getElementById("moradorRg")) document.getElementById("moradorRg").value = d.rg || "";
      if (document.getElementById("moradorOrgaoEmissor")) document.getElementById("moradorOrgaoEmissor").value = d.orgaoEmissor || "";
      if (document.getElementById("moradorNasc") && d.nasc) document.getElementById("moradorNasc").value = formatarDataParaInput(d.nasc);
      if (document.getElementById("moradorCelular")) document.getElementById("moradorCelular").value = d.celular || "";
      if (document.getElementById("moradorTel")) document.getElementById("moradorTel").value = d.telFixo || "";
      if (document.getElementById("moradorEmail")) document.getElementById("moradorEmail").value = d.email || "";

      if (document.getElementById("inqPropAdmin")) document.getElementById("inqPropAdmin").value = d.inqPropAdmin || "";
      if (document.getElementById("inqContato")) document.getElementById("inqContato").value = d.inqContato || "";
      if (document.getElementById("inqVigencia")) document.getElementById("inqVigencia").value = d.inqVigencia || "";

      if (document.getElementById("vagaSituacao") && d.vagaSituacao) document.getElementById("vagaSituacao").value = d.vagaSituacao;
      if (document.getElementById("vagaAptoRelacionado") && d.vagaAptoRelacionado) document.getElementById("vagaAptoRelacionado").value = d.vagaAptoRelacionado;

      if (d.emergencias) preencherEmergencias(d.emergencias);
      if (d.ocupantes)   preencherOcupantes(d.ocupantes);
      if (d.carros)      preencherCarros(d.carros);
      if (d.motos)       preencherMotos(d.motos);
      if (d.bikes)       preencherBikes(d.bikes);
      if (d.pets)        preencherPets(d.pets);
      if (d.prestadores) preencherPrestadores(d.prestadores);

      if (d.tipo) {
        const elTipo = document.getElementById("tipoResidente");
        if (elTipo) elTipo.value = d.tipo;
        tratarEscolhaTipoResidente(d.tipo);
      }

      if (d.apto) {
        const elApto = document.getElementById("apto");
        if (elApto) {
          elApto.value = d.apto;
          var evt = document.createEvent("HTMLEvents");
          evt.initEvent("change", false, true);
          elApto.dispatchEvent(evt);
        }
      }

      alterarTextoBotaoEnviar("Atualizar cadastro");
      exibirPassoTipoResidente();

    } else {
      if (inputCpf) inputCpf.disabled = false;
      if (inputNasc) inputNasc.disabled = false;
      if (inputCpf) inputCpf.value = "";
      if (inputNasc) inputNasc.value = "";
      
      const secTipo = document.getElementById('secTipoResidente');
      if (secTipo) { secTipo.classList.add('hidden'); secTipo.style.display = 'none'; }

      const secApto = document.getElementById('secApto');
      if (secApto) { secApto.classList.add('hidden'); secApto.style.display = 'none'; }

      const secResto = document.getElementById('secRestoFormulario');
      if (secResto) { secResto.classList.add('hidden'); secResto.style.display = 'none'; }

      alterarTextoBotaoEnviar("Enviar cadastro");
      alert(resposta && resposta.mensagem ? resposta.mensagem : "CPF ou data de nascimento incorretos, ou não localizados na base de dados.");
    }
  })
  .catch(err => {
    if (btnBusca) {
      btnBusca.innerText = textoOriginalBtn;
      btnBusca.disabled = false;
    }
    if (inputCpf) inputCpf.disabled = false;
    if (inputNasc) inputNasc.disabled = false;
    alert("Erro técnico na busca: " + err);
  });
}

function formatarDataParaInput(dataStr) {
  if (!dataStr) return "";
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
    return dataStr;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) {
    const partes = dataStr.split('/');
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  }

  const d = new Date(dataStr);
  if (!isNaN(d.getTime())) {
    const ano = d.getUTCFullYear();
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(d.getUTCDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  return dataStr;
}

// --- GERENCIADOR DE GRUPOS DINÂMICOS --- //

function adicionarItemDinamico(containerId, classeGrupo, htmlCampos) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const div = document.createElement("div");
  div.className = `dynamic-group ${classeGrupo}`;
  div.innerHTML = `
    <div class="dynamic-row">
      ${htmlCampos}
    </div>
    <button type="button" class="btn-remove-x" onclick="removerItem(this)">&times;</button>
  `;
  container.appendChild(div);
}

function removerItem(btn) {
  btn.closest('.dynamic-group').remove();
}

// --- PREENCHIMENTO AUTOMÁTICO DAS LISTAS --- //

function addEmergencia(v = {}) {
  adicionarItemDinamico('containerEmergencia', 'item-emergencia', `
    <div><span class="input-label">Nome</span><input type="text" placeholder="Bernardo de Sousa Franco" class="em-nome" value="${v.nome || ''}"></div>
    <div><span class="input-label">Telefone / Celular</span><input type="tel" placeholder="21987654321" class="em-tel" value="${v.tel || ''}"></div>
    <div><span class="input-label">Endereço</span><input type="text" placeholder="Rua Souza Franco" class="em-end" value="${v.end || ''}"></div>
    <div><span class="input-label">Vínculo / Parentesco</span><input type="text" placeholder="Filho, cônjuge, amigo, cuidador etc" class="em-vinculo" value="${v.vinculo || ''}"></div>
  `);
}

function preencherEmergencias(texto) {
  const container = document.getElementById("containerEmergencia");
  if (!container) return;
  container.innerHTML = "";
  if (!texto || texto === "-") { addEmergencia(); return; }
  texto.split("\n").forEach(linha => {
    const p = linha.split(" | ");
    addEmergencia({ nome: p[0], tel: p[1], end: p[2], vinculo: p[3] });
  });
}

function addOcupante(v = {}) {
  adicionarItemDinamico('containerOcupantes', 'item-ocupante', `
    <div><span class="input-label">Nome</span><input type="text" placeholder="Bernardo de Sousa Franco" class="oc-nome" value="${v.nome || ''}"></div>
    <div><span class="input-label">Telefone / Celular</span><input type="tel" placeholder="21987654321" class="oc-tel" value="${v.tel || ''}"></div>
    <div><span class="input-label">Data de nascimento</span><input type="${v.nasc ? 'date' : 'text'}" placeholder="28/07/1805" class="oc-nasc" value="${v.nasc || ''}" onfocus="(this.type='date')" onblur="if(!this.value) this.type='text'"></div>
    <div><span class="input-label">Vínculo / Parentesco</span><input type="text" placeholder="Filho, cônjuge, amigo, cuidador etc" class="oc-vinculo" value="${v.vinculo || ''}"></div>
  `);
}

function preencherOcupantes(texto) {
  const container = document.getElementById("containerOcupantes");
  if (!container) return;
  container.innerHTML = "";
  if (!texto || texto === "-") return;
  texto.split("\n").forEach(linha => {
    const p = linha.split(" | ");
    addOcupante({ nome: p[0], tel: p[1], nasc: p[2], vinculo: p[3] });
  });
}

function addCarro(v = {}) {
  adicionarItemDinamico('containerCarros', 'item-carro', `
    <div><span class="input-label">Marca</span><input type="text" placeholder="Toyota" class="car-marca" value="${v.marca || ''}"></div>
    <div><span class="input-label">Modelo</span><input type="text" placeholder="Corolla" class="car-modelo" value="${v.modelo || ''}"></div>
    <div><span class="input-label">Cor</span><input type="text" placeholder="Prata" class="car-cor" value="${v.cor || ''}"></div>
    <div><span class="input-label">Placa</span><input type="text" placeholder="SJP-4K82" class="car-placa" value="${v.placa || ''}"></div>
  `);
}

function preencherCarros(texto) {
  const container = document.getElementById("containerCarros");
  if (!container) return;
  container.innerHTML = "";
  if (!texto || texto === "-") return;
  texto.split("\n").forEach(linha => {
    const p = linha.split(" | ");
    addCarro({ marca: p[0], modelo: p[1], cor: p[2], placa: p[3] });
  });
}

function addMoto(v = {}) {
  adicionarItemDinamico('containerMotos', 'item-moto', `
    <div><span class="input-label">Marca</span><input type="text" placeholder="Honda" class="moto-marca" value="${v.marca || ''}"></div>
    <div><span class="input-label">Modelo</span><input type="text" placeholder="CG 160 Titan" class="moto-modelo" value="${v.modelo || ''}"></div>
    <div><span class="input-label">Cor</span><input type="text" placeholder="Azul" class="moto-cor" value="${v.cor || ''}"></div>
    <div><span class="input-label">Placa</span><input type="text" placeholder="QMV-7H31" class="moto-placa" value="${v.placa || ''}"></div>
  `);
}

function preencherMotos(texto) {
  const container = document.getElementById("containerMotos");
  if (!container) return;
  container.innerHTML = "";
  if (!texto || texto === "-") return;
  texto.split("\n").forEach(linha => {
    const p = linha.split(" | ");
    addMoto({ marca: p[0], modelo: p[1], cor: p[2], placa: p[3] });
  });
}

function addBike(v = {}) {
  adicionarItemDinamico('containerBikes', 'item-bike', `
    <div><span class="input-label">Marca</span><input type="text" placeholder="Caloi" class="bike-marca" value="${v.marca || ''}"></div>
    <div><span class="input-label">Cor</span><input type="text" placeholder="Vermelha" class="bike-cor" value="${v.cor || ''}"></div>
  `);
}

function preencherBikes(texto) {
  const container = document.getElementById("containerBikes");
  if (!container) return;
  container.innerHTML = "";
  if (!texto || texto === "-") return;
  texto.split("\n").forEach(linha => {
    const p = linha.split(" | ");
    addBike({ marca: p[0], cor: p[1] });
  });
}

function addPet(v = {}) {
  adicionarItemDinamico('containerPets', 'item-pet', `
    <div><span class="input-label">Nome</span><input type="text" placeholder="Snoopy" class="pet-nome" value="${v.nome || ''}"></div>
    <div><span class="input-label">Espécie</span><input type="text" placeholder="Cachorro" class="pet-especie" value="${v.especie || ''}"></div>
    <div><span class="input-label">Raça</span><input type="text" placeholder="Beagle" class="pet-raca" value="${v.raca || ''}"></div>
    <div><span class="input-label">Porte</span><select class="pet-porte">
      <option value="">Selecione...</option>
      <option value="Pequeno" ${v.porte === 'Pequeno' ? 'selected' : ''}>Pequeno</option>
      <option value="Médio" ${v.porte === 'Médio' ? 'selected' : ''}>Médio</option>
      <option value="Grande" ${v.porte === 'Grande' ? 'selected' : ''}>Grande</option>
    </select></div>
  `);
}

function preencherPets(texto) {
  const container = document.getElementById("containerPets") || 
                    document.getElementById("containerPet") || 
                    document.getElementById("petsContainer");
                    
  if (!container) return;
  
  container.innerHTML = "";
  if (!texto || texto === "-" || texto.trim() === "") return;
  
  texto.split("\n").forEach(linha => {
    const p = linha.split(" | ");
    if (p.some(item => item && item.trim() !== "")) {
      addPet({ nome: p[0], especie: p[1], raca: p[2], porte: p[3] });
    }
  });
}

function addPrestador(v = {}) {
  adicionarItemDinamico('containerPrestadores', 'item-prestador', `
    <div><span class="input-label">Nome *</span><input type="text" placeholder="César Millan" class="pr-nome" value="${v.nome || ''}"></div>
    <div><span class="input-label">Serviço *</span><input type="text" placeholder="Adestrador de animais, diarista etc" class="pr-servico" value="${v.servico || ''}"></div>
    <div><span class="input-label">Telefone / Celular *</span><input type="tel" placeholder="21987654321" class="pr-tel" value="${v.tel || ''}"></div>
    <div><span class="input-label">Possui chave? *</span><select class="pr-chave">
      <option value="">Selecione...</option>
      <option value="Sim" ${v.chave === 'Sim' ? 'selected' : ''}>Sim</option>
      <option value="Não" ${v.chave === 'Não' ? 'selected' : ''}>Não</option>
    </select></div>
  `);
}

function preencherPrestadores(texto) {
  const container = document.getElementById("containerPrestadores");
  if (!container) return;
  container.innerHTML = "";
  if (!texto || texto === "-") return;
  texto.split("\n").forEach(linha => {
    const p = linha.split(" | ");
    addPrestador({ nome: p[0], servico: p[1], tel: p[2], chave: p[3] });
  });
}

// --- ENVIO DO FORMULÁRIO --- //

function coletarDadosGrupados(selectorGroup, camposSelectors) {
  const grupos = document.querySelectorAll(selectorGroup);
  const resultado = [];
  
  grupos.forEach(g => {
    const valores = camposSelectors.map(s => {
      const el = g.querySelector(s);
      return el ? el.value.trim() : "";
    });

    if (valores[0] !== "") {
      resultado.push(valores.join(" | "));
    }
  });
  
  return resultado.join("\n");
}

function enviar() {
  limpaMensagemStatus();
  
  let camposFaltantes = [];

  // ==========================================
  // 1. LISTA CENTRALIZADA DE CAMPOS OBRIGATÓRIOS
  // ==========================================
  const regrasObrigatorias = [
    { id: "apto", nome: "Apartamento" },
    { id: "tipoResidente", nome: "Identificação do imóvel" },
    { id: "moradorNome", nome: "Nome" },
    { id: "moradorCpf", nome: "CPF" },
    { id: "moradorRg", nome: "RG" },
    { id: "moradorOrgaoEmissor", nome: "Órgão emissor" },
    { id: "moradorNasc", nome: "Data de nascimento" },
    { id: "moradorCelular", nome: "Celular" },
    { id: "moradorTel", nome: "Telefone fixo" },
    { id: "moradorEmail", nome: "E-mail" },
    { id: "vagaSituacao", nome: "Situação da vaga" },
    { id: "vagaAptoRelacionado", nome: "Apartamento envolvido (Vaga)" },
    { id: "inqPropAdmin", nome: "Proprietário / Administradora" },
    { id: "inqContato", nome: "Contato do proprietário / imobiliária" },
    { id: "inqVigencia", nome: "Vigência do contrato" },
    { id: "arquivoContrato", nome: "Contrato de locação" },
    { id: "declaracao", nome: "Declaro", tipo: "checkbox" }
  ];

  regrasObrigatorias.forEach(regra => {
    const el = document.getElementById(regra.id);
    if (el && el.offsetParent !== null) { // Valida apenas se o elemento estiver visível na tela
      let estaVazio = false;
      
      // Regra especial para a Vaga: Se preencheu a situação, o apto relacionado é obrigatório
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

  // ==========================================
  // 2. VALIDAÇÃO OBRIGATÓRIA DOS PRESTADORES
  // ==========================================
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

  // ==========================================
  // 3. ORDENAÇÃO SEGUINDO A ORDEM EXATA DO FORMULÁRIO
  // ==========================================
  const ordemDesejada = [
    "Apartamento",
    "Identificação do imóvel",
    "Nome",
    "CPF",
    "RG",
    "Órgão emissor",
    "Data de nascimento",
    "Celular",
    "Telefone fixo",
    "E-mail",
    "Contato de emergência",
    "Proprietário / Administradora",
    "Contato do proprietário",
    "Vigência do contrato",
    "Contrato de locação",
    "Situação da vaga",
    "Apartamento envolvido",
    "Ocupante",
    "Carro",
    "Moto",
    "Bike",
    "Pet",
    "Prestador",
    "Observações",
    "Declaro"
  ];

  camposFaltantes.sort((a, b) => {
    let indexA = ordemDesejada.findIndex(item => a.toLowerCase().includes(item.toLowerCase()));
    let indexB = ordemDesejada.findIndex(item => b.toLowerCase().includes(item.toLowerCase()));

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

  // Requisição Fetch para a função processarFormulario no Apps Script
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

// --- RESET / LIMPEZA --- //

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
