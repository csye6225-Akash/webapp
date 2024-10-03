const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app.js'); 

chai.use(chaiHttp);
const { expect } = chai;

describe('User API Tests', () => {
    let userId;
  
    
    before((done) => {
      
      done();
    });
  
    it('should create a new user successfully', (done) => {
      chai.request(app)
        .post('/v1/user')
        .send({
          email: 's456t1@exmple.com',
          password: 'Password@123',
          first_name: 'Test',
          last_name: 'User'
        })
        .end((err, res) => {
          if (err) done(err); 
          expect(res).to.have.status(201);
          userId = res.body.id; 
          done(); // test will end here
        });
    });

    it('should not create a user with an invalid email', (done) => {
        chai.request(app)
            .post('/v1/user')
            .send({
                email: 'invalid-email',
                password: 'Password@123',
                first_name: 'Test',
                last_name: 'User'
            })
            .end((err, res) => {
                expect(res).to.have.status(400);
                done();
            });
    });

    it('should not create a user with missing fields', (done) => {
        chai.request(app)
            .post('/v1/user')
            .send({
                password: 'Password@123'
            })
            .end((err, res) => {
                expect(res).to.have.status(400);
                done();
            });
    });

    
});
