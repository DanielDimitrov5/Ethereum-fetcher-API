import { DataSource } from 'typeorm';
import { Transaction } from './models/Transaction.model';
import { User } from './models/User.model';
import dotenv from 'dotenv';
dotenv.config();

const DB_CONNECTION_URL = process.env.DB_CONNECTION_URL;

export const appDataSource = new DataSource({
    type: 'postgres',
    url: DB_CONNECTION_URL,
    entities: [Transaction, User],
    synchronize: true
});
