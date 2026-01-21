export interface User {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export function setAccessToken(token: string): void {
  localStorage.setItem('access_token', token);
}

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

export function removeAccessToken(): void {
  localStorage.removeItem('access_token');
}

export function setUser(user: User): void {
  localStorage.setItem('user', JSON.stringify(user));
}

export function getUser(): User | null {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

export function removeUser(): void {
  localStorage.removeItem('user');
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function logout(): void {
  removeAccessToken();
  removeUser();
}
