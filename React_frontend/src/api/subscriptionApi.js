import { api } from './authApi'

export const subscriptionApi = {
    // Get all active plans (both billing cycles / target types)
    getPlans: async () => {
        const response = await api.get('/api/subscriptions/plans/')
        return response.data ?? response.results ?? response
    },

    // Get current owner's active subscription (throws 404 when none exists)
    getMySubscription: async () => {
        const response = await api.get('/api/subscriptions/me/')
        return response.data ?? response
    },

    // Subscribe to a plan (initializes Chapa checkout)
    subscribe: async ({ planId, callbackUrl, returnUrl }) => {
        const response = await api.post('/api/subscriptions/subscribe/', {
            plan_id: planId,
            callback_url: callbackUrl,
            return_url: returnUrl,
        })
        return response
    },

    // Verify payment with the server and activate the subscription
    verifySubscription: async (transactionReference) => {
        const response = await api.post('/api/subscriptions/verify/', {
            transaction_reference: transactionReference,
        })
        return response
    },

    // Cancel active subscription at period end
    cancelSubscription: async () => {
        const response = await api.post('/api/subscriptions/cancel/')
        return response
    },
}