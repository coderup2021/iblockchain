import * as dgram from "dgram";

const udp = dgram.createSocket("udp4");
udp.on("message", function (data, remote) {
  console.log("accept message", data.toString());
  console.log("remote", remote);
});

udp.on("listening", function () {
  const address = udp.address();
  console.log("udp server is listening:", address.address + ":" + address.port);
});

udp.bind(8002);

function send(message: string, port: number, host: string) {
  console.log("send mesage", message);
  udp.send(Buffer.from(message), port, host);
}

const port = Number(process.argv[2]);
const host = process.argv[3];
if (port && host) {
  send("hello lj", port, host);
}
