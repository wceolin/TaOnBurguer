import type { OrderRecord } from '../types';
import {
  formatCurrency,
  formatOrderDateTime,
  parseOrderItems,
  parsePrice,
} from './formatters';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface NormalizedReceiptItem {
  quantidade: number;
  nome: string;
  preco: number;
  observacoes: string;
}

function getSafeReceiptItems(itensJson: OrderRecord['Itens_JSON']): NormalizedReceiptItem[] {
  let rawList: unknown[] = [];
  try {
    const parsed =
      typeof itensJson === 'string' ? JSON.parse(itensJson) : itensJson || [];
    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else {
      rawList = parseOrderItems(itensJson);
    }
  } catch {
    rawList = parseOrderItems(itensJson);
  }

  return rawList.map((entry, idx) => {
    const item = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>;
    const quantidade = Number(item.quantidade ?? item.qty ?? item.qtd ?? 1) || 1;
    const nome = String(item.nome ?? item.Nome ?? item.name ?? `Item ${idx + 1}`);
    const preco = parsePrice(item.preco ?? item.Preco ?? item.price ?? 0);
    const observacoes = String(item.observacoes ?? item.obs ?? '').trim();
    return { quantidade, nome, preco, observacoes };
  });
}

export function openThermalPrintWindow(pedido: OrderRecord): boolean {
  const printWindow = window.open('', '_blank', 'width=350,height=600');
  if (!printWindow) {
    return false;
  }

  const itens = getSafeReceiptItems(pedido.Itens_JSON);
  const formattedDate = formatOrderDateTime(pedido.Data_Hora);

  const itemsHtml = itens
    .map((item) => {
      const subtotal = item.preco * item.quantidade;
      const priceHtml =
        item.preco > 0
          ? `<span class="item-price">${escapeHtml(formatCurrency(subtotal))}</span>`
          : '';
      const obsHtml = item.observacoes
        ? `<div class="item-obs">OBS: ${escapeHtml(item.observacoes)}</div>`
        : '';

      return `
        <div class="item-block">
          <div class="item-row">
            <span class="item-name">${escapeHtml(item.quantidade)}x ${escapeHtml(item.nome)}</span>
            ${priceHtml}
          </div>
          ${obsHtml}
        </div>
      `;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Cupom - Pedido #${escapeHtml(pedido.ID_Pedido)}</title>
  <style>
    @page {
      margin: 0;
      size: 80mm auto;
    }
    * {
      box-sizing: border-box;
    }
    body {
      width: 76mm;
      margin: 0 auto;
      padding: 4mm;
      padding-bottom: 12mm;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.35;
      color: #000;
      background: #fff;
      font-weight: bold;
      overflow-wrap: break-word;
      word-break: normal;
    }
    .center {
      text-align: center;
    }
    .brand {
      font-size: 16px;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .order-id {
      font-size: 14px;
      margin: 4px 0 2px;
    }
    .date-time {
      font-size: 11px;
    }
    .divider {
      border: 0;
      border-top: 1px dashed #000;
      margin: 8px 0;
      width: 100%;
    }
    .section {
      font-size: 11px;
    }
    .section-line {
      margin-bottom: 3px;
    }
    .item-block {
      margin-bottom: 6px;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 6px;
    }
    .item-name {
      flex: 1;
      min-width: 0;
    }
    .item-price {
      white-space: nowrap;
      flex-shrink: 0;
    }
    .item-obs {
      margin-top: 2px;
      padding-left: 6px;
      border-left: 2px solid #000;
      font-size: 11px;
      text-transform: uppercase;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 15px;
      margin-bottom: 4px;
    }
    .payment-row {
      font-size: 11px;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="center">
    <div class="brand">TÁ ON! BURGER</div>
    <hr class="divider" />
    <div class="order-id">PEDIDO #${escapeHtml(pedido.ID_Pedido)}</div>
    <div class="date-time">${escapeHtml(formattedDate)}</div>
  </div>

  <hr class="divider" />

  <div class="section">
    <div class="section-line">CLIENTE: ${escapeHtml(pedido.Cliente_Nome)}</div>
    ${
      pedido.Cliente_WhatsApp
        ? `<div class="section-line">WHATSAPP: ${escapeHtml(pedido.Cliente_WhatsApp)}</div>`
        : ''
    }
    <div class="section-line">ENDEREÇO: ${escapeHtml(pedido.Endereco)}</div>
  </div>

  <hr class="divider" />

  <div class="section">
    ${itemsHtml}
  </div>

  <hr class="divider" />

  <div>
    <div class="total-row">
      <span>TOTAL:</span>
      <span>${escapeHtml(formatCurrency(pedido.Total))}</span>
    </div>
    <div class="payment-row">PAGAMENTO: ${escapeHtml(pedido.Forma_Pagamento)}</div>
  </div>

  <hr class="divider" />

  <div class="footer">Deu fome? A gente tá ON!</div>

  <script>window.onload = function() { window.focus(); window.print(); window.close(); }</script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
}
