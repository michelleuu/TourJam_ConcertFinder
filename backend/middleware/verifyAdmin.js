function verifyAdmin (req, res, next) {
    if (!req.user) {
        return res
            .status(401)
            .json ({message: "Unauthorized: Please log in first."});
    }

    if (req.user.role !== "admin") {
        return res
            .status(403)
            .json ({message: "Forbidden: Admin privileges required."});
    }

    next();
}

module.exports = verifyAdmin;