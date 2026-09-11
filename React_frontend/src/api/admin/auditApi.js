import { apiFetch } from '../apiClient'

async function request(endpoint, options = {}) {
    const response = await apiFetch(endpoint, options)

    const responseText = await response.text()
    let payload
    try {
        payload = responseText ? JSON.parse(responseText) : {}
    } catch {
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

export async function getAuditLogs(filters = {}) {
    const params = new URLSearchParams()

    const searchableParams = [
        'search',
        'category',
        'action',
        'severity',
        'result',
        'actor',
        'target_type',
        'target_id',
        'booking_ref',
        'payment_ref',
        'range',
        'date_from',
        'date_to',
        'page',
        'page_size',
    ]

    searchableParams.forEach((key) => {
        const value = filters[key]
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, value)
        }
    })

    const queryString = params.toString()
    try {
        const response = await request(`/api/audit/admin/audit-logs/${queryString ? `?${queryString}` : ''}`, {
            method: 'GET',
        })
        return {
            events: response.events || [],
            totalCount: response.total_count || 0,
            page: response.page || 1,
            pageSize: response.page_size || 20,
            totalPages: response.total_pages || 1,
            actions: response.actions || [],
        }
    } catch (error) {
        console.error('Error fetching audit logs:', error)
        throw error
    }
}

export async function getAuditLogDetail(eventId) {
    return request(`/api/audit/admin/audit-logs/${eventId}/`, {
        method: 'GET',
    })
}

export async function deleteAuditLog(eventId) {
    return request(`/api/audit/admin/audit-logs/${eventId}/`, {
        method: 'DELETE',
    })
}

export async function bulkDeleteAuditLogs(period) {
    return request('/api/audit/admin/audit-logs/delete/', {
        method: 'DELETE',
        body: JSON.stringify({ period }),
    })
}

export async function getAuditLogSummary() {
    try {
        return await request('/api/audit/admin/audit-logs/summary/', {
            method: 'GET',
        })
    } catch (error) {
        console.error('Error fetching audit log summary:', error)
        return {
            events_today: 0,
            failed_today: 0,
            security_warnings: 0,
            payment_errors: 0,
            admin_actions: 0,
            system_errors: 0,
        }
    }
}
