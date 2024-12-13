const logger = (req, res, next) => {
    const start = Date.now()
    const date = new Date()
    const timestamp =
        date.toLocaleDateString() +
        ' ' +
        date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })

    console.log(`[${timestamp}] ${req.method} ${req.url} - Début`)

    // Intercepter la fin de la réponse
    res.on('finish', () => {
        const duration = Date.now() - start
        const status = res.statusCode
        const statusColor =
            status >= 500
                ? '\x1b[31m' // Rouge pour 5xx
                : status >= 400
                ? '\x1b[33m' // Jaune pour 4xx
                : status >= 300
                ? '\x1b[36m' // Cyan pour 3xx
                : status >= 200
                ? '\x1b[32m' // Vert pour 2xx
                : '\x1b[0m' // Blanc pour autres

        console.log(
            `[${timestamp}] ${req.method} ${req.url} - ` +
                `${statusColor}${status}\x1b[0m - ${duration}ms`
        )
    })

    next()
}

export default logger
