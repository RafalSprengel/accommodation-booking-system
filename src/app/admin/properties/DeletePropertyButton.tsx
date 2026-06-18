'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteProperty } from '@/actions/adminPropertyActions'
import Button from '@/app/_components/UI/Button/Button'
import Modal from '@/app/_components/Modal/Modal'
import styles from './page.module.css'

interface DeletePropertyButtonProps {
  propertyId: string
  propertyName: string
}

export default function DeletePropertyButton({
  propertyId,
  propertyName,
}: DeletePropertyButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      await deleteProperty(propertyId)
      router.refresh()
      setShowConfirm(false)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unknown error occurred.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="danger"
        onClick={() => {
          setError(null)
          setShowConfirm(true)
        }}
      >
        🗑️ Delete
      </Button>
      
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Confirm deletion"
        confirmText="Yes, delete"
        loadingText="Deleting"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isDeleting}
      >
        <p>
          Are you sure you want to permanently delete the cottage "<b>{propertyName}</b>"?
          This action cannot be undone.
        </p>
        {error && <p style={{ color: '#ef4444', marginTop: '12px' }}>{error}</p>}
      </Modal>
    </>
  )
}