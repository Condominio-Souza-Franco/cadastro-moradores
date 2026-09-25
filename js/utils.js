// ==========================================
// UTILITÁRIOS COMPARTILHADOS (index.html e admin.html)
// ==========================================
(function() {
  function escaparHtml(valor) {
    return String(valor == null ? "" : valor)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Aceita somente links http/https. Qualquer outro esquema (javascript:, data:, etc.)
  // vira string vazia, para não virar link executável na tela.
  function urlSegura(valor) {
    var texto = String(valor || "").trim();
    if (!texto) return "";
    try {
      var url = new URL(texto);
      return (url.protocol === "https:" || url.protocol === "http:") ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  window.Utils = {
    escaparHtml: escaparHtml,
    urlSegura: urlSegura
  };
})();
