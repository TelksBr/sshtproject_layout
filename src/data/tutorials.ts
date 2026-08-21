import { Smartphone, Wifi, Settings, ShoppingCart, PlaneLanding } from '../utils/icons';
import type { Tutorial } from '../types/Tutorial';

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youtubeThumbUrl(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

export const tutorials: Tutorial[] = [
  {
    id: 1,
    title: 'Introdução',
    description: 'Como conectar no app pela primeira vez.',
    icon: Smartphone,
    youtubeId: '4KM2Bsgpmmo',
    links: [
      { label: 'Download via Telegram', url: 'https://t.me/ssh_t_project_grupo/494' },
      { label: 'Download via Play Store', url: 'https://play.google.com/store/apps/details?id=app.sshtproject' },
    ],
  },
  {
    id: 2,
    title: 'Hotspot',
    description: 'Compartilhe a VPN com outros dispositivos.',
    icon: Wifi,
    steps: [
      { title: 'Ative o roteador', description: 'Habilite o roteador (ponto de acesso) do seu dispositivo.' },
      { title: 'Abra o menu', description: 'Abra o menu lateral no canto superior esquerdo.' },
      { title: 'Ligue o hotspot', description: 'Habilite o hotspot no botão do menu.' },
      {
        title: 'Anote o proxy',
        description:
          'Anote o endereço do proxy e a porta que aparecem nas notificações. Use esses dados no dispositivo que vai se conectar ao roteador. O IP do proxy costuma começar com 192.168.183.xx:porta.',
      },
    ],
  },
  {
    id: 3,
    title: 'APN',
    description: 'Como configurar a APN no aparelho.',
    icon: Settings,
    youtubeId: '-mM9TKPNDkY',
  },
  {
    id: 4,
    title: 'Comprar login SSH',
    description: 'Como comprar o login pelo bot.',
    icon: ShoppingCart,
    youtubeId: 'lSJ_M4WeXgA',
  },
  {
    id: 5,
    title: 'Modo avião',
    description: 'Quando e como usar o modo avião com a VPN.',
    icon: PlaneLanding,
    steps: [
      {
        title: 'O que é?',
        description: 'O modo avião desativa temporariamente as conexões de rede do aparelho.',
      },
      {
        title: 'Por que usar?',
        description: 'Ajuda a obter um novo IP interno da operadora e pode resolver falhas de conexão.',
      },
      { title: 'Ative o modo avião', description: 'Ligue o modo avião nas configurações rápidas do aparelho.' },
      { title: 'Aguarde alguns segundos', description: 'Espere alguns segundos com o modo avião ligado.' },
      { title: 'Desative o modo avião', description: 'Desligue o modo avião para a rede voltar.' },
      { title: 'Abra o aplicativo', description: 'Inicie o app e tente conectar novamente.' },
      {
        title: 'Importante',
        description: 'Use esta técnica apenas quando a conexão estiver falhando de forma persistente.',
      },
    ],
  },
];
