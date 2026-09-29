import { avatarTint } from './avatarTint';
import { httpError, networkError } from '../test/helpers';
import {
  dataBrParaIso,
  formatDataBr,
  formatDataHoraBr,
  formatDiaMesCurto,
  formatDiaMesHora,
  formatHora,
  horaValida,
  isoParaDataBr,
  mascararData,
  mascararHora,
  mesmoDia,
  paraLocalDateTime,
  parseDataHora,
  rotuloDia,
} from './date';
import { formatMoeda, lerValor } from './moeda';
import { MENSAGEM_SEM_CONEXAO, mensagemDeErro } from './mensagensErro';
import { iniciais } from './iniciais';
import {
  MENSAGENS,
  dataBr,
  email,
  hora,
  maximo,
  minimo,
  obrigatorio,
  validar,
  validarFormulario,
  valorEmReais,
} from './validation';

describe('iniciais', () => {
  it('pega as iniciais das duas primeiras palavras, em maiúsculas', () => {
    expect(iniciais('maria da silva')).toBe('MD');
    expect(iniciais('  Ana  ')).toBe('A');
  });

  it('retorna vazio para nome ausente', () => {
    expect(iniciais('')).toBe('');
    expect(iniciais(undefined)).toBe('');
    expect(iniciais(null)).toBe('');
  });
});

describe('avatarTint', () => {
  it('é estável para o mesmo nome e usa só as 4 cores do tema', () => {
    expect(avatarTint('Maria Souza')).toBe(avatarTint('Maria Souza'));
    const cores = new Set(['Ana', 'Bruno', 'Carla', 'Diego', 'Eva', 'Fabio'].map(avatarTint));
    for (const cor of cores) {
      expect(['blue', 'orange', 'green', 'purple']).toContain(cor);
    }
  });

  it('reproduz o hash do Angular (hash * 31 + charCode, módulo 4)', () => {
    // 'a' = 97 → 97 % 4 = 1 → orange; '' → 0 → blue
    expect(avatarTint('a')).toBe('orange');
    expect(avatarTint('')).toBe('blue');
  });
});

describe('datas', () => {
  it('lê LocalDateTime do backend como hora local', () => {
    const d = parseDataHora('2026-09-29T14:05:30');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([
      2026, 8, 29, 14, 5,
    ]);
    expect(parseDataHora('2026-09-29T14:05:30.123').getSeconds()).toBe(30);
    expect(parseDataHora('2026-09-29').getHours()).toBe(0);
  });

  it('formata hora como HH:mm e dia/mês curto em pt-BR', () => {
    expect(formatHora(new Date(2026, 8, 5, 7, 3))).toBe('07:03');
    expect(formatDiaMesCurto(new Date(2026, 8, 5))).toBe('05 de set.');
    expect(formatDiaMesCurto(new Date(2026, 0, 31))).toBe('31 de jan.');
  });

  it('compara o mesmo dia ignorando o horário', () => {
    expect(mesmoDia(new Date(2026, 8, 29, 0, 0), new Date(2026, 8, 29, 23, 59))).toBe(true);
    expect(mesmoDia(new Date(2026, 8, 29), new Date(2026, 8, 30))).toBe(false);
  });
});

describe('validação (mesmas mensagens de field-error.ts)', () => {
  it('obrigatório considera vazio e só espaços', () => {
    expect(obrigatorio('')).toBe(MENSAGENS.obrigatorio);
    expect(obrigatorio('   ')).toBe('Este campo é obrigatório.');
    expect(obrigatorio('x')).toBeNull();
  });

  it('email usa a regra do Angular e ignora valor vazio', () => {
    expect(email('')).toBeNull();
    expect(email('pessoa@clinica.com')).toBeNull();
    expect(email('pessoa@clinica')).toBeNull(); // Angular também aceita domínio sem ponto
    expect(email('pessoa')).toBe('Email inválido.');
    expect(email('pessoa @x.com')).toBe('Email inválido.');
  });

  it('mínimo e máximo informam o limite', () => {
    expect(minimo(8)('1234567')).toBe('Deve ter pelo menos 8 caracteres.');
    expect(minimo(8)('')).toBeNull();
    expect(minimo(8)('12345678')).toBeNull();
    expect(maximo(3)('abcd')).toBe('Deve ter no máximo 3 caracteres.');
    expect(maximo(3)('abc')).toBeNull();
  });

  it('validar devolve o primeiro erro na ordem das regras', () => {
    expect(validar('', [obrigatorio, email])).toBe(MENSAGENS.obrigatorio);
    expect(validar('x', [obrigatorio, email])).toBe(MENSAGENS.email);
    expect(validar('a@b.com', [obrigatorio, email])).toBeNull();
  });

  it('validarFormulario devolve só os campos com erro', () => {
    expect(
      validarFormulario(
        { email: 'a@b.com', senha: '' },
        { email: [obrigatorio, email], senha: [obrigatorio] },
      ),
    ).toEqual({ senha: MENSAGENS.obrigatorio });
  });
});

describe('datas do formulário (DD/MM/AAAA ↔ ISO)', () => {
  it('mascararData insere as barras e limita a 8 dígitos', () => {
    expect(mascararData('3')).toBe('3');
    expect(mascararData('3101')).toBe('31/01');
    expect(mascararData('31011990')).toBe('31/01/1990');
    expect(mascararData('31/01/19905')).toBe('31/01/1990');
    expect(mascararData('ab31c01')).toBe('31/01');
  });

  it('dataBrParaIso aceita só datas completas e existentes', () => {
    expect(dataBrParaIso('31/01/1990')).toBe('1990-01-31');
    expect(dataBrParaIso('29/02/2024')).toBe('2024-02-29');
    expect(dataBrParaIso('29/02/2023')).toBeNull();
    expect(dataBrParaIso('31/04/2020')).toBeNull();
    expect(dataBrParaIso('1/1/2020')).toBeNull();
  });

  it('isoParaDataBr e formatos dd/MM/yyyy', () => {
    expect(isoParaDataBr('1990-01-31')).toBe('31/01/1990');
    expect(isoParaDataBr(null)).toBe('');
    expect(formatDataBr(new Date(2026, 8, 5))).toBe('05/09/2026');
    expect(formatDataHoraBr(new Date(2026, 8, 5, 9, 7))).toBe('05/09/2026 09:07');
  });

  it('regra dataBr: vazio é válido; data inexistente não', () => {
    expect(dataBr('')).toBeNull();
    expect(dataBr('31/01/1990')).toBeNull();
    expect(dataBr('31/02/1990')).toBe(MENSAGENS.data);
  });
});

describe('mensagemDeErro', () => {
  it('usa a mensagem do status, a de rede ou a padrão', () => {
    expect(mensagemDeErro(httpError(409), { 409: 'duplicado' }, 'padrão')).toBe('duplicado');
    expect(mensagemDeErro(httpError(500), { 409: 'duplicado' }, 'padrão')).toBe('padrão');
    expect(mensagemDeErro(networkError(), {}, 'padrão')).toBe(MENSAGEM_SEM_CONEXAO);
    expect(mensagemDeErro(new Error('x'), {}, 'padrão')).toBe('padrão');
  });
});

describe('datas e valores das consultas', () => {
  it('rotuloDia: dia da semana e mês por extenso, em maiúsculas', () => {
    expect(rotuloDia('2026-09-29')).toBe('TERÇA-FEIRA, 29 DE SETEMBRO');
    expect(rotuloDia('2026-03-01')).toBe('DOMINGO, 01 DE MARÇO');
  });

  it('formatDiaMesHora: dd/MM · HH:mm', () => {
    expect(formatDiaMesHora(new Date(2026, 8, 5, 9, 7))).toBe('05/09 · 09:07');
  });

  it('máscara e validação de hora', () => {
    expect(mascararHora('1')).toBe('1');
    expect(mascararHora('1430')).toBe('14:30');
    expect(mascararHora('14:305')).toBe('14:30');
    expect(horaValida('14:30')).toBe('14:30');
    expect(horaValida('24:00')).toBeNull();
    expect(horaValida('12:60')).toBeNull();
    expect(horaValida('9:00')).toBeNull();
    expect(hora('')).toBeNull();
    expect(hora('25:00')).toBe(MENSAGENS.hora);
  });

  it('paraLocalDateTime junta data e hora no formato do backend', () => {
    expect(paraLocalDateTime('30/09/2026', '14:30')).toBe('2026-09-30T14:30:00');
    expect(paraLocalDateTime('31/09/2026', '14:30')).toBeNull();
    expect(paraLocalDateTime('30/09/2026', '')).toBeNull();
  });

  it('formatMoeda: R$ com vírgula e milhar', () => {
    expect(formatMoeda(150)).toBe('R$ 150,00');
    expect(formatMoeda(1234.5)).toBe('R$ 1.234,50');
    expect(formatMoeda(0)).toBe('R$ 0,00');
  });

  it('lerValor aceita vírgula ou ponto; vazio vira null; texto vira NaN', () => {
    expect(lerValor('')).toBeNull();
    expect(lerValor('150')).toBe(150);
    expect(lerValor('150,50')).toBe(150.5);
    expect(lerValor('1.234,50')).toBe(1234.5);
    expect(lerValor('150.5')).toBe(150.5);
    expect(lerValor('abc')).toBeNaN();
    expect(lerValor('-10')).toBeNaN();
    expect(valorEmReais('abc')).toBe(MENSAGENS.valor);
    expect(valorEmReais('')).toBeNull();
  });
});
