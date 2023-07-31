import { Transaction } from "../db/models/Transaction.model";
import { DataSource } from "typeorm";
import { User } from "../db/models/User.model";
import bcrypt from 'bcrypt';

export const sortTransactions = (transactions: Transaction[]) => {
    return transactions.sort((a, b) => {
        if (a.blockNumber === b.blockNumber) {
            return a.transactionHash.localeCompare(b.transactionHash);
        }
        return a.blockNumber - b.blockNumber;
    });
}

export const isValidTransactionHash = (input: string) => {
    const txHashRegExp = /^(0x)?[0-9a-fA-F]{64}$/;
    return txHashRegExp.test(input);
}

export const verifyUser = async (username: string, password: string, appDataSource: DataSource) => {
    const user = await appDataSource.getRepository(User).findOneBy({ username: username });
    
    if (!user) return false;
    
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    return isPasswordMatch;
}

export const endpoints = [
    {
        "method": "GET",
        "path": "/lime/eth/:rlphex",
        "description": "Returns transaction details for the given RLP hex string"
    },
    {
        "method": "GET",
        "path": "/lime/all",
        "description": "Returns all transactions"
    },
    {
        "method": "POST",
        "path": "/lime/authenticate",
        "description": "Returns a JWT token for the given username and password"
    },
    {
        "method": "GET",
        "path": "/lime/my",
        "description": "Returns all transactions for the authenticated user"
    }
];
