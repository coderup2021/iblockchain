import * as Crypto from "crypto-js";
//1. 迷你区块链
//2. 区块链的生成，新增， 校验
//3. 交易
//4. 非对称加密
//5. 挖矿
//6. p2p网络

// [{
//     index: 0 //索引
//     timestamp: ? //时间
//     data: 区块的具体信息
//     hash: 当前区块的哈希
//     prevHash: 上一个区块的哈希
//     nonce: 随机数
// }]
//

type Index = number;
type MineAward = number;
export interface Block {
  index: Index;
  timestamp: number;
  data: Trans[] | string;
  hash: string;
  prevHash: string;
  nonce: number;
}
export interface Trans {
  from: Index | string;
  to: Index | string;
  amount: number;
}

//创世区块
const initBlock: Block = {
  index: 0,
  timestamp: 1665798483622,
  data: "hello iblock",
  prevHash: "0",
  nonce: 125,
  hash: "00f1897276079e9f470b69a816e8205995522cb235dcef6fad02c16adf7b423d",
};

class BlockChain {
  blocks: Block[];
  data: Trans[];
  difficulty: number;
  fixedStr: string;
  mineAward: MineAward;
  constructor() {
    this.blocks = [initBlock];
    this.data = [];
    this.difficulty = 4;
    this.fixedStr = "0";
    this.mineAward = 100;
  }

  //获取最后一个区块
  getLastBlock() {
    return this.blocks[this.blocks.length - 1];
  }

  transfer(from: Index, to: Index, amount: number) {
    if (from !== 0) {
      const balance = this.balance(from);
      if (balance < amount) {
        console.error("not enough balance", from, amount, to);
        return;
      }
    }
    const transObj = { from, to, amount };
    this.data.push(transObj);
    return transObj;
  }

  balance(address: Index) {
    let balance = 0;
    this.blocks.forEach((block) => {
      if (Array.isArray(block.data)) {
        (block.data as Trans[]).forEach((trans: Trans) => {
          if (address === trans.from) {
            balance -= trans.amount;
          }
          if (address === trans.to) {
            balance += trans.amount;
          }
        });
      }
    });
    return balance;
  }

  //挖矿
  mine(address: number) {
    this.transfer(0, address, this.mineAward);
    const newBlock = this.generateNewBlock();
    let passChecked = true;
    if (!this.isValidBlock(newBlock)) {
      passChecked = false;
      console.error("not valid block");
    }
    if (!this.isValidChain()) {
      passChecked = false;
      console.error("not valid chain");
    }
    if (passChecked) {
      this.blocks.push(newBlock);
      this.data = [];
    }
    return newBlock;
  }

  isValidBlock(block: Block, lastBlock = this.getLastBlock()) {
    if (block.index !== lastBlock.index + 1) {
      return false;
    }
    if (block.timestamp <= lastBlock.timestamp) {
      return false;
    }
    if (block.prevHash !== lastBlock.hash) {
      return false;
    }
    if (block.hash.slice(0, this.difficulty) !== this.getFixed()) {
      return false;
    }
    if (block.hash !== this.computeHash(block)) {
      return false;
    }
    return true;
  }

  isValidChain(chain = this.blocks) {
    let i = chain.length - 1;
    for (i; i >= 1; i--) {
      if (!this.isValidBlock(chain[i], chain[i - 1])) {
        return false;
      }
    }
    if (JSON.stringify(chain[0]) !== JSON.stringify(initBlock)) {
      return false;
    }
    return true;
  }

  getFixed() {
    return this.fixedStr.repeat(this.difficulty);
  }

  //生成新区块
  generateNewBlock() {
    const block: Block = {
      index: this.blocks.length,
      timestamp: new Date().getTime(),
      data: this.data,
      prevHash: this.getLastBlock().hash,
      nonce: 0,
      hash: "",
    };
    do {
      block.hash = this.computeHash({ ...block });
      block.nonce = block.nonce! + 1;
    } while (block.hash.slice(0, this.difficulty) !== this.getFixed());

    block.nonce -= 1;

    return block;
  }

  //计算哈希
  computeHash(currBlock: Partial<Block>) {
    const { index, prevHash, timestamp, data, nonce } = currBlock;
    return Crypto.SHA256(
      `${index}${prevHash}${timestamp}${data}${nonce}`
    ).toString();
  }
}

export default BlockChain;
