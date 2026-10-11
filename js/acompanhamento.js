const numeroPedido = document.getElementById("numeroPedido");
const statusAtual = document.getElementById("statusAtual");
const tempoEstimado = document.getElementById("tempoEstimado");
const listaItens = document.getElementById("listaItens");
const tipoConsumo = document.getElementById("tipoConsumo");
const formaPagamento = document.getElementById("formaPagamento");
const valorPedido = document.getElementById("valorPedido");
const avaliacao = document.getElementById("avaliacao");
const estrelas = document.querySelectorAll(".estrelas button");
const comentario = document.getElementById("comentario");
const enviarAvaliacao = document.getElementById("enviarAvaliacao");

const etapas = [
  document.getElementById("etapa1"),
  document.getElementById("etapa2"),
  document.getElementById("etapa3"),
  document.getElementById("etapa4"),
];

const pedido = JSON.parse(localStorage.getItem("pedidoAtual"));

let notaSelecionada = 0;
let etapaAtual = 0;

function formatarPreco(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    return "R$ 0,00";
  }
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarFormaPagamento(pagamento) {
  if (!pagamento) return "Não informado";

  const str = String(pagamento).toLowerCase();
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function obterTotalPedido() {
  if (!pedido) return 0;

  const possiveisTotais = [pedido.total, pedido.valor, pedido.valorTotal];
  for (const valor of possiveisTotais) {
    const numero = Number(valor);
    if (Number.isFinite(numero) && numero >= 0) {
      return numero;
    }
  }

  if (Array.isArray(pedido.itens)) {
    let subtotal = 0;
    pedido.itens.forEach((item) => {
      const quantidade = Number(item.quantidade || 1);
      const preco = Number(item.preco || 0);
      let extras = 0;
      if (Array.isArray(item.extras)) {
        item.extras.forEach((extra) => {
          extras += Number(extra.preco || 0);
        });
      }

      subtotal += (preco + extras) * quantidade;
    });

    const descontoCampanha = Number(pedido.descontoCampanha || 0);
    const descontoRecompensa = Number(pedido.descontoRecompensa || 0);
    const taxaEntrega = Number(pedido.taxaEntrega ?? pedido.frete ?? 0);
    return Math.max(
      0,
      subtotal - descontoCampanha - descontoRecompensa + taxaEntrega,
    );
  }
  return 0;
}

function carregarPedido() {
  if (!pedido) {
    window.location.href = "index.html";
    return;
  }

  numeroPedido.textContent = `Pedido #${pedido.numero}`;
  tipoConsumo.textContent = pedido.consumo || pedido.tipo || "Não informado";
  formaPagamento.textContent = formatarFormaPagamento(pedido.pagamento);

  const total = obterTotalPedido();
  valorPedido.textContent = formatarPreco(total);
  carregarItens();
}

function carregarItens() {
  listaItens.innerHTML = "";
  if (!Array.isArray(pedido.itens)) {
    return;
  }

  pedido.itens.forEach((item) => {
    const card = document.createElement("article");
    card.className = "item-resumo";
    const quantidade = Number(item.quantidade || 1);
    const preco = Number(item.preco || 0);
    const extras = Array.isArray(item.extras) ? item.extras : [];
    const valorExtras = extras.reduce(
      (total, extra) => total + Number(extra.preco || 0),
      0,
    );

    const valorItem = (preco + valorExtras) * quantidade;
    card.innerHTML = `
      <img
        src="${item.imagem || "assets/comidas/cuscuz.jpg"}"
        alt="${item.nome}"
      >

      <div class="item-resumo-info">
        <h3>${item.nome}</h3>

        <p>
          Quantidade: ${quantidade}
        </p>

        <small>
          ${
            extras.length
              ? extras.map((extra) => extra.nome).join(", ")
              : "Sem extras"
          }
        </small>
      </div>

      <div class="item-resumo-preco">
        ${formatarPreco(valorItem)}
      </div>
    `;
    listaItens.appendChild(card);
  });
}

function atualizarTimeline(indice, titulo, tempo) {
  etapas.forEach((etapa, posicao) => {
    etapa.classList.toggle("ativa", posicao <= indice);
  });

  statusAtual.textContent = titulo;
  tempoEstimado.textContent = tempo;
}

function iniciarAcompanhamento() {
  const etapasPedido = [
    {
      titulo: "Recebido",
      tempo: "Tempo estimado: 25 minutos",
    },
    {
      titulo: "Em preparo",
      tempo: "Tempo estimado: 18 minutos",
    },
    {
      titulo: "Pronto",
      tempo:
        pedido.consumo === "delivery"
          ? "Aguardando entregador"
          : "Retire seu pedido no balcão",
    },
    {
      titulo: pedido.consumo === "delivery" ? "Entregue" : "Pedido Finalizado",
      tempo: "Obrigado pela preferência!",
    },
  ];

  atualizarTimeline(
    etapaAtual,
    etapasPedido[etapaAtual].titulo,
    etapasPedido[etapaAtual].tempo,
  );

  const intervalo = setInterval(() => {
    etapaAtual++;
    if (etapaAtual >= etapasPedido.length) {
      clearInterval(intervalo);
      avaliacao.style.display = "flex";
      return;
    }

    atualizarTimeline(
      etapaAtual,
      etapasPedido[etapaAtual].titulo,
      etapasPedido[etapaAtual].tempo,
    );
  }, 5000);
}

estrelas.forEach((botao) => {
  botao.addEventListener("click", () => {
    notaSelecionada = Number(botao.dataset.nota);
    estrelas.forEach((estrela) => {
      estrela.classList.remove("ativa");
      if (Number(estrela.dataset.nota) <= notaSelecionada) {
        estrela.classList.add("ativa");
      }
    });
  });
});

enviarAvaliacao.addEventListener("click", () => {
  if (notaSelecionada === 0) {
    alert("Selecione uma nota para continuar.");
    return;
  }

  const avaliacaoCliente = {
    pedido: pedido.numero,
    nota: notaSelecionada,
    comentario: comentario.value.trim(),
    data: new Date().toLocaleString("pt-BR"),
  };

  localStorage.setItem("ultimaAvaliacao", JSON.stringify(avaliacaoCliente));
  alert("Obrigado pela sua avaliação!");
  avaliacao.innerHTML = `
      <h2>Muito obrigado! ❤️</h2>
      <p>Sua opinião foi registrada com sucesso.</p>
      <a href="index.html" class="btn-primary">
        Voltar ao início
      </a>
    `;
});

carregarPedido();
iniciarAcompanhamento();
