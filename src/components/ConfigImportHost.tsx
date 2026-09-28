import { useSdkConfigImport } from '../hooks/useSdkConfigImport';
import { ConfigImportModal } from './modals/ConfigImportModal';

export function ConfigImportHost() {
  const { pending, confirm, reject } = useSdkConfigImport();
  if (!pending) return null;
  return <ConfigImportModal pending={pending} onConfirm={confirm} onReject={reject} />;
}
