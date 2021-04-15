const PORT = 1900;
//const MULTICAST_ADDR = "233.255.255.255";
const MULTICAST_ADDR = "224.98.0.251";

const dgram = require("dgram");
const process = require("process");

const socket = dgram.createSocket({ type: "udp4" });

socket.bind(PORT);

socket.on("listening", function() {
    socket.addMembership(MULTICAST_ADDR, "192.168.1.4");
    setInterval(sendMessage, 2500);
    const address = socket.address();
    console.log(
        `UDP socket listening on ${address.address}:${address.port} pid: ${
            process.pid
        }`
    );
});

function sendMessage() {
    const message = Buffer.from(`Message from process ${process.pid}`);
    socket.send(message, 0, message.length, PORT, MULTICAST_ADDR, function() {
        console.info(`Sending message "${message}"`);
    });
}

socket.on("message", function(message, rinfo) {
    console.info(`Message from: ${rinfo.address}:${rinfo.port} - ${message}`);
});