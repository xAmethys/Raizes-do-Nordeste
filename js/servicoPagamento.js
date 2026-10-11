const ServicoPagamento = {
  processar(dados) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const transacaoId = "TX" + Date.now().toString().slice(-10);
        const formaPagamento = String(dados.formaPagamento || "").toLowerCase();
        const valor = Number(dados.valor || 0);

        let aprovado = true;
        let motivo = "";

        if (!Number.isFinite(valor) || valor <= 0) {
          aprovado = false;
          motivo = "Valor do pagamento inválido.";
        } else if (formaPagamento.includes("cart")) {
          const numeroCartao = String(dados.numeroCartao || "").replace(
            /\D/g,
            "",
          );

          if (!numeroCartao) {
            aprovado = false;
            motivo = "Pagamento com cartão recusado.";
          }
        } else if (formaPagamento.includes("pix")) {
          if (dados.pixAprovado === false) {
            aprovado = false;
            motivo = "Pagamento PIX não confirmado.";
          } else if (dados.forcarRecusa === true) {
            aprovado = false;
            motivo = "Pagamento PIX recusado.";
          }
        } else if (aprovado && dados.forcarRecusa === true) {
          aprovado = false;
          motivo = "Pagamento recusado pela operadora.";
        }

        resolve({
          aprovado,
          status: aprovado ? "Aprovado" : "Recusado",
          transacaoId,
          valor,
          formaPagamento: dados.formaPagamento || "",
          pedidoId: dados.pedidoId || "",
          motivo,
          data: new Date().toISOString(),
        });
      }, 2000);
    });
  },
};
