const net = require('net')

module.exports = (host, username, { timeoutMs = 2000, port = 79 } = {}) => {
    const client = new net.Socket()

	let timeout
	return new Promise((resolve, reject) => {
		timeout = setTimeout(() => {
			const error = new Error('Timeout')
			error.code = 'TIMEOUT'
			reject(error)
		}, timeoutMs)

		client.connect(port, host, function () {
			client.write(username + '\r\n')
		})

		client.on('data', function (data) {
			resolve(data.toString())
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
        try {
            client.destroy()
        } catch(err) {}
	})
}
