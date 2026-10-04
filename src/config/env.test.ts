import { DEFAULT_API_URL, resolveApiUrl } from './env';

describe('resolveApiUrl', () => {
  it('usa a URL informada, sem barras finais nem espaços', () => {
    expect(resolveApiUrl('  http://192.168.0.10:8080/  ')).toBe('http://192.168.0.10:8080');
    expect(resolveApiUrl('https://api.fisiotech.com//')).toBe('https://api.fisiotech.com');
  });

  it('cai no padrão do emulador quando a variável não existe ou está vazia', () => {
    expect(resolveApiUrl(undefined)).toBe(DEFAULT_API_URL);
    expect(resolveApiUrl('   ')).toBe(DEFAULT_API_URL);
    expect(DEFAULT_API_URL).toBe('http://10.0.2.2:8080');
  });

  it('rejeita valores que não são URL http(s)', () => {
    expect(() => resolveApiUrl('10.0.2.2:8080')).toThrow(/EXPO_PUBLIC_API_URL inválida/);
    expect(() => resolveApiUrl('ftp://host')).toThrow(/EXPO_PUBLIC_API_URL inválida/);
  });
});
