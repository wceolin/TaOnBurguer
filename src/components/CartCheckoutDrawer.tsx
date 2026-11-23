import { useState, useEffect, type FormEvent } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  QrCode,
  ShoppingBag,
  Trash2,
  Banknote,
  X,
} from 'lucide-react';
import { STORE_WHATSAPP_NUMBER } from '../data/fallbackData';
import { createOrder } from '../services/api';
import type {
  CartItem,
  OrderItemPayload,
  PaymentMethod,
  ToastType,
} from '../types';
import {
  buildWhatsAppOrderUrl,
  formatCurrency,
  formatPhoneMask,
} from '../utils/formatters';
import { SafeImage } from './SafeImage';

interface CartCheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onShowToast: (message: string, type?: ToastType) => void;
}

type DrawerStep = 'cart' | 'checkout' | 'success';

interface ConfirmedOrderSummary {
  orderId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  payment: string;
  items: OrderItemPayload[];
  total: number;
}

export function CartCheckoutDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onShowToast,
}: CartCheckoutDrawerProps) {
  const [step, setStep] = useState<DrawerStep>('cart');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Checkout fields
  const [customerName, setCustomerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [complement, setComplement] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  const [changeFor, setChangeFor] = useState('');

  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrderSummary | null>(
    null
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && step === 'success' && cart.length > 0) {
      setStep('cart');
    }
  }, [isOpen, step, cart.length]);

  if (!isOpen) return null;

  const total = cart.reduce(
    (sum, item) => sum + item.menuItem.Preco * item.quantity,
    0
  );

  const handleClose = () => {
    if (step === 'success') {
      setStep('cart');
      setConfirmedOrder(null);
    }
    setFormError('');
    onClose();
  };

  const handleSubmitOrder = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanName = customerName.trim();
    const cleanPhone = whatsapp.trim();
    const cleanStreet = street.trim();
    const cleanNumber = number.trim();
    const cleanNeighborhood = neighborhood.trim();

    if (!cleanName || cleanPhone.replace(/\D/g, '').length < 10) {
      setFormError('Informe seu nome completo e um WhatsApp válido com DDD.');
      return;
    }

    if (!cleanStreet || !cleanNumber || !cleanNeighborhood) {
      setFormError('Preencha Rua, Número e Bairro para a entrega.');
      return;
    }

    const fullAddress = `${cleanStreet}, ${cleanNumber}, ${cleanNeighborhood}${
      complement.trim() ? ` — ${complement.trim()}` : ''
    }`;

    const paymentLabel =
      paymentMethod === 'Dinheiro' && changeFor.trim()
        ? `Dinheiro (Troco para R$ ${changeFor.trim()})`
        : paymentMethod;

    const orderItems: OrderItemPayload[] = cart.map((c) => ({
      id: c.menuItem.ID,
      nome: c.menuItem.Nome,
      quantidade: c.quantity,
      preco: c.menuItem.Preco,
      ...(c.notes ? { observacoes: c.notes } : {}),
    }));

    setSubmitting(true);
    try {
      const { orderId } = await createOrder({
        cliente: cleanName,
        whatsapp: cleanPhone,
        endereco: fullAddress,
        itens: orderItems,
        total,
        pagamento: paymentLabel,
      });

      setConfirmedOrder({
        orderId,
        customerName: cleanName,
        customerPhone: cleanPhone,
        address: fullAddress,
        payment: paymentLabel,
        items: orderItems,
        total,
      });
      onClearCart();
      setStep('success');
      onShowToast('Pedido enviado com sucesso!', 'success');
    } catch {
      setFormError('Não foi possível enviar o pedido. Tente novamente.');
      onShowToast('Erro ao enviar pedido', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappUrl = confirmedOrder
    ? buildWhatsAppOrderUrl({
        storePhone: STORE_WHATSAPP_NUMBER,
        orderId: confirmedOrder.orderId,
        customerName: confirmedOrder.customerName,
        customerPhone: confirmedOrder.customerPhone,
        address: confirmedOrder.address,
        payment: confirmedOrder.payment,
        items: confirmedOrder.items,
        total: confirmedOrder.total,
      })
    : '#';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Sacola e Finalização de Pedido"
    >
      <div
        className="w-full sm:max-w-md h-full bg-[#18181A] border-l border-white/[0.08] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer header */}
        <div className="h-14 px-4 sm:px-5 border-b border-white/[0.08] flex items-center justify-between gap-3 shrink-0 bg-[#121212]">
          <div className="flex items-center gap-2.5 min-w-0">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => {
                  setFormError('');
                  setStep('cart');
                }}
                aria-label="Voltar para sacola"
                className="w-10 h-10 -ml-2 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/[0.06] cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="font-display font-bold text-lg text-white truncate">
              {step === 'cart' && 'Sua Sacola'}
              {step === 'checkout' && 'Finalizar Pedido'}
              {step === 'success' && 'Pedido Recebido'}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar sacola"
            className="w-10 h-10 -mr-2 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {step === 'cart' && (
            <>
              {cart.length === 0 ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center px-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#1E1E1E] border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-4">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <p className="font-display font-semibold text-lg text-white">
                    Sua sacola está vazia
                  </p>
                  <p className="text-sm text-zinc-400 mt-1 max-w-xs">
                    Escolha seus burgers artesanais, combos ou porções no cardápio para
                    começar.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>
                      {cart.reduce((acc, i) => acc + i.quantity, 0)} itens selecionados
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClearCart();
                        onShowToast('Sacola esvaziada', 'info');
                      }}
                      className="text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      Limpar sacola
                    </button>
                  </div>

                  <div className="divide-y divide-white/[0.06]">
                    {cart.map((entry) => (
                      <div key={entry.cartItemId} className="py-4 first:pt-0 flex gap-3">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#1E1E1E] border border-white/[0.06] shrink-0">
                          <SafeImage
                            src={entry.menuItem.Imagem_URL}
                            alt={entry.menuItem.Nome}
                            fallbackLabel={entry.menuItem.Nome}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-sm text-white leading-snug">
                              {entry.menuItem.Nome}
                            </h3>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(entry.cartItemId)}
                              aria-label={`Remover ${entry.menuItem.Nome}`}
                              className="p-1 text-zinc-500 hover:text-red-400 transition-colors shrink-0 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {entry.notes && (
                            <p className="text-xs text-zinc-400 break-words">
                              Obs: {entry.notes}
                            </p>
                          )}

                          <div className="pt-1 flex items-center justify-between gap-2">
                            <span className="font-mono text-sm font-semibold text-[#F59E0B] tabular-nums">
                              {formatCurrency(entry.menuItem.Preco * entry.quantity)}
                            </span>

                            <div className="flex items-center bg-[#121212] border border-white/[0.08] rounded-lg">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(entry.cartItemId, -1)}
                                aria-label="Diminuir"
                                className="w-9 h-9 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-6 text-center font-mono text-xs font-semibold text-white tabular-nums">
                                {entry.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(entry.cartItemId, 1)}
                                aria-label="Aumentar"
                                className="w-9 h-9 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'checkout' && (
            <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-5">
              {formError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs sm:text-sm text-red-300"
                >
                  {formError}
                </div>
              )}

              {/* Dados do cliente */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Seus dados</h3>
                <div>
                  <label
                    htmlFor="checkout-name"
                    className="block text-xs font-medium text-zinc-400 mb-1.5"
                  >
                    Nome completo *
                  </label>
                  <input
                    id="checkout-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#121212] border border-white/[0.1] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-whatsapp"
                    className="block text-xs font-medium text-zinc-400 mb-1.5"
                  >
                    WhatsApp *
                  </label>
                  <input
                    id="checkout-whatsapp"
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatPhoneMask(e.target.value))}
                    placeholder="(11) 99999-9999"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#121212] border border-white/[0.1] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <MapPin className="w-4 h-4 text-[#FF6B00]" />
                  <h3>Endereço de entrega</h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label
                      htmlFor="checkout-street"
                      className="block text-xs font-medium text-zinc-400 mb-1.5"
                    >
                      Rua / Avenida *
                    </label>
                    <input
                      id="checkout-street"
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Rua das Flores"
                      className="w-full h-11 px-3.5 rounded-xl bg-[#121212] border border-white/[0.1] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="checkout-number"
                      className="block text-xs font-medium text-zinc-400 mb-1.5"
                    >
                      Número *
                    </label>
                    <input
                      id="checkout-number"
                      type="text"
                      required
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="123"
                      className="w-full h-11 px-3.5 rounded-xl bg-[#121212] border border-white/[0.1] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="checkout-neighborhood"
                      className="block text-xs font-medium text-zinc-400 mb-1.5"
                    >
                      Bairro *
                    </label>
                    <input
                      id="checkout-neighborhood"
                      type="text"
                      required
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Centro"
                      className="w-full h-11 px-3.5 rounded-xl bg-[#121212] border border-white/[0.1] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="checkout-complement"
                      className="block text-xs font-medium text-zinc-400 mb-1.5"
                    >
                      Complemento
                    </label>
                    <input
                      id="checkout-complement"
                      type="text"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      placeholder="Apto, bloco, ref..."
                      className="w-full h-11 px-3.5 rounded-xl bg-[#121212] border border-white/[0.1] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                    />
                  </div>
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                <h3 className="text-sm font-semibold text-white">Forma de pagamento</h3>
                <div className="grid grid-cols-1 gap-2">
                  {(
                    [
                      { id: 'Pix', label: 'Pix (na entrega ou chave)', icon: QrCode },
                      {
                        id: 'Cartão na Entrega',
                        label: 'Cartão na Entrega (Crédito / Débito)',
                        icon: CreditCard,
                      },
                      { id: 'Dinheiro', label: 'Dinheiro', icon: Banknote },
                    ] as const
                  ).map((option) => {
                    const Icon = option.icon;
                    const active = paymentMethod === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setPaymentMethod(option.id)}
                        className={`min-h-[44px] px-3.5 py-2.5 rounded-xl border text-left text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#FF6B00]/15 border-[#FF6B00] text-white'
                            : 'bg-[#121212] border-white/[0.08] text-zinc-300 hover:border-white/20'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            active ? 'text-[#FF6B00]' : 'text-zinc-400'
                          }`}
                        />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>

                {paymentMethod === 'Dinheiro' && (
                  <div>
                    <label
                      htmlFor="checkout-change"
                      className="block text-xs font-medium text-zinc-400 mb-1.5"
                    >
                      Precisa de troco para quanto? (opcional)
                    </label>
                    <input
                      id="checkout-change"
                      type="text"
                      value={changeFor}
                      onChange={(e) => setChangeFor(e.target.value)}
                      placeholder="Ex: 100,00"
                      className="w-full h-11 px-3.5 rounded-xl bg-[#121212] border border-white/[0.1] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                    />
                  </div>
                )}
              </div>
            </form>
          )}

          {step === 'success' && confirmedOrder && (
            <div className="py-4 space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 text-[#FF6B00] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#F59E0B]">
                    Pedido confirmado na cozinha
                  </p>
                  <h3 className="font-display font-bold text-2xl text-white">
                    Pedido {confirmedOrder.orderId}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Recebemos seu pedido e já estamos preparando na chapa.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#1E1E1E] border border-white/[0.08] space-y-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-400">Cliente</span>
                  <span className="font-medium text-white text-right">
                    {confirmedOrder.customerName}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-400">Entrega</span>
                  <span className="font-medium text-white text-right">
                    {confirmedOrder.address}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-400">Pagamento</span>
                  <span className="font-medium text-white text-right">
                    {confirmedOrder.payment}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                  {confirmedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between gap-2 text-xs">
                      <span className="text-zinc-300">
                        {item.quantidade}x {item.nome}
                        {item.observacoes ? ` (${item.observacoes})` : ''}
                      </span>
                      <span className="font-mono text-zinc-200 tabular-nums shrink-0">
                        {formatCurrency(item.preco * item.quantidade)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-white/[0.06] flex justify-between items-center">
                  <span className="font-semibold text-white">Total</span>
                  <span className="font-mono font-bold text-base text-[#F59E0B] tabular-nums">
                    {formatCurrency(confirmedOrder.total)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 px-4 rounded-xl bg-[#25D366] hover:bg-[#22C35E] text-[#121212] font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar resumo no WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full h-11 px-4 rounded-xl bg-[#1E1E1E] hover:bg-[#27272A] border border-white/[0.08] text-sm font-semibold text-zinc-200 transition-colors cursor-pointer"
                >
                  Voltar ao Cardápio
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer footer CTA */}
        {step === 'cart' && cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#121212] space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Total do pedido</span>
              <span className="font-mono font-bold text-lg text-[#F59E0B] tabular-nums">
                {formatCurrency(total)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStep('checkout')}
              className="w-full h-12 rounded-xl bg-[#FF6B00] hover:bg-[#FF7D1F] active:scale-[0.99] text-[#121212] font-bold text-sm transition-all cursor-pointer"
            >
              Continuar para Entrega
            </button>
          </div>
        )}

        {step === 'checkout' && (
          <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#121212] space-y-3 shrink-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Total a pagar</span>
              <span className="font-mono font-bold text-base text-[#F59E0B] tabular-nums">
                {formatCurrency(total)}
              </span>
            </div>
            <button
              type="submit"
              form="checkout-form"
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-[#FF6B00] hover:bg-[#FF7D1F] disabled:opacity-60 text-[#121212] font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando pedido...</span>
                </>
              ) : (
                <span>Confirmar Pedido · {formatCurrency(total)}</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
