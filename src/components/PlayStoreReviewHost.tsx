import { VpnState } from '../types/vpn';
import { usePlayStoreReviewPrompt } from '../hooks/usePlayStoreReviewPrompt';
import { PlayStoreReviewModal } from './modals/PlayStoreReviewModal';

interface PlayStoreReviewHostProps {
  vpnState: VpnState;
  blockingModal: string | null;
}

export function PlayStoreReviewHost({ vpnState, blockingModal }: PlayStoreReviewHostProps) {
  const { open, handleAccept, handleDecline } = usePlayStoreReviewPrompt(vpnState, blockingModal);
  if (!open) return null;
  return <PlayStoreReviewModal onAccept={handleAccept} onDecline={handleDecline} />;
}
