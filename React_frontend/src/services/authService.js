export function getDashboardRoute(role) {
    switch (role) {
        case 'admin':
            return '/admin-dashboard'
        case 'owner':
            return '/owner-dashboard'
        default:
            return '/tenant-dashboard'
    }
}

export function normalizeErrorMessage(error) {
    if (error?.message) {
        return error.message
    }

    return 'Something went wrong. Please try again.'
}
