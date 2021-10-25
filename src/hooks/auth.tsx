import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

interface IUser {
  id: string;
  name: string;
  login: string;
  avatar_url: string;
}

interface IAuthContextData {
  user: IUser | null
  signInUrl: string;
  signOut: () => void;
}

interface IAuthResponse {
  token: string;
  user: {
    id: string;
    avatar_url: string;
    name: string;
    login: string;
  }
}

interface IAuthProvider {
  children: ReactNode;
}


export const AuthContext = createContext({} as IAuthContextData)

export function AuthProvider({ children }: IAuthProvider) {
  const [user, setUser] = useState<IUser | null>(null)

  const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=7f183208ecc986e370d1`;

  async function signIn(githubCode: string) {
    const response = await api.post<IAuthResponse>('authenticate', {
      code: githubCode
    });

    const { token, user } = response.data;

    localStorage.setItem('@dowhile:token', token);

    api.defaults.headers.common.authorization = `Bearer ${token}`

    setUser(user)
  }

  useEffect(() => {
    const url = window.location.href;
    const hasGithubCode = url.includes('?code=');

    if (hasGithubCode) {
      const [urlWithoutCode, githubCode] = url.split('?code=');

      window.history.pushState({}, '', urlWithoutCode)

      signIn(githubCode);
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('@dowhile:token')

    if (token) {
      api.defaults.headers.common.authorization = `Bearer ${token}`

      api.get<IUser>('profile').then(response => {
        setUser(response.data)
      })
    }
  }, [])

  function signOut() {
    setUser(null);
    localStorage.removeItem('@dowhile:token')
  }

  return (
    <AuthContext.Provider value={{ signInUrl, user, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}