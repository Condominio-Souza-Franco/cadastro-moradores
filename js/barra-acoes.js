// ==========================================
// BARRA FLUTUANTE COM "ATUALIZAR/ENVIAR CADASTRO" E "FECHAR VISUALIZAÇÃO"
// ==========================================
// Depois que o morador carrega o próprio cadastro (ou abre um novo cadastro), aparece uma barra logo acima de "Qual é o seu
// vínculo com a unidade?" com o botão de enviar do fim do formulário e um × para fechar.
// Não tem "Sair": ao lado do "Sair" da sessão (embaixo de "Visualizar cadastro") ficava ambíguo;
// o × já fecha o formulário sem alterar nada. Enquanto está
// à mostra, fica FIXA no topo da tela (com a largura do formulário), sem rolar com o conteúdo.
// Some quando os botões de baixo entram na tela — não faz sentido mostrar os dois.
// Os botões da barra só "clicam" nos botões originais: a lógica de envio é a mesma.
(function() {
  var barra, lugar, form, acoesDeBaixo;

  function cadastroCarregado() {
    var secao = document.getElementById("secTipoResidente");
    var enviar = document.getElementById("btnEnviarForm");
    if (!secao || secao.classList.contains("hidden") || !enviar) return false;
    // Novo cadastro: só depois que o apartamento é escolhido.
    if (/atualizar/i.test(enviar.textContent || "")) return true;
    var apto = document.getElementById("apto");
    return !!apto && !!apto.value;
  }

  function noCampoDeVisao(el) {
    var r = el.getBoundingClientRect();
    return r.height > 0 && r.top < window.innerHeight && r.bottom > 0;
  }

  function alturaBarra() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--altura-barra-acoes")) || 64;
  }

  function atualizar() {
    if (!barra) return;
    // Só aparece quando "Qual é o seu vínculo" chega ao topo da tela (antes disso, o topo da página
    // ainda está à mostra e a barra cobriria o aviso da sessão).
    var secao = document.getElementById("secTipoResidente");
    var chegou = secao.getBoundingClientRect().top <= (alturaBarra() + 24);
    var mostrar = cadastroCarregado() && chegou && !noCampoDeVisao(acoesDeBaixo);
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
    barra.querySelector(".barra-acao-fechar").textContent = (document.getElementById("btnSairSemAlterar").textContent || "Fechar visualização").trim();

    // Sempre fixa no topo da tela, alinhada ao formulário. Enquanto ela aparece, o topo da página
    // ganha um espaço do tamanho dela, para não cobrir o começo do conteúdo.
    barra.classList.add("fixa");
    var r = form.getBoundingClientRect();
    barra.style.left = r.left + "px";
    barra.style.width = r.width + "px";
    if (barra.offsetHeight) document.documentElement.style.setProperty("--altura-barra-acoes", barra.offsetHeight + "px");
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
      // Mesmo texto do botão de baixo: "Fechar visualização" (cadastro existente) ou "Sair" (cadastro novo).
      '<button type="button" class="btn-secondary barra-acao-fechar">Fechar visualização</button>';
    lugar.appendChild(barra);
    secao.parentNode.insertBefore(lugar, secao);

    barra.querySelector(".barra-acao-enviar").addEventListener("click", function() {
      document.getElementById("btnEnviarForm").click();
    });
    barra.querySelector(".barra-acao-fechar").addEventListener("click", function() {
      document.getElementById("btnSairSemAlterar").click();
    });

    window.atualizarBarraAcoes = atualizar;
    document.getElementById("apto") && document.getElementById("apto").addEventListener("change", atualizar);
    window.addEventListener("scroll", atualizar, { passive: true });
    window.addEventListener("resize", atualizar);
    // Aparece/some conforme o cadastro é carregado, enviado ou fechado (texto do botão e seções).
    var observador = new MutationObserver(atualizar);
    observador.observe(document.getElementById("btnEnviarForm"), { childList: true, characterData: true, subtree: true, attributes: true });
    observador.observe(secao, { attributes: true, attributeFilter: ["class"] });
    observador.observe(document.getElementById("btnSairSemAlterar"), { childList: true, characterData: true, subtree: true });
    atualizar();
  });
})();
