const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type UserRole = 'ADMIN' | 'ENFERMEIRO' | 'MEDICO';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  active: boolean;
};

export type LoginResponse = {
  accessToken: string;
  expiresIn: string;
  user: AuthUser;
};

const TOKEN_KEY = 'bencorp_token';
const USER_KEY = 'bencorp_user';

export function saveSession(login: LoginResponse): void {
  localStorage.setItem(TOKEN_KEY, login.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(login.user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as AuthUser;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Erro HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) {
        message = body.message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function listUsers(): Promise<AuthUser[]> {
  return request<AuthUser[]>('/users');
}

export function createUser(input: {
  email: string;
  password: string;
  role: UserRole;
}): Promise<AuthUser> {
  return request<AuthUser>('/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateUser(
  id: string,
  input: { role?: UserRole; active?: boolean },
): Promise<AuthUser> {
  return request<AuthUser>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export type AtendimentoStatus =
  | 'AGUARDANDO'
  | 'EM_ANDAMENTO'
  | 'FINALIZADO'
  | 'CANCELADO';

export type ClassificacaoRisco =
  | 'VERMELHO'
  | 'LARANJA'
  | 'AMARELO'
  | 'VERDE'
  | 'AZUL';

export type PeriodoFila = 'HOJE' | 'ONTEM' | 'ULTIMA_SEMANA' | 'TODOS';

export type AtendimentoFilaItem = {
  id: string;
  patientId: string;
  status: AtendimentoStatus;
  riskClassification: ClassificacaoRisco | null;
  professionalId: string | null;
  queuedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  desfecho: 'ENCERRADO' | 'ENCAMINHADO_MEDICO' | null;
  encaminhadoDeId: string | null;
  patientName: string;
  patientContact: string;
  patientCpf: string;
  tempoEsperaSegundos: number;
};

export type ListarFilaParams = {
  q?: string;
  status?: AtendimentoStatus | '';
  periodo?: PeriodoFila;
  encaminhadosOnly?: boolean;
};

function toQuery(params: ListarFilaParams): string {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.status) search.set('status', params.status);
  if (params.periodo) search.set('periodo', params.periodo);
  if (params.encaminhadosOnly) search.set('encaminhadosOnly', 'true');
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function listAtendimentos(
  params: ListarFilaParams = {},
): Promise<AtendimentoFilaItem[]> {
  return request<AtendimentoFilaItem[]>(`/atendimentos${toQuery(params)}`);
}

export function getAtendimento(id: string): Promise<AtendimentoFilaItem> {
  return request<AtendimentoFilaItem>(`/atendimentos/${id}`);
}

export function createAtendimento(input: {
  patientName: string;
  patientCpf: string;
  patientContact: string;
  riskClassification?: ClassificacaoRisco;
}): Promise<AtendimentoFilaItem> {
  return request<AtendimentoFilaItem>('/atendimentos', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function iniciarAtendimento(id: string): Promise<AtendimentoFilaItem> {
  return request<AtendimentoFilaItem>(`/atendimentos/${id}/iniciar`, {
    method: 'POST',
  });
}

export function cancelarAtendimento(id: string): Promise<AtendimentoFilaItem> {
  return request<AtendimentoFilaItem>(`/atendimentos/${id}/cancelar`, {
    method: 'POST',
  });
}

export function encerrarAtendimento(id: string): Promise<AtendimentoFilaItem> {
  return request<AtendimentoFilaItem>(`/atendimentos/${id}/encerrar`, {
    method: 'POST',
  });
}

export function encaminharAtendimento(id: string): Promise<{
  parent: AtendimentoFilaItem;
  child: AtendimentoFilaItem;
}> {
  return request(`/atendimentos/${id}/encaminhar`, { method: 'POST' });
}

export type ProntuarioAdendo = {
  id: string;
  authorId: string;
  texto: string;
  createdAt: string;
};

export type Prontuario = {
  id: string;
  atendimentoId: string;
  patientId: string;
  queixa: string;
  anamnese: string;
  conduta: string;
  prescricao: string;
  complementoMedico: string;
  paSistolica: number | null;
  paDiastolica: number | null;
  fc: number | null;
  temperatura: number | null;
  spo2: number | null;
  riskClassification: ClassificacaoRisco | null;
  adendos: ProntuarioAdendo[];
};

export type AtualizarProntuarioInput = {
  queixa?: string;
  anamnese?: string;
  conduta?: string;
  prescricao?: string;
  complementoMedico?: string;
  paSistolica?: number | null;
  paDiastolica?: number | null;
  fc?: number | null;
  temperatura?: number | null;
  spo2?: number | null;
  riskClassification?: ClassificacaoRisco | null;
};

export function getProntuarioByAtendimento(
  atendimentoId: string,
): Promise<Prontuario> {
  return request<Prontuario>(`/atendimentos/${atendimentoId}/prontuario`);
}

export function updateProntuario(
  atendimentoId: string,
  input: AtualizarProntuarioInput,
): Promise<Prontuario> {
  return request<Prontuario>(`/atendimentos/${atendimentoId}/prontuario`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function createAdendoProntuario(
  atendimentoId: string,
  texto: string,
): Promise<ProntuarioAdendo> {
  return request<ProntuarioAdendo>(
    `/atendimentos/${atendimentoId}/prontuario/adendos`,
    {
      method: 'POST',
      body: JSON.stringify({ texto }),
    },
  );
}
