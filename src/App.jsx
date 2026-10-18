import { useState } from 'react'
import Header from './components/shared/Header/Header.jsx'
import Main from './components/shared/Main/Main.jsx'
import SirenLeft from './components/shared/Main/assets/figma/siren-left.svg'
import SirenRight from './components/shared/Main/assets/figma/siren-right.svg'

function App() {
    const [activeView, setActiveView] = useState('discover')
    const [likedEvents, setLikedEvents] = useState([])

    function addLikedEvent(event) {
        setLikedEvents((currentLiked) => {
            const alreadyLiked = currentLiked.some((liked) =>
                liked.url && event.url
                    ? liked.url === event.url
                    : liked.title === event.title && liked.from === event.from
            )
            return alreadyLiked ? currentLiked : [...currentLiked, event]
        })
    }

    return (
        <>
            <div className="siren-background" aria-hidden="true">
                <img className="siren-background-left" src={SirenLeft} alt="" />
                <img className="siren-background-right" src={SirenRight} alt="" />
            </div>
            <Header
                activeView={activeView}
                likedCount={likedEvents.length}
                onToggleView={() =>
                    setActiveView((view) => view === 'discover' ? 'liked' : 'discover')
                }
            />
            <Main
                activeView={activeView}
                likedEvents={likedEvents}
                onLikeEvent={addLikedEvent}
            />
        </>
    )
}

export default App
