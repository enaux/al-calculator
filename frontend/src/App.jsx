import { useState, useEffect } from 'react'
import './App.css'

const LEAVE_TABLE = {
  CNM: { '0-5': 25, '6-10': 26, '10+': 28 },
  SN:  { '0-5': 24, '6-10': 25, '10+': 27 },
}

const GRADE_LABELS = { CNM: 'Clinical Nurse Manager', SN: 'Staff Nurse' }
const MS_PER_DAY = 1000 * 60 * 60 * 24

function getLeaveYear() {
  const today = new Date()
  const month = today.getMonth() // 0-indexed; April = 3
  const year = today.getFullYear()
  if (month < 3) {
    // Jan–Mar: leave year started last April, ends this March 31
    return { start: new Date(year - 1, 3, 1), end: new Date(year, 3, 1) }
  }
  // Apr–Dec: leave year started this April, ends next March 31
  return { start: new Date(year, 3, 1), end: new Date(year + 1, 3, 1) }
}

// Parse date string as local time to avoid UTC offset shifting the day
function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// ISO format for HTML date input value and min/max attributes
function fmtISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Display format dd/mm/yyyy for all user-facing text
function fmtDisplay(date) {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

// Returns the April 1 that opens the employment year containing `date`
function employmentYearOf(date) {
  const april1 = new Date(date.getFullYear(), 3, 1)
  return date >= april1
    ? april1
    : new Date(date.getFullYear() - 1, 3, 1)
}

// Maps completed years of service to the correct entitlement tier key
function yearsToTier(y) {
  if (y < 6) return '0-5'
  if (y <= 10) return '6-10'
  return '10+'
}

// Build one segment per employment year from `start` to `yearEnd`.
// currentYearStart is the April 1 that opened the current employment year.
// currentYearsOfService is the completed years of service as of that April 1.
// Each segment derives its own tier by stepping back one year per segment.
function buildYearSegments(start, yearEnd, currentYearStart, currentYearsOfService, grade, pctWeek) {
  const segments = []
  let cursor = employmentYearOf(start)

  while (cursor < yearEnd) {
    const segEnd = new Date(cursor.getFullYear() + 1, 3, 1)
    const effectiveStart = start > cursor ? start : cursor
    // day-0 trick: last day of the month before April = March 31, DST-safe
    const lastDay = new Date(segEnd.getFullYear(), segEnd.getMonth(), 0)

    // Years of service at the start of this segment, working backwards from current
    const yearsBack = currentYearStart.getFullYear() - cursor.getFullYear()
    const yearsAtSeg = Math.max(0, currentYearsOfService - yearsBack)
    const tier = yearsToTier(yearsAtSeg)
    const fullEntitlement = LEAVE_TABLE[grade][tier]

    // Actual days in this employment year — handles leap years automatically
    const daysInYear = Math.round((segEnd - cursor) / MS_PER_DAY)
    const daysWorked = Math.round((segEnd - effectiveStart) / MS_PER_DAY)
    const proRata = fullEntitlement * (daysWorked / daysInYear) * pctWeek

    segments.push({
      label: `${fmtDisplay(effectiveStart)} – ${fmtDisplay(lastDay)}`,
      yearsAtSeg,
      tier,
      fullEntitlement,
      daysWorked,
      daysInYear,
      proRata,
    })

    cursor = segEnd
  }

  return segments
}

export default function App() {
  const { start: yearStart, end: yearEnd } = getLeaveYear()
  // yearEnd is April 1 (exclusive); last displayed day is March 31
  const yearLastDay = new Date(yearEnd.getFullYear(), yearEnd.getMonth(), 0)

  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = localStorage.getItem('theme')
      if (stored) return stored === 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return false
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light') } catch {}
  }, [isDark])

  const [grade, setGrade] = useState('')
  const [years, setYears] = useState('')
  const [hours, setHours] = useState('')
  const [startDate, setStartDate] = useState('')
  const [result, setResult] = useState(null)
  const [errors, setErrors] = useState({})

  function handleIntKeyDown(e) {
    // Allow digits and navigation keys only — no decimal point
    const allowed = [
      '0','1','2','3','4','5','6','7','8','9',
      'Backspace','Delete','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End',
    ]
    if (!allowed.includes(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
    }
  }

  function handleHoursKeyDown(e) {
    // Allow digits, decimal point, and navigation keys
    const allowed = [
      '0','1','2','3','4','5','6','7','8','9','.',
      'Backspace','Delete','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End',
    ]
    if (!allowed.includes(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
    }
  }

  function validate() {
    const errs = {}

    if (!grade) errs.grade = 'Please select a grade.'

    const y = parseInt(years, 10)
    if (!years.trim()) {
      errs.years = 'Please enter years of service.'
    } else if (isNaN(y) || y < 0) {
      errs.years = 'Years of service must be 0 or greater.'
    }

    const h = parseFloat(hours)
    if (!hours.trim()) {
      errs.hours = 'Please enter weekly contracted hours.'
    } else if (isNaN(h) || h <= 0) {
      errs.hours = 'Weekly hours must be greater than 0.'
    }

    if (!startDate) {
      errs.startDate = 'Please enter start date.'
    } else if (parseDate(startDate) >= yearEnd) {
      errs.startDate = `Start date must be before ${fmtDisplay(yearLastDay)}.`
    }

    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      setResult(null)
      return
    }

    const start = parseDate(startDate)
    const h = parseFloat(hours)
    const currentYearsOfService = parseInt(years, 10)
    const pctWeek = h / 37.5

    const yearSegments = buildYearSegments(start, yearEnd, yearStart, currentYearsOfService, grade, pctWeek)
    const totalProRataDays = yearSegments.reduce((sum, s) => sum + s.proRata, 0)
    const totalLeaveHours = totalProRataDays * 7.5

    setResult({
      yearSegments,
      hours: h,
      yearsOfService: currentYearsOfService,
      totalProRataDays: totalProRataDays.toFixed(2),
      totalLeaveHours: totalLeaveHours.toFixed(2),
      gradeLabel: GRADE_LABELS[grade],
      employmentPeriod: `${fmtDisplay(start)} – ${fmtDisplay(yearLastDay)}`,
    })
  }

  function handleReset() {
    setGrade('')
    setYears('')
    setHours('')
    setStartDate('')
    setResult(null)
    setErrors({})
  }

  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          <div className="header-title">
            <h1>HSE Nursing</h1>
            <p>Annual Leave Calculator</p>
          </div>
          <button
            className="theme-toggle"
            onClick={() => setIsDark(d => !d)}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? '☀ Light' : '🌙 Dark'}
          </button>
        </div>
      </header>

      <main className="app-main">
        <p className="employment-year">
          Current Employment Year: {fmtDisplay(yearStart)} – {fmtDisplay(yearLastDay)}
        </p>

        <div className="card">
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-fields">

              <div className="field">
                <label htmlFor="grade">Grade</label>
                <select id="grade" value={grade} onChange={e => setGrade(e.target.value)}>
                  <option value="">Select a grade</option>
                  <option value="CNM">Clinical Nurse Manager</option>
                  <option value="SN">Staff Nurse</option>
                </select>
                {errors.grade && <p className="error-msg" role="alert">{errors.grade}</p>}
              </div>

              <div className="field">
                <label htmlFor="years">Years of Service</label>
                <input
                  id="years"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="completed years as of today"
                  value={years}
                  onChange={e => setYears(e.target.value)}
                  onKeyDown={handleIntKeyDown}
                />
                {errors.years && <p className="error-msg" role="alert">{errors.years}</p>}
              </div>

              <div className="field">
                <label htmlFor="hours">Weekly Hours</label>
                <input
                  id="hours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="standard hours = 37.5"
                  value={hours}
                  onChange={e => setHours(e.target.value)}
                  onKeyDown={handleHoursKeyDown}
                />
                {errors.hours && <p className="error-msg" role="alert">{errors.hours}</p>}
              </div>

              <div className="field">
                <label htmlFor="startDate">Start Date</label>
                <input
                  id="startDate"
                  type="date"
                  max={fmtISO(yearLastDay)}
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
                {errors.startDate && <p className="error-msg" role="alert">{errors.startDate}</p>}
              </div>

            </div>

            <div className="btn-row">
              <button type="submit" className="btn btn-primary">Calculate</button>
              <button type="button" className="btn btn-secondary" onClick={handleReset}>Reset</button>
            </div>
          </form>
        </div>

        {result && (
          <section className="card" aria-live="polite">
            <h2 className="card-title">Result</h2>

            <p className="result-meta">
              {result.gradeLabel} &nbsp;·&nbsp; {result.yearsOfService} yrs service &nbsp;·&nbsp; {result.hours} hrs/wk
              <br />
              Employment Period: {result.employmentPeriod}
            </p>

            <div className="segments">
              {result.yearSegments.map((seg, i) => (
                <div className="segment" key={i}>
                  <div className="segment-top">
                    <span className="segment-range">{seg.label}</span>
                    <span className="segment-badge">{seg.tier} yrs &nbsp;·&nbsp; {seg.fullEntitlement} days</span>
                  </div>
                  <div className="segment-bottom">
                    <span className="segment-formula">
                      {seg.fullEntitlement} &times; ({seg.daysWorked}/{seg.daysInYear}) &times; ({result.hours}/37.5)
                    </span>
                    <span className="segment-result">{seg.proRata.toFixed(2)} days</span>
                  </div>
                </div>
              ))}
            </div>

            {result.yearSegments.length > 1 && (
              <p className="sum-line">
                {result.yearSegments.map(s => s.proRata.toFixed(2)).join(' + ')}
              </p>
            )}

            <div className="result-totals">
              <div className="total-row">
                <span className="total-label">Pro-rata leave entitlement</span>
                <span className="total-value">{result.totalProRataDays} days</span>
              </div>
              <div className="total-row">
                <span className="total-label">Equivalent annual leave hours</span>
                <span className="total-value">{result.totalLeaveHours} hours</span>
              </div>
              <p className="total-sub">{result.totalProRataDays} days &times; 7.5 hours</p>
            </div>
          </section>
        )}
      </main>
    </>
  )
}
