import { useState } from 'react';
import { Scroll } from 'lucide-react';
import { openDialogLogs } from '../utils/appFunctions';
import { useVpnState } from '../context/SystemContext';
import { useActiveConfig } from '../context/ActiveConfigContext';
import { useConnectionManager } from '../hooks/useConnectionManager';
import { useCredentialsForm } from '../hooks/useCredentialsForm';
import { InputField } from './form/InputField';
import { ReadOnlyField } from './form/ReadOnlyField';
import { ConnectionButton } from './form/ConnectionButton';
import { UUIDHelp } from './form/UUIDHelp';

export function ConnectionForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showUUID, setShowUUID] = useState(false);

  const vpnState = useVpnState();
  const { activeConfig } = useActiveConfig();
  
  // Hook especializado para gerenciar conexão
  const { connect, disconnect, error: connectionError } = useConnectionManager();
  
  // Hook especializado para gerenciar credenciais
  const { 
    fields, 
    visibleFields, 
    readOnlyFields,
    updateField,
    validateForm,
    validationError
  } = useCredentialsForm(activeConfig);

  const handleConnection = () => {
    if (vpnState !== 'DISCONNECTED') {
      disconnect();
      return;
    }

    const validation = validateForm();
    if (validation.isValid) {
      connect();
    }
  };

  return (
    <section className="card">
      <h1 className="text-gradient text-base font-medium text-center mb-3">
        Dados de Acesso
      </h1>
      
      <div className="space-y-3">
        {/* Inputs dinâmicos baseados na configuração */}
        {visibleFields.username && (
          <InputField
            type="text"
            placeholder="Usuário"
            value={fields.username}
            onChange={(value) => updateField('username', value)}
          />
        )}

        {visibleFields.password && (
          <InputField
            type={showPassword ? 'text' : 'password'}
            placeholder="Senha"
            value={fields.password}
            onChange={(value) => updateField('password', value)}
            showToggle
            isVisible={showPassword}
            onToggleVisibility={() => setShowPassword(!showPassword)}
          />
        )}

        {visibleFields.uuid && (
          <InputField
            type={showUUID ? 'text' : 'password'}
            placeholder="UUID"
            value={fields.uuid}
            onChange={(value) => updateField('uuid', value)}
            showToggle
            isVisible={showUUID}
            onToggleVisibility={() => setShowUUID(!showUUID)}
            showHelp
            helpContent={<UUIDHelp />}
          />
        )}

        {/* Campos preenchidos (read-only) */}
        {readOnlyFields.username && (
          <ReadOnlyField label="Usuário" value={readOnlyFields.username} />
        )}
        
        {readOnlyFields.password && (
          <ReadOnlyField label="Senha" value="******" />
        )}
        
        {readOnlyFields.uuid && (
          <ReadOnlyField label="UUID" value={readOnlyFields.uuid} />
        )}

        {/* Botão de conexão inteligente */}
        <ConnectionButton
          vpnState={vpnState}
          onClick={handleConnection}
          disabled={vpnState === 'STOPPING'}
        />

        {/* Erro único centralizado */}
        {(connectionError || validationError) && (
          <p className="text-red-400 text-xs text-center">{connectionError || validationError}</p>
        )}

        {/* Botão de logs */}
        <button
          className="btn-outline w-full h-10 flex items-center justify-center gap-1.5 text-sm"
          onClick={openDialogLogs}
        >
          <Scroll className="w-4 h-4" />
          <span className="font-medium">Registros</span>
        </button>
      </div>
    </section>
  );
}
