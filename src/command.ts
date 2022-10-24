import { jsonLog, tableLog } from "./utils";
import { Action } from "vorpal";
import Vorpal = require("vorpal");
import BlockChain from "./blockchain";

const blockChain = new BlockChain();
const vorpal = new Vorpal();

vorpal.command("mine <address>", "mine a block").action(((args) => {
  const block = blockChain.mine(args.address);
  block && tableLog(block);
  return Promise.resolve();
}) as Action);

vorpal.command("chain", "show all blocks").action(((args) => {
  tableLog(blockChain.blocks);
  return Promise.resolve();
}) as Action);

vorpal.command("trans <from> <to> <amount>", "转账").action(((args) => {
  const { from, to, amount } = args;
  let trans = blockChain.transfer(from, to, amount);
  trans && tableLog(trans);
  return Promise.resolve();
}) as Action);

vorpal.command("detail <index>", "查看区块详情").action(function (args) {
  const block = blockChain.blocks[args.index];
  jsonLog(block);
  return Promise.resolve();
});

vorpal.command("data", "查看Data").action(function (args) {
  jsonLog(blockChain.data);
  return Promise.resolve();
});

vorpal.command("balance <address>", "查询余额").action(function (args) {
  const { address } = args;
  const balance = blockChain.balance(address);
  if (balance) {
    tableLog({ address, balance });
  }
  return Promise.resolve();
});

vorpal.command("nodes", "查看节点网络信息").action(function (args) {
  jsonLog(blockChain.peers);
  return Promise.resolve();
});
vorpal.command("seed", "查看种子节点网络信息").action(function (args) {
  jsonLog(blockChain.seed);
  return Promise.resolve();
});

vorpal.delimiter("coderup >:").show();
