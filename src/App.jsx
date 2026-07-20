import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './supabaseClient'
import abigail from './assets/portraits/abigail.png'
import alex from './assets/portraits/alex.png'
import elliott from './assets/portraits/elliott.png'
import emily from './assets/portraits/emily.png'
import haley from './assets/portraits/haley.png'
import harvey from './assets/portraits/harvey.png'
import leah from './assets/portraits/leah.png'
import maru from './assets/portraits/maru.png'
import penny from './assets/portraits/penny.png'
import sam from './assets/portraits/sam.png'
import sebastian from './assets/portraits/sebastian.png'
import shane from './assets/portraits/shane.png'
import './App.css'

const STORAGE_KEY = 'stardew-crewmates'
const TABLE_NAME = 'crewmates'

const villagers = [
  {
    key: 'abigail',
    name: 'Abigail',
    portrait: abigail,
    gift: 'Amethyst',
    detail: 'Brave, curious, and always ready for a mine run.',
  },
  {
    key: 'emily',
    name: 'Emily',
    portrait: emily,
    gift: 'Cloth',
    detail: 'Creative, upbeat, and great at keeping team morale high.',
  },
  {
    key: 'haley',
    name: 'Haley',
    portrait: haley,
    gift: 'Sunflower',
    detail: 'Stylish and sharp-eyed, perfect for scouting and photography.',
  },
  {
    key: 'leah',
    name: 'Leah',
    portrait: leah,
    gift: 'Goat Cheese',
    detail: 'Practical, outdoorsy, and happiest near the forest.',
  },
  {
    key: 'maru',
    name: 'Maru',
    portrait: maru,
    gift: 'Battery Pack',
    detail: 'Inventive and precise, the crew engineer of Pelican Town.',
  },
  {
    key: 'penny',
    name: 'Penny',
    portrait: penny,
    gift: 'Melon',
    detail: 'Patient and thoughtful, with a planner brain for long seasons.',
  },
  {
    key: 'alex',
    name: 'Alex',
    portrait: alex,
    gift: 'Complete Breakfast',
    detail: 'Confident, energetic, and built for heavy farm chores.',
  },
  {
    key: 'elliott',
    name: 'Elliott',
    portrait: elliott,
    gift: 'Lobster',
    detail: 'Dramatic in the best way, ideal for coastal errands.',
  },
  {
    key: 'harvey',
    name: 'Harvey',
    portrait: harvey,
    gift: 'Coffee',
    detail: 'Careful and reliable, the medic every crew needs.',
  },
  {
    key: 'sam',
    name: 'Sam',
    portrait: sam,
    gift: 'Pizza',
    detail: 'Fast-moving, cheerful, and perfect for a chaotic task list.',
  },
  {
    key: 'sebastian',
    name: 'Sebastian',
    portrait: sebastian,
    gift: 'Frozen Tear',
    detail: 'Quiet, focused, and a natural night-shift strategist.',
  },
  {
    key: 'shane',
    name: 'Shane',
    portrait: shane,
    gift: 'Pepper Poppers',
    detail: 'Blunt but loyal, with unmatched chicken-coop instincts.',
  },
]

const seasons = ['Spring', 'Summer', 'Fall', 'Winter']
const skills = ['Farming', 'Mining', 'Foraging', 'Fishing', 'Combat']
const categories = {
  'Farm Crew': {
    roles: ['Crop Lead', 'Rancher', 'Forager'],
    seasons: ['Spring', 'Summer', 'Fall'],
    skills: ['Farming', 'Foraging'],
  },
  'Adventure Crew': {
    roles: ['Miner', 'Fisher', 'Forager'],
    seasons: ['Summer', 'Fall', 'Winter'],
    skills: ['Mining', 'Combat', 'Fishing'],
  },
  'Town Crew': {
    roles: ['Town Runner', 'Fisher', 'Rancher'],
    seasons: ['Spring', 'Summer', 'Winter'],
    skills: ['Foraging', 'Fishing', 'Farming'],
  },
}
const categoryNames = Object.keys(categories)

const emptyCrewmate = {
  name: '',
  category: 'Farm Crew',
  villager: 'abigail',
  role: 'Forager',
  season: 'Spring',
  skill: 'Farming',
  motto: '',
}

function getStoredCrewmates() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

function setStoredCrewmates(crewmates) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(crewmates))
}

function normalizeCrewmate(crewmate) {
  return {
    ...crewmate,
    category: crewmate.category || 'Farm Crew',
    villager: crewmate.villager || crewmate.portrait_key || 'abigail',
    motto: crewmate.motto || '',
  }
}

function findVillager(key) {
  return villagers.find((villager) => villager.key === key) || villagers[0]
}

function getCategoryOptions(category) {
  return categories[category] || categories['Farm Crew']
}

function getFormValues(initialValues) {
  const values = { ...emptyCrewmate, ...initialValues }
  const options = getCategoryOptions(values.category)

  return {
    ...values,
    role: options.roles.includes(values.role) ? values.role : options.roles[0],
    season: options.seasons.includes(values.season) ? values.season : options.seasons[0],
    skill: options.skills.includes(values.skill) ? values.skill : options.skills[0],
  }
}

function getCrewStats(crewmates) {
  const total = crewmates.length

  if (total === 0) {
    return {
      total,
      readiness: 0,
      readinessLevel: 'starter',
      readinessLabel: 'Starter Crew',
      topCategory: 'None yet',
      farmPercent: 0,
      seasonCoverage: 0,
      skillCoverage: 0,
    }
  }

  const topCategory =
    Object.entries(
      crewmates.reduce((counts, crewmate) => {
        const category = crewmate.category || 'Farm Crew'
        counts[category] = (counts[category] || 0) + 1
        return counts
      }, {}),
    ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None yet'

  const farmCrewCount = crewmates.filter((crewmate) => crewmate.category === 'Farm Crew').length
  const uniqueSeasons = new Set(crewmates.map((crewmate) => crewmate.season)).size
  const uniqueSkills = new Set(crewmates.map((crewmate) => crewmate.skill)).size
  const categoryVariety = new Set(crewmates.map((crewmate) => crewmate.category)).size

  const readiness = Math.round(
    Math.min(total / 6, 1) * 30 +
      (uniqueSeasons / seasons.length) * 25 +
      (uniqueSkills / skills.length) * 25 +
      (categoryVariety / categoryNames.length) * 20,
  )

  let readinessLevel = 'starter'
  let readinessLabel = 'Starter Crew'

  if (readiness >= 80) {
    readinessLevel = 'legendary'
    readinessLabel = 'Legendary Valley Crew'
  } else if (readiness >= 55) {
    readinessLevel = 'solid'
    readinessLabel = 'Reliable Farm Team'
  } else if (readiness >= 30) {
    readinessLevel = 'growing'
    readinessLabel = 'Growing Crew'
  }

  return {
    total,
    readiness,
    readinessLevel,
    readinessLabel,
    topCategory,
    farmPercent: Math.round((farmCrewCount / total) * 100),
    seasonCoverage: Math.round((uniqueSeasons / seasons.length) * 100),
    skillCoverage: Math.round((uniqueSkills / skills.length) * 100),
  }
}

function goTo(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function App() {
  const [route, setRoute] = useState(window.location.pathname)
  const [crewmates, setCrewmates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const handleRoute = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', handleRoute)
    return () => window.removeEventListener('popstate', handleRoute)
  }, [])

  const loadCrewmates = useCallback(async () => {
    setLoading(true)
    setError('')

    if (!supabaseConfigured) {
      setCrewmates(getStoredCrewmates().map(normalizeCrewmate))
      setNotice('Demo mode is on. Add your Supabase URL and anon key in .env to save to your database.')
      setLoading(false)
      return
    }

    const { data, error: requestError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false })

    if (requestError) {
      setError(requestError.message)
    } else {
      setCrewmates((data || []).map(normalizeCrewmate))
      setNotice('')
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    queueMicrotask(loadCrewmates)
  }, [loadCrewmates])

  async function createCrewmate(formValues) {
    setError('')
    const payload = {
      ...formValues,
      name: formValues.name.trim(),
      motto: formValues.motto.trim(),
    }

    if (!supabaseConfigured) {
      const newCrewmate = {
        ...payload,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      }
      const nextCrewmates = [newCrewmate, ...crewmates]
      setCrewmates(nextCrewmates)
      setStoredCrewmates(nextCrewmates)
      goTo(`/crewmates/${newCrewmate.id}`)
      return
    }

    const { data, error: requestError } = await supabase
      .from(TABLE_NAME)
      .insert(payload)
      .select()
      .single()

    if (requestError) {
      setError(requestError.message)
      return
    }

    const savedCrewmate = normalizeCrewmate(data)
    setCrewmates((current) => [savedCrewmate, ...current])
    goTo(`/crewmates/${savedCrewmate.id}`)
  }

  async function updateCrewmate(id, formValues) {
    setError('')
    const payload = {
      ...formValues,
      name: formValues.name.trim(),
      motto: formValues.motto.trim(),
    }

    if (!supabaseConfigured) {
      const nextCrewmates = crewmates.map((crewmate) =>
        crewmate.id === id ? { ...crewmate, ...payload } : crewmate,
      )
      setCrewmates(nextCrewmates)
      setStoredCrewmates(nextCrewmates)
      return true
    }

    const { data, error: requestError } = await supabase
      .from(TABLE_NAME)
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (requestError) {
      setError(requestError.message)
      return false
    }

    const savedCrewmate = normalizeCrewmate(data)
    setCrewmates((current) =>
      current.map((crewmate) => (crewmate.id === id ? savedCrewmate : crewmate)),
    )
    return true
  }

  async function deleteCrewmate(id) {
    setError('')

    if (!supabaseConfigured) {
      const nextCrewmates = crewmates.filter((crewmate) => crewmate.id !== id)
      setCrewmates(nextCrewmates)
      setStoredCrewmates(nextCrewmates)
      goTo('/crewmates')
      return
    }

    const { error: requestError } = await supabase.from(TABLE_NAME).delete().eq('id', id)

    if (requestError) {
      setError(requestError.message)
      return
    }

    setCrewmates((current) => current.filter((crewmate) => crewmate.id !== id))
    goTo('/crewmates')
  }

  let page = <Home crewmates={crewmates} />
  const editMatch = route.match(/^\/crewmates\/([^/]+)\/edit$/)
  const detailMatch = route.match(/^\/crewmates\/([^/]+)$/)

  if (route === '/create') {
    page = <CrewmateForm title="Recruit a Stardew Crewmate" onSubmit={createCrewmate} />
  } else if (route === '/crewmates') {
    page = <Gallery crewmates={crewmates} loading={loading} />
  } else if (editMatch) {
    const crewmate = crewmates.find((item) => String(item.id) === editMatch[1])
    page = (
      <CrewmateEditor
        crewmate={crewmate}
        loading={loading}
        onDelete={deleteCrewmate}
        onSubmit={updateCrewmate}
      />
    )
  } else if (detailMatch) {
    const crewmate = crewmates.find((item) => String(item.id) === detailMatch[1])
    page = <CrewmateDetail crewmate={crewmate} loading={loading} />
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" onClick={(event) => handleNav(event, '/')}>
          Stardew Crew
        </a>
        <nav aria-label="Main navigation">
          <a href="/create" onClick={(event) => handleNav(event, '/create')}>
            Create
          </a>
          <a href="/crewmates" onClick={(event) => handleNav(event, '/crewmates')}>
            Crew Gallery
          </a>
        </nav>
      </header>

      {notice && <p className="notice">{notice}</p>}
      {error && <p className="error">Supabase error: {error}</p>}

      <main>{page}</main>
    </div>
  )
}

function handleNav(event, path) {
  event.preventDefault()
  goTo(path)
}

function Home({ crewmates }) {
  const latest = crewmates[0]
  const latestVillager = latest ? findVillager(latest.villager) : villagers[0]

  return (
    <section className="home-grid">
      <div className="hero-copy">
        <p className="eyebrow">Pelican Town roster builder</p>
        <h1>Build your Stardew Valley crewmates.</h1>
        <p>
          Recruit villagers, give each teammate a farm role, and keep a gallery
          of everyone you have added to the crew.
        </p>
        <div className="hero-actions">
          <a className="button primary" href="/create" onClick={(event) => handleNav(event, '/create')}>
            Add Crewmate
          </a>
          <a className="button secondary" href="/crewmates" onClick={(event) => handleNav(event, '/crewmates')}>
            View Gallery
          </a>
        </div>
      </div>

      <div className="featured-roster" aria-label="Stardew villager choices">
        <div className="featured-card">
          <span>{crewmates.length} recruited</span>
          <img src={latestVillager.portrait} alt={latestVillager.name} />
          <h2>{latest ? latest.name : 'Choose your first teammate'}</h2>
          <p>
            {latest
              ? `${latest.role} inspired by ${latestVillager.name}`
              : 'Start with a villager portrait and add your custom stats.'}
          </p>
        </div>
        <div className="portrait-strip">
          {villagers.slice(0, 6).map((villager) => (
            <img key={villager.key} src={villager.portrait} alt={villager.name} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Gallery({ crewmates, loading }) {
  if (loading) {
    return <p className="state-message">Loading the crew...</p>
  }

  const stats = getCrewStats(crewmates)

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Newest recruits first</p>
        <h1>Crewmate Gallery</h1>
      </div>

      {crewmates.length === 0 ? (
        <div className="empty-state">
          <h2>No crewmates yet</h2>
          <p>Your farm team is waiting. Add a crewmate to start the gallery.</p>
          <a className="button primary" href="/create" onClick={(event) => handleNav(event, '/create')}>
            Recruit Someone
          </a>
        </div>
      ) : (
        <>
          <CrewStats stats={stats} />
          <div className={`crew-grid readiness-${stats.readinessLevel}`}>
            {crewmates.map((crewmate) => (
              <CrewmateCard key={crewmate.id} crewmate={crewmate} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function CrewStats({ stats }) {
  return (
    <section className={`stats-panel readiness-${stats.readinessLevel}`}>
      <div className="success-meter">
        <div>
          <p className="eyebrow">Crew success metric</p>
          <h2>{stats.readinessLabel}</h2>
          <p>Valley Readiness: {stats.readiness}%</p>
        </div>
        <div className="meter-track" aria-label={`Valley Readiness ${stats.readiness} percent`}>
          <span style={{ width: `${stats.readiness}%` }}></span>
        </div>
      </div>
      <div className="stat-grid">
        <div>
          <span>{stats.total}</span>
          <p>Total crewmates</p>
        </div>
        <div>
          <span>{stats.topCategory}</span>
          <p>Most common category</p>
        </div>
        <div>
          <span>{stats.farmPercent}%</span>
          <p>Farm Crew members</p>
        </div>
        <div>
          <span>{stats.seasonCoverage}%</span>
          <p>Season coverage</p>
        </div>
        <div>
          <span>{stats.skillCoverage}%</span>
          <p>Skill coverage</p>
        </div>
      </div>
    </section>
  )
}

function CrewmateCard({ crewmate }) {
  const villager = findVillager(crewmate.villager)
  const createdDate = new Date(crewmate.created_at).toLocaleDateString()

  return (
    <article className="crew-card">
      <a
        className="crew-card-main"
        href={`/crewmates/${crewmate.id}`}
        onClick={(event) => handleNav(event, `/crewmates/${crewmate.id}`)}
      >
        <img src={villager.portrait} alt={villager.name} />
        <div>
          <h2>{crewmate.name}</h2>
          <p>{villager.name} inspired</p>
        </div>
      </a>
      <dl>
        <div>
          <dt>Category</dt>
          <dd>{crewmate.category}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{crewmate.role}</dd>
        </div>
        <div>
          <dt>Best Skill</dt>
          <dd>{crewmate.skill}</dd>
        </div>
        <div>
          <dt>Added</dt>
          <dd>{createdDate}</dd>
        </div>
      </dl>
      <a
        className="button small"
        href={`/crewmates/${crewmate.id}/edit`}
        onClick={(event) => handleNav(event, `/crewmates/${crewmate.id}/edit`)}
      >
        Edit
      </a>
    </article>
  )
}

function CrewmateDetail({ crewmate, loading }) {
  if (loading) {
    return <p className="state-message">Loading crewmate details...</p>
  }

  if (!crewmate) {
    return <NotFound />
  }

  const villager = findVillager(crewmate.villager)

  return (
    <section className="detail-layout">
      <div className="detail-portrait">
        <img src={villager.portrait} alt={villager.name} />
      </div>
      <div className="detail-copy">
        <p className="eyebrow">Crewmate details</p>
        <h1>{crewmate.name}</h1>
        <p>{crewmate.motto || 'Ready to help around the valley.'}</p>
        <dl className="detail-list">
          <div>
            <dt>Category</dt>
            <dd>{crewmate.category}</dd>
          </div>
          <div>
            <dt>Inspired by</dt>
            <dd>{villager.name}</dd>
          </div>
          <div>
            <dt>Farm role</dt>
            <dd>{crewmate.role}</dd>
          </div>
          <div>
            <dt>Favorite season</dt>
            <dd>{crewmate.season}</dd>
          </div>
          <div>
            <dt>Best skill</dt>
            <dd>{crewmate.skill}</dd>
          </div>
          <div>
            <dt>Loved gift</dt>
            <dd>{villager.gift}</dd>
          </div>
          <div>
            <dt>Extra info</dt>
            <dd>{villager.detail}</dd>
          </div>
        </dl>
        <div className="hero-actions">
          <a
            className="button primary"
            href={`/crewmates/${crewmate.id}/edit`}
            onClick={(event) => handleNav(event, `/crewmates/${crewmate.id}/edit`)}
          >
            Edit Crewmate
          </a>
          <a className="button secondary" href="/crewmates" onClick={(event) => handleNav(event, '/crewmates')}>
            Back to Gallery
          </a>
        </div>
      </div>
    </section>
  )
}

function CrewmateEditor({ crewmate, loading, onDelete, onSubmit }) {
  const [saved, setSaved] = useState(false)

  if (loading) {
    return <p className="state-message">Loading edit form...</p>
  }

  if (!crewmate) {
    return <NotFound />
  }

  return (
    <section className="page-stack">
      <CrewmateForm
        key={crewmate.id}
        title={`Edit ${crewmate.name}`}
        initialValues={crewmate}
        submitLabel="Save Changes"
        onSubmit={async (values) => {
          const ok = await onSubmit(crewmate.id, values)
          setSaved(ok)
        }}
      />
      {saved && <p className="success">Saved. Your changes are reflected here and in the gallery.</p>}
      <button className="danger-button" type="button" onClick={() => onDelete(crewmate.id)}>
        Delete Crewmate
      </button>
    </section>
  )
}

function CrewmateForm({
  title,
  initialValues = emptyCrewmate,
  submitLabel = 'Create Crewmate',
  onSubmit,
}) {
  const [formValues, setFormValues] = useState(getFormValues(initialValues))
  const categoryOptions = getCategoryOptions(formValues.category)

  function updateField(field, value) {
    setFormValues((current) => ({ ...current, [field]: value }))
  }

  function updateCategory(category) {
    const nextOptions = getCategoryOptions(category)

    setFormValues((current) => ({
      ...current,
      category,
      role: nextOptions.roles.includes(current.role) ? current.role : nextOptions.roles[0],
      season: nextOptions.seasons.includes(current.season) ? current.season : nextOptions.seasons[0],
      skill: nextOptions.skills.includes(current.skill) ? current.skill : nextOptions.skills[0],
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!formValues.name.trim()) {
      return
    }
    onSubmit(formValues)
  }

  return (
    <form className="crew-form" onSubmit={handleSubmit}>
      <div className="page-heading">
        <p className="eyebrow">Customize the roster</p>
        <h1>{title}</h1>
      </div>

      <label className="field">
        <span>Crewmate name</span>
        <input
          value={formValues.name}
          onChange={(event) => updateField('name', event.target.value)}
          placeholder="Example: Junimo MVP"
          required
        />
      </label>

      <ChoicePills
        label="Crew category"
        options={categoryNames}
        selected={formValues.category}
        onSelect={updateCategory}
      />

      <ChoiceGrid
        label="Choose a Stardew villager"
        options={villagers}
        selected={formValues.villager}
        onSelect={(value) => updateField('villager', value)}
        renderOption={(villager) => (
          <>
            <img src={villager.portrait} alt="" />
            <span>{villager.name}</span>
          </>
        )}
      />

      <ChoicePills
        label="Farm role"
        options={categoryOptions.roles}
        selected={formValues.role}
        onSelect={(value) => updateField('role', value)}
      />

      <ChoicePills
        label="Favorite season"
        options={categoryOptions.seasons}
        selected={formValues.season}
        onSelect={(value) => updateField('season', value)}
      />

      <ChoicePills
        label="Best skill"
        options={categoryOptions.skills}
        selected={formValues.skill}
        onSelect={(value) => updateField('skill', value)}
      />

      <label className="field">
        <span>Crewmate note</span>
        <textarea
          value={formValues.motto}
          onChange={(event) => updateField('motto', event.target.value)}
          placeholder="Example: Handles mines on rainy days."
          rows="3"
        />
      </label>

      <button className="button primary form-submit" type="submit">
        {submitLabel}
      </button>
    </form>
  )
}

function ChoiceGrid({ label, options, selected, onSelect, renderOption }) {
  return (
    <fieldset className="choice-group">
      <legend>{label}</legend>
      <div className="villager-grid">
        {options.map((option) => (
          <button
            className={selected === option.key ? 'selected' : ''}
            key={option.key}
            type="button"
            onClick={() => onSelect(option.key)}
          >
            {renderOption(option)}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function ChoicePills({ label, options, selected, onSelect }) {
  return (
    <fieldset className="choice-group">
      <legend>{label}</legend>
      <div className="pill-row">
        {options.map((option) => (
          <button
            className={selected === option ? 'selected' : ''}
            key={option}
            type="button"
            onClick={() => onSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function NotFound() {
  return (
    <section className="empty-state">
      <h1>Crewmate not found</h1>
      <p>That direct link does not match a saved teammate.</p>
      <a className="button primary" href="/crewmates" onClick={(event) => handleNav(event, '/crewmates')}>
        Back to Gallery
      </a>
    </section>
  )
}

export default App
