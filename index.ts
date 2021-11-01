// Imports cryptography modules
import * as crypto from "crypto";

class Transaction {
	constructor(
		// Declares name and type of attributes
		public amount: number,
		public payer: string,
		public payee: string
	) {}

	toString() {
		// Converts SJON to str
		return JSON.stringify(this);
	}
}

class Block {
	public nonce = Math.round(Math.random() * 999999999);
	constructor(
		// Declares name and type of attributes
		public prevHash: string,
		public transaction: Transaction,
		public ts = Date.now()
	) {}

	get hash() {
		// converts to str
		const str = JSON.stringify(this);
		// hashes str using SHA256
		const hash = crypto.createHash("SHA256");
		hash.update(str).end();
		// Returns as a hex
		return hash.digest("hex");
	}
}

class Chain {
	public static instance = new Chain();

	chain: Block[];

	constructor() {
		this.chain = [
			new Block("", new Transaction(1000000000, "genesis", "luca"))
		];
	}

	get lastBlock() {
		return this.chain[this.chain.length - 1];
	}

	mine(nonce: number) {
		let solution = 1;
		console.log("⛏️     mining...");

		while (true) {
			const hash = crypto.createHash("MD5");
			hash.update((nonce + solution).toString()).end();

			const attempt = hash.digest("hex");

			if (attempt.substr(0, 4) === "0000") {
				console.log(`Solved: ${solution}`);
				return solution;
			}

			solution += 1;
		}
	}

	addBlock(
		transaction: Transaction,
		senderPublicKey: string,
		signature: Buffer
	) {
		const verifier = crypto.createVerify("SHA256");
		verifier.update(transaction.toString());

		const isValid = verifier.verify(senderPublicKey, signature);

		if (isValid) {
			const newBlock = new Block(this.lastBlock.hash, transaction);
			this.mine(newBlock.nonce);
			this.chain.push(newBlock);
		}
	}
}

class Wallet {
	public publicKey: string;
	public privateKey: string;

	constructor() {
		const keypair = crypto.generateKeyPairSync("rsa", {
			modulusLength: 2048,
			publicKeyEncoding: {type: "spki", format: "pem"},
			privateKeyEncoding: {type: "pkcs8", format: "pem"}
		});

		this.privateKey = keypair.privateKey;
		this.publicKey = keypair.publicKey;
	}

	sendMoney(amount: number, payeePublicKey: string) {
		const transaction = new Transaction(
			amount,
			this.publicKey,
			payeePublicKey
		);

		const sign = crypto.createSign("SHA256");
		sign.update(transaction.toString()).end();

		const signature = sign.sign(this.privateKey);
		Chain.instance.addBlock(transaction, this.publicKey, signature);
	}
}

const max = new Wallet();
const luca = new Wallet();
const finn = new Wallet();

luca.sendMoney(50, max.publicKey);
luca.sendMoney(50, finn.publicKey);
finn.sendMoney(25, max.publicKey);

console.log(Chain.instance);
