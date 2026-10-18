import { useEffect, useRef, useState } from 'react'
import CalendarIcon from './assets/figma/calendar-days.svg'
import LikeIcon from './assets/figma/like.svg'
import DislikeBackground from './assets/figma/dislike-background.svg'
import DislikeLeft from './assets/figma/dislike-left.svg'
import DislikeRight from './assets/figma/dislike-right.svg'
import MoreInfoIcon from './assets/figma/more-info.svg'
import Preferences from '../Preferences/Preferences.jsx'
import { FetchData } from './functions.jsx'
import './Main_style.css'

const ALLOWED_HTML_TAGS = new Set([
    'a', 'b', 'blockquote', 'br', 'code', 'div', 'em', 'h2', 'h3', 'h4',
    'i', 'li', 'ol', 'p', 'span', 'strong', 'u', 'ul'
])

function renderHtmlNode(node, key) {
    if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return null
    }

    const tagName = node.tagName.toLowerCase()
    if (['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math'].includes(tagName)) {
        return null
    }

    if (tagName === 'br') {
        return <br key={key} />
    }

    const children = Array.from(node.childNodes).map((child, index) =>
        renderHtmlNode(child, `${key}-${index}`)
    )

    if (!ALLOWED_HTML_TAGS.has(tagName)) {
        return children
    }

    if (tagName === 'a') {
        const href = node.getAttribute('href')
        let safeHref

        try {
            const parsedUrl = new URL(href, window.location.origin)
            if (['http:', 'https:', 'mailto:'].includes(parsedUrl.protocol)) {
                safeHref = parsedUrl.href
            }
        } catch {
            safeHref = undefined
        }

        return (
            <a
                key={key}
                href={safeHref}
                target={safeHref ? '_blank' : undefined}
                rel={safeHref ? 'noreferrer' : undefined}
            >
                {children}
            </a>
        )
    }

    const Tag = tagName
    return <Tag key={key}>{children}</Tag>
}

function renderRichText(html) {
    if (!html) {
        return null
    }

    const parsedHtml = new DOMParser().parseFromString(html, 'text/html')
    return Array.from(parsedHtml.body.childNodes).map((node, index) =>
        renderHtmlNode(node, `text-${index}`)
    )
}

function parseEventDate(value) {
    if (typeof value !== 'string') {
        return new Date(value)
    }

    const normalizedValue = value.trim().replace(
        /([+-]\d{2})(\d{2})?$/,
        (offset, hours, minutes) => /[T ]\d{2}:\d{2}/.test(value)
            ? `${hours}:${minutes ?? '00'}`
            : offset
    )

    return new Date(normalizedValue)
}

function eventDateKey(value) {
    if (!value) {
        return null
    }

    const date = parseEventDate(value)
    if (Number.isNaN(date.getTime())) {
        return null
    }

    return new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Europe/Warsaw'
    }).format(date)
}

function formatEventDate(fromValue, toValue) {
    if (!fromValue) {
        return null
    }

    const from = parseEventDate(fromValue)
    const to = toValue ? parseEventDate(toValue) : null
    if (Number.isNaN(from.getTime())) {
        return fromValue
    }

    const dateParts = new Intl.DateTimeFormat('pl-PL', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        timeZone: 'Europe/Warsaw'
    }).formatToParts(from)
    const weekday = dateParts.find(({ type }) => type === 'weekday')?.value
    const day = dateParts.find(({ type }) => type === 'day')?.value
    const month = dateParts.find(({ type }) => type === 'month')?.value
    const capitalizedWeekday = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}`
    const cleanMonth = month.replace(/\.$/, '')
    const capitalizedMonth = `${cleanMonth.charAt(0).toUpperCase()}${cleanMonth.slice(1)}`
    const dateLabel = `${capitalizedWeekday}, ${day} ${capitalizedMonth}`
    const timeFormatter = new Intl.DateTimeFormat('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZone: 'Europe/Warsaw'
    })
    const fromTime = timeFormatter.format(from)

    if (!to || Number.isNaN(to.getTime())) {
        return `${dateLabel} · ${fromTime}`
    }

    const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Europe/Warsaw'
    })
    const sameDay = dateKeyFormatter.format(from) === dateKeyFormatter.format(to)

    if (sameDay) {
        return `${dateLabel} · ${fromTime} - ${timeFormatter.format(to)}`
    }

    return `${dateLabel} · ${fromTime} – ${timeFormatter.format(to)}`
}

function distanceInKilometers(from, event) {
    if (!from || !Number.isFinite(event.latitude) || !Number.isFinite(event.longitude)) {
        return null
    }

    const toRadians = (value) => value * Math.PI / 180
    const earthRadius = 6371
    const latitudeDelta = toRadians(event.latitude - from.latitude)
    const longitudeDelta = toRadians(event.longitude - from.longitude)
    const latitude = toRadians(from.latitude)
    const eventLatitude = toRadians(event.latitude)
    const haversine = Math.sin(latitudeDelta / 2) ** 2
        + Math.sin(longitudeDelta / 2) ** 2 * Math.cos(latitude) * Math.cos(eventLatitude)

    return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

function renderDetail(label, value) {
    if (!value) {
        return null
    }

    return (
        <p className="event-detail" key={label}>
            <strong>{label}:</strong> {value}
        </p>
    )
}

function formatDistance(distance) {
    return distance < 1 ? `${Math.round(distance * 1000)} M` : `${distance.toFixed(1)} KM`
}

function hasEventPhoto(event) {
    return typeof event.image === 'string' && event.image.trim().length > 0
}

function EventCard({ event, distance, isExpanded, swipeStyle, swipeHandlers, onImageLoadError }) {
    const location = event.localization || event.address

    return (
        <article
            className="event-card"
            style={swipeStyle}
            {...swipeHandlers}
        >
            {event.image ? (
                <img
                    className="event-card-image"
                    src={event.image}
                    alt={event.title || 'Obraz wydarzenia'}
                    draggable="false"
                    referrerPolicy="no-referrer"
                    loading="eager"
                    onError={() => onImageLoadError?.(event.image)}
                />
            ) : <div className="event-card-image-placeholder" aria-hidden="true" />}
            <div className={`event-card-content${isExpanded ? ' is-expanded' : ''}`}>
                <div className="event-card-summary">
                    {(location || event.category) && (
                        <div className="event-card-topline">
                            {location && <span className="event-location-label">{location}</span>}
                            {event.category && <span className="event-card-category">{event.category}</span>}
                        </div>
                    )}
                    <h1>{event.title || 'Wydarzenie bez nazwy'}</h1>
                </div>
                {isExpanded && (
                    <div className="event-details" key="event-details">
                        {renderDetail('Lokalizacja', event.localization)}
                        {renderDetail('Adres', event.address)}
                        {event.text && (
                            <div className="event-detail">
                                <strong>Opis:</strong>
                                <div className="event-full-description">
                                    {renderRichText(event.text)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <div className="event-card-footer">
                    {event.from && (
                        <div className="event-date-row">
                            <img src={CalendarIcon} alt="" aria-hidden="true" />
                            <span>{formatEventDate(event.from, event.to)}</span>
                        </div>
                    )}
                    {distance !== null && <span className="event-distance">{formatDistance(distance)}</span>}
                </div>
            </div>
        </article>
    )
}

function Main({ activeView, likedEvents, onLikeEvent }) {
    const [events, setEvents] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedLikedEvent, setSelectedLikedEvent] = useState(null)
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [userLocation, setUserLocation] = useState(null)
    const [isLocationResolved, setIsLocationResolved] = useState(false)
    const [swipeOffset, setSwipeOffset] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [isCardTransitioning, setIsCardTransitioning] = useState(false)
    const [isPromotingShadow, setIsPromotingShadow] = useState(false)
    const [failedImageUrls, setFailedImageUrls] = useState(() => new Set())
    const cardsContainerRef = useRef(null)
    const gestureRef = useRef(null)
    const transitionLockRef = useRef(false)
    const transitionTimerRef = useRef(null)

    useEffect(() => {
        if (!navigator.geolocation) {
            setIsLocationResolved(true)
            return
        }

        navigator.geolocation.getCurrentPosition(({ coords }) => {
            setUserLocation({
                latitude: coords.latitude,
                longitude: coords.longitude
            })
            setIsLocationResolved(true)
        }, () => {
            setIsLocationResolved(true)
        }, { timeout: 10000, maximumAge: 300000 })
    }, [])

    useEffect(() => {
        let isActive = true

        FetchData()
            .then((data) => {
                if (isActive) {
                    setEvents(data)
                }
            })
            .catch(() => {
                if (isActive) {
                    setError('Nie udało się załadować wydarzeń.')
                }
            })
            .finally(() => {
                if (isActive) {
                    setIsLoading(false)
                }
            })

        return () => {
            isActive = false
        }
    }, [])

    const isLikedView = activeView === 'liked'
    const isPreferencesView = activeView === 'preferences'
    const locatedEvents = userLocation
        ? events.filter((event) => hasEventPhoto(event) && !failedImageUrls.has(event.image) && distanceInKilometers(userLocation, event) !== null)
        : []
    const currentEvent = locatedEvents[currentIndex]
    const photoLikedEvents = likedEvents.filter((event) => hasEventPhoto(event) && !failedImageUrls.has(event.image))
    const likedEventGroups = Object.values(photoLikedEvents.reduce((groups, event) => {
        const dateKey = eventDateKey(event.from) ?? 'undated'
        if (!groups[dateKey]) {
            groups[dateKey] = {
                dateKey,
                dateLabel: formatEventDate(event.from, event.to)?.split(' · ')[0] ?? 'Data niepodana',
                events: []
            }
        }
        groups[dateKey].events.push(event)
        return groups
    }, {})).sort((first, second) => first.dateKey.localeCompare(second.dateKey))

    useEffect(() => () => clearTimeout(transitionTimerRef.current), [])

    function handleImageLoadError(imageUrl) {
        setFailedImageUrls((current) => {
            if (current.has(imageUrl)) {
                return current
            }

            return new Set(current).add(imageUrl)
        })
        setSelectedLikedEvent((current) => current?.image === imageUrl ? null : current)
        setIsDetailsExpanded(false)
    }

    function showNextEvent() {
        setIsDetailsExpanded(false)
        setCurrentIndex((index) => index + 1)
    }

    function finishSwipe(direction) {
        if (!currentEvent || transitionLockRef.current) {
            return
        }

        transitionLockRef.current = true
        const cardWidth = cardsContainerRef.current?.getBoundingClientRect().width || window.innerWidth
        setIsDragging(false)
        setIsCardTransitioning(true)
        setIsPromotingShadow(true)
        setSwipeOffset(direction * (cardWidth + window.innerWidth))

        if (direction > 0) {
            onLikeEvent(currentEvent)
        }

        transitionTimerRef.current = setTimeout(() => {
            showNextEvent()
            setSwipeOffset(0)
            setIsCardTransitioning(false)
            setIsPromotingShadow(false)
            transitionLockRef.current = false
        }, 420)
    }

    function handlePointerDown(event) {
        if (event.pointerType === 'mouse' && event.button !== 0) {
            return
        }
        if (event.target.closest('button, a, input, textarea, select')) {
            return
        }

        gestureRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            cardWidth: cardsContainerRef.current?.getBoundingClientRect().width || window.innerWidth
        }
        setIsDragging(true)
        event.currentTarget.setPointerCapture(event.pointerId)
    }

    function handlePointerMove(event) {
        const gesture = gestureRef.current
        if (!gesture || gesture.pointerId !== event.pointerId || isCardTransitioning) {
            return
        }

        setSwipeOffset(event.clientX - gesture.startX)
    }

    function handlePointerUp(event) {
        const gesture = gestureRef.current
        if (!gesture || gesture.pointerId !== event.pointerId) {
            return
        }

        const deltaX = event.clientX - gesture.startX
        const deltaY = event.clientY - gesture.startY
        const threshold = Math.max(90, gesture.cardWidth * 0.22)
        gestureRef.current = null

        if (Math.abs(deltaX) >= threshold && Math.abs(deltaX) > Math.abs(deltaY)) {
            finishSwipe(deltaX > 0 ? 1 : -1)
            return
        }

        setIsDragging(false)
        setSwipeOffset(0)
    }

    function handlePointerCancel(event) {
        if (gestureRef.current?.pointerId === event.pointerId) {
            gestureRef.current = null
            setIsDragging(false)
            setSwipeOffset(0)
        }
    }

    const activeSwipeHandlers = !isLikedView && currentEvent ? {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
        onPointerCancel: handlePointerCancel
    } : undefined
    const activeCardWidth = cardsContainerRef.current?.getBoundingClientRect().width || 560
    const currentCardStyle = !isLikedView && currentEvent ? {
        transform: `translate3d(${swipeOffset}px, 0, 0) rotate(${(swipeOffset / activeCardWidth) * 12}deg)`,
        opacity: Math.max(0.38, 1 - Math.abs(swipeOffset) / (activeCardWidth * 1.35)),
        transition: isDragging ? 'none' : undefined
    } : undefined

    return (
        <main>
            <div
                id="cards-div"
                ref={cardsContainerRef}
                className={isLikedView ? 'liked-events-container' : isPreferencesView ? 'preferences-container' : undefined}
            >
                {isPreferencesView ? (
                    <Preferences />
                ) : isLoading || (!isLikedView && !isLocationResolved) ? (
                    <p className="cards-message">Ładowanie wydarzeń...</p>
                ) : error ? (
                    <p className="cards-message" role="alert">{error}</p>
                ) : isLikedView && photoLikedEvents.length === 0 ? (
                    <p className="cards-message">Nie ma jeszcze polubionych wydarzeń. Polub wydarzenie, aby zapisać je tutaj.</p>
                ) : isLikedView && selectedLikedEvent ? (
                    <EventCard
                        key={`liked-${selectedLikedEvent.title}-${selectedLikedEvent.from}`}
                        event={selectedLikedEvent}
                        distance={distanceInKilometers(userLocation, selectedLikedEvent)}
                        isExpanded
                        onImageLoadError={handleImageLoadError}
                    />
                ) : isLikedView ? (
                    <div className="liked-events-list">
                        {likedEventGroups.map((group) => (
                            <section className="liked-date-group" key={group.dateKey}>
                                <h2>{group.dateLabel}</h2>
                                <ul>
                                    {group.events.map((event, index) => {
                                        const formattedDate = formatEventDate(event.from, event.to)
                                        const eventTime = formattedDate?.split(' · ').slice(1).join(' · ') || formattedDate
                                        const distance = distanceInKilometers(userLocation, event)
                                        const eventPlace = [event.localization, event.address].filter(Boolean).join(', ')

                                        return (
                                            <li className="liked-event-item" key={`${event.title}-${event.from}-${index}`}>
                                                <button
                                                    className="liked-event-button"
                                                    type="button"
                                                    onClick={() => {
                                                        setIsDetailsExpanded(true)
                                                        setSelectedLikedEvent(event)
                                                    }}
                                                    aria-label={`Pokaż szczegóły: ${event.title || 'Wydarzenie bez nazwy'}`}
                                                >
                                                    <span className="liked-event-heading">
                                                        <span className="liked-event-title">{event.title || 'Wydarzenie bez nazwy'}</span>
                                                        {event.category && <span className="liked-event-category">{event.category}</span>}
                                                    </span>
                                                    {eventTime && <span className="liked-event-time">{eventTime}</span>}
                                                    {(eventPlace || distance !== null) && (
                                                        <span className="liked-event-location">
                                                            📍 {eventPlace}{distance !== null && `${eventPlace ? ' · ' : ''}${distance.toFixed(1)} km`}
                                                        </span>
                                                    )}
                                                </button>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </section>
                        ))}
                    </div>
                ) : currentEvent ? (
                    <>
                        <div
                            className={`event-card-shadow${isPromotingShadow ? ' is-promoting' : ''}`}
                            aria-hidden="true"
                        />
                        <EventCard
                            key={`discover-${currentIndex}`}
                            event={currentEvent}
                            distance={distanceInKilometers(userLocation, currentEvent)}
                            isExpanded={isDetailsExpanded}
                            swipeStyle={currentCardStyle}
                            swipeHandlers={activeSwipeHandlers}
                            onImageLoadError={handleImageLoadError}
                        />
                    </>
                ) : !isLikedView && !userLocation ? (
                    <p className="cards-message">Włącz dostęp do lokalizacji, aby zobaczyć wydarzenia z podaną odległością.</p>
                ) : !isLikedView && events.length > 0 && !events.some(hasEventPhoto) ? (
                    <p className="cards-message">Brak wydarzeń ze zdjęciami.</p>
                ) : !isLikedView && events.some(hasEventPhoto) && locatedEvents.length === 0 ? (
                    <p className="cards-message">Brak wydarzeń z lokalizacją, dla których można obliczyć odległość.</p>
                ) : (
                    <p className="cards-message">Nie ma więcej wydarzeń.</p>
                )}
            </div>
            {!isPreferencesView && (!isLikedView || selectedLikedEvent) && (
                <div className="card-actions">
                    {isLikedView ? (
                        <button
                            className="liked-view-back-button"
                            type="button"
                            onClick={() => {
                                setIsDetailsExpanded(false)
                                setSelectedLikedEvent(null)
                            }}
                        >
                            ← Wróć do listy
                        </button>
                    ) : (
                        <>
                            <button
                                className="card-action-button dislike-action"
                                type="button"
                                aria-label="Pomiń wydarzenie"
                                disabled={!currentEvent || isCardTransitioning}
                                onClick={() => finishSwipe(-1)}
                            >
                                <img className="dislike-background" src={DislikeBackground} alt="" aria-hidden="true" />
                                <img className="dislike-left" src={DislikeLeft} alt="" aria-hidden="true" />
                                <img className="dislike-right" src={DislikeRight} alt="" aria-hidden="true" />
                            </button>
                            <button
                                className="card-action-button like-action"
                                type="button"
                                aria-label="Polub wydarzenie"
                                disabled={!currentEvent || isCardTransitioning}
                                onClick={() => finishSwipe(1)}
                            >
                                <img src={LikeIcon} alt="" aria-hidden="true" />
                            </button>
                            <button
                                className="card-action-button more-info-action"
                                type="button"
                                aria-label={isDetailsExpanded ? 'Ukryj szczegóły wydarzenia' : 'Pokaż szczegóły wydarzenia'}
                                aria-expanded={isDetailsExpanded}
                                disabled={!currentEvent || isCardTransitioning}
                                onClick={() => setIsDetailsExpanded((expanded) => !expanded)}
                            >
                                <img src={MoreInfoIcon} alt="" aria-hidden="true" />
                            </button>
                        </>
                    )}
                </div>
            )}
        </main>
    )
}

export default Main;
