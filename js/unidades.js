document.addEventListener("DOMContentLoaded", () => {
  const filtroCidade = document.getElementById("filtroCidade");
  const filtroConsumo = document.getElementById("filtroConsumo");
  const listaUnidades = document.getElementById("listaUnidades");
  const contadorUnidades = document.getElementById("contadorUnidades");
  if (!listaUnidades || typeof MOCK_UNIDADES === "undefined") {
    return;
  }

  const pedidoSalvo = JSON.parse(localStorage.getItem("pedido")) || {};
  if (pedidoSalvo.consumo) {
    filtroConsumo.value = pedidoSalvo.consumo;
  }

  function preencherCidades() {
    const cidades = [
      ...new Set(
        MOCK_UNIDADES.map((unidade) => unidade.cidade || unidade.city),
      ),
    ];

    cidades.forEach((cidade) => {
      const option = document.createElement("option");
      option.value = cidade;
      option.textContent = cidade;
      filtroCidade.appendChild(option);
    });
  }

  function obterUnidadesFiltradas() {
    const cidade = filtroCidade.value;
    return MOCK_UNIDADES.filter((unidade) => {
      const unidadeCidade = unidade.cidade || unidade.city;
      return cidade === "todas" || unidadeCidade === cidade;
    });
  }

  function formatarPreco(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function renderizarUnidades() {
    const unidades = obterUnidadesFiltradas();
    contadorUnidades.textContent = `${unidades.length} ${
      unidades.length === 1 ? "unidade" : "unidades"
    }`;

    if (unidades.length === 0) {
      listaUnidades.innerHTML = `
        <div class="mensagem-unidades-vazia">
          <div class="icone-vazio">🌵
          </div>

          <h3>
            Nenhuma unidade encontrada
          </h3>

          <p>
            Ops... nenhuma unidade encontrada... Tente alterar o filtro de cidade para encontrar uma unidade disponível.
          </p>
        </div>
      `;
      return;
    }

    listaUnidades.innerHTML = unidades
      .map((unidade) => {
        const imagem = unidade.imagem || "assets/comidas/cuscuz.jpg";
        const endereco = unidade.endereco || "";
        const bairro = unidade.bairro || "";
        const horario = unidade.horario || "";
        const taxa = Number(unidade.taxaEntrega || 0);
        const destaques = unidade.destaques || [];
        return `
          <article class="card-unidade">
            <div class="imagem-unidade">
              <img
                src="${imagem}"
                alt="Unidade ${unidade.nome}"
                loading="lazy"
              >

              <span class="status-unidade">
                ${unidade.status || "Disponível"}
              </span>
            </div>

            <div class="conteudo-unidade">
              <div class="topo-card-unidade">
                <div>
                  <h3>
                    ${unidade.nome}
                  </h3>

                  <p class="endereco-unidade">
                    📍 ${endereco}
                  </p>

                  <p class="bairro-unidade">
                    ${bairro}
                  </p>
                </div>

                <span class="nota-unidade">
                  ⭐ ${unidade.rating}
                </span>
              </div>

              <div class="informacoes-unidade">
                <span>
                  🕐 ${horario}
                </span>

                <span>
                  🛵 ${unidade.eta}
                </span>

                <span>
                  💰 Frete:
                  ${formatarPreco(taxa)}
                </span>
              </div>

              <ul class="destaques-unidade">
                ${destaques.map((item) => `<li>✓ ${item}</li>`).join("")}
              </ul>

              <button
                type="button"
                class="btn-selecionar-unidade"
                data-unidade="${unidade.id}"
              >
                Selecionar unidade
              </button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function selecionarUnidade(id) {
    const unidade = MOCK_UNIDADES.find((item) => item.id === id);
    if (!unidade) {
      return;
    }

    const pedidoAtual = JSON.parse(localStorage.getItem("pedido")) || {};
    pedidoAtual.unidade = unidade.id;
    pedidoAtual.consumo = filtroConsumo.value;
    localStorage.setItem("pedido", JSON.stringify(pedidoAtual));

    const botao = document.querySelector(`[data-unidade="${id}"]`);
    if (botao) {
      botao.textContent = "✓ Unidade selecionada";
      botao.classList.add("selecionada");
    }

    setTimeout(() => {
      window.location.href = `cardapio.html?tipo=${pedidoAtual.consumo}`;
    }, 500);
  }

  listaUnidades.addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-unidade]");
    if (!botao) {
      return;
    }

    selecionarUnidade(botao.dataset.unidade);
  });

  filtroCidade.addEventListener("change", renderizarUnidades);
  filtroConsumo.addEventListener("change", () => {
    const pedidoAtual = JSON.parse(localStorage.getItem("pedido")) || {};
    pedidoAtual.consumo = filtroConsumo.value;
    localStorage.setItem("pedido", JSON.stringify(pedidoAtual));
  });

  preencherCidades();
  renderizarUnidades();
});
