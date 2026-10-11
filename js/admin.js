(function () {
  "use strict";
  const statsTarget = document.getElementById("admin-stats");
  const ordersTarget = document.getElementById("admin-orders");
  const privacyTarget = document.getElementById("privacy-panel");
  const unitsTarget = document.getElementById("admin-units");
  const campaignForm = document.getElementById("campaign-form");
  const campaignListTarget = document.getElementById("campaign-list");
  const campaignSubmit = document.getElementById("campaignSubmit");
  const campaignCancel = document.getElementById("campaignCancel");
  const campaignFormTitle = document.getElementById("campaign-form-title");

  let campanhaEditandoId = null;
  let campanhasEmMemoria = [];

  const NOME_BANCO = "RaizesDoNordesteDB";
  const VERSAO_BANCO = 1;
  const NOME_STORE = "campanhas";

  function abrirBancoCampanhas() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB não é suportado neste navegador."));
        return;
      }

      const request = indexedDB.open(NOME_BANCO, VERSAO_BANCO);
      request.onupgradeneeded = function (evento) {
        const banco = evento.target.result;
        if (!banco.objectStoreNames.contains(NOME_STORE)) {
          banco.createObjectStore(NOME_STORE, {
            keyPath: "id",
          });
        }
      };

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function () {
        console.error("Erro ao abrir o banco de campanhas:", request.error);
        reject(request.error);
      };
    });
  }

  async function obterCampanhasBanco() {
    const banco = await abrirBancoCampanhas();
    return new Promise((resolve, reject) => {
      const transacao = banco.transaction(NOME_STORE, "readonly");
      const store = transacao.objectStore(NOME_STORE);
      const request = store.getAll();
      request.onsuccess = function () {
        resolve(Array.isArray(request.result) ? request.result : []);
      };

      request.onerror = function () {
        reject(request.error);
      };

      transacao.oncomplete = function () {
        banco.close();
      };

      transacao.onerror = function () {
        banco.close();
      };
    });
  }

  async function salvarCampanhaBanco(campanha) {
    const banco = await abrirBancoCampanhas();
    return new Promise((resolve, reject) => {
      const transacao = banco.transaction(NOME_STORE, "readwrite");
      const store = transacao.objectStore(NOME_STORE);
      store.put(campanha);

      transacao.oncomplete = function () {
        banco.close();
        resolve();
      };

      transacao.onerror = function () {
        const erro = transacao.error;
        banco.close();
        reject(erro);
      };

      transacao.onabort = function () {
        const erro = transacao.error || new Error("Transação cancelada.");
        banco.close();
        reject(erro);
      };
    });
  }

  async function excluirCampanhaBanco(id) {
    const banco = await abrirBancoCampanhas();
    return new Promise((resolve, reject) => {
      const transacao = banco.transaction(NOME_STORE, "readwrite");
      const store = transacao.objectStore(NOME_STORE);

      store.delete(id);

      transacao.oncomplete = function () {
        banco.close();
        resolve();
      };

      transacao.onerror = function () {
        const erro = transacao.error;
        banco.close();
        reject(erro);
      };

      transacao.onabort = function () {
        const erro = transacao.error || new Error("Transação cancelada.");
        banco.close();
        reject(erro);
      };
    });
  }

  async function sincronizarCampanhasPersistentes() {
    try {
      const campanhasBanco = await obterCampanhasBanco();
      if (campanhasBanco.length > 0) {
        campanhasEmMemoria = campanhasBanco;
        return campanhasBanco;
      }

      let campanhasAntigas = [];
      try {
        const dados = JSON.parse(localStorage.getItem("campanhas"));
        if (Array.isArray(dados)) {
          campanhasAntigas = dados.filter(
            (campanha) => campanha && campanha.id,
          );
        }
      } catch (erro) {
        console.error("Erro ao ler campanhas antigas:", erro);
      }

      if (campanhasAntigas.length > 0) {
        for (const campanha of campanhasAntigas) {
          await salvarCampanhaBanco(campanha);
        }

        campanhasEmMemoria = campanhasAntigas;

        try {
          localStorage.removeItem("campanhas");
        } catch (erro) {
          console.error("Erro ao remover campanhas antigas:", erro);
        }

        return campanhasAntigas;
      }

      campanhasEmMemoria = [];
      return [];
    } catch (erro) {
      console.error("Erro ao sincronizar campanhas:", erro);
      campanhasEmMemoria = [];
      return [];
    }
  }

  function obterPedidos() {
    try {
      const pedidos = JSON.parse(localStorage.getItem("pedidos"));
      return Array.isArray(pedidos) ? pedidos : [];
    } catch (erro) {
      console.error("Erro ao carregar pedidos:", erro);

      return [];
    }
  }

  function obterUsuarios() {
    try {
      const usuarios = JSON.parse(localStorage.getItem("usuarios"));
      return Array.isArray(usuarios) ? usuarios : [];
    } catch (erro) {
      console.error("Erro ao carregar usuários:", erro);

      return [];
    }
  }

  function obterCampanhas() {
    return Array.isArray(campanhasEmMemoria) ? campanhasEmMemoria : [];
  }

  function usuarioAceitouLGPD(usuario) {
    if (!usuario) {
      return false;
    }

    if (usuario.aceiteLGPD === true || usuario.aceiteLGPD === "true") {
      return true;
    }

    if (usuario.aceiteLGPD && usuario.aceiteLGPD.autorizado === true) {
      return true;
    }

    if (
      usuario.consentimentoLGPD === true ||
      usuario.consentimentoLGPD === "true"
    ) {
      return true;
    }

    if (usuario.lgpd === true || usuario.lgpd === "true") {
      return true;
    }

    if (usuario.consentimento === true || usuario.consentimento === "true") {
      return true;
    }

    return false;
  }

  function obterConsentimento() {
    const usuarios = obterUsuarios();
    const usuariosComConsentimento = usuarios.filter((usuario) =>
      usuarioAceitouLGPD(usuario),
    );

    return {
      aceito: usuariosComConsentimento.length > 0,
      quantidade: usuariosComConsentimento.length,
      total: usuarios.length,
    };
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
        rating: "4.8",
        taxaEntrega: 6.5,
      },
      {
        id: "joaopessoa",
        nome: "João Pessoa",
        rating: "4.7",
        taxaEntrega: 5.5,
      },
      {
        id: "fortaleza",
        nome: "Fortaleza",
        rating: "4.9",
        taxaEntrega: 7,
      },
      {
        id: "natal",
        nome: "Natal",
        rating: "4.6",
        taxaEntrega: 6,
      },
    ];
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarData(data) {
    if (!data) {
      return "Data não informada";
    }

    const dataFormatada = new Date(data);

    if (isNaN(dataFormatada.getTime())) {
      return String(data);
    }

    return dataFormatada.toLocaleString("pt-BR");
  }

  function obterValorPedido(pedido) {
    if (!pedido) {
      return 0;
    }

    const possiveisTotais = [
      pedido.total,
      pedido.valor,
      pedido.valorTotal,
      pedido.totals?.total,
      pedido.resumo?.total,
    ];

    for (const valor of possiveisTotais) {
      const numero = Number(valor);

      if (Number.isFinite(numero) && numero > 0) {
        return Number(numero.toFixed(2));
      }
    }

    if (Array.isArray(pedido.itens)) {
      let subtotal = 0;

      pedido.itens.forEach((item) => {
        const quantidade = Number(item.quantidade || 1);
        const preco = Number(item.preco ?? item.valor ?? item.price ?? 0);

        let extras = 0;

        if (Array.isArray(item.extras)) {
          item.extras.forEach((extra) => {
            extras += Number(extra.preco ?? extra.valor ?? extra.price ?? 0);
          });
        }

        subtotal += (preco + extras) * quantidade;
      });

      const desconto = Number(pedido.desconto ?? pedido.descontoTotal ?? 0);

      const descontoCampanha = Number(pedido.descontoCampanha ?? 0);

      const descontoRecompensa = Number(pedido.descontoRecompensa ?? 0);

      const taxaEntrega = Number(
        pedido.taxaEntrega ?? pedido.frete ?? pedido.deliveryFee ?? 0,
      );

      const total = Math.max(
        0,
        subtotal -
          desconto -
          descontoCampanha -
          descontoRecompensa +
          taxaEntrega,
      );

      return Number(total.toFixed(2));
    }

    return 0;
  }

  function obterStatusPedido(pedido) {
    return pedido.status || "Recebido";
  }

  function obterClientePedido(pedido) {
    if (!pedido) {
      return "Cliente visitante";
    }

    const possiveisClientes = [
      pedido.cliente,
      pedido.nomeCliente,
      pedido.nome,
      pedido.nomeUsuario,
      pedido.usuarioNome,
      pedido.dadosCliente?.nome,
      pedido.dadosCliente?.nomeCompleto,
      pedido.cliente?.nome,
      pedido.cliente?.nomeCompleto,
      pedido.cliente?.name,
      pedido.usuario?.nome,
      pedido.usuario?.nomeCompleto,
      pedido.usuario?.name,
      pedido.usuarioLogado?.nome,
      pedido.usuarioLogado?.nomeCompleto,
      pedido.usuarioLogado?.name,
    ];

    for (const cliente of possiveisClientes) {
      if (typeof cliente === "string" && cliente.trim()) {
        return cliente.trim();
      }

      if (cliente && typeof cliente === "object") {
        const nome =
          cliente.nome || cliente.nomeCompleto || cliente.name || cliente.email;

        if (nome) {
          return String(nome);
        }
      }
    }

    return "Cliente visitante";
  }

  function obterDataPedido(pedido) {
    if (!pedido) {
      return null;
    }

    const possiveisDatas = [
      pedido.data,
      pedido.createdAt,
      pedido.dataCriacao,
      pedido.criadoEm,
      pedido.dataPedido,
      pedido.dataHora,
      pedido.created_at,
      pedido.created,
      pedido.timestamp,
      pedido.date,
    ];

    for (const data of possiveisDatas) {
      if (data !== undefined && data !== null && String(data).trim() !== "") {
        const dataValida = new Date(data);

        if (!isNaN(dataValida.getTime())) {
          return data;
        }
      }
    }

    // Recupera a data dos pedidos antigos através do ID.
    // Exemplo: pedido-1791234031172
    if (pedido.id) {
      const partes = String(pedido.id).split("-");
      const possivelTimestamp = Number(partes[partes.length - 1]);

      if (
        Number.isFinite(possivelTimestamp) &&
        possivelTimestamp > 1000000000000
      ) {
        const dataDoId = new Date(possivelTimestamp);

        if (!isNaN(dataDoId.getTime())) {
          return dataDoId;
        }
      }
    }

    return null;
  }

  function obterNomeUnidade(unidade) {
    if (!unidade) {
      return "Toda a rede";
    }

    if (typeof unidade === "string") {
      const unidadeEncontrada = obterUnidades().find(
        (item) => item.id === unidade,
      );

      return unidadeEncontrada
        ? unidadeEncontrada.nome || unidadeEncontrada.name || unidade
        : unidade;
    }

    return unidade.nome || unidade.name || unidade.id;
  }

  function obterAvaliacaoUnidade(unidade) {
    return unidade.rating || unidade.avaliacao || "4.8";
  }

  function obterTaxaEntrega(unidade) {
    return Number(
      unidade.taxaEntrega || unidade.deliveryFee || unidade.frete || 0,
    );
  }

  function renderizarEstatisticas() {
    const pedidos = obterPedidos();
    const campanhas = obterCampanhas();
    const campanhasAtivas = campanhas.filter(
      (campanha) => campanha.ativa !== false,
    );

    const pedidosValidos = pedidos.filter(
      (pedido) => obterStatusPedido(pedido) !== "Cancelado",
    );

    const faturamento = pedidosValidos.reduce(
      (total, pedido) => total + obterValorPedido(pedido),
      0,
    );

    const ticketMedio = pedidosValidos.length
      ? faturamento / pedidosValidos.length
      : 0;

    const consentimento = obterConsentimento();
    const estatisticas = [
      {
        valor: pedidos.length,
        label: "Pedidos monitorados",
      },
      {
        valor: formatarMoeda(ticketMedio),
        label: "Ticket médio",
      },
      {
        valor: campanhasAtivas.length,
        label: "Campanhas ativas",
      },
      {
        valor: consentimento.quantidade,
        label: "Consentimentos LGPD",
      },
    ];

    statsTarget.innerHTML = estatisticas
      .map((estatistica) => {
        return `
              <article class="stat-card">
                <strong>
                  ${estatistica.valor}
                </strong>

                <span>
                  ${estatistica.label}
                </span>
              </article>
            `;
      })
      .join("");
  }

  function renderizarPedidos() {
    const pedidos = obterPedidos().slice().reverse().slice(0, 5);
    ordersTarget.innerHTML = `
      <div class="section-heading">
        <div>
          <p class="eyebrow">
            Fila operacional
          </p>

          <h2>
            Pedidos recentes
          </h2>
        </div>
      </div>

      ${
        pedidos.length
          ? pedidos
              .map((pedido) => {
                const status = obterStatusPedido(pedido);
                return `
                    <article class="order-card">
                      <div class="card-title-row">
                        <h3>#${pedido.id || "0000"}</h3>
                        <span class="tag ${status === "Entregue" ? "is-success" : ""}">${status}</span>
                      </div>

                      <p>
                        ${obterClientePedido(pedido)}
                        •
                        ${formatarMoeda(obterValorPedido(pedido))}
                      </p>

                      <p class="muted-text">${pedido.tipo || pedido.serviceMode || pedido.consumo || "Pedido"}•${formatarData(obterDataPedido(pedido))}</p>
                    </article>
                  `;
              })
              .join("")
          : `
            <div class="empty-state">Ops... Nenhum pedido encontrado. Os pedidos realizados pelos clientes aparecerão aqui.</div>
          `
      }
    `;
  }

  function renderizarPainelPrivacidade() {
    const consentimento = obterConsentimento();
    const percentual =
      consentimento.total > 0
        ? Math.round((consentimento.quantidade / consentimento.total) * 100)
        : 0;

    privacyTarget.innerHTML = `
      <div class="section-heading">
        <div>
          <p class="eyebrow">
            Privacidade e qualidade
          </p>

          <h2>
            Painel LGPD
          </h2>
        </div>
      </div>

      <div class="info-card">
        <h3>
          Status do consentimento
        </h3>

        <p>
          ${
            consentimento.quantidade > 0
              ? `${consentimento.quantidade} cliente(s) possuem consentimento LGPD registrado.`
              : "Nenhum consentimento LGPD foi registrado até o momento."
          }
        </p>

        <p class="muted-text">
          ${
            consentimento.total > 0
              ? `${consentimento.quantidade} de ${consentimento.total} cliente(s) cadastrados.`
              : "Nenhum cliente cadastrado."
          }
        </p>
      </div>

      <article class="info-card">
       <h3>Consentimento dos clientes</h3>

       <p>${percentual}% dos clientes possuem consentimento registrado.</p>

      </article>

      <article class="info-card">
       <h3>Controle de acesso</h3>

       <p>Os dados usados nesse site são armazenados localmente no navegador para simulação do sistema.</p>
       
      </article>
    `;
  }

  function renderizarUnidades() {
    const unidades = obterUnidades();
    const campanhas = obterCampanhas();
    unitsTarget.innerHTML = `
      <div class="section-heading">
        <div>
          <p class="eyebrow">
            Desempenho por unidade
          </p>

          <h2>
            Visão resumida da rede
          </h2>
        </div>
      </div>

      ${unidades
        .map((unidade) => {
          const campanhasVisiveis = campanhas.filter((campanha) => {
            return (
              campanha.ativa !== false &&
              (campanha.unitId === unidade.id || campanha.unitId === "all")
            );
          }).length;

          return `
              <article class="unit-card">
                <div class="card-title-row">
                  <h3>
                    ${obterNomeUnidade(unidade)}
                  </h3>

                  <span class="tag">
                    ⭐ ${obterAvaliacaoUnidade(unidade)}
                  </span>
                </div>

                <p>
                  Frete
                  ${formatarMoeda(obterTaxaEntrega(unidade))}
                </p>

                <p class="muted-text">
                  ${campanhasVisiveis}
                  campanha(s) ativa(s)
                </p>
              </article>
            `;
        })
        .join("")}
    `;
  }

  function preencherSelectUnidades() {
    const selectUnidade = campaignForm.querySelector('[name="unitId"]');
    if (!selectUnidade) {
      return;
    }

    const unidades = obterUnidades();
    selectUnidade.innerHTML = `
      <option value="all">
        Toda a rede
      </option>

      ${unidades
        .map((unidade) => {
          return `
              <option value="${unidade.id}">
                ${obterNomeUnidade(unidade)}
              </option>
            `;
        })
        .join("")}
    `;
  }

  function escaparHTML(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderizarCampanhas() {
    if (!campaignListTarget) {
      return;
    }

    const campanhas = obterCampanhas();
    const campanhasOrdenadas = campanhas.slice().sort((a, b) => {
      const dataA = Date.parse(a.createdAt || a.dataCriacao || "");
      const dataB = Date.parse(b.createdAt || b.dataCriacao || "");
      return (
        (Number.isNaN(dataB) ? 0 : dataB) - (Number.isNaN(dataA) ? 0 : dataA)
      );
    });

    campaignListTarget.innerHTML = `
      <div class="section-heading">
        <div>
          <p class="eyebrow">
            CAMPANHAS
          </p>

          <h2>
            Campanhas cadastradas
          </h2>
        </div>
      </div>

      ${
        campanhasOrdenadas.length === 0
          ? `
            <div class="empty-state">
              Nenhuma campanha cadastrada.
            </div>
          `
          : `
            ${campanhasOrdenadas
              .map((campanha) => {
                const titulo = campanha.titulo || campanha.title || "Campanha";
                const descricao =
                  campanha.descricao || campanha.description || "";

                const imagem = campanha.imagem || campanha.image || "";
                const desconto = Number(
                  campanha.desconto ?? campanha.discountRate ?? 0,
                );

                const pedidoMinimo = Number(
                  campanha.pedidoMinimo ?? campanha.minimumOrder ?? 0,
                );

                const unidade =
                  campanha.unitId && campanha.unitId !== "all"
                    ? obterNomeUnidade(campanha.unitId)
                    : "Toda a rede";

                const status = campanha.ativa !== false;
                return `
                    <article class="campaign-card">
                      <div class="card-title-row">
                        <div>
                          <h3>
                            ${escaparHTML(titulo)}
                          </h3>

                          <p class="muted-text">
                            ${escaparHTML(descricao)}
                          </p>
                        </div>

                        <span class="tag ${status ? "is-success" : ""}">
                          ${status ? "Ativa" : "Inativa"}
                        </span>
                      </div>

                      ${
                        imagem
                          ? `
                            <div class="campaign-image-admin">
                              <img
                                src="${escaparHTML(imagem)}"
                                alt="${escaparHTML(titulo)}"
                              >
                            </div>
                          `
                          : `
                            <div class="campaign-image-admin campaign-image-sem-imagem">
                              <span>Nenhuma imagem cadastrada</span>
                            </div>
                          `
                      }

                      <div class="campaign-details">
                        <span>
                          📍 ${escaparHTML(unidade)}
                        </span>

                        <span>
                          🏷️ ${desconto}% off
                        </span>

                        ${
                          pedidoMinimo > 0
                            ? `
                              <span>
                                🛒 Pedido mínimo:
                                ${formatarMoeda(pedidoMinimo)}
                              </span>
                            `
                            : ""
                        }
                      </div>

                      <p class="muted-text">
                        Criada em:
                        ${formatarData(
                          campanha.createdAt || campanha.dataCriacao,
                        )}
                      </p>

                      <div class="campaign-actions">
                        <button
                          type="button"
                          class="button button-secondary"
                          data-editar-campanha="${escaparHTML(campanha.id)}"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          class="button button-danger"
                          data-excluir-campanha="${escaparHTML(campanha.id)}"
                        >
                          Excluir
                        </button>
                      </div>
                    </article>
                  `;
              })
              .join("")}
          `
      }
    `;

    const botoesEditar = campaignListTarget.querySelectorAll(
      "[data-editar-campanha]",
    );

    botoesEditar.forEach((botao) => {
      botao.addEventListener("click", () => {
        editarCampanha(botao.dataset.editarCampanha);
      });
    });

    const botoesExcluir = campaignListTarget.querySelectorAll(
      "[data-excluir-campanha]",
    );

    botoesExcluir.forEach((botao) => {
      botao.addEventListener("click", () => {
        excluirCampanha(botao.dataset.excluirCampanha);
      });
    });
  }

  function editarCampanha(id) {
    const campanhas = obterCampanhas();
    const campanha = campanhas.find((item) => item.id === id);
    if (!campanha) {
      return;
    }

    campanhaEditandoId = id;
    campaignFormTitle.textContent = "Editar campanha";
    campaignSubmit.textContent = "Salvar alterações";
    if (campaignCancel) {
      campaignCancel.style.display = "inline-flex";
    }

    campaignForm.querySelector('[name="title"]').value =
      campanha.titulo || campanha.title || "";

    campaignForm.querySelector('[name="description"]').value =
      campanha.descricao || campanha.description || "";

    const campoImagem = document.getElementById("campaign-image");
    const campoImagemValue = document.getElementById("campaign-image-value");
    if (campoImagem) {
      campoImagem.value = "";
    }

    if (campoImagemValue) {
      campoImagemValue.value = campanha.imagem || campanha.image || "";
    }

    campaignForm.querySelector('[name="unitId"]').value =
      campanha.unitId || "all";

    campaignForm.querySelector('[name="discountRate"]').value =
      campanha.desconto ?? campanha.discountRate ?? 0;

    campaignForm.querySelector('[name="minimumOrder"]').value =
      campanha.pedidoMinimo ?? campanha.minimumOrder ?? 0;

    atualizarPreviewImagem();

    campaignForm.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function cancelarEdicao() {
    campanhaEditandoId = null;
    campaignForm.reset();
    campaignFormTitle.textContent = "Criar campanha";
    campaignSubmit.textContent = "Criar campanha";

    if (campaignCancel) {
      campaignCancel.style.display = "none";
    }

    const selectUnidade = campaignForm.querySelector('[name="unitId"]');
    if (selectUnidade) {
      selectUnidade.value = "all";
    }

    const campoImagemValue = document.getElementById("campaign-image-value");
    if (campoImagemValue) {
      campoImagemValue.value = "";
    }

    limparPreviewImagem();
  }

  function lerArquivoComoDataURL(arquivo) {
    return new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onload = function () {
        resolve(leitor.result);
      };

      leitor.onerror = function () {
        reject(new Error("Não foi possível ler a imagem."));
      };

      leitor.readAsDataURL(arquivo);
    });
  }

  async function salvarNovaCampanha(event) {
    event.preventDefault();
    const dados = new FormData(campaignForm);
    const titulo = String(dados.get("title") || "").trim();
    const descricao = String(dados.get("description") || "").trim();
    const unidade = String(dados.get("unitId") || "all");
    const desconto = Number(dados.get("discountRate") || 0);
    const pedidoMinimo = Number(dados.get("minimumOrder") || 0);
    const arquivoImagem = dados.get("imageFile");
    const campoImagemValue = document.getElementById("campaign-image-value");
    let imagem = campoImagemValue ? campoImagemValue.value.trim() : "";

    if (!titulo) {
      alert("Informe o título da campanha.");
      return;
    }

    if (!descricao) {
      alert("Informe a descrição da campanha.");
      return;
    }

    if (
      arquivoImagem &&
      arquivoImagem instanceof File &&
      arquivoImagem.size > 0
    ) {
      if (!arquivoImagem.type.startsWith("image/")) {
        alert("Selecione um arquivo de imagem válido.");
        return;
      }

      try {
        imagem = await lerArquivoComoDataURL(arquivoImagem);
      } catch (erro) {
        console.error(erro);
        alert("Não foi possível carregar a imagem.");
        return;
      }
    }

    if (!imagem) {
      alert("Selecione uma imagem para a campanha.");
      return;
    }

    if (desconto < 0 || desconto > 100) {
      alert("O desconto deve estar entre 0% e 100%.");
      return;
    }

    if (pedidoMinimo < 0) {
      alert("O pedido mínimo não pode ser negativo.");
      return;
    }

    if (campanhaEditandoId) {
      const campanhas = obterCampanhas();
      const indice = campanhas.findIndex(
        (campanha) => campanha.id === campanhaEditandoId,
      );

      if (indice === -1) {
        alert("Campanha não encontrada.");
        return;
      }

      const campanhaAtual = campanhas[indice];
      const campanhaAtualizada = {
        ...campanhaAtual,
        titulo,
        title: titulo,
        descricao,
        description: descricao,
        imagem,
        image: imagem,
        unitId: unidade,
        desconto,
        discountRate: desconto,
        pedidoMinimo,
        minimumOrder: pedidoMinimo,
      };

      try {
        await salvarCampanhaBanco(campanhaAtualizada);
        campanhas[indice] = campanhaAtualizada;
        campanhasEmMemoria = campanhas;
        alert("Campanha atualizada com sucesso!");
      } catch (erro) {
        console.error("Erro ao atualizar campanha:", erro);
        alert("Não foi possível atualizar a campanha.");
        return;
      }
    } else {
      const agora = new Date().toISOString();
      const novaCampanha = {
        id: `campanha-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        titulo,
        title: titulo,
        descricao,
        description: descricao,
        imagem,
        image: imagem,
        unitId: unidade,
        desconto,
        discountRate: desconto,
        pedidoMinimo,
        minimumOrder: pedidoMinimo,
        ativa: true,
        createdAt: agora,
        dataCriacao: agora,
      };

      try {
        await salvarCampanhaBanco(novaCampanha);
        campanhasEmMemoria.push(novaCampanha);
        alert("Campanha publicada com sucesso!");
      } catch (erro) {
        console.error("Erro ao salvar campanha:", erro);
        alert("Não foi possível salvar a campanha.");
        return;
      }
    }

    cancelarEdicao();
    preencherSelectUnidades();
    atualizarPainel();
  }

  async function excluirCampanha(id) {
    const campanhas = obterCampanhas();
    const campanha = campanhas.find((item) => item.id === id);
    if (!campanha) {
      return;
    }

    const titulo = campanha.titulo || campanha.title || "esta campanha";
    const confirmar = confirm(
      `Deseja realmente excluir a campanha "${titulo}"?`,
    );

    if (!confirmar) {
      return;
    }

    try {
      await excluirCampanhaBanco(id);
      campanhasEmMemoria = campanhas.filter((item) => item.id !== id);
      if (campanhaEditandoId === id) {
        cancelarEdicao();
      }

      atualizarPainel();

      alert("Campanha excluída com sucesso!");
    } catch (erro) {
      console.error("Erro ao excluir campanha:", erro);
      alert("Não foi possível excluir a campanha.");
    }
  }

  function atualizarPreviewImagem() {
    const preview = document.getElementById("campaignImagePreview");
    const campoImagemValue = document.getElementById("campaign-image-value");
    if (!preview || !campoImagemValue) {
      return;
    }

    const imagem = campoImagemValue.value.trim();
    if (!imagem) {
      limparPreviewImagem();
      return;
    }

    preview.innerHTML = `
      <img
        src="${escaparHTML(imagem)}"
        alt="Pré-visualização da campanha"
      >

      <span>
        Pré-visualização da imagem
      </span>
    `;

    preview.classList.remove("erro");
  }

  function atualizarPreviewArquivo(arquivo) {
    const preview = document.getElementById("campaignImagePreview");
    if (!preview) {
      return;
    }

    if (!arquivo) {
      atualizarPreviewImagem();
      return;
    }

    if (!arquivo.type.startsWith("image/")) {
      limparPreviewImagem();
      return;
    }

    const url = URL.createObjectURL(arquivo);
    preview.innerHTML = `
      <img
        src="${url}"
        alt="Pré-visualização da campanha"
      >

      <span>
        Pré-visualização da imagem
      </span>
    `;
    preview.classList.remove("erro");
  }

  function limparPreviewImagem() {
    const preview = document.getElementById("campaignImagePreview");
    if (!preview) {
      return;
    }
    preview.innerHTML = "";
    preview.classList.remove("erro");
  }

  function atualizarPainel() {
    renderizarEstatisticas();
    renderizarPedidos();
    renderizarPainelPrivacidade();
    renderizarUnidades();
    renderizarCampanhas();
  }

  document.addEventListener("DOMContentLoaded", async function () {
    if (
      !statsTarget ||
      !ordersTarget ||
      !privacyTarget ||
      !unitsTarget ||
      !campaignForm
    ) {
      console.error("Elementos necessários do Admin não foram encontrados.");
      return;
    }

    await sincronizarCampanhasPersistentes();
    preencherSelectUnidades();
    campaignForm.addEventListener("submit", salvarNovaCampanha);
    if (campaignCancel) {
      campaignCancel.addEventListener("click", cancelarEdicao);
    }

    const campoImagem = document.getElementById("campaign-image");
    if (campoImagem) {
      campoImagem.addEventListener("change", function () {
        const arquivo =
          campoImagem.files && campoImagem.files[0]
            ? campoImagem.files[0]
            : null;

        atualizarPreviewArquivo(arquivo);
      });
    }
    atualizarPainel();
  });
})();
