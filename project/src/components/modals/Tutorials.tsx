import React, { useState } from 'react';
import { Book, Smartphone, Wifi, Settings, ShoppingCart, PlaneLanding, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';
import { openExternalUrl } from '../../utils/externalUtils';

interface Tutorial {
  id: number;
  title: string;
  description: string;
  icon: typeof Book;
  content: {
    steps?: { title: string; description: string }[];
    video?: string;
    links?: { text: string; url: string; label: string }[];
  };
}

const tutorials: Tutorial[] = [
  {
    id: 1,
    title: 'Tutorial de Introdução ao App',
    description: 'Tutorial inicial sobre como se conectar no APP.',
    icon: Smartphone,
    content: {
      links: [
        { text: 'TELEGRAM', url: 'https://t.me/ssh_t_project_grupo/494', label: 'Download via Telegram' },
        { text: 'PLAY STORE', url: 'https://play.google.com/store/apps/details?id=app.sshtproject', label: 'Download via Play Store' }
      ],
      video: 'https://www.youtube.com/embed/4KM2Bsgpmmo'
    }
  },
  {
    id: 2,
    title: 'Tutorial de Hotspot do App',
    description: 'Como utilizar a função hotspot para compartilhar sua VPN.',
    icon: Wifi,
    content: {
      steps: [
        { title: 'Passo 1', description: 'Habilite o Roteador do seu dispositivo' },
        { title: 'Passo 2', description: 'Abra o menu lateral no canto esquerdo superior' },
        { title: 'Passo 3', description: 'Habilite o hotspot clicando no botão do menu' },
        { title: 'Passo 4', description: 'Anote o endereço do proxy e da porta que aparecerá nas notificações. Você usará para configurar no dispositivo que irá se conectar ao seu roteador. Normalmente o IP do proxy começará com: 192.168.183.xx:porta' }
      ]
    }
  },
  {
    id: 3,
    title: 'Tutorial de APN',
    description: 'Pequeno tutorial sobre configuração de APN.',
    icon: Settings,
    content: {
      video: 'https://www.youtube.com/embed/-mM9TKPNDkY'
    }
  },
  {
    id: 4,
    title: 'Como comprar login SSH',
    description: 'Tutorial rápido sobre como comprar seu login SSH através do nosso bot.',
    icon: ShoppingCart,
    content: {
      video: 'https://www.youtube.com/embed/lSJ_M4WeXgA'
    }
  },
  {
    id: 5,
    title: 'Dica sobre conexão operadora roxa',
    description: 'Dica para resolver problemas na operadora roxa com plano pré-pago.',
    icon: HelpCircle,
    content: {
      video: 'https://www.youtube.com/embed/mXp8U6BoaG4'
    }
  },
  {
    id: 6,
    title: 'Dica sobre modo avião',
    description: 'Pequena dica sobre modo avião e a sua importância no uso da VPN.',
    icon: PlaneLanding,
    content: {
      steps: [
        { title: 'O que é?', description: 'O Modo Avião é uma configuração que desativa temporariamente todas as conexões de rede do seu dispositivo.' },
        { title: 'Por que usar?', description: 'Ajuda a obter um novo IP interno da operadora, o que pode resolver problemas de conexão.' },
        { title: 'Como usar', description: '1. Ative o Modo Avião\n2. Aguarde alguns segundos\n3. Desative o Modo Avião\n4. Inicie o aplicativo' },
        { title: 'Importante', description: 'Use esta técnica apenas quando estiver tendo problemas de conexão persistentes.' }
      ]
    }
  }
];

export function Tutorials({ onClose }: { onClose: () => void }) {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);

  return (
    <Modal onClose={onClose}>
      <div className="flex-1 p-4">
        <header className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#26074d] flex items-center justify-center">
            <Book className="w-6 h-6 text-[#b0a8ff]" />
          </div>
          <h1 className="text-xl font-medium text-[#b0a8ff]">Tutoriais</h1>
        </header>

        <div className="grid gap-4">
          {tutorials.map((tutorial) => (
            <button
              key={tutorial.id}
              className="w-full p-4 rounded-lg bg-[#26074d]/30 border border-[#6205D5]/20 backdrop-blur-sm text-left hover:bg-[#26074d]/40 transition-colors"
              onClick={() => setSelectedTutorial(tutorial)}
            >
              <div className="flex items-center gap-3 mb-2">
                <tutorial.icon className="w-6 h-6 text-[#b0a8ff]" />
                <h3 className="text-[#b0a8ff] font-medium">{tutorial.title}</h3>
              </div>
              <p className="text-[#b0a8ff]/70 text-sm">{tutorial.description}</p>
            </button>
          ))}
        </div>

        {selectedTutorial && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#2A0A3E] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">{selectedTutorial.title}</h2>
                  <button
                    onClick={() => setSelectedTutorial(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {selectedTutorial.content.steps && (
                    <div className="space-y-4">
                      {selectedTutorial.content.steps.map((step, index) => (
                        <div key={index} className="card hover:scale-100">
                          <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                          <p className="text-gray-300 whitespace-pre-line">{step.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedTutorial.content.video && (
                    <div className="aspect-video rounded-xl overflow-hidden">
                      <iframe
                        src={selectedTutorial.content.video}
                        title={selectedTutorial.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {selectedTutorial.content.links && (
                    <div className="flex flex-wrap gap-4">
                      {selectedTutorial.content.links.map((link, index) => (
                        <a
                          key={index}
                          onClick={() => openExternalUrl(link.url)}
                          className="btn-primary"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={link.label}
                        >
                          {link.text}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}