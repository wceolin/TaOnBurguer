import {
  FALLBACK_MENU,
  FALLBACK_ORDERS,
  HERO_IMAGE_URL,
  LOGO_CACHE_KEY,
  TAONBURGER_CACHE_KEY,
} from '../data/fallbackData';
import type {
  CreateOrderPayload,
  MenuItem,
  OrderRecord,
  OrderStatus,
  SaveMenuItemPayload,
} from '../types';
import {
  normalizeOrderStatus,
  parseBoolean,
  parsePrice,
} from '../utils/formatters';

export const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyEnnIgRj-rh_1f2S85Ti4lBCzTVy3t1yeAiX9jPVhgHwnsKD-0DfnHLRwQFW-Lc2k/exec';

// In-memory store used seamlessly only if the remote Google Apps Script endpoint is unreachable
let localFallbackMenu: MenuItem[] = [...FALLBACK_MENU];
let localFallbackOrders: OrderRecord[] = [...FALLBACK_ORDERS];

function normalizeMenuItem(raw: Record<string, unknown>, idx: number): MenuItem {
  return {
    ID: String(raw.ID ?? raw.id ?? `ITEM-${idx + 1}`),
    Nome: String(raw.Nome ?? raw.nome ?? 'Item sem nome'),
    Descricao: String(raw.Descricao ?? raw.descricao ?? ''),
    Preco: parsePrice(raw.Preco ?? raw.preco ?? 0),
    Categoria: String(raw.Categoria ?? raw.categoria ?? 'Artesanais'),
    Imagem_URL: String(raw.Imagem_URL ?? raw.imagem_url ?? ''),
    Disponivel: parseBoolean(raw.Disponivel ?? raw.disponivel ?? true),
  };
}

function normalizeOrderRecord(raw: Record<string, unknown>, idx: number): OrderRecord {
  const itensVal = raw.Itens_JSON ?? raw.itens_json ?? raw.itens ?? '[]';
  return {
    ID_Pedido: String(raw.ID_Pedido ?? raw.id_pedido ?? raw.id ?? `PED-${1000 + idx}`),
    Data_Hora: String(raw.Data_Hora ?? raw.data_hora ?? new Date().toISOString()),
    Cliente_Nome: String(raw.Cliente_Nome ?? raw.cliente_nome ?? raw.cliente ?? 'Cliente'),
    Cliente_WhatsApp: String(raw.Cliente_WhatsApp ?? raw.cliente_whatsapp ?? raw.whatsapp ?? ''),
    Endereco: String(raw.Endereco ?? raw.endereco ?? ''),
    Itens_JSON: typeof itensVal === 'string' ? itensVal : JSON.stringify(itensVal),
    Total: parsePrice(raw.Total ?? raw.total ?? 0),
    Forma_Pagamento: String(raw.Forma_Pagamento ?? raw.forma_pagamento ?? raw.pagamento ?? 'Pix'),
    Status: normalizeOrderStatus(raw.Status ?? raw.status ?? 'Pendente'),
  };
}

async function postToAppsScript<T extends Record<string, unknown>>(
  payload: Record<string, unknown>
): Promise<T> {
  // Using plain text body avoids CORS preflight OPTIONS errors on Google Apps Script doPost
  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    const parsed = JSON.parse(text) as T;
    if (
      parsed &&
      typeof parsed === 'object' &&
      (parsed.success === false || typeof parsed.error === 'string' || typeof parsed.erro === 'string')
    ) {
      throw new Error(
        String(parsed.error ?? parsed.erro ?? parsed.message ?? 'Erro na resposta da planilha')
      );
    }
    return parsed;
  } catch (err) {
    if (err instanceof SyntaxError) {
      return {} as T;
    }
    throw err;
  }
}

export async function fetchMenu(): Promise<{ items: MenuItem[]; isFallback: boolean }> {
  try {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getCardapio`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.cardapio)
          ? data.cardapio
          : null;

    if (!list) {
      throw new Error('Formato de resposta inválido para cardápio');
    }

    const normalized = list.map((item: Record<string, unknown>, i: number) =>
      normalizeMenuItem(item, i)
    );
    localFallbackMenu = normalized;
    return { items: normalized, isFallback: false };
  } catch (error) {
    console.warn(
      '[Tá On Burger] API do Google Sheets indisponível ao carregar cardápio. Usando dados de fallback.',
      error
    );
    return { items: [...localFallbackMenu], isFallback: true };
  }
}

export async function createOrder(
  payload: CreateOrderPayload
): Promise<{ orderId: string; isFallback: boolean }> {
  try {
    const res = await postToAppsScript<Record<string, unknown>>({
      action: 'novoPedido',
      cliente: payload.cliente,
      whatsapp: payload.whatsapp,
      endereco: payload.endereco,
      itens: payload.itens,
      total: payload.total,
      pagamento: payload.pagamento,
    });

    const returnedId =
      res.ID_Pedido ??
      res.id_pedido ??
      res.id ??
      (typeof res.data === 'object' && res.data !== null
        ? (res.data as Record<string, unknown>).ID_Pedido ??
          (res.data as Record<string, unknown>).id_pedido
        : undefined);

    const orderId = returnedId
      ? String(returnedId)
      : `PED-${Math.floor(1000 + Math.random() * 9000)}`;

    return { orderId, isFallback: false };
  } catch (error) {
    console.warn(
      '[Tá On Burger] API do Google Sheets indisponível ao enviar pedido. Registrando em memória local de fallback.',
      error
    );
    const orderId = `PED-${Math.floor(1050 + Math.random() * 8900)}`;
    const newOrder: OrderRecord = {
      ID_Pedido: orderId,
      Data_Hora: new Date().toISOString(),
      Cliente_Nome: payload.cliente,
      Cliente_WhatsApp: payload.whatsapp,
      Endereco: payload.endereco,
      Itens_JSON: JSON.stringify(payload.itens),
      Total: payload.total,
      Forma_Pagamento: payload.pagamento,
      Status: 'Pendente',
    };
    localFallbackOrders = [...localFallbackOrders, newOrder];
    return { orderId, isFallback: true };
  }
}

export async function fetchOrders(): Promise<{ orders: OrderRecord[]; isFallback: boolean }> {
  try {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getPedidos`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.pedidos)
          ? data.pedidos
          : null;

    if (!list) {
      throw new Error('Formato de resposta inválido para pedidos');
    }

    const normalized = list.map((item: Record<string, unknown>, i: number) =>
      normalizeOrderRecord(item, i)
    );
    localFallbackOrders = normalized;
    return { orders: normalized, isFallback: false };
  } catch (error) {
    console.warn(
      '[Tá On Burger] API do Google Sheets indisponível ao carregar pedidos. Usando dados de fallback.',
      error
    );
    return { orders: [...localFallbackOrders], isFallback: true };
  }
}

export async function saveMenuItem(
  payload: SaveMenuItemPayload
): Promise<{ item: MenuItem; isFallback: boolean }> {
  const targetId = payload.id?.trim() || `TOB-${Date.now().toString().slice(-4)}`;
  const normalizedItem: MenuItem = {
    ID: targetId,
    Nome: payload.nome,
    Descricao: payload.descricao,
    Preco: payload.preco,
    Categoria: payload.categoria,
    Imagem_URL: payload.imagem_url,
    Disponivel: payload.disponivel,
  };

  try {
    const res = await postToAppsScript<Record<string, unknown>>({
      action: 'salvarPrato',
      id: payload.id || '',
      nome: payload.nome,
      descricao: payload.descricao,
      preco: payload.preco,
      categoria: payload.categoria,
      imagem_url: payload.imagem_url,
      disponivel: payload.disponivel,
    });

    if (res.id || res.ID) {
      normalizedItem.ID = String(res.id ?? res.ID);
    }

    return { item: normalizedItem, isFallback: false };
  } catch (error) {
    console.warn(
      '[Tá On Burger] API do Google Sheets indisponível ao salvar prato. Atualizando fallback local.',
      error
    );
    const existingIndex = localFallbackMenu.findIndex((m) => m.ID === normalizedItem.ID);
    if (existingIndex >= 0) {
      localFallbackMenu[existingIndex] = normalizedItem;
    } else {
      localFallbackMenu = [normalizedItem, ...localFallbackMenu];
    }
    return { item: normalizedItem, isFallback: true };
  }
}

export async function deleteMenuItem(id: string): Promise<{ isFallback: boolean }> {
  try {
    await postToAppsScript({
      action: 'excluirPrato',
      id,
    });
    return { isFallback: false };
  } catch (error) {
    console.warn(
      '[Tá On Burger] API do Google Sheets indisponível ao excluir prato. Atualizando fallback local.',
      error
    );
    localFallbackMenu = localFallbackMenu.filter((m) => m.ID !== id);
    return { isFallback: true };
  }
}

export async function updateOrderStatus(
  id_pedido: string,
  status: OrderStatus
): Promise<{ isFallback: boolean }> {
  try {
    await postToAppsScript({
      action: 'atualizarStatus',
      id_pedido,
      status,
    });
    return { isFallback: false };
  } catch (error) {
    console.warn(
      '[Tá On Burger] API do Google Sheets indisponível ao atualizar status. Atualizando fallback local.',
      error
    );
    localFallbackOrders = localFallbackOrders.map((o) =>
      o.ID_Pedido === id_pedido ? { ...o, Status: status } : o
    );
    return { isFallback: true };
  }
}

export async function fetchBannerConfig(): Promise<{
  bannerUrl: string | null;
  isFallback: boolean;
}> {
  try {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getConfig`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const list: Record<string, unknown>[] | null = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.config)
          ? data.config
          : null;

    if (list) {
      const entry = list.find(
        (item) => String(item.Chave ?? item.chave ?? '').trim() === 'Banner_URL'
      );
      const val = entry ? String(entry.Valor ?? entry.valor ?? '').trim() : '';
      return { bannerUrl: val || null, isFallback: false };
    }

    if (data && typeof data === 'object' && 'Banner_URL' in data) {
      const val = String((data as Record<string, unknown>).Banner_URL ?? '').trim();
      return { bannerUrl: val || null, isFallback: false };
    }

    return { bannerUrl: null, isFallback: false };
  } catch (error) {
    console.warn(
      '[Tá On Burger] API do Google Sheets indisponível ao carregar configuração do banner.',
      error
    );
    return { bannerUrl: null, isFallback: true };
  }
}

export async function saveBannerConfig(
  bannerUrl: string
): Promise<{ bannerUrl: string; isFallback: boolean }> {
  try {
    await postToAppsScript({
      action: 'salvarBanner',
      banner_url: bannerUrl,
    });
    const currentCache = readInitialDataCache();
    writeInitialDataCache({
      cardapio: currentCache?.cardapio ?? localFallbackMenu,
      bannerUrl,
    });
    return { bannerUrl, isFallback: false };
  } catch (error) {
    console.warn(
      '[Tá On Burger] API do Google Sheets indisponível ao salvar banner. Usando fallback local.',
      error
    );
    return { bannerUrl, isFallback: true };
  }
}

export interface InitialDataCache {
  cardapio: MenuItem[];
  bannerUrl: string;
  updatedAt?: number;
}

export function readInitialDataCache(): InitialDataCache | null {
  try {
    const raw = window.localStorage.getItem(TAONBURGER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<InitialDataCache>;
    if (!Array.isArray(parsed.cardapio)) return null;
    const bannerUrl =
      typeof parsed.bannerUrl === 'string' && parsed.bannerUrl.trim()
        ? parsed.bannerUrl.trim()
        : HERO_IMAGE_URL;
    return {
      cardapio: parsed.cardapio.map((item, idx) =>
        normalizeMenuItem(item as unknown as Record<string, unknown>, idx)
      ),
      bannerUrl,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function writeInitialDataCache(data: {
  cardapio: MenuItem[];
  bannerUrl: string;
}): void {
  try {
    const payload: InitialDataCache = {
      cardapio: data.cardapio,
      bannerUrl: data.bannerUrl,
      updatedAt: Date.now(),
    };
    window.localStorage.setItem(TAONBURGER_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

export function readLogoCache(): string | null {
  try {
    const raw = window.localStorage.getItem(LOGO_CACHE_KEY);
    return raw && raw.trim() ? raw.trim() : null;
  } catch {
    return null;
  }
}

export function writeLogoCache(logoUrl: string): void {
  try {
    if (logoUrl.trim()) {
      window.localStorage.setItem(LOGO_CACHE_KEY, logoUrl.trim());
    }
  } catch {
    // Ignore storage quota errors
  }
}

export async function fetchInitialData(): Promise<{
  cardapio: MenuItem[];
  bannerUrl: string;
  logoUrl: string | null;
  isFallback: boolean;
}> {
  try {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getInitialData`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    const rawCardapio = Array.isArray(data?.cardapio) ? data.cardapio : null;
    const rawConfig = Array.isArray(data?.config) ? data.config : [];

    if (!rawCardapio) {
      throw new Error('Formato de resposta inválido para getInitialData');
    }

    const cardapio = rawCardapio.map((item, idx) =>
      normalizeMenuItem(item as Record<string, unknown>, idx)
    );
    localFallbackMenu = cardapio;

    const findConfigValue = (key: string): string => {
      const entry = rawConfig.find(
        (c) =>
          String(
            (c as Record<string, unknown>).Chave ??
              (c as Record<string, unknown>).chave ??
              ''
          ).trim() === key
      ) as Record<string, unknown> | undefined;
      return entry ? String(entry.Valor ?? entry.valor ?? '').trim() : '';
    };

    const bannerUrl = findConfigValue('Banner_URL') || HERO_IMAGE_URL;
    const logoUrl = findConfigValue('Logo_URL') || null;

    writeInitialDataCache({ cardapio, bannerUrl });
    if (logoUrl) {
      writeLogoCache(logoUrl);
    }

    return { cardapio, bannerUrl, logoUrl, isFallback: false };
  } catch (error) {
    console.warn(
      '[Tá On Burger] API do Google Sheets indisponível ao carregar getInitialData. Usando cache/fallback.',
      error
    );
    const cached = readInitialDataCache();
    const cachedLogo = readLogoCache();
    if (cached) {
      return {
        cardapio: cached.cardapio,
        bannerUrl: cached.bannerUrl,
        logoUrl: cachedLogo,
        isFallback: true,
      };
    }
    return {
      cardapio: [...localFallbackMenu],
      bannerUrl: HERO_IMAGE_URL,
      logoUrl: cachedLogo,
      isFallback: true,
    };
  }
}

export async function fetchCustomerOrders(telefone: string): Promise<{
  orders: OrderRecord[];
  isFallback: boolean;
}> {
  const cleanPhone = telefone.replace(/\D/g, '');
  if (!cleanPhone) {
    return { orders: [], isFallback: false };
  }

  try {
    const response = await fetch(
      `${GOOGLE_SCRIPT_URL}?action=getMeusPedidos&telefone=${encodeURIComponent(cleanPhone)}`,
      {
        method: 'GET',
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.pedidos)
          ? data.pedidos
          : null;

    if (!list) {
      throw new Error('Formato de resposta inválido para Meus Pedidos');
    }

    const normalized = list.map((item: Record<string, unknown>, i: number) =>
      normalizeOrderRecord(item, i)
    );

    normalized.sort((a: OrderRecord, b: OrderRecord) => {
      const tA = new Date(a.Data_Hora).getTime();
      const tB = new Date(b.Data_Hora).getTime();
      if (Number.isNaN(tA) || Number.isNaN(tB)) return 0;
      return tB - tA;
    });

    return { orders: normalized, isFallback: false };
  } catch (error) {
    console.warn(
      '[Tá On Burger] API do Google Sheets indisponível ao consultar Meus Pedidos. Usando fallback local.',
      error
    );
    const matching = localFallbackOrders
      .filter((o) => o.Cliente_WhatsApp.replace(/\D/g, '') === cleanPhone)
      .sort((a, b) => {
        const tA = new Date(a.Data_Hora).getTime();
        const tB = new Date(b.Data_Hora).getTime();
        if (Number.isNaN(tA) || Number.isNaN(tB)) return 0;
        return tB - tA;
      });
    return { orders: matching, isFallback: true };
  }
}

export async function verifyAdminPassword(senha: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'verificarSenha',
        senha,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    const parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {};

    if (parsed && parsed.valid === true) {
      return { valid: true };
    }

    return {
      valid: false,
      error: 'Senha incorreta',
    };
  } catch (error) {
    console.warn('[Tá On Burger] Erro ao validar senha do painel admin:', error);
    return {
      valid: false,
      error: 'Não foi possível validar a senha. Tente novamente.',
    };
  }
}

export async function changeAdminPassword(
  senhaAtual: string,
  novaSenha: string
): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'alterarSenha',
        senha_atual: senhaAtual,
        nova_senha: novaSenha,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    const parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {};

    const hasError =
      parsed?.status === 'error' ||
      parsed?.success === false ||
      parsed?.valid === false ||
      typeof parsed?.error === 'string' ||
      typeof parsed?.erro === 'string';

    if (hasError) {
      const errorMsg =
        parsed.message ??
        parsed.mensagem ??
        parsed.error ??
        parsed.erro ??
        'Senha atual incorreta.';
      return {
        success: false,
        message: String(errorMsg),
      };
    }

    return {
      success: true,
      message: String(
        parsed?.message ?? parsed?.mensagem ?? 'Senha alterada com sucesso!'
      ),
    };
  } catch (error) {
    console.warn('[Tá On Burger] Erro ao alterar senha do painel admin:', error);
    return {
      success: false,
      message: 'Não foi possível conectar ao servidor para alterar a senha.',
    };
  }
}


