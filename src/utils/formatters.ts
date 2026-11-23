import type { OrderItemPayload, OrderStatus } from '../types';

export function optimizeImageUrl(url: string | undefined, width: number): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.includes('lh3.googleusercontent.com/d/') && !trimmed.includes('=w')) {
    return `${trimmed}=w${width}`;
  }
  return trimmed;
}

export function formatCurrency(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(safe);
}

export function parsePrice(raw: unknown): number {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : 0;
  }
  if (typeof raw === 'string') {
    const normalized = raw
      .replace(/R\$/gi, '')
      .replace(/\s+/g, '')
      .replace(/\./g, (match, offset, str) => {
        // Keep decimal dot if there's no comma and only 1-2 digits after it
        if (!str.includes(',') && str.indexOf('.') === str.lastIndexOf('.')) {
          return '.';
        }
        return '';
      })
      .replace(',', '.');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function parseBoolean(raw: unknown): boolean {
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'number') return raw !== 0;
  if (typeof raw === 'string') {
    const v = raw.trim().toLowerCase();
    return v === 'true' || v === 'sim' || v === '1' || v === 'ativo' || v === 'yes';
  }
  return false;
}

export function formatPhoneMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatOrderDateTime(raw: string): string {
  if (!raw) return 'Agora';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

export function parseOrderItems(itensRaw: unknown): OrderItemPayload[] {
  if (Array.isArray(itensRaw)) {
    return itensRaw.map(normalizeOrderItem);
  }
  if (typeof itensRaw === 'string') {
    const trimmed = itensRaw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeOrderItem);
      }
    } catch {
      return [
        {
          id: 'item',
          nome: trimmed,
          quantidade: 1,
          preco: 0,
        },
      ];
    }
  }
  return [];
}

function normalizeOrderItem(item: Record<string, unknown>, idx: number): OrderItemPayload {
  return {
    id: String(item.id ?? item.ID ?? `item-${idx}`),
    nome: String(item.nome ?? item.Nome ?? item.name ?? 'Item'),
    quantidade: Number(item.quantidade ?? item.qty ?? item.qtd ?? 1) || 1,
    preco: parsePrice(item.preco ?? item.Preco ?? item.price ?? 0),
    observacoes: item.observacoes
      ? String(item.observacoes)
      : item.obs
        ? String(item.obs)
        : undefined,
  };
}

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  'Pendente',
  'Em Preparo',
  'Saiu para Entrega',
  'Concluído',
  'Cancelado',
];

export function normalizeOrderStatus(raw: unknown): OrderStatus {
  const s = String(raw ?? 'Pendente').trim().toLowerCase();
  if (s.includes('preparo')) return 'Em Preparo';
  if (s.includes('entrega') || s.includes('saiu')) return 'Saiu para Entrega';
  if (s.includes('conclu')) return 'Concluído';
  if (s.includes('cancel')) return 'Cancelado';
  return 'Pendente';
}

export function buildWhatsAppOrderUrl(params: {
  storePhone: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  payment: string;
  items: OrderItemPayload[];
  total: number;
}): string {
  const lines = [
    `*Novo Pedido - Tá On Burger*`,
    `*Pedido:* ${params.orderId}`,
    `*Cliente:* ${params.customerName}`,
    `*WhatsApp:* ${params.customerPhone}`,
    `*Endereço:* ${params.address}`,
    `*Pagamento:* ${params.payment}`,
    ``,
    `*Itens do Pedido:*`,
    ...params.items.map((item) => {
      const lineTotal = formatCurrency(item.preco * item.quantidade);
      const obs = item.observacoes ? ` _(Obs: ${item.observacoes})_` : '';
      return `• ${item.quantidade}x ${item.nome} — ${lineTotal}${obs}`;
    }),
    ``,
    `*Total:* ${formatCurrency(params.total)}`,
  ];

  const cleanPhone = params.storePhone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
}
