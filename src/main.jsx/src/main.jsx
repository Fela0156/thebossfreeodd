import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'
import './style.css'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://dqdveimjjvapuwcoejhn.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_PUBLISHABLE_KEY'
)

function App() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [predictions, setPredictions] = useState([])
  const [profile, setProfile] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )

    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) loadDashboard()
  }, [session])

  async function loadDashboard() {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    setProfile(userProfile)

    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('status', 'published')
      .order('match_time', { ascending: true })

    if (error) setMessage(error.message)
    else setPredictions(data || [])
  }

  async function signIn(event) {
    event.preventDefault()
    setMessage('Signing in...')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setMessage(error ? error.message : '')
  }

  async function signUp(event) {
    event.preventDefault()
    setMessage('Creating your account...')

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    setMessage(
      error
        ? error.message
        : 'Account created. Please check your email to confirm your account.'
    )
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
    setPredictions([])
  }

  if (!session) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <h1>BOSSFREE<span>ODD</span></h1>
          <p className="tagline">FOOTBALL PREDICTIONS</p>
          <h2>Welcome</h2>
          <p>Sign in or create an account to continue.</p>

          <form onSubmit={signIn}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="submit">Sign In</button>
            <button type="button" className="secondary" onClick={signUp}>
              Create Account
            </button>
          </form>

          {message && <p className="message">{message}</p>}
        </div>
      </main>
    )
  }

  return (
    <main className="dashboard">
      <header>
        <h1>BOSSFREE<span>ODD</span></h1>
        <button className="secondary" onClick={signOut}>Sign Out</button>
      </header>

      <section className="welcome">
        <p className="tagline">YOUR FOOTBALL PREDICTIONS HUB</p>
        <h2>Welcome to BOSSFREEODD</h2>
        <p>{session.user.email}</p>
        <p>Membership: {profile?.role === 'admin' ? 'Administrator' : 'Member'}</p>
      </section>

      <h2>Latest Predictions</h2>

      {predictions.length === 0 ? (
        <p>No published predictions yet.</p>
      ) : (
        <div className="prediction-list">
          {predictions.map(item => (
            <article className="prediction-card" key={item.id}>
              <span className="tagline">{item.competition}</span>
              <h3>{item.home_team} vs {item.away_team}</h3>
              <p>Prediction: <strong>{item.prediction}</strong></p>
              <p>Access: {item.access_level.toUpperCase()}</p>
              <p>Result: {item.result}</p>
            </article>
          ))}
        </div>
      )}

      {message && <p className="message">{message}</p>}
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
