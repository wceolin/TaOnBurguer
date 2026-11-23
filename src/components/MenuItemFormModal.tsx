import { useState, useEffect, type FormEvent } from 'react';
import { Loader2, X } from 'lucide-react';
import type { MenuItem, SaveMenuItemPayload } from '../types';
import { parsePrice } from '../utils/formatters';
import { SafeImage } from './SafeImage';

interface MenuItemFormModalProps {
  isOpen: boolean;
  editingItem: MenuItem | null;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: SaveMenuItemPayload) => Promise<void>;
}

const PRESET_CATEGORIES = ['Artesanais', 'Combos', 'Bebidas'];

export function MenuItemFormModal({
  isOpen,
  editingItem,
  saving,
  onClose,
  onSave,
}: MenuItemFormModalProps) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState('Artesanais');
  const [imagemUrl, setImagemUrl] = useState('');
  const [disponivel, setDisponivel] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (editingItem) {
      setNome(editingItem.Nome);
      setDescricao(editingItem.Descricao);
      setPreco(editingItem.Preco.toFixed(2).replace('.', ','));
      setCategoria(editingItem.Categoria || 'Artesanais');
      setImagemUrl(editingItem.Imagem_URL || '');
      setDisponivel(editingItem.Disponivel);
    } else {
      setNome('');
      setDescricao('');
      setPreco('');
      setCategoria('Artesanais');
      setImagemUrl('');
      setDisponivel(true);
    }
  }, [isOpen, editingItem]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedPrice = parsePrice(preco);
    if (!nome.trim()) {
      setError('Informe o nome do item.');
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError('Informe um preço válido maior que zero.');
      return;
    }

    await onSave({
      id: editingItem?.ID,
      nome: nome.trim(),
      descricao: descricao.trim(),
      preco: parsedPrice,
      categoria: categoria.trim() || 'Artesanais',
      imagem_url: imagemUrl.trim(),
      disponivel,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-form-title"
    >
      <div
        className="w-full sm:max-w-lg max-h-[92vh] bg-[#1E1E1E] border border-white/[0.08] rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-14 px-5 border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <h3 id="menu-form-title" className="font-display font-bold text-lg text-white">
            {editingItem ? 'Editar Item' : 'Novo Item no Cardápio'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar formulário"
            className="p-2 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          id="admin-menu-item-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-4"
        >
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Live image preview */}
          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-zinc-400">
              Pré-visualização da foto
            </span>
            <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-[#121212] border border-white/[0.08]">
              <SafeImage
                src={imagemUrl}
                alt={nome || 'Pré-visualização'}
                fallbackLabel={nome || 'Informe a URL da imagem abaixo'}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="item-img-url"
              className="block text-xs font-medium text-zinc-300 mb-1.5"
            >
              URL da Imagem
            </label>
            <input
              id="item-img-url"
              type="text"
              value={imagemUrl}
              onChange={(e) => setImagemUrl(e.target.value)}
              placeholder="https://..."
              className="w-full h-11 px-3.5 rounded-xl bg-[#121212] border border-white/[0.1] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
            />
          </div>

          <div>
            <label
              htmlFor="item-name"
              className="block text-xs font-medium text-zinc-300 mb-1.5"
            >
              Nome do Prato *
            </label>
            <input
              id="item-name"
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Tá On Smash Duplo"
              className="w-full h-11 px-3.5 rounded-xl bg-[#121212] border border-white/[0.1] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="item-price"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                Preço (R$) *
              </label>
              <input
                id="item-price"
                type="text"
                inputMode="decimal"
                required
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="34,90"
                className="w-full h-11 px-3.5 rounded-xl bg-[#121212] border border-white/[0.1] text-sm font-mono text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
              />
            </div>

            <div>
              <label
                htmlFor="item-category"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                Categoria *
              </label>
              <select
                id="item-category"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-[#121212] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
              >
                {Array.from(
                  new Set([
                    ...PRESET_CATEGORIES,
                    ...(categoria && !PRESET_CATEGORIES.includes(categoria) ? [categoria] : []),
                  ])
                ).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="item-desc"
              className="block text-xs font-medium text-zinc-300 mb-1.5"
            >
              Descrição
            </label>
            <textarea
              id="item-desc"
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ingredientes, ponto da carne, acompanhamentos..."
              className="w-full p-3.5 rounded-xl bg-[#121212] border border-white/[0.1] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#121212] border border-white/[0.08]">
            <div>
              <p className="text-sm font-medium text-white">Disponível na vitrine</p>
              <p className="text-xs text-zinc-400">
                Itens pausados não aparecem para clientes
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={disponivel}
              onClick={() => setDisponivel((v) => !v)}
              className={`w-12 h-7 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                disponivel ? 'bg-[#FF6B00] justify-end' : 'bg-zinc-700 justify-start'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow" />
            </button>
          </div>
        </form>

        <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#18181A] flex items-center gap-3 shrink-0">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-[#121212] hover:bg-zinc-800 border border-white/[0.08] text-sm font-semibold text-zinc-300 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="admin-menu-item-form"
            disabled={saving}
            className="flex-1 h-11 rounded-xl bg-[#FF6B00] hover:bg-[#FF7D1F] text-[#121212] text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <span>Salvar Prato</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
