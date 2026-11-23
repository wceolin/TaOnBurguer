import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import {
  Bike,
  CheckCircle2,
  Clock,
  Flame,
  Loader2,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  X,
  XCircle,
} from 'lucide-react';
import { CUSTOMER_PHONE_STORAGE_KEY } from '../data/fallbackData';
import { fetchCustomerOrders } from '../services/api';
import type { OrderRecord, OrderStatus } from '../types';
import {
  formatCurrency,
  formatOrderDateTime,
  formatPhoneMask,
  parseOrderItems,
} from '../utils/formatters';

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TRACKER_STEPS: {
  status: OrderStatus;
  label: string;
  icon: typeof Clock;
}[] = [
  { status: 'Pendente', label: 'Pendente', icon: Clock },
  { status: 'Em Preparo', label: 'Em Preparo', icon: Flame },
  { status: 'Saiu para Entrega', label: 'Saiu para Entrega', icon: Bike },
  { status: 'Concluído', label: 'Concluído', icon: PackageCheck },
];

function getTrackerStepIndex(status: OrderStatus): number {
  const idx = TRACKER_STEPS.findIndex((s) => s.status === status);
  return idx >= 0 ? idx : 0;
}

export function MyOrdersModal({ isOpen, onClose }: MyOrdersModalProps) {
  const [phoneInput, setPhoneInput] = useState('');
  const [activePhone, setActivePhone] = useState('');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [inputError, setInputError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  const activePhoneRef = useRef(activePhone);
  activePhoneRef.current = activePhone;

  const loadOrdersByPhone = useCallback(
    async (rawPhone: string, mode: 'initial' | 'manual' | 'poll' = 'initial') => {
      const clean = rawPhone.replace(/\D/g, '');
      if (clean.length < 10) return;

      if (mode === 'initial') setLoading(true);
      if (mode === 'manual') setRefreshing(true);

      try {
        const { orders: fetched } = await fetchCustomerOrders(clean);
        setOrders(fetched);
        setHasSearched(true);
        setActivePhone(clean);
        try {
          window.localStorage.setItem(CUSTOMER_PHONE_STORAGE_KEY, clean);
        } catch {
          // Ignore storage errors
        }
        setLastUpdated(
          new Intl.DateTimeFormat('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }).format(new Date())
        );
      } finally {
        if (mode === 'initial') setLoading(false);
        if (mode === 'manual') setRefreshing(false);
      }
    },
    []
  );

  // On open, check saved phone in localStorage and auto-search
  useEffect(() => {
    if (!isOpen) return;
    setInputError('');
    try {
      const saved = window.localStorage.getItem(CUSTOMER_PHONE_STORAGE_KEY);
      if (saved && saved.replace(/\D/g, '').length >= 10) {
        const masked = formatPhoneMask(saved);
        setPhoneInput(masked);
        void loadOrdersByPhone(saved, 'initial');
      } else {
        setHasSearched(false);
        setOrders([]);
        setActivePhone('');
      }
    } catch {
      // Ignore storage errors
    }
  }, [isOpen, loadOrdersByPhone]);

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Auto-refresh every 30 seconds while modal is open and a phone is active
  useEffect(() => {
    if (!isOpen || !activePhone) return;
    const intervalId = window.setInterval(() => {
      if (activePhoneRef.current) {
        void loadOrdersByPhone(activePhoneRef.current, 'poll');
      }
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, [isOpen, activePhone, loadOrdersByPhone]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setInputError('');
    const digits = phoneInput.replace(/\D/g, '');
    if (digits.length < 10) {
      setInputError('Digite um WhatsApp válido com DDD.');
      return;
    }
    void loadOrdersByPhone(digits, 'initial');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="my-orders-title"
    >
      <div
        className="w-full sm:max-w-xl max-h-[92vh] bg-[#18181A] border border-white/[0.08] rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden w-10 h-1.5 bg-zinc-700 rounded-full mx-auto mt-2.5 shrink-0" />

        {/* Modal Header */}
        <div className="h-14 px-5 border-b border-white/[0.08] flex items-center justify-between gap-3 shrink-0 bg-[#121212]">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#FF6B00]" />
            <h2 id="my-orders-title" className="font-display font-bold text-lg text-white">
              Meus Pedidos
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Meus Pedidos"
            className="w-10 h-10 -mr-2 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phone Search Bar */}
        <div className="p-4 sm:p-5 border-b border-white/[0.06] bg-[#141416] shrink-0 space-y-2.5">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1">
              <label htmlFor="my-orders-phone" className="sr-only">
                Seu WhatsApp com DDD
              </label>
              <input
                id="my-orders-phone"
                type="tel"
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(formatPhoneMask(e.target.value));
                  if (inputError) setInputError('');
                }}
                placeholder="(00) 00000-0000"
                className="w-full h-11 px-3.5 rounded-xl bg-[#121212] border border-white/[0.1] text-sm font-mono text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-11 px-5 rounded-xl bg-[#FF6B00] hover:bg-[#FF7D1F] disabled:opacity-60 text-[#121212] font-bold text-sm flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Buscar Pedidos</span>
                </>
              )}
            </button>
          </form>

          {inputError && <p className="text-xs text-red-400">{inputError}</p>}

          {hasSearched && !loading && (
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-xs text-zinc-400 font-mono tabular-nums">
                {lastUpdated ? `Atualizado às ${lastUpdated} (auto 30s)` : ''}
              </span>
              <button
                type="button"
                onClick={() =>
                  activePhone && void loadOrdersByPhone(activePhone, 'manual')
                }
                disabled={refreshing || loading}
                className="h-9 px-3 rounded-lg bg-[#1E1E1E] hover:bg-[#27272A] border border-white/[0.08] text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-[#FF6B00] ${refreshing ? 'animate-spin' : ''}`}
                />
                <span>Atualizar Status</span>
              </button>
            </div>
          )}
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 rounded-2xl bg-[#1E1E1E] border border-white/[0.06] animate-pulse p-4"
                />
              ))}
            </div>
          ) : !hasSearched ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-[#1E1E1E] border border-white/[0.08] flex items-center justify-center text-[#FF6B00] mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <p className="font-display font-semibold text-base text-white">
                Acompanhe seu pedido em tempo real
              </p>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
                Digite o número de WhatsApp usado na compra para conferir o andamento na
                chapa e entrega.
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-10 text-center space-y-2 rounded-2xl bg-[#1E1E1E] border border-white/[0.06] p-6">
              <p className="font-display font-semibold text-base text-white">
                Nenhum pedido encontrado
              </p>
              <p className="text-xs sm:text-sm text-zinc-400">
                Não encontramos pedidos para o número{' '}
                <span className="font-mono text-zinc-200">{phoneInput}</span>.
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const items = parseOrderItems(order.Itens_JSON);
              const isCompleted = order.Status === 'Concluído';
              const isCancelled = order.Status === 'Cancelado';
              const isActive = !isCompleted && !isCancelled;
              const currentStepIdx = getTrackerStepIndex(order.Status);

              return (
                <article
                  key={order.ID_Pedido}
                  className="rounded-2xl bg-[#1E1E1E] border border-white/[0.08] p-4 sm:p-5 space-y-4"
                >
                  {/* Top metadata row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-sm sm:text-base text-white">
                        {order.ID_Pedido}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono tabular-nums">
                        · {formatOrderDateTime(order.Data_Hora)}
                      </span>
                    </div>

                    {isCompleted && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Concluído</span>
                      </span>
                    )}
                    {isCancelled && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400">
                        <XCircle className="w-4 h-4" />
                        <span>Cancelado</span>
                      </span>
                    )}
                    {isActive && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6B00]">
                        <span>{order.Status}</span>
                      </span>
                    )}
                  </div>

                  {/* Visual Progress Tracker for Active Orders */}
                  {isActive && (
                    <div className="py-1">
                      <div className="grid grid-cols-4 gap-1.5">
                        {TRACKER_STEPS.map((step, idx) => {
                          const Icon = step.icon;
                          const isCurrent = idx === currentStepIdx;
                          const isDone = idx < currentStepIdx;
                          const isReached = idx <= currentStepIdx;

                          return (
                            <div key={step.status} className="flex flex-col items-center gap-1.5">
                              {/* Progress bar segment */}
                              <div
                                className={`w-full h-1.5 rounded-full transition-colors ${
                                  isCurrent
                                    ? 'bg-[#FF6B00] shadow-[0_0_8px_rgba(255,107,0,0.65)]'
                                    : isDone
                                      ? 'bg-[#F59E0B]'
                                      : 'bg-zinc-800'
                                }`}
                              />
                              <div className="flex flex-col items-center text-center gap-0.5">
                                <Icon
                                  className={`w-3.5 h-3.5 ${
                                    isCurrent
                                      ? 'text-[#FF6B00]'
                                      : isDone
                                        ? 'text-[#F59E0B]'
                                        : 'text-zinc-600'
                                  }`}
                                />
                                <span
                                  className={`text-[10px] sm:text-[11px] leading-tight font-medium ${
                                    isCurrent
                                      ? 'text-white font-semibold'
                                      : isReached
                                        ? 'text-zinc-300'
                                        : 'text-zinc-500'
                                  }`}
                                >
                                  {step.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div className="rounded-xl bg-[#141416] border border-white/[0.05] p-3 space-y-1.5">
                    {items.map((it, idx) => (
                      <div key={idx} className="text-xs sm:text-sm">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-zinc-100">
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
                  <div className="flex items-center justify-between gap-2 text-xs sm:text-sm pt-1">
                    <span className="text-zinc-400">
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
            })
          )}
        </div>
      </div>
    </div>
  );
}
