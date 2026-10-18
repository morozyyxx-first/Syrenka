const UPSTREAM_EVENTS_URL = 'https://dane.um.warszawa.pl/api/action/get_bmm_kalendarz_wydarzen'
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function sendJson(response, status, body, headers = {}) {
    response.statusCode = status
    response.setHeader('Content-Type', 'application/json')
    for (const [name, value] of Object.entries(headers)) {
        response.setHeader(name, value)
    }
    response.end(JSON.stringify(body))
}

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed.' }, { Allow: 'POST' })
        return
    }

    const apiKey = process.env.API_KEY
    if (!apiKey) {
        sendJson(response, 500, { error: 'The event service is not configured.' })
        return
    }

    const requestUrl = new URL(request.url, 'http://localhost')
    const from = requestUrl.searchParams.get('from')
    const to = requestUrl.searchParams.get('to')
    if (!from || !DATE_PATTERN.test(from) || !to || !DATE_PATTERN.test(to)) {
        sendJson(response, 400, { error: 'Valid from and to dates are required.' })
        return
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

        response.statusCode = upstreamResponse.status
        response.setHeader('Cache-Control', 'no-store')
        response.setHeader(
            'Content-Type',
            upstreamResponse.headers.get('content-type') || 'application/json'
        )
        response.end(body)
    } catch (error) {
        console.error('Event API upstream request failed:', error)
        sendJson(
            response,
            502,
            { error: 'Could not fetch events from the event service.' },
            { 'Cache-Control': 'no-store' }
        )
    }
}
