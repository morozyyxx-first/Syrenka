import SirenMark from './assets/figma/siren-mark.svg'
import HeartTab from './assets/figma/heart-tab.svg'
import SearchTab from './assets/figma/search-tab.svg'
import SettingsTab from './assets/figma/settings-tab.svg'
import './Header_style.css'

const tabs = [
    { id: 'discover', label: 'Odkryj', icon: SearchTab, iconClass: 'discover-tab-icon' },
    { id: 'liked', label: 'Polubione', icon: HeartTab, iconClass: 'liked-tab-icon' },
    { id: 'preferences', label: 'Ustawienia', icon: SettingsTab, iconClass: 'settings-tab-icon' }
]

function Header({ activeView, onChangeView }) {
    return (
        <header className="app-header">
            <img className="app-header-mark" src={SirenMark} alt="Syrenka" />
            <nav className="header-tabs" aria-label="Główna nawigacja">
                {tabs.map(({ id, label, icon, iconClass }) => {
                    const isActive = activeView === id

                    return (
                        <button
                            key={id}
                            type="button"
                            className={`header-tab${isActive ? ' is-active' : ''}${id === 'liked' ? ' liked-tab' : ''}${id === 'preferences' ? ' preferences-tab' : ''}`}
                            aria-label={label}
                            aria-current={isActive ? 'page' : undefined}
                            onClick={() => onChangeView(id)}
                        >
                            {isActive && <span className="header-tab-label">{label}</span>}
                            {id === 'discover' && !isActive ? (
                                <span className={`header-tab-icon ${iconClass} is-cream-icon`} aria-hidden="true" />
                            ) : (
                                <img className={`header-tab-icon ${iconClass}`} src={icon} alt="" aria-hidden="true" />
                            )}
                        </button>
                    )
                })}
            </nav>
        </header>
    )
}

export default Header
