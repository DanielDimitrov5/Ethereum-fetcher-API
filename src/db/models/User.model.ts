import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Transaction } from './Transaction.model';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column("text", { unique: true })
    username: string;

    @Column()
    password: string;

    @ManyToMany(() => Transaction)
    @JoinTable()
    savedTransactions!: Transaction[];

    constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
    }
}
