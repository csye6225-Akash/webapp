

const request = require('supertest');
// const app = require('../app'); 
const User = require('../models/Account'); 


const UserService = require('../services/userservice'); // Adjust the path based on your structure

describe('User Service', () => {
  let userService;

  beforeAll(() => {
    userService = new UserService();
  });

  test('should create a user', () => {
    const user = { username: 'testUser', password: 'testPass' };
    const createdUser = userService.createUser(user);
    expect(createdUser).toHaveProperty('id'); // Assuming createUser returns the created user with an ID
    expect(createdUser.username).toBe(user.username);
  });

  test('should find a user by username', () => {
    const user = { username: 'findUser', password: 'testPass' };
    userService.createUser(user); // Create user to find
    const foundUser = userService.findUserByUsername(user.username);
    expect(foundUser).toBeTruthy();
    expect(foundUser.username).toBe(user.username);
  });

  test('should return undefined for non-existing user', () => {
    const foundUser = userService.findUserByUsername('nonExistingUser');
    expect(foundUser).toBeUndefined();
  });

  // Additional tests can be added here
});
