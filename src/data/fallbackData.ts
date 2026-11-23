import type { MenuItem, OrderRecord } from '../types';

export const STORE_WHATSAPP_NUMBER = '5511999999999';
export const ADMIN_PASSWORD = 'admin123';
export const STORE_OPEN_STORAGE_KEY = 'taon_store_open';
export const HERO_IMAGE_STORAGE_KEY = 'taon_hero_image_url';
export const TAONBURGER_CACHE_KEY = 'taonburger_cache';

export const HERO_IMAGE_URL = '/src/assets/images/hero_burger_grill_1795390749519.jpg';

export const DEFAULT_CATEGORIES = ['Todos', 'Artesanais', 'Combos', 'Bebidas'];

export const FALLBACK_MENU: MenuItem[] = [
  {
    ID: 'TOB-01',
    Nome: 'Tá On Smash Duplo',
    Descricao:
      'Dois blends bovinos de 90g prensados na chapa com crosta crocante, cheddar inglês duplo, cebola caramelizada no shoyu, picles artesanal e molho da casa no brioche tostado.',
    Preco: 34.9,
    Categoria: 'Artesanais',
    Imagem_URL: '/src/assets/images/burger_smash_duplo_1795390750869.jpg',
    Disponivel: true,
  },
  {
    ID: 'TOB-02',
    Nome: 'Defumado Bacon Brasa',
    Descricao:
      'Hambúrguer artesanal 160g grelhado no fogo, fatias generosas de bacon caramelizado no melado, queijo gouda derretido, barbecue defumado da casa, rúcula fresca e cebola roxa.',
    Preco: 39.9,
    Categoria: 'Artesanais',
    Imagem_URL: '/src/assets/images/burger_bacon_defumado_1795390750375.jpg',
    Disponivel: true,
  },
  {
    ID: 'TOB-03',
    Nome: 'Clássico da Casa 160g',
    Descricao:
      'Blend Angus 160g ao ponto perfeito, queijo prato derretido, tomate italiano, cebola grelhada, rúcula selecionada e maionese cítrica de ervas no pão brioche amanteigado.',
    Preco: 31.9,
    Categoria: 'Artesanais',
    Imagem_URL: '/src/assets/images/hero_burger_grill_1795390749519.jpg',
    Disponivel: true,
  },
  {
    ID: 'TOB-04',
    Nome: 'Combo Clássico Tá On',
    Descricao:
      'Clássico da Casa 160g + porção individual de batatas rústicas temperadas com alecrim e flor de sal + maionese da casa + refrigerante lata bem gelado.',
    Preco: 49.9,
    Categoria: 'Combos',
    Imagem_URL: '/src/assets/images/burger_combo_classico_1795390749756.jpg',
    Disponivel: true,
  },
  {
    ID: 'TOB-05',
    Nome: 'Combo Smash Duplo + Fritas Cheddar',
    Descricao:
      'Tá On Smash Duplo + batata crinkle com creme de cheddar quente e farofa de bacon crocante + bebida gelada à sua escolha.',
    Preco: 56.9,
    Categoria: 'Combos',
    Imagem_URL: '/src/assets/images/burger_smash_duplo_1795390750869.jpg',
    Disponivel: true,
  },
  {
    ID: 'TOB-07',
    Nome: 'Soda Artesanal Limão Siciliano',
    Descricao:
      'Refrescância imediata preparada na hora com xarope natural de limão siciliano, água com gás em alta pressão, bastante gelo e hortelã fresca (400ml).',
    Preco: 14.9,
    Categoria: 'Bebidas',
    Imagem_URL: '/src/assets/images/bebida_soda_artesanal_1795390750104.jpg',
    Disponivel: true,
  },
  {
    ID: 'TOB-08',
    Nome: 'Refrigerante Lata 350ml',
    Descricao:
      'Lata trincando de gelada (Coca-Cola, Coca Zero ou Guaraná Antarctica). Especifique o sabor desejado nas observações.',
    Preco: 7.5,
    Categoria: 'Bebidas',
    Imagem_URL: '/src/assets/images/burger_combo_classico_1795390749756.jpg',
    Disponivel: true,
  },
];

export const FALLBACK_ORDERS: OrderRecord[] = [
  {
    ID_Pedido: 'PED-1041',
    Data_Hora: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    Cliente_Nome: 'Lucas Andrade',
    Cliente_WhatsApp: '(11) 98745-3321',
    Endereco: 'Rua Augusta, 1420, Bela Vista — Apto 42',
    Itens_JSON: JSON.stringify([
      {
        id: 'TOB-01',
        nome: 'Tá On Smash Duplo',
        quantidade: 2,
        preco: 34.9,
        observacoes: 'Sem picles em um deles',
      },
      {
        id: 'TOB-07',
        nome: 'Soda Artesanal Limão Siciliano',
        quantidade: 1,
        preco: 14.9,
      },
    ]),
    Total: 84.7,
    Forma_Pagamento: 'Pix',
    Status: 'Pendente',
  },
  {
    ID_Pedido: 'PED-1040',
    Data_Hora: new Date(Date.now() - 1000 * 60 * 44).toISOString(),
    Cliente_Nome: 'Mariana Costa',
    Cliente_WhatsApp: '(11) 99123-8810',
    Endereco: 'Av. Paulista, 810, Bela Vista — Portaria B',
    Itens_JSON: JSON.stringify([
      {
        id: 'TOB-04',
        nome: 'Combo Clássico Tá On',
        quantidade: 1,
        preco: 49.9,
        observacoes: 'Ponto da carne ao ponto para mal, Coca Zero',
      },
      {
        id: 'TOB-06',
        nome: 'Fritas Cheddar & Bacon',
        quantidade: 1,
        preco: 27.9,
      },
    ]),
    Total: 77.8,
    Forma_Pagamento: 'Cartão na Entrega',
    Status: 'Em Preparo',
  },
  {
    ID_Pedido: 'PED-1039',
    Data_Hora: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    Cliente_Nome: 'Rafael Souza',
    Cliente_WhatsApp: '(11) 97654-1122',
    Endereco: 'Rua Frei Caneca, 512, Consolação — Casa',
    Itens_JSON: JSON.stringify([
      {
        id: 'TOB-02',
        nome: 'Defumado Bacon Brasa',
        quantidade: 1,
        preco: 39.9,
      },
    ]),
    Total: 39.9,
    Forma_Pagamento: 'Dinheiro (Troco para R$ 50,00)',
    Status: 'Saiu para Entrega',
  },
];
