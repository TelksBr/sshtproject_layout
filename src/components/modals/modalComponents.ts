import { PurchaseModal } from '../modals/PurchaseModal';
import { RecoveryModal } from '../modals/RecoveryModal';
import { Tutorials } from '../modals/Tutorials';
import { Support } from '../modals/Support';
import { SpeedTest } from '../modals/SpeedTest';
import { Terms } from '../modals/Terms';
import { Privacy } from '../modals/Privacy';
import { CheckUser } from '../modals/CheckUser';
import { CleanDataConfirm } from '../modals/CleanDataConfirm';
import { Hotspot } from '../modals/Hotspot';
import { ServicesModal } from '../modals/ServicesModal';
import { IpFinder } from '../modals/IpFinder';
import { Faq } from '../modals/Faq';
import type { ModalType } from '../../App';
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
};
