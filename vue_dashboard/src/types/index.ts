export interface APIRESPONSE<T> {
  message?: string
  data: T
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface UserProfile {
  id: number
  email: string
  password?: string
  name: string
  role: string
  avatar: string
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
  role: string
}

export interface LoginPayload {
  email: string
  password: string
}


