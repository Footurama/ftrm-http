# Footurama Package: HTTP API

Interface with other HTTP clients and server

## ftrm-http/server

Starts a HTTP server that serves node inputs using GET requests and writes to outputs upon POST requests.

Configuration:

 * ```input```: **0..n**. Each input must have a ```name```, which is used as the HTTP resource path for GET requests. Optionally, the option ```convert``` can configure how to convert the input value to the GET response's payload: ```(value, timestamp) => payload```.
 * ```output```: **0..n**. Each output must have a ```name```, which is used as the HTTP resource path for POST requests. Optionally, the option ```convert``` can configure how to convert the POST request's payload:
   * ```'string'```: Convert the body to a float number. *Default*.
   * ```'float'```: Convert the body to a float number.
   * ```'integer'```: Convert the body to a integer number.
   * ```'boolean'```: Convert the body to a boolean.
   * ```(body) => value```: A custom function.
 * ```port```: The port to listen on. *Mandatory*.
 * ```auth```: Optional object for enabling authorization:
   * ```user```: Username.
   * ```password```: Password.
   * ```real```: Real name. Displayed along with the login prompt.
 * ```index```: If set to ```true```, an index of all resources can be retrieved from path '/'.
Example:

```js
// Example: A thermostat
// GET http://localhost:8080/tmp/current -> Read currently measured temperature
// GET http://localhost:8080/tmp/desired -> Read back desired temperature
// POST http://localhost:8080/tmp/desired -> Set desired temperature
module.exports = [require('ftrm-http/server'), {
	input: [
		{name: 'temp/current', pipe: 'temp.current'},
		{name: 'temp/desired', pipe: 'temp.desired'}
	],
	output: [
		{name: 'temp/desired', pipe: 'temp.desired', convert: 'float'}
	],
	port: 8080
}];
```
