import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';

import { AuthContext } from '../../../contexts/AuthContext';
import { PacienteNavigator } from '../../../navigation/PacienteNavigator';
import { meService } from '../../../services/meService';
import { authValue, usuarioProfissional } from '../../../test/authContextValue';
import { httpError, networkError, Providers } from '../../../test/helpers';
import type { Paciente } from '../../../types/paciente';
import {
  cadastradoEm,
  mensagemErroPerfil,
  montarPerfil,
  schemaPerfil,
  valoresDoPerfil,
} from './perfilLogic';
import { validarFormulario } from '../../../utils/validation';

jest.mock('../../../services/meService');

const perfil = (parcial: Partial<Paciente> = {}): Paciente => ({
  id: 5,
  nome: 'Marcos Coelho',
  email: 'marcos.coelho@email.com',
  profissionalId: 1,
  profissionalNome: 'Ana Souza',
  dataNascimento: '1990-05-14',
  sexo: 'Masculino',
  profissao: 'Designer',
  telefone: '(85) 99123-4567',
  endereco: 'Rua das Flores, 120',
  bairro: 'Aldeota',
  foto: 'https://x/foto.png',
  dataCriacao: '2025-03-12T10:00:00',
  ...parcial,
});

describe('perfilLogic', () => {
  it('preenche o formulário com o perfil (data em DD/MM/AAAA, nulos como "")', () => {
    expect(valoresDoPerfil(perfil())).toEqual({
      nome: 'Marcos Coelho',
      email: 'marcos.coelho@email.com',
      dataNascimento: '14/05/1990',
      sexo: 'Masculino',
      profissao: 'Designer',
      telefone: '(85) 99123-4567',
      endereco: 'Rua das Flores, 120',
    });
    expect(
      valoresDoPerfil(perfil({ sexo: null, telefone: null, dataNascimento: null })),
    ).toMatchObject({ sexo: '', telefone: '', dataNascimento: '' });
  });

  it('PUT mantém bairro e foto (fora do Figma) e troca vazios por null', () => {
    const v = { ...valoresDoPerfil(perfil()), profissao: '  ', sexo: '', nome: ' Marcos ' };
    expect(montarPerfil(v, perfil())).toEqual({
      nome: 'Marcos',
      email: 'marcos.coelho@email.com',
      dataNascimento: '1990-05-14',
      sexo: null,
      profissao: null,
      telefone: '(85) 99123-4567',
      endereco: 'Rua das Flores, 120',
      bairro: 'Aldeota',
      foto: 'https://x/foto.png',
    });
  });

  it('validações do Angular: nome e email obrigatórios, email válido, data existente', () => {
    const v = { ...valoresDoPerfil(perfil()), nome: '', email: 'x@', dataNascimento: '31/02/1990' };
    expect(validarFormulario(v, schemaPerfil)).toEqual({
      nome: 'Este campo é obrigatório.',
      email: expect.any(String),
      dataNascimento: expect.any(String),
    });
    expect(validarFormulario(valoresDoPerfil(perfil()), schemaPerfil)).toEqual({});
  });

  it('"Cadastrado em" e mensagens de erro', () => {
    expect(cadastradoEm(perfil())).toBe('Cadastrado em 12/03/2025');
    expect(mensagemErroPerfil(httpError(409))).toBe('Já existe uma conta com este email.');
    expect(mensagemErroPerfil(httpError(500))).toBe('Não foi possível salvar. Tente novamente.');
  });
});

describe('Meu Perfil (tela)', () => {
  const recarregarUsuario = jest.fn(async () => undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(meService.minhasConversas).mockResolvedValue([]);
    jest.mocked(meService.perfil).mockResolvedValue(perfil());
    jest.mocked(meService.atualizarPerfil).mockResolvedValue(undefined);
  });

  async function abrirPerfil() {
    await render(
      <Providers navigation>
        <AuthContext.Provider
          value={authValue({
            user: { ...usuarioProfissional, nome: 'Marcos Coelho', role: 'ROLE_PACIENTE' },
            recarregarUsuario,
          })}
        >
          <PacienteNavigator />
        </AuthContext.Provider>
      </Providers>,
    );
    await fireEvent.press(screen.getByTestId('tab-perfil'));
    await screen.findByText('Cadastrado em 12/03/2025');
  }

  it('mostra os dados e salva só o que mudou, recarregando o usuário logado', async () => {
    await abrirPerfil();
    expect(screen.getByRole('header', { name: 'Meu Perfil' })).toBeOnTheScreen();
    expect(screen.getByTestId('perfil-nome')).toHaveDisplayValue('Marcos Coelho');
    expect(screen.getByTestId('perfil-dataNascimento')).toHaveDisplayValue('14/05/1990');
    expect(
      within(screen.getByTestId('perfil-sexo')).getByRole('radio', { name: 'Masculino' }),
    ).toBeChecked();

    await fireEvent.changeText(screen.getByTestId('perfil-telefone'), '(85) 98888-0000');
    await fireEvent.changeText(screen.getByTestId('perfil-dataNascimento'), '01021991');
    expect(screen.getByTestId('perfil-dataNascimento')).toHaveDisplayValue('01/02/1991');
    await fireEvent.press(screen.getByTestId('perfil-salvar'));

    await waitFor(() =>
      expect(meService.atualizarPerfil).toHaveBeenCalledWith({
        nome: 'Marcos Coelho',
        email: 'marcos.coelho@email.com',
        dataNascimento: '1991-02-01',
        sexo: 'Masculino',
        profissao: 'Designer',
        telefone: '(85) 98888-0000',
        endereco: 'Rua das Flores, 120',
        bairro: 'Aldeota',
        foto: 'https://x/foto.png',
      }),
    );
    expect(await screen.findByTestId('perfil-sucesso')).toHaveTextContent(
      'Perfil atualizado com sucesso.',
    );
    // Regressão: o retorno fica no rodapé, junto do botão, e não no fim do formulário (fora da tela).
    expect(
      within(screen.getByTestId('perfil-rodape')).getByTestId('perfil-sucesso'),
    ).toBeOnTheScreen();
    expect(recarregarUsuario).toHaveBeenCalled();
  });

  it('não envia com campo inválido', async () => {
    await abrirPerfil();
    await fireEvent.changeText(screen.getByTestId('perfil-nome'), '');
    await fireEvent.press(screen.getByTestId('perfil-salvar'));
    expect(await screen.findByText('Este campo é obrigatório.')).toBeOnTheScreen();
    expect(meService.atualizarPerfil).not.toHaveBeenCalled();
  });

  it('email já usado (409) mostra a mensagem do Angular', async () => {
    jest.mocked(meService.atualizarPerfil).mockRejectedValue(httpError(409));
    await abrirPerfil();
    await fireEvent.press(screen.getByTestId('perfil-salvar'));
    expect(await screen.findByTestId('perfil-erro')).toHaveTextContent(
      'Já existe uma conta com este email.',
    );
    expect(
      within(screen.getByTestId('perfil-rodape')).getByTestId('perfil-erro'),
    ).toBeOnTheScreen();
    expect(recarregarUsuario).not.toHaveBeenCalled();
  });

  it('erro ao carregar tem "Tentar novamente"', async () => {
    jest.mocked(meService.perfil).mockRejectedValue(networkError());
    await render(
      <Providers navigation>
        <AuthContext.Provider
          value={authValue({ user: { ...usuarioProfissional, role: 'ROLE_PACIENTE' } })}
        >
          <PacienteNavigator />
        </AuthContext.Provider>
      </Providers>,
    );
    await fireEvent.press(screen.getByTestId('tab-perfil'));
    expect(await screen.findByText('Não foi possível carregar seu perfil.')).toBeOnTheScreen();

    jest.mocked(meService.perfil).mockResolvedValue(perfil());
    await fireEvent.press(screen.getByText('Tentar novamente'));
    expect(await screen.findByText('Cadastrado em 12/03/2025')).toBeOnTheScreen();
  });
});
