import { Request, Response } from 'express';
import { processRpl, rememberTransactions, getMyTransactions } from './DataService';
import { DataSource } from 'typeorm';
import jwt from 'jsonwebtoken';
import { verifyUser } from '../utils/utils';

import dotenv from 'dotenv';
dotenv.config();

export const rlphexRoute = async (req: Request, res: Response, provider: any, appDataSource: DataSource) => {
    if (!req.params.rlphex.startsWith('0x')) {
        req.params.rlphex = '0x' + req.params.rlphex;
    }

    const rlphex: string = req.params.rlphex;

    try {
        const decoded = await processRpl(rlphex, provider, appDataSource);

        if (decoded.transactions.length === 0) {
            res.status(400).send({ "message": "Transactions not found" });
            return;
        }

        const authToken = req.header('AUTH_TOKEN');

        if (authToken) {
            try {
                await rememberTransactions(authToken, decoded.transactions, appDataSource);
            } catch (error) {
                res.status(403).json({ message: 'Invalid or expired token' });
                return;
            }
        }

        res.send(decoded);

    } catch (error: any) {
        res.status(400).send({ "message": "Invalid RLP", "error": error.message });
    }
}

export const allRoute = async (req: Request, res: Response, appDataSource: DataSource) => {
    const transactions = await appDataSource.getRepository('Transaction').find();

    res.send({ "transactions": transactions });
}

const SECRET_KEY = process.env.SECRET_KEY || "secret" as string;

export const authenticateRoute = async (req: Request, res: Response, appDataSource: DataSource) => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400).json({ message: 'Username and password are required' });
        return;
    }

    const user = await verifyUser(username, password, appDataSource);

    if (user) {
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '30d' });
        res.json({ token });
    } else {
        res.status(401).json({ message: 'Username or password incorrect' });
    }
}

export const myRoute = async (req: Request, res: Response, appDataSource: DataSource) => {
    const authToken = req.header('AUTH_TOKEN');
    if (authToken) {
        try {
            const transactions = await getMyTransactions(authToken, appDataSource);

            if (transactions.length === 0) {
                res.send({ "message": "No transactions found" });
                return;
            }

            res.send({ "transactions": transactions });
        } catch (error) {
            res.status(401).json({ message: 'Invalid or expired token' });
        }
    } else {
        res.status(401).json({ message: 'Authentication token missing' });
    }
}