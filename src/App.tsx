import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainMenu } from './routes/MainMenu'
import { CampaignMap } from './routes/CampaignMap'
import { DeckBuilder } from './routes/DeckBuilder'
import { PostMatchRewards } from './routes/PostMatchRewards'
import { Matchmaking } from './routes/Matchmaking'
import { SoloStartScreen } from './routes/SoloStartScreen'
import { useUIActions } from './hooks/useGameActions'
import { useAppAudioState, useGameStarted } from './hooks/useGameState'
import { useBackgroundMusic } from './hooks/useBackgroundMusic'

function App() {
  const { isMusicMuted, soundVolume, hasMusicSessionStarted } = useAppAudioState()
  const { markMusicSessionStarted } = useUIActions()
  const gameStarted = useGameStarted()

  useEffect(() => {
    if (gameStarted) {
      markMusicSessionStarted()
    }
  }, [gameStarted, markMusicSessionStarted])
  
  // Play background music everywhere
  useBackgroundMusic(hasMusicSessionStarted && !isMusicMuted, soundVolume)

  // Attempt to resume audio context on first user interaction to enable autoplay
  useEffect(() => {
    const resumeAudioContext = async () => {
      // Try to resume any suspended audio contexts
      if (typeof window !== 'undefined' && window.AudioContext) {
        const contexts = (window as Window & { __audioContexts?: AudioContext[] }).__audioContexts
        if (contexts) {
          for (const context of contexts) {
            if (context.state === 'suspended') {
              await context.resume().catch(() => {})
            }
          }
        }
      }
    }

    const events = ['click', 'touchstart', 'keydown']
    events.forEach(event => {
      document.addEventListener(event, resumeAudioContext, { once: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resumeAudioContext)
      })
    }
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/solo" element={<SoloStartScreen />} />
        
        {/* Future feature routes - currently inaccessible stubs */}
        <Route path="/campaign" element={<CampaignMap />} />
        <Route path="/deck-builder" element={<DeckBuilder />} />
        <Route path="/rewards" element={<PostMatchRewards />} />
        <Route path="/matchmaking" element={<Matchmaking />} />
        
        {/* Catch-all redirect to main menu */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
