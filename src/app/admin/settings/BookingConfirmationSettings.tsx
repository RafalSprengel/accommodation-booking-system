'use client'

import { useState, useEffect } from 'react'
import { getSiteSettings, updateSiteSettings } from '@/actions/siteSettingsActions'
import { toast } from 'react-hot-toast'
import AdminCard from '../_components/AdminCard/AdminCard'
import styles from './settings.module.css'
import siteStyles from './SiteSettingsForm.module.css'

export default function BookingConfirmationSettings() {
  const [isLoading, setIsLoading] = useState(true)
  const [isTogglePending, setIsTogglePending] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmationEnabled, setConfirmationEnabled] = useState(true)
  const [email, setEmail] = useState('')
  const [initialEmail, setInitialEmail] = useState('')

  useEffect(() => {
    async function load() {
      const data = await getSiteSettings()
      const enabled = data?.sendBookingConfirmationEmails ?? true
      const notifEmail = data?.bookingNotificationsEmail ?? data?.email ?? ''
      setConfirmationEnabled(enabled)
      setEmail(notifEmail)
      setInitialEmail(notifEmail)
      setIsLoading(false)
    }
    load()
  }, [])

  const handleToggle = async () => {
    const newValue = !confirmationEnabled
    setConfirmationEnabled(newValue)
    setIsTogglePending(true)
    try {
      const result = await updateSiteSettings({ sendBookingConfirmationEmails: newValue })
      if (result.success) {
        toast.success(result.message)
      } else {
        setConfirmationEnabled(!newValue)
        toast.error(result.message)
      }
    } catch (err) {
      console.error(err)
      setConfirmationEnabled(!newValue)
      toast.error('Błąd zapisu ustawień')
    } finally {
      setIsTogglePending(false)
    }
  }

  const hasEmailChanges = email !== initialEmail

  const handleSaveEmail = async () => {
    if (!hasEmailChanges) return
    setIsSaving(true)
    try {
      const result = await updateSiteSettings({ bookingNotificationsEmail: email })
      if (result.success) {
        toast.success(result.message)
        setInitialEmail(email)
        setIsEditing(false)
      } else {
        toast.error(result.message)
      }
    } catch (err) {
      console.error(err)
      toast.error('Błąd zapisu ustawień')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AdminCard title="Potwierdzenie rezerwacji" badge="Globalne">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Loading...</p>
        </div>
      </AdminCard>
    )
  }

  return (
    <AdminCard title="Potwierdzenie rezerwacji" badge="Globalne">
      <div className={styles.settingRow}>
        <div className={styles.settingContent}>
          <label className={styles.settingLabel}>Wysyłka potwierdzenia rezerwacji</label>
          <p className={styles.settingDescription}>
            Gdy ta opcja jest <strong>włączona</strong>, po każdej rezerwacji zostanie automatycznie wysłane potwierdzenie do klienta oraz powiadomienie do administratora strony.<br />
            Gdy <strong>wyłączona</strong>, żadne e-maile potwierdzające nie będą wysyłane.
          </p>
        </div>
        <div className={styles.settingControl}>
          <div className={styles.toggleWrapper}>
            <button
              type="button"
              onClick={handleToggle}
              disabled={isTogglePending}
              className={`${styles.toggleSwitch} ${confirmationEnabled ? styles.toggleOn : styles.toggleOff}${isTogglePending ? ` ${styles.toggleDisabled}` : ''}`}
              aria-pressed={confirmationEnabled}
              aria-label="Przełącz ustawienie"
            >
              <span className={styles.toggleKnob} />
            </button>
            <span className={`${styles.toggleStatusLabel} ${confirmationEnabled ? styles.statusActive : styles.statusInactive}`}>
              {confirmationEnabled ? 'WŁĄCZONE' : 'WYŁĄCZONE'}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.settingRow}>
        <div className={styles.settingContent}>
          <label className={styles.settingLabel} htmlFor="booking-admin-email">
            Adres e-mail dla powiadomień
          </label>
          <p className={styles.settingDescription}>
            Adres, na który wysyłane będą e-maile z potwierdzeniami o rezerwacjach do admina.
          </p>
        </div>
        <div className={styles.settingControl}>
          <div className={siteStyles.siteSettings__inputGroup}>
            <div className={siteStyles.siteSettings__editHeader}>
              <button
                type="button"
                className={siteStyles.siteSettings__toggleEdit}
                onClick={() => {
                  if (isEditing) setEmail(initialEmail)
                  setIsEditing(!isEditing)
                }}
              >
                {isEditing ? 'Anuluj' : 'Edytuj'}
              </button>
            </div>
            <input
              id="booking-admin-email"
              type="email"
              className={siteStyles.siteSettings__input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isEditing}
              placeholder="admin@example.com"
            />
            {isEditing && (
              <div className={siteStyles.siteSettings__actions}>
                <button
                  type="button"
                  className={siteStyles.siteSettings__saveBtn}
                  onClick={handleSaveEmail}
                  disabled={!hasEmailChanges || isSaving}
                >
                  {isSaving ? 'Zapisywanie...' : 'Zapisz'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminCard>
  )
}
