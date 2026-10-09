// ==========================================
// QUEM ENTROU NA ADMINISTRAÇÃO JÁ CHEGA "CONECTADO" NA PÁGINA INICIAL
// ==========================================
// Síndico, conselho e desenvolvedor também são moradores. Quando um deles faz login no admin e
// volta para a página inicial (na mesma aba), a sessão de 1 hora do morador (js/sessao-morador.js)
// começa sozinha com o cadastro dele: os campos da consulta já aparecem preenchidos e travados,
// com "Visualizar cadastro" e "Sair", sem digitar CPF e data de nascimento.
//
// Como o cadastro é encontrado, sem rota nova no backend: a página Membros (rota protegida, com o
// token do admin) diz qual cadastro ocupa o cargo de quem está logado; a consulta por apartamento
// (também protegida) devolve o CPF e a data de nascimento desse cadastro, que abrem a sessão.
// Condomínio e administradora não têm cadastro de morador: nada acontece.
// Se faltar permissão ou der erro, a página fica como sempre (consulta vazia), sem aviso.
//
// Depois de tentar uma vez (dando certo ou não) com um login, não tenta de novo nesta aba: assim
// o "Sair" da página inicial é respeitado e a pessoa não é reconectada a cada visita.
// Nunca registrar estes dados no console.
(function() {
  var CHAVE_ADMIN = "adminSimplesAuthUser";     // mesmas chaves do js/admin-auth.js
  var CHAVE_TOKEN = "adminSimplesAuthToken";
  var CHAVE_FEITO = "sessaoMoradorDoAdmin";     // e-mail do login para o qual já tentamos

  function lerAdmin() {
    try {
      var s = JSON.parse(sessionStorage.getItem(CHAVE_ADMIN) || "null");
      if (!s || !s.email || !s.expiraEm || Date.now() >= s.expiraEm) return null;
      if (!sessionStorage.getItem(CHAVE_TOKEN)) return null;
      return s;
    } catch (e) { return null; }
  }

  // "1985-03-15", "1985-03-15T03:00:00Z" ou "15/03/1985" -> "15/03/1985".
  function dataBr(valor) {
    var t = String(valor || "").trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) return t;
    var m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? m[3] + "/" + m[2] + "/" + m[1] : "";
  }

  // Cadastro do cargo de quem está logado, pelo papel que o backend informou.
  function cargoDoLogado(r) {
    var membros = (r && r.membros) || {};
    if (r.papel === "sindico") return membros.sindico;
    if (r.papel === "desenvolvedor") return membros.desenvolvedor;
    if (r.papel === "conselho") return (membros.conselho || [])[r.indice];
    return null;
  }

  // CPF e data de nascimento do cadastro de quem está logado; null se não houver cadastro.
  // Usado pela página inicial (abre a sessão) e pela administração (carrega o cadastro em segundo plano).
  function descobrirCadastro(admin) {
    return window.DataService.obterMembros()
      .then(function(r) {
        if (!r || !r.sucesso) return null;
        var cargo = cargoDoLogado(r);
        var id = cargo && cargo.cadastroId;
        var candidato = id && (r.candidatos || []).filter(function(c) { return c.id === id; })[0];
        if (!candidato || !candidato.apto) return null;
        return window.DataService.obterMoradorPorApto(candidato.apto, id);
      })
      .then(function(resposta) {
        var d = resposta && resposta.encontrado && resposta.dados;
        if (!d || d.situacao === "mudou-se") return null;
        var cpf = String(d.cpf || "").replace(/\D/g, "");
        var nasc = dataBr(d.nasc);
        if (cpf.length !== 11 || !nasc) return null;
        return { cpf: cpf, nasc: nasc };
      });
  }

  // O formulário não carrega o admin-auth.js; as rotas protegidas leem o token por aqui.
  function garantirAdminAuth(admin) {
    if (window.AdminAuth) return;
    window.AdminAuth = {
      getIdToken: function() { try { return sessionStorage.getItem(CHAVE_TOKEN) || ""; } catch (e) { return ""; } },
      getEmail: function() { return admin.email; }
    };
  }

  // Na administração (admin.html), logo depois do login o cadastro do próprio logado já é carregado em
  // segundo plano (js/cadastro-pre-carregado.js). Assim "Visualizar cadastro" abre na hora na página inicial.
  function preCarregarNaAdministracao() {
    var admin = lerAdmin();
    if (!admin || admin.papel === "condominio" || admin.papel === "administradora") return;
    if (!window.DataService || !window.CadastroPreCarregado) return;
    garantirAdminAuth(admin);
    descobrirCadastro(admin)
      .then(function(c) { if (c) window.CadastroPreCarregado.preCarregar(c.cpf, c.nasc); })
      .catch(function() {});
  }

  window.SessaoAdminMorador = { descobrirCadastro: descobrirCadastro, preCarregarNaAdministracao: preCarregarNaAdministracao };
  window.addEventListener("admin-auth-success", function() { preCarregarNaAdministracao(); });

  document.addEventListener("DOMContentLoaded", function() {
    if (window.modoAdminEdicao || !window.SessaoMorador || !window.DataService) return;
    if (!document.getElementById("cpfConsulta")) return;
    var admin = lerAdmin();
    if (!admin || admin.papel === "condominio" || admin.papel === "administradora") return;
    if (window.SessaoMorador.obter()) return;
    try { if (sessionStorage.getItem(CHAVE_FEITO) === admin.email) return; sessionStorage.setItem(CHAVE_FEITO, admin.email); } catch (e) { return; }

    garantirAdminAuth(admin);
    descobrirCadastro(admin)
      .then(function(c) {
        // A pessoa pode ter começado a digitar ou aberto um cadastro enquanto isso: não atropela.
        if (!c || window.SessaoMorador.obter()) return;
        if (document.getElementById("cpfConsulta").value) return;
        window.SessaoMorador.iniciar(c.cpf, c.nasc);
      })
      .catch(function() {});
  });
})();
