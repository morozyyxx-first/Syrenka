const UPSTREAM_EVENTS_URL = 'https://dane.um.warszawa.pl/api/action/get_bmm_kalendarz_wydarzen'
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export default {
    async fetch(request) {
        if (request.method !== 'POST') {
            return Response.json(
                { error: 'Method not allowed.' },
                { status: 405, headers: { Allow: 'POST' } }
            )
        }

        const apiKey = process.env.API_KEY
        if (!apiKey) {
            return Response.json(
                { error: 'The event service is not configured.' },
                { status: 500 }
            )
        }

        const requestUrl = new URL(request.url)
        const from = requestUrl.searchParams.get('from')
        const to = requestUrl.searchParams.get('to')
        if (!from || !DATE_PATTERN.test(from) || !to || !DATE_PATTERN.test(to)) {
            return Response.json(
                { error: 'Valid from and to dates are required.' },
                { status: 400 }
            )
        }

        const upstreamUrl = new URL(UPSTREAM_EVENTS_URL)
        upstreamUrl.searchParams.set('from', from)
        upstreamUrl.searchParams.set('to', to)

        try {
            const upstreamResponse = await fetch(upstreamUrl, {
                method: 'POST',
                headers: {
                    Authorization: apiKey,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            })
            const body = await upstreamResponse.text()
            const headers = new Headers({
                'Cache-Control': 'no-store',
                'Content-Type': upstreamResponse.headers.get('content-type') || 'application/json',
            })

            return new Response(body || null, {
                status: upstreamResponse.status,
                headers,
            })
        } catch {
            return Response.json(
                { error: 'Could not fetch events from the event service.' },
                { status: 502, headers: { 'Cache-Control': 'no-store' } }
            )
        }
    },
}
