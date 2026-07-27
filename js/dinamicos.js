// DOM, INICIALIZAÇÕES, MENUS SUSPENSOS, MÁSCARAS E GERADORES DE LINHAS DINÂMICAS

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

function rolarParaSecao(secaoId) {
  const elemento = document.getElementById(secaoId);
  if (elemento) {
    elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

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
    <div><span class="input-label">Marca e modelo</span><input type="text" placeholder="Toyota Corolla" class="car-marca-modelo" value="${v.marcaModelo || ''}"></div>
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
    addCarro({ marcaModelo: p[0], cor: p[1], placa: p[2] });
  });
}

function addMoto(v = {}) {
  adicionarItemDinamico('containerMotos', 'item-moto', `
    <div><span class="input-label">Marca e modelo</span><input type="text" placeholder="Honda CG 160 Titan" class="moto-marca-modelo" value="${v.marcaModelo || ''}"></div>
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
    addMoto({ marcaModelo: p[0], cor: p[1], placa: p[2] });
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
