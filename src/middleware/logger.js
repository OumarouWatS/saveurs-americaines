const logger = (req, res, next) => {
    const start = Date.now();

    // Log when response finishes
    res.on('finish', () => {
        const duration = Date.now() - start;
        const log = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent')
        };

        // Color code by status
        const color = res.statusCode >= 500 ? '\x1b[31m' : //red 5xx
                      res.statusCode >= 400 ? '\x1b[33m' : //yellow for 4xx
                      res.statusCode >= 300 ? '\x1b[36m' : //cyan for 3xx
                      '\x1b[32m'; //green for 2xx
        
        const reset = '\x1b[0m';

        console.log(
            `${color}${log.method}${log.status}${reset}-${log.duration}`
        );
    });

    next();
};

module.exports = logger;