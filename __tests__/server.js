const EventEmitter = require('events');

jest.mock('http');
const mockHttp = require('http');

const server = require('../server.js');

describe('check', () => {
	test('expect at least one input or output', () => {
		try {
			server.check({
				input: [],
				output: []
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('At least one input or one output must be specified');
		}
	});

	test('make sure every input has a name', () => {
		try {
			server.check({
				input: [{}, {name: 'test'}],
				output: []
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('All inputs must have the property name');
		}
	});

	test('make sure every output has a name', () => {
		try {
			server.check({
				input: [],
				output: [{}, {name: 'test'}]
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('All outputs must have the property name');
		}
	});

	test('make sure a port number is given', () => {
		try {
			server.check({
				input: [],
				output: [{name: 'test'}]
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('Option port must be a number');
		}
	});

	test('default output convert: string', () => {
		const opts = {
			input: [],
			output: [{name: 'test'}],
			port: 42
		};
		server.check(opts);
		expect(opts.output[0].convert('42')).toMatch('42');
	});

	test('output convert: string', () => {
		const opts = {
			input: [],
			output: [{name: 'test', convert: 'string'}],
			port: 42
		};
		server.check(opts);
		expect(opts.output[0].convert('42')).toMatch('42');
	});

	test('output convert: float', () => {
		const opts = {
			input: [],
			output: [{name: 'test', convert: 'float'}],
			port: 42
		};
		server.check(opts);
		expect(opts.output[0].convert('42.2')).toBe(42.2);
	});

	test('output convert: integer', () => {
		const opts = {
			input: [],
			output: [{name: 'test', convert: 'integer'}],
			port: 42
		};
		server.check(opts);
		expect(opts.output[0].convert('42.2')).toBe(42);
	});

	test('output convert: boolean', () => {
		const opts = {
			input: [],
			output: [{name: 'test', convert: 'boolean'}],
			port: 42
		};
		server.check(opts);
		expect(opts.output[0].convert('true\n')).toBe(true);
		expect(opts.output[0].convert('false')).toBe(false);
		expect(opts.output[0].convert('1')).toBe(true);
		expect(opts.output[0].convert('0')).toBe(false);
		expect(opts.output[0].convert('on')).toBe(true);
		expect(opts.output[0].convert('off')).toBe(false);
		expect(opts.output[0].convert('yes')).toBe(true);
		expect(opts.output[0].convert('no')).toBe(false);
	});

	test('output convert: custom', () => {
		const convert = jest.fn();
		const opts = {
			input: [],
			output: [{name: 'test', convert}],
			port: 42
		};
		server.check(opts);
		const v = {};
		opts.output[0].convert(v);
		expect(convert.mock.calls[0][0]).toBe(v);
	});

	test('output convert: unknown', () => {
		try {
			server.check({
				input: [],
				output: [{name: 'test', convert: 'foo'}],
				port: 42
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('test: Output converter unknown');
		}
	});

	test('default input convert: string', () => {
		const opts = {
			output: [],
			input: [{name: 'test'}],
			port: 42
		};
		server.check(opts);
		expect(opts.input[0].convert(42)).toMatch('42');
		expect(opts.input[0].convert(true)).toMatch('true');
		expect(opts.input[0].convert(false)).toMatch('false');
		expect(opts.input[0].convert(null)).toMatch('null');
		expect(opts.input[0].convert(undefined)).toMatch('undefined');
	});

	test('input convert: string', () => {
		const opts = {
			output: [],
			input: [{name: 'test', convert: 'string'}],
			port: 42
		};
		server.check(opts);
		expect(opts.input[0].convert(42)).toMatch('42');
	});

	test('input convert: custom', () => {
		const convert = jest.fn();
		const opts = {
			output: [],
			input: [{name: 'test', convert}],
			port: 42
		};
		server.check(opts);
		const v = {};
		const t = {};
		opts.input[0].convert(v, t);
		expect(convert.mock.calls[0][0]).toBe(v);
		expect(convert.mock.calls[0][1]).toBe(t);
	});

	test('input convert: unknown', () => {
		try {
			server.check({
				output: [],
				input: [{name: 'test', convert: 'foo'}],
				port: 42
			});
			throw new Error('FAILED!');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e.message).toEqual('test: Input converter unknown');
		}
	});
});

describe('factory', () => {
	test('create new HTTP server', () => {
		const port = 1234;
		server.factory({ port }, {}, {});
		expect(mockHttp._server.listen.mock.calls[0][0].port).toBe(port);
	});

	test('close HTTP server on exit', () => {
		const port = 1234;
		const exit = server.factory({ port }, {}, {});
		exit();
		expect(mockHttp._server.close.mock.calls.length).toBe(1);
	});

	test('return input', () => {
		const data = 'test';
		const convert = jest.fn(() => data);
		const test = {
			value: 1,
			timestamp: 2,
			convert
		};
		server.factory({}, { test }, {});
		const onReq = mockHttp.createServer.mock.calls[0][0];
		const end = jest.fn();
		onReq({
			method: 'GET',
			url: '/test?foo'
		}, { end });
		expect(convert.mock.calls[0][0]).toBe(test.value);
		expect(convert.mock.calls[0][1]).toBe(test.timestamp);
		expect(end.mock.calls[0][0]).toBe(data);
	});

	test('write output', () => {
		const data = 123;
		const convert = jest.fn(() => data);
		const test = { convert };
		server.factory({}, {}, {test});
		const onReq = mockHttp.createServer.mock.calls[0][0];
		const req = new EventEmitter();
		req.method = 'POST';
		req.url = '/test?foo';
		const end = jest.fn();
		onReq(req, { end });
		req.emit('data', Buffer.from('a'));
		req.emit('data', Buffer.from('b'));
		req.emit('end');
		expect(convert.mock.calls[0][0]).toMatch('ab');
		expect(test.value).toBe(data);
		expect(end.mock.calls.length).toBe(1);
	});

	test('send 404', () => {
		server.factory({}, {}, {});
		const onReq = mockHttp.createServer.mock.calls[0][0];
		const req = {
			method: 'GET',
			url: '/test?foo'
		};
		const res = {
			writeHead: jest.fn(),
			end: jest.fn()
		};
		onReq(req, res);
		expect(res.writeHead.mock.calls[0][0]).toBe(404);
		expect(res.end.mock.calls.length).toBe(1);
	});

	test('send 401 if auth is enabled and no credentials are given', () => {
		server.factory({
			auth: {user: 'test', password: 'test', realm: 'jo'}
		}, {}, {});
		const onReq = mockHttp.createServer.mock.calls[0][0];
		const req = {
			method: 'GET',
			url: '/test?foo',
			headers: {}
		};
		const res = {
			writeHead: jest.fn(),
			setHeader: jest.fn(),
			end: jest.fn()
		};
		onReq(req, res);
		expect(res.writeHead.mock.calls[0][0]).toBe(401);
		expect(res.setHeader.mock.calls[0][0]).toMatch('WWW-Authenticate');
		expect(res.setHeader.mock.calls[0][1]).toMatch('Basic realm="jo"');
		expect(res.end.mock.calls.length).toBe(1);
	});

	test('send 401 if auth is enabled and credentials are wrong', () => {
		const auth = 'Basic ' + Buffer.from('u:wrong').toString('base64');
		server.factory({
			auth: {user: 'u', password: 'p', realm: 'jo'}
		}, {}, {});
		const onReq = mockHttp.createServer.mock.calls[0][0];
		const req = {
			method: 'GET',
			url: '/test?foo',
			headers: {
				authorization: auth
			}
		};
		const res = {
			writeHead: jest.fn(),
			setHeader: jest.fn(),
			end: jest.fn()
		};
		onReq(req, res);
		expect(res.writeHead.mock.calls[0][0]).toBe(401);
		expect(res.setHeader.mock.calls[0][0]).toMatch('WWW-Authenticate');
		expect(res.setHeader.mock.calls[0][1]).toMatch('Basic realm="jo"');
		expect(res.end.mock.calls.length).toBe(1);
	});

	test('send 404 if auth is okay and no route has been found', () => {
		const auth = 'Basic ' + Buffer.from('u:p').toString('base64');
		server.factory({
			auth: {user: 'u', password: 'p', realm: 'jo'}
		}, {}, {});
		const onReq = mockHttp.createServer.mock.calls[0][0];
		const req = {
			method: 'GET',
			url: '/test?foo',
			headers: {
				authorization: auth
			}
		};
		const res = {
			writeHead: jest.fn(),
			setHeader: jest.fn(),
			end: jest.fn()
		};
		onReq(req, res);
		expect(res.writeHead.mock.calls[0][0]).toBe(404);
		expect(res.end.mock.calls.length).toBe(1);
	});
});
