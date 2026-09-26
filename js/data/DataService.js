// ==========================================
// DATA SERVICE
// ==========================================
// Camada única de acesso a dados. O resto da aplicação chama window.DataService.*
// e não precisa saber se os dados vêm do Firebase ou do Google Sheets.
//
// Modos de configuração (persistidos em localStorage, escolhidos pelo admin em "Fonte de dados"):
//   "auto"     (padrão) tenta Firebase primeiro; se indisponível, cai para Google Sheets.
//   "firebase" usa somente Firebase; não faz fallback; permite leitura e escrita.
//   "sheets"   usa somente Google Sheets; somente leitura (bloqueia escrita).
//
// O Firebase já está configurado (FirebaseRepository.isConfigured() === true): toda escrita
// vai para o Firebase, e o modo "sheets" (manual ou por fallback automático de leitura) fica
// só-leitura. Como as escritas não vão mais para a planilha, os dados do Sheets podem estar
// desatualizados quando o fallback é usado.
//
// As duas fontes passam pelo MESMO Apps Script (WEB_APP_URL). O fallback só ajuda quando o
// Firestore falha; se o Apps Script inteiro estiver fora, as duas fontes falham juntas.
(function() {
  var STORAGE_KEY = "dataSourceMode";
  // ms — tempo máximo de espera pelo Firebase no modo automático. O Apps Script pode levar
  // vários segundos para "acordar"; um valor baixo derrubava a sessão para somente leitura à toa.
  var DATA_SOURCE_TIMEOUT = 15000;

  var state = {
    configuredSource: "auto", // "auto" | "firebase" | "sheets"
    activeSource: "none", // "firebase" | "sheets" | "none" — fonte efetivamente usada na última leitura
    falhaTotal: false, // true somente quando uma leitura realmente tentou e as duas fontes falharam
    lastError: null
  };

  function log(mensagem) {
    // Nunca logar dados pessoais de moradores aqui — apenas eventos de alto nível.
    console.log("[DataSource] " + mensagem);
  }

  function criarErroFonte(codigo, mensagem) {
    var erro = new Error(mensagem);
    erro.codigoFonte = codigo;
    return erro;
  }

  function dispararMudanca() {
    if (document.body) {
      document.body.classList.toggle("modo-somente-leitura", escritaBloqueada());
    }
    window.dispatchEvent(new CustomEvent("datasource-changed", {
      detail: {
        configuredSource: state.configuredSource,
        activeSource: state.activeSource
      }
    }));
  }

  function setActiveSource(fonte, falhaTotal) {
    var mudouFalha = !!falhaTotal !== state.falhaTotal;
    state.falhaTotal = !!falhaTotal;
    if (state.activeSource === fonte && !mudouFalha) return;
    state.activeSource = fonte;
    dispararMudanca();
  }

  function ehErroAutorizacao(erro) {
    var codigo = erro && erro.codigoFonte;
    return codigo === "nao-autorizado" || codigo === "permission-denied";
  }

  // Sessão expirada não é indisponibilidade da fonte: não acende o indicador vermelho.
  function marcarFalhaTotal(erro) {
    if (ehErroAutorizacao(erro)) return;
    setActiveSource("none", true);
  }

  function carregarPreferencia() {
    var valor = "auto";
    try {
      // TODO (futuro): antes de ler o localStorage, esta função pode ser trocada por uma
      // leitura remota (ex.: um documento de configuração no Firestore) para que a preferência
      // seja compartilhada entre todos os usuários, não apenas neste navegador.
      var salvo = window.localStorage ? localStorage.getItem(STORAGE_KEY) : null;
      if (salvo === "auto" || salvo === "firebase" || salvo === "sheets") {
        valor = salvo;
      }
    } catch (_) {
      // localStorage indisponível (modo privado, etc.) — mantém o padrão "auto"
    }
    state.configuredSource = valor;
    log("modo configurado: " + valor);
  }

  function salvarPreferencia(modo) {
    try {
      if (window.localStorage) localStorage.setItem(STORAGE_KEY, modo);
    } catch (_) {
      // Falha ao persistir não deve quebrar a troca de fonte na sessão atual.
    }
  }

  function comTimeout(promessa, ms) {
    return new Promise(function(resolve, reject) {
      var finalizado = false;
      var timer = setTimeout(function() {
        if (finalizado) return;
        finalizado = true;
        reject(criarErroFonte("timeout", "Tempo esgotado (" + ms + "ms) ao tentar o Firebase."));
      }, ms);

      promessa.then(function(resultado) {
        if (finalizado) return;
        finalizado = true;
        clearTimeout(timer);
        resolve(resultado);
      }, function(erro) {
        if (finalizado) return;
        finalizado = true;
        clearTimeout(timer);
        reject(erro);
      });
    });
  }

  function chamarRepositorio(repositorio, nomeMetodo, args) {
    var metodo = repositorio && repositorio[nomeMetodo];
    if (typeof metodo !== "function") {
      return Promise.reject(criarErroFonte("desconhecido", "Operação '" + nomeMetodo + "' não implementada em " + (repositorio && repositorio.nome) + "."));
    }
    return metodo.apply(repositorio, args || []);
  }

  // Bloqueia escrita quando a fonte configurada é explicitamente "sheets", ou quando o modo
  // automático caiu para "sheets" por indisponibilidade real do Firebase (já configurado).
  function escritaBloqueada() {
    if (state.configuredSource === "sheets") return true;
    if (state.configuredSource === "auto" && window.FirebaseRepository && window.FirebaseRepository.isConfigured() && state.activeSource === "sheets") {
      return true;
    }
    return false;
  }

  // Operações que variam muito com o tamanho da base (buscam várias subcoleções de todos os
  // apartamentos) precisam de mais tempo antes de considerar o Firebase "indisponível".
  var TIMEOUTS_POR_OPERACAO = {
    buscarTexto: 20000,
    gerarRelatorioApartamentos: 20000,
    gerarRelatorioApartamentosPdfDrive: 25000
  };

  function executarLeitura(nomeMetodo, args) {
    var modo = state.configuredSource;
    var timeoutOperacao = TIMEOUTS_POR_OPERACAO[nomeMetodo] || DATA_SOURCE_TIMEOUT;

    if (modo === "firebase") {
      log("modo Firebase (manual): tentando Firebase");
      return chamarRepositorio(window.FirebaseRepository, nomeMetodo, args)
        .then(function(resultado) {
          setActiveSource("firebase");
          return resultado;
        })
        .catch(function(erro) {
          marcarFalhaTotal(erro);
          log("Firebase indisponível (modo manual, sem fallback): " + (erro && erro.codigoFonte));
          throw erro;
        });
    }

    if (modo === "sheets") {
      log("modo Google Sheets (manual): usando Google Sheets");
      return chamarRepositorio(window.GoogleSheetsRepository, nomeMetodo, args)
        .then(function(resultado) {
          setActiveSource("sheets");
          return resultado;
        })
        .catch(function(erro) {
          marcarFalhaTotal(erro);
          throw erro;
        });
    }

    // Modo automático: Firebase primeiro (com timeout), fallback para Sheets em falha técnica.
    log("tentando Firebase");
    return comTimeout(chamarRepositorio(window.FirebaseRepository, nomeMetodo, args), timeoutOperacao)
      .then(function(resultado) {
        log("Firebase disponível");
        setActiveSource("firebase");
        return resultado;
      })
      .catch(function(erroFirebase) {
        if (ehErroAutorizacao(erroFirebase)) {
          // Falha de autorização (ex.: sessão expirada) não é indisponibilidade: não troca de
          // fonte nem marca falha total — o usuário só precisa fazer login de novo.
          log("Firebase: não autorizado (sem fallback automático)");
          throw erroFirebase;
        }

        // Operação ainda não migrada para o Firebase (ex.: gabarito, relatórios, busca):
        // usa o Sheets normalmente, mas isso NÃO é uma falha real do Firebase — não deve
        // acionar o indicador de contingência nem o bloqueio de escrita.
        if (erroFirebase && erroFirebase.codigoFonte === "nao-implementado") {
          log("operação '" + nomeMetodo + "' ainda não implementada no Firebase, usando Google Sheets (sem afetar indicador)");
          return chamarRepositorio(window.GoogleSheetsRepository, nomeMetodo, args);
        }

        log("Firebase indisponível (" + (erroFirebase && erroFirebase.codigoFonte) + "), tentando Google Sheets");
        return chamarRepositorio(window.GoogleSheetsRepository, nomeMetodo, args)
          .then(function(resultado) {
            log("fallback para Google Sheets ativado");
            setActiveSource("sheets");
            return resultado;
          })
          .catch(function(erroSheets) {
            if (ehErroAutorizacao(erroSheets)) throw erroSheets;
            setActiveSource("none", true);
            throw criarErroFonte("nenhuma-fonte", "Não foi possível carregar os dados: Firebase e Google Sheets estão indisponíveis.");
          });
      });
  }

  function executarEscrita(nomeMetodo, args) {
    if (escritaBloqueada()) {
      log("escrita bloqueada: fonte ativa é Google Sheets (somente leitura)");
      return Promise.reject(criarErroFonte("somente-leitura", "O sistema está em modo de contingência (Google Sheets) e não permite alterações no momento."));
    }

    var usarFirebase = window.FirebaseRepository && window.FirebaseRepository.isConfigured();

    if (state.configuredSource === "firebase" || usarFirebase) {
      return chamarRepositorio(window.FirebaseRepository, nomeMetodo, args)
        .then(function(resultado) {
          setActiveSource("firebase");
          return resultado;
        })
        .catch(function(erro) {
          // Operação ainda não migrada para o Firebase: no modo "auto" usa o Sheets normalmente
          // (nunca no modo manual "firebase", que deve mostrar o erro em vez de trocar de fonte).
          if (erro && erro.codigoFonte === "nao-implementado" && state.configuredSource === "auto") {
            log("operação '" + nomeMetodo + "' ainda não implementada no Firebase, usando Google Sheets");
            return chamarRepositorio(window.GoogleSheetsRepository, nomeMetodo, args)
              .then(function(resultado) {
                setActiveSource("sheets");
                return resultado;
              })
              .catch(function(erroSheets) {
                marcarFalhaTotal(erroSheets);
                throw erroSheets;
              });
          }

          marcarFalhaTotal(erro);
          throw erro;
        });
    }

    // Firebase ainda não configurado e modo é "auto": mantém o comportamento atual do site (Sheets grava normalmente).
    return chamarRepositorio(window.GoogleSheetsRepository, nomeMetodo, args)
      .then(function(resultado) {
        setActiveSource("sheets");
        return resultado;
      })
      .catch(function(erro) {
        marcarFalhaTotal(erro);
        throw erro;
      });
  }

  var DataService = {
    DATA_SOURCE_TIMEOUT: DATA_SOURCE_TIMEOUT,

    init: function() {
      carregarPreferencia();
    },

    getConfiguredSource: function() {
      return state.configuredSource;
    },

    getActiveSource: function() {
      return state.activeSource;
    },

    houveFalhaTotal: function() {
      return state.falhaTotal;
    },

    isReadOnly: function() {
      return escritaBloqueada();
    },

    setConfiguredSource: function(modo) {
      if (["auto", "firebase", "sheets"].indexOf(modo) === -1) return;
      state.configuredSource = modo;
      salvarPreferencia(modo);
      log("modo configurado: " + modo);
      dispararMudanca();
    },

    // Testa as duas fontes independentemente, sem alterar a fonte selecionada/ativa.
    testarConexoes: function() {
      return Promise.all([
        chamarRepositorio(window.FirebaseRepository, "testarConexao", []).catch(function(erro) {
          return { ok: false, mensagem: erro.message };
        }),
        chamarRepositorio(window.GoogleSheetsRepository, "testarConexao", []).catch(function(erro) {
          return { ok: false, mensagem: erro.message };
        })
      ]).then(function(resultados) {
        return { firebase: resultados[0], sheets: resultados[1] };
      });
    },

    // ---- Operações de leitura ----
    listarApartamentos: function() {
      return executarLeitura("listarApartamentos", []);
    },
    obterApartamentosGabarito: function() {
      return executarLeitura("obterApartamentosGabarito", []);
    },
    obterGabaritoVagasCompleto: function() {
      return executarLeitura("obterGabaritoVagasCompleto", []);
    },
    obterMoradorPorApto: function(apto, ocorrencia) {
      return executarLeitura("obterMoradorPorApto", [apto, ocorrencia]);
    },
    obterMoradorPorCpf: function(cpf, nascimento) {
      return executarLeitura("obterMoradorPorCpf", [cpf, nascimento]);
    },
    buscarTexto: function(termo) {
      return executarLeitura("buscarTexto", [termo]);
    },
    gerarRelatorioApartamentos: function() {
      return executarLeitura("gerarRelatorioApartamentos", []);
    },
    gerarRelatorioApartamentosPdfDrive: function() {
      return executarLeitura("gerarRelatorioApartamentosPdfDrive", []);
    },
    listarHistorico: function(limite) {
      return executarLeitura("listarHistorico", [limite]);
    },
    gerarListaVeiculosPdfDrive: function() {
      return executarLeitura("gerarListaVeiculosPdfDrive", []);
    },
    situacaoRelatorios: function() {
      return executarLeitura("situacaoRelatorios", []);
    },

    // ---- Operações de escrita (bloqueadas quando a fonte ativa é Google Sheets) ----
    excluirCadastro: function(apto, ocorrencia) {
      return executarEscrita("excluirCadastro", [apto, ocorrencia]);
    },
    salvarCadastro: function(dados) {
      return executarEscrita("salvarCadastro", [dados]);
    },
    salvarCadastroAdmin: function(dados) {
      return executarEscrita("salvarCadastroAdmin", [dados]);
    },
    excluirHistorico: function(id) {
      return executarEscrita("excluirHistorico", [id]);
    },
    definirSituacaoCadastro: function(apto, ocorrencia, situacao) {
      return executarEscrita("definirSituacaoCadastro", [apto, ocorrencia, situacao]);
    }
  };

  window.DataService = DataService;
  DataService.init();
})();
