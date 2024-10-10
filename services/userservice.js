class UserService {
    constructor() {
      this.users = []; // In-memory user store
      this.nextId = 1; // To simulate auto-incremented IDs
    }
  
    createUser(user) {
      const newUser = { id: this.nextId++, ...user };
      this.users.push(newUser);
      return newUser;
    }
  
    findUserByUsername(username) {
      return this.users.find(user => user.username === username);
    }
  
    // You can add more methods as needed
  }
  
  module.exports = UserService;
  