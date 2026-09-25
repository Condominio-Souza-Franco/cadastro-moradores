(function() {
  var AUTH_STORAGE_KEY = "adminSimplesAuthUser";
  var AUTH_TOKEN_STORAGE_KEY = "adminSimplesAuthToken";
  var RELOAD_MAX_TENTATIVAS = 20;
  var RELOAD_INTERVAL_MS = 400;
  var MENSAGEM_SESSAO_EXPIRADA = "Sua sessão expirou. Faça login novamente.";
  var timerInicializacaoLogin = null;
  var timerExpiracaoSessao = null;
  var googleInicializadoClientId = "";

  function textoLimpo(valor) {
    return String(valor || "").trim();
  }

  function normalizarEmail(email) {
    return textoLimpo(email).toLowerCase();
  }

  function parseJwtPayload(jwt) {
    try {
      var parts = String(jwt || "").split(".");
      if (parts.length < 2) return null;
      var base64Url = parts[1];
      var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      var padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      var json = decodeURIComponent(
        atob(padded)
          .split("")
          .map(function(c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      return JSON.parse(json);
    } catch (_) {
      return null;
    }
  }

  function obterConfig() {
    if (typeof ADMIN_AUTH_CONFIG !== "object" || !ADMIN_AUTH_CONFIG) {
      return { googleClientId: "", allowedEmailHashes: [] };
    }

    return {
      googleClientId: textoLimpo(ADMIN_AUTH_CONFIG.googleClientId),
      allowedEmailHashes: Array.isArray(ADMIN_AUTH_CONFIG.allowedEmailHashes)
        ? ADMIN_AUTH_CONFIG.allowedEmailHashes.map(normalizarEmail).filter(Boolean)
        : []
    };
  }

  function hashEmail(email) {
    if (!window.crypto || !crypto.subtle || typeof TextEncoder === "undefined") {
      return Promise.reject(new Error("Navegador sem suporte a criptografia (é preciso abrir a página via https)."));
    }
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalizarEmail(email)))
      .then(function(buffer) {
        return Array.prototype.map.call(new Uint8Array(buffer), function(byte) {
          return ("0" + byte.toString(16)).slice(-2);
        }).join("");
      });
  }

  // Controla apenas o que a tela mostra; a autorização real dos dados é feita pelo backend.
  function emailAutorizado(email, config) {
    if (!email || !config.allowedEmailHashes.length) return Promise.resolve(false);
    return hashEmail(email).then(function(hash) {
      return config.allowedEmailHashes.indexOf(hash) !== -1;
    });
  }

  function setMensagem(texto, tipo) {
    var el = document.getElementById("authMensagem");
    if (!el) return;
    var mensagem = textoLimpo(texto);
    el.className = "auth-mensagem" + (tipo ? " " + tipo : "");
    el.textContent = mensagem;
    el.hidden = !mensagem;
  }

  function salvarSessao(payload, idToken) {
    var seguro = {
      email: textoLimpo(payload.email),
      name: textoLimpo(payload.name),
      picture: textoLimpo(payload.picture),
      // "exp" do token do Google, em milissegundos (o token vale ~1 hora).
      expiraEm: (parseInt(payload.exp, 10) || 0) * 1000
    };
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(seguro));
    if (idToken) {
      sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, idToken);
    }
    return seguro;
  }

  function sessaoExpirada(sessao) {
    return !sessao || !sessao.expiraEm || Date.now() >= sessao.expiraEm;
  }

  function carregarSessao() {
    try {
      var bruto = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (!bruto) return null;
      var parsed = JSON.parse(bruto);
      if (!parsed || !parsed.email) return null;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function limparSessao() {
    if (timerExpiracaoSessao) {
      clearTimeout(timerExpiracaoSessao);
      timerExpiracaoSessao = null;
    }
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }

  function obterIdToken() {
    return sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "";
  }

  function atualizarCabecalhoUsuario(usuario) {
    var userLabel = document.getElementById("authUsuario");
    var sairBtn = document.getElementById("btnSairAdmin");
    if (!userLabel || !sairBtn) return;

    if (usuario && usuario.email) {
      userLabel.textContent = usuario.name ? (usuario.name + " - " + usuario.email) : usuario.email;
      sairBtn.hidden = false;
    } else {
      userLabel.textContent = "";
      sairBtn.hidden = true;
    }
  }

  // Encerra a sessão sozinho quando o token do Google expira, em vez de deixar o painel
  // aberto com todas as consultas falhando.
  function agendarExpiracao(usuario) {
    if (timerExpiracaoSessao) clearTimeout(timerExpiracaoSessao);
    var restante = usuario.expiraEm - Date.now();
    if (restante <= 0) return;
    timerExpiracaoSessao = setTimeout(function() {
      encerrarSessao(MENSAGEM_SESSAO_EXPIRADA, "erro");
    }, restante);
  }

  function liberarAreaAdmin(usuario) {
    var gate = document.getElementById("authGate");
    var area = document.getElementById("adminArea");
    if (gate) gate.hidden = true;
    if (area) area.hidden = false;

    atualizarCabecalhoUsuario(usuario);
    setMensagem("");
    agendarExpiracao(usuario);
    window.dispatchEvent(new CustomEvent("admin-auth-success", { detail: usuario || null }));
  }

  function bloquearAreaAdmin() {
    var gate = document.getElementById("authGate");
    var area = document.getElementById("adminArea");
    if (gate) gate.hidden = false;
    if (area) area.hidden = true;

    atualizarCabecalhoUsuario(null);
  }

  function montarBotaoGoogle() {
    var btnContainer = document.getElementById("googleLoginButton");
    if (!btnContainer || !window.google || !google.accounts || !google.accounts.id) return;

    btnContainer.innerHTML = "";
    google.accounts.id.renderButton(btnContainer, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "signin_with",
      width: 280,
      locale: "pt-BR"
    });

    var button = btnContainer.querySelector("button");
    if (button && !button.textContent.trim()) {
      button.textContent = "Fazer login...";
    }
  }

  function inicializarLoginGoogle(config) {
    if (!window.google || !google.accounts || !google.accounts.id) {
      return false;
    }

    if (!config.googleClientId) {
      setMensagem("Preencha ADMIN_AUTH_CONFIG.googleClientId em js/regras.js para ativar o login.", "erro");
      return true;
    }

    if (googleInicializadoClientId !== config.googleClientId) {
      google.accounts.id.initialize({
        client_id: config.googleClientId,
        callback: function(response) {
          var payload = parseJwtPayload(response && response.credential);
          if (!payload || !payload.email) {
            setMensagem("Não foi possível validar o login Google.", "erro");
            return;
          }

          emailAutorizado(payload.email, config)
            .then(function(autorizado) {
              if (!autorizado) {
                limparSessao();
                bloquearAreaAdmin();
                setMensagem("Este e-mail não está autorizado para a área restrita.", "erro");
                return;
              }

              var usuario = salvarSessao(payload, response && response.credential);
              liberarAreaAdmin(usuario);
            })
            .catch(function(erro) {
              setMensagem((erro && erro.message) || "Não foi possível validar o login Google.", "erro");
            });
        }
      });
      googleInicializadoClientId = config.googleClientId;
    }

    montarBotaoGoogle();
    return true;
  }

  function inicializarLoginGoogleComRetentativa(config) {
    var tentativa = 0;

    if (timerInicializacaoLogin) {
      clearTimeout(timerInicializacaoLogin);
      timerInicializacaoLogin = null;
    }

    function tentar() {
      tentativa += 1;
      var iniciou = inicializarLoginGoogle(config);
      if (iniciou) {
        return;
      }

      if (tentativa >= RELOAD_MAX_TENTATIVAS) {
        setMensagem("Falha ao carregar login Google. Recarregue a página.", "erro");
        return;
      }

      timerInicializacaoLogin = setTimeout(tentar, RELOAD_INTERVAL_MS);
    }

    tentar();
  }

  function encerrarSessao(mensagem, tipo) {
    // Evita repetir o logout quando várias chamadas falham ao mesmo tempo.
    var area = document.getElementById("adminArea");
    if (!carregarSessao() && area && area.hidden) return;

    limparSessao();
    if (window.google && google.accounts && google.accounts.id) {
      google.accounts.id.disableAutoSelect();
    }
    bloquearAreaAdmin();
    setMensagem(mensagem, tipo);
    inicializarLoginGoogleComRetentativa(obterConfig());
    window.dispatchEvent(new CustomEvent("admin-auth-logout"));
  }

  function configurarSair() {
    var btnSair = document.getElementById("btnSairAdmin");
    if (!btnSair) return;

    btnSair.addEventListener("click", function() {
      encerrarSessao("Sessão encerrada.", "ok");
    });
  }

  function init() {
    var config = obterConfig();

    configurarSair();

    // Disparado pelo js/data/backend.js quando o backend recusa o token (expirado ou inválido).
    window.addEventListener("admin-auth-expired", function() {
      encerrarSessao(MENSAGEM_SESSAO_EXPIRADA, "erro");
    });

    bloquearAreaAdmin();

    var sessao = carregarSessao();
    if (sessao && !sessaoExpirada(sessao)) {
      emailAutorizado(sessao.email, config)
        .then(function(autorizado) {
          if (autorizado) {
            liberarAreaAdmin(sessao);
          } else {
            limparSessao();
          }
        })
        .catch(function() {
          limparSessao();
        });
    } else {
      limparSessao();
    }

    inicializarLoginGoogleComRetentativa(config);
  }

  window.AdminAuth = {
    getIdToken: obterIdToken
  };

  document.addEventListener("DOMContentLoaded", init);
})();
