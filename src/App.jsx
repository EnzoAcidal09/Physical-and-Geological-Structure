import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Dices,
  ExternalLink,
  FileText,
  Menu,
  RotateCcw,
  Sparkles,
  Target,
  X,
  Zap,
} from 'lucide-react'
import { lessons } from './data/lessons'
import {
  buildQuizSession,
  getPercent,
  loadProgress,
  saveProgress,
} from './utils'

const routeFromHash = () => {
  const hash = window.location.hash.replace(/^#\/?/, '')
  if (hash.startsWith('lesson/')) return { view: 'lesson', lessonId: Number(hash.split('/')[1]) || 1 }
  if (hash.startsWith('quiz/')) return { view: 'quiz', lessonId: Number(hash.split('/')[1]) || 1 }
  return { view: 'home' }
}

function App() {
  const [route, setRoute] = useState(routeFromHash)
  const [progress, setProgress] = useState(loadProgress)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = (view, lessonId) => {
    const nextHash = view === 'home' ? '#home' : `#${view}/${lessonId}`
    if (window.location.hash !== nextHash) window.location.hash = nextHash
    setRoute({ view, lessonId })
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const currentLesson = lessons.find((lesson) => lesson.id === route.lessonId) || lessons[0]
  const completedCount = progress.completedLessons.length
  const quizCount = lessons.reduce((total, lesson) => total + lesson.quiz.length, 0)
  const completedQuizCount = Object.keys(progress.quizScores).length

  const toggleLessonComplete = (lessonId) => {
    setProgress((current) => {
      const isComplete = current.completedLessons.includes(lessonId)
      return {
        ...current,
        completedLessons: isComplete
          ? current.completedLessons.filter((id) => id !== lessonId)
          : [...current.completedLessons, lessonId],
      }
    })
  }

  const recordQuizScore = (lessonId, score) => {
    setProgress((current) => {
      const previousBest = current.quizScores[lessonId] || 0
      return {
        ...current,
        quizScores: {
          ...current.quizScores,
          [lessonId]: Math.max(previousBest, score),
        },
      }
    })
  }

  return (
    <div className="app-shell">
      <AnnouncementBar completedCount={completedCount} />
      <Topbar
        route={route}
        navigate={navigate}
        progress={progress}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      <main>
        {route.view === 'home' && (
          <HomePage
            navigate={navigate}
            progress={progress}
            completedCount={completedCount}
            quizCount={quizCount}
            completedQuizCount={completedQuizCount}
            toggleLessonComplete={toggleLessonComplete}
          />
        )}
        {route.view === 'lesson' && (
          <LessonPage
            key={currentLesson.id}
            lesson={currentLesson}
            progress={progress}
            navigate={navigate}
            toggleLessonComplete={toggleLessonComplete}
          />
        )}
        {route.view === 'quiz' && (
          <QuizPage
            key={currentLesson.id}
            lesson={currentLesson}
            bestScore={progress.quizScores[currentLesson.id] || 0}
            navigate={navigate}
            recordQuizScore={recordQuizScore}
          />
        )}
      </main>

      <Footer navigate={navigate} />
    </div>
  )
}

function AnnouncementBar({ completedCount }) {
  return (
    <div className="announcement-bar">
      <div className="announcement-inner">
        <span className="status-dot" aria-hidden="true" />
        <span>FIELD GUIDE 01—09</span>
        <span className="announcement-divider" aria-hidden="true" />
        <span>{completedCount === 0 ? 'Your progress is saved on this device' : `${completedCount} lesson${completedCount === 1 ? '' : 's'} marked complete`}</span>
        <span className="announcement-arrow" aria-hidden="true">↗</span>
      </div>
    </div>
  )
}

function Topbar({ route, navigate, progress, menuOpen, setMenuOpen }) {
  const isHome = route.view === 'home'
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand-lockup" onClick={() => navigate('home')} aria-label="Go to EarthLab home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span className="brand-name">EARTH<span>LAB</span></span>
        </button>
        <div className="topbar-course">PHYSICAL + GEOLOGICAL STRUCTURE</div>
        <nav className={`topnav ${menuOpen ? 'is-open' : ''}`} aria-label="Primary navigation">
          <button className={isHome ? 'nav-link is-active' : 'nav-link'} onClick={() => navigate('home')}>
            Course map
          </button>
          <button className="nav-link" onClick={() => navigate('lesson', 1)}>
            Study guide
          </button>
          <button className="nav-link" onClick={() => navigate('quiz', 1)}>
            Quiz lab
          </button>
          <div className="mobile-nav-footer">
            <span>{progress.completedLessons.length} / {lessons.length} lessons</span>
          </div>
        </nav>
        <div className="topbar-actions">
          <div className="mini-progress" aria-label={`${progress.completedLessons.length} of ${lessons.length} lessons complete`}>
            <span style={{ width: `${getPercent(progress.completedLessons.length, lessons.length)}%` }} />
          </div>
          <span className="topbar-progress-label">{progress.completedLessons.length}/{lessons.length}</span>
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={21} strokeWidth={2.6} /> : <Menu size={21} strokeWidth={2.6} />}
          </button>
        </div>
      </div>
    </header>
  )
}

function HomePage({ navigate, progress, completedCount, quizCount, completedQuizCount, toggleLessonComplete }) {
  const quizAverage = useMemo(() => {
    const scores = Object.values(progress.quizScores)
    if (!scores.length) return 0
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  }, [progress.quizScores])

  return (
    <div className="page home-page">
      <section className="home-hero section-pad">
        <div className="hero-copy">
          <div className="kicker"><span className="kicker-mark">+</span> A FIELD GUIDE FOR THE EARTH</div>
          <h1>Study the planet<br /><span>from the inside out.</span></h1>
          <p className="hero-description">A focused study desk for the physical and geological structure of Earth. Read the notes, trace the processes, then test your recall with a fresh quiz every time.</p>
          <div className="hero-actions">
            <button className="button button-dark button-large" onClick={() => navigate('lesson', 1)}>
              Start the guide <ArrowRight size={19} strokeWidth={2.8} />
            </button>
            <button className="button button-light button-large" onClick={() => navigate('quiz', 1)}>
              <Dices size={19} strokeWidth={2.5} /> Take a quiz
            </button>
          </div>
          <div className="hero-note"><Zap size={15} fill="currentColor" /> Nine lessons. Nine quizzes. No memorised order.</div>
        </div>
        <PlanetDiagram />
      </section>

      <section className="stats-band section-pad" aria-label="Course statistics">
        <div className="stat-block stat-block-accent">
          <span className="stat-value">{lessons.length}</span>
          <span className="stat-label">lessons mapped</span>
        </div>
        <div className="stat-block">
          <span className="stat-value">{quizCount}</span>
          <span className="stat-label">questions in the lab</span>
        </div>
        <div className="stat-block">
          <span className="stat-value">{completedCount}<small>/9</small></span>
          <span className="stat-label">lessons complete</span>
        </div>
        <div className="stat-block stat-block-last">
          <span className="stat-value">{quizAverage ? `${quizAverage}%` : '—'}</span>
          <span className="stat-label">average quiz best · {completedQuizCount} attempted</span>
        </div>
      </section>

      <section className="course-map section-pad" id="course-map">
        <div className="section-heading-row">
          <div>
            <div className="kicker">01 / THE COURSE MAP</div>
            <h2>Choose your next layer.</h2>
          </div>
          <div className="heading-aside">
            <p>Read in order or jump to a topic. Every lesson has its own focused quiz.</p>
            <span className="hand-note">start anywhere ↘</span>
          </div>
        </div>
        <div className="lesson-list">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              progress={progress}
              navigate={navigate}
              toggleLessonComplete={toggleLessonComplete}
            />
          ))}
        </div>
      </section>

      <section className="study-rhythm section-pad">
        <div className="section-heading-row rhythm-heading">
          <div>
            <div className="kicker">02 / THE STUDY RHYTHM</div>
            <h2>Read. Recall. Reset.</h2>
          </div>
          <p className="heading-note">The order changes. The understanding sticks.</p>
        </div>
        <div className="rhythm-grid">
          <RhythmCard number="A" icon={<BookOpen size={25} strokeWidth={2.2} />} title="Read the field notes" text="Short, concept-first notes built from the source chapters. Keep the source PDF open when you want the full detail." color="yellow" />
          <RhythmCard number="B" icon={<BrainCircuit size={25} strokeWidth={2.2} />} title="Trace the process" text="Use the visual diagrams and comparison tables to connect cause, mechanism, and evidence." color="blue" />
          <RhythmCard number="C" icon={<Dices size={25} strokeWidth={2.2} />} title="Shuffle the quiz" text="Questions and answer choices are randomized on every attempt. Recall the idea, not the pattern." color="pink" />
        </div>
      </section>

      <section className="dashboard-bottom section-pad">
        <div className="lab-card">
          <div className="lab-card-copy">
            <div className="kicker kicker-light">03 / QUIZ LAB</div>
            <h2>Know the rocks.<br /><span>Own the answers.</span></h2>
            <p>Every quiz is scoped to one lesson, so your feedback stays useful. Take it until the concept is clear.</p>
            <button className="button button-yellow button-large" onClick={() => navigate('quiz', 1)}>
              Open quiz lab <ArrowUpRight size={19} strokeWidth={2.8} />
            </button>
          </div>
          <div className="lab-card-graphic" aria-hidden="true">
            <div className="quiz-sticker sticker-one">NO<br />PEeking</div>
            <div className="quiz-sticker sticker-two">01</div>
            <div className="quiz-orbit orbit-one" />
            <div className="quiz-orbit orbit-two" />
            <div className="quiz-core"><Dices size={56} strokeWidth={1.8} /></div>
          </div>
        </div>
        <div className="source-card">
          <div className="source-card-head">
            <div className="source-icon"><FileText size={22} strokeWidth={2.3} /></div>
            <div><div className="kicker">SOURCE SHELF</div><h3>Original chapters</h3></div>
          </div>
          <p>Each lesson keeps a link to the PDF it was built from. Use the field notes for a quick review, then go deeper when you need to.</p>
          <a className="text-link" href="#source-shelf">Browse source files <ArrowRight size={16} /></a>
        </div>
      </section>

      <section className="source-shelf section-pad" id="source-shelf">
        <div className="section-heading-row compact-heading">
          <div><div className="kicker">PDF / SOURCE INDEX</div><h2>Keep the full chapter close.</h2></div>
          <span className="source-count">{lessons.length} files attached</span>
        </div>
        <div className="source-grid">
          {lessons.map((lesson) => (
            <a className="source-tile" href={lesson.sourceFile} target="_blank" rel="noreferrer" key={lesson.id}>
              <span className="source-tile-number">{String(lesson.id).padStart(2, '0')}</span>
              <span className="source-tile-title">{lesson.title}</span>
              <ExternalLink size={15} strokeWidth={2.2} />
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}

function PlanetDiagram() {
  return (
    <div className="planet-wrap" aria-label="Layered cutaway illustration of Earth">
      <div className="planet-stamp">FIELD<br />STUDY</div>
      <div className="planet-diagram">
        <div className="planet-ring ring-outer" />
        <div className="planet-ring ring-inner" />
        <div className="planet-sphere">
          <div className="sphere-land land-one" />
          <div className="sphere-land land-two" />
          <div className="sphere-land land-three" />
          <span className="sphere-lat lat-one" />
          <span className="sphere-lat lat-two" />
          <span className="sphere-long long-one" />
          <span className="sphere-long long-two" />
        </div>
        <div className="planet-crosshair crosshair-h" />
        <div className="planet-crosshair crosshair-v" />
        <div className="planet-label label-core">CORE</div>
        <div className="planet-label label-mantle">MANTLE</div>
        <div className="planet-label label-crust">CRUST</div>
      </div>
      <div className="diagram-caption"><span>01</span> a planet in layers</div>
    </div>
  )
}

function LessonCard({ lesson, progress, navigate, toggleLessonComplete }) {
  const isComplete = progress.completedLessons.includes(lesson.id)
  const bestScore = progress.quizScores[lesson.id] || 0
  return (
    <article className={`lesson-card ${isComplete ? 'is-complete' : ''}`} style={{ '--lesson-color': lesson.color }}>
      <div className="lesson-card-stripe" />
      <div className="lesson-card-number">{String(lesson.id).padStart(2, '0')}</div>
      <div className="lesson-card-main">
        <div className="lesson-card-topline">
          <span className="lesson-code">{lesson.code}</span>
          {isComplete && <span className="complete-chip"><Check size={13} strokeWidth={3} /> COMPLETE</span>}
        </div>
        <h3>{lesson.title}</h3>
        <p>{lesson.subtitle}</p>
        <div className="lesson-meta"><span><Clock3 size={14} /> {lesson.duration}</span><span><Target size={14} /> {lesson.objectives.length} objectives</span></div>
      </div>
      <div className="lesson-card-progress">
        <div className="mini-progress large"><span style={{ width: `${isComplete ? 100 : 0}%` }} /></div>
        <span>{isComplete ? 'Reviewed' : 'Not started'}</span>
      </div>
      <div className="lesson-card-actions">
        <button className="icon-button" onClick={() => navigate('lesson', lesson.id)} aria-label={`Open lesson ${lesson.number}: ${lesson.title}`}>
          <ArrowUpRight size={19} strokeWidth={2.6} />
        </button>
        <button className={`quiz-link ${bestScore ? 'has-score' : ''}`} onClick={() => navigate('quiz', lesson.id)}>
          <Dices size={15} /> {bestScore ? `${bestScore}% best` : 'Quiz'}
        </button>
        <button className="check-button" onClick={() => toggleLessonComplete(lesson.id)} aria-label={`${isComplete ? 'Mark incomplete' : 'Mark complete'}: ${lesson.title}`}>
          <Check size={16} strokeWidth={3} />
        </button>
      </div>
    </article>
  )
}

function RhythmCard({ number, icon, title, text, color }) {
  return (
    <article className={`rhythm-card rhythm-${color}`}>
      <div className="rhythm-card-top"><span className="rhythm-number">{number}</span><span className="rhythm-icon">{icon}</span></div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  )
}

function LessonPage({ lesson, progress, navigate, toggleLessonComplete }) {
  const [activeSection, setActiveSection] = useState(lesson.sections[0]?.id)
  const isComplete = progress.completedLessons.includes(lesson.id)
  const nextLesson = lessons.find((item) => item.id === lesson.id + 1)
  const previousLesson = lessons.find((item) => item.id === lesson.id - 1)

  const jumpToSection = (sectionId) => {
    setActiveSection(sectionId)
    document.getElementById(`section-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="page lesson-page" style={{ '--lesson-color': lesson.color }}>
      <section className="lesson-hero section-pad">
        <div className="lesson-breadcrumb"><button onClick={() => navigate('home')}>Course map</button><ChevronRight size={14} /><span>Lesson {String(lesson.id).padStart(2, '0')}</span></div>
        <div className="lesson-hero-grid">
          <div className="lesson-title-block">
            <div className="kicker"><span className="kicker-mark">+</span> {lesson.code}</div>
            <h1>{lesson.title}</h1>
            <p>{ledeForLesson(lesson)}</p>
            <div className="lesson-hero-actions">
              <button className={`button button-dark button-large ${isComplete ? 'is-completed' : ''}`} onClick={() => toggleLessonComplete(lesson.id)}>
                {isComplete ? <Check size={19} strokeWidth={3} /> : <Check size={19} strokeWidth={2.5} />}
                {isComplete ? 'Lesson complete' : 'Mark lesson complete'}
              </button>
              <button className="button button-light button-large" onClick={() => navigate('quiz', lesson.id)}>
                <Dices size={19} /> Take quiz
              </button>
            </div>
          </div>
          <div className="lesson-hero-stamp" aria-hidden="true">
            <span>LESSON</span><strong>{String(lesson.id).padStart(2, '0')}</strong><span>{lesson.shortLabel}</span>
          </div>
        </div>
        <div className="lesson-facts">
          <div><span>READING TIME</span><strong>{lesson.duration}</strong></div>
          <div><span>OBJECTIVES</span><strong>{lesson.objectives.length} checkpoints</strong></div>
          <div><span>QUIZ</span><strong>{lesson.quiz.length} questions</strong></div>
          <div><span>SOURCE</span><a href={lesson.sourceFile} target="_blank" rel="noreferrer">Open PDF <ExternalLink size={14} /></a></div>
        </div>
      </section>

      <section className="lesson-body section-pad">
        <aside className="lesson-sidebar">
          <div className="sidebar-sticky">
            <div className="kicker">IN THIS LESSON</div>
            <nav className="section-nav" aria-label="Lesson sections">
              {lesson.sections.map((section, index) => (
                <button key={section.id} className={activeSection === section.id ? 'section-nav-item is-active' : 'section-nav-item'} onClick={() => jumpToSection(section.id)}>
                  <span>{String(index + 1).padStart(2, '0')}</span>{section.title}
                </button>
              ))}
              <button className={activeSection === 'terminology' ? 'section-nav-item is-active' : 'section-nav-item'} onClick={() => jumpToSection('terminology')}>
                <span aria-hidden="true">✦</span>Terminology
              </button>
            </nav>
            <div className="sidebar-tip">
              <div className="tip-icon"><Sparkles size={16} /></div>
              <strong>Study cue</strong>
              <p>Explain the process out loud before you open the quiz.</p>
            </div>
          </div>
        </aside>
        <div className="lesson-content">
          <div className="objectives-panel">
            <div className="objectives-heading"><div className="kicker">FIELD OBJECTIVES</div><Target size={23} strokeWidth={2.2} /></div>
            <ul>{lesson.objectives.map((objective) => <li key={objective}><span className="objective-mark">✓</span>{objective}</li>)}</ul>
          </div>
          <TerminologyDesk terms={lesson.terminology} />
          {lesson.sections.map((section, index) => (
            <LessonSection key={section.id} section={section} index={index} />
          ))}
          <LessonQuizCallout lesson={lesson} navigate={navigate} />
          <div className="lesson-pagination">
            {previousLesson ? <button className="pagination-button" onClick={() => navigate('lesson', previousLesson.id)}><ChevronLeft size={18} /><span><small>PREVIOUS</small>{previousLesson.title}</span></button> : <span />}
            {nextLesson ? <button className="pagination-button next" onClick={() => navigate('lesson', nextLesson.id)}><span><small>NEXT LESSON</small>{nextLesson.title}</span><ChevronRight size={18} /></button> : <span />}
          </div>
        </div>
      </section>
    </div>
  )
}

function ledeForLesson(lesson) {
  const intro = {
    1: 'Geology is the science of reading the Earth as a system of processes, materials, and deep time.',
    2: 'Build a mental model of Earth from the inside out, then connect each layer to the way the planet behaves.',
    3: 'See how the rigid plates above the asthenosphere move, collide, and reshape the surface.',
    4: 'Read the rock record to reconstruct the past: relative age, unconformities, and the evidence of change.',
    5: 'Minerals are the building blocks of rocks. Follow the rock cycle to see how one material becomes another.',
    6: 'Igneous rocks record the cooling and crystallisation of magma. Learn to read their textures and origins.',
    7: 'Volcanism is a window into the Earth’s interior. Trace magma from mantle to eruption and beyond.',
    8: 'Sedimentary rocks preserve layers of time, environment, and life. Use texture and structures to read them.',
    9: 'Groundwater moves through pores and fractures. Learn how aquifers, recharge, and water tables work together.',
  }
  return intro[lesson.id] || lesson.subtitle
}

function TerminologyDesk({ terms = [] }) {
  return (
    <section className="terminology-panel" id="section-terminology">
      <div className="terminology-heading">
        <div>
          <div className="kicker">TERM DESK / DEFINITIONS</div>
          <h2>Terms worth highlighting.</h2>
        </div>
        <div className="terminology-stamp"><Sparkles size={16} /> {terms.length} terms</div>
      </div>
      <p className="terminology-intro">Use this as your highlighter list. Each term is written in the lesson’s own context, so you can memorize the meaning—not just the word.</p>
      <div className="terminology-grid">
        {terms.map(([term, definition]) => (
          <div className="terminology-card" key={term}>
            <div className="terminology-term"><mark>{term}</mark><span aria-hidden="true">—</span></div>
            <p>{definition}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function LessonSection({ section, index }) {
  return (
    <article className="lesson-section" id={`section-${section.id}`}>
      <div className="lesson-section-heading">
        <span className="section-index">{String(index + 1).padStart(2, '0')}</span>
        <div><div className="kicker">{section.kicker || 'CONCEPT NOTE'}</div><h2>{section.title}</h2></div>
      </div>
      {section.summary && <p className="section-summary">{section.summary}</p>}
      {section.points && <ul className="concept-list">{section.points.map((point) => <li key={point}><span className="concept-bullet" />{point}</li>)}</ul>}
      {section.steps && <div className="process-strip">{section.steps.map((step, stepIndex) => <div className="process-step" key={step}><span>{String(stepIndex + 1).padStart(2, '0')}</span><p>{step}</p></div>)}</div>}
      {section.table && <ConceptTable table={section.table} />}
      {section.diagram && <ConceptDiagram type={section.diagram} />}
      {section.terms && <TermList terms={section.terms} />}
      {section.callout && <div className="concept-callout"><div className="callout-symbol">!</div><div><strong>{section.callout.label}</strong><p>{section.callout.text}</p></div></div>}
    </article>
  )
}

function ConceptTable({ table }) {
  return (
    <div className="concept-table-wrap">
      <div className="concept-table-label">COMPARE / {table.label}</div>
      <table className="concept-table">
        <thead><tr>{table.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>{table.rows.map((row) => <tr key={row.join('|')}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

function TermList({ terms }) {
  return (
    <div className="term-grid">
      {terms.map(([term, definition]) => <div className="term-card" key={term}><strong>{term}</strong><span>{definition}</span></div>)}
    </div>
  )
}

function ConceptDiagram({ type }) {
  if (type === 'cycle') {
    return <div className="concept-diagram cycle-diagram" aria-label="Rock cycle diagram"><div className="cycle-center">ROCK<br />CYCLE</div><div className="cycle-node cycle-node-top">MELT</div><div className="cycle-node cycle-node-right">IGNEOUS</div><div className="cycle-node cycle-node-bottom">SEDIMENT</div><div className="cycle-node cycle-node-left">METAMORPHIC</div><div className="cycle-arrow arrow-top">↓</div><div className="cycle-arrow arrow-right">↓</div><div className="cycle-arrow arrow-bottom">↓</div><div className="cycle-arrow arrow-left">↓</div></div>
  }
  if (type === 'layers') {
    return <div className="concept-diagram layers-diagram" aria-label="Earth layer diagram"><div className="layer-cross-section"><div className="layer layer-crust">CRUST</div><div className="layer layer-mantle">MANTLE</div><div className="layer layer-core">CORE</div></div><div className="layer-key"><span><i className="key-dot dot-crust" /> thin outer shell</span><span><i className="key-dot dot-mantle" /> solid but mobile rock</span><span><i className="key-dot dot-core" /> dense iron-nickel center</span></div></div>
  }
  if (type === 'groundwater') {
    return <div className="concept-diagram groundwater-diagram" aria-label="Groundwater diagram"><div className="ground-surface" /><div className="soil-layer" /><div className="water-table-line">WATER TABLE</div><div className="aquifer-layer"><span>AQUIFER</span><i className="water-drop drop-one" /><i className="water-drop drop-two" /><i className="water-drop drop-three" /></div><div className="well-line"><span>WELL</span></div><div className="ground-arrow">recharge ↓</div></div>
  }
  if (type === 'volcano') {
    return <div className="concept-diagram volcano-diagram" aria-label="Volcano cross-section diagram"><div className="volcano-sky" /><div className="volcano-mountain"><div className="magma-chamber" /><div className="volcano-conduit" /><div className="volcano-cap" /></div><div className="lava-flow" /><div className="volcano-labels"><span>magma</span><span>vent</span><span>eruption</span></div></div>
  }
  return <div className={`concept-diagram generic-diagram diagram-${type}`}><div className="generic-shape" /><span>{type.toUpperCase()} / CONCEPT MAP</span></div>
}

function LessonQuizCallout({ lesson, navigate }) {
  return (
    <div className="lesson-quiz-callout">
      <div className="callout-copy"><div className="kicker kicker-light">READY TO CHECK?</div><h3>Make the idea stick.</h3><p>{lesson.quiz.length} questions from this lesson only. Every attempt gets a new question and option order.</p></div>
      <button className="button button-yellow button-large" onClick={() => navigate('quiz', lesson.id)}><Dices size={19} /> Start lesson {lesson.number} quiz <ArrowRight size={18} /></button>
    </div>
  )
}

function QuizPage({ lesson, bestScore, navigate, recordQuizScore }) {
  const [session, setSession] = useState(() => buildQuizSession(lesson.quiz))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [finished, setFinished] = useState(false)

  const currentQuestion = session[currentIndex]
  const chosenOption = answers[currentIndex]
  const isAnswered = chosenOption !== undefined
  const correctCount = Object.values(answers).filter((answer) => answer?.isCorrect).length
  const score = getPercent(correctCount, session.length)

  const selectAnswer = (optionIndex) => {
    if (isAnswered) return
    setAnswers((current) => ({ ...current, [currentIndex]: { optionIndex, isCorrect: currentQuestion.options[optionIndex].isCorrect } }))
  }

  const nextQuestion = () => {
    if (currentIndex === session.length - 1) {
      setFinished(true)
      recordQuizScore(lesson.id, score)
      return
    }
    setCurrentIndex((index) => index + 1)
  }

  const restart = () => {
    setSession(buildQuizSession(lesson.quiz))
    setCurrentIndex(0)
    setAnswers({})
    setFinished(false)
  }

  return (
    <div className="page quiz-page" style={{ '--lesson-color': lesson.color }}>
      <section className="quiz-shell section-pad">
        <div className="quiz-topline">
          <button className="back-link" onClick={() => navigate('lesson', lesson.id)}><ChevronLeft size={17} /> Back to lesson {lesson.number}</button>
          <div className="quiz-scope"><span className="status-dot" /> Lesson {String(lesson.id).padStart(2, '0')} only</div>
        </div>
        {!finished ? (
          <>
            <div className="quiz-heading-grid">
              <div><div className="kicker">QUIZ / FRESH SET</div><h1>Test the <span>{lesson.title}</span> layer.</h1><p>Read the question, choose the best answer, and use the explanation to lock it in.</p></div>
              <div className="quiz-score-panel"><span>QUESTIONS</span><strong>{String(currentIndex + 1).padStart(2, '0')}<small> / {String(session.length).padStart(2, '0')}</small></strong><div className="quiz-progress-track"><span style={{ width: `${((currentIndex + 1) / session.length) * 100}%` }} /></div><div className="quiz-score-panel-foot"><span>{bestScore ? `Best ${bestScore}%` : 'First attempt'}</span><span>{score}% answered correct</span></div></div>
            </div>
            <div className="quiz-question-card">
              <div className="question-card-top"><span className="question-number">Q{String(currentIndex + 1).padStart(2, '0')}</span><span className="question-kind">RECALL / {currentQuestion.difficulty || 'CORE'}</span></div>
              <h2>{currentQuestion.prompt}</h2>
              <div className="option-list">
                {currentQuestion.options.map((option, optionIndex) => {
                  const isChosen = chosenOption?.optionIndex === optionIndex
                  const reveal = isAnswered
                  const optionClass = reveal ? (option.isCorrect ? 'is-correct' : isChosen ? 'is-wrong' : '') : ''
                  return <button className={`option-button ${optionClass}`} key={`${option.text}-${optionIndex}`} onClick={() => selectAnswer(optionIndex)} disabled={isAnswered}><span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span><span className="option-text">{option.text}</span>{reveal && option.isCorrect && <Check className="option-result" size={20} strokeWidth={3} />}{reveal && isChosen && !option.isCorrect && <X className="option-result" size={20} strokeWidth={3} />}</button>
                })}
              </div>
              {isAnswered && <div className={`answer-feedback ${chosenOption.isCorrect ? 'is-correct' : 'is-wrong'}`}><div className="feedback-mark">{chosenOption.isCorrect ? <Check size={19} strokeWidth={3} /> : <X size={19} strokeWidth={3} />}</div><div><strong>{chosenOption.isCorrect ? 'Correct.' : 'Not quite.'}</strong><p>{currentQuestion.explanation}</p></div></div>}
              <div className="question-card-bottom"><span className="answer-note">{isAnswered ? 'Explanation unlocked' : 'Choose one answer to continue'}</span>{isAnswered ? <button className="button button-dark button-large" onClick={nextQuestion}>{currentIndex === session.length - 1 ? 'See results' : 'Next question'} <ArrowRight size={18} /></button> : <span className="question-lock"><CircleHelp size={15} /> Select an option</span>}</div>
            </div>
            <div className="quiz-controls"><button className="quiz-control-button" onClick={restart}><RotateCcw size={16} /> New shuffled set</button><span><Dices size={15} /> Questions and options are randomized for this attempt.</span></div>
          </>
        ) : (
          <QuizResults lesson={lesson} session={session} answers={answers} correctCount={correctCount} bestScore={bestScore} onRestart={restart} navigate={navigate} />
        )}
      </section>
    </div>
  )
}

function QuizResults({ lesson, session, answers, correctCount, bestScore, onRestart, navigate }) {
  const score = getPercent(correctCount, session.length)
  const resultMessage = score >= 90 ? 'Excellent recall.' : score >= 70 ? 'Solid foundation.' : 'Good first pass.'
  return (
    <div className="results-view">
      <div className="result-hero">
        <div className="kicker">SET COMPLETE / LESSON {String(lesson.id).padStart(2, '0')}</div>
        <h1>{resultMessage}</h1>
        <p>You answered {correctCount} of {session.length} questions correctly.</p>
        <div className="result-score-ring" style={{ '--score': `${score * 3.6}deg` }}><div><strong>{score}%</strong><span>this attempt</span></div></div>
        <div className="result-stats"><div><span>Correct</span><strong>{correctCount}/{session.length}</strong></div><div><span>Best score</span><strong>{Math.max(bestScore, score)}%</strong></div><div><span>Next step</span><strong>{score >= 70 ? 'Keep moving' : 'Review notes'}</strong></div></div>
        <div className="result-actions"><button className="button button-dark button-large" onClick={onRestart}><Dices size={19} /> Try a new shuffle</button><button className="button button-light button-large" onClick={() => navigate('lesson', lesson.id)}>Review lesson <BookOpen size={18} /></button></div>
      </div>
      <div className="review-panel"><div className="review-heading"><div><div className="kicker">SET REVIEW</div><h2>Keep the misses close.</h2></div><span>{session.length} questions</span></div><div className="review-list">{session.map((question, index) => { const wasCorrect = Boolean(answers[index]?.isCorrect); return <div className={`review-row ${wasCorrect ? 'is-correct' : 'is-wrong'}`} key={`${question.id}-${index}`}><span className="review-status">{wasCorrect ? <Check size={15} strokeWidth={3} /> : <X size={15} strokeWidth={3} />}</span><div><strong>{question.prompt}</strong><p>{wasCorrect ? 'You got this one.' : question.explanation}</p></div><span className="review-index">{String(index + 1).padStart(2, '0')}</span></div> })}</div></div>
    </div>
  )
}

function Footer({ navigate }) {
  return (
    <footer className="footer section-pad">
      <div className="footer-brand"><div className="brand-lockup"><span className="brand-mark" aria-hidden="true"><span /></span><span className="brand-name">EARTH<span>LAB</span></span></div><p>Study tools for curious geologists.</p></div>
      <div className="footer-links"><button onClick={() => navigate('home')}>Course map</button><button onClick={() => navigate('lesson', 1)}>Study guide</button><button onClick={() => navigate('quiz', 1)}>Quiz lab</button></div>
      <div className="footer-end">PHYSICAL + GEOLOGICAL STRUCTURE<br /><span>Built for review, not autopilot.</span></div>
    </footer>
  )
}

export default App
