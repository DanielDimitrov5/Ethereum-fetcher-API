import { decodeRlp, toUtf8String, Provider } from 'ethers';
import { DataSource, Repository } from 'typeorm';
import { Transaction } from '../db/models/Transaction.model';
import { User } from '../db/models/User.model';
import { sortTransactions, isValidTransactionHash } from '../utils/utils';
import jwt from 'jsonwebtoken';

import dotenv from 'dotenv';
dotenv.config();

export const processRpl = async (rpl: string, provider: Provider, appDataSource: DataSource) => {
    const decoded = decodeRlp(rpl);

    const transactions: Transaction[] = [];

    for (const item of decoded) {
        let txHash: string;

        try {
            txHash = toUtf8String(item.toString());
        } catch (error) {
            txHash = item.toString();
        }

        if (!isValidTransactionHash(txHash)) {
            continue;
        }

        const transactionDb = await appDataSource.getRepository(Transaction).findOneBy({ transactionHash: txHash });

        if (transactionDb) {
            transactions.push(transactionDb);
            continue;
        }

        const [tx, txReceipt] = await Promise.all([provider.getTransaction(txHash), provider.getTransactionReceipt(txHash)])

        if (!tx || !txReceipt) {
            continue;
        }

        const transaction: Transaction = {
            "transactionHash": tx.hash,
            "transactionStatus": txReceipt.status ? 1 : 0,
            "blockHash": tx.blockHash ? tx.blockHash : "",
            "blockNumber": tx.blockNumber ? tx.blockNumber : 0,
            "from": tx.from,
            "to": tx.to,
            "contractAddress": txReceipt.contractAddress,
            "input": tx.data,
            "value": tx.value.toString(),
            "users": []
        }

        await appDataSource.getRepository(Transaction).insert(transaction);

        delete transaction.users;

        transactions.push(transaction);
    }

    return { "transactions": sortTransactions(transactions) };
}

const SECRET_KEY = process.env.SECRET_KEY || 'secret' as string;

export const rememberTransactions = async (authToken: string, transactions: any[], appDataSource: DataSource) => {
    const decodedToken = jwt.verify(authToken, SECRET_KEY) as { username: string };
    const username = decodedToken.username;

    const repository = appDataSource.getRepository(User);

    const user = await repository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.savedTransactions', 'savedTransaction')
        .where('user.username = :username', { username })
        .getOne();

    if (user) {
        const oldTransactions = user.savedTransactions;
        const newTransactions = transactions;

        const txHashSet = new Set(oldTransactions.concat(newTransactions));

        user.savedTransactions = Array.from(txHashSet);

        await repository.save(user);
    }
}

export const getMyTransactions = async (authToken: string, appDataSource: DataSource) => {
    const decodedToken = jwt.verify(authToken, SECRET_KEY) as { username: string };
    const username: string = decodedToken.username;

    const userRepository: Repository<User> = appDataSource.getRepository(User);

    const user = await userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.savedTransactions', 'savedTransaction')
        .where('user.username = :username', { username })
        .getOne();

    if (!user?.savedTransactions || user.savedTransactions.length === 0) {
        return [];
    }

    return sortTransactions(user.savedTransactions);
}