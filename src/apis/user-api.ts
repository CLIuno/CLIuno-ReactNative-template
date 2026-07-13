import http from './http'

const userApi = {
  getCurrentUser: () => http.get('/users/current'),
  getUsers: () => http.get('/users'),
  getUserById: (id: string) => http.get(`/users/${id}`),
}

export default userApi
