import { rotuloVoltar } from './rotuloVoltar';

const tabs = (aba: string, index = 0) => ({
  name: 'Tabs',
  state: { index, routes: [{ name: aba }] },
});

describe('rotuloVoltar', () => {
  it('usa a aba de onde a tela foi aberta', () => {
    expect(rotuloVoltar(tabs('Consultas'), 'Home')).toBe('Minhas Consultas');
    expect(rotuloVoltar(tabs('Home'), 'Minhas Consultas')).toBe('Home');
    expect(rotuloVoltar(tabs('Perfil'), 'Home')).toBe('Meu Perfil');
    expect(rotuloVoltar(tabs('Mensagens'), 'Home')).toBe('Mensagens');
  });

  it('abas sem estado aninhado ainda estão na Home', () => {
    expect(rotuloVoltar({ name: 'Tabs' }, 'Minhas Consultas')).toBe('Home');
  });

  it('vinda de outra tela empilhada (ou sem rota anterior), usa o padrão', () => {
    expect(rotuloVoltar({ name: 'MarcarConsulta' }, 'Minhas Consultas')).toBe('Minhas Consultas');
    expect(rotuloVoltar(undefined, 'Home')).toBe('Home');
    expect(rotuloVoltar(tabs('Desconhecida'), 'Home')).toBe('Home');
  });
});
