import { useGamba } from 'gamba/react'
import {
  Fullscreen,
  formatLamports,
  useGameControls,
  useSounds,
} from 'gamba/react-ui'
import React, { useMemo, useState } from 'react'
import { ItemPreview } from './ItemPreview'
import { Slot } from './Slot'
import {
  FINAL_DELAY,
  LEGENDARY_THRESHOLD,
  NUM_SLOTS,
  REVEAL_SLOT_DELAY,
  SLOT_ITEMS,
  SOUND_LOSE,
  SOUND_PLAY,
  SOUND_REVEAL,
  SOUND_REVEAL_LEGENDARY,
  SOUND_SPIN,
  SOUND_WIN,
  SPIN_DELAY,
  SlotItem,
} from './constants'
import styles from './App.module.css'
import { generateBetArray, getSlotCombination } from './utils'

interface Result {
  payout: number
}

const Stuff: React.FC<{messages: string[]}> = ({ messages }) => {
  const [messageIndex, setMessageIndex] = React.useState(0)

  React.useEffect(
    () => {
      const timeout = setInterval(() => {
        setMessageIndex((x) => (x + 1) % messages.length)
      }, 2500)

      return () => clearTimeout(timeout)
    },
    [messages],
  )

  return (
    <>
      {messages[messageIndex]}
    </>
  )
}

export default function Slots() {
  const gamba = useGamba()
  const [spinning, setSpinning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result>()
  const [good, setGood] = useState(false)
  const [revealedSlots, setRevealedSlots] = React.useState(NUM_SLOTS)

  const [combination, setCombination] = React.useState(
    Array.from({ length: NUM_SLOTS }).map(() => SLOT_ITEMS[0]),
  )

  const sounds = useSounds({
    win: SOUND_WIN,
    lose: SOUND_LOSE,
    reveal: SOUND_REVEAL,
    revealLegendary: SOUND_REVEAL_LEGENDARY,
    spin: SOUND_SPIN,
    play: SOUND_PLAY,
  })

  const { wager } = useGameControls({
    disabled: spinning,
    wagerInput: { },
    playButton: { label: 'Spin', onClick: () => play() },
  })

  const maxPayout = gamba.house?.maxPayout ?? 0
  const bet = useMemo(
    () => generateBetArray(maxPayout, wager),
    [maxPayout, wager, gamba.user?.nonce],
  )

  const revealSlot = (combination: SlotItem[], slot = 0) => {
    sounds.reveal.play()

    const allSame = combination.slice(0, slot + 1).every((item, index, arr) => !index || item === arr[index - 1])

    if (combination[slot].multiplier >= LEGENDARY_THRESHOLD) {
      if (allSame) {
        sounds.revealLegendary.play()
      }
    }

    setRevealedSlots(slot + 1)

    if (slot === NUM_SLOTS - 1) {
      setTimeout(() => {
        setSpinning(false)
        if (allSame) {
          setGood(true)
          sounds.win.play()
        } else {
          sounds.lose.play()
        }
      }, FINAL_DELAY)
    }

    if (slot < NUM_SLOTS - 1) {
      setTimeout(() => revealSlot(combination, slot + 1), REVEAL_SLOT_DELAY)
    }
  }

  const play = async () => {
    try {
      setLoading(true)

      sounds.play.play()

      const res = await gamba.play({
        wager,
        bet,
      })

      setRevealedSlots(0)
      setGood(false)
      setSpinning(true)

      const startTime = Date.now()

      sounds.spin.play({ playbackRate: 1.2 })

      const result = await res.result()

      const multiplier = result.options[result.resultIndex] / 1000
      // Make sure we wait a minimum time of SPIN_DELAY before slots are revealed:
      const resultDelay = Date.now() - startTime
      const revealDelay = Math.max(0, SPIN_DELAY - resultDelay)

      const combination = getSlotCombination(NUM_SLOTS, multiplier, bet)

      setCombination(combination)

      setResult({ payout: result.payout })

      setTimeout(() => revealSlot(combination), revealDelay)
    } catch (err) {
      // Reset if there's an error
      setSpinning(false)
      setRevealedSlots(NUM_SLOTS)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Fullscreen maxScale={1.25}>
      <div className={styles.container}>
        <div>
          <ItemPreview betArray={bet} />
          <div className={styles.slots}>
            {combination.map((slot, i) => (
              <Slot
                key={i}
                index={i}
                revealed={revealedSlots > i}
                item={slot}
                good={good}
              />
            ))}
          </div>
          <div className={styles.result} data-good={good}>
            {spinning ? (
              <Stuff
                messages={[
                  'Spinning!',
                  'Good luck',
                ]}
              />
            ) : result ? (
              <>
                Payout: {formatLamports(result.payout)}
              </>
            ) : (
              <Stuff
                messages={[
                  'FEELING LUCKY?',
                  'SPIN ME!',
                ]}
              />
            )}
          </div>
        </div>
      </div>
    </Fullscreen>
  )
}
