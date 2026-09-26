// ==========================================
// MAPA DA GARAGEM COM A VAGA DO MORADOR
// ==========================================
// Lê apto, andar e vaga da URL (vêm do gabarito, pelo link "Clique aqui" do formulário),
// carrega o SVG do andar e pinta a(s) vaga(s). Os SVGs ficam em mapas/ e cada vaga é um
// <g id="vaga-G1-14">. "10, 25 e 26" pinta três vagas; "1 / 2" é a vaga dupla "1/2" do G2.
(function() {
  var ANDARES = ["G1", "G2"];

  function parametros() {
    var p = new URLSearchParams(window.location.search);
    return {
      apto: (p.get("apto") || "").trim(),
      andar: (p.get("andar") || "").trim().toUpperCase(),
      vaga: (p.get("vaga") || "").trim()
    };
  }

  function separarVagas(vaga) {
    if (!vaga || vaga === "?") return [];
    if (vaga.indexOf("/") !== -1) return [vaga.replace(/\s+/g, "")];
    return vaga.split(/,|\se\s/).map(function(s) { return s.trim(); }).filter(Boolean);
  }

  function idDaVaga(andar, n) {
    return "vaga-" + andar + "-" + n.replace("/", "-");
  }

  function textoDasVagas(vagas) {
    if (vagas.length === 1) return "vaga <strong>" + vagas[0] + "</strong>";
    return "vagas <strong>" + vagas.slice(0, -1).join(", ") + "</strong> e <strong>" + vagas[vagas.length - 1] + "</strong>";
  }

  function carregarAndar(andar) {
    return fetch("mapas/mapa-garagem-" + andar + ".svg", { cache: "no-cache" })
      .then(function(r) {
        if (!r.ok) throw new Error("Não foi possível carregar o mapa do " + andar + ".");
        return r.text();
      });
  }

  function montar() {
    var p = parametros();
    var escapar = function(s) { return String(s).replace(/[&<>"']/g, function(c) { return "&#" + c.charCodeAt(0) + ";"; }); };
    var andarValido = ANDARES.indexOf(p.andar) !== -1;
    var vagas = andarValido ? separarVagas(p.vaga) : [];
    var andares = andarValido && vagas.length ? [p.andar] : ANDARES;
    var texto = document.getElementById("textoVaga");
    var container = document.getElementById("mapas");

    if (andarValido && vagas.length) {
      texto.innerHTML = (p.apto ? "Apto <strong>" + escapar(p.apto) + "</strong> — " : "") +
        (vagas.length > 1 ? "suas " : "sua ") + textoDasVagas(vagas.map(escapar)) + (vagas.length > 1 ? " ficam" : " fica") + " no <strong>" + escapar(p.andar) + "</strong>, " + (vagas.length > 1 ? "pintadas" : "pintada") + " no mapa.";
      document.title = "Vaga " + vagas.join(", ") + " no " + p.andar + (p.apto ? " - Apto " + p.apto : "");
    } else {
      texto.textContent = "Demarcação das vagas nos dois andares da garagem.";
    }

    Promise.all(andares.map(carregarAndar))
      .then(function(svgs) {
        container.innerHTML = svgs.map(function(svg, i) {
          return '<section class="folha"><h2 class="nao-imprimir">Garagem ' + andares[i] + "</h2>" + svg + "</section>";
        }).join("");
        var naoEncontradas = vagas.filter(function(n) {
          var g = document.getElementById(idDaVaga(p.andar, n));
          if (g) g.classList.add("destaque");
          return !g;
        });
        if (naoEncontradas.length) {
          texto.innerHTML += ' <span class="erro">(vaga ' + naoEncontradas.map(escapar).join(", ") + " não encontrada no mapa)</span>";
        }
      })
      .catch(function(erro) {
        container.innerHTML = '<p class="erro">' + escapar(erro.message) + "</p>";
      });
  }

  document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("btnImprimir").addEventListener("click", function() { window.print(); });
    montar();
  });
})();
