'use client'

import { useState, useEffect } from 'react'
import { authClient } from '@/lib/auth-client'
import { toast } from 'react-hot-toast'
import { changeAdminEmail } from '@/actions/adminEmailActions'
import styles from './AdminAccountSettings.module.css'
import AdminSection from '@/app/_components/UI/AdminSection/AdminSection'

export default function AdminAccountSettings() {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [currentPasswordError, setCurrentPasswordError] = useState<string>('')
  const [newPasswordError, setNewPasswordError] = useState<string>('')
  const [emailVerificationSentTo, setEmailVerificationSentTo] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user) {
      const user = session.user as any
      const u = user.displayUsername !== undefined && user.displayUsername !== null
        ? user.displayUsername
        : user.username

      if (u !== undefined && u !== null) {
        setUsername(u)
      } else {
        throw new Error('Data integrity error: User profile does not have a username.')
      }

      if (user.email !== undefined && user.email !== null) {
        setEmail(user.email)
      }
    }
  }, [session])

  if (sessionPending || username === null || email === null) {
    return (
      <AdminSection title="Admin data" badge="Profile">
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
        </div>
      </AdminSection>
    )
  }

  if (!session?.user) {
    throw new Error('No active admin session.')
  }

  const user = session.user as any
  const dbDisplayUsername = user.displayUsername !== undefined && user.displayUsername !== null
    ? user.displayUsername
    : user.username
  const dbEmail = user.email

  const hasChanges = (username !== dbDisplayUsername && username.length > 0) || (email !== dbEmail && email.length > 0) || password.length > 0
  const passwordsMatch = password === confirmPassword
  const canSave = hasChanges && (password.length > 0 ? passwordsMatch && currentPassword.length > 0 : true)

  const handleSave = async () => {
    if (!hasChanges) return
    setIsSaving(true)

    try {
      if (username !== dbDisplayUsername) {
        if (username.length === 0) {
          toast.error('Login cannot be empty.')
          return
        }

        const updateResult = await authClient.updateUser({
          username: username,
          displayUsername: username,
        })
        const updateError = updateResult?.error
        if (updateError) {
          console.error('authClient.updateUser error:', updateError)
          toast.error(updateError.message ?? JSON.stringify(updateError))
          return
        }
      }

      if (email !== dbEmail) {
        if (email.length === 0) {
          toast.error('Email cannot be empty.')
          return
        }

        const result = await changeAdminEmail(email)
        if (!result.success) {
          toast.error(result.error ?? 'Failed to change email address.')
          return
        }

        setEmailVerificationSentTo(email)
        setIsEditing(false)
        setPassword('')
        setConfirmPassword('')
        setCurrentPassword('')
        setCurrentPasswordError('')
        setNewPasswordError('')
        setIsSaving(false)
        return
      }

      if (password.length > 0) {
        if (!passwordsMatch) {
          return
        }

        const { error: passwordError } = await authClient.changePassword({
          newPassword: password,
          currentPassword: currentPassword,
        })

        if (passwordError) {
          const msg = passwordError.message?.toLowerCase() || ''
          if (msg.includes('invalid password') || msg.includes('incorrect') || msg.includes('wrong') || msg.includes('current password')) {
            setCurrentPasswordError('Current password is incorrect.')
          } else if (msg.includes('character') || msg.includes('short') || msg.includes('length')) {
            setNewPasswordError('New password must be at least 5 characters.')
          } else {
            setNewPasswordError(passwordError.message || 'An error occurred while changing the password.')
          }
          return
        }
      }

      toast.success('Admin data has been successfully updated.')
      setIsEditing(false)
      setPassword('')
      setConfirmPassword('')
      setCurrentPassword('')
      setCurrentPasswordError('')
      setNewPasswordError('')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while saving changes.'
      console.error('Error updating admin data:', error)
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleEdit = () => {
    setEmailVerificationSentTo(null)
    if (isEditing) {
      const user = session.user as any
      const u = user.displayUsername !== undefined && user.displayUsername !== null
        ? user.displayUsername
        : user.username

      if (u !== undefined && u !== null) {
        setUsername(u)
      }
      if (user.email !== undefined && user.email !== null) {
        setEmail(user.email)
      }
      setPassword('')
      setConfirmPassword('')
      setCurrentPassword('')
      setCurrentPasswordError('')
      setNewPasswordError('')
    }
    setIsEditing(!isEditing)
  }

  return (
    <AdminSection
      title="Admin data"
      badge="Profile"
      description="This data is not displayed anywhere on the site; it is only used for logging into the admin panel."
    >

      {emailVerificationSentTo && (
        <div style={{
          margin: '16px 0',
          padding: '14px 18px',
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '8px',
          color: '#166534',
          fontSize: '0.92rem',
          lineHeight: '1.5',
        }}>
          <strong>Email address changed</strong> to <strong>{emailVerificationSentTo}</strong>.
        </div>
      )}

      <div className={styles.accountSettings__editHeader}>
        <button
          type="button"
          className={styles.accountSettings__toggleEdit}
          onClick={handleToggleEdit}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className={styles.accountSettings__form}>
        <div className={styles.accountSettings__inputGroup}>
          <label htmlFor="admin-username">Login (username):</label>
          <input
            id="admin-username"
            type="text"
            className={styles.accountSettings__input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={!isEditing}
            placeholder="Enter login"
          />
        </div>

        <div className={styles.accountSettings__inputGroup}>
          <label htmlFor="admin-email">Email:</label>
          <input
            id="admin-email"
            type="email"
            className={styles.accountSettings__input}
            value={email || ''}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!isEditing}
            placeholder="Enter email"
          />
        </div>

        {isEditing && (
          <div className={styles.accountSettings__inputGroup}>
            <label htmlFor="current-password">Current password:</label>
            <input
              id="current-password"
              type="password"
              className={`${styles.accountSettings__input} ${currentPasswordError ? styles['accountSettings__input--error'] : ''}`}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value)
                setCurrentPasswordError('')
              }}
              placeholder="Enter current password"
            />
            {currentPasswordError && (
              <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>{currentPasswordError}</span>
            )}
          </div>
        )}

        <div className={styles.accountSettings__inputGroup}>
          <label htmlFor="admin-password">{isEditing ? 'New password:' : 'Password:'}</label>
          <input
            id="admin-password"
            type="password"
            className={`${styles.accountSettings__input} ${newPasswordError ? styles['accountSettings__input--error'] : ''} ${password.length > 0 && confirmPassword.length > 0 && !passwordsMatch ? styles['accountSettings__input--error'] : ''}`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setNewPasswordError('')
            }}
            disabled={!isEditing}
            placeholder={isEditing ? 'Enter new password' : '••••••••'}
          />
          {newPasswordError && (
            <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>{newPasswordError}</span>
          )}
        </div>

        {isEditing && (
          <div className={styles.accountSettings__inputGroup}>
            <label htmlFor="confirm-password">Repeat new password:</label>
            <input
              id="confirm-password"
              type="password"
              className={`${styles.accountSettings__input} ${password.length > 0 && confirmPassword.length > 0 && !passwordsMatch ? styles['accountSettings__input--error'] : ''}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Enter new password again"
            />
            {password.length > 0 && confirmPassword.length > 0 && !passwordsMatch && (
              <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>Passwords do not match!</span>
            )}
          </div>
        )}

        {isEditing && (
          <div className={styles.accountSettings__actions}>
            <button
              type="button"
              className={styles.accountSettings__saveBtn}
              onClick={handleSave}
              disabled={!canSave || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </AdminSection>
  )
}