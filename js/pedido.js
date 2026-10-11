const valorTotal = document.getElementById("valorTotal");
const finalizarPedido = document.getElementById("finalizarPedido");
const modalPagamento = document.getElementById("pagamentoModal");
const statusPagamento = document.getElementById("statusPagamento");
const listaPedido = document.getElementById("listaPedido");
const resumoTipo = document.getElementById("resumoTipo");
const dadosConsumo = document.getElementById("dadosConsumo");
const listaRecompensas = document.getElementById("listaRecompensas");
const resumoFidelidade = document.getElementById("resumoFidelidade");

let pedido = JSON.parse(localStorage.getItem("pedido")) || {};
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado")) || null;

let subtotal = 0;
let desconto = 0;
let descontoCampanha = 0;
let descontoRecompensa = 0;
let taxaEntrega = 0;
let recompensaAplicada = null;
let campanhaAplicada = [];

const NOME_BANCO = "RaizesDoNordesteDB";
const VERSAO_BANCO = 1;
const STORE_CAMPANHAS = "campanhas";
let bancoCampanhas = null;

const RECOMPENSAS = [
  {
    id: "recompensa-5",
    nome: "R$ 5 de desconto",
    descricao: "Use seus pontos para ganhar R$ 5 de desconto.",
    pontos: 100,
    desconto: 5,
    icone: "🌱",
  },
  {
    id: "recompensa-10",
    nome: "R$ 10 de desconto",
    descricao: "Use seus pontos para ganhar R$ 10 de desconto.",
    pontos: 250,
    desconto: 10,
    icone: "🌿",
  },
  {
    id: "recompensa-20",
    nome: "R$ 20 de desconto",
    descricao: "Use seus pontos para ganhar R$ 20 de desconto.",
    pontos: 500,
    desconto: 20,
    icone: "🌵",
  },
  {
    id: "recompensa-30",
    nome: "R$ 30 de desconto",
    descricao: "Use seus pontos para ganhar R$ 30 de desconto.",
    pontos: 1000,
    desconto: 30,
    icone: "🏜️",
  },
  {
    id: "recompensa-50",
    nome: "R$ 50 de desconto",
    descricao: "Use seus pontos para ganhar R$ 50 de desconto.",
    pontos: 1500,
    desconto: 50,
    icone: "👑",
  },
];

function formatarPreco(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function gerarNumeroPedido() {
  const agora = new Date();
  const data = agora.toISOString().replace(/\D/g, "").slice(0, 14);
  const aleatorio = Math.floor(100 + Math.random() * 900);
  return `${data}-${aleatorio}`;
}

function sincronizarDadosPedido() {
  try {
    const pedidoAtualizado = JSON.parse(localStorage.getItem("pedido"));
    const carrinhoAtualizado = JSON.parse(localStorage.getItem("carrinho"));
    pedido =
      pedidoAtualizado && typeof pedidoAtualizado === "object"
        ? pedidoAtualizado
        : {};
    if (pedido) {
      let at = pedido.consumo || pedido.tipo || pedido.formaConsumo || "";
      if (at === "consumo" || at === "consumo_local") {
        at = "consumo-local";
      }
      pedido.consumo = at;
    }

    carrinho = Array.isArray(carrinhoAtualizado) ? carrinhoAtualizado : [];
  } catch (erro) {
    console.error("Erro ao atualizar dados do pedido:", erro);
  }
}

function criarCampo(label, id, tipo = "text", placeholder = "") {
  return `
    <div class="form-group">
      <label for="${id}">${label}</label>
      <input type="${tipo}" id="${id}" name="${id}" placeholder="${placeholder}">
    </div>
  `;
}

function abrirModalPagamento() {
  if (!modalPagamento) return;
  modalPagamento.classList.add("ativo");

  if (statusPagamento) {
    statusPagamento.textContent = "Enviando para serviço externo...";
  }
}

function fecharModalPagamento() {
  if (!modalPagamento) return;
  modalPagamento.classList.remove("ativo");
}

function obterUnidades() {
  if (typeof MOCK_UNIDADES !== "undefined" && Array.isArray(MOCK_UNIDADES)) {
    return MOCK_UNIDADES;
  }

  if (window.RAIZES_MOCK && Array.isArray(window.RAIZES_MOCK.units)) {
    return window.RAIZES_MOCK.units;
  }
  return [
    { id: "recife", nome: "Recife", cidade: "Recife" },
    { id: "joaopessoa", nome: "João Pessoa", cidade: "João Pessoa" },
    { id: "fortaleza", nome: "Fortaleza", cidade: "Fortaleza" },
    { id: "natal", nome: "Natal", cidade: "Natal" },
  ];
}

function obterUnidadeSelecionada() {
  const unidades = obterUnidades();
  return (
    unidades.find(
      (unidade) =>
        String(unidade.id).toLowerCase() ===
        String(pedido.unidade || "").toLowerCase(),
    ) || null
  );
}

function abrirBancoCampanhas() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB não é suportado neste navegador."));
      return;
    }

    if (bancoCampanhas) {
      try {
        const transacao = bancoCampanhas.transaction(
          STORE_CAMPANHAS,
          "readonly",
        );

        transacao.abort();
        resolve(bancoCampanhas);
        return;
      } catch (erro) {
        bancoCampanhas = null;
      }
    }

    const request = indexedDB.open(NOME_BANCO, VERSAO_BANCO);
    request.onupgradeneeded = function (evento) {
      const banco = evento.target.result;
      if (!banco.objectStoreNames.contains(STORE_CAMPANHAS)) {
        banco.createObjectStore(STORE_CAMPANHAS, {
          keyPath: "id",
        });
      }
    };

    request.onsuccess = function (evento) {
      bancoCampanhas = evento.target.result;
      bancoCampanhas.onversionchange = function () {
        bancoCampanhas.close();
        bancoCampanhas = null;
      };

      bancoCampanhas.onclose = function () {
        bancoCampanhas = null;
      };

      resolve(bancoCampanhas);
    };

    request.onerror = function () {
      console.error(
        "Ops, ocorreu um erro ao abrir o banco de campanhas:",
        request.error,
      );
      reject(request.error);
    };

    request.onblocked = function () {
      console.warn(
        "Infelizmente a abertura do banco de campanhas foi bloqueada.",
      );
    };
  });
}

async function obterCampanhas() {
  try {
    const banco = await abrirBancoCampanhas();
    return await new Promise((resolve, reject) => {
      const transacao = banco.transaction(STORE_CAMPANHAS, "readonly");
      const store = transacao.objectStore(STORE_CAMPANHAS);
      const request = store.getAll();
      request.onsuccess = function () {
        resolve(Array.isArray(request.result) ? request.result : []);
      };

      request.onerror = function () {
        reject(request.error);
      };

      transacao.onerror = function () {
        reject(transacao.error);
      };
    });
  } catch (erro) {
    console.error(
      "Ops... ocorreu um erro ao carregar campanhas do IndexedDB:",
      erro,
    );
    return [];
  }
}

function obterDataCampanha(campanha) {
  const data =
    campanha.createdAt || campanha.dataCriacao || campanha.created_at || "";
  if (typeof data === "number") {
    return data;
  }

  const timestamp = Date.parse(data);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function obterUnidadeCampanha(campanha) {
  return String(
    campanha.unitId ?? campanha.unidadeId ?? campanha.unidade ?? "all",
  )
    .trim()
    .toLowerCase();
}

function campanhaValeParaTodas(campanha) {
  const unidadeCampanha = obterUnidadeCampanha(campanha);
  return (
    unidadeCampanha === "all" ||
    unidadeCampanha === "todas" ||
    unidadeCampanha === "*" ||
    unidadeCampanha === ""
  );
}

function campanhaValeParaUnidade(campanha, unidadeAtual) {
  const unidadeCampanha = obterUnidadeCampanha(campanha);
  if (campanhaValeParaTodas(campanha)) {
    return true;
  }
  return unidadeAtual !== "" && unidadeCampanha === unidadeAtual;
}

async function obterCampanhasValidas(valorSubtotal) {
  const campanhas = await obterCampanhas();
  const unidadeAtual = String(pedido.unidade || "")
    .trim()
    .toLowerCase();

  const campanhasUnicas = [];
  const campanhasJaAdicionadas = new Set();
  campanhas.forEach((campanha) => {
    if (!campanha) return;
    const unidadeCampanha = obterUnidadeCampanha(campanha);
    const chave = [
      campanha.id || "",
      String(campanha.titulo || campanha.title || "")
        .trim()
        .toLowerCase(),
      unidadeCampanha,
      Number(
        campanha.discountRate ??
          campanha.desconto ??
          campanha.descontoPercentual ??
          0,
      ),
      Number(campanha.minimumOrder ?? campanha.pedidoMinimo ?? 0),
    ].join("|");

    if (campanhasJaAdicionadas.has(chave)) {
      return;
    }

    campanhasJaAdicionadas.add(chave);
    campanhasUnicas.push(campanha);
  });

  return campanhasUnicas
    .filter((campanha) => {
      return (
        campanha.ativa === true ||
        campanha.ativa === 1 ||
        campanha.ativa === "true"
      );
    })
    .filter((campanha) => {
      return campanhaValeParaUnidade(campanha, unidadeAtual);
    })
    .filter((campanha) => {
      const pedidoMinimo = Number(
        campanha.minimumOrder ?? campanha.pedidoMinimo ?? 0,
      );

      return Number(valorSubtotal) >= pedidoMinimo;
    })
    .filter((campanha) => {
      const percentual = Number(
        campanha.discountRate ??
          campanha.desconto ??
          campanha.descontoPercentual ??
          0,
      );

      return percentual > 0;
    })
    .sort((a, b) => {
      return obterDataCampanha(a) - obterDataCampanha(b);
    });
}

async function recalcularDescontos() {
  const campanhas = await obterCampanhasValidas(subtotal);
  let novoDescontoCampanha = 0;
  let novasCampanhasAplicadas = [];
  campanhas.forEach((campanha) => {
    const percentual = Math.min(
      100,
      Math.max(
        0,
        Number(
          campanha.discountRate ??
            campanha.desconto ??
            campanha.descontoPercentual ??
            0,
        ),
      ),
    );

    const valorDesconto = Number(((subtotal * percentual) / 100).toFixed(2));
    if (valorDesconto > 0) {
      novasCampanhasAplicadas.push({
        ...campanha,
        percentualAplicado: percentual,
        valorDescontoAplicado: valorDesconto,
      });

      novoDescontoCampanha += valorDesconto;
    }
  });

  novoDescontoCampanha = Number(novoDescontoCampanha.toFixed(2));

  let novoDescontoRecompensa = 0;
  if (recompensaAplicada) {
    const valorDisponivel = Math.max(0, subtotal - novoDescontoCampanha);
    novoDescontoRecompensa = Number(
      Math.min(
        Number(recompensaAplicada.desconto || 0),
        valorDisponivel,
      ).toFixed(2),
    );
  }

  campanhaAplicada = novasCampanhasAplicadas;
  descontoCampanha = novoDescontoCampanha;
  descontoRecompensa = novoDescontoRecompensa;
  desconto = Number((descontoCampanha + descontoRecompensa).toFixed(2));
}

function calcularSubtotal() {
  subtotal = 0;
  carrinho.forEach((item) => {
    const quantidade = Number(item.quantidade || 1);
    const preco = Number(item.preco || 0);
    let extrasTotal = 0;
    if (Array.isArray(item.extras)) {
      item.extras.forEach((extra) => {
        extrasTotal += Number(extra.preco || 0);
      });
    }
    subtotal += (preco + extrasTotal) * quantidade;
  });

  subtotal = Number(subtotal.toFixed(2));
  return subtotal;
}

function calcularTaxaEntrega() {
  taxaEntrega = 0;
  if (pedido.consumo !== "delivery") {
    return 0;
  }

  const unidade = obterUnidadeSelecionada();
  if (!unidade) {
    return 0;
  }

  taxaEntrega = Number(
    unidade.delivery ?? unidade.taxaDelivery ?? unidade.frete ?? 0,
  );

  return taxaEntrega;
}

async function calcularTotal() {
  calcularSubtotal();
  await recalcularDescontos();
  calcularTaxaEntrega();

  const total = Math.max(
    0,
    subtotal - descontoCampanha - descontoRecompensa + taxaEntrega,
  );
  return Number(total.toFixed(2));
}

function obterUsuarioAtual() {
  try {
    const usuarioLogadoAtual = JSON.parse(
      localStorage.getItem("usuarioLogado"),
    );

    if (!usuarioLogadoAtual || !usuarioLogadoAtual.email) {
      return null;
    }

    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    if (!Array.isArray(usuarios)) {
      return null;
    }

    const usuarioValido = usuarios.find(
      (usuario) =>
        String(usuario.email || "").toLowerCase() ===
        String(usuarioLogadoAtual.email || "").toLowerCase(),
    );

    return usuarioValido || null;
  } catch (erro) {
    console.error("Erro ao verificar usuário:", erro);
    return null;
  }
}

function obterPontosUsuario() {
  const usuario = obterUsuarioAtual();
  if (!usuario) {
    return 0;
  }

  return Number(usuario.pontos || 0);
}

function obterNivelUsuario(pontos) {
  if (pontos >= 2000) return "Mestre do Nordeste";
  if (pontos >= 1000) return "Sertão";
  if (pontos >= 500) return "Cacto";
  return "Raiz";
}

function carregarRecompensas() {
  if (!listaRecompensas) return;

  const usuario = obterUsuarioAtual();
  if (!usuario) {
    if (resumoFidelidade) {
      resumoFidelidade.textContent =
        "Faça login para utilizar suas recompensas.";
    }

    listaRecompensas.innerHTML = `
      <div class="box-alerta-login">
        <p>Faça login ou cadastre-se para utilizar suas recompensas de fidelidade.</p>
        <div class="acoes-login">
          <a href="login.html" class="btn-login">Fazer login</a>
          <a href="cadastro.html" class="btn-cadastro">Criar conta</a>
        </div>
      </div>
    `;

    return;
  }

  const pontos = obterPontosUsuario();
  if (resumoFidelidade) {
    resumoFidelidade.textContent = `Você possui ${pontos} pontos.`;
  }

  listaRecompensas.innerHTML = RECOMPENSAS.map((recompensa) => {
    const disponivel = pontos >= recompensa.pontos;
    const aplicada =
      recompensaAplicada && recompensaAplicada.id === recompensa.id;

    return `
          <div class="recompensa-card ${disponivel ? "disponivel" : "bloqueada"} ${aplicada ? "aplicada" : ""}">
            <div class="recompensa-icone">
              ${recompensa.icone}
            </div>

            <div class="recompensa-info">
              <h3>${recompensa.nome}</h3>
              <p>${recompensa.descricao}</p>
              <strong>${recompensa.pontos} pontos</strong>
            </div>

            <div class="recompensa-acao">
              ${
                aplicada
                  ? `
                    <button
                      type="button"
                      class="btn-remover-recompensa"
                      onclick="removerRecompensa()"
                    >
                      Remover
                    </button>
                  `
                  : disponivel
                    ? `
                      <button
                        type="button"
                        class="btn-recompensa"
                        onclick="aplicarRecompensa('${recompensa.id}')"
                      >
                        Usar
                      </button>
                    `
                    : `
                      <button
                        type="button"
                        class="btn-bloqueado"
                        disabled
                        title="Você precisa de ${recompensa.pontos} pontos"
                      >
                        🔒 Bloqueado
                      </button>
                    `
              }
            </div>
          </div>
        `;
  }).join("");
}

async function aplicarRecompensa(id) {
  const usuario = obterUsuarioAtual();
  if (!usuario) {
    alert("Ops... você precisa estar logado para utilizar uma recompensa.");
    return;
  }

  const recompensa = RECOMPENSAS.find((item) => item.id === id);
  if (!recompensa) return;

  const pontos = obterPontosUsuario();
  if (pontos < recompensa.pontos) {
    alert(
      "Ops... infelizmente você ainda não possui pontos suficientes para essa recompensa.",
    );
    return;
  }

  recompensaAplicada = recompensa;

  await recalcularDescontos();
  await atualizarResumo();
  carregarRecompensas();
}

async function removerRecompensa() {
  recompensaAplicada = null;
  descontoRecompensa = 0;

  await recalcularDescontos();
  await atualizarResumo();
  carregarRecompensas();
}

function atualizarResumoFrete() {
  const resumo = document.querySelector(".total");
  if (!resumo) return;

  let elementoResumo = document.getElementById("detalhesTotal");
  if (!elementoResumo) {
    elementoResumo = document.createElement("div");
    elementoResumo.id = "detalhesTotal";
    elementoResumo.className = "detalhes-total";
    resumo.insertBefore(elementoResumo, resumo.firstChild);
  }

  let html = `
    <div class="linha-total">
      <span>Subtotal:</span>
      <strong>${formatarPreco(subtotal)}</strong>
    </div>
  `;

  const campanhasExibidas = new Set();
  if (Array.isArray(campanhaAplicada) && campanhaAplicada.length > 0) {
    campanhaAplicada.forEach((campanha) => {
      const titulo = campanha.titulo || campanha.title || "Campanha";
      const percentual = Number(
        campanha.percentualAplicado ??
          campanha.discountRate ??
          campanha.desconto ??
          campanha.descontoPercentual ??
          0,
      );

      const valorDesconto = Number(campanha.valorDescontoAplicado || 0);
      if (valorDesconto <= 0) return;

      const chave = [
        campanha.id || "",
        titulo.trim().toLowerCase(),
        percentual,
        valorDesconto,
      ].join("|");

      if (campanhasExibidas.has(chave)) {
        return;
      }

      campanhasExibidas.add(chave);

      html += `
        <div class="linha-total desconto-campanha">
          <span>🏷️ ${titulo} (${percentual}%)</span>
          <strong>- ${formatarPreco(valorDesconto)}</strong>
        </div>
      `;
    });
  }

  if (recompensaAplicada && descontoRecompensa > 0) {
    html += `
      <div class="linha-total desconto-recompensa">
        <span>🎁 ${recompensaAplicada.nome}</span>
        <strong>- ${formatarPreco(descontoRecompensa)}</strong>
      </div>
    `;
  }

  if (taxaEntrega > 0) {
    html += `
      <div class="linha-total taxa-entrega">
        <span>Taxa de entrega</span>
        <strong>${formatarPreco(taxaEntrega)}</strong>
      </div>
    `;
  }

  elementoResumo.innerHTML = html;
}

async function atualizarResumo() {
  const total = await calcularTotal();
  if (valorTotal) {
    valorTotal.textContent = formatarPreco(total);
  }

  const pontosGanharEl = document.getElementById("pontosGanharDestePedido");

  if (pontosGanharEl) {
    const usuario = obterUsuarioAtual();

    if (usuario) {
      const pontosPrevistos = Math.floor(total);
      pontosGanharEl.textContent = `⭐ Você ganhará ${pontosPrevistos} pontos com este pedido!`;
      pontosGanharEl.style.display = "";
    } else {
      pontosGanharEl.textContent = "";
      pontosGanharEl.style.display = "none";
    }
  }

  atualizarResumoFrete();
}

function atualizarResumoFidelidade() {
  if (!resumoFidelidade) return;

  const usuario = obterUsuarioAtual();
  if (!usuario) {
    resumoFidelidade.textContent = "Faça login para utilizar suas recompensas.";
    return;
  }

  const pontos = obterPontosUsuario();
  const nivel = obterNivelUsuario(pontos);
  resumoFidelidade.textContent = `Nível ${nivel} • ${pontos} pontos disponíveis`;
}

function carregarCarrinho() {
  if (!listaPedido) return;

  if (carrinho.length === 0) {
    listaPedido.innerHTML = `
      <div class="carrinho-vazio">
        <p>Seu carrinho está vazio.</p>
        <a href="cardapio.html" class="btn-primary">Voltar ao cardápio</a>
      </div>
    `;

    atualizarResumo();
    return;
  }

  listaPedido.innerHTML = carrinho
    .map((item, index) => {
      const quantidade = Number(item.quantidade || 1);
      const preco = Number(item.preco || 0);
      const extras = Array.isArray(item.extras) ? item.extras : [];
      const extrasValidos = extras.filter((extra) => extra && extra.nome);
      const valorExtras = extrasValidos.reduce(
        (total, extra) => total + Number(extra.preco || 0),
        0,
      );

      const valorUnitario = preco + valorExtras;
      const valorItem = valorUnitario * quantidade;
      return `
            <article class="item-pedido" data-index="${index}">
              <img
                src="${item.imagem || "assets/comidas/default.jpg"}"
                alt="${item.nome}"
              >

              <div class="item-info">
                <h3>${item.nome}</h3>

                ${
                  extrasValidos.length
                    ? `
                      <p>
                        ${extrasValidos
                          .map(
                            (extra) =>
                              `${extra.nome} (+${formatarPreco(extra.preco)})`,
                          )
                          .join(" | ")}
                      </p>
                    `
                    : ""
                }

                <small>
                  ${formatarPreco(valorUnitario)}
                  por unidade
                </small>
              </div>

              <div class="item-acoes">
                <div class="botoes-item">
                  <div class="controle-quantidade">
                    <button
                      type="button"
                      class="btn-quantidade"
                      onclick="alterarQuantidade(${index}, -1)"
                      aria-label="Diminuir quantidade"
                    >−</button>

                    <span class="quantidade-item">
                      ${quantidade}
                    </span>

                    <button
                      type="button"
                      class="btn-quantidade"
                      onclick="alterarQuantidade(${index}, 1)"
                      aria-label="Aumentar quantidade"
                    >+</button>
                  </div>

                  <button
                    type="button"
                    class="btn-excluir-item"
                    onclick="removerItem(${index})"
                    aria-label="Excluir item"
                  >🗑️</button>
                </div>

                <div class="item-preco">
                  ${formatarPreco(valorItem)}
                </div>
              </div>
            </article>
          `;
    })
    .join("");

  calcularSubtotal();
  atualizarResumo();
}

function salvarCarrinho() {
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
}

function alterarQuantidade(index, valor) {
  if (!carrinho[index]) return;

  const quantidadeAtual = Number(carrinho[index].quantidade || 1);
  const novaQuantidade = quantidadeAtual + valor;
  if (novaQuantidade <= 0) {
    carrinho.splice(index, 1);
  } else {
    carrinho[index].quantidade = novaQuantidade;
  }

  salvarCarrinho();
  carregarCarrinho();
}

function removerItem(index) {
  if (!carrinho[index]) return;
  carrinho.splice(index, 1);
  salvarCarrinho();
  carregarCarrinho();
}

function carregarTipoConsumo() {
  if (!resumoTipo) return;

  const valorBruto =
    pedido.consumo ||
    pedido.tipo ||
    pedido.formaConsumo ||
    pedido.opcaoConsumo ||
    "";

  const valorFormatado = String(valorBruto).toLowerCase().trim();
  let tipoTexto = "Não informado";
  if (
    ["consumo-local", "consumo_local", "consumo", "local"].includes(
      valorFormatado,
    )
  ) {
    tipoTexto = "Consumo no local";
  } else if (["delivery", "entrega"].includes(valorFormatado)) {
    tipoTexto = "Delivery";
  } else if (["retirada", "balcao", "balcão"].includes(valorFormatado)) {
    tipoTexto = "Retirada na unidade";
  }

  const unidadeObj = obterUnidadeSelecionada();
  const unidadeNome = unidadeObj?.nome || pedido.unidade || "";
  resumoTipo.innerHTML = `
    <div class="resumo-consumo">
      <strong>${tipoTexto}</strong>
      ${unidadeNome ? `• Unidade: ${unidadeNome}` : ""}
    </div>
  `;
}

function carregarFormulario() {
  if (!dadosConsumo) return;
  dadosConsumo.innerHTML = "";
  const valorBruto =
    pedido.consumo ||
    pedido.tipo ||
    pedido.formaConsumo ||
    pedido.opcaoConsumo ||
    "";

  const valorFormatado = String(valorBruto).toLowerCase().trim();
  if (["delivery", "entrega"].includes(valorFormatado)) {
    dadosConsumo.innerHTML = `
      <h3>Endereço de entrega</h3>
      ${criarCampo("Nome completo", "nomeEntrega", "text", "Digite seu nome")}
      ${criarCampo("CEP", "cep", "text", "00000-000")}
      ${criarCampo("Rua", "rua", "text", "Nome da rua")}
      ${criarCampo("Número", "numero", "text", "Número")}
      ${criarCampo("Complemento", "complemento", "text", "Apartamento, casa...")}
      ${criarCampo("Bairro", "bairro", "text", "Bairro")}
      ${criarCampo("Cidade", "cidade", "text", "Cidade")}
      ${criarCampo("Estado", "estado", "text", "UF")}
    `;
  } else if (["retirada", "balcao", "balcão"].includes(valorFormatado)) {
    dadosConsumo.innerHTML = `
      <h3>Retirada</h3>
      <p>Seu pedido ficará disponível para retirada no balcão.</p>
    `;
  } else if (
    ["consumo-local", "consumo_local", "consumo", "local"].includes(
      valorFormatado,
    )
  ) {
    dadosConsumo.innerHTML = `
      <h3>Consumo no local</h3>
      <p>Seu pedido será preparado para o consumo na unidade.</p>
    `;
  }
}

function validarFormulario() {
  if (pedido.consumo !== "delivery") {
    return true;
  }

  const camposObrigatorios = [
    "nomeEntrega",
    "cep",
    "rua",
    "numero",
    "bairro",
    "cidade",
    "estado",
  ];

  for (const id of camposObrigatorios) {
    const campo = document.getElementById(id);
    if (!campo || !campo.value.trim()) {
      alert("Por favor, preencha todos os campos obrigatórios do endereço.");
      campo?.focus();
      return false;
    }
  }
  return true;
}

function obterDadosConsumo() {
  if (pedido.consumo !== "delivery") {
    return {};
  }

  return {
    nome: document.getElementById("nomeEntrega")?.value.trim() || "",
    cep: document.getElementById("cep")?.value.trim() || "",
    rua: document.getElementById("rua")?.value.trim() || "",
    numero: document.getElementById("numero")?.value.trim() || "",
    complemento: document.getElementById("complemento")?.value.trim() || "",
    bairro: document.getElementById("bairro")?.value.trim() || "",
    cidade: document.getElementById("cidade")?.value.trim() || "",
    estado: document.getElementById("estado")?.value.trim() || "",
  };
}

function obterPedidos() {
  try {
    const pedidos = JSON.parse(localStorage.getItem("pedidos"));
    return Array.isArray(pedidos) ? pedidos : [];
  } catch (erro) {
    return [];
  }
}

function salvarPedido(pedidoFinal) {
  const pedidos = obterPedidos();
  pedidos.push(pedidoFinal);
  localStorage.setItem("pedidos", JSON.stringify(pedidos));
}

function adicionarPontosFidelidade(pedidoFinal) {
  if (pedidoFinal.pontosAdicionados) {
    return;
  }

  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
  if (!Array.isArray(usuarios)) {
    return;
  }

  const email = pedidoFinal.email;
  const indice = usuarios.findIndex(
    (usuario) =>
      String(usuario.email || "").toLowerCase() ===
      String(email || "").toLowerCase(),
  );

  if (indice === -1) {
    return;
  }

  const pontosGanhos = Number(pedidoFinal.pontosGanhos || 0);
  usuarios[indice].pontos = Number(usuarios[indice].pontos || 0) + pontosGanhos;
  usuarios[indice].pontos = Math.max(0, Math.floor(usuarios[indice].pontos));
  localStorage.setItem("usuarios", JSON.stringify(usuarios));

  const usuarioAtual = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (
    usuarioAtual &&
    String(usuarioAtual.email || "").toLowerCase() ===
      String(email || "").toLowerCase()
  ) {
    usuarioAtual.pontos = usuarios[indice].pontos;

    localStorage.setItem("usuarioLogado", JSON.stringify(usuarioAtual));
  }

  pedidoFinal.pontosAdicionados = true;
}

function registrarRecompensaUtilizada(pedidoFinal) {
  if (!recompensaAplicada) {
    return;
  }

  pedidoFinal.recompensaUtilizada = true;
  pedidoFinal.pontosRecompensa = recompensaAplicada.pontos;
}

async function criarPedidoFinal(formaPagamento) {
  sincronizarDadosPedido();

  const total = await calcularTotal();
  const cliente = obterUsuarioAtual();
  const unidade = obterUnidadeSelecionada();
  const email = cliente?.email || "";
  const nome = cliente?.nome || cliente?.name || "";
  const pontosGanhos = Math.floor(total);
  const agora = new Date().toISOString();

  return {
    id: `pedido-${Date.now()}`,
    numero: gerarNumeroPedido(),
    data: agora,
    createdAt: Date.now(),
    cliente: nome,
    email: email,
    unidade: pedido.unidade || "",
    unidadeNome: unidade?.nome || pedido.unidade || "",
    tipo: pedido.consumo || "",
    consumo: pedido.consumo || "",
    dadosConsumo: obterDadosConsumo(),
    pagamento: formaPagamento,
    itens: carrinho,
    subtotal: subtotal,
    total: total,
    valor: total,
    desconto: Number((descontoCampanha + descontoRecompensa).toFixed(2)),
    descontoCampanha: descontoCampanha,
    descontoRecompensa: descontoRecompensa,
    pontosGanhos: pontosGanhos,
    recompensa: recompensaAplicada
      ? {
          id: recompensaAplicada.id,
          nome: recompensaAplicada.nome,
          pontos: recompensaAplicada.pontos,
          desconto: recompensaAplicada.desconto,
        }
      : null,
    campanhas: Array.isArray(campanhaAplicada)
      ? campanhaAplicada.map((campanha) => ({
          id: campanha.id,
          titulo: campanha.titulo || campanha.title || "Campanha",
          unitId: campanha.unitId || campanha.unidadeId || "all",
          descontoPercentual: Number(
            campanha.percentualAplicado ??
              campanha.discountRate ??
              campanha.desconto ??
              campanha.descontoPercentual ??
              0,
          ),
          pedidoMinimo: Number(
            campanha.minimumOrder ?? campanha.pedidoMinimo ?? 0,
          ),
          valorDesconto: Number(campanha.valorDescontoAplicado || 0),
        }))
      : [],
    campanhaAplicada:
      Array.isArray(campanhaAplicada) && campanhaAplicada.length > 0,
  };
}

async function processarPagamento() {
  let pedidoFinal = null;

  try {
    sincronizarDadosPedido();

    if (!validarFormulario()) return;

    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio.");
      return;
    }

    const pagamentoSelecionado = document.querySelector(
      'input[name="pagamento"]:checked',
    );

    if (!pagamentoSelecionado) {
      alert("Selecione uma forma de pagamento.");
      return;
    }

    const formaPagamento = pagamentoSelecionado.value;
    const total = await calcularTotal();

    if (total <= 0) {
      alert("O valor do pedido precisa ser maior que zero.");
      return;
    }

    if (finalizarPedido) {
      finalizarPedido.disabled = true;
      finalizarPedido.textContent = "Processando...";
    }

    abrirModalPagamento();

    pedidoFinal = await criarPedidoFinal(formaPagamento);

    const resultado = await ServicoPagamento.processar({
      pedidoId: pedidoFinal.id,
      valor: pedidoFinal.total,
      formaPagamento: formaPagamento,
      forcarRecusa: false,
    });

    pedidoFinal.transacaoId = resultado.transacaoId || null;
    pedidoFinal.statusPagamento = resultado.aprovado ? "Aprovado" : "Recusado";

    if (!resultado.aprovado) {
      pedidoFinal.status = "Pagamento recusado";
      pedidoFinal.statusPagamento = "Recusado";
      pedidoFinal.erroPagamento = resultado.motivo || "Pagamento recusado.";

      salvarPedido(pedidoFinal);
      localStorage.setItem("pedidoAtual", JSON.stringify(pedidoFinal));

      fecharModalPagamento();

      if (finalizarPedido) {
        finalizarPedido.disabled = false;
        finalizarPedido.textContent = "Tentar novamente";
      }

      alert(
        "❌ Pagamento recusado!\n\n" +
          pedidoFinal.erroPagamento +
          "\n\nPor favor, tente novamente.",
      );

      return;
    }

    pedidoFinal.status = "Recebido";
    registrarRecompensaUtilizada(pedidoFinal);
    adicionarPontosFidelidade(pedidoFinal);
    salvarPedido(pedidoFinal);

    localStorage.setItem("pedidoAtual", JSON.stringify(pedidoFinal));

    localStorage.removeItem("carrinho");

    if (statusPagamento) {
      statusPagamento.textContent = "✅ Pagamento aprovado! Pedido confirmado.";
    }

    setTimeout(() => {
      window.location.href = `acompanhamento.html?id=${encodeURIComponent(pedidoFinal.id)}`;
    }, 1000);
  } catch (erro) {
    console.error("Erro no pagamento:", erro);

    if (pedidoFinal) {
      pedidoFinal.status = "Erro no pagamento";
      pedidoFinal.statusPagamento = "Falhou";
      pedidoFinal.erroPagamento = erro?.message || "Erro desconhecido";

      salvarPedido(pedidoFinal);
      localStorage.setItem("pedidoAtual", JSON.stringify(pedidoFinal));
    }

    if (statusPagamento) {
      statusPagamento.textContent = "Não foi possível processar o pagamento.";
    }

    alert("Não foi possível processar o pagamento. Tente novamente.");

    if (finalizarPedido) {
      finalizarPedido.disabled = false;
      finalizarPedido.textContent = "Finalizar Pedido";
    }
  }
}

function atualizarBotaoConfirmar() {
  if (!finalizarPedido) return;

  const autorizaEnvioPagamento = document.getElementById(
    "autorizaEnvioPagamento",
  );

  const confirmaPrivacidadePagamento = document.getElementById(
    "confirmaPrivacidadePagamento",
  );

  const autorizado =
    autorizaEnvioPagamento?.checked === true &&
    confirmaPrivacidadePagamento?.checked === true;

  finalizarPedido.disabled = !autorizado;
}

document.addEventListener("DOMContentLoaded", () => {
  carregarCarrinho();
  carregarTipoConsumo();
  carregarFormulario();
  carregarRecompensas();
  atualizarResumoFidelidade();

  const autorizaEnvioPagamento = document.getElementById(
    "autorizaEnvioPagamento",
  );

  const confirmaPrivacidadePagamento = document.getElementById(
    "confirmaPrivacidadePagamento",
  );

  if (autorizaEnvioPagamento) {
    autorizaEnvioPagamento.addEventListener("change", atualizarBotaoConfirmar);
  }

  if (confirmaPrivacidadePagamento) {
    confirmaPrivacidadePagamento.addEventListener(
      "change",
      atualizarBotaoConfirmar,
    );
  }

  if (finalizarPedido) {
    finalizarPedido.addEventListener("click", processarPagamento);
    atualizarBotaoConfirmar();
  }
});
