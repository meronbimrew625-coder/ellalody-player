'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Disc3, FolderOpen, Music2, Play, X } from 'lucide-react';
import { useMusic } from '../../components/AppShell';
import TrackCard from '../../components/TrackCard';
import { getLocalMedia } from '../../lib/localMediaDb';

export default function AlbumsPage() {
  const music = useMusic();
  const [localTracks, setLocalTracks] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [loadingLocal, setLoadingLocal] = useState(true);

  useEffect(() => {
    let active = true;
    getLocalMedia('audio')
      .then(records => {
        if (!active) {
          records.forEach(track => {
            if (track.url) URL.revokeObjectURL(track.url);
            if (track.localUrl && track.localUrl !== track.url) URL.revokeObjectURL(track.localUrl);
          });
          return;
        }
        setLocalTracks(records.map(record => ({
          ...record,
          title: record.title || record.fileName?.replace(/\.[^.]+$/, '') || 'Untitled track',
          artist: record.artist || 'Local file',
          album: record.album || 'On this device',
          artwork: record.artwork || '/cover.svg',
          previewUrl: '',
          localUrl: record.url || record.localUrl,
          provider: 'Local device'
        })));
      })
      .catch(() => setLocalTracks([]))
      .finally(() => active && setLoadingLocal(false));
    return () => { active = false; };
  }, []);

  const albums = useMemo(() => {
    const groups = new Map();
    [...music.tracks, ...localTracks].forEach(track => {
      const title = track.album || track.albumTitle || 'Singles & Unknown Albums';
      const artist = track.artist || 'Unknown Artist';
      const key = `${title}::${artist}`;
      if (!groups.has(key)) groups.set(key, { key, title, artist, artwork: track.artwork || '/cover.svg', tracks: [], isLocal: track.provider === 'Local device' });
      const group = groups.get(key);
      if (!group.tracks.some(item => item.id === track.id)) group.tracks.push(track);
      if (track.provider === 'Local device') group.isLocal = true;
    });
    return Array.from(groups.values()).sort((a, b) => Number(b.isLocal) - Number(a.isLocal) || a.title.localeCompare(b.title));
  }, [music.tracks, localTracks]);

  const openAlbum = album => setSelectedAlbum(album);
  const playAlbum = album => {
    const playable = album.tracks.filter(track => track.localUrl || track.previewUrl);
    if (!playable.length) {
      music.setToast('No playable tracks are available in this album yet');
      return;
    }
    music.playTrack(playable[0], playable);
  };

  return <section className="page-wrap albums-page">
    <div className="eyebrow"><Disc3 size={14}/> YOUR COLLECTION</div>
    <h1 className="page-title">Albums <span className="gradient-text">& collections.</span></h1>
    <p className="page-subtitle">Browse albums from online music and audio files imported from your device. Open an album to see and play its tracks.</p>

    {selectedAlbum ? <>
      <button className="button-secondary album-back-button" onClick={() => setSelectedAlbum(null)}><ArrowLeft size={15}/> All albums</button>
      <div className="album-detail-header">
        <img src={selectedAlbum.artwork || '/cover.svg'} alt="" />
        <div><div className="eyebrow">{selectedAlbum.isLocal ? <><FolderOpen size={13}/> LOCAL ALBUM</> : 'ALBUM COLLECTION'}</div><h2>{selectedAlbum.title}</h2><p>{selectedAlbum.artist}</p><span>{selectedAlbum.tracks.length} {selectedAlbum.tracks.length === 1 ? 'TRACK' : 'TRACKS'}</span>
          <button className="button-primary" onClick={() => playAlbum(selectedAlbum)}><Play size={14} fill="currentColor"/> Play album</button>
        </div>
        <button className="icon-button album-close-detail" onClick={() => setSelectedAlbum(null)} aria-label="Close album"><X size={18}/></button>
      </div>
      <div className="section-heading results-heading"><div><div className="eyebrow">TRACKLIST</div><h2>Songs in this album</h2></div><span className="results-count">{selectedAlbum.tracks.length} TRACKS</span></div>
      <div className="track-grid">{selectedAlbum.tracks.map((track, index) => <TrackCard key={track.id} track={track} list={selectedAlbum.tracks} index={index}/>)}</div>
    </> : albums.length ? <>
      <div className="section-heading results-heading"><div><div className="eyebrow">YOUR LIBRARY</div><h2>Albums and local collections</h2></div><span className="results-count">{albums.length} ALBUMS</span></div>
      <div className="track-grid">{albums.map(album => <article className="playlist-card album-card" key={album.key}>
        <button className="playlist-cover album-cover-button" onClick={() => openAlbum(album)} aria-label={`Open ${album.title}`}><img src={album.artwork || '/cover.svg'} alt={`${album.title} cover`} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:14}}/><span className="album-open-overlay"><FolderOpen size={18}/> Open album</span></button>
        <div className="playlist-info"><b title={album.title}>{album.title}</b><p>{album.artist}</p><span>{album.tracks.length} TRACK{album.tracks.length === 1 ? '' : 'S'}{album.isLocal ? ' · LOCAL FILES' : ''}</span>
          <div className="album-card-actions"><button className="button-secondary" onClick={() => openAlbum(album)}>View tracks</button><button className="button-primary" onClick={() => playAlbum(album)}><Play size={14}/> Play</button></div>
        </div>
      </article>)}</div>
    </> : <div className="empty-state large-empty"><div className="empty-icon"><Music2 size={25}/></div><b>{loadingLocal ? 'Loading your local albums…' : 'Your albums will appear here'}</b><p>Import audio files in Local Music to see your local collection here, or explore online music to load albums.</p><div className="album-empty-actions"><Link className="button-primary" href="/local-music"><FolderOpen size={15}/> Import local music</Link><Link className="button-secondary" href="/explore">Explore music</Link></div></div>}
  </section>;
}
