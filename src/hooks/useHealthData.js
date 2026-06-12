import { useState, useCallback } from 'react'
import {
  doc, getDoc, setDoc, updateDoc, collection,
  query, where, getDocs, addDoc, serverTimestamp, deleteDoc
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { today } from '../utils/dateUtils'

const nanoid = () => Math.random().toString(36).slice(2, 10)

// ─── Date doc helpers ───────────────────────────────────────────────────────

const getDateDoc = async (dateStr) => {
  const ref = doc(db, 'dates', dateStr)
  const snap = await getDoc(ref)
  return snap.exists()
    ? snap.data()
    : { date: dateStr, bloodPressures: [], temperatures: [], weights: [], injections: [], events: [] }
}

const saveDateDoc = async (dateStr, data) => {
  const ref = doc(db, 'dates', dateStr)
  await setDoc(ref, { ...data, date: dateStr }, { merge: true })
}

// ─── Blood Pressure ─────────────────────────────────────────────────────────

export const addBloodPressure = async (dateStr, record) => {
  const data = await getDateDoc(dateStr)
  const entry = { id: nanoid(), ...record, recordedAt: new Date().toISOString() }
  data.bloodPressures = [...(data.bloodPressures || []), entry]
  await saveDateDoc(dateStr, data)
  return entry
}

export const updateBloodPressure = async (dateStr, id, record) => {
  const data = await getDateDoc(dateStr)
  data.bloodPressures = (data.bloodPressures || []).map(r => r.id === id ? { ...r, ...record } : r)
  await saveDateDoc(dateStr, data)
}

export const deleteBloodPressure = async (dateStr, id) => {
  const data = await getDateDoc(dateStr)
  data.bloodPressures = (data.bloodPressures || []).filter(r => r.id !== id)
  await saveDateDoc(dateStr, data)
}

// ─── Temperature ────────────────────────────────────────────────────────────

export const addTemperature = async (dateStr, record) => {
  const data = await getDateDoc(dateStr)
  const entry = { id: nanoid(), ...record, recordedAt: new Date().toISOString() }
  data.temperatures = [...(data.temperatures || []), entry]
  await saveDateDoc(dateStr, data)
  return entry
}

export const updateTemperature = async (dateStr, id, record) => {
  const data = await getDateDoc(dateStr)
  data.temperatures = (data.temperatures || []).map(r => r.id === id ? { ...r, ...record } : r)
  await saveDateDoc(dateStr, data)
}

export const deleteTemperature = async (dateStr, id) => {
  const data = await getDateDoc(dateStr)
  data.temperatures = (data.temperatures || []).filter(r => r.id !== id)
  await saveDateDoc(dateStr, data)
}

// ─── Weight ─────────────────────────────────────────────────────────────────

export const addWeight = async (dateStr, record) => {
  const data = await getDateDoc(dateStr)
  const entry = { id: nanoid(), ...record, recordedAt: new Date().toISOString() }
  data.weights = [...(data.weights || []), entry]
  await saveDateDoc(dateStr, data)
  return entry
}

export const updateWeight = async (dateStr, id, record) => {
  const data = await getDateDoc(dateStr)
  data.weights = (data.weights || []).map(r => r.id === id ? { ...r, ...record } : r)
  await saveDateDoc(dateStr, data)
}

export const deleteWeight = async (dateStr, id) => {
  const data = await getDateDoc(dateStr)
  data.weights = (data.weights || []).filter(r => r.id !== id)
  await saveDateDoc(dateStr, data)
}

// ─── Injection ──────────────────────────────────────────────────────────────

export const addInjection = async (dateStr, record) => {
  const data = await getDateDoc(dateStr)
  const entry = { id: nanoid(), ...record, recordedAt: new Date().toISOString() }
  data.injections = [...(data.injections || []), entry]
  await saveDateDoc(dateStr, data)
  return entry
}

export const updateInjection = async (dateStr, id, record) => {
  const data = await getDateDoc(dateStr)
  data.injections = (data.injections || []).map(r => r.id === id ? { ...r, ...record } : r)
  await saveDateDoc(dateStr, data)
}

export const deleteInjection = async (dateStr, id) => {
  const data = await getDateDoc(dateStr)
  data.injections = (data.injections || []).filter(r => r.id !== id)
  await saveDateDoc(dateStr, data)
}

// ─── Events ─────────────────────────────────────────────────────────────────

export const addEvent = async (dateStr, record) => {
  const data = await getDateDoc(dateStr)
  const entry = { id: nanoid(), ...record, recordedAt: new Date().toISOString() }
  data.events = [...(data.events || []), entry]
  await saveDateDoc(dateStr, data)
  return entry
}

export const updateEvent = async (dateStr, id, record) => {
  const data = await getDateDoc(dateStr)
  data.events = (data.events || []).map(r => r.id === id ? { ...r, ...record } : r)
  await saveDateDoc(dateStr, data)
}

export const deleteEvent = async (dateStr, id) => {
  const data = await getDateDoc(dateStr)
  data.events = (data.events || []).filter(r => r.id !== id)
  await saveDateDoc(dateStr, data)
}

// ─── Fetch helpers ───────────────────────────────────────────────────────────

export const fetchDayData = async (dateStr) => {
  return getDateDoc(dateStr)
}

export const fetchRangeData = async (start, end) => {
  const q = query(
    collection(db, 'dates'),
    where('date', '>=', start),
    where('date', '<=', end)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ date: d.id, data: d.data() }))
}

// ─── Injection Schedules ─────────────────────────────────────────────────────

export const fetchSchedules = async () => {
  const snap = await getDocs(collection(db, 'injectionSchedules'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const addSchedule = async (drugName, period) => {
  const ref = await addDoc(collection(db, 'injectionSchedules'), {
    drugName,
    active: true,
    periodHistory: [{ period, startDate: today() }],
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export const updateSchedulePeriod = async (id, newPeriod, startDate) => {
  const ref = doc(db, 'injectionSchedules', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data = snap.data()
  const history = [...(data.periodHistory || []), { period: newPeriod, startDate }]
  await updateDoc(ref, { periodHistory: history })
}

export const toggleScheduleActive = async (id, active) => {
  await updateDoc(doc(db, 'injectionSchedules', id), { active })
}

export const deleteSchedule = async (id) => {
  await deleteDoc(doc(db, 'injectionSchedules', id))
}

export const getCurrentPeriod = (schedule, asOf = today()) => {
  const history = [...(schedule.periodHistory || [])].sort(
    (a, b) => a.startDate.localeCompare(b.startDate)
  )
  let period = history[0]?.period ?? 7
  for (const h of history) {
    if (h.startDate <= asOf) period = h.period
  }
  return period
}
