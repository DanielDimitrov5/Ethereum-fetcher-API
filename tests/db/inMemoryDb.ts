import { DataSource } from 'typeorm';
import { Transaction } from '../../src/db/models/Transaction.model';
import { User } from '../../src/db/models/User.model';

export const appDataSource = new DataSource({
        type: 'sqlite',
        database: ':memory:',
        synchronize: true,
        entities: [Transaction, User],
});
