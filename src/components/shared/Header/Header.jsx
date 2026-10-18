import Logo from './assets/logo.svg'
import Heart_img from './assets/Heart.png'
import './Header_style.css'

function Header({ activeView, likedCount, onToggleView }) {
    return (
        <header>
            <div id="logo-div">
                <img src={Logo} alt="logo" />
                <h1>Syrenka</h1>
            </div>
            <button
                type="button"
                className={activeView === 'liked' ? 'is-active' : ''}
                aria-pressed={activeView === 'liked'}
                onClick={onToggleView}
            >
                <img src={Heart_img} alt="Polubione" className="header-btn-img" />
                <span>{activeView === 'liked' ? 'Odkrywaj' : 'Polubione'}</span>
                <span className="liked-count">{likedCount}</span>
            </button>
        </header>
    )
}

export default Header;