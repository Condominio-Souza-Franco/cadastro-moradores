// CONFIGURAÇÕES GLOBAIS E REGRAS DE VALIDAÇÃO ESTRUTURADAS

// ==========================================
// CONFIGURAÇÃO DA API (GOOGLE APPS SCRIPT)
// ==========================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwzXgpqW5TBMLrsZ6ajRQdPapO-5VIdJ8ixUTbbXb_k4BxR2Md0T22Ir2NHxlDZpS0X/exec";

// ==========================================
// CONFIGURAÇÃO DE ACESSO ADMIN (GOOGLE LOGIN)
// ==========================================
const ADMIN_AUTH_CONFIG = {
  // Preencha com o Client ID do Google Cloud (OAuth 2.0 Web)
  googleClientId: "924196917500-k43fsnafkct0t9e9g7agbpp6ujsul4gr.apps.googleusercontent.com",

  // Lista de e-mails autorizados (pode incluir Gmail, Yahoo e outros que usem Conta Google)
  // Exemplo: ["sindico@gmail.com", "conselheiro@yahoo.com"]
  allowedEmails: [
    "rtms1977@gmail.com",
    "condominiosouzafranco@gmail.com",
    "soniapicone@yahoo.com.br",
    "cloviomar@yahoo.com.br",
    "rafaelbraz7@gmail.com"
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
