import { Modal } from './Modal';
import { Helmet } from 'react-helmet';
import { 
  Server, 
  PlaySquare,
  BriefcaseBusiness,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
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
    price: 'A partir de R$ 10/mês',
    link: 'https://reselltproject.store/'
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
      <div className="max-w-md mx-auto p-4">
        <Helmet>
          <title>Serviços - SSH T Project</title>
          <meta name="description" content="Conheça nossa linha completa de serviços de hospedagem, VPS, servidores dedicados e mais." />
        </Helmet>

        <div className="max-w-md mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <BriefcaseBusiness className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <p className="text-lg text-gray-300 mb-4">
              Nossos Serviços
            </p>
            <p className="text-lg text-gray-300">
              Soluções profissionais para todas as suas necessidades de infraestrutura digital
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid gap-4 mb-8">
            {services.map((service, index) => (
              <div key={index} className="card p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <service.icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{service.title}</h3>
                    <p className="text-purple-400 text-sm">{service.price}</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-4">{service.description}</p>
                <ul className="space-y-2 mb-4">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => openExternalUrl(service.link)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#6205D5] to-[#4B0082] hover:from-[#4B0082] hover:to-[#6205D5] text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-all duration-200 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
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