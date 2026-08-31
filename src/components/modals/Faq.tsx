import { Modal } from './Modal';
import { HelpCircle } from '../../utils/icons';

interface FaqProps {
  onClose: () => void;
}

export function Faq({ onClose }: FaqProps) {
  return (
    <Modal onClose={onClose} title="Perguntas Frequentes" icon={HelpCircle}>
      <div className="max-w-3xl mx-auto p-4">
        <div className="text-center mb-8">
          <p className="text-base sm:text-lg font-medium" style={{ color: 'var(--text-muted)' }}>
            Encontre respostas rápidas para as dúvidas mais comuns.
          </p>
        </div>

        <div className="grid gap-4 mb-8">
          <div className="p-4 sm:p-6 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <HelpCircle className="w-5 h-5 text-[var(--accent)]" />
              O que é a internet BugHost?
            </h3>
            <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              A Net Free é um serviço que permite acesso à internet mesmo sem créditos na operadora, utilizando um sistema de proxy através de URLs permitidas.
            </p>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <p>
                Funcionamento: Seu dispositivo se conecta ao nosso proxy, que redireciona o tráfego para nossos servidores e então para a internet global.
              </p>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>
                Importante considerar:
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1.5 text-xs">
                <li>A qualidade depende do sinal da sua operadora na região</li>
                <li>Bloqueios das operadoras podem causar interrupções temporárias</li>
                <li>Áreas metropolitanas geralmente têm melhor desempenho</li>
                <li>Manutenções da operadora podem afetar o serviço</li>
              </ul>
              <p>
                Estamos sempre atualizando nossos métodos de conexão para garantir o melhor serviço possível.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <HelpCircle className="w-5 h-5 text-[var(--accent)]" />
              Como Compartilhar?
            </h3>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <p>
                Existem diferentes métodos para compartilhar sua conexão:
              </p>
              
              <div className="pl-2 space-y-3">
                <div>
                  <h4 className="font-semibold text-xs mb-1" style={{ color: 'var(--text)' }}>Hotspot Proxy (Método Padrão):</h4>
                  <p className="text-xs">Ative o Hotspot no menu lateral. Atenção: TVs e alguns dispositivos podem não suportar conexões via proxy.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-xs mb-1" style={{ color: 'var(--text)' }}>Para dispositivos com ROOT:</h4>
                  <p className="text-xs">Use o app VPN Hotspot para compartilhamento direto sem proxy. 
                  <a href="https://play.google.com/store/apps/details?id=be.mygod.vpnhotspot" 
                     className="hover:underline ml-1 font-semibold" style={{ color: 'var(--accent)' }}>
                    Baixar na Play Store
                  </a>
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-xs mb-1" style={{ color: 'var(--text)' }}>Para Windows e Smart TVs:</h4>
                  <div className="text-xs">
                    <p>Recomendamos o PdaNet+, que oferece suporte para Windows e alguns modelos de Smart TV.</p>
                    <div className="mt-2 space-y-1">
                      <a href="https://play.google.com/store/apps/details?id=com.pdanet" 
                         className="hover:underline block font-semibold" style={{ color: 'var(--accent)' }}>
                        Download na Play Store
                      </a>
                      <a href="https://pdanet.co/install/" 
                         className="hover:underline block font-semibold" style={{ color: 'var(--accent)' }}>
                        Site Oficial (Windows e outros downloads)
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <HelpCircle className="w-5 h-5 text-[var(--accent)]" />
              Como usar V2Ray?
            </h3>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <p>
                Para usar o V2Ray, siga estas etapas:
              </p>
              
              <div className="pl-4 space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Importante saber:</h4>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Nem todos os métodos funcionam com qualquer chip</li>
                    <li>Cada configuração pode exigir planos específicos</li>
                    <li>O funcionamento pode variar por região</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Como conectar:</h4>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Compre seu login através do bot</li>
                    <li>Copie o UUID fornecido</li>
                    <li>Cole no aplicativo V2Ray</li>
                    <li>Inicie a conexão</li>
                    <li>Teste se há internet</li>
                    <li>Se não funcionar, tente outra configuração disponível</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-[#1a1624]/30 border border-[#8b5cf6]/20 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-[#b7abc9] flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Posso jogar online?
            </h3>
            <div className="space-y-4 text-[#b7abc9]/80">
              <p>
                Não oferecemos suporte oficial para jogos online devido à complexidade dos fatores envolvidos.
              </p>
              
              <div className="pl-4 space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Fatores que influenciam:</h4>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Qualidade do sinal de rede</li>
                    <li>Distância até nossos servidores</li>
                    <li>Tipo de protocolo de conexão</li>
                    <li>Estabilidade do proxy/CDN em uso</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Dica importante:</h4>
                  <p>
                    Recomendamos usar o sinal 3G quando o 4G estiver instável. 
                    O 3G geralmente oferece um sinal mais forte e pode ser mais 
                    estável para jogos online em áreas onde o 4G tem alcance limitado.
                  </p>
                </div>

                <p className="text-sm italic">
                  Obs: Você pode tentar jogar, mas a experiência dependerá das 
                  condições mencionadas acima.
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-[#1a1624]/30 border border-[#8b5cf6]/20 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-[#b7abc9] flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Posso baixar torrent?
            </h3>
            <div className="space-y-4 text-[#b7abc9]/80">
              <p>
                Nossos servidores não possuem bloqueio específico para tráfego P2P (torrent), porém existem considerações importantes:
              </p>
              
              <div className="pl-4">
                <ul className="list-disc list-inside space-y-2">
                  <li>O datacenter pode aplicar bloqueios independentes para este tipo de tráfego</li>
                  <li>A velocidade pode variar dependendo da política do datacenter</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Modal>
  );
}
