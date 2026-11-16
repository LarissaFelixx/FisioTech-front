import { httpError, networkError } from '../../../test/helpers';
import type { Profissional } from '../../../types/profissional';
import { validarFormulario } from '../../../utils/validation';
import {
  PROFISSIONAL_VAZIO,
  correcoesSensiveis,
  filtrarProfissionais,
  lerConvenios,
  mensagemErroProfissional,
  montarAtualizacaoProfissional,
  montarCriacaoProfissional,
  schemaProfissional,
  valoresDoProfissional,
} from './profissionalLogic';

const profissional: Profissional = {
  id: 1,
  nome: 'João Silva',
  email: 'joao@clinica.com',
  registroProfissional: 'CREFITO-123',
  especialidade: 'Ortopédica',
  valorConsultaParticular: 150.5,
  conveniosAceitos: ['Unimed'],
  foto: null,
  dataNascimento: '1990-01-31',
  sexo: 'Masculino',
  telefone: '85999999999',
  dataCriacao: '2026-10-01T10:00:00',
};

describe('contrato do formulário administrativo', () => {
  it('carrega todos os dados sem carregar a senha', () => {
    const valores = valoresDoProfissional(profissional);
    expect(valores.senha).toBe('');
    expect(valores.dataNascimento).toBe('31/01/1990');
    expect(valores.valorConsultaParticular).toBe('150,50');
    expect(valores.conveniosAceitos).toBe('Unimed');
    expect(montarAtualizacaoProfissional(valores)).toMatchObject({
      nome: profissional.nome,
      senha: null,
      dataNascimento: profissional.dataNascimento,
      valorConsultaParticular: profissional.valorConsultaParticular,
    });
  });

  it('exige senha no cadastro e permite preservar a atual na edição', () => {
    const valores = valoresDoProfissional(profissional);
    expect(validarFormulario(valores, schemaProfissional(false))).toHaveProperty('senha');
    expect(validarFormulario(valores, schemaProfissional(true))).toEqual({});
    const senha = ' senha-com-espacos ';
    expect(montarCriacaoProfissional({ ...valores, senha }).senha).toBe(senha);
  });

  it('mantém validações do backend para identificação, email, senha e datas', () => {
    const valores = {
      ...PROFISSIONAL_VAZIO,
      email: 'invalido',
      registroProfissional: 'x'.repeat(21),
      especialidade: 'x'.repeat(121),
      senha: 'curta',
      dataNascimento: '31/02/2020',
      valorConsultaParticular: '-10',
    };
    expect(Object.keys(validarFormulario(valores, schemaProfissional(false)))).toEqual(
      expect.arrayContaining([
        'nome',
        'email',
        'senha',
        'registroProfissional',
        'especialidade',
        'dataNascimento',
        'valorConsultaParticular',
      ]),
    );
  });

  it('aceita valor zero, especialidade livre e remoção de dados opcionais', () => {
    const valores = {
      ...valoresDoProfissional(profissional),
      valorConsultaParticular: '0',
      conveniosAceitos: '',
      foto: '',
      sexo: '',
      telefone: '',
      dataNascimento: '',
      especialidade: 'Nova especialidade',
    };
    expect(validarFormulario(valores, schemaProfissional(true))).toEqual({});
    expect(montarAtualizacaoProfissional(valores)).toMatchObject({
      valorConsultaParticular: 0,
      conveniosAceitos: [],
      foto: null,
      sexo: null,
      telefone: null,
      dataNascimento: null,
    });
    expect(
      montarAtualizacaoProfissional({ ...valores, valorConsultaParticular: '' })
        .valorConsultaParticular,
    ).toBeNull();
  });

  it('deduplica convênios mantendo a grafia e ordem dos primeiros nomes', () => {
    expect(lerConvenios(' Unimed\n\nUNIMED\r\nBradesco Saúde ')).toEqual([
      'Unimed',
      'Bradesco Saúde',
    ]);
  });

  it('identifica sobrescrita de email, registro e senha sem expor a senha', () => {
    const valores = valoresDoProfissional(profissional);
    expect(correcoesSensiveis(profissional, valores)).toEqual([]);
    expect(
      correcoesSensiveis(profissional, {
        ...valores,
        email: 'novo@clinica.com',
        registroProfissional: 'OUTRO-123',
        senha: 'nova-senha',
      }),
    ).toEqual(['email de acesso', 'registro profissional', 'senha de acesso']);
  });
});

describe('busca e erros', () => {
  it.each(['JOAO', 'Ortopedica', 'joao@clinica', 'CREFITO-123'])('busca por %s', (busca) => {
    expect(filtrarProfissionais([profissional], busca)).toEqual([profissional]);
  });

  it('distingue duplicidade, vínculos e falta de autorização', () => {
    expect(mensagemErroProfissional(httpError(409), 'salvar')).toMatch(/Email ou registro/);
    expect(mensagemErroProfissional(httpError(409), 'excluir')).toMatch(/registros vinculados/);
    expect(mensagemErroProfissional(httpError(403), 'salvar')).toMatch(/não tem permissão/);
    expect(mensagemErroProfissional(networkError(), 'carregar')).toMatch(/Sem conexão/);
  });
});
