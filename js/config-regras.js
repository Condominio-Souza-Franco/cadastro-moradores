// CONFIGURAÇÕES GLOBAIS E REGRAS DE VALIDAÇÃO ESTRUTURADAS

// ==========================================
// CONFIGURAÇÃO DA API (GOOGLE APPS SCRIPT)
// ==========================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxqfR0tDzvIfqFn8syMiVufHqA48lmN4qMHpFM9TIozDfN5QOAc0hOyJZAig3E8zJ4B/exec";

// ==========================================
// REGRAS OBRIGATÓRIAS E ORDENAÇÃO
// ==========================================
const REGRAS_OBRIGATORIAS = [
  { id: "apto", nome: "Apartamento" },
  { id: "tipoResidente", nome: "Identificação do imóvel" },
  { id: "moradorNome", nome: "Nome" },
  { id: "moradorCpf", nome: "CPF" },
  { id: "moradorRg", nome: "RG" },
  { id: "moradorOrgaoEmissor", nome: "Órgão emissor" },
  { id: "moradorNasc", nome: "Data de nascimento" },
  { id: "moradorCelular", nome: "Celular" },
  { id: "moradorTel", nome: "Telefone fixo" },
  { id: "moradorEmail", nome: "E-mail" },
  { id: "vagaSituacao", nome: "Situação da vaga" },
  { id: "vagaAptoRelacionado", nome: "Apartamento envolvido (Vaga de garagem)" },
  { id: "inqPropAdmin", nome: "Proprietário / Administradora" },
  { id: "inqContato", nome: "Contato do proprietário / imobiliária" },
  { id: "inqVigencia", nome: "Vigência do contrato" },
  { id: "arquivoContrato", nome: "Contrato de locação" },
  { id: "declaracao", nome: "Declaro que as informações prestadas são verdadeiras", tipo: "checkbox" }
];

const ORDEM_DESEJADA = [
  "Apartamento",
  "Identificação do imóvel",
  "Nome",
  "CPF",
  "RG",
  "Órgão emissor",
  "Data de nascimento",
  "Celular",
  "Telefone fixo",
  "E-mail",
  "Situação da vaga",
  "Apartamento envolvido (Vaga de garagem)",
  "Proprietário / Administradora",
  "Contato do proprietário / imobiliária",
  "Vigência do contrato",
  "Contrato de locação",
  "Caso de emergência",
  "Demais ocupantes",
  "Carros",
  "Motos",
  "Bicletas",
  "Pets",
  "Prestador",
  "Declaro que as informações prestadas são verdadeiras"
];
