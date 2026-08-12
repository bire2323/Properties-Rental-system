export function getDashboardRoute(role) {
    console.log("role", role);
    switch (role) {
        case 'admin':
            return '/admin-dashboard'
        case 'owner':
            return '/owner'
        case 'tenant':
            return '/tenant'
        default:
            // return '/tenant-dashboard'
            return '/owner'
    }
}

export function normalizeErrorMessage(error) {
    if (error?.message) {
        return error.message
    }

    return 'Something went wrong. Please try again.'
}
