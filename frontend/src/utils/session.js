export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
export const isStrongPassword = (password) => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)

export const getStoredUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

export const setStoredUser = (user, remember = true) => {
  const serialized = JSON.stringify(user)
  if (remember) {
    localStorage.setItem('user', serialized)
    sessionStorage.removeItem('user')
  } else {
    sessionStorage.setItem('user', serialized)
    localStorage.removeItem('user')
  }
}

export const clearStoredUser = () => {
  localStorage.removeItem('user')
  sessionStorage.removeItem('user')
}

export const loginUser = ({ name = 'Demo Investor', email, rememberMe = true }) => {
  const user = {
    id: `user-${Date.now()}`,
    name: name || 'Demo Investor',
    email,
  }

  setStoredUser(user, rememberMe)
  return user
}

export const registerUser = ({ name, email }) => ({
  id: `user-${Date.now()}`,
  name,
  email,
})

export const updateStoredUser = (updates) => {
  const currentUser = getStoredUser()
  if (!currentUser) return null

  const updatedUser = { ...currentUser, ...updates }
  setStoredUser(updatedUser, Boolean(localStorage.getItem('user')))
  return updatedUser
}

export const deleteStoredUser = () => {
  clearStoredUser()
}