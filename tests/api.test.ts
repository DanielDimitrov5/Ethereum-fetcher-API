import chai from 'chai';
import chaiHttp from 'chai-http';
import expectedTransactions from './expectedData/exampleTransactions.json';

import dotenv from 'dotenv';
dotenv.config();

chai.use(chaiHttp);
const { expect } = chai;

const app = `http://localhost:${process.env.API_PORT}`; // run the server before running the tests

describe('REST API tests', () => {

    let authToken: string;
    const rlp: string = 'f90110b842307839623266366133633265316165643263636366393262613636366332326430353361643064386135646137616131666435343737646364363537376234353234b842307835613537653330353163623932653264343832353135623037653762336431383531373232613734363534363537626436346131346333396361336639636632b842307837316239653262343464343034393863303861363239383866616337373664306561633062356239363133633337663966366639613462383838613862303537b842307863356639366266316235346433333134343235643233373962643737643765643465363434663763366538343961373438333230323862333238643464373938';

    before(async () => {
        const res = await chai.request(app)
            .post('/lime/authenticate')
            .send({ username: 'alice', password: 'alice' });

        const authRes = res.body;
        authToken = authRes.token;
    });

    it('GET / should return 200 OK', async () => {
        const res = await chai.request(app).get('/');

        expect(res.status).to.equal(200);
    });

    describe('GET /lime/eth/:rplhex', () => {

        it('should return array of transaction', async () => {
            const res = await chai.request(app).get(`/lime/eth/${rlp}`);

            const transactionsRes = res.body;

            expect(res.status).to.equal(200);
            expect(transactionsRes).to.have.property('transactions');
            expect(transactionsRes.transactions).to.be.an('array');
            expect(transactionsRes.transactions.length).to.equal(4);

            const transaction = transactionsRes.transactions[0];

            expect(transaction).to.have.property('transactionHash', '0x71b9e2b44d40498c08a62988fac776d0eac0b5b9613c37f9f6f9a4b888a8b057');
        });

        it('should return 400 if rplhex is not valid', async () => {
            const res = await chai.request(app).get(`/lime/eth/invalid`);

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('message', 'Invalid RLP');
            expect(res.body).to.have.property('error');
        });

        it('should return 400 if transactions are not found', async () => {
            const res = await chai.request(app).get(`/lime/eth/0x00`);

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('message', 'Transactions not found');
        });

        it('should work with JWT opptionally', async () => {
            const res = (await chai.request(app).get(`/lime/eth/${rlp}`).set('AUTH_TOKEN', authToken));

            expect(res.status).to.equal(200);
        });

        it('should return 403 if token is invalud', async () => {
            const res = (await chai.request(app).get(`/lime/eth/${rlp}`).set('AUTH_TOKEN', 'invalid'));

            expect(res.status).to.equal(403);
            expect(res.body).to.have.property('message', 'Invalid or expired token');
        });
    });

    describe('GET /lime/all', () => {
        it('should return array of transaction', async () => {
            const res = await chai.request(app).get('/lime/all');

            const transactionsRes = res.body;

            expect(res.status).to.equal(200);
            expect(transactionsRes).to.have.property('transactions');
            expect(transactionsRes.transactions).to.be.an('array');
            expect(transactionsRes.transactions.length).to.gte(4);
        });
    });

    describe('POST /lime/authenticate', () => {

        it('should authenticate user and return a token', async () => {
            const res = await chai.request(app)
                .post('/lime/authenticate')
                .send({ username: 'bob', password: 'bob' });

            const authRes = res.body;

            expect(res.status).to.equal(200);
            expect(authRes).to.have.property('token');
        });

        it('should return 401 if user is not found', async () => {
            const res = await chai.request(app)
                .post('/lime/authenticate')
                .send({ username: 'nonexistent', password: 'nonexistent' });

            expect(res.status).to.equal(401);
            expect(res.body).to.have.property('message');
            expect(res.body.message).to.equal('Username or password incorrect');
        });

        it('should return 400 if user data is missing', async () => {
            const res = await chai.request(app)
                .post('/lime/authenticate')
                .send({ username: 'bob' });

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('message', 'Username and password are required');
        });
    });

    describe('GET /lime/my', () => {

        it('should return user transactions', async () => {
            const res = await chai.request(app)
                .get('/lime/my')
                .set('AUTH_TOKEN', authToken);

            const transactionsRes = res.body;

            expect(res.status).to.equal(200);
            expect(transactionsRes).to.have.property('transactions');
            expect(transactionsRes.transactions).to.be.an('array');
            expect(transactionsRes.transactions.length).to.gte(4);
            expect(transactionsRes.transactions).to.deep.include.members(expectedTransactions.transactions);
        });

        it('should return 401 if no token is provided', async () => {
            const res = await chai.request(app)
                .get('/lime/my');

            expect(res.status).to.equal(401);
            expect(res.body).to.have.property('message', 'Authentication token missing');
        });

        it('should return 401 if token is invalid', async () => {
            const res = await chai.request(app)
                .get('/lime/my')
                .set("AUTH_TOKEN", "invalid");

            expect(res.status).to.equal(403);
            expect(res.body).to.have.property('message', 'Invalid or expired token');
        });
    });
});
