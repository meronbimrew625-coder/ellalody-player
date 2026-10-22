'use client';
import { useEffect, useRef, useState } from 'react';
import { FolderOpen, Music2, X, Headphones } from 'lucide-react';
import { useMusic } from '../../components/AppShell';
import TrackCard from '../../components/TrackCard';
import { deleteLocalMedia, getLocalMedia, saveLocalMedia } from '../../lib/localMediaDb';

export default function LocalMusicPage() {
  const music = useMusic();
  const [localTracks, setLocalTracks] = useState([]);
  const [message, setMessage] = useState('Loading your saved music…');
  const [loading, setLoading] = useState(true);
  const input = useRef(null);
  useEffect(() => {
    let active = true;
    getLocalMedia('audio').then(records => {
      if (!active) { records.forEach(t => URL.revokeObjectURL(t.localUrl)); return; }
      setLocalTracks(records.map(record => ({ ...record, localUrl: record.url, previewUrl: '', provider: 'Local device' })));
      setMessage(records.length ? 'Your saved music has been restored. Files remain until you remove them.' : 'Import files to save them in this browser.');
    }).catch(error => setMessage(error.message || 'Could not load saved music.')).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);
  async function importFiles(event) {
    const files = Array.from(event.target.files || []).filter(file => file.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac|opus)$/i.test(file.name));
    let saved = 0;
    for (const file of files) {
      const id = `local-${file.name}-${file.size}-${file.lastModified}`;
      if (localTracks.some(track => track.id === id)) continue;
      try {
        await saveLocalMedia('audio', { id, title: file.name.replace(/\.[^.]+$/, ''), artist: 'Local file', album: 'On this device', artwork: '/cover.svg', duration: 0, provider: 'Local device', fileName: file.name, size: file.size, lastModified: file.lastModified, blob: file });
        const url = URL.createObjectURL(file);
        setLocalTracks(old => old.some(track => track.id === id) ? old : [...old, { id, title: file.name.replace(/\.[^.]+$/, ''), artist: 'Local file', album: 'On this device', artwork: '/cover.svg', previewUrl: '', localUrl: url, duration: 0, provider: 'Local device', fileName: file.name, size: file.size }]);
        saved++;
      } catch (error) { setMessage(`Saved ${saved} file(s). ${file.name} could not be stored: ${error.message || 'browser storage limit reached'}`); }
    }
    if (saved) setMessage(`${saved} file(s) saved. They will remain after refresh until you remove them. Browser storage limits apply.`);
    event.target.value = '';
  }
  async function removeTrack(track) {
    try { await deleteLocalMedia('audio', track.id); } catch (error) { setMessage(`Could not remove file: ${error.message}`); return; }
    if (track.localUrl) URL.revokeObjectURL(track.localUrl);
    setLocalTracks(old => old.filter(item => item.id !== track.id));
    if (music.current?.id === track.id) music.setPlaying(false);
    setMessage('File removed from your Ellalody library.');
  }
  return <section className="page-wrap">
    <div className="eyebrow"><Headphones size={14}/> YOUR DEVICE, YOUR MUSIC</div>
    <div className="collection-title-row"><div><h1 className="page-title">Local <span className="gradient-text">music.</span></h1><p className="page-subtitle">Import audio and keep it in your Ellalody library on this browser.</p></div><button className="button-primary" onClick={() => input.current?.click()}><FolderOpen size={16}/> Import audio</button><input ref={input} hidden type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.opus" multiple onChange={importFiles}/></div>
    <p className="page-subtitle">Imported files are saved locally in browser storage, restored after refresh, and kept until you remove them. They are not uploaded to a server. Clearing browser data or storage limits may still remove them.</p>
    {message && <p className="inline-notice">{message}</p>}
    {localTracks.length ? <><div className="section-heading results-heading"><div><div className="eyebrow">SAVED IMPORTS</div><h2>Your collection</h2></div><span className="results-count">{localTracks.length} TRACKS</span></div><div className="track-grid">{localTracks.map((track, index) => <div className="local-track-wrap" key={track.id}><TrackCard track={track} list={localTracks} index={index}/><button className="button-secondary local-remove" onClick={() => removeTrack(track)}><X size={14}/> Remove</button></div>)}</div></> : <div className="empty-state large-empty"><div className="empty-icon"><Music2 size={25}/></div><b>{loading ? 'Restoring your library…' : 'Your local library is empty'}</b><p>Import audio files and they will be saved in this browser until you remove them.</p><button className="button-primary" onClick={() => input.current?.click()}><FolderOpen size={16}/> Choose audio files</button></div>}
  </section>;
}
