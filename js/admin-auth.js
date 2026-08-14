(function() {
  var AUTH_STORAGE_KEY = "adminSimplesAuthUser";
  var RELOAD_MAX_TENTATIVAS = 20;
  var RELOAD_INTERVAL_MS = 400;
  var timerInicializacaoLogin = null;
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
      return { googleClientId: "", allowedEmails: [] };
    }

    return {
      googleClientId: textoLimpo(ADMIN_AUTH_CONFIG.googleClientId),
      allowedEmails: Array.isArray(ADMIN_AUTH_CONFIG.allowedEmails)
        ? ADMIN_AUTH_CONFIG.allowedEmails.map(normalizarEmail).filter(Boolean)
        : []
    };
  }

  function setMensagem(texto, tipo) {
    var el = document.getElementById("authMensagem");
    if (!el) return;
    var mensagem = textoLimpo(texto);
    el.className = "auth-mensagem" + (tipo ? " " + tipo : "");
    el.textContent = mensagem;
    el.hidden = !mensagem;
  }

  function salvarSessao(payload) {
    var seguro = {
      email: textoLimpo(payload.email),
      name: textoLimpo(payload.name),
      picture: textoLimpo(payload.picture)
    };
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(seguro));
    return seguro;
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
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
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

  function liberarAreaAdmin(usuario) {
    var gate = document.getElementById("authGate");
    var area = document.getElementById("adminArea");
    if (gate) gate.hidden = true;
    if (area) area.hidden = false;

    atualizarCabecalhoUsuario(usuario);
    setMensagem("");
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

          var email = normalizarEmail(payload.email);
          var autorizado = config.allowedEmails.length > 0 && config.allowedEmails.indexOf(email) !== -1;

          if (!autorizado) {
            limparSessao();
            bloquearAreaAdmin();
            setMensagem("Este e-mail não está autorizado para a área restrita.", "erro");
            return;
          }

          var usuario = salvarSessao(payload);
          liberarAreaAdmin(usuario);
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

  function configurarSair() {
    var btnSair = document.getElementById("btnSairAdmin");
    if (!btnSair) return;

    btnSair.addEventListener("click", function() {
      var config = obterConfig();

      limparSessao();
      if (window.google && google.accounts && google.accounts.id) {
        google.accounts.id.disableAutoSelect();
      }
      bloquearAreaAdmin();
      setMensagem("Sessão encerrada.", "ok");
      inicializarLoginGoogleComRetentativa(config);
      window.dispatchEvent(new CustomEvent("admin-auth-logout"));
    });
  }

  function init() {
    var config = obterConfig();

    configurarSair();

    var sessao = carregarSessao();
    if (sessao && config.allowedEmails.indexOf(normalizarEmail(sessao.email)) !== -1) {
      liberarAreaAdmin(sessao);
    } else {
      limparSessao();
      bloquearAreaAdmin();
    }

    inicializarLoginGoogleComRetentativa(config);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
