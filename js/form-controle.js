// ==========================================
// CONTROLE DE RESET DO FORMULÁRIO, GABARITO E CONTRATO
// ==========================================

let gabaritoVagasCache = [];
let historicoContratosCache = [];
let modalResolver = null;

function exibirModalGenerico({ titulo = 'Atenção', mensagem = '', tipo = 'alerta', textoConfirmar = 'OK', textoCancelar = 'Cancelar' }) {
  const overlay = document.getElementById('modalOverlay');
  const tituloEl = document.getElementById('modalTitulo');
  const mensagemEl = document.getElementById('modalMensagem');
  const btnConfirmar = document.getElementById('btnModalConfirmar');
  const btnCancelar = document.getElementById('btnModalCancelar');

  if (!overlay || !tituloEl || !mensagemEl || !btnConfirmar || !btnCancelar) return Promise.resolve(false);

  tituloEl.textContent = titulo;
  mensagemEl.textContent = mensagem;
  btnConfirmar.textContent = textoConfirmar;
  btnCancelar.textContent = textoCancelar;

  if (tipo === 'confirmacao') {
    btnCancelar.classList.remove('hidden');
    btnConfirmar.classList.remove('hidden');
  } else {
    btnCancelar.classList.add('hidden');
    btnConfirmar.classList.remove('hidden');
  }

  overlay.classList.remove('hidden');

  return new Promise((resolve) => {
    modalResolver = resolve;
  });
}

function fecharModalGenerico(valor) {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }

  if (typeof modalResolver === 'function') {
    modalResolver(valor);
    modalResolver = null;
  }
}

function mostrarAlerta(mensagem, titulo = 'Atenção') {
  const promise = exibirModalGenerico({ titulo, mensagem, tipo: 'alerta', textoConfirmar: 'OK' });

  const btnConfirmar = document.getElementById('btnModalConfirmar');
  if (btnConfirmar) {
    btnConfirmar.onclick = function() {
      fecharModalGenerico(true);
    };
  }

  const btnCancelar = document.getElementById('btnModalCancelar');
  if (btnCancelar) {
    btnCancelar.onclick = function() {
      fecharModalGenerico(false);
    };
  }

  return promise;
}

async function confirmarAcao(mensagem, titulo = 'Confirmação') {
  const promise = exibirModalGenerico({ titulo, mensagem, tipo: 'confirmacao', textoConfirmar: 'Confirmar', textoCancelar: 'Cancelar' });

  const btnConfirmar = document.getElementById('btnModalConfirmar');
  if (btnConfirmar) {
    btnConfirmar.onclick = function() {
      fecharModalGenerico(true);
    };
  }

  const btnCancelar = document.getElementById('btnModalCancelar');
  if (btnCancelar) {
    btnCancelar.onclick = function() {
      fecharModalGenerico(false);
    };
  }

  return await promise;
}

window.alert = function(mensagem) {
  mostrarAlerta(mensagem, 'Atenção');
};

window.confirm = function(mensagem) {
  return confirmarAcao(mensagem, 'Confirmação');
};

function atualizarEstadoBotaoNovoCadastro(ativo, bloqueado) {
  const btnMoradorNovo = document.getElementById('btnMoradorNovo');
  const btnFecharNovoCadastro = document.getElementById('btnFecharNovoCadastro');
  if (!btnMoradorNovo) return;

  btnMoradorNovo.disabled = false;
  btnMoradorNovo.setAttribute('aria-pressed', ativo ? 'true' : 'false');
  btnMoradorNovo.classList.toggle('ativo', !!ativo);
  btnMoradorNovo.classList.toggle('bloqueado', !!bloqueado);

  if (btnFecharNovoCadastro) {
    const deveExibirFechar = !!ativo;
    btnFecharNovoCadastro.classList.toggle('hidden', !deveExibirFechar);
    btnFecharNovoCadastro.disabled = !deveExibirFechar;
  }
}

function alternarMoradorNovo() {
  const chkMoradorNovo = document.getElementById('chkMoradorNovo');
  const cpfConsulta = document.getElementById('cpfConsulta');
  const nascConsulta = document.getElementById('nascConsulta');
  const btnMoradorNovo = document.getElementById('btnMoradorNovo');
  if (!chkMoradorNovo) return;

  const botaoBloqueado = btnMoradorNovo && btnMoradorNovo.getAttribute('aria-disabled') === 'true';
  if (chkMoradorNovo.disabled && !botaoBloqueado) return;

  if (botaoBloqueado) {
    if (cpfConsulta) cpfConsulta.value = '';
    if (nascConsulta) nascConsulta.value = '';
    chkMoradorNovo.disabled = false;
    atualizarBloqueioNovoCadastro();
    tratarMoradorNovo(true);
    return;
  }

  if (chkMoradorNovo.checked) return;

  tratarMoradorNovo(!chkMoradorNovo.checked);
}

function fecharNovoCadastro() {
  const chkMoradorNovo = document.getElementById('chkMoradorNovo');
  if (!chkMoradorNovo || chkMoradorNovo.disabled || !chkMoradorNovo.checked) return;

  tratarMoradorNovo(false);
}

function atualizarBloqueioNovoCadastro() {
  const chkMoradorNovo = document.getElementById('chkMoradorNovo');
  const cpfConsulta = document.getElementById('cpfConsulta');
  const nascConsulta = document.getElementById('nascConsulta');
  const linhaMoradorNovo = chkMoradorNovo ? chkMoradorNovo.closest('.row-checkbox-morador') : null;

  if (!chkMoradorNovo || !cpfConsulta || !nascConsulta) return;

  const temCpfDigitado = String(cpfConsulta.value || '').trim() !== '';
  const temNascDigitada = String(nascConsulta.value || '').trim() !== '';
  const deveBloquear = temCpfDigitado || temNascDigitada;

  chkMoradorNovo.disabled = false;
  if (deveBloquear) {
    chkMoradorNovo.checked = false;
  }

  atualizarEstadoBotaoNovoCadastro(chkMoradorNovo.checked, deveBloquear);

  const btnMoradorNovo = document.getElementById('btnMoradorNovo');
  if (btnMoradorNovo) {
    btnMoradorNovo.setAttribute('aria-disabled', deveBloquear ? 'true' : 'false');
  }

  if (linhaMoradorNovo) {
    linhaMoradorNovo.classList.toggle('bloqueado', deveBloquear);
  }
}

function redefinirBotoesParaNovoCadastro() {
  const btnEnviar = document.getElementById('btnEnviarForm');
  const btnSair = document.getElementById('btnSairSemAlterar');

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
  try {
    const containerPreview = document.getElementById('containerPreviewContrato');
    const nomeArquivoSpan = document.getElementById('nomeArquivoSelecionado');
    const inputContrato = document.getElementById('arquivoContrato');

    if (containerPreview) {
      containerPreview.classList.add('hidden');
      containerPreview.style.display = '';
    }
    if (nomeArquivoSpan) nomeArquivoSpan.textContent = 'Nenhum arquivo selecionado';
    if (inputContrato) inputContrato.value = '';
    limparHistoricoContratos();
    if (typeof arquivoContratoObjeto !== 'undefined') {
      arquivoContratoObjeto = null;
    }

    const form = document.getElementById('cadForm');
    if (form) {
      form.reset();
    }

    document.querySelectorAll('.input-erro-destaque').forEach(el => el.classList.remove('input-erro-destaque'));

    const cpfConsulta = document.getElementById('cpfConsulta');
    const btnBuscarCpf = document.getElementById('btnBuscarCpf');

    if (cpfConsulta) {
      cpfConsulta.value = '';
      cpfConsulta.disabled = false;
    }
    if (btnBuscarCpf) {
      btnBuscarCpf.disabled = false;
      btnBuscarCpf.innerText = 'Buscar Cadastro';
    }

    const aptoSelect = document.getElementById('apto');
    if (aptoSelect) aptoSelect.value = '';

    const tipoResidente = document.getElementById('tipoResidente');
    if (tipoResidente) {
      tipoResidente.value = '';
      tipoResidente.dataset.valorAnterior = '';
      tipoResidente.dataset.revertendo = 'false';
    }

    const containersDinamicos = [
      'containerEmergencia',
      'containerOcupantes',
      'containerCarros',
      'containerMotos',
      'containerBikes',
      'containerPets',
      'containerPrestadores'
    ];

    containersDinamicos.forEach(function(id) {
      const container = document.getElementById(id);
      if (container) container.innerHTML = '';
    });

    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
      statusMessage.innerHTML = '';
      statusMessage.classList.add('hidden');
    }

    const secoesParaEsconder = [
      'secTipoResidente',
      'secApto',
      'secInquilino',
      'secRestoFormulario'
    ];

    secoesParaEsconder.forEach(function(id) {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add('hidden');
        el.style.display = '';
      }
    });

    const chkMoradorNovo = document.getElementById('chkMoradorNovo');
    if (chkMoradorNovo) {
      chkMoradorNovo.checked = false;
    }
    atualizarEstadoBotaoNovoCadastro(false, false);

    const nascConsulta = document.getElementById('nascConsulta');
    if (nascConsulta) {
      nascConsulta.value = '';
      nascConsulta.disabled = false;
    }

    if (typeof redefinirBotoesParaNovoCadastro === 'function') {
      redefinirBotoesParaNovoCadastro();
    }

    atualizarBloqueioNovoCadastro();
  } catch (erro) {
    console.error('Erro ao voltar para a tela inicial: ', erro);
    window.location.reload();
  }
}

function tratarMoradorNovo(isMarcado) {
  const secTipoResidente = document.getElementById('secTipoResidente');
  const cpfConsulta = document.getElementById('cpfConsulta');
  const nascConsulta = document.getElementById('nascConsulta');
  const btnBuscarCpf = document.getElementById('btnBuscarCpf');
  const chkMoradorNovo = document.getElementById('chkMoradorNovo');

  if (isMarcado) {
    voltarTelaInicial();

    if (chkMoradorNovo) chkMoradorNovo.checked = true;
    atualizarEstadoBotaoNovoCadastro(true, false);

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
      addEmergencia();
      rolarParaSecao('secTipoResidente');
    }
  } else {
    voltarTelaInicial();
    atualizarEstadoBotaoNovoCadastro(false, false);
  }
}

function atualizarInfoVagaLocal(apto) {
  const divVaga = document.getElementById('infoVagaGaragem');
  if (!divVaga) return;

  if (!apto || apto.trim() === '') {
    divVaga.style.display = 'none';
    divVaga.innerText = '';
    return;
  }

  let vagaEncontrada = null;
  for (let i = 0; i < gabaritoVagasCache.length; i++) {
    const linha = gabaritoVagasCache[i];
    const aptoPlanilha = String(linha[0]).trim().toLowerCase();

    if (aptoPlanilha === String(apto).trim().toLowerCase()) {
      const andar = linha[1];
      const numero = linha[2];

      if (numero && andar) {
        vagaEncontrada = `Sua vaga é a <strong>${numero}</strong> e fica no <strong>${andar}</strong>.`;
      }
      break;
    }
  }

  if (vagaEncontrada) {
    divVaga.innerHTML = vagaEncontrada;
    divVaga.style.display = 'block';
  } else {
    divVaga.style.display = 'none';
  }
}

let arquivoContratoObjeto = null;

function normalizarHistoricoContratos(contratos) {
  const itens = Array.isArray(contratos) ? contratos : [];
  return itens
    .map(function(item) {
      const url = item && (item.url || item.link || item.href || '');
      if (!url) return null;

      const texto = item && (item.texto || item.nome || item.label || 'Contrato anterior');
      return { url, texto };
    })
    .filter(Boolean);
}

function removerContratoHistoricoPorUrl(url) {
  if (!url) return;

  historicoContratosCache = historicoContratosCache.filter(function(item) {
    const urlAtual = item && (item.url || item.link || item.href || '');
    return urlAtual !== url;
  });

  exibirHistoricoContratos(historicoContratosCache);
}

function limparHistoricoContratos() {
  const container = document.getElementById('containerHistoricoContratos');
  const lista = document.getElementById('listaHistoricoContratos');

  historicoContratosCache = [];

  if (container) {
    container.classList.add('hidden');
    container.style.display = 'none';
  }

  if (lista) {
    lista.innerHTML = '';
  }
}

function exibirHistoricoContratos(contratos) {
  const container = document.getElementById('containerHistoricoContratos');
  const lista = document.getElementById('listaHistoricoContratos');

  if (!container || !lista) return;

  lista.innerHTML = '';

  const itens = normalizarHistoricoContratos(contratos);
  historicoContratosCache = itens;

  if (!itens.length) {
    limparHistoricoContratos();
    return;
  }

  itens.forEach(function(item) {
    const url = item.url;
    const texto = item.texto;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = texto;

    const btnRemover = document.createElement('button');
    btnRemover.type = 'button';
    btnRemover.className = 'btn-remover-historico';
    btnRemover.title = 'Remover arquivo do histórico';
    btnRemover.textContent = '✕';

    const wrapper = document.createElement('div');
    wrapper.className = 'item-historico-contrato';
    wrapper.appendChild(link);
    wrapper.appendChild(btnRemover);
    lista.appendChild(wrapper);

    btnRemover.addEventListener('click', async function() {
      const confirmarExclusao = await confirmarAcao('Deseja realmente excluir este contrato do histórico?', 'Confirmação');
      if (!confirmarExclusao) {
        return;
      }

      removerContratoHistoricoPorUrl(url);
    });
  });

  if (lista.children.length > 0) {
    container.classList.remove('hidden');
    container.style.display = 'block';
  } else {
    limparHistoricoContratos();
  }
}

document.addEventListener('DOMContentLoaded', function() {
  if (typeof WEB_APP_URL !== 'undefined') {
    fetch(WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({ funcao: 'obterTodoGabaritoVagas' })
    })
      .then(response => response.json())
      .then(res => {
        if (res && res.sucesso) {
          gabaritoVagasCache = res.dados;
          console.log('SUCESSO: Gabarito carregado via fetch. Total de linhas:', gabaritoVagasCache.length);
        } else {
          console.warn('FALHA: O servidor retornou sucesso=false ao buscar o gabarito.');
        }
      })
      .catch(err => {
        console.error('ERRO CRÍTICO ao carregar gabarito via fetch:', err);
      });
  }

  const selectApto = document.getElementById('apto');
  if (selectApto) {
    selectApto.addEventListener('change', (e) => {
      atualizarInfoVagaLocal(e.target.value);
    });
    selectApto.addEventListener('input', (e) => {
      atualizarInfoVagaLocal(e.target.value);
    });
  }

  const inputContrato = document.getElementById('arquivoContrato');
  const containerPreview = document.getElementById('containerPreviewContrato');
  const nomeArquivoSpan = document.getElementById('nomeArquivoSelecionado');
  const nomeArquivoPreviewSpan = document.getElementById('nomeArquivoSelecionadoPreview');
  const btnRemoverContrato = document.getElementById('btnRemoverContrato');
  const cpfConsulta = document.getElementById('cpfConsulta');
  const nascConsulta = document.getElementById('nascConsulta');

  [cpfConsulta, nascConsulta].forEach(function(campo) {
    if (!campo) return;
    campo.addEventListener('input', atualizarBloqueioNovoCadastro);
    campo.addEventListener('change', atualizarBloqueioNovoCadastro);
  });

  atualizarBloqueioNovoCadastro();

  if (inputContrato) {
    inputContrato.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        if (file.type !== 'application/pdf') {
          mostrarAlerta('Por favor, selecione apenas arquivos no formato PDF.', 'Atenção');
          inputContrato.value = '';
          nomeArquivoSpan.textContent = 'Nenhum arquivo selecionado';
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

          nomeArquivoSpan.textContent = '📎 ' + file.name;
          if (nomeArquivoPreviewSpan) nomeArquivoPreviewSpan.textContent = '📎 ' + file.name;
          containerPreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (btnRemoverContrato) {
    btnRemoverContrato.addEventListener('click', function() {
      inputContrato.value = '';
      arquivoContratoObjeto = null;
      containerPreview.classList.add('hidden');
      if (nomeArquivoSpan) nomeArquivoSpan.textContent = 'Nenhum arquivo selecionado';
      if (nomeArquivoPreviewSpan) nomeArquivoPreviewSpan.textContent = '';
    });
  }
});
