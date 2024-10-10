const chai = require('chai'); // Import chai
const chaiHttp = require('chai-http'); // Import chai-http
const app = require('../app'); // Import your Express application

const expect = chai.expect; // Use chai's expect assertion
chai.use(chaiHttp); // Use chai-http for HTTP requests

// Health check endpoint test
describe('/healthz endpoint', function() {
  it('should return a 200 status for /healthz', function(done) {
    chai.request(app)
      .get('/healthz')
      .end(function(err, res) {
        if (err) return done(err);
        expect(res).to.have.status(200);
        done();
      });
  });
});

// User creation tests
describe('POST /v1/user', function() {

  it('should not create a user with an invalid email', function(done) {
    chai.request(app)
      .post('/v1/user')
      .send({
        email: 'invalid-email', // Invalid email format
        password: 'Password@123',
        first_name: 'Test',
        last_name: 'User'
      })
      .end(function(err, res) {
        expect(res).to.have.status(400); // Expect status 400 for invalid input
        done();
      });
  });

  it('should not create a user with missing fields', function(done) {
    chai.request(app)
      .post('/v1/user')
      .send({
        password: 'Password@123' // Missing other fields like email, first_name, and last_name
      })
      .end(function(err, res) {
        expect(res).to.have.status(400); // Expect status 400 for missing fields
        done();
      });
  });

  


});
