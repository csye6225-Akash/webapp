const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');

const expect = chai.expect;
chai.use(chaiHttp);

describe('/healthz endpoint', function() {
  it('should return a 200 status for /healthz', function(done) {
    try {
      chai.request(app)
        .get('/healthz')
        .end(function(err, res) {
          if (err) return done(err);
          expect(res).to.have.status(200);
          done();
        });
    } catch (error) {
      done(error);
    }
  }).timeout(2000);
});

describe('POST /v1/user', function() {
  it('should not create a user with an invalid email', function(done) {
    chai.request(app)
      .post('/v1/user')
      .send({
        email: 'invalid-email',
        password: 'Password@123',
        first_name: 'Test',
        last_name: 'User'
      })
      .end(function(err, res) {
        expect(res).to.have.status(400);
        done();
      });
  });

  it('should not create a user with missing fields', function(done) {
    chai.request(app)
      .post('/v1/user')
      .send({
        password: 'Password@123'
      })
      .end(function(err, res) {
        expect(res).to.have.status(400);
        done();
      });
  });
});
