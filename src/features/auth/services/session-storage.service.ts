import * as SecureStore from 'expo-secure-store';

const SESSION_USER_ID_KEY = 'sigmamed.session.userId';
const SESSION_AUTH_TOKEN_KEY = 'sigmamed.session.authToken';
const SESSION_TENANT_ID_KEY = 'sigmamed.session.tenantId';
const SESSION_PROFILE_ID_KEY = 'sigmamed.session.profileId';
const SESSION_LOCAL_PROFILE_ID_KEY = 'sigmamed.session.localProfileId';

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

export async function setSessionAuthToken(token: string) {
  await SecureStore.setItemAsync(SESSION_AUTH_TOKEN_KEY, token);
}

export async function getSessionAuthToken() {
  return SecureStore.getItemAsync(SESSION_AUTH_TOKEN_KEY);
}

export async function clearSessionAuthToken() {
  await SecureStore.deleteItemAsync(SESSION_AUTH_TOKEN_KEY);
}

export async function setSessionTenantId(tenantId: string | number) {
  await SecureStore.setItemAsync(SESSION_TENANT_ID_KEY, String(tenantId));
}

export async function getSessionTenantId() {
  return SecureStore.getItemAsync(SESSION_TENANT_ID_KEY);
}

export async function clearSessionTenantId() {
  await SecureStore.deleteItemAsync(SESSION_TENANT_ID_KEY);
}

export async function setSessionProfileId(profileId: string | number) {
  await SecureStore.setItemAsync(SESSION_PROFILE_ID_KEY, String(profileId));
}

export async function getSessionProfileId() {
  return SecureStore.getItemAsync(SESSION_PROFILE_ID_KEY);
}

export async function clearSessionProfileId() {
  await SecureStore.deleteItemAsync(SESSION_PROFILE_ID_KEY);
}

export async function setSessionLocalProfileId(profileId: string | number) {
  await SecureStore.setItemAsync(SESSION_LOCAL_PROFILE_ID_KEY, String(profileId));
}

export async function getSessionLocalProfileId() {
  const value = await SecureStore.getItemAsync(SESSION_LOCAL_PROFILE_ID_KEY);
  return value ? Number(value) : null;
}

export async function clearSessionLocalProfileId() {
  await SecureStore.deleteItemAsync(SESSION_LOCAL_PROFILE_ID_KEY);
}

export async function clearRemoteSession() {
  await Promise.all([clearSessionAuthToken(), clearSessionTenantId(), clearSessionProfileId()]);
}
