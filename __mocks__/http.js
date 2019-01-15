module.exports._server = {};
module.exports._server.listen = jest.fn();
module.exports._server.close = jest.fn();
module.exports.createServer = jest.fn(() => module.exports._server);
