import { useEffect, useState } from 'react'
import Like_img from './assets/like.png'
import Dislike_img from './assets/dislike.png'
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

function Main({ activeView, likedEvents, onLikeEvent }) {
    const [events, setEvents] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [likedIndex, setLikedIndex] = useState(0)
    const [isExpanded, setIsExpanded] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let isActive = true

        FetchData()
            .then((data) => {
                if (isActive) {
                    setEvents(data)
                }
            })
            .catch((fetchError) => {
                if (isActive) {
                    setError(fetchError.message || 'Не удалось загрузить события.')
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
    const visibleEvents = isLikedView ? likedEvents : events
    const visibleIndex = isLikedView ? likedIndex : currentIndex
    const currentEvent = visibleEvents[visibleIndex]

    function showNextEvent() {
        setIsExpanded(false)
        if (isLikedView) {
            setLikedIndex((index) => (index + 1) % likedEvents.length)
        } else {
            setCurrentIndex((index) => index + 1)
        }
    }

    function showPreviousLikedEvent() {
        setIsExpanded(false)
        setLikedIndex((index) => (index - 1 + likedEvents.length) % likedEvents.length)
    }

    function likeCurrentEvent() {
        onLikeEvent(currentEvent)
        showNextEvent()
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

    return (
        <main>
            <div id="cards-div">
                {isLoading ? (
                    <p className="cards-message">Загружаем события...</p>
                ) : error ? (
                    <p className="cards-message" role="alert">{error}</p>
                ) : isLikedView && likedEvents.length === 0 ? (
                    <p className="cards-message">Пока нет понравившихся событий. Лайкните событие, чтобы сохранить его здесь.</p>
                ) : currentEvent ? (
                    <article className="event-card" key={`${activeView}-${visibleIndex}`}>
                        {currentEvent.image && (
                            <img
                                className="event-card-image"
                                src={currentEvent.image}
                                alt={currentEvent.title || 'Изображение события'}
                                referrerPolicy="no-referrer"
                                loading="eager"
                                onError={(event) => {
                                    event.currentTarget.classList.add('image-load-failed')
                                }}
                            />
                        )}
                        <div className={`event-card-content${isExpanded ? ' is-expanded' : ''}`}>
                            <div className="event-card-summary">
                                {currentEvent.category && (
                                    <span className="event-category">{currentEvent.category}</span>
                                )}
                                <h1>{currentEvent.title || 'Событие без названия'}</h1>
                                {currentEvent.text && (
                                    <div className="event-description">{renderRichText(currentEvent.text)}</div>
                                )}
                                <button
                                    className="see-more-button"
                                    type="button"
                                    aria-expanded={isExpanded}
                                    onClick={() => setIsExpanded((expanded) => !expanded)}
                                >
                                    {isExpanded ? 'Show less' : 'See more...'}
                                </button>
                            </div>
                            {isExpanded && (
                                <div className="event-details" key="event-details">
                                    {renderDetail('Category', currentEvent.category)}
                                    {renderDetail('Location', currentEvent.localization)}
                                    {renderDetail('Address', currentEvent.address)}
                                    {renderDetail('From', currentEvent.from)}
                                    {renderDetail('To', currentEvent.to)}
                                    {currentEvent.text && (
                                        <div className="event-detail">
                                            <strong>About:</strong>
                                            <div className="event-full-description">
                                                {renderRichText(currentEvent.text)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </article>
                ) : (
                    <p className="cards-message">Больше событий нет.</p>
                )}
            </div>
            <div id="buttons-div">
                <button
                    id="red-btn"
                    type="button"
                    aria-label={isLikedView ? "Previous liked event" : "Skip event"}
                    disabled={!currentEvent}
                    onClick={isLikedView ? showPreviousLikedEvent : showNextEvent}
                >
                    {isLikedView ? (
                        <span className="liked-navigation-label" aria-hidden="true">←</span>
                    ) : (
                        <img src={Dislike_img} alt="no"/>
                    )}
                </button>
                <button
                    id="green-btn"
                    type="button"
                    aria-label={isLikedView ? "Next liked event" : "Like event"}
                    disabled={!currentEvent}
                    onClick={isLikedView ? showNextEvent : likeCurrentEvent}
                >
                    {isLikedView ? (
                        <span className="liked-navigation-label" aria-hidden="true">→</span>
                    ) : (
                        <img src={Like_img} alt="yes"/>
                    )}
                </button>
            </div>
        </main>
    )
}

export default Main;
