import type { ModalType } from '../../App';

// Importações diretas (sem lazy loading para build inline)
import { Terms } from '../modals/Terms';
import { Privacy } from '../modals/Privacy';
import { CleanDataConfirm } from '../modals/CleanDataConfirm';
import RenewalModal from './RenewalModal';
import { PurchaseModal } from './PurchaseModal';
import { RecoveryModal } from './RecoveryModal';
import { Tutorials } from './Tutorials';
import { Support } from './Support';
import { SpeedTest } from './SpeedTest';
import { CheckUser } from './CheckUser';
import { Hotspot } from './Hotspot';
import { ServicesModal } from './ServicesModal';
import { IpFinder } from './IpFinder';
import { Faq } from './Faq';
import { CredentialsTab } from './CredentialsTab';
import TestGenerateModal from './TestGenerateModal';

export interface ModalComponentProps {
  onClose: () => void;
  onAccept?: () => void;
}

export const modalComponents: Record<Exclude<ModalType, null>, React.ComponentType<ModalComponentProps>> = {
  buy: PurchaseModal,
  recovery: RecoveryModal,
  tutorials: Tutorials,
  support: Support,
  speedtest: SpeedTest,
  terms: Terms,
  privacy: Privacy,
  checkuser: CheckUser,
  cleandata: CleanDataConfirm,
  hotspot: Hotspot,
  services: ServicesModal,
  ipfinder: IpFinder,
  faq: Faq,
  testgenerate: TestGenerateModal,
  renewal: RenewalModal,
  credentials: CredentialsTab,
};
