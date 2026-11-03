import { message as tr, useMessages } from '../../i18n/messages';
import { Shield, Zap, Clock, Users, Check, Phone, Send, ArrowRight, ShoppingCart } from '../../utils/icons';
import { Modal } from './Modal';
import { openExternalUrl } from '../../utils/appFunctions';

interface BuyLoginProps {
  onClose: () => void;
}

export function BuyLogin({ onClose }: BuyLoginProps) {
  useMessages();
  return (
    <Modal onClose={onClose} title={tr("mea21e78b65")} icon={ShoppingCart}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6 lg:mb-8">
          <p className="text-base lg:text-lg 2xl:text-xl text-gray-300">
            {tr("m60fba66fb3")}</p>
        </div>

        <div className="grid gap-3 lg:gap-4 mb-6 lg:mb-8">
          <div className="card p-4 lg:p-5 2xl:p-6">
            <Shield className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 text-purple-400 mb-2" />
            <h3 className="text-base lg:text-lg 2xl:text-xl font-semibold mb-1">{tr("m06dfb8ac25")}</h3>
            <p className="text-gray-400 text-sm lg:text-base 2xl:text-lg">{tr("m3e1e414c2f")}</p>
          </div>
          <div className="card p-4 lg:p-5 2xl:p-6">
            <Zap className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 text-purple-400 mb-2" />
            <h3 className="text-base lg:text-lg 2xl:text-xl font-semibold mb-1">{tr("mda89cb5250")}</h3>
            <p className="text-gray-400 text-sm lg:text-base 2xl:text-lg">{tr("m5b5956d682")}</p>
          </div>
          <div className="card p-4 lg:p-5 2xl:p-6">
            <Clock className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 text-purple-400 mb-2" />
            <h3 className="text-base lg:text-lg 2xl:text-xl font-semibold mb-1">{tr("m638ab4a5b1")}</h3>
            <p className="text-gray-400 text-sm lg:text-base 2xl:text-lg">{tr("m8cea525bee")}</p>
          </div>
          <div className="card p-4 lg:p-5 2xl:p-6">
            <Users className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8 text-purple-400 mb-2" />
            <h3 className="text-base lg:text-lg 2xl:text-xl font-semibold mb-1">{tr("m79d65f092b")}</h3>
            <p className="text-gray-400 text-sm lg:text-base 2xl:text-lg">{tr("mcb9c9e521b")}</p>
          </div>
        </div>

        <div className="grid gap-3 lg:gap-4">
          <div className="card p-4 lg:p-5 2xl:p-6 relative">
            <h3 className="text-lg lg:text-xl 2xl:text-2xl font-bold mb-2">{tr("m456b0a1e1a")}</h3>
            <div className="mb-4">
              <span className="text-2xl lg:text-3xl 2xl:text-4xl font-bold text-purple-400">{tr("m2f2f973642")}</span>
              <span className="text-gray-400 text-sm lg:text-base 2xl:text-lg">{tr("m42f4477cb0")}</span>
            </div>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2 text-sm lg:text-base 2xl:text-lg">
                <Check className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400 flex-shrink-0" />
                <span>{tr("mde7536e9dd")}</span>
              </li>
              <li className="flex items-center gap-2 text-sm lg:text-base 2xl:text-lg">
                <Check className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400 flex-shrink-0" />
                <span>{tr("m638ab4a5b1")}</span>
              </li>
              <li className="flex items-center gap-2 text-sm lg:text-base 2xl:text-lg">
                <Check className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400 flex-shrink-0" />
                <span>{tr("m464d2991b1")}</span>
              </li>
              <li className="flex items-center gap-2 text-sm lg:text-base 2xl:text-lg">
                <Check className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400 flex-shrink-0" />
                <span>{tr("m2812e52a92")}</span>
              </li>
            </ul>
            <div className="flex flex-col gap-2">
              <a
                onClick={() => openExternalUrl("https://wa.me/5521965687520?text=menu")}
                className="btn-primary min-h-[44px] lg:min-h-[48px] 2xl:min-h-[56px] flex items-center justify-center gap-2 text-sm lg:text-base 2xl:text-lg"
              >
                <Phone className="w-4 h-4 lg:w-5 lg:h-5" />
                WhatsApp
              </a>
              <a
                onClick={() => openExternalUrl("https://t.me/ssh_t_project_vip_bot")}
                className="btn-outline min-h-[44px] lg:min-h-[48px] 2xl:min-h-[56px] flex items-center justify-center gap-2 text-sm lg:text-base 2xl:text-lg"
              >
                <Send className="w-4 h-4 lg:w-5 lg:h-5" />
                Telegram
              </a>
            </div>
          </div>

          <div className="card relative border-purple-500">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-xs">{tr("md5ef847e70")}</span>
            <h3 className="text-xl font-bold mb-2">{tr("mbfe8392e25")}</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-purple-400">{tr("m8378c99ce0")}</span>
              <span className="text-gray-400">{tr("m20ef0a6dd5")}</span>
            </div>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-400" />
                <span>{tr("mde7536e9dd")}</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-400" />
                <span>{tr("m638ab4a5b1")}</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-400" />
                <span>{tr("m464d2991b1")}</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-400" />
                <span>{tr("m2812e52a92")}</span>
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
            <h3 className="text-xl font-bold mb-2">{tr("m602df7f9fc")}</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-purple-400">{tr("mc9399fad32")}</span>
              <span className="text-gray-400">{tr("m5afcb1ca55")}</span>
            </div>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-400" />
                <span>{tr("mde7536e9dd")}</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-400" />
                <span>{tr("m638ab4a5b1")}</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-400" />
                <span>{tr("m464d2991b1")}</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-purple-400" />
                <span>{tr("m2812e52a92")}</span>
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
          <h2 className="text-2xl font-bold mb-6 text-center">{tr("m4b26e202ac")}</h2>
          <div className="space-y-4">
            <details className="card group">
              <summary className="cursor-pointer font-semibold">{tr("m8371e2dd56")}</summary>
              <p className="mt-2 text-gray-300 text-sm">
                {tr("m7d0740dba9")}</p>
            </details>
            <details className="card group">
              <summary className="cursor-pointer font-semibold">{tr("m258fc3fe46")}</summary>
              <p className="mt-2 text-gray-300 text-sm">
                {tr("mc5184b3f56")}</p>
            </details>
            <details className="card group">
              <summary className="cursor-pointer font-semibold">{tr("m68205520db")}</summary>
              <p className="mt-2 text-gray-300 text-sm">
                {tr("md79ceab2e6")}</p>
            </details>
          </div>

          <div className="card bg-gradient-to-r from-purple-900 to-purple-800 border-purple-700 mt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">{tr("m178a5e49a2")}</h2>
              <p className="text-gray-300 mb-6">
                {tr("m725b1e83e6")}</p>
              <div className="flex flex-col gap-2 justify-center">
                <a
                  onClick={() => openExternalUrl("https://t.me/telks13")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  {tr("m7ba8a5f13d")}<ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}