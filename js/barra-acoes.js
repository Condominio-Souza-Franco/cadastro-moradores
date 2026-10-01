// ==========================================
// BARRA FLUTUANTE COM "ATUALIZAR CADASTRO" E "SAIR"
// ==========================================
// Depois que o morador carrega o próprio cadastro, aparece uma barra logo acima de "Qual é o seu
// vínculo com a unidade?" com os mesmos botões do fim do formulário, lado a lado. Enquanto está
// à mostra, fica FIXA no topo da tela (com a largura do formulário), sem rolar com o conteúdo.
// Some quando os botões de baixo entram na tela — não faz sentido mostrar os dois.
// Os botões da barra só "clicam" nos botões originais: a lógica de envio é a mesma.
(function() {
  var barra, lugar, form, acoesDeBaixo;

  function cadastroCarregado() {
    var secao = document.getElementById("secTipoResidente");
    var enviar = document.getElementById("btnEnviarForm");
    return !!secao && !secao.classList.contains("hidden") && !!enviar &&
      /atualizar/i.test(enviar.textContent || "");
  }

  function noCampoDeVisao(el) {
    var r = el.getBoundingClientRect();
    return r.height > 0 && r.top < window.innerHeight && r.bottom > 0;
  }

  function atualizar() {
    if (!barra) return;
    var mostrar = cadastroCarregado() && !noCampoDeVisao(acoesDeBaixo);
    barra.hidden = !mostrar;
    lugar.hidden = !mostrar;
    // O espaço no topo fica enquanto o cadastro está aberto (não só enquanto a barra aparece),
    // para a página não "pular" quando a barra some perto dos botões de baixo.
    document.body.classList.toggle("com-barra-acoes", cadastroCarregado());
    if (!mostrar) return;

    var enviar = document.getElementById("btnEnviarForm");
    var botaoEnviar = barra.querySelector(".barra-acao-enviar");
    botaoEnviar.textContent = (enviar.textContent || "Atualizar cadastro").trim();
    botaoEnviar.disabled = enviar.disabled;

    // Sempre fixa no topo da tela, alinhada ao formulário. Enquanto ela aparece, o topo da página
    // ganha um espaço do tamanho dela, para não cobrir o começo do conteúdo.
    barra.classList.add("fixa");
    var r = form.getBoundingClientRect();
    barra.style.left = r.left + "px";
    barra.style.width = r.width + "px";
    document.documentElement.style.setProperty("--altura-barra-acoes", barra.offsetHeight + "px");
  }

  document.addEventListener("DOMContentLoaded", function() {
    var secao = document.getElementById("secTipoResidente");
    acoesDeBaixo = document.querySelector(".form-actions");
    form = document.getElementById("cadForm");
    if (!secao || !acoesDeBaixo || !form) return;

    lugar = document.createElement("div");
    lugar.className = "barra-acoes-lugar";
    lugar.hidden = true;
    barra = document.createElement("div");
    barra.className = "barra-acoes-flutuante";
    barra.hidden = true;
    barra.innerHTML =
      '<button type="button" class="btn-submit barra-acao-enviar">Atualizar cadastro</button>' +
      '<button type="button" class="btn-secondary barra-acao-sair">Sair</button>';
    lugar.appendChild(barra);
    secao.parentNode.insertBefore(lugar, secao);

    barra.querySelector(".barra-acao-enviar").addEventListener("click", function() {
      document.getElementById("btnEnviarForm").click();
    });
    barra.querySelector(".barra-acao-sair").addEventListener("click", function() {
      document.getElementById("btnSairSemAlterar").click();
    });

    window.addEventListener("scroll", atualizar, { passive: true });
    window.addEventListener("resize", atualizar);
    // Aparece/some conforme o cadastro é carregado, enviado ou fechado (texto do botão e seções).
    var observador = new MutationObserver(atualizar);
    observador.observe(document.getElementById("btnEnviarForm"), { childList: true, characterData: true, subtree: true, attributes: true });
    observador.observe(secao, { attributes: true, attributeFilter: ["class"] });
    atualizar();
  });
})();
