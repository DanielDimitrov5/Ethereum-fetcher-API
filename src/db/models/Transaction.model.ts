import { Entity, Column, ManyToMany, PrimaryColumn } from 'typeorm';
import { User } from './User.model';

@Entity()
export class Transaction {
    @PrimaryColumn()
    transactionHash: string;

    @Column()
    transactionStatus: number;

    @Column()
    blockHash: string;

    @Column()
    blockNumber: number;

    @Column()
    from: string;

    @Column({ type: String, nullable: true })
    to: string | null;

    @Column({ type: String, nullable: true})
    contractAddress: string | null;

    @Column()
    input: string;

    @Column()
    value: string;

    @ManyToMany(() => User, user => user.savedTransactions)
    users?: User[];

    constructor(
        transactionHash: string,
        transactionStatus: number,
        blockHash: string,
        blockNumber: number,
        from: string,
        contractAddress: string,
        input: string,
        value: string,
    ) {
        this.transactionHash = transactionHash;
        this.transactionStatus = transactionStatus;
        this.blockHash = blockHash;
        this.blockNumber = blockNumber;
        this.from = from;
        this.to = null;
        this.contractAddress = null;
        this.input = input;
        this.value = value;
    }
}
