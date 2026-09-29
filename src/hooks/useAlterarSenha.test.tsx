import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { AuthContext, type AuthContextValue } from '../contexts/AuthContext';
import { meService } from '../services/meService';
import { adminService, profissionalService } from '../services/profissionalService';
import { authValue, usuarioProfissional } from '../test/authContextValue';
import { httpError, networkError, Providers } from '../test/helpers';
import { useAlterarSenha, type ResultadoTrocaSenha } from './useAlterarSenha';

jest.mock('../services/meService');
jest.mock('../services/profissionalService');

const request = { senhaAtual: 'senha-atual', novaSenha: 'senha-nova-123' };

async function renderTroca(parcial: Partial<AuthContextValue> = {}) {
  const value = authValue(parcial);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Providers>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </Providers>
  );
  const hook = await renderHook(() => useAlterarSenha(), { wrapper });
  return { ...hook, value };
}

async function trocar(result: { current: ReturnType<typeof useAlterarSenha> }) {
  let resultado: ResultadoTrocaSenha | undefined;
  await act(async () => {
    resultado = await result.current.mutateAsync(request);
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  return resultado;
}

beforeEach(() => jest.clearAllMocks());

describe('useAlterarSenha', () => {
  it.each([
    ['ROLE_PROFISSIONAL', () => profissionalService.alterarPropriaSenha],
    ['ROLE_PACIENTE', () => meService.alterarSenha],
    ['ROLE_ADMIN', () => adminService.alterarPropriaSenha],
  ])('%s usa o endpoint do próprio perfil e entra de novo com a nova senha', async (role, alvo) => {
    jest.mocked(alvo()).mockResolvedValue(undefined);
    const { result, value } = await renderTroca({ user: { ...usuarioProfissional, role } });

    const resultado = await trocar(result);

    expect(alvo()).toHaveBeenCalledWith(request);
    expect(value.login).toHaveBeenCalledWith(usuarioProfissional.email, 'senha-nova-123');
    expect(value.logout).not.toHaveBeenCalled();
    expect(resultado).toBe('relogado');
  });

  it('se o novo login falhar, desloga (como o Angular)', async () => {
    jest.mocked(profissionalService.alterarPropriaSenha).mockResolvedValue(undefined);
    const { result, value } = await renderTroca({
      login: jest.fn(async () => {
        throw networkError();
      }),
    });

    const resultado = await trocar(result);

    expect(value.logout).toHaveBeenCalledTimes(1);
    expect(resultado).toBe('deslogado');
  });

  it('senha atual incorreta (400): propaga o erro sem relogar', async () => {
    jest.mocked(profissionalService.alterarPropriaSenha).mockRejectedValue(httpError(400));
    const { result, value } = await renderTroca();

    await act(async () => {
      await expect(result.current.mutateAsync(request)).rejects.toMatchObject({
        response: { status: 400 },
      });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(value.login).not.toHaveBeenCalled();
    expect(value.logout).not.toHaveBeenCalled();
  });

  it('perfil desconhecido não chama nenhum endpoint', async () => {
    const { result } = await renderTroca({ user: { ...usuarioProfissional, role: 'ROLE_X' } });

    await act(async () => {
      await expect(result.current.mutateAsync(request)).rejects.toThrow(/Perfil/);
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(profissionalService.alterarPropriaSenha).not.toHaveBeenCalled();
    expect(meService.alterarSenha).not.toHaveBeenCalled();
    expect(adminService.alterarPropriaSenha).not.toHaveBeenCalled();
  });
});
