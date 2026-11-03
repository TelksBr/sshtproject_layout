import { message as tr, useMessages } from '../../i18n/messages';
import { Modal } from './Modal';
import { HelpCircle } from '../../utils/icons';

interface FaqProps {
  onClose: () => void;
}

export function Faq({ onClose }: FaqProps) {
  useMessages();
  return (
    <Modal onClose={onClose} title={tr("m4b26e202ac")} icon={HelpCircle}>
      <div className="max-w-3xl mx-auto p-4">
        <div className="text-center mb-8">
          <p className="text-base sm:text-lg font-medium" style={{ color: 'var(--text-muted)' }}>
            {tr("m4ddbefafc1")}</p>
        </div>

        <div className="grid gap-4 mb-8">
          <div className="p-4 sm:p-6 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <HelpCircle className="w-5 h-5 text-[var(--accent)]" />
              {tr("med8e787985")}</h3>
            <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {tr("m93a9319aab")}</p>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <p>
                {tr("m2615b496db")}</p>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>
                {tr("m0af249de71")}</p>
              <ul className="list-disc list-inside pl-2 space-y-1.5 text-xs">
                <li>{tr("m007ca7bcf4")}</li>
                <li>{tr("ma25cc53e66")}</li>
                <li>{tr("m0a6c1270d8")}</li>
                <li>{tr("m2a0ddb2a3a")}</li>
              </ul>
              <p>
                {tr("mc83d2ad904")}</p>
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <HelpCircle className="w-5 h-5 text-[var(--accent)]" />
              {tr("m70f010006a")}</h3>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <p>
                {tr("ma9fc103be8")}</p>
              
              <div className="pl-2 space-y-3">
                <div>
                  <h4 className="font-semibold text-xs mb-1" style={{ color: 'var(--text)' }}>{tr("m698282522f")}</h4>
                  <p className="text-xs">{tr("m9c4d4def5b")}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-xs mb-1" style={{ color: 'var(--text)' }}>{tr("m7461626967")}</h4>
                  <p className="text-xs">{tr("mdc958bdf4d")}<a href="https://play.google.com/store/apps/details?id=be.mygod.vpnhotspot"
                     className="hover:underline ml-1 font-semibold" style={{ color: 'var(--accent)' }}>
                    {tr("md4f81afc2f")}</a>
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-xs mb-1" style={{ color: 'var(--text)' }}>{tr("m9bc51c8ac0")}</h4>
                  <div className="text-xs">
                    <p>{tr("m6f37b9fd78")}</p>
                    <div className="mt-2 space-y-1">
                      <a href="https://play.google.com/store/apps/details?id=com.pdanet" 
                         className="hover:underline block font-semibold" style={{ color: 'var(--accent)' }}>
                        {tr("mb7d9ba111b")}</a>
                      <a href="https://pdanet.co/install/" 
                         className="hover:underline block font-semibold" style={{ color: 'var(--accent)' }}>
                        {tr("mc0c96eff26")}</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <HelpCircle className="w-5 h-5 text-[var(--accent)]" />
              {tr("me9a885954a")}</h3>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <p>
                {tr("m60f7d72bfb")}</p>
              
              <div className="pl-4 space-y-4">
                <div>
                  <h4 className="font-medium mb-2">{tr("m76f1aa1b89")}</h4>
                  <ul className="list-disc list-inside space-y-2">
                    <li>{tr("ma70cbb7eb9")}</li>
                    <li>{tr("mdb934a66e1")}</li>
                    <li>{tr("m84aa95ba3d")}</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">{tr("m328785a24c")}</h4>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>{tr("mac664872e0")}</li>
                    <li>{tr("mf10613eafe")}</li>
                    <li>{tr("m5eebdd6694")}</li>
                    <li>{tr("mb0873f8d47")}</li>
                    <li>{tr("m0e1612069b")}</li>
                    <li>{tr("m9913ffb890")}</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-[#1a1624]/30 border border-[#8b5cf6]/20 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-[#b7abc9] flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              {tr("mb980d40d76")}</h3>
            <div className="space-y-4 text-[#b7abc9]/80">
              <p>
                {tr("ma583bcba16")}</p>
              
              <div className="pl-4 space-y-4">
                <div>
                  <h4 className="font-medium mb-2">{tr("mdd85c5606f")}</h4>
                  <ul className="list-disc list-inside space-y-2">
                    <li>{tr("m1f1717a1b9")}</li>
                    <li>{tr("mde1eb164d6")}</li>
                    <li>{tr("m00ee6e76dd")}</li>
                    <li>{tr("m2d3c0ce91f")}</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">{tr("m8aee67487e")}</h4>
                  <p>
                    {tr("m5174b4c7ce")}</p>
                </div>

                <p className="text-sm italic">
                  {tr("m6afa49f7ab")}</p>
              </div>
            </div>
          </div>

          <div className="card bg-[#1a1624]/30 border border-[#8b5cf6]/20 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-[#b7abc9] flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              {tr("m4f57a7c9b1")}</h3>
            <div className="space-y-4 text-[#b7abc9]/80">
              <p>
                {tr("mcf0a5ae779")}</p>
              
              <div className="pl-4">
                <ul className="list-disc list-inside space-y-2">
                  <li>{tr("m52922656ad")}</li>
                  <li>{tr("me8af0ec62e")}</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Modal>
  );
}
