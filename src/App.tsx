import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainMenu } from './routes/MainMenu'
import { CampaignMap } from './routes/CampaignMap'
import { DeckBuilder } from './routes/DeckBuilder'
import { PostMatchRewards } from './routes/PostMatchRewards'
import { Matchmaking } from './routes/Matchmaking'
import { Solo } from './routes/Solo'
import { useBackgroundMusic } from './hooks/useBackgroundMusic'
import { useUIStore } from './state/stores/uiStore'

function App() {
  const isMusicMuted = useUIStore((state) => state.isMusicMuted)
  const soundVolume = useUIStore((state) => state.soundVolume)
  
  // Play background music everywhere
  useBackgroundMusic(!isMusicMuted, soundVolume)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/solo" element={<Solo />} />
        
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
