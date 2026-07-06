const { defineStore } = Pinia;

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    authenticated: false,
    checkingSession: true,
    onlineUsers: [],
    operator: null
  }),
  getters: {
    isAdmin: (state) => true,
    hasControl: (state) => {
      if (!state.authenticated) return false;
      
      // If Operator Lock is active, check if this user is the operator
      if (state.operator && state.user && state.operator !== state.user.username) {
        return false;
      }
      return true;
    },
    isOperator: (state) => {
      return state.user && state.operator === state.user.username;
    }
  },
  actions: {
    setUser(user) {
      this.user = user;
      this.authenticated = !!user;
    },
    setOnlineUsers(usersList, currentOperator) {
      this.onlineUsers = usersList;
      this.operator = currentOperator;
    },
    setCheckingSession(val) {
      this.checkingSession = val;
    }
  }
});
