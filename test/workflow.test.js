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

