// ==========================================
// DESFAZER (ADMIN): box de 5 segundos depois de uma alteração
// ==========================================
// Mostra um box "DESFAZER" no canto da tela por 5 segundos. Uma linha percorre o box de ponta a ponta
// (CSS, em css/admin.css) para mostrar quanto tempo ainda resta. Passado o prazo o box some sozinho e
// a alteração fica valendo.
//
// O backend (Apps Script, projeto privado) não tem rota de "desfazer", por isso há dois modos:
//   - Desfazer.adiar({ texto, aplicar, aoCancelar }): para o que NÃO tem volta (aprovar, rejeitar,
//     excluir, desbloquear, desativar código). A gravação (e o e-mail ao morador) só acontece quando
//     os 5 segundos acabam; DESFAZER cancela antes de qualquer coisa sair do navegador.
//   - Desfazer.mostrar({ texto, reverter }): para o que já foi gravado e tem como voltar reaplicando o
//     estado anterior (salvar membros, salvar notificações, "mudou-se", ignorar pendência). DESFAZER
//     chama reverter(), que regrava o estado que o módulo guardou em memória antes da alteração.
//
// Só um box por vez. Se vem outra alteração, a anterior vira definitiva na hora (no modo adiar, ela é
// gravada naquele instante). Se o admin fechar ou recarregar a página durante a espera de uma ação
// adiada, o navegador avisa, porque ela ainda não foi gravada.
// Os textos do box não levam dados pessoais e nada daqui vai para o console.
(function() {
  var DURACAO_MS = 5000;
  var caixa = null;      // elemento do box
  var atual = null;      // { adiar, aplicar, aoCancelar, timer }

  function criarCaixa() {
    if (caixa) return caixa;
    caixa = document.createElement("div");
    caixa.className = "desfazer-box";
    caixa.setAttribute("role", "status");
    caixa.setAttribute("aria-live", "polite");
    caixa.hidden = true;
    caixa.innerHTML =
      '<div class="desfazer-linha"><span class="desfazer-texto"></span>' +
      '<button type="button" class="desfazer-botao">DESFAZER</button></div>' +
      '<div class="desfazer-trilha" aria-hidden="true"><div class="desfazer-barra"></div></div>';
    document.body.appendChild(caixa);
    caixa.querySelector(".desfazer-botao").addEventListener("click", desfazer);
    return caixa;
  }

  function esconder() {
    if (caixa) caixa.hidden = true;
  }

  // Reinicia a animação da linha: remove a classe, força o cálculo de layout e põe de novo.
  function iniciarBarra() {
    var barra = caixa.querySelector(".desfazer-barra");
    barra.style.animationDuration = DURACAO_MS + "ms";
    caixa.classList.remove("desfazer-correndo");
    void caixa.offsetWidth;
    caixa.classList.add("desfazer-correndo");
  }

  function avisoCurto(texto) {
    criarCaixa();
    caixa.querySelector(".desfazer-texto").textContent = texto;
    caixa.classList.add("desfazer-aviso");
    caixa.classList.remove("desfazer-correndo");
    caixa.hidden = false;
    setTimeout(function() {
      if (!atual) { esconder(); caixa.classList.remove("desfazer-aviso"); }
    }, 2500);
  }

  // O prazo acabou (ou veio outra alteração): a atual vira definitiva.
  function confirmar() {
    var item = atual;
    if (!item) return;
    atual = null;
    clearTimeout(item.timer);
    esconder();
    if (item.adiar && typeof item.aplicar === "function") item.aplicar();
  }

  function desfazer() {
    var item = atual;
    if (!item) return;
    atual = null;
    clearTimeout(item.timer);
    caixa.querySelector(".desfazer-botao").disabled = true;
    if (item.adiar) {
      esconder();
      if (typeof item.aoCancelar === "function") item.aoCancelar();
      avisoCurto("Cancelado. Nada foi alterado.");
      return;
    }
    avisoCurto("Desfazendo");
    Promise.resolve().then(function() { return item.reverter(); })
      .then(function() { avisoCurto("Alteração desfeita."); })
      .catch(function() { avisoCurto("Não foi possível desfazer. Confira os dados na tela."); });
  }

  function abrir(opcoes, adiar) {
    criarCaixa();
    if (atual) confirmar();
    atual = {
      adiar: adiar,
      aplicar: opcoes.aplicar,
      aoCancelar: opcoes.aoCancelar,
      reverter: opcoes.reverter
    };
    caixa.classList.remove("desfazer-aviso");
    caixa.querySelector(".desfazer-texto").textContent = opcoes.texto || "Alteração feita.";
    caixa.querySelector(".desfazer-botao").disabled = false;
    caixa.hidden = false;
    iniciarBarra();
    atual.timer = setTimeout(confirmar, DURACAO_MS);
  }

  window.addEventListener("beforeunload", function(e) {
    if (atual && atual.adiar) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  window.Desfazer = {
    DURACAO_MS: DURACAO_MS,
    mostrar: function(opcoes) { abrir(opcoes || {}, false); },
    adiar: function(opcoes) { abrir(opcoes || {}, true); },
    pendente: function() { return !!atual; }
  };
})();
