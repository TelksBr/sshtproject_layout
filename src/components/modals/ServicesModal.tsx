import { message as tr, useMessages } from '../../i18n/messages';
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
    get title() { return tr("m2b937c9cbf"); },
    get description() { return tr("md262a425d1"); },
    icon: Server,
    get features() { return [
      tr("mf29fb4f891"),
      tr("m77e791d8ed"),
      tr("m0d9466def1"),
      tr("m638ab4a5b1")
    ]; },
    get price() { return tr("me4b3700b1b"); },
    link: 'https://reselltproject.shop/'
  },
  {
    get title() { return tr("m46bb13192f"); },
    get description() { return tr("m4bc8efc9f2"); },
    icon: PlaySquare,
    get features() { return [
      tr("mb1f634926a"),
      tr("m800352da8e"),
      tr("m29c264ccf0"),
      tr("m638ab4a5b1")
    ]; },
    get price() { return tr("m1739741111"); },
    link: 'https://iptv.sshtproject.com'
  }
];



export function ServicesModal({ onClose }: { onClose: () => void }) {
  useMessages();
  return (
    <Modal onClose={onClose} title={tr("m4944b0b2b6")} icon={BriefcaseBusiness}>
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
              {tr("m501c8194c1")}</h3>
            <p className="text-xs sm:text-sm font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {tr("mab1f56caa9")}</p>
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
                  {tr("mbe050c7994")}<ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}