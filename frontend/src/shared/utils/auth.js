// Username como "login" sin contraseña - se pide una sola vez
import { loadFromStorage, saveToStorage } from "./storage";

export async function getUsername() {
  try {
    const key = "auth:username";
    let username = await loadFromStorage(key);
    return username;
  } catch (_e) {
    return null;
  }
}

export async function setUsername(username) {
  try {
    const key = "auth:username";
    const result = await saveToStorage(key, username.trim());
    return result.success;
  } catch (_e) {
    return false;
  }
}
