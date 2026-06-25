interface Props {
  onNavigate: (tab: string, prefill?: string) => void
}

const scenarios = [
  {
    icon: '✈️',
    title: 'Pack for a Trip',
    subtitle: 'Capsule wardrobe for your destination',
    prompt: 'Help me pack for a trip.',
  },
  {
    icon: '💼',
    title: 'Daily Casual / Work',
    subtitle: 'University, office, errands',
    prompt: 'Suggest a daily casual or work outfit.',
  },
  {
    icon: '🌙',
    title: 'Night Out / Event',
    subtitle: 'Dinner, party, special occasion',
    prompt: 'What should I wear for a night out?',
  },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 18) return 'Good Afternoon'
  return 'Good Evening'
}

export default function HomePage({ onNavigate }: Props) {
  return (
    <div className="home">
      {/* Top bar */}
      <div className="home-topbar">
        <span className="home-brand">⬡ WEARALL</span>
        <div className="home-avatar">S</div>
      </div>

      {/* Greeting */}
      <div className="home-greeting">
        <p className="home-greeting__sub">{getGreeting()}</p>
        <h1 className="home-greeting__name">Hello, Shaked</h1>
        <p className="home-greeting__tagline">Your wardrobe, curated.</p>
      </div>

      {/* Destination input */}
      <button className="home-destination" onClick={() => onNavigate('chat')}>
        <span className="home-destination__text">+ Where are you going today?</span>
        <span className="home-destination__arrow">→</span>
      </button>

      {/* Start with Mia */}
      <div className="home-section">
        <p className="home-section__label">START WITH MIA</p>
        <div className="home-cards">
          {scenarios.map(s => (
            <button
              key={s.title}
              className="scenario-card"
              onClick={() => onNavigate('chat', s.prompt)}
            >
              <span className="scenario-card__icon">{s.icon}</span>
              <div className="scenario-card__text">
                <p className="scenario-card__title">{s.title}</p>
                <p className="scenario-card__subtitle">{s.subtitle}</p>
              </div>
              <span className="scenario-card__chevron">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
