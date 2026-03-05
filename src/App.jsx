import { useState } from 'react'

const MODELS = [
  { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'SDXL 1.0' },
  { id: 'runwayml/stable-diffusion-v1-5', name: 'SD 1.5' },
  { id: 'black-forest-labs/FLUX.1-schnell', name: 'FLUX.1 Schnell' },
]

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('hf_key') || '')
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState(MODELS[0].id)
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState(null)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [showKey, setShowKey] = useState(!localStorage.getItem('hf_key'))

  const saveKey = (k) => { setApiKey(k); localStorage.setItem('hf_key', k) }

  const generate = async () => {
    if (!apiKey || !prompt.trim()) return
    setLoading(true); setError(null); setImage(null)
    try {
      const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ inputs: prompt }),
      })
      if (!res.ok) {
        const text = await res.text()
        let msg = `HTTP ${res.status}`
        try { msg = JSON.parse(text).error || msg } catch {}
        throw new Error(msg)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setImage(url)
      setHistory(prev => [{ url, prompt, model, ts: Date.now() }, ...prev].slice(0, 20))
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="app">
      <h1>🎨 Image Generator</h1>
      {showKey ? (
        <div className="key-section">
          <input type="password" placeholder="HuggingFace API Key (hf_...)" value={apiKey} onChange={e => saveKey(e.target.value)} />
          <button onClick={() => apiKey && setShowKey(false)}>Save</button>
        </div>
      ) : (
        <button className="key-toggle" onClick={() => setShowKey(true)}>🔑 Change API Key</button>
      )}
      <div className="controls">
        <select value={model} onChange={e => setModel(e.target.value)}>
          {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <textarea placeholder="Describe your image..." value={prompt} onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate() } }} rows={3} />
        <button onClick={generate} disabled={loading || !prompt.trim() || !apiKey}>
          {loading ? '⏳ Generating...' : '🚀 Generate'}
        </button>
      </div>
      {error && <div className="error">❌ {error}</div>}
      {loading && <div className="loader"><div className="spinner" /><p>Creating your masterpiece...</p></div>}
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
            {history.slice(1).map(h => (
              <div key={h.ts} className="thumb" onClick={() => setImage(h.url)}>
                <img src={h.url} alt={h.prompt} /><span>{h.prompt.slice(0, 40)}...</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
