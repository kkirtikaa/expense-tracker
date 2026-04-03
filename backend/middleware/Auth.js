const jwt = require('jsonwebtoken');



const checkToken = (req, res, next) => {
    const headerToken = req.headers['token'];
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : null;
    const token = headerToken || bearerToken;

    if (!token) {
        return res.status(401)
            .json({ message: 'JWT token is required' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_KEY);
        req.user = verified;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401)
                .json({ message: 'JWT token expired. Please login again.' });
        }

        return res.status(403)
            .json({ message: 'JWT token is invalid' });
    }
}



module.exports = checkToken;