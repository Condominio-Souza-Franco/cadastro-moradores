// CONSULTA DE CPF, VALIDAÇÃO DOS CAMPOS OBRIGATÓRIOS, ORDENAÇÃO DO ALERT E REGRA DA VAGA

function formatarDataParaInput(dataStr) {
  if (!dataStr) return "";
  return dataStr.substring(0, 10);
}

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

      // --- EXIBIÇÃO DO HISTÓRICO DE CONTRATOS (LENDO LINHA ÚNICA SEPARADA POR " | ") ---
      const containerHistorico = document.getElementById('containerHistoricoContratos');
      const listaHistorico = document.getElementById('listaHistoricoContratos');

      if (listaHistorico && containerHistorico) {
        listaHistorico.innerHTML = ""; 

        let valorContratos = d.linkContratoHistorico;
        let itensArray = [];

        // Se vier como string única contendo " | " na planilha
        if (typeof valorContratos === 'string' && valorContratos.trim() !== "" && valorContratos !== "-") {
          // Quebra a string onde tiver " | "
          itensArray = valorContratos.split(' | ');
        } else if (Array.isArray(valorContratos)) {
          // Se já vier como array, junta tudo em uma string e quebra por " | " para garantir
          let textoUnido = valorContratos.join(' | ');
          itensArray = textoUnido.split(' | ');
        }

        // Filtra espaços em vazios
        itensArray = itensArray.map(item => item.trim()).filter(item => item !== "" && item !== "-");

        if (itensArray.length > 0) {
          itensArray.forEach((urlOuTexto, index) => {
            const a = document.createElement('a');
            
            // Aqui definimos que o href e o texto usam o mesmo item da lista separada por " | "
            a.href = urlOuTexto;
            a.target = "_blank";
            
            // Se o item parecer uma URL, tentamos extrair o nome ou exibir um rótulo amigável com a data/número
            // Mas se ele for o próprio nome/link, exibimos ele formatado:
            a.textContent = `📄 ${urlOuTexto.split('/').pop() || 'Contrato / Aditivo ' + (index + 1)}`;
            
            a.style.display = "block";
            a.style.marginBottom = "8px";
            a.style.color = "#0d6efd";
            a.style.textDecoration = "none";
            
            listaHistorico.appendChild(a);
          });

          containerHistorico.classList.remove('hidden');
          containerHistorico.style.display = 'block';
        } else {
          containerHistorico.classList.add('hidden');
          containerHistorico.style.display = 'none';
        }
      }

      if (document.getElementById("vagaSituacao") && d.vagaSituacao) document.getElementById("vagaSituacao").value = d.vagaSituacao;
      if (document.getElementById("vagaAptoRelacionado") && d.vagaAptoRelacionado) document.getElementById("vagaAptoRelacionado").value = d.vagaAptoRelacionado;

      if (d.emergencias) preencherEmergencias(d.emergencias);
      if (d.ocupantes)   preencherOcupantes(d.ocupantes);
      if (d.carros)      preencherCarros(d.carros);
      if (d.motos)       preencherMotos(d.motos);
      if (d.bikes)       preencherBikes(d.bikes);
      if (d.pets)        preencherPets(d.pets);
      if (d.prestadores) preencherPrestadores(d.prestadores);

      if (document.getElementById("observacoes")) document.getElementById("observacoes").value = d.observacoes || "";

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
        
        if (typeof atualizarInfoVagaLocal === 'function') {
          atualizarInfoVagaLocal(d.apto);
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
