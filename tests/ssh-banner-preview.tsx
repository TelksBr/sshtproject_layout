import { createRoot } from 'react-dom/client';
import VTunnelSDK from 'vtunnel-sdk';
import { LogsModal } from '../src/components/modals/LogsModal';
import { ToastProvider } from '../src/hooks/useToast';
import { registerSdkInstance } from '../src/utils/sdkInstance';
import '../src/index.css';

// Mirrors the native bridge payload after SshServerBannerLog normalization.
const banner = '<b>SSH · Banner</b><br><center><font color="#A855F7">━━━━━━━━━━━━━━━━━━━━━━</font><br><br><font color="#C084FC" size="6"><b>⚡ T PROJECT ⚡</b></font><br><font color="#A855F7"><b>CONECTE. JOGUE. EXPLORE.</b></font><br><br><font color="#E9D5FF">Sua próxima partida começa aqui.</font><br><br><font color="#C084FC">✦ ──────────────── ✦</font><br><br><font color="#FFFFFF"><b>🎮 JOGOS ONLINE</b></font><br><font color="#D8B4FE">Entre na partida e conecte-se ao seu squad.</font><br><br><font color="#FFFFFF"><b>🌐 MUITO ALÉM DO GAME</b></font><br><font color="#D8B4FE">Navegação, redes sociais e entretenimento.</font><br><br><font color="#FFFFFF"><b>🔐 CONEXÃO CIFRADA</b></font><br><font color="#D8B4FE">Tecnologia acompanhando você em cada conexão.</font><br><br><font color="#C084FC">✦ ──────────────── ✦</font><br><br><font color="#E9D5FF"><b>Bem-vindo à conexão roxa. 💜</b></font><br><font color="#A855F7">T PROJECT • Seu mundo conectado.</font><br><br><font color="#A855F7">━━━━━━━━━━━━━━━━━━━━━━</font></center>';
const sdk = new VTunnelSDK({ window: { VtGetLogs: { execute: () => JSON.stringify([{ '09:29:53': banner }]) } } as never, strict: false, autoRegisterNativeEvents: false });
registerSdkInstance(sdk);
createRoot(document.getElementById('root')!).render(<ToastProvider><LogsModal onClose={() => {}} /></ToastProvider>);
