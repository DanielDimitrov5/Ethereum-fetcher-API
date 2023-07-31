import { DataSource } from "typeorm";
import { User } from "../db/models/User.model";
import bcrypt from 'bcrypt';

export const seedUsers = async (appDataSource: DataSource) => {
    const users = [
        { username: 'alice', password: 'alice' },
        { username: 'bob', password: 'bob' },
        { username: 'carol', password: 'carol' },
        { username: 'dave', password: 'dave' },
        { username: 'dani', password: 'dani' },
    ];

    const userRepository = appDataSource.getRepository(User);

    for (const user of users) {

        const userDb = await userRepository.findOneBy({ username: user.username });

        if (!userDb) {
            const hashedPassword = await bcrypt.hash(user.password, 10);

            user.password = hashedPassword;

            await userRepository.insert(user);
        }
    }  
}