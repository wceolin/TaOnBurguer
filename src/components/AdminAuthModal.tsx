import { useState, useEffect, type FormEvent } from 'react';
import { Loader2, Lock, X } from 'lucide-react';
import { verifyAdminPassword } from '../services/api';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminAuthModal({ isOpen, onClose, onSuccess }: AdminAuthModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setVerifying(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (verifying) return;

    setError('');
    setVerifying(true);
    try {
      const result = await verifyAdminPassword(password);
      if (result.valid) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Senha incorreta');
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={() => {
        if (!verifying) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-auth-title"
    >
      <div
        className="w-full max-w-sm bg-[#1E1E1E] border border-white/[0.08] rounded-2xl p-6 space-y-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 text-[#FF6B00] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 id="admin-auth-title" className="font-display font-bold text-lg text-white">
                Painel Administrativo
              </h2>
              <p className="text-xs text-zinc-400">Acesso restrito à equipe</p>
            </div>
          </div>

          <button
            type="button"
            disabled={verifying}
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 text-zinc-400 hover:text-white rounded-lg cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-medium text-zinc-300 mb-1.5"
            >
              Senha
            </label>
            <input
              id="admin-password"
              type="password"
              autoFocus
              required
              disabled={verifying}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              className="w-full h-11 px-3.5 rounded-xl bg-[#121212] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] disabled:opacity-60"
            />
            {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={verifying}
            className="w-full h-11 rounded-xl bg-[#FF6B00] hover:bg-[#FF7D1F] text-[#121212] text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando...</span>
              </>
            ) : (
              <span>Entrar</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
