import { expect } from 'chai';
import { ethers } from 'ethers';
import { Repository } from 'typeorm';
import jwt from 'jsonwebtoken';

import { processRpl, rememberTransactions, getMyTransactions } from '../src/services/DataService'; 
import { Transaction } from '../src/db/models/Transaction.model';
import { User } from '../src/db/models/User.model';
import { sortTransactions } from '../src/utils/utils';
import { seedUsers } from '../src/services/SeedService';

import expectedTransactions from './expectedData/transactions.json'
import { appDataSource } from './db/inMemoryDb';

import dotenv from 'dotenv';
dotenv.config();

describe('DataService', () => {

    const rpl = '0xf888b842307832373530646637343066363630313737366465303430663930376136323234356434373039393939666136326531383937646663336166383364633836633963b842307830333261363931633739666236323332643039613632333861313539353338623164386131323366363461326633363436363831356231383433336563326330';
    const provider = new ethers.JsonRpcProvider(process.env.ETH_NODE_URL);

    let transactionRepository: Repository<Transaction>;
    let userRepository: Repository<User>;

    before(async () => {
        await appDataSource.initialize();

        await seedUsers(appDataSource);

        transactionRepository = appDataSource.getRepository(Transaction);
        userRepository = appDataSource.getRepository(User);
    });

    after(async () => {
        await appDataSource.destroy();
    });

    describe('processRpl', () => {
        it('should process RPL and return transaction', async () => {
            const transactions = await processRpl(rpl, provider, appDataSource);

            expect(transactions.transactions).to.be.an('array');
            expect(transactions).to.deep.equal(expectedTransactions);
        });

        it('should save transactions to db', async () => {
            const transactions = await transactionRepository.find();

            expect(transactions).to.be.an('array');
            expect(sortTransactions(transactions)).to.deep.equal(sortTransactions(expectedTransactions.transactions));
        });

        it('should not save duplicate transactions to db', async () => {
            const transactions = await processRpl(rpl, provider, appDataSource);

            expect(transactions.transactions).to.be.an('array');
            expect(transactions).to.deep.equal(expectedTransactions);
        });
    });

    const USERNAME = 'alice';
    let token: string;
    
    describe('rememberTransactions', () => {
        const SECRET_KEY = process.env.SECRET_KEY || 'secret' as string;
        
        before(async () => {
            token = jwt.sign({ username: USERNAME }, SECRET_KEY, { expiresIn: '30d' });
        });

        it('should remember transactions for a user', async () => {
            await rememberTransactions(token, expectedTransactions.transactions, appDataSource);

            const user = await userRepository
                .createQueryBuilder('user')
                .leftJoinAndSelect('user.savedTransactions', 'savedTransaction')
                .where('user.username = :username', { username: USERNAME })
                .getOne();

            expect(user?.savedTransactions).to.be.an('array');
            expect(user?.savedTransactions).to.deep.equal(expectedTransactions.transactions);
        });

    });

    describe('getMyTransactions', () => {
        it('should get transactions for a user', async () => {
            const transactions = await getMyTransactions(token, appDataSource);

            expect(transactions).to.be.an('array');
            expect(transactions).to.deep.equal(expectedTransactions.transactions);
        });
    });
});
