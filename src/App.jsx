import { useState } from 'react'

const MODELS = [
  { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'SDXL 1.0' },
  { id: 'runwayml/stable-diffusion-v1-5', name: 'SD 1.5' },
  { id: 'black-forest-labs/FLUX.1-schnell', name: 'FLUX.1 Schnell' },
]

const API_URL = 'https://v0nyu4ka.com:3847'

export default function App() {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState(MODELS[0].id)
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState(null)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])

  const generate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setError(null)
    setImage(null)
    try {
      const res = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setImage(url)
      setHistory(prev => [{ url, prompt, model, ts: Date.now() }, ...prev].slice(0, 20))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      generate()
    }
  }

  return (
    <div className="app">
      <h1>🎨 Image Generator</h1>
      <div className="controls">
        <select value={model} onChange={e => setModel(e.target.value)}>
          {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <textarea
          placeholder="Describe your image..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
        />
        <button onClick={generate} disabled={loading || !prompt.trim()}>
          {loading ? '⏳ Generating...' : '🚀 Generate'}
        </button>
      </div>

      {error && <div className="error">❌ {error}</div>}

      {loading && (
        <div className="loader">
          <div className="spinner" />
          <p>Creating your masterpiece...</p>
        </div>
      )}

      {image && (
        <div className="result">
          <img src={image} alt={prompt} />
          <a href={image} download={`generated-${Date.now()}.png`}>📥 Download</a>
        </div>
      )}

      {history.length > 1 && (
        <div className="history">
          <h2>History</h2>
          <div className="grid">
            {history.slice(1).map((h) => (
              <div key={h.ts} className="thumb" onClick={() => setImage(h.url)}>
                <img src={h.url} alt={h.prompt} />
                <span>{h.prompt.slice(0, 40)}...</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
