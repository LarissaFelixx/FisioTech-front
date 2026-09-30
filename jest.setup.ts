import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

// Nos testes, o sistema "pede" redução de movimento: o Skeleton não fica em loop de animação.
jest
  .spyOn(require('react-native').AccessibilityInfo, 'isReduceMotionEnabled')
  .mockResolvedValue(true);
