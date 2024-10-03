const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const app = require('../app'); 
chai.use(chaiHttp);

describe('User API Integration Tests', () => {
  let userCredentials = {
    email: 'testintakionuser@example.com',
    password: 'Password@123'
  };
  let userId;

  // Test 1: Creating a user
  it('should create a new user successfully', (done) => {
    chai.request(app)
      .post('/v1/user')
      .send({
        email: userCredentials.email,
        password: userCredentials.password,
        first_name: 'Integration',
        last_name: 'Test'
      })
      .end((err, res) => {
        if (err) done(err); 
        expect(res).to.have.status(201);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('id'); 
        userId = res.body.id; 
        done();
      });
  });

  // Test 2: get the created user's details using Basic Authentication
  it('should return the user’s details with valid authentication', (done) => {
    chai.request(app)
      .get('/v1/user/self')
      .auth(userCredentials.email, userCredentials.password) // Pass email and password for Basic Authentication
      .end((err, res) => {
        if (err) done(err); // Handle errors
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('email', userCredentials.email);
        done();
      });
  });

  // Test 3: trying to create the same user again 
  it('should not create a duplicate user', (done) => {
    chai.request(app)
      .post('/v1/user')
      .send({
        email: userCredentials.email,
        password: userCredentials.password,
        first_name: 'Integration',
        last_name: 'Test'
      })
      .end((err, res) => {
        if (err) done(err); 
        expect(res).to.have.status(400);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('error');
        done();
      });
  });
});
