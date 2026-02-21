import './App.css'
import ArtworkTable from './components/ArtworkTable'

function App() {
  return (
    <div className="min-h-screen bg-[var(--surface-ground)] w-full py-8 px-4 flex justify-center">
      <div className="w-full max-w-7xl bg-[var(--surface-card)] rounded-2xl shadow-lg p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-center text-[var(--text-color)] mb-8 tracking-tight">Artwork Viewer</h1>
        <div className="w-full overflow-hidden">
          <ArtworkTable />
        </div>
      </div>
    </div>
  )
}

export default App
