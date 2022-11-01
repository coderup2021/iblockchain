import * as Crypto from "crypto-js";
import * as dgram from "dgram";
import { verify, sign, keys } from "./rsa";
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

type Index = number | string;
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
  ts: number;
  signature?: string;
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
//节点
interface NetNode {
  address: string;
  port: number;
}
//节点之间传递的数据格式
interface Action {
  type: string;
  data?: {};
}
interface BlockData {
  blocks: Block[];
  trans: Trans[];
}

class BlockChain {
  blocks: Block[];
  data: Trans[];
  difficulty: number;
  fixedStr: string;
  mineAward: MineAward;
  peers: NetNode[];
  seed: NetNode;
  udp: dgram.Socket;
  remote: NetNode | null;

  constructor() {
    this.blocks = [initBlock];
    this.data = [];
    this.difficulty = 4;
    this.fixedStr = "0";
    this.mineAward = 100;
    this.peers = [];
    this.seed = {
      address: "140.238.59.75",
      port: 8001,
    };
    this.remote = null;
    this.udp = dgram.createSocket("udp4");
    this.initUDP();
  }

  initUDP() {
    this.bindP2P();
    this.bindExit();
  }
  bindP2P() {
    this.udp.on("message", (data, remote) => {
      const { address, port } = remote;
      const action: Action = JSON.parse(data.toString());
      if (action.type) {
        this.dispatch(action, remote);
      }
    });
    this.udp.on("listening", () => {
      console.log(`udp listening on ${this.udp.address().port}`);
    });
    //区分种子节点和普通节点， 普通端口使用端口0即可，服务端接口必须为8001
    const port = Number(process.argv[2] || 0);
    this.startNode(port);
  }
  startNode(port: number) {
    this.udp.bind(port);
    if (port !== 8001) {
      this.send(
        {
          type: "newpeer",
        },
        this.seed
      );
    }
    this.addPeers([this.seed]);
  }
  send(message: Action, remote: NetNode) {
    const { address, port } = remote;
    this.udp.send(JSON.stringify(message), port, address);
  }
  bindExit() {
    process.on("exit", () => {
      console.log(">>>>>>>>byebye");
    });
  }
  dispatch(action: Action, remote: NetNode) {
    // console.log("接受到网络消息：", JSON.stringify(action));
    switch (action.type) {
      case "newpeer":
        console.log("hello, new friend");
        //种子节点需要做的事情
        const { address, port } = remote;
        this.peers.push({ address, port });
        //1.你的公网IP和Port
        this.send({ type: "remoteAddress", data: this.seed }, remote);
        //2.现在全部节点的列表
        this.send({ type: "peerList", data: this.peers }, remote);
        //3.告诉所有已知节点，来了个新朋友，快打招呼
        this.broadcast({ type: "sayHi", data: remote });
        //4.告诉你现在区块链的区块数据和交易数据
        this.send(
          {
            type: "blockchain",
            data: {
              blocks: this.blocks,
              trans: this.data,
            },
          },
          remote
        );
        break;
      case "remoteAddress":
        this.remote = action.data as NetNode;
        break;
      case "peerList":
        const newPeers = action.data;
        this.addPeers(newPeers as NetNode[]);
        break;
      case "blockchain":
        const allData = action.data as BlockData;
        const newBlocks = allData.blocks;
        const newTrans = allData.trans;
        this.replaceBlocks(newBlocks);
        this.replaceTrans(newTrans);
        break;
      case "trans":
        const newTransfer = action.data as Trans;
        if (this.existTransfer(newTransfer)) {
          return;
        }
        console.log("[信息] 有新的交易，请注意查收");
        this.addTrans(newTransfer);
        this.broadcast(action);
        break;
      case "mine":
        const lastBlock = this.getLastBlock();
        const newBlock1 = action.data as Block;
        if (lastBlock.hash === newBlock1.hash) {
          return;
        }
        if (this.isValidBlock(newBlock1, lastBlock)) {
          console.log("[信息] 有朋友挖矿成功，让我门为他喝彩");
          this.blocks.push(newBlock1);
          this.data = [];
          this.broadcast(action);
        } else {
          console.log("挖矿的区块不合法");
        }
        break;
      case "sayHi":
        const remoteAddress = action.data as NetNode;
        console.log("sayHi:新朋友你好，请你喝茶");
        this.send({ type: "hi", data: "Hi" }, remoteAddress);
        this.addPeers([
          {
            address: remoteAddress.address,
            port: remoteAddress.port,
          },
        ]);
        break;
      case "hi":
        console.log(`${remote.address}:${remote.port} :: ${action.data}`);
        break;
      default:
        console.log("unknown action type");
    }
  }
  addTrans(newTransfer: Trans) {
    if (this.isValidTransfer(newTransfer)) {
      this.data.push(newTransfer);
    }
  }
  isEqualObj(o1: {}, o2: {}) {
    const keys1 = Object.keys(o1);
    const keys2 = Object.keys(o2);
    if (keys1.length !== keys2.length) return false;
    return (
      keys1.every((k) => o1[k] === o2[k]) && keys2.every((k) => o2[k] === o1[k])
    );
  }
  existTransfer(transfer: Trans) {
    return !!this.data.find((t) => this.isEqualObj(transfer, t));
  }

  broadcast(action: Action) {
    this.peers.forEach((peer) => {
      this.send(action, peer);
    });
  }
  addPeers(peers: NetNode[]) {
    peers.forEach((peer) => {
      if (!this.peers.find((p) => this.isEqualObj(p, peer))) {
        this.peers.push(peer);
      }
    });
  }

  //获取最后一个区块
  getLastBlock() {
    return this.blocks[this.blocks.length - 1];
  }
  transfer(from: Index, to: Index, amount: number) {
    const ts = new Date().getTime();
    const transObj = {
      from,
      to,
      amount,
      ts,
      signature: sign({ from, to, amount, ts }),
    };

    this.data.push(transObj);
    if (from !== 0) {
      const balance = this.balance(from);
      if (balance < amount) {
        console.error("not enough balance", from, amount, to);
        return;
      }
      this.broadcast({
        type: "trans",
        data: transObj,
      });
    }
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

  isValidTransfer(trans: Trans) {
    return verify(trans, trans.from as string);
  }
  //挖矿
  mine(address: string) {
    if (!this.data.every((v) => this.isValidTransfer(v))) {
      console.log(`非法交易`);
      return;
    }
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
    console.log("[信息] 挖矿成功");
    this.broadcast({
      type: "mine",
      data: newBlock,
    });
    return newBlock;
  }

  isValidBlock(block: Block, lastBlock = this.getLastBlock()) {
    if (block.index !== (lastBlock.index as number) + 1) {
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

  replaceBlocks(newBlocks: Block[]) {
    if (newBlocks.length === 1) return;
    if (this.isValidChain(newBlocks) && newBlocks.length > this.blocks.length) {
      this.blocks = JSON.parse(JSON.stringify(newBlocks));
    } else {
      console.log("[错误]：不合法的链");
    }
  }

  replaceTrans(trans: Trans[]) {
    if (trans.every((t) => this.isValidTransfer(t))) {
      this.data = trans;
    }
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
