const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
const perfilNome = document.getElementById("perfilNome");
const perfilEmail = document.getElementById("perfilEmail");
const nivelFidelidade = document.getElementById("nivelFidelidade");
const totalPontos = document.getElementById("totalPontos");
const barraPontos = document.getElementById("barraPontos");
const textoNivel = document.getElementById("textoNivel");
const nomeNivelCompleto = document.getElementById("nomeNivelCompleto");
const beneficioNivel = document.getElementById("beneficioNivel");
const listaRecompensasPerfil = document.getElementById(
  "listaRecompensasPerfil",
);

const nomeInput = document.getElementById("nome");
const cpfInput = document.getElementById("cpf");
const nascimentoInput = document.getElementById("nascimento");
const telefoneInput = document.getElementById("telefone");
const emailInput = document.getElementById("email");
const editarPerfil = document.getElementById("editarPerfil");
const salvarPerfil = document.getElementById("salvarPerfil");
const formPerfil = document.getElementById("formPerfil");
const historicoPedidos = document.getElementById("historicoPedidos");
const receberPromocoes = document.getElementById("receberPromocoes");
const receberNotificacoes = document.getElementById("receberNotificacoes");
const dataLGPD = document.getElementById("dataLGPD");
const logoutBtn = document.getElementById("logoutBtn");
const exportarDados = document.getElementById("exportarDados");

let usuarioAtual;

const NIVEIS_FIDELIDADE = {
  raiz: {
    nome: "🌱 Cliente Raiz",
    minimo: 0,
    maximo: 499,
    beneficio: "Recompensas básicas",
    proximo: 500,
  },
  cacto: {
    nome: "🌵 Cliente Cacto",
    minimo: 500,
    maximo: 999,
    beneficio: "Recompensas melhores",
    proximo: 1000,
  },
  sertao: {
    nome: "🔥 Cliente Sertão",
    minimo: 1000,
    maximo: 1999,
    beneficio: "Benefícios exclusivos",
    proximo: 2000,
  },
  mestre: {
    nome: "👑 Cliente Mestre do Nordeste",
    minimo: 2000,
    maximo: Infinity,
    beneficio: "Recompensas especiais",
    proximo: null,
  },
};

const RECOMPENSAS = [
  {
    id: "desconto05",
    nome: "🪙 R$ 5 de desconto",
    descricao: "Economize R$5,00 no seu pedido.",
    pontos: 100,
    desconto: 5,
    nivelMinimo: "raiz",
  },

  {
    id: "desconto10",
    nome: "💵 R$ 10 de desconto",
    descricao: "Economize R$10,00 no seu pedido.",
    pontos: 250,
    desconto: 10,
    nivelMinimo: "raiz",
  },

  {
    id: "desconto20",
    nome: "💰 R$ 20 de desconto",
    descricao: "Economize R$20,00 no seu pedido.",
    pontos: 500,
    desconto: 20,
    nivelMinimo: "cacto",
  },

  {
    id: "desconto30",
    nome: "🔥 R$ 30 de desconto",
    descricao: "Economize R$30,00 no seu pedido.",
    pontos: 1000,
    desconto: 30,
    nivelMinimo: "sertao",
  },

  {
    id: "desconto50",
    nome: "👑 R$ 50 de desconto",
    descricao: "Economize R$50,00 no seu pedido",
    pontos: 2000,
    desconto: 50,
    nivelMinimo: "mestre",
  },
];

function carregarUsuario() {
  if (!usuarioLogado) {
    window.location.href = "login.html";
    return;
  }

  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
  usuarioAtual = usuarios.find(
    (usuario) =>
      usuario.email &&
      usuario.email.toLowerCase() === usuarioLogado.email.toLowerCase(),
  );

  if (!usuarioAtual) {
    window.location.href = "login.html";
    return;
  }

  if (!Array.isArray(usuarioAtual.pedidos)) {
    usuarioAtual.pedidos = [];
  }

  if (typeof usuarioAtual.pontos !== "number") {
    usuarioAtual.pontos = 0;
  }

  if (!Array.isArray(usuarioAtual.recompensasUsadas)) {
    usuarioAtual.recompensasUsadas = [];
  }

  preencherDados();
}

function atualizarUsuario(emailAntigo = usuarioAtual.email) {
  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
  const indice = usuarios.findIndex((usuario) => {
    if (usuarioAtual.id && usuario.id) {
      return usuario.id === usuarioAtual.id;
    }

    return (
      usuario.email &&
      emailAntigo &&
      usuario.email.toLowerCase() === emailAntigo.toLowerCase()
    );
  });

  if (indice !== -1) {
    usuarios[indice] = usuarioAtual;
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    localStorage.setItem("usuarioLogado", JSON.stringify(usuarioAtual));
  }
}

function preencherDados() {
  perfilNome.textContent = usuarioAtual.nome || "Usuário";
  perfilEmail.textContent = usuarioAtual.email || "";
  nomeInput.value = usuarioAtual.nome || "";
  cpfInput.value = usuarioAtual.cpf || "";
  nascimentoInput.value = usuarioAtual.nascimento || "";
  telefoneInput.value = usuarioAtual.telefone || "";
  emailInput.value = usuarioAtual.email || "";

  atualizarFidelidade();
  carregarLGPD();
  carregarPedidos();
}

editarPerfil.addEventListener("click", () => {
  const campos = formPerfil.querySelectorAll("input");
  campos.forEach((campo) => {
    campo.disabled = false;
  });

  salvarPerfil.style.display = "block";
});

formPerfil.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const emailAntigo = usuarioAtual.email;

  usuarioAtual.nome = nomeInput.value.trim();
  usuarioAtual.cpf = cpfInput.value.trim();
  usuarioAtual.nascimento = nascimentoInput.value;
  usuarioAtual.telefone = telefoneInput.value.trim();
  usuarioAtual.email = emailInput.value.trim();

  atualizarUsuario(emailAntigo);
  alert("Dados atualizados com sucesso!");

  const campos = formPerfil.querySelectorAll("input");
  campos.forEach((campo) => {
    campo.disabled = true;
  });
  salvarPerfil.style.display = "none";
  preencherDados();
});

function obterNivelFidelidade(pontos) {
  if (pontos >= 2000) {
    return NIVEIS_FIDELIDADE.mestre;
  }

  if (pontos >= 1000) {
    return NIVEIS_FIDELIDADE.sertao;
  }

  if (pontos >= 500) {
    return NIVEIS_FIDELIDADE.cacto;
  }

  return NIVEIS_FIDELIDADE.raiz;
}

function obterChaveNivel(pontos) {
  if (pontos >= 2000) {
    return "mestre";
  }

  if (pontos >= 1000) {
    return "sertao";
  }

  if (pontos >= 500) {
    return "cacto";
  }

  return "raiz";
}

function atualizarFidelidade() {
  const pontos = Number(usuarioAtual.pontos || 0);
  const nivel = obterNivelFidelidade(pontos);
  totalPontos.textContent = pontos;
  nivelFidelidade.textContent = nivel.nome;
  if (nomeNivelCompleto) {
    nomeNivelCompleto.textContent = nivel.nome;
  }

  if (beneficioNivel) {
    beneficioNivel.textContent = nivel.beneficio;
  }

  if (nivel.proximo === null) {
    barraPontos.style.width = "100%";
    textoNivel.textContent = "👑 Você alcançou o nível máximo!";
  } else {
    const progresso =
      ((pontos - nivel.minimo) / (nivel.proximo - nivel.minimo)) * 100;

    barraPontos.style.width = `${Math.min(Math.max(progresso, 0), 100)}%`;

    const faltam = nivel.proximo - pontos;
    textoNivel.textContent = `Faltam ${faltam} pontos para alcançar o próximo nível.`;
  }

  carregarRecompensas();
}

function recompensaLiberada(recompensa, pontos) {
  const niveis = ["raiz", "cacto", "sertao", "mestre"];
  const nivelAtual = obterChaveNivel(pontos);
  return niveis.indexOf(nivelAtual) >= niveis.indexOf(recompensa.nivelMinimo);
}

function carregarRecompensas() {
  if (!listaRecompensasPerfil) {
    return;
  }
  listaRecompensasPerfil.innerHTML = "";

  const pontos = Number(usuarioAtual.pontos || 0);

  RECOMPENSAS.forEach((recompensa) => {
    const liberada = recompensaLiberada(recompensa, pontos);
    const faltam = recompensa.pontos - pontos;

    const card = document.createElement("div");
    card.className = `recompensa-perfil ${liberada ? "liberada" : "bloqueada"}`;

    card.innerHTML = `
      <div class="recompensa-info">
        <strong>${recompensa.nome}</strong>
        <span>${recompensa.descricao}</span>
        <br>
        <small>${recompensa.pontos} pontos</small>
      </div>
      <div class="recompensa-status">
        ${
          liberada
            ? `<span class="status-liberado">✨ Recompensas disponíveis para o seu nível</span>`
            : `<span class="status-bloqueado">🔒 Recompensa bloqueada (Faltam ${faltam} pontos)</span>`
        }
      </div>
    `;
    listaRecompensasPerfil.appendChild(card);
  });
}

function carregarPedidos() {
  historicoPedidos.innerHTML = "";
  const todosPedidos = JSON.parse(localStorage.getItem("pedidos")) || [];
  const pedidosDoUsuario = todosPedidos.filter((pedido) => {
    return (
      pedido.email &&
      usuarioAtual.email &&
      pedido.email.toLowerCase() === usuarioAtual.email.toLowerCase()
    );
  });

  if (pedidosDoUsuario.length === 0) {
    historicoPedidos.innerHTML = "<p>Você ainda não fez nenhum pedido.</p>";
    return;
  }

  pedidosDoUsuario
    .sort(
      (a, b) =>
        Number(b.createdAt || b.data || 0) - Number(a.createdAt || a.data || 0),
    )
    .forEach((pedido) => {
      const card = document.createElement("div");
      card.className = "pedido-card";

      const timestampOuData =
        pedido.data ||
        pedido.createdAt ||
        (pedido.id ? Number(String(pedido.id).replace(/\D/g, "")) : null);

      let dataPedido = "Data não informada";
      if (timestampOuData) {
        const d = new Date(timestampOuData);
        if (!isNaN(d.getTime())) {
          dataPedido = d.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      }

      const pontosGanhosExibicao =
        pedido.pontosGanhos ?? Math.floor(pedido.valor || pedido.total || 0);

      card.innerHTML = `
        <h3>Pedido #${pedido.numero || pedido.id}</h3>
        <p>Data: ${dataPedido}</p>
        <p>
          Valor: 
          ${Number(pedido.valor || pedido.total || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </p>
        <p>Tipo: ${pedido.tipo || pedido.consumo || "Não informado"}</p>
        <p>Status: ${pedido.status || "Concluído"}</p>
        <p>⭐ Pontos ganhos: <strong>${pontosGanhosExibicao} pts</strong></p>

        ${
          pedido.recompensa
            ? `<p>🎁 Recompensa utilizada: <strong>${pedido.recompensa.nome}</strong></p>`
            : ""
        }
      `;
      historicoPedidos.appendChild(card);
    });
}

function carregarLGPD() {
  const configuracoes = usuarioAtual.privacidade || {};
  receberPromocoes.checked = configuracoes.promocoes === true;
  receberNotificacoes.checked = configuracoes.notificacoes === true;
  if (usuarioAtual.aceiteLGPD && usuarioAtual.aceiteLGPD.data) {
    dataLGPD.textContent = `Consentimento registrado em: ${usuarioAtual.aceiteLGPD.data}`;
  } else {
    dataLGPD.textContent = "Consentimento ainda não registrado.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const btnExcluir = document.getElementById("btnExcluirDados");

  if (btnExcluir) {
    btnExcluir.addEventListener("click", solicitarExclusaoConta);
  }
});

function solicitarExclusaoConta() {
  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuarioLogado || !usuarioLogado.email) {
    alert("Sessão inválida ou usuário não encontrado.");
    return;
  }

  const confirmacao1 = confirm(
    "Tem certeza que deseja excluir sua conta e todos os seus dados cadastrais?\nEsta ação não poderá ser desfeita.",
  );

  if (!confirmacao1) return;
  const emailDigitado = prompt(
    `Para confirmar a exclusão definitiva, digite seu e-mail (${usuarioLogado.email}):`,
  );

  if (
    !emailDigitado ||
    emailDigitado.trim().toLowerCase() !== usuarioLogado.email.toLowerCase()
  ) {
    alert("O e-mail digitado não confere. A exclusão foi cancelada.");
    return;
  }

  excluirDadosUsuario(usuarioLogado.email);
}

function excluirDadosUsuario(emailUsuario) {
  try {
    const emailTarget = emailUsuario.toLowerCase();
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    usuarios = usuarios.filter(
      (u) => String(u.email || "").toLowerCase() !== emailTarget,
    );
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("carrinho");
    localStorage.removeItem("pedido");

    let pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];
    pedidos = pedidos.filter(
      (p) => String(p.email || "").toLowerCase() !== emailTarget,
    );
    localStorage.setItem("pedidos", JSON.stringify(pedidos));

    alert("Sua conta e dados pessoais foram excluídos com sucesso.");

    window.location.href = "index.html";
  } catch (erro) {
    console.error(
      "Ops... ocorreu um erro ao excluir os dados do usuário:",
      erro,
    );
    alert("Ops... ocorreu um erro ao processar a exclusão. Tente novamente.");
  }
}

function salvarPrivacidade() {
  usuarioAtual.privacidade = {
    promocoes: receberPromocoes.checked,
    notificacoes: receberNotificacoes.checked,
  };

  atualizarUsuario();
}

receberPromocoes.addEventListener("change", salvarPrivacidade);

receberNotificacoes.addEventListener("change", salvarPrivacidade);

exportarDados.addEventListener("click", () => {
  const dados = JSON.stringify(usuarioAtual, null, 2);
  const arquivo = new Blob([dados], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(arquivo);
  link.download = "meus-dados-raizes.json";
  link.click();
  URL.revokeObjectURL(link.href);
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "login.html";
  });
}

carregarUsuario();
