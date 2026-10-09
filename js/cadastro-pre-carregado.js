// ==========================================
// CADASTRO CARREGADO EM SEGUNDO PLANO DEPOIS DO LOGIN (KIT OU ADMIN)
// ==========================================
// Quem entra pelo Kit de Boas-vindas ou pela administração e tem cadastro de morador já fica com a
// sessão de 1 hora (js/sessao-morador.js). Enquanto a pessoa lê o kit ou mexe no painel, este arquivo
// busca o cadastro dela em segundo plano e guarda na aba. Assim, ao voltar à página inicial e tocar em
// "Visualizar cadastro", o formulário abre na hora, sem esperar a resposta do servidor.
//
// Regras:
//   - Só guarda o cadastro se o servidor responder de vez. Se ele pedir o código por e-mail, não faz
//     nada: o código só é pedido quando a pessoa toca em "Visualizar cadastro".
//   - O cadastro guardado vale 10 minutos e é usado uma vez só: a consulta seguinte vai ao servidor de
//     novo, para não mostrar um cadastro que o síndico tenha mudado depois.
//   - Fica em sessionStorage (só nesta aba), como os dados da sessão de 1 hora. Sai junto com ela
//     (encerrar() em js/sessao-morador.js) e quando o login da administração termina.
// Nunca registrar estes dados no console.
(function() {
  var CHAVE = "cadastroPreCarregado";
  var VALIDADE_MS = 10 * 60 * 1000;

  function ler() {
    try { return JSON.parse(sessionStorage.getItem(CHAVE) || "null"); } catch (e) { return null; }
  }

  function gravar(valor) {
    try { sessionStorage.setItem(CHAVE, JSON.stringify(valor)); } catch (e) {}
  }

  function apagar() {
    try { sessionStorage.removeItem(CHAVE); } catch (e) {}
  }

  // Busca o cadastro e guarda na aba. Devolve uma promessa com true se guardou.
  function preCarregar(cpf, nasc) {
    cpf = String(cpf || "").replace(/\D/g, "");
    if (cpf.length !== 11 || !nasc || !window.DataService) return Promise.resolve(false);
    var atual = ler();
    if (atual && atual.cpf === cpf && atual.nasc === nasc && Date.now() - atual.em < VALIDADE_MS) {
      return Promise.resolve(true);
    }
    return window.DataService.obterMoradorPorCpf(cpf, nasc)
      .then(function(r) {
        if (!r || !r.encontrado || r.precisaCodigo) { apagar(); return false; }
        gravar({ cpf: cpf, nasc: nasc, em: Date.now(), resposta: r });
        return true;
      })
      .catch(function() { return false; });
  }

  // Usado por "Visualizar cadastro" (página inicial). Devolve a resposta guardada se for do mesmo CPF e
  // data e ainda estiver recente; caso contrário devolve null e a consulta segue pelo servidor.
  // Apaga o que estiver guardado: vale uma vez só.
  function usar(cpf, nasc) {
    var guardado = ler();
    apagar();
    cpf = String(cpf || "").replace(/\D/g, "");
    if (!guardado || guardado.cpf !== cpf || guardado.nasc !== nasc) return null;
    if (Date.now() - guardado.em >= VALIDADE_MS) return null;
    return guardado.resposta;
  }

  window.addEventListener("admin-auth-logout", apagar);
  window.CadastroPreCarregado = { preCarregar: preCarregar, usar: usar, apagar: apagar };
})();
