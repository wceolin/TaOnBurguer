export interface MenuItem {
  ID: string;
  Nome: string;
  Descricao: string;
  Preco: number;
  Categoria: string;
  Imagem_URL: string;
  Disponivel: boolean;
}

export interface CartItem {
  cartItemId: string;
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

export type OrderStatus =
  | 'Pendente'
  | 'Em Preparo'
  | 'Saiu para Entrega'
  | 'Concluído'
  | 'Cancelado';

export type PaymentMethod = 'Pix' | 'Cartão na Entrega' | 'Dinheiro';

export interface OrderItemPayload {
  id: string;
  nome: string;
  quantidade: number;
  preco: number;
  observacoes?: string;
}

export interface OrderRecord {
  ID_Pedido: string;
  Data_Hora: string;
  Cliente_Nome: string;
  Cliente_WhatsApp: string;
  Endereco: string;
  Itens_JSON: string;
  Total: number;
  Forma_Pagamento: string;
  Status: OrderStatus;
}

export interface CreateOrderPayload {
  cliente: string;
  whatsapp: string;
  endereco: string;
  itens: OrderItemPayload[];
  total: number;
  pagamento: string;
}

export interface SaveMenuItemPayload {
  id?: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  imagem_url: string;
  disponivel: boolean;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}
