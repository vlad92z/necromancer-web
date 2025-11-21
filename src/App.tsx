import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainMenu } from './routes/MainMenu'
import { GameMatch } from './routes/GameMatch'
import { CampaignMap } from './routes/CampaignMap'
import { DeckBuilder } from './routes/DeckBuilder'
import { PostMatchRewards } from './routes/PostMatchRewards'
import { Matchmaking } from './routes/Matchmaking'
import { Developer } from './routes/Developer'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/game" element={<GameMatch />} />
        <Route path="/developer" element={<Developer />} />
        
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
