import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  itemName: string | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({
  itemName,
  deleting,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  if (!itemName) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div
        className="w-full max-w-sm bg-[#1E1E1E] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 id="confirm-delete-title" className="font-display font-bold text-base text-white">
              Excluir item do cardápio
            </h3>
            <p className="text-sm text-zinc-400 mt-1">
              Tem certeza que deseja excluir <strong className="text-white">{itemName}</strong>?
              Esta ação removerá o prato da planilha.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            disabled={deleting}
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl bg-[#121212] hover:bg-zinc-800 border border-white/[0.08] text-sm font-semibold text-zinc-300 cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Excluindo...</span>
              </>
            ) : (
              <span>Excluir</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
