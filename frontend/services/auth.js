// Simple logout helper: clear any stored auth and return to Login screen
import { CommonActions } from '@react-navigation/native';

export function logout(navigation) {
  try {
    
  } catch (e) {
    
  }
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    })
  );
}


