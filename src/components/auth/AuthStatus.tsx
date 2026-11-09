import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { MyOrdersModal } from '../MyOrders/MyOrdersModal';
import { DiscordLoginButton } from './DiscordLoginButton';
import { UserProfileMenu } from './UserProfileMenu';

/**
 * Slot de autenticação do header. Escolhe o componente conforme o estado:
 * desconectado / indisponível → "Entrar com Discord"
 * verificando / conectando    → indicador de carregamento
 * conectado                   → avatar + nome + menu
 * sessão expirada / erro      → botão com alerta (abre a interface com a opção de reconectar)
 */
export function AuthStatus({ compact = false }: { compact?: boolean }) {
  const auth = useAuth();
  const { notify } = useToast();
  const [ordersOpen, setOrdersOpen] = useState(false);

  if (auth.status === 'authenticated' && auth.user) {
    return (
      <>
        <UserProfileMenu
          user={auth.user}
          onProfile={() =>
            notify({
              tone: 'info',
              title: 'Meu Perfil',
              description: `Conectado como ${auth.user?.displayName} • ID ${auth.user?.id}`,
            })
          }
          // Consulta real: GET /api/orders/my (mesma sessão do cookie HttpOnly).
          onOrders={() => setOrdersOpen(true)}
          onLogout={auth.logout}
          compact={compact}
        />
        <MyOrdersModal open={ordersOpen} onClose={() => setOrdersOpen(false)} />
      </>
    );
  }

  switch (auth.status) {
    case 'checking':
      return <DiscordLoginButton compact={compact} tone="loading" onClick={auth.openLogin} label="Verificando sessão" shortLabel="Entrar" />;
    case 'connecting':
      return <DiscordLoginButton compact={compact} tone="loading" onClick={auth.openLogin} label="Conectando ao Discord" shortLabel="Conectando" />;
    case 'expired':
      return <DiscordLoginButton compact={compact} tone="attention" onClick={auth.openLogin} label="Reconectar Discord" shortLabel="Reconectar" />;
    case 'error':
      return <DiscordLoginButton compact={compact} tone="attention" onClick={auth.openLogin} />;
    default:
      return <DiscordLoginButton compact={compact} onClick={auth.openLogin} />;
  }
}
