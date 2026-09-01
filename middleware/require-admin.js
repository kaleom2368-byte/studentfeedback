// =====================================================
// ADMIN AUTHORIZATION MIDDLEWARE
// =====================================================

function requireAdmin(req, res, next) {

    if (
        !req.session ||
        !req.session.admin
    ) {
        return res.status(401).json({
            success: false,
            code: "ADMIN_AUTH_REQUIRED",
            message: "Admin authentication required."
        });
    }

    if (
        req.session.admin.role !== "admin"
    ) {
        return res.status(403).json({
            success: false,
            code: "ADMIN_ACCESS_DENIED",
            message: "Admin access denied."
        });
    }

    next();
}


// =====================================================
// EXPORT
// =====================================================

module.exports = requireAdmin;
