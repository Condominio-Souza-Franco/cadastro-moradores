// CONFIGURAÇÕES GLOBAIS E REGRAS DE VALIDAÇÃO ESTRUTURADAS

// ==========================================
// CONFIGURAÇÃO DA API (GOOGLE APPS SCRIPT)
// ==========================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzkzQHhDB_Lw6vbnvWbmz3c8no6Rw2xHg9TJPD4pMfH7Ikk1ESJCL4HNBilqw8lh9b6/exec";

// ==========================================
// CONFIGURAÇÃO DE ACESSO ADMIN (GOOGLE LOGIN)
// ==========================================
const ADMIN_AUTH_CONFIG = {
  // Preencha com o Client ID do Google Cloud (OAuth 2.0 Web)
  googleClientId: "924196917500-k43fsnafkct0t9e9g7agbpp6ujsul4gr.apps.googleusercontent.com",

  // Hashes SHA-256 dos e-mails autorizados (em minúsculas), para não expor os e-mails no
  // repositório público. Isto só controla o que a tela mostra: a proteção real dos dados é a
  // validação do token feita pelo backend (Apps Script), que mantém sua própria lista.
  //
  // Para autorizar um novo e-mail, gere o hash no console do navegador (F12):
  //   crypto.subtle.digest("SHA-256", new TextEncoder().encode("email@exemplo.com".toLowerCase()))
  //     .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("")))
  // e acrescente o resultado abaixo (e o e-mail na lista do backend).
  allowedEmailHashes: [
    "9f38162fe983fd627fc9241d37ab6733c8a2d8727dc6c0937aca02124b2c1703",
    "12d9be80aa36e474a232b3699cd391d56031ff158ea7efbea625de65e814e7fa",
    "4e7bf22f4f257f571a4fbcc3ea0fe50b1bbb612db540294a020529fefd758187",
    "18c9b7f74c8b81a58e377d23d6e6d2daa0ca632a0fc0000c3ae6b3f4f2a7b669",
    "ca830be3e329f597989c047b0efda6a3d1a18df1b702ba540d12b3e40e0ffac5"
  ]
};

// ==========================================
// REGRAS OBRIGATÓRIAS E ORDENAÇÃO
// ==========================================
const REGRAS_OBRIGATORIAS = [
  { id: "apto", nome: "Apartamento" },
  { id: "tipoResidente", nome: "Identificação do imóvel" },
  { id: "moradorNome", nome: "Nome" },
  { id: "moradorNasc", nome: "Data de nascimento" },
  { id: "moradorCpf", nome: "CPF" },
  // { id: "moradorRg", nome: "RG" },
  // { id: "moradorOrgaoEmissor", nome: "Órgão emissor" },
  { id: "moradorCelular", nome: "Celular" },
  // { id: "moradorTel", nome: "Telefone fixo" },
  // { id: "moradorEmail", nome: "E-mail" },
  { id: "vagaSituacao", nome: "Situação da vaga" },
  { id: "vagaAptoRelacionado", nome: "Apartamento envolvido (Vaga de garagem)" },
  // { id: "arquivoContrato", nome: "Contrato de locação" },
  { id: "declaracao", nome: "Declaro que as informações prestadas são verdadeiras", tipo: "checkbox" }
];

const ORDEM_DESEJADA = [
  "Apartamento",
  "Identificação do imóvel",
  "Nome",
  "Data de nascimento",
  "CPF",
  // "RG",
  // "Órgão emissor",
  "Celular",
  // "Telefone fixo",
  // "E-mail",
  "Situação da vaga",
  "Apartamento envolvido (Vaga de garagem)",
  "Proprietário / Administradora",
  "Contato do proprietário / imobiliária",
  "Vigência do contrato",
  // "Contrato de locação",
  "Caso de emergência",
  "Demais ocupantes",
  "Carros",
  "Motos",
  "Bicicletas",
  "Pets",
  "Prestador",
  "Declaro que as informações prestadas são verdadeiras"
];
