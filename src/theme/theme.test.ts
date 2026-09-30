import { colors, fonts } from './index';
import { fontAssets } from './fontAssets';

describe('tema', () => {
  it('toda família em `fonts` tem um arquivo carregado em `fontAssets`', () => {
    for (const family of Object.values(fonts)) {
      expect(fontAssets).toHaveProperty(family);
    }
  });

  it('mantém as cores principais do app Angular', () => {
    expect(colors.primary).toBe('#0f9aa3');
    expect(colors.bg).toBe('#eef1f2');
    expect(colors.text).toBe('#151a1e');
  });
});
