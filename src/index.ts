import express, { Request, Response } from 'express';
import { ethers } from 'ethers';
import { seedUsers } from './services/SeedService';
import { rlphexRoute, allRoute, authenticateRoute, myRoute } from './services/RoutesLogicService';
import { appDataSource } from './db/DataSource';

import { endpoints } from './utils/utils';

import bodyParser from 'body-parser';
import { authenticateToken } from './middlewares/Authentication';
import { cors } from './middlewares/Cors';

import dotenv from 'dotenv';
dotenv.config();

const app = express();

const PORT = process.env.API_PORT || 3000;
const ETH_NODE_URL = process.env.ETH_NODE_URL;

app.use(bodyParser.json());
app.use(cors);

appDataSource.initialize()
    .then(() => {
        console.log('Database connection established');
        seedUsers(appDataSource);
    })
    .catch((error) => {
        console.log('Database connection failed');
        console.log(error);
        process.exit(1);
    });

const provider = new ethers.JsonRpcProvider(ETH_NODE_URL);

app.get('/', (req: Request, res: Response) => {
    res.send(endpoints);
});

app.get('/lime/eth/:rlphex', async (req: Request, res: Response) => {
    await rlphexRoute(req, res, provider, appDataSource);
});

app.get('/lime/all', async (req: Request, res: Response) => {
    await allRoute(req, res, appDataSource);
});

app.post('/lime/authenticate', async (req: Request, res: Response) => {
    await authenticateRoute(req, res, appDataSource);
});

app.get('/lime/my', authenticateToken, async (req: Request, res: Response) => {
    await myRoute(req, res, appDataSource);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});