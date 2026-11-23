import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  ClipboardList,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { HERO_IMAGE_URL } from '../data/fallbackData';
import {
  deleteMenuItem,
  fetchMenu,
  fetchOrders,
  saveMenuItem,
  updateOrderStatus,
} from '../services/api';
import type {
  MenuItem,
  OrderRecord,
  OrderStatus,
  SaveMenuItemPayload,
  ToastType,
} from '../types';
import {
  ORDER_STATUS_OPTIONS,
  formatCurrency,
  formatOrderDateTime,
  parseOrderItems,
} from '../utils/formatters';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { MenuItemFormModal } from './MenuItemFormModal';
import { SafeImage } from './SafeImage';

interface AdminPanelProps {
  isStoreOpen: boolean;
  onToggleStoreOpen: (open: boolean) => void;
  heroImageUrl: string;
  onUpdateHeroImage: (newUrl: string) => void;
  onClose: () => void;
  onMenuChanged: (updatedMenu: MenuItem[]) => void;
  onShowToast: (message: string, type?: ToastType) => void;
}

type AdminTab = 'orders' | 'menu' | 'home';
type StatusFilter = 'Todos' | OrderStatus;

const STATUS_FILTERS: StatusFilter[] = ['Todos', ...ORDER_STATUS_OPTIONS];
const POLL_INTERVAL_MS = 30000;

function getStatusAccentClass(status: OrderStatus): string {
  switch (status) {
    case 'Pendente':
      return 'text-[#F59E0B] border-[#F59E0B]/40 bg-[#F59E0B]/10';
    case 'Em Preparo':
      return 'text-[#FF6B00] border-[#FF6B00]/40 bg-[#FF6B00]/10';
    case 'Saiu para Entrega':
      return 'text-sky-400 border-sky-400/40 bg-sky-400/10';
    case 'Concluído':
      return 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10';
    case 'Cancelado':
      return 'text-red-400 border-red-400/40 bg-red-400/10';
  }
}

export function AdminPanel({
  isStoreOpen,
  onToggleStoreOpen,
  heroImageUrl,
  onUpdateHeroImage,
  onClose,
  onMenuChanged,
  onShowToast,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');

  // Home screen image editor state
  const [isEditingHero, setIsEditingHero] = useState(false);
  const [draftHeroUrl, setDraftHeroUrl] = useState(heroImageUrl);

  useEffect(() => {
    if (!isEditingHero) {
      setDraftHeroUrl(heroImageUrl);
    }
  }, [heroImageUrl, isEditingHero]);

  // Orders state
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Menu CRUD state
  const [adminMenu, setAdminMenu] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [refreshingMenu, setRefreshingMenu] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  // Refs prevent dependency-driven infinite fetch loops when parent props or state change
  const onMenuChangedRef = useRef(onMenuChanged);
  onMenuChangedRef.current = onMenuChanged;

  const updatingOrderIdRef = useRef(updatingOrderId);
  updatingOrderIdRef.current = updatingOrderId;

  const isMutatingMenuRef = useRef(false);
  isMutatingMenuRef.current = savingItem || deletingItem || togglingItemId !== null;

  const loadOrders = useCallback(async (mode: 'initial' | 'manual' | 'poll' = 'initial') => {
    if (mode === 'initial') setLoadingOrders(true);
    if (mode === 'manual') setRefreshingOrders(true);

    try {
      const { orders: fetched } = await fetchOrders();
      setOrders((prev) => {
        const activeUpdateId = updatingOrderIdRef.current;
        if (!activeUpdateId) return fetched;
        // Preserve in-flight local optimistic status if an update is running
        const localEntry = prev.find((o) => o.ID_Pedido === activeUpdateId);
        return fetched.map((o) =>
          o.ID_Pedido === activeUpdateId && localEntry ? localEntry : o
        );
      });
      setLastUpdated(
        new Intl.DateTimeFormat('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).format(new Date())
      );
    } finally {
      if (mode === 'initial') setLoadingOrders(false);
      if (mode === 'manual') setRefreshingOrders(false);
    }
  }, []);

  const loadAdminMenu = useCallback(async (mode: 'initial' | 'manual' | 'poll' = 'initial') => {
    if (mode === 'poll' && isMutatingMenuRef.current) return;
    if (mode === 'initial') setLoadingMenu(true);
    if (mode === 'manual') setRefreshingMenu(true);

    try {
      const { items } = await fetchMenu();
      setAdminMenu(items);
      onMenuChangedRef.current(items);
    } finally {
      if (mode === 'initial') setLoadingMenu(false);
      if (mode === 'manual') setRefreshingMenu(false);
    }
  }, []);

  // Fetch initial data strictly once on mount
  useEffect(() => {
    void loadOrders('initial');
    void loadAdminMenu('initial');
  }, [loadOrders, loadAdminMenu]);

  // Background polling strictly every 30 seconds without flashing skeletons
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadOrders('poll');
      void loadAdminMenu('poll');
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [loadOrders, loadAdminMenu]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    const prevOrders = [...orders];
    setOrders((curr) =>
      curr.map((o) => (o.ID_Pedido === orderId ? { ...o, Status: newStatus } : o))
    );

    try {
      await updateOrderStatus(orderId, newStatus);
      onShowToast(`Pedido ${orderId} atualizado para "${newStatus}"`, 'success');
    } catch {
      setOrders(prevOrders);
      onShowToast('Erro ao atualizar status do pedido', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleSaveMenuItem = async (payload: SaveMenuItemPayload) => {
    setSavingItem(true);
    try {
      const { item } = await saveMenuItem(payload);
      const exists = adminMenu.some((m) => m.ID === item.ID);
      const next = exists
        ? adminMenu.map((m) => (m.ID === item.ID ? item : m))
        : [item, ...adminMenu];
      setAdminMenu(next);
      onMenuChangedRef.current(next);
      setFormOpen(false);
      setEditingItem(null);
      onShowToast(
        payload.id ? 'Prato atualizado no cardápio' : 'Novo prato adicionado ao cardápio',
        'success'
      );
    } catch {
      onShowToast('Erro ao salvar prato', 'error');
    } finally {
      setSavingItem(false);
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    setTogglingItemId(item.ID);
    const updatedDisponivel = !item.Disponivel;
    try {
      await saveMenuItem({
        id: item.ID,
        nome: item.Nome,
        descricao: item.Descricao,
        preco: item.Preco,
        categoria: item.Categoria,
        imagem_url: item.Imagem_URL,
        disponivel: updatedDisponivel,
      });

      const next = adminMenu.map((m) =>
        m.ID === item.ID ? { ...m, Disponivel: updatedDisponivel } : m
      );
      setAdminMenu(next);
      onMenuChangedRef.current(next);

      onShowToast(
        updatedDisponivel
          ? `${item.Nome} ativado na vitrine`
          : `${item.Nome} pausado na vitrine`,
        'info'
      );
    } catch {
      onShowToast('Erro ao alterar disponibilidade', 'error');
    } finally {
      setTogglingItemId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingItem(true);
    try {
      await deleteMenuItem(deleteTarget.ID);
      const next = adminMenu.filter((m) => m.ID !== deleteTarget.ID);
      setAdminMenu(next);
      onMenuChangedRef.current(next);
      onShowToast(`${deleteTarget.Nome} excluído do cardápio`, 'success');
      setDeleteTarget(null);
    } catch {
      onShowToast('Erro ao excluir prato', 'error');
    } finally {
      setDeletingItem(false);
    }
  };

  // Sort orders chronologically (oldest active/pending first so kitchen prepares in FIFO order)
  const sortedOrders = [...orders].sort((a, b) => {
    const timeA = new Date(a.Data_Hora).getTime();
    const timeB = new Date(b.Data_Hora).getTime();
    if (Number.isNaN(timeA) || Number.isNaN(timeB)) return 0;
    return timeA - timeB;
  });

  const filteredOrders =
    statusFilter === 'Todos'
      ? sortedOrders
      : sortedOrders.filter((o) => o.Status === statusFilter);

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100 flex flex-col">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 bg-[#121212]/95 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 md:py-0 md:h-14 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-3 rounded-xl bg-[#1E1E1E] hover:bg-[#27272A] border border-white/[0.08] text-xs sm:text-sm font-semibold text-zinc-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar à Loja</span>
            </button>
            <h1 className="font-display font-bold text-base sm:text-lg text-white truncate">
              Painel Admin · Tá On Burger
            </h1>
          </div>

          <div className="grid grid-cols-3 md:flex items-center gap-1 p-1 rounded-xl bg-[#1E1E1E] border border-white/[0.06] shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`h-9 px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#FF6B00] text-[#121212]'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span>Pedidos</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('menu')}
              className={`h-9 px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-[#FF6B00] text-[#121212]'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4 shrink-0" />
              <span>Cardápio</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={`h-9 px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-[#FF6B00] text-[#121212]'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4 shrink-0" />
              <span>Tela Inicial</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Store Open / Closed Status Control */}
        <section className="rounded-2xl bg-[#1E1E1E] border border-white/[0.08] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={`w-3 h-3 rounded-full shrink-0 ${
                isStoreOpen
                  ? 'bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.75)]'
                  : 'bg-red-500 shadow-[0_0_10px_2px_rgba(239,68,68,0.75)]'
              }`}
            />
            <div>
              <p className="text-sm font-semibold text-white">
                Status da Loja:{' '}
                <span className={isStoreOpen ? 'text-emerald-400' : 'text-red-400'}>
                  {isStoreOpen ? 'Aberto Agora' : 'Fechado'}
                </span>
              </p>
              <p className="text-xs text-zinc-400">
                Define o indicador exibido para os clientes na tela inicial.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#121212] border border-white/[0.08] self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => onToggleStoreOpen(true)}
              className={`h-9 px-3.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                isStoreOpen
                  ? 'bg-emerald-500 text-[#121212]'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              Aberto Agora
            </button>
            <button
              type="button"
              onClick={() => onToggleStoreOpen(false)}
              className={`h-9 px-3.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                !isStoreOpen
                  ? 'bg-red-500 text-white'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              Fechado
            </button>
          </div>
        </section>

        {activeTab === 'orders' && (
          <section className="space-y-5">
            {/* Toolbar: Filter & Refresh */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
                {STATUS_FILTERS.map((filter) => {
                  const count =
                    filter === 'Todos'
                      ? orders.length
                      : orders.filter((o) => o.Status === filter).length;
                  const active = statusFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setStatusFilter(filter)}
                      className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#FF6B00] text-[#121212]'
                          : 'bg-[#1E1E1E] text-zinc-300 hover:bg-[#27272A] border border-white/[0.06]'
                      }`}
                    >
                      <span>{filter}</span>
                      <span
                        className={`font-mono text-xs tabular-nums ${
                          active ? 'text-[#121212]/80' : 'text-zinc-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0">
                {lastUpdated && (
                  <span className="text-xs text-zinc-400 font-mono tabular-nums">
                    Atualizado às {lastUpdated} (auto 30s)
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void loadOrders('manual')}
                  disabled={loadingOrders || refreshingOrders}
                  className="h-10 px-4 rounded-xl bg-[#1E1E1E] hover:bg-[#27272A] border border-white/[0.08] text-xs sm:text-sm font-semibold text-white flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-[#FF6B00] ${
                      loadingOrders || refreshingOrders ? 'animate-spin' : ''
                    }`}
                  />
                  <span>Atualizar Lista</span>
                </button>
              </div>
            </div>

            {/* Orders Queue */}
            {loadingOrders ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-60 rounded-2xl bg-[#1E1E1E] border border-white/[0.06] animate-pulse p-5"
                  />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="rounded-2xl bg-[#1E1E1E] border border-white/[0.06] p-10 text-center space-y-2">
                <p className="font-display font-semibold text-lg text-white">
                  Nenhum pedido encontrado
                </p>
                <p className="text-sm text-zinc-400">
                  Não há pedidos com o filtro &ldquo;{statusFilter}&rdquo; no momento.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredOrders.map((order) => {
                  const parsedItems = parseOrderItems(order.Itens_JSON);
                  const isUpdating = updatingOrderId === order.ID_Pedido;
                  return (
                    <article
                      key={order.ID_Pedido}
                      className="rounded-2xl bg-[#1E1E1E] border border-white/[0.08] p-5 flex flex-col justify-between gap-4"
                    >
                      {/* Top row: Order ID, Time & Status Selector */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-base text-white">
                              {order.ID_Pedido}
                            </span>
                            <span className="text-xs text-zinc-400 flex items-center gap-1 font-mono tabular-nums">
                              <Clock className="w-3.5 h-3.5" />
                              {formatOrderDateTime(order.Data_Hora)}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-zinc-100 mt-1">
                            {order.Cliente_Nome}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {isUpdating && (
                            <Loader2 className="w-4 h-4 text-[#FF6B00] animate-spin" />
                          )}
                          <select
                            aria-label={`Status do pedido ${order.ID_Pedido}`}
                            value={order.Status}
                            disabled={isUpdating}
                            onChange={(e) =>
                              handleStatusChange(
                                order.ID_Pedido,
                                e.target.value as OrderStatus
                              )
                            }
                            className={`h-10 px-3 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF6B00] cursor-pointer ${getStatusAccentClass(
                              order.Status
                            )}`}
                          >
                            {ORDER_STATUS_OPTIONS.map((statusOpt) => (
                              <option
                                key={statusOpt}
                                value={statusOpt}
                                className="bg-[#1E1E1E] text-white"
                              >
                                {statusOpt}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Customer contact & address */}
                      <div className="space-y-1.5 text-xs sm:text-sm text-zinc-300">
                        {order.Cliente_WhatsApp && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
                            <a
                              href={`https://wa.me/55${order.Cliente_WhatsApp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-[#FF6B00] underline-offset-2 hover:underline font-mono"
                            >
                              {order.Cliente_WhatsApp}
                            </a>
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#FF6B00] shrink-0 mt-0.5" />
                          <span className="text-zinc-300">{order.Endereco}</span>
                        </div>
                      </div>

                      {/* Items list */}
                      <div className="rounded-xl bg-[#141416] border border-white/[0.05] p-3.5 space-y-2">
                        {parsedItems.map((it, idx) => (
                          <div key={idx} className="text-xs sm:text-sm">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-zinc-100 font-medium">
                                <span className="font-mono text-[#FF6B00] mr-1.5">
                                  {it.quantidade}x
                                </span>
                                {it.nome}
                              </span>
                              {it.preco > 0 && (
                                <span className="font-mono text-xs text-zinc-400 tabular-nums shrink-0">
                                  {formatCurrency(it.preco * it.quantidade)}
                                </span>
                              )}
                            </div>
                            {it.observacoes && (
                              <p className="text-xs text-[#F59E0B] pl-5 mt-0.5">
                                Obs: {it.observacoes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Footer: Payment & Total */}
                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-3 text-sm">
                        <span className="text-xs text-zinc-400">
                          Pagamento:{' '}
                          <strong className="text-zinc-200 font-medium">
                            {order.Forma_Pagamento}
                          </strong>
                        </span>
                        <span className="font-mono font-bold text-base text-[#F59E0B] tabular-nums">
                          {formatCurrency(order.Total)}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === 'menu' && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-bold text-xl text-white">
                  Itens do Cardápio ({adminMenu.length})
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Adicione, edite, pause ou remova pratos sincronizados com o Google
                  Sheets.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => void loadAdminMenu('manual')}
                  disabled={loadingMenu || refreshingMenu}
                  className="h-11 px-4 rounded-xl bg-[#1E1E1E] hover:bg-[#27272A] border border-white/[0.08] text-sm font-semibold text-white flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-[#FF6B00] ${
                      loadingMenu || refreshingMenu ? 'animate-spin' : ''
                    }`}
                  />
                  <span>Atualizar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setFormOpen(true);
                  }}
                  className="h-11 px-4 rounded-xl bg-[#FF6B00] hover:bg-[#FF7D1F] text-[#121212] font-bold text-sm flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Novo Item</span>
                </button>
              </div>
            </div>

            {loadingMenu ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-24 rounded-2xl bg-[#1E1E1E] border border-white/[0.06] animate-pulse"
                  />
                ))}
              </div>
            ) : adminMenu.length === 0 ? (
              <div className="rounded-2xl bg-[#1E1E1E] border border-white/[0.06] p-10 text-center">
                <p className="font-display font-semibold text-lg text-white">
                  Cardápio vazio
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  Clique em &ldquo;+ Novo Item&rdquo; para cadastrar o primeiro prato.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminMenu.map((item) => {
                  const isToggling = togglingItemId === item.ID;
                  return (
                    <article
                      key={item.ID}
                      className={`rounded-2xl bg-[#1E1E1E] border p-4 flex gap-4 transition-opacity ${
                        item.Disponivel
                          ? 'border-white/[0.08]'
                          : 'border-white/[0.04] opacity-65'
                      }`}
                    >
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#141416] border border-white/[0.06] shrink-0">
                        <SafeImage
                          src={item.Imagem_URL}
                          alt={item.Nome}
                          fallbackLabel={item.Nome}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                        <div>
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-zinc-400">
                              {item.Categoria} · {item.Disponivel ? 'Ativo' : 'Pausado'}
                            </span>
                            <span className="font-mono font-semibold text-[#F59E0B] tabular-nums">
                              {formatCurrency(item.Preco)}
                            </span>
                          </div>
                          <h3 className="font-display font-semibold text-base text-white truncate mt-0.5">
                            {item.Nome}
                          </h3>
                          <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                            {item.Descricao}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(item);
                              setFormOpen(true);
                            }}
                            className="h-9 px-3 rounded-lg bg-[#121212] hover:bg-zinc-800 border border-white/[0.08] text-xs font-medium text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            disabled={isToggling}
                            onClick={() => handleToggleAvailability(item)}
                            className="h-9 px-3 rounded-lg bg-[#121212] hover:bg-zinc-800 border border-white/[0.08] text-xs font-medium text-zinc-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {isToggling ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : item.Disponivel ? (
                              <EyeOff className="w-3.5 h-3.5 text-[#F59E0B]" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                            <span>{item.Disponivel ? 'Pausar' : 'Ativar'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="h-9 px-3 rounded-lg bg-[#121212] hover:bg-red-500/15 border border-white/[0.08] hover:border-red-500/30 text-xs font-medium text-red-400 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === 'home' && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-bold text-xl text-white">
                  Imagem da Tela Inicial
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Visualize e altere a foto principal exibida no topo da loja.
                </p>
              </div>

              {!isEditingHero && (
                <button
                  type="button"
                  onClick={() => {
                    setDraftHeroUrl(heroImageUrl);
                    setIsEditingHero(true);
                  }}
                  className="h-11 px-4 rounded-xl bg-[#FF6B00] hover:bg-[#FF7D1F] text-[#121212] font-bold text-sm flex items-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Editar</span>
                </button>
              )}
            </div>

            <div className="rounded-2xl bg-[#1E1E1E] border border-white/[0.08] p-4 sm:p-6 space-y-5">
              {/* Visualização da imagem */}
              <div className="space-y-2">
                <span className="block text-xs font-medium text-zinc-400">
                  {isEditingHero ? 'Pré-visualização da nova imagem' : 'Imagem atual na tela inicial'}
                </span>
                <div className="aspect-[16/9] sm:aspect-[21/9] max-h-80 w-full rounded-xl overflow-hidden bg-[#121212] border border-white/[0.08]">
                  <SafeImage
                    src={isEditingHero ? draftHeroUrl : heroImageUrl}
                    alt="Pré-visualização da imagem da tela inicial"
                    fallbackLabel={
                      isEditingHero
                        ? 'Cole um link válido abaixo para visualizar'
                        : 'Tá On Burger'
                    }
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {isEditingHero ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const cleaned = draftHeroUrl.trim();
                    if (!cleaned) {
                      onShowToast('Informe o link da nova imagem', 'error');
                      return;
                    }
                    onUpdateHeroImage(cleaned);
                    setIsEditingHero(false);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="hero-img-url"
                      className="block text-xs font-medium text-zinc-300 mb-1.5"
                    >
                      Link da nova imagem (URL)
                    </label>
                    <input
                      id="hero-img-url"
                      type="text"
                      value={draftHeroUrl}
                      onChange={(e) => setDraftHeroUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full h-11 px-3.5 rounded-xl bg-[#121212] border border-white/[0.1] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setDraftHeroUrl(HERO_IMAGE_URL)}
                      className="h-10 px-3.5 rounded-xl bg-[#121212] hover:bg-zinc-800 border border-white/[0.08] text-xs font-semibold text-zinc-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Usar imagem padrão</span>
                    </button>

                    <div className="flex items-center gap-2.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setDraftHeroUrl(heroImageUrl);
                          setIsEditingHero(false);
                        }}
                        className="h-10 px-4 rounded-xl bg-[#121212] hover:bg-zinc-800 border border-white/[0.08] text-sm font-semibold text-zinc-300 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="h-10 px-5 rounded-xl bg-[#FF6B00] hover:bg-[#FF7D1F] text-[#121212] text-sm font-bold cursor-pointer"
                      >
                        Salvar Imagem
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-white/[0.06]">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-400">Link atual</p>
                    <p className="text-xs sm:text-sm font-mono text-zinc-200 truncate mt-0.5">
                      {heroImageUrl}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDraftHeroUrl(heroImageUrl);
                      setIsEditingHero(true);
                    }}
                    className="h-10 px-4 rounded-xl bg-[#121212] hover:bg-zinc-800 border border-white/[0.08] text-xs sm:text-sm font-semibold text-white flex items-center gap-2 self-start sm:self-auto shrink-0 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-[#FF6B00]" />
                    <span>Editar Link</span>
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <MenuItemFormModal
        isOpen={formOpen}
        editingItem={editingItem}
        saving={savingItem}
        onClose={() => {
          setFormOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveMenuItem}
      />

      <ConfirmDeleteModal
        itemName={deleteTarget?.Nome ?? null}
        deleting={deletingItem}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
