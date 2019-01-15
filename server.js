const http = require('http');
const url = require('url');

function toString (v) {
	if (v === undefined) return 'undefined';
	if (v === null) return 'null';
	if (typeof v.toString === 'function') return v.toString();
	return '';
}

function parseBoolean (v) {
	v = v.trim();
	switch (v) {
		case 'true': return true;
		case '1': return true;
		case 'yes': return true;
		case 'on': return true;
	}
	return false;
}

function check (opts) {
	if (opts.input.length + opts.output.length === 0) {
		throw new Error('At least one input or one output must be specified');
	}
	opts.input.forEach((i) => {
		if (typeof i.name !== 'string') {
			throw new Error('All inputs must have the property name');
		}
		if (i.convert === undefined || i.convert === 'string') {
			i.convert = (v) => toString(v);
		}
		if (typeof i.convert !== 'function') {
			throw new Error(`${i.name}: Input converter unknown`);
		}
	});
	opts.output.forEach((o) => {
		if (typeof o.name !== 'string') {
			throw new Error('All outputs must have the property name');
		}
		if (o.convert === undefined || o.convert === 'string') {
			o.convert = (v) => v;
		} else if (o.convert === 'float') {
			o.convert = (v) => parseFloat(v);
		} else if (o.convert === 'integer') {
			o.convert = (v) => parseInt(v);
		} else if (o.convert === 'boolean') {
			o.convert = (v) => parseBoolean(v);
		}
		if (typeof o.convert !== 'function') {
			throw new Error(`${o.name}: Output converter unknown`);
		}
	});
	if (typeof opts.port !== 'number') {
		throw new Error('Option port must be a number');
	}
}

function getBody (req, onEnd) {
	const chunks = [];
	req.on('data', (chunk) => chunks.push(chunk));
	req.on('end', () => {
		onEnd(Buffer.concat(chunks).toString());
	});
}

function factory (opts, input, output) {
	const srv = http.createServer((req, res) => {
		// Get the path name an remove the preceding slash
		const name = url.parse(req.url).pathname.slice(1);

		if (req.method === 'GET' && input[name]) {
			// GET request --> get input value
			const i = input[name];
			res.end(i.convert(i.value, i.timestamp));
		} else if (req.method === 'POST' && output[name]) {
			// POST request --> write to output
			const o = output[name];
			getBody(req, (body) => {
				o.value = o.convert(body);
			});
			res.end();
		} else {
			// No input or output found!
			res.statusCode = 404;
			res.end();
		}
	});
	srv.listen({port: opts.port});
	return () => new Promise((resolve) => srv.close(resolve));
}

module.exports = { check, factory };
