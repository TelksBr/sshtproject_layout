import React from 'react';
import { DollarSign, Shield, Zap, Clock, Users, Check, Phone, Send, ArrowRight } from 'lucide-react';
import { Modal } from './Modal';
import { openExternalUrl } from '../../utils/externalUtils';

interface BuyLoginProps {
  onClose: () => void;
}

export function BuyLogin({ onClose }: BuyLoginProps) {
  return (
    <Modal onClose={onClose}>
      <div className="max-w-md mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Planos Premium SSH T Project</h1>
          <p className="text-lg text-gray-300">
            Eleve sua experiência com nossos planos premium. Mais velocidade, mais segurança e suporte prioritário.
          </p>
        </div>

        <div className="grid gap-4 mb-8">
          <div className="card">
            <Shield className="w-6 h-6 text-purple-400 mb-2" />
            <h3 className="text-lg font-semibold mb-1">Segurança Reforçada</h3>
            <p className="text-gray-400 text-sm">Conexão criptografada de ponta a ponta para máxima proteção dos seus dados.</p>
          </div>
          <div className="card">
            <Zap className="w-6 h-6 text-purple-400 mb-2" />
            <h3 className="text-lg font-semibold mb-1">Velocidade Superior</h3>
            <p className="text-gray-400 text-sm">Servidores otimizados para oferecer a melhor velocidade possível.</p>
          </div>
          <div className="card">
            <Clock className="w-6 h-6 text-purple-400 mb-2" />
            <h3 className="text-lg font-semibold mb-1">Suporte 24/7</h3>
            <p className="text-gray-400 text-sm">Assistência técnica disponível 24 horas por dia, 7 dias por semana.</p>
          </div>
          <div className="card">
            <Users className="w-6 h-6 text-purple-400 mb-2" />
            <h3 className="text-lg font-semibold mb-1">Multi-dispositivos</h3>
            <p className="text-gray-400 text-sm">Conecte até 2 dispositivos simultaneamente com uma única conta.</p>
          </div>
        </div>

        <div className="grid gap-4 mb-8">
          <div className="card relative">
            <h3 className="text-xl font-bold mb-2">Mensal</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-purple-400">R$ 4</span>
              <span className="text-gray-400">/30 dias</span>
            </div>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-400" />
                <span>Acesso Premium</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-400" />
                <span>Suporte 24/7</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-400" />
                <span>1 Dispositivo</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-400" />
                <span>Velocidade Ilimitada</span>
              </li>
            </ul>
            <div className="flex flex-col gap-2">
              <a
                onClick={() => openExternalUrl("https://wa.me/5521965687520?text=menu")}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                WhatsApp
              </a>
              <a
                onClick={() => openExternalUrl("https://t.me/ssh_t_project_vip_bot")}
                className="btn-outline flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Telegram
              </a>
            </div>
          </div>

          <div className="card relative border-purple-500">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-xs">Mais Popular</span>
            <h3 className="text-xl font-bold mb-2">Bimestral</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-purple-400">R$ 6</span>
              <span className="text-gray-400">/60 dias</span>
            </div>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-400" />
                <span>Acesso Premium</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-400" />
                <span>Suporte 24/7</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-400" />
                <span>1 Dispositivo</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-400" />
                <span>Velocidade Ilimitada</span>
              </li>
            </ul>
            <div className="flex flex-col gap-2">
              <a
                onClick={() => openExternalUrl("https://wa.me/5521965687520?text=menu")}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                WhatsApp
              </a>
              <a
                onClick={() => openExternalUrl("https://t.me/ssh_t_project_vip_bot")}
                className="btn-outline flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Telegram
              </a>
            </div>
          </div>

          <div className="card relative">
            <h3 className="text-xl font-bold mb-2">Trimestral</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-purple-400">R$ 8</span>
              <span className="text-gray-400">/90 dias</span>
            </div>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-400" />
                <span>Acesso Premium</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-400" />
                <span>Suporte 24/7</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-400" />
                <span>1 Dispositivo</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-400" />
                <span>Velocidade Ilimitada</span>
              </li>
            </ul>
            <div className="flex flex-col gap-2">
              <a
                onClick={() => openExternalUrl("https://wa.me/5521965687520?text=menu")}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                WhatsApp
              </a>
              <a
                onClick={() => openExternalUrl("https://t.me/ssh_t_project_vip_bot")}
                className="btn-outline flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Telegram
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Perguntas Frequentes</h2>
          <div className="space-y-4">
            <details className="card group">
              <summary className="cursor-pointer font-semibold">Como funciona o período de teste?</summary>
              <p className="mt-2 text-gray-300 text-sm">
                Oferecemos um período de teste gratuito de 2 horas para que você possa experimentar nossos serviços premium sem compromisso, acesse nosso bot e solicite seu teste automático!
              </p>
            </details>
            <details className="card group">
              <summary className="cursor-pointer font-semibold">Posso usar em mais de um dispositivo?</summary>
              <p className="mt-2 text-gray-300 text-sm">
                Sim! Nossos planos premium permitem o uso simultâneo em até 4 dispositivos.
              </p>
            </details>
            <details className="card group">
              <summary className="cursor-pointer font-semibold">Como funciona o pagamento?</summary>
              <p className="mt-2 text-gray-300 text-sm">
                Aceitamos pagamentos via PIX, proporcionando uma forma rápida e segura de adquirir seu plano premium.
              </p>
            </details>
          </div>

          <div className="card bg-gradient-to-r from-purple-900 to-purple-800 border-purple-700 mt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Precisa de Ajuda?</h2>
              <p className="text-gray-300 mb-6">
                Nossa equipe está pronta para ajudar você a escolher a melhor solução para suas necessidades
              </p>
              <div className="flex flex-col gap-2 justify-center">
                <a
                  onClick={() => openExternalUrl("https://t.me/telks13")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  Falar com Suporte
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}