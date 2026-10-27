// ==========================================
// ACESSO RESTRITO À ADMINISTRAÇÃO (páginas avulsas de "Links úteis")
// ==========================================
// Usado por formulario-impresso.html e controle-cadernos.html. A página nasce com o conteúdo escondido
// (CSS: html:not(.acesso-liberado)) e só o mostra depois que o backend confirma o acesso: o token do
// Google que o login da administração guardou nesta aba (o mesmo de js/admin-auth.js) é conferido por
// fbMeuAcesso, que diz se o e-mail é de um membro autorizado. Aberta em popup pelo admin, a página usa a
// mesma aba e portanto a mesma sessão; aberta direto, sem login, só mostra o aviso.
// Limite do GitHub Pages: o arquivo HTML em si continua público (não existe servidor para trancá-lo);
// isto controla o que a página mostra e imprime. Nada de dados de moradores fica nestas páginas.
// Nunca registrar o token no console.
(function() {
  var CHAVE_USUARIO = "adminSimplesAuthUser";
  var CHAVE_TOKEN = "adminSimplesAuthToken";
  var raiz = document.documentElement;

  function lerSessao() {
    try {
      var s = JSON.parse(sessionStorage.getItem(CHAVE_USUARIO) || "null");
      var token = sessionStorage.getItem(CHAVE_TOKEN) || "";
      if (!s || !s.email || !token) return null;
      return { sessao: s, token: token };
    } catch (e) {
      return null;
    }
  }

  function aviso() { return document.getElementById("avisoAcessoAdmin"); }

  function negar(texto) {
    var el = aviso();
    if (!el) return;
    el.textContent = texto + " ";
    var link = document.createElement("a");
    link.href = "admin.html";
    link.target = "_top";
    link.textContent = "Ir para a área da administração";
    el.appendChild(link);
  }

  function liberar() {
    raiz.classList.add("acesso-liberado");
  }

  document.addEventListener("DOMContentLoaded", function() {
    var dados = lerSessao();
    if (!dados) { negar("Esta página é só para a administração. Entre na área da administração e abra o link de novo em Links úteis."); return; }
    if (dados.sessao.expiraEm && Date.now() >= dados.sessao.expiraEm) { negar("Sua sessão da administração expirou. Entre de novo."); return; }
    if (!window.Backend || typeof window.Backend.chamar !== "function") { negar("Não foi possível verificar o acesso."); return; }
    window.Backend.chamar("fbMeuAcesso", { idToken: dados.token }, false, "servidor")
      .then(function(r) {
        if (r && r.sucesso) liberar();
        else negar((r && r.mensagem) || "Este e-mail não está autorizado para a área restrita.");
      })
      .catch(function() { negar("Não foi possível verificar o acesso. Tente de novo em instantes."); });
  });
})();
