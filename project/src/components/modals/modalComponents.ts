import { BuyLogin } from '../modals/BuyLogin';
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

export interface ModalComponentProps {
  onClose: () => void;
  onAccept?: () => void;
}

export const modalComponents: Record<Exclude<ModalType, null>, React.ComponentType<ModalComponentProps>> = {
  buy: BuyLogin,
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
};
