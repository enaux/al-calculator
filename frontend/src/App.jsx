import { useState } from 'react'

const LEAVE_TABLE = {
  CNM: { '0-5': 25, '6-10': 26, '10+': 28 },
  SN:  { '0-5': 24, '6-10': 25, '10+': 27 },
}

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

function fmt(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function App() {
  const { start: yearStart, end: yearEnd } = getLeaveYear()
  // yearEnd is April 1 (exclusive); last displayed day is March 31
  const yearLastDay = new Date(yearEnd.getFullYear(), yearEnd.getMonth(), yearEnd.getDate() - 1)

  const [grade, setGrade] = useState('')
  const [years, setYears] = useState('')
  const [hours, setHours] = useState('')
  const [startDate, setStartDate] = useState('')
  const [result, setResult] = useState(null)
  const [errors, setErrors] = useState({})

  function validate() {
    const errs = {}

    if (!grade) {
      errs.grade = 'Please select a grade.'
    }

    if (!years) {
      errs.years = 'Please select years of service.'
    }

    const h = parseFloat(hours)
    if (!hours.trim()) {
      errs.hours = 'Please enter your weekly contracted hours.'
    } else if (isNaN(h) || h <= 0) {
      errs.hours = 'Weekly hours must be greater than 0.'
    } else if (h > 37.5) {
      errs.hours = 'Weekly hours cannot exceed 37.5.'
    }

    if (!startDate) {
      errs.startDate = 'Please enter your employment start date.'
    } else {
      const d = parseDate(startDate)
      if (d < yearStart) {
        errs.startDate = `Start date cannot be before the leave year start (${fmt(yearStart)}).`
      } else if (d >= yearEnd) {
        errs.startDate = `Start date must fall within the current leave year (on or before ${fmt(yearLastDay)}).`
      }
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
    const daysWorked = Math.round((yearEnd - start) / (1000 * 60 * 60 * 24))
    const pctYear = daysWorked / 365
    const pctWeek = parseFloat(hours) / 37.5
    const fullEntitlement = LEAVE_TABLE[grade][years]
    const proRataDays = fullEntitlement * pctYear * pctWeek
    const leaveHours = proRataDays * 7.5

    setResult({
      daysWorked,
      proRataDays: proRataDays.toFixed(2),
      leaveHours: leaveHours.toFixed(2),
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
    <main>
      <h1>HSE Annual Leave Calculator</h1>
      <p>Leave year: {fmt(yearStart)} to {fmt(yearLastDay)}</p>

      <form onSubmit={handleSubmit} noValidate>

        <div>
          <label htmlFor="grade">Grade</label>
          <select id="grade" value={grade} onChange={e => setGrade(e.target.value)}>
            <option value="">Select a grade</option>
            <option value="CNM">Clinical Nurse Manager</option>
            <option value="SN">Staff Nurse</option>
          </select>
          {errors.grade && <p role="alert">{errors.grade}</p>}
        </div>

        <div>
          <label htmlFor="years">Years of service</label>
          <select id="years" value={years} onChange={e => setYears(e.target.value)}>
            <option value="">Select years of service</option>
            <option value="0-5">0–5 years</option>
            <option value="6-10">6–10 years</option>
            <option value="10+">10+ years</option>
          </select>
          {errors.years && <p role="alert">{errors.years}</p>}
        </div>

        <div>
          <label htmlFor="hours">Weekly contracted hours</label>
          <input
            id="hours"
            type="number"
            min="0.5"
            max="37.5"
            step="0.5"
            placeholder="e.g. 37.5"
            value={hours}
            onChange={e => setHours(e.target.value)}
          />
          {errors.hours && <p role="alert">{errors.hours}</p>}
        </div>

        <div>
          <label htmlFor="startDate">Employment start date</label>
          <input
            id="startDate"
            type="date"
            min={fmt(yearStart)}
            max={fmt(yearLastDay)}
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
          {errors.startDate && <p role="alert">{errors.startDate}</p>}
        </div>

        <button type="submit">Calculate</button>
        <button type="button" onClick={handleReset}>Reset</button>

      </form>

      {result && (
        <section aria-live="polite">
          <h2>Result</h2>
          <p>Days worked this leave year: <strong>{result.daysWorked}</strong></p>
          <p>Pro-rata leave entitlement: <strong>{result.proRataDays} days</strong></p>
          <p>Annual leave hours: <strong>{result.leaveHours} hours</strong></p>
        </section>
      )}
    </main>
  )
}
