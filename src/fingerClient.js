const net = require('net')
var client = new net.Socket()

const FINGER_PORT = 79

module.exports = (host, username, { timeoutMs = 2000 } = {}) => {
	let timeout
	return new Promise((resolve, reject) => {
		timeout = setTimeout(() => {
			const error = new Error('Timeout')
			error.code = 'TIMEOUT'
			reject(error)
		}, timeoutMs)

		client.connect(FINGER_PORT, host, function () {
			client.write(username + '\r\n')
		})

		client.on('data', function (data) {
			resolve(data.toString())
			client.destroy() // kill client after server's response
		})

		client.on('error', function (err) {
			reject(err)
		})

		client.on('close', function () {
			const error = new Error('Finger connection closed before receiving data')
			error.code = 'CONN_CLOSED_BEFORE_RECEIVING_DATA'
			reject(error)
		})
	}).finally(() => {
		clearTimeout(timeout)
	})
}
