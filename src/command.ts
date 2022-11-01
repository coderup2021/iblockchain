import { jsonLog, tableLog } from "./utils";
import { Action } from "vorpal";
import Vorpal = require("vorpal");
import BlockChain from "./blockchain";
import { keys } from "./rsa";

const blockChain = new BlockChain();
const vorpal = new Vorpal();

vorpal.command("mine", "mine a block").action(((args) => {
  const block = blockChain.mine(keys.pub);
  block && tableLog(block);
  return Promise.resolve();
}) as Action);

vorpal.command("chain", "show all blocks").action(((args) => {
  tableLog(blockChain.blocks);
  return Promise.resolve();
}) as Action);

vorpal.command("trans <to> <amount>", "转账").action(((args) => {
  const { to, amount } = args;
  let trans = blockChain.transfer(keys.pub, to, amount);
  trans && tableLog(trans);
  return Promise.resolve();
}) as Action);

vorpal.command("detail <index>", "查看区块详情").action(function (args) {
  const block = blockChain.blocks[args.index];
  tableLog(block);
  return Promise.resolve();
});

vorpal.command("pending", "查看未打包的交易").action(function (args) {
  tableLog(blockChain.data);
  return Promise.resolve();
});

vorpal.command("balance", "查询余额").action(function (args) {
  const address = keys.pub;
  const balance = blockChain.balance(address);
  if (balance) {
    tableLog({ address, balance });
  }
  return Promise.resolve();
});

vorpal.command("peers", "查看节点网络信息").action(function (args) {
  tableLog(blockChain.peers);
  return Promise.resolve();
});
vorpal.command("seed", "查看种子节点网络信息").action(function (args) {
  tableLog(blockChain.seed);
  return Promise.resolve();
});
vorpal.command("pub", "查看本地地址").action(function (args) {
  jsonLog(keys.pub);
  return Promise.resolve();
});
vorpal.command("chat <message>", "和别的节点hi一下").action(function (args) {
  const { message } = args;
  blockChain.broadcast({
    type: "hi",
    data: message,
  });
  return Promise.resolve();
});

vorpal.delimiter("coderup >:").show();
