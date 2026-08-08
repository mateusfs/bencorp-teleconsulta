import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  clearSession,
  fetchHealth,
  getStoredUser,
  listAtendimentos,
} from '../api';
import type { HealthResponse } from '../api';
import { buildHomeSnapshot } from '../homeSnapshot';
import {
  toHomeFilaItems,
  type HomeFilaItem,
} from '../homeUi';
import { AdminHomeView } from './AdminHomeView';
import { ClinicalHomeView } from './ClinicalHomeView';

export function HomePage() {
  const user = getStoredUser();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [items, setItems] = useState<HomeFilaItem[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isClinical =
    user?.role === 'ENFERMEIRO' || user?.role === 'MEDICO';

  const loadFila = useCallback(async (): Promise<void> => {
    if (!isClinical) {
      return;
    }
    setLoadState('loading');
    setErrorMessage(null);
    try {
      const rows = await listAtendimentos({ periodo: 'HOJE', slim: true });
      setItems(toHomeFilaItems(rows));
      setLoadState('ready');
    } catch (error) {
      setItems([]);
      setLoadState('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Erro ao carregar a fila',
      );
    }
  }, [isClinical]);

  useEffect(() => {
    void fetchHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    if (isClinical) {
      void loadFila();
    }
  }, [isClinical, loadFila]);

  const snapshot = useMemo(() => {
    if (!user || !isClinical) {
      return null;
    }
    return buildHomeSnapshot(items, user.id);
  }, [items, user, isClinical]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  function logout(): void {
    clearSession();
    window.location.href = '/login';
  }

  if (user.role === 'ADMIN') {
    return (
      <AdminHomeView user={user} health={health} onLogout={logout} />
    );
  }

  if (!isClinical) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ClinicalHomeView
      user={user}
      health={health}
      loadState={loadState}
      errorMessage={errorMessage}
      snapshot={snapshot}
      onLogout={logout}
      onRetry={() => {
        void loadFila();
      }}
    />
  );
}
