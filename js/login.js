const formLogin = document.getElementById("formLogin");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");
const lembrarInput = document.getElementById("lembrar");
const USUARIO_ADMIN = {
  nome: "Administrador",
  email: "admin@raizes.com",
  senha: "admin123",
  tipo: "admin",
};

function criarAdministrador() {
  const admin = JSON.parse(localStorage.getItem("admin"));
  if (!admin) {
    localStorage.setItem("admin", JSON.stringify(USUARIO_ADMIN));
  }
}

function carregarUsuarios() {
  return JSON.parse(localStorage.getItem("usuarios")) || [];
}

function buscarUsuario(email, senha) {
  const usuarios = carregarUsuarios();
  return usuarios.find(
    (usuario) =>
      usuario.email.toLowerCase() === email.toLowerCase() &&
      usuario.senha === senha,
  );
}

function verificarAdministrador(email, senha) {
  const admin = JSON.parse(localStorage.getItem("admin"));
  if (!admin) {
    return false;
  }

  return (
    admin.email.toLowerCase() === email.toLowerCase() && admin.senha === senha
  );
}

function salvarSessao(usuario) {
  localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
  if (lembrarInput && lembrarInput.checked) {
    localStorage.setItem("lembrarEmail", usuario.email);
  } else {
    localStorage.removeItem("lembrarEmail");
  }
}

function preencherEmail() {
  const emailSalvo = localStorage.getItem("lembrarEmail");
  if (!emailSalvo || !emailInput) {
    return;
  }

  emailInput.value = emailSalvo;
  if (lembrarInput) {
    lembrarInput.checked = true;
  }
}

if (formLogin) {
  formLogin.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const email = emailInput.value.trim();
    const senha = senhaInput.value.trim();
    if (!email || !senha) {
      alert("Preencha o e-mail e a senha.");
      return;
    }

    if (verificarAdministrador(email, senha)) {
      salvarSessao({
        nome: "Administrador",
        email: "admin@raizes.com",
        tipo: "admin",
      });

      window.location.href = "admin.html";
      return;
    }

    const usuario = buscarUsuario(email, senha);
    if (!usuario) {
      alert("E-mail ou senha inválidos.");
      return;
    }

    salvarSessao(usuario);
    window.location.href = "index.html";
  });
}

criarAdministrador();
preencherEmail();
