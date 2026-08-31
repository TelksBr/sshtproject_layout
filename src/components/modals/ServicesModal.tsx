import { Modal } from './Modal';
import { 
  Server, 
  PlaySquare,
  BriefcaseBusiness,
  ArrowRight,
  CheckCircle,
} from '../../utils/icons';
import { openExternalUrl } from '../../utils/appFunctions';

const services = [
  {
    title: 'Revenda VPN',
    description: 'Revenda de planos de VPN com servidores Brasileiros e Valores Acessiveis.',
    icon: Server,
    features: [
      'Servidores Brasileiros',
      'Gerenciamento Via Painel ou Bot',
      'Sempre Atualizado',
      'Suporte 24/7'
    ],
    price: 'A partir de R$ 15/mês',
    link: 'https://reselltproject.shop/'
  },
  {
    title: 'Serviço de IPTV',
    description: 'Acesso a milhares de canais de TV, filmes e séries com qualidade HD e 4K.',
    icon: PlaySquare,
    features: [
      'Mais de 10.000 Canais',
      'Todos os Filmes e Séries',
      'Sem Travamentos',
      'Suporte 24/7'
    ],
    price: 'A partir de R$ 20/mês',
    link: 'https://iptv.sshtproject.com'
  }
];



export function ServicesModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose} title="Serviços" icon={BriefcaseBusiness}>
      <div className="max-w-md mx-auto p-3 sm:p-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Hero Section */}
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <BriefcaseBusiness className="w-6 h-6 text-[var(--accent)]" />
              </div>
            </div>
            <h3 className="text-base sm:text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>
              Nossos Serviços
            </h3>
            <p className="text-xs sm:text-sm font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Soluções profissionais para todas as suas necessidades de infraestrutura digital
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid gap-4 mb-4">
            {services.map((service, index) => (
              <div
                key={index}
                className="p-4 sm:p-5 rounded-2xl shadow-sm space-y-4 transition-all"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <service.icon className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>{service.title}</h3>
                    <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{service.price}</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-xs sm:text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span style={{ color: 'var(--text)' }}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => openExternalUrl(service.link)}
                  className="w-full flex items-center justify-center gap-2 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all duration-200 text-xs sm:text-sm active:scale-95 touch-manipulation"
                  style={{ background: 'var(--accent)' }}
                >
                  Saiba Mais
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}