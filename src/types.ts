export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}
export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string; // Tonalidad (ej: "Sol Mayor")
  content: string; // El texto con los acordes
}
