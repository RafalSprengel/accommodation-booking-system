'use client'

import React from 'react'
import { SearchOption } from '@/actions/searchActions'
import Button from '@/app/_components/UI/Button/Button'
import QuantityPicker from '../../_components/QuantityPicker/QuantityPicker'
import styles from './page.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBed } from '@fortawesome/free-solid-svg-icons'

interface ResultCardProps {
  option: SearchOption
  extraBeds: number
  onExtraBedsChange: (displayName: string, value: number) => void
  onSelect: (option: SearchOption) => void
  childrenFreeAgeLimit: number
}

export default function ResultCard({
  option,
  extraBeds,
  onExtraBedsChange,
  onSelect,
  childrenFreeAgeLimit
}: ResultCardProps) {
  const totalPriceWithExtraBeds = option.totalPrice + (extraBeds * option.extraBedPrice)

  return (
    <div className={styles.resultCard}>
      <div className={styles.cardHeader}>
        <span className={`${styles.cardBadge} ${styles.badgeCabin}`}>
          SINGLE COTTAGE
        </span>
      </div>

      <h4 className={styles.cardTitle}>{option.displayName}</h4>

      <p className={styles.cardDesc}>{option.description}</p>


      {/* <div className={styles.cardDetails}>
        <span>Max. adults: {option.maxAdults}</span>
        <span className={styles.separator}> • </span>
        <span>Max. children (free): {option.maxChildren}</span>
        <span className={styles.separator}> • </span>
        <span>Max. extra beds: {option.maxExtraBeds}</span>
      </div> */}

      {option.maxExtraBeds > 0 && (
        <div className={styles.extraBedsSection}>
          <div className={styles.extraBedsHeader}>
            <FontAwesomeIcon icon={faBed} className={styles.bedIcon} />
            <span className={styles.extraBedsLabel}>Number of extra beds:</span>
          </div>
          <QuantityPicker
            value={extraBeds}
            onIncrement={() => onExtraBedsChange(option.displayName, extraBeds + 1)}
            onDecrement={() => onExtraBedsChange(option.displayName, extraBeds - 1)}
            min={0}
            max={option.maxExtraBeds}
          />
          <span className={styles.extraBedsPrice}>+{extraBeds * option.extraBedPrice} zł</span>
        </div>
      )}

      <div className={styles.cardPrice}>
        <span className={styles.priceLabel}>Total price:</span>
        <span className={styles.priceValue}>{totalPriceWithExtraBeds} zł</span>
      </div>

      <Button
        className={styles.btnSelect}
        onClick={() => onSelect(option)}
      >
        I choose this option
      </Button>
    </div>
  )
}