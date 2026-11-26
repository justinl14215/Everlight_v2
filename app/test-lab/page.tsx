'use client';

import { useEffect, useState } from 'react';
import { days, type CampaignState } from '@/lib/game';
import { runFeatureTestSuite, type FeatureTestResult } from '@/lib/feature-checks';

type Forecast = { preview?: string; error?: string };

export default function TestLabPage() {
  const [state, setState] = useState<CampaignState | null>(null);
  const [loading, setLoading] = useState(true);
  const [suite, setSuite] = useState<FeatureTestResult[] | null>(null);
  const [day, setDay] = useState(1);
  const [scenario, setScenario] = useState('The party asks who is behind the door. Dawnshield rolls an 8, Astra rolls a 5, Violet rolls a 6, and Taylor rolls a 12. Compare a kind answer, a suspicious answer, and trying to force the door.');
  const [forecast, setForecast] = useState('');
  const [aiStatus, setAiStatus] = useState('');
  const [busy, setBusy] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [artUrl, setArtUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/game', { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) throw new Error('Sign in to the Dungeon Master portal first, then open Test Lab.');
      const result = await response.json();
      if (active) setState(result.state as CampaignState);
    }).catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Could not load the campaign for testing.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function post(action: string, extra: Record<string, unknown> = {}) {
    const response = await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Test request failed.');
    return result;
  }

  async function testOpenAI() {
    setBusy('openai'); setError(''); setAiStatus('Checking the configured OpenAI connection…');
    try {
      const result = await post('checkOpenAI');
      setAiStatus(result.message || 'OpenAI check finished.');
    } catch (reason) {
      setAiStatus('OpenAI check failed.'); setError(reason instanceof Error ? reason.message : 'OpenAI check failed.');
    } finally { setBusy(''); }
  }

  async function previewStory() {
    setBusy('story'); setError(''); setForecast('Generating a hypothetical branch preview…');
    try {
      const result = await post('testStoryForecast', { day, text: scenario });
      setForecast((result as Forecast).preview || 'The preview returned no text.');
    } catch (reason) {
      setForecast(''); setError(reason instanceof Error ? reason.message : 'Could not generate the story preview.');
    } finally { setBusy(''); }
  }

  async function testVoice() {
    setBusy('voice'); setError('');
    try {
      const response = await fetch('/api/game', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'narrationAudio', speaker: 'narrator', text: 'The village bell rings once, and silver light stirs beneath the old clock.' }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Voice test failed.');
      }
      const url = URL.createObjectURL(await response.blob());
      setAudioUrl((old) => { if (old) URL.revokeObjectURL(old); return url; });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Voice test failed.'); }
    finally { setBusy(''); }
  }

  async function testSceneArt() {
    setBusy('art'); setError(''); setArtUrl('');
    try {
      const result = await post('testSceneArt', { day });
      setArtUrl(result.imageDataUrl || '');
      if (!result.imageDataUrl) throw new Error('The image test returned no image.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Scene art test failed.'); }
    finally { setBusy(''); }
  }

  const passed = suite?.filter((test) => test.passed).length ?? 0;

  return <main className="shell">
    <header className="topbar">
      <div><p className="eyebrow">DM WORKSPACE · SAFE SANDBOX</p><h1>Everlight <span>Test Lab</span></h1></div>
      <div className="headActions"><a className="quiet" href="/">Back to DM table</a></div>
    </header>
    <section className="panel">
      <p className="eyebrow">NO CAMPAIGN WRITES</p>
      <h2>Exercise features without changing the live story</h2>
      <p className="small">The feature suite uses fresh in-memory copies. AI story, voice, and artwork checks call their services only when you press the corresponding button; their previews are not saved to the campaign.</p>
      {loading && <p>Loading the DM session…</p>}
      {error && <div className="notice error" role="alert">{error}</div>}
      {!loading && !state && <p className="small">Sign in on the DM table, then reopen this page.</p>}
      {state && <>
        <div className="actions"><button className="primary" onClick={() => setSuite(runFeatureTestSuite(state))}>Run safe feature suite</button><span className="pill">Day {state.day} · Checkpoint {state.checkpoint}</span>{suite && <b>{passed}/{suite.length} checks passed</b>}</div>
        {suite && <div className="missionGrid" aria-live="polite">{suite.map((test) => <article className="missionMini" key={test.name}><b>{test.passed ? '✓' : '⚠'} {test.name}</b><p>{test.detail}</p><small>{test.passed ? 'SIMULATION PASSED' : 'CHECK FAILED'}</small></article>)}</div>}
      </>}
    </section>

    <section className="columns">
      <div className="panel">
        <div className="panelHead"><div><p className="eyebrow">AI DM · HYPOTHETICAL</p><h2>Forecast story branches and test replies</h2></div><span className="pill">Does not advance the game</span></div>
        <p className="small">Enter sample player actions and physical rolls. The AI will outline plausible branches and write a sample DM response using the selected day’s story notes. Treat every outcome here as a preview, never as the saved result.</p>
        <label>Story day<select value={day} onChange={(event) => setDay(Number(event.target.value))}>{days.map((entry) => <option key={entry.day} value={entry.day}>Day {entry.day} · {entry.title}</option>)}</select></label>
        <label>Test choices, questions, and reported rolls<textarea rows={5} maxLength={1800} value={scenario} onChange={(event) => setScenario(event.target.value)} /></label>
        <button className="primary" disabled={busy !== '' || scenario.trim().length < 8} onClick={() => void previewStory()}>{busy === 'story' ? 'Generating preview…' : 'Preview story and AI response'}</button>
        {forecast && <div className="recapBody"><p className="eyebrow">HYPOTHETICAL AI PREVIEW · NOT CANON</p><pre className="readAloud" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{forecast}</pre></div>}
      </div>
      <div className="panel">
        <div className="panelHead"><div><p className="eyebrow">CONNECTED SERVICES</p><h2>Test AI, voice, and scene art</h2></div></div>
        <p className="small">These buttons make real service requests and may use your configured API key. They do not change the campaign state.</p>
        <div className="actions"><button className="quiet" disabled={busy !== ''} onClick={() => void testOpenAI()}>{busy === 'openai' ? 'Checking…' : 'Check OpenAI connection'}</button></div>
        {aiStatus && <p className="small" role="status">{aiStatus}</p>}
        <div className="actions"><button className="quiet" disabled={busy !== ''} onClick={() => void testVoice()}>{busy === 'voice' ? 'Generating voice sample…' : 'Generate voice sample'}</button></div>
        {audioUrl && <audio controls src={audioUrl} aria-label="Test narration audio" />}
        <div className="actions"><button className="quiet" disabled={busy !== ''} onClick={() => void testSceneArt()}>{busy === 'art' ? 'Generating test artwork…' : `Generate Day ${day} test artwork`}</button></div>
        {artUrl && <img src={artUrl} alt={`Unsaved test illustration for Day ${day}`} style={{ width: '100%', maxWidth: 480, borderRadius: 16, marginTop: 12 }} />}
      </div>
    </section>
  </main>;
}
