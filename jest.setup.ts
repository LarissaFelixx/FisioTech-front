import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';
import { AccessibilityInfo, AppState } from 'react-native';

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

// O mock nativo fornece uma função neste campo; as telas precisam do estado realista.
AppState.currentState = 'active';

// Nos testes, o sistema "pede" redução de movimento: o Skeleton não fica em loop de animação.
jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
