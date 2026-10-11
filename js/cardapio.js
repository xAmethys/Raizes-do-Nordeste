const abrirCarrinho = document.getElementById("abrirCarrinho");
const listaProdutos = document.getElementById("listaProdutos");
const produtosDestaque = document.getElementById("produtosDestaque");
const listaCategorias = document.getElementById("listaCategorias");
const pesquisa = document.getElementById("pesquisa");
const modal = document.getElementById("modalProduto");
const fecharModal = document.getElementById("fecharModal");
const imagemProduto = document.getElementById("imagemProduto");
const nomeProduto = document.getElementById("nomeProduto");
const descricaoProduto = document.getElementById("descricaoProduto");
const listaExtras = document.getElementById("listaExtras");
const quantidadeProduto = document.getElementById("quantidadeProduto");
const botaoAumentar = document.getElementById("aumentar");
const botaoDiminuir = document.getElementById("diminuir");
const adicionarProduto = document.getElementById("adicionarProduto");
const quantidadeCarrinho = document.getElementById("quantidadeCarrinho");

let categoriaSelecionada = "Todos";
let produtoSelecionado = null;
let quantidade = 1;
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

function obterUnidadeAtual() {
  const pedido = JSON.parse(localStorage.getItem("pedido")) || {};
  if (!pedido.unidade) {
    return null;
  }
  return MOCK_UNIDADES.find((unidade) => unidade.id === pedido.unidade) || null;
}

function obterProdutosDaUnidade() {
  const unidade = obterUnidadeAtual();
  if (!unidade || !Array.isArray(unidade.produtos)) {
    return produtos;
  }
  return produtos.filter((produto) => unidade.produtos.includes(produto.id));
}

function formatarPreco(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function atualizarCarrinho() {
  const total = carrinho.reduce(
    (soma, item) => soma + Number(item.quantidade || 0),
    0,
  );

  quantidadeCarrinho.textContent = total;
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
}

function carregarCategorias() {
  listaCategorias.innerHTML = "";
  categorias.forEach((categoria) => {
    const botao = document.createElement("button");
    botao.className = "categoria-btn";
    botao.textContent = categoria;
    if (categoria === categoriaSelecionada) {
      botao.classList.add("ativa");
    }

    botao.addEventListener("click", () => {
      categoriaSelecionada = categoria;
      carregarCategorias();
      carregarProdutos();
    });
    listaCategorias.appendChild(botao);
  });
}

function criarCardProduto(produto) {
  const card = document.createElement("article");
  card.className = "produto-card";
  if (!produto.disponivel) {
    card.classList.add("indisponivel");
  }
  card.innerHTML = `
    <img
      src="${produto.imagem}"
      alt="${produto.nome}"
      class="produto-imagem"
    >

    <div class="produto-info">
      <h3>${produto.nome}</h3>
      <p>${produto.descricao}</p>

      <div class="preco">
        <strong>
          ${formatarPreco(produto.preco)}
        </strong>

        ${
          produto.disponivel
            ? `
              <button
                class="btn-add"
                data-id="${produto.id}"
                type="button"
              >
                +
              </button>
            `
            : `
              <span class="indisponivel-texto">
                Indisponível
              </span>
            `
        }
      </div>
    </div>
  `;

  const botaoAdicionar = card.querySelector(".btn-add");
  if (botaoAdicionar) {
    botaoAdicionar.addEventListener("click", () => {
      abrirModal(produto.id);
    });
  }
  return card;
}

function carregarProdutos() {
  listaProdutos.innerHTML = "";
  const termoBusca = pesquisa.value.trim().toLowerCase();
  const produtosDaUnidade = obterProdutosDaUnidade();
  const produtosFiltrados = produtosDaUnidade.filter((produto) => {
    const categoria =
      categoriaSelecionada === "Todos" ||
      produto.categoria === categoriaSelecionada;

    const busca = produto.nome.toLowerCase().includes(termoBusca);
    return categoria && busca;
  });

  if (produtosFiltrados.length === 0) {
    listaProdutos.innerHTML = `
      <div class="mensagem-vazia">
        Ops... nenhum produto encontrado nesta unidade.
      </div>
    `;
    return;
  }

  produtosFiltrados.forEach((produto) => {
    listaProdutos.appendChild(criarCardProduto(produto));
  });
}

function obterProdutosDaUnidade() {
  const pedido = JSON.parse(localStorage.getItem("pedido")) || {};
  let unidades = [];
  if (typeof MOCK_UNIDADES !== "undefined" && Array.isArray(MOCK_UNIDADES)) {
    unidades = MOCK_UNIDADES;
  } else if (window.RAIZES_MOCK && Array.isArray(window.RAIZES_MOCK.units)) {
    unidades = window.RAIZES_MOCK.units;
  }

  const unidade = unidades.find((item) => item.id === pedido.unidade);
  if (!unidade || !Array.isArray(unidade.cardapio)) {
    return produtos;
  }
  return produtos.filter((produto) => unidade.cardapio.includes(produto.id));
}

function carregarDestaques() {
  if (!produtosDestaque) {
    return;
  }

  produtosDestaque.innerHTML = "";
  const pedido = JSON.parse(localStorage.getItem("pedido")) || {};
  let unidades = [];
  if (typeof MOCK_UNIDADES !== "undefined" && Array.isArray(MOCK_UNIDADES)) {
    unidades = MOCK_UNIDADES;
  } else if (window.RAIZES_MOCK && Array.isArray(window.RAIZES_MOCK.units)) {
    unidades = window.RAIZES_MOCK.units;
  }

  const unidadeSelecionada = unidades.find(
    (unidade) => unidade.id === pedido.unidade,
  );
  let destaques = [];
  if (
    unidadeSelecionada &&
    Array.isArray(unidadeSelecionada.destaquesProdutos)
  ) {
    destaques = unidadeSelecionada.destaquesProdutos
      .map((id) => produtos.find((produto) => produto.id === id))
      .filter((produto) => produto && produto.disponivel);
  }

  if (destaques.length === 0) {
    destaques = produtos.filter(
      (produto) => produto.destaque && produto.disponivel,
    );
  }

  destaques.forEach((produto) => {
    produtosDestaque.appendChild(criarCardProduto(produto));
  });
}

function abrirModal(id) {
  produtoSelecionado = produtos.find((produto) => produto.id === id);
  if (!produtoSelecionado) {
    return;
  }

  quantidade = 1;
  quantidadeProduto.textContent = quantidade;
  imagemProduto.src = produtoSelecionado.imagem;
  imagemProduto.alt = produtoSelecionado.nome;
  nomeProduto.textContent = produtoSelecionado.nome;
  descricaoProduto.textContent = produtoSelecionado.descricao;

  carregarExtras();
  modal.classList.add("ativo");
}

function carregarExtras() {
  listaExtras.innerHTML = "";
  const extras = produtoSelecionado.extras || [];
  if (extras.length === 0) {
    listaExtras.innerHTML = "<p>Sem extras disponíveis.</p>";
    return;
  }

  extras.forEach((extra) => {
    const item = document.createElement("label");
    item.className = "extra-item";
    item.innerHTML = `
      <span>
        <input
          type="checkbox"
          value="${extra.preco}"
          data-nome="${extra.nome}"
        >
        ${extra.nome}
      </span>

      <strong>${formatarPreco(extra.preco)}</strong>
    `;
    listaExtras.appendChild(item);
  });
}

function fecharJanela() {
  modal.classList.remove("ativo");
  produtoSelecionado = null;
  quantidade = 1;
}

botaoAumentar.addEventListener("click", () => {
  quantidade++;
  quantidadeProduto.textContent = quantidade;
});

botaoDiminuir.addEventListener("click", () => {
  if (quantidade > 1) {
    quantidade--;
  }
  quantidadeProduto.textContent = quantidade;
});

adicionarProduto.addEventListener("click", () => {
  if (!produtoSelecionado) {
    return;
  }

  const extrasSelecionados = [];
  document.querySelectorAll("#listaExtras input:checked").forEach((item) => {
    extrasSelecionados.push({
      nome: item.dataset.nome,
      preco: Number(item.value),
    });
  });

  const itemCarrinho = {
    id: produtoSelecionado.id,
    nome: produtoSelecionado.nome,
    preco: Number(produtoSelecionado.preco),
    imagem: produtoSelecionado.imagem,
    quantidade,
    extras: extrasSelecionados,
  };

  carrinho.push(itemCarrinho);
  atualizarCarrinho();
  fecharJanela();
});

fecharModal.addEventListener("click", fecharJanela);
modal.addEventListener("click", (evento) => {
  if (evento.target === modal) {
    fecharJanela();
  }
});

abrirCarrinho.addEventListener("click", () => {
  window.location.href = "pedido.html";
});

pesquisa.addEventListener("input", carregarProdutos);

carregarCategorias();
carregarProdutos();
carregarDestaques();
atualizarCarrinho();
