import { Link } from 'react-router-dom'

export default function AuthLayout({ headline, lede, title, subtitle, children, foot }) {
  return (
    <div className="auth">
      <aside className="auth__aside">
        <div>
          <Link to="/login" className="brand">
            <span className="brand-mark" />
            crumb
          </Link>

          <div className="eyebrow">Your daily cooking companion</div>
          <h1 className="auth__headline">{headline}</h1>
          <p className="auth__lede">{lede}</p>

          <figure className="auth__photo">
            <img src="/images/hero-plate.jpg" alt="A plated home-cooked dish" />
          </figure>
        </div>

        <div className="auth__foot">Cook something lovely today.</div>
      </aside>

      <section className="auth__panel">
        <div className="auth__card">
          <h1>{title}</h1>
          <p className="auth__sub">{subtitle}</p>
          {children}
          {foot}
        </div>
      </section>
    </div>
  )
}
