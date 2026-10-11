let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

function adicionarCarrinho(produto) {
  const existe = carrinho.find((item) => item.id === produto.id);
  if (existe) {
    existe.quantidade++;
  } else {
    carrinho.push({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      imagem: produto.imagem,
      quantidade: 1,
    });
  }
  salvarCarrinho();
  mostrarToast();
}

function salvarCarrinho() {
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
}

function mostrarToast() {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.classList.add("mostrar");
  setTimeout(() => {
    toast.classList.remove("mostrar");
  }, 2000);
}

function carregarCarrinho() {
  const area = document.getElementById("carrinho");
  if (!area) return;
  area.innerHTML = "";

  if (carrinho.length === 0) {
    area.innerHTML = `
      <div class="vazio">
        🛒
        <h2>Seu carrinho está vazio</h2>
        <a href="cardapio.html">Ver cardápio</a>
      </div>
    `;
    return;
  }

  let subtotal = 0;
  carrinho.forEach((item) => {
    subtotal += item.preco * item.quantidade;
    area.innerHTML += `
      <div class="itemCarrinho">
        <img src="${item.imagem}">
        <div>
          <h3>${item.nome}</h3>
          <p>R$ ${item.preco.toFixed(2)}</p>
          <div class="controle">
            <button onclick="alterarQuantidade(${item.id}, -1)">-</button>
            <span>${item.quantidade}</span>
            <button onclick="alterarQuantidade(${item.id}, 1)">+</button>
          </div>
        </div>
        <button class="remover" onclick="removerItem(${item.id})">🗑</button>
      </div>
    `;
  });

  document.getElementById("subtotal").innerHTML = "R$ " + subtotal.toFixed(2);
  let entrega = 5;
  document.getElementById("total").innerHTML =
    "R$ " + (subtotal + entrega).toFixed(2);
}

function alterarQuantidade(id, valor) {
  const item = carrinho.find((p) => p.id === id);
  item.quantidade += valor;
  if (item.quantidade <= 0) {
    removerItem(id);
    return;
  }

  salvarCarrinho();
  carregarCarrinho();
}

function removerItem(id) {
  carrinho = carrinho.filter((p) => p.id !== id);
  salvarCarrinho();
  carregarCarrinho();
}

carregarCarrinho();
