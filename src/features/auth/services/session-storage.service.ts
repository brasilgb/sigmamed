import * as SecureStore from 'expo-secure-store';

const SESSION_USER_ID_KEY = 'sigmamed.session.userId';

export async function setSessionUserId(userId: number) {
  await SecureStore.setItemAsync(SESSION_USER_ID_KEY, String(userId));
}

export async function getSessionUserId() {
  const value = await SecureStore.getItemAsync(SESSION_USER_ID_KEY);
  return value ? Number(value) : null;
}

export async function clearSessionUserId() {
  await SecureStore.deleteItemAsync(SESSION_USER_ID_KEY);
}
