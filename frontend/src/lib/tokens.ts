const ACCESS_KEY = "bb_access_token";
const REFRESH_KEY = "bb_refresh_token";

export const tokenStore = {
  access: (): string | null => localStorage.getItem(ACCESS_KEY),
  refresh: (): string | null => localStorage.getItem(REFRESH_KEY),
  set: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
  hasSession: (): boolean => Boolean(localStorage.getItem(ACCESS_KEY) || localStorage.getItem(REFRESH_KEY)),
};
