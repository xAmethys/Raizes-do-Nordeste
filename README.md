# Projeto Raizes do Nordeste
Um projeto para a atividade prática da trilha de Front-End, baseado no estudo de caso da rede "Raízes do Nordeste".

## O que já está implementado
- Fluxo de cadastro e autenticação com dados mockados.
- Seleção de unidade e tipo de consumo do pedido.
- Cardápio dinâmico por unidade.
- Carrinho com subtotal, descontos de campanha e de recompensa, e frete quando necessário.
- Pagamento com integração externa simulada.
- Acompanhamento do status do pedido.
- Programa de fidelidade com recompensas.
- Página de perfil com controles de dados e privacidade.
- Painel administrativo com campanhas, pedidos e indicadores.

## Estrutura
```text
Raizes do Nordeste/
├── assets/
│   ├──campanhas/
│   │   ├── campanha.jpg
│   │   ├── campanhas.jpg
│   │   └── raizes.jpg
│   ├── cidades/
│   │   ├── Fortaleza.jpg
│   │   ├── João Pessoa.jpg
│   │   ├── Natal.jpg
│   │   └── Recife.jpg
│   ├── comidas/
│   │   ├── acaraje.jpg
│   │   ├── baiao.jpg
│   │   ├── bolo.jpg
│   │   ├── cafe.jpg
│   │   ├── canjica.jpg
│   │   ├── cartola.jpg
│   │   ├── cuscuz-junino.jpg
│   │   ├── cuscuz.jpg
│   │   ├── rolo.jpg
│   │   ├── sanduiche.jpg
│   │   ├── suco.jpg
│   │   └── tapioca.jpg
│   ├── icons/
│   │   └── google.svg
│   │
│   ├── banner.jpg
│   └── logo.jpg
├── css/
│   ├── acompanhamento.css
│   ├── admin.css
│   ├── cadastro.css
│   ├── cardapio.css
│   ├── login.css
│   ├── pedido.css
│   ├── perfil.css
│   ├── style.css
│   └── unidades.css
├── js/
│   ├── acompanhamento.js
│   ├── admin.js
│   ├── app.js
│   ├── cadastro.js
│   ├── cardapio.js
│   ├── carrinho.js
│   ├── login.js
│   ├── mockData.js
│   ├── pedido.js
│   ├── perfil.js
│   ├── servicoPagamento.js
│   └── unidades.js
├── acompanhamento.html
├── admin.html
├── cadastro.html
├── cardapio.html
├── index.html
├── login.html
├── pedido.html
├── perfil.html
├── unidades.html
└── README.md
```

## Como executar
1. Abra o projeto em um navegador.
2. A página inicial será a `index.html`.
3. Para entrar na área administrativa do site, use:

```text
E-mail: admin@raizes.com
Senha: admin123
```

## Observação importante
Nesse projeto é usado `localStorage` e dados mockados para representar os fluxos do projeto.
