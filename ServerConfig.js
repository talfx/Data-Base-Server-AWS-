const Port = 8080;
const Protocol = 'http';
const HEARTBEAT_INTERVAL_MINUTES = 10;
const os = require('os');

const getServerIP = () => {
    const interfaces = os.networkInterfaces();
    let addresses = [];
    for (const iface in interfaces) {
        for (const address of interfaces[iface]) {
            if (address.family === 'IPv4' && !address.internal) {
                addresses.push(address.address);
            }
        }
    }
    return addresses.length > 0 ? addresses[0] : 'No external IP found';
};
const IP = getServerIP();

module.exports = { IP, Port, HEARTBEAT_INTERVAL_MINUTES, Protocol, getServerIP  };