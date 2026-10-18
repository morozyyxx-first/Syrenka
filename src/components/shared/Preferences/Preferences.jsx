import { useState } from 'react'
import './Preferences_style.css'

const ageGroups = ['Dzieci', 'Nastolatkowie', 'Dorośli', 'Osoby Starsze']

function Preferences() {
    const [selectedGroups, setSelectedGroups] = useState({})

    function toggleAgeGroup(ageGroup) {
        setSelectedGroups((current) => ({ ...current, [ageGroup]: !current[ageGroup] }))
    }

    return (
        <section className="preferences-panel" aria-labelledby="preferences-title">
            <header className="preferences-heading">
                <p className="preferences-eyebrow">Twój profil</p>
                <h1 id="preferences-title">Ustawienia</h1>
                <p>Zaznacz grupy wiekowe wydarzeń, które chcesz widzieć.</p>
            </header>
            <p className="preferences-preview-note">Podgląd — te ustawienia nie filtrują jeszcze wydarzeń.</p>
            <fieldset className="preferences-age-groups">
                <legend>Grupy wiekowe</legend>
                <div className="age-group-options">
                    {ageGroups.map((ageGroup) => (
                        <label className="age-group-option" key={ageGroup}>
                            <input
                                type="checkbox"
                                checked={Boolean(selectedGroups[ageGroup])}
                                onChange={() => toggleAgeGroup(ageGroup)}
                            />
                            <span>{ageGroup}</span>
                        </label>
                    ))}
                </div>
            </fieldset>
        </section>
    )
}

export default Preferences
