(function () {
  "use strict";

  let pedidoSalvo = {};
  try {
    pedidoSalvo = JSON.parse(localStorage.getItem("pedido")) || {};
  } catch (erro) {
    console.error("Erro ao carregar pedido:", erro);
    pedidoSalvo = {};
  }

  const dadosPedido = {
    unidade: pedidoSalvo.unidade || "",
    consumo: pedidoSalvo.consumo || "",
    canal: pedidoSalvo.canal || "web",
  };

  const unidadeSelect = document.getElementById("unidade");
  const opcoes = document.querySelectorAll(".opcao");
  const botaoContinuar = document.getElementById("continuar");
  const NOME_BANCO = "RaizesDoNordesteDB";
  const VERSAO_BANCO = 1;
  const STORE_CAMPANHAS = "campanhas";
  let bancoCampanhas = null;

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
        console.error("Erro ao abrir banco de campanhas:", request.error);
        reject(request.error);
      };

      request.onblocked = function () {
        console.warn("A abertura do banco de campanhas foi bloqueada.");
      };
    });
  }

  async function obterCampanhasIndexedDB() {
    try {
      const banco = await abrirBancoCampanhas();
      return await new Promise((resolve, reject) => {
        const transacao = banco.transaction(STORE_CAMPANHAS, "readonly");
        const store = transacao.objectStore(STORE_CAMPANHAS);
        const request = store.getAll();

        request.onsuccess = function () {
          const campanhas = Array.isArray(request.result) ? request.result : [];
          resolve(campanhas);
        };

        request.onerror = function () {
          reject(request.error);
        };

        transacao.onerror = function () {
          reject(transacao.error);
        };
      });
    } catch (erro) {
      console.error("Erro ao obter campanhas do IndexedDB:", erro);
      return [];
    }
  }

  async function migrarCampanhasAntigas() {
    let campanhasAntigas = [];
    try {
      const dados = localStorage.getItem("campanhas");
      if (dados) {
        const campanhas = JSON.parse(dados);
        if (Array.isArray(campanhas)) {
          campanhasAntigas = campanhas.filter(
            (campanha) => campanha && campanha.id,
          );
        }
      }
    } catch (erro) {
      console.error("Erro ao ler campanhas antigas do localStorage:", erro);
      return [];
    }

    if (campanhasAntigas.length === 0) {
      return [];
    }

    try {
      const banco = await abrirBancoCampanhas();
      await new Promise((resolve, reject) => {
        const transacao = banco.transaction(STORE_CAMPANHAS, "readwrite");
        const store = transacao.objectStore(STORE_CAMPANHAS);
        campanhasAntigas.forEach((campanha) => {
          store.put(campanha);
        });

        transacao.oncomplete = resolve;
        transacao.onerror = function () {
          reject(transacao.error);
        };

        transacao.onabort = function () {
          reject(transacao.error || new Error("Migração cancelada."));
        };
      });

      localStorage.removeItem("campanhas");
      return campanhasAntigas;
    } catch (erro) {
      console.error("Erro ao migrar campanhas antigas:", erro);
      return [];
    }
  }

  async function sincronizarCampanhasComBanco() {
    let campanhasBanco = await obterCampanhasIndexedDB();
    if (campanhasBanco.length > 0) {
      return campanhasBanco;
    }

    const campanhasMigradas = await migrarCampanhasAntigas();
    if (campanhasMigradas.length > 0) {
      campanhasBanco = await obterCampanhasIndexedDB();

      if (campanhasBanco.length > 0) {
        return campanhasBanco;
      }

      return campanhasMigradas;
    }
    return [];
  }

  function obterPedidoSalvo() {
    try {
      return JSON.parse(localStorage.getItem("pedido")) || {};
    } catch (erro) {
      console.error("Erro ao carregar pedido:", erro);
      return {};
    }
  }

  function salvarDados() {
    try {
      localStorage.setItem("pedido", JSON.stringify(dadosPedido));
    } catch (erro) {
      console.error("Erro ao salvar pedido:", erro);
    }
  }

  function formatCurrency(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function escaparHTML(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function obterUnidades() {
    if (typeof MOCK_UNIDADES !== "undefined" && Array.isArray(MOCK_UNIDADES)) {
      return MOCK_UNIDADES;
    }

    if (window.RAIZES_MOCK && Array.isArray(window.RAIZES_MOCK.units)) {
      return window.RAIZES_MOCK.units;
    }
    return [
      {
        id: "recife",
        nome: "Recife",
      },
      {
        id: "joaopessoa",
        nome: "João Pessoa",
      },
      {
        id: "fortaleza",
        nome: "Fortaleza",
      },
      {
        id: "natal",
        nome: "Natal",
      },
    ];
  }

  function obterNomeUnidade(unitId) {
    const unidades = obterUnidades();
    const unidadeEncontrada = unidades.find(
      (unidade) => String(unidade.id) === String(unitId),
    );

    return unidadeEncontrada
      ? unidadeEncontrada.nome || unidadeEncontrada.name || unitId
      : "Toda a rede";
  }

  window.RaizesApp = {
    getUnits() {
      return obterUnidades();
    },

    getCurrentUnit() {
      const pedidoAtual = obterPedidoSalvo();
      return (
        obterUnidades().find(
          (unidade) => String(unidade.id) === String(pedidoAtual.unidade),
        ) || null
      );
    },

    getCurrentUnitId() {
      return obterPedidoSalvo().unidade || "";
    },

    setCurrentUnitId(unitId) {
      dadosPedido.unidade = unitId;
      salvarDados();
      renderizarCampanhasHome();
    },

    getCurrentChannel() {
      return obterPedidoSalvo().canal || "web";
    },

    setCurrentChannel(channel) {
      dadosPedido.canal = channel;
      salvarDados();
    },

    getCurrentServiceMode() {
      return obterPedidoSalvo().consumo || "retirada";
    },

    setCurrentServiceMode(serviceMode) {
      dadosPedido.consumo = serviceMode;
      salvarDados();
    },

    formatCurrency,

    showToast(mensagem) {
      let toast = document.getElementById("raizes-toast");
      if (!toast) {
        toast = document.createElement("div");
        toast.id = "raizes-toast";
        toast.style.position = "fixed";
        toast.style.bottom = "25px";
        toast.style.left = "50%";
        toast.style.transform = "translateX(-50%)";
        toast.style.background = "#365e57";
        toast.style.color = "#fff";
        toast.style.padding = "14px 22px";
        toast.style.borderRadius = "10px";
        toast.style.fontSize = "14px";
        toast.style.fontWeight = "500";
        toast.style.zIndex = "9999";
        toast.style.boxShadow = "0 8px 25px rgba(0,0,0,0.2)";
        document.body.appendChild(toast);
      }

      toast.textContent = mensagem;
      toast.style.display = "block";
      clearTimeout(toast._timeout);
      toast._timeout = setTimeout(() => {
        toast.style.display = "none";
      }, 2200);
    },
  };

  function atualizarBotao() {
    if (!botaoContinuar) {
      return;
    }

    if (dadosPedido.unidade !== "" && dadosPedido.consumo !== "") {
      botaoContinuar.classList.remove("disabled");
    } else {
      botaoContinuar.classList.add("disabled");
    }
  }

  function carregarDadosSalvos() {
    const pedidoAtual = obterPedidoSalvo();
    dadosPedido.unidade = pedidoAtual.unidade || "";
    dadosPedido.consumo = pedidoAtual.consumo || "";
    dadosPedido.canal = pedidoAtual.canal || "web";
    if (unidadeSelect) {
      unidadeSelect.value = dadosPedido.unidade;
    }

    opcoes.forEach((opcao) => {
      if (opcao.dataset.tipo === dadosPedido.consumo) {
        opcao.classList.add("ativo");
      }
    });

    atualizarBotao();
  }

  if (unidadeSelect) {
    unidadeSelect.addEventListener("change", () => {
      dadosPedido.unidade = unidadeSelect.value;
      salvarDados();
      atualizarBotao();
      renderizarCampanhasHome();
    });
  }

  opcoes.forEach((opcao) => {
    opcao.addEventListener("click", () => {
      opcoes.forEach((item) => {
        item.classList.remove("ativo");
      });

      opcao.classList.add("ativo");
      dadosPedido.consumo = opcao.dataset.tipo;
      salvarDados();
      atualizarBotao();
    });
  });

  if (botaoContinuar) {
    botaoContinuar.addEventListener("click", () => {
      if (botaoContinuar.classList.contains("disabled")) {
        return;
      }

      switch (dadosPedido.consumo) {
        case "local":

        case "consumo":
          window.location.href = "cardapio.html?tipo=local";
          break;

        case "retirada":
          window.location.href = "cardapio.html?tipo=retirada";
          break;

        case "delivery":
          window.location.href = "cardapio.html?tipo=delivery";
          break;

        default:
          alert("Selecione uma forma de consumo.");
      }
    });
  }

  let usuario = null;
  try {
    usuario = JSON.parse(localStorage.getItem("usuarioLogado")) || null;
  } catch (erro) {
    console.error("Erro ao carregar usuário:", erro);
  }

  const areaLogado = document.getElementById("usuarioLogado");
  const areaDeslogado = document.getElementById("usuarioDeslogado");
  const nomeUsuario = document.getElementById("nomeUsuario");
  const btnConta = document.getElementById("btnConta");
  const menuConta = document.getElementById("menuConta");
  const sairConta = document.getElementById("sairConta");
  if (usuario && usuario.tipo !== "admin") {
    if (areaLogado) {
      areaLogado.style.display = "block";
    }

    if (areaDeslogado) {
      areaDeslogado.style.display = "none";
    }

    if (nomeUsuario) {
      nomeUsuario.textContent = usuario.nome
        ? usuario.nome.split(" ")[0]
        : "Cliente";
    }
  } else {
    if (areaLogado) {
      areaLogado.style.display = "none";
    }

    if (areaDeslogado) {
      areaDeslogado.style.display = "flex";
    }
  }

  if (btnConta && menuConta) {
    btnConta.addEventListener("click", (evento) => {
      evento.stopPropagation();
      menuConta.classList.toggle("ativo");
    });

    document.addEventListener("click", (evento) => {
      if (
        !btnConta.contains(evento.target) &&
        !menuConta.contains(evento.target)
      ) {
        menuConta.classList.remove("ativo");
      }
    });
  }

  if (sairConta) {
    sairConta.addEventListener("click", (evento) => {
      evento.preventDefault();
      localStorage.removeItem("usuarioLogado");
      window.location.reload();
    });
  }

  carregarDadosSalvos();

  async function obterCampanhasHome() {
    try {
      const campanhas = await sincronizarCampanhasComBanco();
      if (!Array.isArray(campanhas)) {
        return [];
      }

      const pedidoAtual = obterPedidoSalvo();
      const unidadeAtual = String(pedidoAtual.unidade || "").trim();
      const campanhasValidas = campanhas.filter((campanha) => {
        if (!campanha) {
          return false;
        }

        if (campanha.ativa === false) {
          return false;
        }

        return true;
      });

      const campanhasFiltradas = campanhasValidas.filter((campanha) => {
        return campanha;
      });

      return campanhasFiltradas.sort((a, b) => {
        const unitA = String(a.unitId || a.unidadeId || "all");
        const unitB = String(b.unitId || b.unidadeId || "all");
        const especificaA =
          unidadeAtual !== "" && unitA === unidadeAtual ? 1 : 0;

        const especificaB =
          unidadeAtual !== "" && unitB === unidadeAtual ? 1 : 0;
        if (especificaA !== especificaB) {
          return especificaB - especificaA;
        }
        return obterDataCampanha(b) - obterDataCampanha(a);
      });
    } catch (erro) {
      console.error("Erro ao carregar campanhas:", erro);
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

  function obterImagemCampanha(campanha) {
    const imagem =
      campanha.imagem ||
      campanha.image ||
      campanha.imagemUrl ||
      campanha.imageUrl ||
      "";

    return String(imagem).trim();
  }

  function formatarMoedaHome(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  async function renderizarCampanhasHome() {
    const secao = document.getElementById("campanhas-section");
    const lista = document.getElementById("campanhas-home-lista");
    if (!secao || !lista) {
      return;
    }

    const campanhas = await obterCampanhasHome();
    lista.innerHTML = "";
    if (!campanhas || campanhas.length === 0) {
      secao.style.display = "none";
      return;
    }

    secao.style.display = "block";
    campanhas.forEach((campanha) => {
      const titulo = campanha.titulo || campanha.title || "Campanha Especial";
      const descricao =
        campanha.descricao ||
        campanha.description ||
        "Aproveite esta oferta especial da Raízes do Nordeste.";

      const imagem = obterImagemCampanha(campanha);
      const desconto = Number(
        campanha.desconto ??
          campanha.discountRate ??
          campanha.descontoPercentual ??
          0,
      );

      const pedidoMinimo = Number(
        campanha.pedidoMinimo ?? campanha.minimumOrder ?? 0,
      );

      const unidadeCampanha = String(
        campanha.unitId || campanha.unidadeId || "all",
      ).trim();

      const unidadeTexto =
        unidadeCampanha !== "all" && unidadeCampanha !== ""
          ? `📍 Oferta válida na unidade de ${obterNomeUnidade(
              unidadeCampanha,
            )}.`
          : "";

      const card = document.createElement("article");
      card.className = "campanha-home-card";
      card.innerHTML = `
          <div class="campanha-home-imagem">
            ${
              imagem
                ? `
                  <img
                    src="${escaparHTML(imagem)}"
                    alt="${escaparHTML(titulo)}"
                    onerror="this.style.display='none'; this.parentElement.classList.add('imagem-indisponivel');"
                  >
                `
                : `
                  <div class="imagem-indisponivel">
                    <span>Imagem não disponível</span>
                  </div>
                `
            }

            ${
              desconto > 0
                ? `
                  <span class="campanha-home-badge">
                    ${escaparHTML(desconto)}% off
                  </span>
                `
                : ""
            }
          </div>

          <div class="campanha-home-conteudo">
            <div class="campanha-home-titulo-card">
              <h3>
                ${escaparHTML(titulo)}
              </h3>
            </div>

            <p>
              ${escaparHTML(descricao)}
            </p>

            ${
              unidadeTexto
                ? `
                  <small class="campanha-home-unidade">
                    ${escaparHTML(unidadeTexto)}
                  </small>
                `
                : ""
            }

            ${
              pedidoMinimo > 0
                ? `
                  <span class="campanha-home-minimo">
                    Pedido mínimo:
                    ${formatarMoedaHome(pedidoMinimo)}
                  </span>
                `
                : ""
            }
          </div>
        `;
      lista.appendChild(card);
    });
  }

  async function restaurarCampanhas() {
    try {
      await renderizarCampanhasHome();
    } catch (erro) {
      console.error("Erro ao restaurar campanhas:", erro);
      const secao = document.getElementById("campanhas-section");
      if (secao) {
        secao.style.display = "none";
      }
    }
  }

  async function inicializarCampanhas() {
    await restaurarCampanhas();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarCampanhas, {
      once: true,
    });
  } else {
    inicializarCampanhas();
  }

  window.addEventListener("storage", (evento) => {
    if (evento.key === "pedido") {
      renderizarCampanhasHome();
    }
  });
})();
