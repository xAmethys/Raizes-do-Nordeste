const formCadastro = document.getElementById("formCadastro");
const nomeInput = document.getElementById("nome");
const cpfInput = document.getElementById("cpf");
const nascimentoInput = document.getElementById("nascimento");
const telefoneInput = document.getElementById("telefone");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");
const confirmarSenhaInput = document.getElementById("confirmarSenha");
const aceiteLgpd = document.getElementById("aceiteLgpd");

function carregarUsuarios() {
  return JSON.parse(localStorage.getItem("usuarios")) || [];
}

function salvarUsuarios(usuarios) {
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

function aplicarMascaraCPF(valor) {
  return valor
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function aplicarMascaraTelefone(valor) {
  return valor
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function emailExiste(email) {
  const usuarios = carregarUsuarios();
  return usuarios.some(
    (usuario) => usuario.email.toLowerCase() === email.toLowerCase(),
  );
}

function validarSenha() {
  return senhaInput.value === confirmarSenhaInput.value;
}

cpfInput.addEventListener("input", () => {
  cpfInput.value = aplicarMascaraCPF(cpfInput.value);
});

telefoneInput.addEventListener("input", () => {
  telefoneInput.value = aplicarMascaraTelefone(telefoneInput.value);
});

formCadastro.addEventListener("submit", (evento) => {
  evento.preventDefault();
  if (!aceiteLgpd.checked) {
    alert("É necessário aceitar o uso dos dados conforme a LGPD.");
    return;
  }

  if (!validarSenha()) {
    alert("Ops, de uma olhadinha nas senhas pois elas não estão iguais.");
    return;
  }

  if (emailExiste(emailInput.value)) {
    alert("Hey, esse e-mail já está cadastrado.");
    return;
  }

  const novoUsuario = {
    id: Date.now(),
    nome: nomeInput.value.trim(),
    cpf: cpfInput.value,
    nascimento: nascimentoInput.value,
    telefone: telefoneInput.value,
    email: emailInput.value.trim(),
    senha: senhaInput.value,
    pontos: 0,
    aceiteLGPD: {
      autorizado: true,
      data: new Date().toLocaleString("pt-BR"),
    },
    pedidos: [],
  };

  const usuarios = carregarUsuarios();
  usuarios.push(novoUsuario);
  salvarUsuarios(usuarios);
  alert("Cadastro realizado com sucesso!");
  window.location.href = "login.html";
});
