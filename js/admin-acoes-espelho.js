// ==========================================
// BOTÕES "DESFAZER" / "SALVAR" REPETIDOS EM OUTRO PONTO DA PÁGINA
// ==========================================
// Um <div data-espelho="idDoOriginal"> vira uma cópia dos botões do container original: mesmo
// texto, mesmo estado (desabilitado/escondido) e, ao clicar, aciona o botão original — a lógica
// de salvar continua num lugar só. Usado em Membros (topo e fim) e no Gabarito de vagas.
(function() {
  function espelhar(destino) {
    var original = document.getElementById(destino.getAttribute("data-espelho"));
    if (!original) return;
    var botoes = Array.prototype.slice.call(original.querySelectorAll("button"));

    function sincronizar() {
      destino.innerHTML = "";
      botoes.forEach(function(b) {
        var copia = document.createElement("button");
        copia.type = "button";
        copia.className = b.className;
        copia.textContent = b.textContent;
        copia.disabled = b.disabled;
        copia.hidden = b.hidden;
        copia.addEventListener("click", function() { b.click(); });
        destino.appendChild(copia);
      });
    }

    sincronizar();
    var observador = new MutationObserver(sincronizar);
    botoes.forEach(function(b) {
      observador.observe(b, { attributes: true, attributeFilter: ["disabled", "hidden", "class"], childList: true, characterData: true, subtree: true });
    });
  }

  document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll("[data-espelho]").forEach(espelhar);
  });
})();
