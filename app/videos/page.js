'use client';
import { useEffect, useRef, useState } from 'react';
import { Clapperboard, FolderOpen, Play, X, Upload, Film } from 'lucide-react';
import { deleteLocalMedia, getLocalMedia, saveLocalMedia } from '../../lib/localMediaDb';
import { useMusic } from '../../components/AppShell';

export default function VideosPage() {
  const { setPlaying } = useMusic();
  const [videos, setVideos] = useState([]);
  const playerRef = useRef(null);
  const [active, setActive] = useState(null);
  const [message, setMessage] = useState('Restoring your saved videos…');
  const input = useRef(null);
  useEffect(() => {
    const stopVideoForAudio = () => {
      if (playerRef.current) playerRef.current.pause();
      setActive(null);
    };
    window.addEventListener('ellalody:audio-play', stopVideoForAudio);
    return () => window.removeEventListener('ellalody:audio-play', stopVideoForAudio);
  }, []);
  useEffect(() => {
    let alive = true;
    getLocalMedia('videos').then(records => {
      if (!alive) { records.forEach(v => URL.revokeObjectURL(v.url)); return; }
      setVideos(records);
      setMessage(records.length ? 'Your saved videos are restored and will stay until you remove them.' : 'Imported videos are saved in this browser until you remove them.');
    }).catch(error => setMessage(error.message || 'Could not restore saved videos.'));
    return () => { alive = false; };
  }, []);
  async function importVideos(event) {
    const files = Array.from(event.target.files || []).filter(file => file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogv|avi|mkv)$/i.test(file.name));
    let saved = 0;
    for (const file of files) {
      const id = `video-${file.name}-${file.size}-${file.lastModified}`;
      if (videos.some(video => video.id === id)) continue;
      try {
        await saveLocalMedia('videos', { id, name: file.name, size: file.size, lastModified: file.lastModified, blob: file });
        setVideos(old => old.some(video => video.id === id) ? old : [...old, { id, name: file.name, size: file.size, url: URL.createObjectURL(file) }]);
        saved++;
      } catch (error) { setMessage(`${file.name} could not be saved: ${error.message || 'browser storage limit reached'}`); }
    }
    if (saved) setMessage(`${saved} video(s) saved in this browser. They will remain after refresh until you remove them. Browser storage limits apply.`);
    event.target.value = '';
  }
  function startVideo(video) {
    setPlaying(false);
    window.dispatchEvent(new Event('ellalody:video-play'));
    setActive(video);
  }
  async function removeVideo(video) {
    try { await deleteLocalMedia('videos', video.id); } catch (error) { setMessage(`Could not remove video: ${error.message}`); return; }
    URL.revokeObjectURL(video.url);
    setVideos(old => old.filter(item => item.id !== video.id));
    if (active?.id === video.id) { if (playerRef.current) playerRef.current.pause(); setActive(null); }
    setMessage('Video removed from your Ellalody library.');
  }
  const formatSize = bytes => bytes < 1048576 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
  return <section className="page-wrap videos-page">
    <div className="eyebrow"><Clapperboard size={14} /> YOUR VIDEO LIBRARY</div>
    <div className="videos-page-heading"><div><h1 className="page-title">Your <span className="gradient-text">videos.</span></h1><p className="page-subtitle">Keep your video collection together and play clips inside Ellalody.</p></div><button className="button-primary videos-import-top" onClick={() => input.current?.click()}><Upload size={16} /> Import videos</button></div>
    <input ref={input} hidden type="file" accept="video/*,.mp4,.webm,.mov,.m4v,.ogv,.avi,.mkv" multiple onChange={importVideos} />
    <div className="videos-upload-panel"><div className="videos-upload-icon"><FolderOpen size={24} /></div><div className="videos-upload-copy"><h2>Add videos to your library</h2><p>Select video files from your device. Playback depends on browser and file format support.</p><small>Files are stored locally in this browser, not uploaded to a server. Browser storage limits and clearing browser data can still affect saved files.</small></div><button className="button-secondary" onClick={() => input.current?.click()}><FolderOpen size={15} /> Browse files</button></div>
    {message && <p className="inline-notice">{message}</p>}
    {active && <div className="video-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) { if (playerRef.current) playerRef.current.pause(); setActive(null); } }}><section className="video-modal" role="dialog" aria-modal="true" aria-label={`Playing ${active.name}`}><div className="video-modal-header"><div><span className="video-modal-kicker">NOW PLAYING</span><h2 title={active.name}>{active.name}</h2><p>{formatSize(active.size)}</p></div><button className="video-modal-close" onClick={() => { if (playerRef.current) playerRef.current.pause(); setActive(null); }} aria-label="Close video"><X size={19}/></button></div><video ref={playerRef} controls autoPlay playsInline src={active.url} onPlay={() => { setPlaying(false); window.dispatchEvent(new Event('ellalody:video-play')); }} /></section></div>}
    <div className="videos-library-heading"><div><h2>My videos</h2><p>{videos.length} {videos.length === 1 ? 'video' : 'videos'} saved in this browser</p></div></div>
    {videos.length ? <div className="playlist-grid">{videos.map(video => <article className="video-library-card" key={video.id}><button className="video-thumbnail" onClick={() => startVideo(video)} aria-label={`Play ${video.name}`}><video src={video.url} muted preload="metadata" aria-label={video.name} /><span><Play size={25} fill="currentColor" /></span></button><div className="playlist-info"><b title={video.name}>{video.name}</b><p>{formatSize(video.size)}</p><div className="playlist-manage-actions"><button className="button-primary" onClick={() => startVideo(video)}><Play size={14} /> Play</button><button className="button-secondary" onClick={() => removeVideo(video)}><X size={14} /> Remove</button></div></div></article>)}</div> : <div className="empty-state large-empty"><div className="empty-icon"><Film size={25} /></div><b>Your library is empty</b><p>Choose video files to save them in your browser. They remain until you remove them.</p><button className="button-primary" onClick={() => input.current?.click()}><Upload size={16} /> Choose video files</button></div>}
  </section>;
}
