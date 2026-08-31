const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function resolveMediaUrl(value) {
    if (!value) return null
    if (typeof value !== 'string') return value
    if (value.startsWith('http://') || value.startsWith('https://')) return value
    if (value.startsWith('/')) return `${API_BASE_URL}${value}`
    return `${API_BASE_URL}/${value}`
}

async function request(endpoint, options = {}) {
    const headers = {
        ...(options.headers || {}),
    }

    if (!(options.body instanceof FormData) && headers['Content-Type'] !== 'multipart/form-data') {
        headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: 'include',
        headers,
        ...options,
    })

    const responseText = await response.text()
    let payload = {}
    try {
        payload = responseText ? JSON.parse(responseText) : {}
    } catch (parseError) {
        payload = {
            detail: response.statusText || `Server returned ${response.status}`,
        }
    }

    if (!response.ok) {
        const message = payload?.detail || payload?.message || payload?.error || response.statusText || 'Request failed.'
        throw new Error(message)
    }

    return payload
}

function formatRelativeTime(isoDate) {
    if (!isoDate) return 'Recently'

    const date = new Date(isoDate)
    const diffMs = Date.now() - date.getTime()
    const diffMinutes = Math.max(0, Math.round(diffMs / 60000))

    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`

    const diffHours = Math.round(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`

    const diffDays = Math.round(diffHours / 24)
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function normalizeDocumentGallery(document = {}) {
    const images = [
        document.document_front_image,
        document.document_back_image,
        document.document_image,
    ]
        .filter(Boolean)
        .map((image) => resolveMediaUrl(image))
        .filter((image, index, list) => image && list.indexOf(image) === index)
        .slice(0, 2)

    return images.length ? images : []
}

export async function getUserStatistics() {
    return request('/api/accounts/admin/user-statistics/', { method: 'GET' })
}

export async function getAdminPayments() {
    try {
        const response = await request('/api/accounts/admin/payments/', { method: 'GET' })
        if (Array.isArray(response?.transactions)) {
            return response.transactions
        }
        return []
    } catch (error) {
        console.warn('Admin payments endpoint unavailable:', error)
        return []
    }
}

export async function getAllProperties(filters = {}) {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, value)
        }
    })

    const queryString = params.toString()
    const endpoint = `/api/properties/${queryString ? `?${queryString}` : ''}`
    return request(endpoint, { method: 'GET' })
}

export async function getPropertyById(propertyId) {
    try {
        const response = await request(`/api/properties/${propertyId}/`, { method: 'GET' })
        return response
    } catch (error) {
        console.error('Error fetching property by ID:', error)
        throw error
    }
}

export async function deleteProperty(propertyId) {
    try {
        const response = await request(`/api/properties/${propertyId}/`, { method: 'DELETE' })
        return response
    } catch (error) {
        console.error('Error deleting property:', error)
        throw error
    }
}

export async function getPropertyOverviewData() {
    try {
        const propertiesResponse = await getAllProperties()
        const properties = Array.isArray(propertiesResponse) ? propertiesResponse : propertiesResponse.results || []

        const labels = []
        const added = []
        const rented = []

        for (let i = 30; i >= 0; i -= 5) {
            const date = new Date()
            date.setDate(date.getDate() - i)

            const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            labels.push(label)

            const start = new Date(date)
            start.setHours(0, 0, 0, 0)
            const end = new Date(date)
            end.setHours(23, 59, 59, 999)

            const addedThisDate = properties.filter((p) => {
                const createdAt = new Date(p.created_at)
                return createdAt >= start && createdAt <= end
            }).length

            const rentedThisDate = properties.filter((p) => {
                const createdAt = new Date(p.created_at)
                return !p.is_available && createdAt >= start && createdAt <= end
            }).length

            added.push(addedThisDate)
            rented.push(rentedThisDate)
        }

        return { labels, added, rented }
    } catch (error) {
        console.error('Error fetching property overview data:', error)
        return { labels: [], added: [], rented: [] }
    }
}

export async function getPendingApprovals() {
    try {
        const propertiesResponse = await getAllProperties()
        const properties = Array.isArray(propertiesResponse) ? propertiesResponse : propertiesResponse.results || []

        const pendingProperties = properties
            .filter((p) => !p.is_verified || p.status === 'pending')
            .slice(0, 10)

        return pendingProperties.map((p) => ({
            id: p.id,
            title: p.title || 'Untitled Property',
            type: p.property_type === 'house' ? 'House' : p.property_type === 'car' ? 'Car' : 'Property',
            owner: p.owner_name || p.owner_email || 'Unknown',
            date: p.created_at ? formatRelativeTime(p.created_at) : 'Recently submitted',
            image: typeof p.main_image === 'string'
                ? p.main_image
                : (p.main_image?.image || p.images?.[0]?.image || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=200&q=80'),
        }))
    } catch (error) {
        console.error('Error fetching pending approvals:', error)
        return []
    }
}

export async function getRecentUsers() {
    try {
        const usersResponse = await request('/api/accounts/admin/recent-users/', { method: 'GET' })
        const users = Array.isArray(usersResponse) ? usersResponse : usersResponse.results || []

        return users.map((user) => ({
            id: user.id,
            name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User',
            email: user.email || '',
            role: user.role || 'User',
            time: user.created_at ? formatRelativeTime(user.created_at) : 'Recently',
            avatar: user.profile_image || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        }))
    } catch (error) {
        console.error('Error fetching recent users:', error)
        return []
    }
}

export async function getRecentReports() {
    try {
        return []
    } catch (error) {
        console.error('Error fetching recent reports:', error)
        return []
    }
}

export async function getAllUsers(filters = {}) {
    try {
        const params = new URLSearchParams()

        if (filters.search) {
            params.append('search', filters.search)
        }
        if (filters.role && filters.role !== 'all') {
            params.append('role', filters.role)
        }
        if (filters.page) {
            params.append('page', filters.page)
        }
        if (filters.page_size) {
            params.append('page_size', filters.page_size)
        } else {
            params.append('page_size', 10)
        }

        const queryString = params.toString()
        const endpoint = `/api/accounts/admin/all-users/${queryString ? `?${queryString}` : ''}`
        const response = await request(endpoint, { method: 'GET' })

        const data = response.users || []
        return {
            users: data.map((user) => ({
                id: user.id,
                name: user.name || 'Unknown User',
                email: user.email || '',
                phone: user.phone || user.phone_number || 'N/A',
                role: user.role || 'User',
                status: user.status || 'Active',
                joined: user.created_at ? formatRelativeTime(user.created_at) : 'Recently',
                avatar: user.profile_image,
            })),
            totalCount: response.total_count || 0,
            page: response.page || 1,
            pageSize: response.page_size || 10,
            totalPages: response.total_pages || 1,
        }
    } catch (error) {
        console.error('Error fetching all users:', error)
        return {
            users: [],
            totalCount: 0,
            page: 1,
            pageSize: 10,
            totalPages: 1,
        }
    }
}

export async function getAdminUserDetail(userId) {
    const response = await request(`/api/accounts/users/${userId}/`, { method: 'GET' })
    const verificationDocuments = (response.verification_documents || []).map((document) => {
        const gallery = normalizeDocumentGallery(document)

        return {
            ...document,
            image: gallery[0] || null,
            previewImages: gallery,
            type: document.document_type_display || document.document_type || 'Verification Document',
        }
    })

    return {
        ...response,
        name: [response.first_name, response.last_name].filter(Boolean).join(' ') || response.email,
        phone: response.phone_number || response.profile?.phone_number || 'N/A',
        profileImage: resolveMediaUrl(response.profile_image || response.profile?.profile_image),
        verificationDocuments,
    }
}

export async function deleteAdminUser(userId) {
    return request(`/api/accounts/users/${userId}/`, { method: 'DELETE' })
}

export async function resetAdminUserLogin(userId) {
    return request(`/api/accounts/admin/users/${userId}/reset-login/`, {
        method: 'PATCH',
    })
}

export async function getOwnerVerificationList(search = '') {
    try {
        const params = new URLSearchParams()
        if (search) {
            params.append('search', search)
        }

        const queryString = params.toString()
        const endpoint = `/api/accounts/admin/verification/${queryString ? `?${queryString}` : ''}`
        const response = await request(endpoint, { method: 'GET' })

        return Array.isArray(response) ? response : []
    } catch (error) {
        console.error('Error fetching owner verification list:', error)
        return []
    }
}

export async function getOwnerVerificationDetail(userId) {
    try {
        const data = await request(`/api/accounts/users/${userId}/`, { method: 'GET' })

        if (data?.profile?.profile_image) {
            data.profile.profile_image = resolveMediaUrl(data.profile.profile_image)
        }

        if (data?.profile_image) {
            data.profile_image = resolveMediaUrl(data.profile_image)
        }

        if (Array.isArray(data?.verification_documents)) {
            data.verification_documents = data.verification_documents.map((document) => {
                const gallery = normalizeDocumentGallery(document)

                return {
                    ...document,
                    document_image: gallery[0] || null,
                    document_front_image: gallery[0] || null,
                    document_back_image: gallery[1] || null,
                    previewImages: gallery,
                }
            })
        }

        return data
    } catch (error) {
        console.error('Error fetching owner verification detail:', error)
        throw error
    }
}

export async function updateOwnerVerificationStatus(userId, status, rejectionReason = '') {
    return request(`/api/accounts/admin/verification/${userId}/`, {
        method: 'PATCH',
        body: JSON.stringify({
            status,
            rejection_reason: rejectionReason,
        }),
    })
}

export async function getUserStatisticsForUsersPage() {
    try {
        const stats = await getUserStatistics()
        return {
            totalUsers: stats.total_users || 0,
            totalCustomers: stats.total_tenants || 0,
            totalOwners: stats.total_owners || 0,
        }
    } catch (error) {
        console.error('Error fetching user statistics for users page:', error)
        return {
            totalUsers: 0,
            totalCustomers: 0,
            totalOwners: 0,
        }
    }
}

export async function getAdminDashboardStats() {
    try {
        const userStats = await getUserStatistics()
        const propertiesResponse = await getAllProperties()
        const properties = Array.isArray(propertiesResponse) ? propertiesResponse : propertiesResponse.results || []

        const totalProperties = properties.length
        const rentedProperties = properties.filter((p) => p.is_available === false).length
        const pendingApprovals = properties.filter((p) => !p.is_verified || p.status === 'pending').length
        const recentProperties = properties.slice(0, 3).map((property) => ({
            ...property,
            image: typeof property.main_image === 'string'
                ? property.main_image
                : (property.main_image?.image || property.images?.[0]?.image || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=200&q=80'),
        }))

        return {
            userStats: {
                totalUsers: userStats.total_users || 0,
                totalTenants: userStats.total_tenants || 0,
                totalOwners: userStats.total_owners || 0,
            },
            propertyStats: {
                totalProperties,
                rentedProperties,
                pendingApprovals,
            },
            recentProperties,
        }
    } catch (error) {
        console.error('Error fetching admin dashboard stats:', error)
        throw error
    }
}

export async function getAllRentals() {
    try {
        const propertiesResponse = await getAllProperties()
        const properties = Array.isArray(propertiesResponse) ? propertiesResponse : propertiesResponse.results || []

        // Filter for rented properties (is_available === false)
        const rentedProperties = properties.filter((p) => p.is_available === false)

        return rentedProperties.map((property) => ({
            id: `RT-${property.id.toString().padStart(4, '0')}`,
            tenant: property.current_tenant_name || property.owner_name || 'Unknown',
            tenantPhone: property.current_tenant_phone || '+251 XXX XXX XXX',
            property: property.title || 'Untitled Property',
            location: property.location || 'Unknown Location',
            image: typeof property.main_image === 'string'
                ? property.main_image
                : (property.main_image?.image || property.images?.[0]?.image || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=200&q=80'),
            amount: `ETB ${property.price || '0'}`,
            amountPeriod: '/ month',
            status: 'Active', // Default status for rented properties
        }))
    } catch (error) {
        console.error('Error fetching rentals:', error)
        return []
    }
}

export async function getAdminNotifications(filters = {}) {
    try {
        const params = new URLSearchParams()

        if (filters.type && filters.type !== 'All') {
            params.append('type', filters.type)
        }
        if (filters.page) {
            params.append('page', filters.page)
        }
        if (filters.page_size) {
            params.append('page_size', filters.page_size)
        }

        const queryString = params.toString()
        const endpoint = `/api/accounts/admin/notifications/${queryString ? `?${queryString}` : ''}`
        const response = await request(endpoint, { method: 'GET' })

        // Handle both array and paginated responses
        const notifications = Array.isArray(response) ? response : response.results || response.notifications || []

        return notifications.map(normalizeAdminNotification)
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return []
    }
}

export async function getAdminNotificationDetail(notificationId) {
    try {
        const endpoint = `/api/accounts/admin/notifications/${notificationId}/`
        const response = await request(endpoint, { method: 'GET' })

        return normalizeAdminNotification(response)
    } catch (error) {
        console.error('Error fetching notification detail:', error)
        throw error
    }
}

export function markAdminNotificationViewed(notificationId) {
    const viewedIds = new Set(JSON.parse(localStorage.getItem('admin-viewed-notifications') || '[]'))
    viewedIds.add(String(notificationId))
    localStorage.setItem('admin-viewed-notifications', JSON.stringify([...viewedIds]))
}

function formatBirr(value) {
    if (value === null || value === undefined || value === '') return ''
    return String(value).replace(/\$/g, 'ETB ').replace(/\bUSD\b/g, 'ETB')
}

function normalizeAdminNotification(notification) {
    const createdAt = notification.created_at || ''
    const viewedIds = new Set(JSON.parse(localStorage.getItem('admin-viewed-notifications') || '[]'))
    const status = notification.status || ''
    return {
        ...notification,
        id: notification.id,
        title: notification.title || '',
        message: notification.message || notification.details || '',
        description: notification.description || notification.details || '',
        details: notification.details || notification.message || '',
        type: notification.type || '',
        status: status === 'New' && viewedIds.has(String(notification.id)) ? '' : status,
        read: notification.read || false,
        createdAt,
        date: notification.date || (createdAt ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''),
        time: notification.time || (createdAt ? new Date(createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''),
        sender: notification.sender || notification.sender_name || '',
        email: notification.email || notification.sender_email || '',
        phone: notification.phone || notification.sender_phone || '',
        tenantName: notification.tenantName || notification.tenant_name || '',
        tenantPhone: notification.tenantPhone || notification.tenant_phone || '',
        checkInDate: notification.checkInDate || notification.check_in_date || '',
        checkOutDate: notification.checkOutDate || notification.check_out_date || '',
        totalAmount: formatBirr(notification.totalAmount || notification.total_amount),
        paymentMethod: notification.paymentMethod || notification.payment_method || '',
        paymentStatus: notification.paymentStatus || notification.payment_status || '',
        propertyTitle: notification.propertyTitle || notification.property_title || '',
        propertyStatus: notification.propertyStatus || notification.property_status || '',
        propertyAddress: notification.propertyAddress || notification.property_address || '',
        owner: notification.owner || notification.property_owner || '',
        image: resolveMediaUrl(notification.image || notification.property_image),
        images: (notification.property_images || notification.images || [notification.image || notification.property_image])
            .filter(Boolean)
            .map(resolveMediaUrl),
        ownerPhone: notification.ownerPhone || notification.property_owner_phone || '',
        bedrooms: notification.bedrooms ?? notification.property_bedrooms ?? 0,
        bathrooms: notification.bathrooms ?? notification.property_bathrooms ?? 0,
        size: notification.size || notification.property_size || '',
        nightlyPrice: formatBirr(notification.nightlyPrice || notification.property_nightly_price),
        addedDate: notification.addedDate || notification.property_added_date || '',
        listingType: notification.listingType || notification.listing_type || '',
        carBrand: notification.carBrand || notification.car_brand || '',
        carModel: notification.carModel || notification.car_model || '',
        carYear: notification.carYear || notification.car_year || '',
        carMileage: notification.carMileage || notification.car_mileage || '',
        carFuelType: notification.carFuelType || notification.car_fuel_type || '',
        carSeatingCapacity: notification.carSeatingCapacity || notification.car_seating_capacity || '',
        relatedId: notification.related_id,
        actionUrl: notification.action_url,
    }
}

