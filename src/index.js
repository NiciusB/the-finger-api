require('dotenv').config()
const Hapi = require('@hapi/hapi')
const ERROR_CODES = require('./ERROR_CODES')
const fingerClient = require('./fingerClient')

const port = parseInt(process.env.PORT)

const init = async () => {
	const server = Hapi.server({
		port: port,
		host: '0.0.0.0',
		routes: {
			cors: true,
		},
	})

	server.route({
		method: 'GET',
		path: '/',
		handler: (request, h) => {
			return h
				.response({
                    welcome: 'The Finger API: You request, we finger.',
					nextSteps:
						'Specify a query to finger. For example: /finger/random@happynetbox.com',
				})
				.code(400)
		},
	})

	server.route({
		method: ['GET'],
		path: '/finger/{query}',
		handler: async (request, h) => {
			try {
				const query = request.params.query

				const arr = query.split('@')
				if (arr.length < 2) {
					return h
						.response({
							error: 'Invalid query',
							errorCode: ERROR_CODES.invalidQuery,
						})
						.code(400)
				}

				const host = arr.pop()
				const username = arr.join('@')

				const fingerResponse = await fingerClient(host, username)

				return h.response({ result: fingerResponse }).code(200)
			} catch (error) {
				if (error.code === 'ENOTFOUND') {
					return h
						.response({
							error: 'Unable to reach host',
							errorCode: ERROR_CODES.unableToReachHost,
						})
						.code(500)
				}

				if (error.code === 'TIMEOUT') {
					return h
						.response({
							error: 'Timeout',
							errorCode: ERROR_CODES.timeout,
						})
						.code(400)
				}

				console.error(error)
				return h
					.response({
						error: 'Internal error',
						errorCode: ERROR_CODES.internalError,
					})
					.code(500)
			}
		},
	})

	await server.start()
	console.log('Server running on', server.info.uri)
}

init()
