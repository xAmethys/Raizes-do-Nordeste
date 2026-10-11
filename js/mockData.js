const produtos = [
  {
    id: 1,
    nome: "Cuscuz nordestino completo",
    categoria: "Cuscuz",
    preco: 24.9,
    imagem: "assets/comidas/cuscuz.jpg",
    descricao:
      "Cuscuz tradicional acompanhado de carne de sol, queijo coalho e manteiga de garrafa.",
    disponivel: true,
    destaque: true,
    extras: [
      {
        nome: "Ovo",
        preco: 3.0,
      },
      {
        nome: "Bacon",
        preco: 4.0,
      },
      {
        nome: "Extra de queijo coalho",
        preco: 5.0,
      },
    ],
  },
  {
    id: 2,
    nome: "Tapioca de carne de sol",
    categoria: "Tapiocas",
    preco: 22.9,
    imagem: "assets/comidas/tapioca.jpg",
    descricao: "Tapioca recheada com carne de sol desfiada e queijo coalho.",
    disponivel: true,
    destaque: true,
    extras: [
      {
        nome: "Catupiry",
        preco: 3.5,
      },
      {
        nome: "Queijo extra",
        preco: 4.0,
      },
    ],
  },
  {
    id: 3,
    nome: "Bolo de macaxeira",
    categoria: "Bolos",
    preco: 11.5,
    imagem: "assets/comidas/bolo.jpg",
    descricao: "Receita tradicional nordestina feita com macaxeira fresca.",
    disponivel: true,
    destaque: false,
    extras: [
      {
        nome: "Calda de coco",
        preco: 2.0,
      },
    ],
  },
  {
    id: 4,
    nome: "Café nordestino",
    categoria: "Cafés",
    preco: 6.9,
    imagem: "assets/comidas/cafe.jpg",
    descricao: "Café passado na hora com sabor tradicional.",
    disponivel: true,
    destaque: false,
    extras: [
      {
        nome: "Leite",
        preco: 1.5,
      },

      {
        nome: "Açúcar",
        preco: 1.0,
      },
    ],
  },
  {
    id: 5,
    nome: "Suco de caju",
    categoria: "Bebidas",
    preco: 8.5,
    imagem: "assets/comidas/suco.jpg",
    descricao: "Suco de caju natural.",
    disponivel: true,
    destaque: false,
    extras: [
      {
        nome: "Açúcar",
        preco: 1.0,
      },
    ],
  },
  {
    id: 6,
    nome: "Cartola nordestina",
    categoria: "Sobremesas",
    preco: 14.9,
    imagem: "assets/comidas/cartola.jpg",
    descricao: "Um doce feito de banana, queijo coalho, canela e açúcar.",
    disponivel: true,
    destaque: true,
    extras: [
      {
        nome: "Mel",
        preco: 2.5,
      },
    ],
  },
  {
    id: 7,
    nome: "Canjica junina",
    categoria: "Sobremesas",
    preco: 27.9,
    imagem: "assets/comidas/canjica.jpg",
    descricao: "Edição especial disponível no período junino.",
    disponivel: false,
    destaque: false,
    extras: [
      {
        nome: "Canela extra",
        preco: 2.0,
      },
    ],
  },
  {
    id: 8,
    nome: "Cuscuz junino especial",
    categoria: "Cuscuz",
    preco: 27.9,
    imagem: "assets/comidas/cuscuz-junino.jpg",
    descricao: "Edição especial disponível no período junino.",
    disponivel: false,
    destaque: false,
  },

  {
    id: 9,
    nome: "Acarajé",
    categoria: "Pratos",
    preco: 15.0,
    imagem: "assets/comidas/acaraje.jpg",
    descricao:
      "Um bolinho feito de massa de feijão-fradinho, cebola e sal, e frito em azeite de dendê",
    disponivel: true,
    destaque: true,
    extras: [
      {
        nome: "Vatapá",
        preco: "5.0",
      },

      {
        nome: "Camarão seco",
        preco: "7.50",
      },

      {
        nome: "Vinagrete",
        preco: "4.50",
      },

      {
        nome: "Molho de pimenta",
        preco: "3.0",
      },
    ],
  },

  {
    id: 10,
    nome: "Sanduíche de carne de sol",
    categoria: "Lanches",
    preco: 26.99,
    imagem: "assets/comidas/sanduiche.jpg",
    descricao:
      "Sanduíche com carne de sol, manteiga de garrafa, requeijão e queijo coalho em um pão brioche",
    disponivel: true,
    destaque: false,
    extras: [
      {
        nome: "Queijo coalho extra",
        preco: 3.0,
      },
    ],
  },

  {
    id: 11,
    nome: "Bolo de rolo",
    categoria: "Bolos",
    preco: "10.20",
    imagem: "assets/comidas/rolo.jpg",
    descricao:
      "Um doce tradicional de Recife, que consiste em camadas extremamente finas de massa macia enroladas com recheio de goiabada derretida",
    disponivel: true,
    destaque: true,
  },

  {
    id: 12,
    nome: "Baião de dois",
    categoria: "Pratos",
    preco: "24.90",
    imagem: "assets/comidas/baiao.jpg",
    descricao:
      "Clássico da culinária nordestina feito com arroz, feijão verde, charque e queijo coalho.",
    disponivel: true,
    destaque: true,
  },
];

const categorias = [
  "Todos",
  "Cuscuz",
  "Tapiocas",
  "Bolos",
  "Cafés",
  "Bebidas",
  "Sobremesas",
  "Lanches",
  "Pratos",
];

const MOCK_UNIDADES = [
  {
    id: "recife",
    nome: "Recife",
    cidade: "Recife",
    endereco: "Av. Boa Viagem, 1200",
    bairro: "Boa Viagem",
    horario: "08:00 às 22:00",
    rating: "4.8",
    status: "Aberta",
    eta: "25–35 min",
    taxaEntrega: 6.5,
    imagem: "assets/cidades/Recife.jpg",

    destaques: [
      "Café da manhã nordestino",
      "Ambiente climatizado",
      "Delivery disponível",
    ],

    highlights: [
      "Café da manhã nordestino",
      "Ambiente climatizado",
      "Delivery disponível",
    ],

    cardapio: [1, 2, 4, 5, 6, 9, 10, 11, 12],

    destaquesProdutos: [12, 11, 4],
  },

  {
    id: "joaopessoa",
    nome: "João Pessoa",
    cidade: "João Pessoa",
    endereco: "Av. Epitácio Pessoa, 850",
    bairro: "Miramar",
    horario: "08:00 às 22:00",
    rating: "4.7",
    status: "Aberta",
    eta: "20–30 min",
    taxaEntrega: 5.5,
    imagem: "assets/cidades/João Pessoa.jpg",

    destaques: ["Tapiocas artesanais", "Ambiente familiar", "Retirada rápida"],

    cardapio: [1, 2, 3, 4, 5, 7, 9, 10, 12],

    destaquesProdutos: [9, 1, 4],
  },

  {
    id: "fortaleza",
    nome: "Fortaleza",
    cidade: "Fortaleza",
    endereco: "Av. Beira Mar, 1500",
    bairro: "Meireles",
    horario: "07:00 às 23:00",
    rating: "4.9",
    status: "Aberta",
    eta: "25–40 min",
    taxaEntrega: 7.0,
    imagem: "assets/cidades/Fortaleza.jpg",

    destaques: [
      "Funcionamento ampliado",
      "Sobremesas regionais",
      "Delivery disponível",
    ],

    cardapio: [1, 2, 3, 4, 5, 8, 9, 10],

    destaquesProdutos: [9, 2, 5],
  },

  {
    id: "natal",
    nome: "Natal",
    cidade: "Natal",
    endereco: "Av. Engenheiro Roberto Freire, 980",
    bairro: "Ponta Negra",
    horario: "08:00 às 22:00",
    rating: "4.6",
    status: "Aberta",
    eta: "30–40 min",
    taxaEntrega: 6.0,
    imagem: "assets/cidades/Natal.jpg",

    destaques: [
      "Bolos tradicionais",
      "Café passado na hora",
      "Retirada rápida",
    ],

    cardapio: [1, 2, 3, 4, 5, 6, 9, 10, 12],

    destaquesProdutos: [6, 1, 4],
  },
];
