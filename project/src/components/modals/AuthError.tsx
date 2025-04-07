import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';

interface AuthErrorProps {
  onClose: () => void;
}

export function AuthError({ onClose }: AuthErrorProps) {
  return (
    <Modal onClose={onClose}>
      <div className="flex-1 p-4">
        <header className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#26074d] flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-[#b0a8ff]" />
          </div>
          <h1 className="text-xl font-medium text-[#b0a8ff]">Erro de Autenticação</h1>
        </header>

        <div className="p-6 rounded-lg glass-effect">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          <h3 className="text-lg font-medium text-[#b0a8ff] text-center mb-6">
            Falha na Autenticação
          </h3>

          <div className="space-y-4 mb-6">
            <p className="text-[#b0a8ff]/80 text-center">
              Não foi possível autenticar sua conexão. Por favor, verifique:
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#100322]/50 border border-[#6205D5]/20">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#6205D5] mt-0.5" />
                  <div>
                    <h4 className="text-[#b0a8ff] font-medium mb-1">Credenciais</h4>
                    <p className="text-sm text-[#b0a8ff]/70">
                      Certifique-se de que seu usuário e senha estão corretos
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#100322]/50 border border-[#6205D5]/20">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#6205D5] mt-0.5" />
                  <div>
                    <h4 className="text-[#b0a8ff] font-medium mb-1">Validade da Conta</h4>
                    <p className="text-sm text-[#b0a8ff]/70">
                      Verifique se sua conta ainda está ativa e dentro do prazo
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#100322]/50 border border-[#6205D5]/20">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#6205D5] mt-0.5" />
                  <div>
                    <h4 className="text-[#b0a8ff] font-medium mb-1">Limite de Dispositivos</h4>
                    <p className="text-sm text-[#b0a8ff]/70">
                      Confirme se não excedeu o limite de dispositivos conectados
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full h-12 rounded-lg font-medium bg-[#6205D5] text-[#b0a8ff] hover:bg-[#6205D5]/90 transition-colors"
          >
            Entendi
          </button>
        </div>
      </div>
    </Modal>
  );
}