import { ec as EC } from "elliptic";
import * as fs from "fs";
import { Trans } from "./blockchain";

const ec = new EC("secp256k1");
const keyPath = "./wallet.json";

const getPub = (prv: string) => {
  return ec.keyFromPrivate(prv).getPublic("hex").toString();
};

export const generateKeys = () => {
  try {
    let res = JSON.parse(fs.readFileSync(keyPath).toString());
    if (res.prv && res.pub && getPub(res.prv) === res.pub) {
      return res;
    } else {
      console.log("验证失败，请重新生成密钥");
    }
    return JSON.parse(res);
  } catch (error) {
    const keyPair = ec.genKeyPair();
    const res = {
      prv: keyPair.getPrivate("hex").toString(),
      pub: keyPair.getPublic("hex").toString(),
    };
    fs.writeFileSync(keyPath, JSON.stringify(res));
    return res;
  }
};
const keys = generateKeys();

interface TransExtra extends Trans {
  signature: any;
}

//签名
export const sign = (trans: Trans) => {
  const { from, to, amount } = trans;
  const bufferMsg = `${from}-${to}-${amount}`;
  const keyPairTemp = ec.keyFromPrivate(keys.prv, "hex");
  const signature = Buffer.from(keyPairTemp.sign(bufferMsg).toDER()).toString(
    "hex"
  );
  return signature;
};

//校验
export const verify = (trans: TransExtra, pub: string) => {
  const { from, to, amount, signature } = trans;
  const keyPairTemp = ec.keyFromPublic(pub, "hex");
  const bufferMsg = `${from}-${to}-${amount}`;
  const verifyOK = keyPairTemp.verify(bufferMsg, signature);
  return verifyOK;
};

const trans = { from: "woniu", to: "imooc", amount: 100 };
const trans1 = { from: "woniu1", to: "imooc", amount: 100 };
const signature = sign(trans);
const transExtra: TransExtra = {
  ...trans,
  signature: signature,
};
const verifyOK = verify(transExtra, keys.pub);
console.log("verifyOK", verifyOK);