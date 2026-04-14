import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import type { ArtistInfo, Exhibit, MediaItem, Project } from '@/types/cms';
import type { CmsSection, PrintedMatterData } from '@/types/admin';
import {
  checkAdminSession,
  getCmsSection,
  logoutAdmin,
  saveCmsSection,
  uploadToBlob,
} from '@/utils/adminApi';
import { mergeProjectsWithDefaults } from '@/utils/cms/projectsMerge';
import { broadcastCmsUpdate, invalidateCache } from '@/utils/cms/fetcher';
import '@/styles/admin.css';

const CMS_AUTH_DISABLED = import.meta.env.VITE_CMS_AUTH_DISABLED === 'true';

type Tab = CmsSection;

interface Toast {
  id: string;
  kind: 'success' | 'error';
  message: string;
}

function move<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('artist');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unsaved, setUnsaved] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [artist, setArtist] = useState<ArtistInfo | null>(null);
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [printedMatter, setPrintedMatter] = useState<PrintedMatterData>({ items: [] });

  const [selectedExhibit, setSelectedExhibit] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [confirmDeleteProjectIndex, setConfirmDeleteProjectIndex] = useState<number | null>(null);

  const pushToast = (kind: Toast['kind'], message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const confirmIfUnsaved = () => {
    if (!unsaved) return true;
    return window.confirm('You have unsaved changes. Continue anyway?');
  };

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!unsaved) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [unsaved]);

  useEffect(() => {
    async function bootstrap() {
      try {
        if (CMS_AUTH_DISABLED) {
          setAuthed(true);
          const [a, e, p, pm] = await Promise.all([
            getCmsSection<ArtistInfo>('artist'),
            getCmsSection<{ exhibits: Exhibit[] }>('exhibits'),
            getCmsSection<Project[]>('projects'),
            getCmsSection<PrintedMatterData>('printed-matter'),
          ]);
          setArtist(a);
          setExhibits(e.exhibits || []);
          setProjects(mergeProjectsWithDefaults(Array.isArray(p) ? p : []));
          setPrintedMatter(pm || { items: [] });
          return;
        }
        const session = await checkAdminSession();
        setAuthed(session.authenticated);
        if (!session.authenticated) return;
        const [a, e, p, pm] = await Promise.all([
          getCmsSection<ArtistInfo>('artist'),
          getCmsSection<{ exhibits: Exhibit[] }>('exhibits'),
          getCmsSection<Project[]>('projects'),
          getCmsSection<PrintedMatterData>('printed-matter'),
        ]);
        setArtist(a);
        setExhibits(e.exhibits || []);
        setProjects(mergeProjectsWithDefaults(Array.isArray(p) ? p : []));
        setPrintedMatter(pm || { items: [] });
      } catch (err) {
        pushToast('error', err instanceof Error ? err.message : 'Failed loading admin data');
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  const tabs = useMemo(
    () => [
      { id: 'artist' as const, label: 'Artist Profile' },
      { id: 'exhibits' as const, label: 'Exhibits' },
      { id: 'projects' as const, label: 'Projects' },
      { id: 'printed-matter' as const, label: 'Printed Matter' },
    ],
    []
  );

  const switchTab = (tab: Tab) => {
    if (tab === activeTab) return;
    if (!confirmIfUnsaved()) return;
    setActiveTab(tab);
    setUnsaved(false);
  };

  const saveCurrentTab = async () => {
    setSaving(true);
    try {
      if (activeTab === 'artist' && artist) {
        await saveCmsSection('artist', artist);
      } else if (activeTab === 'exhibits') {
        await saveCmsSection('exhibits', { exhibits });
      } else if (activeTab === 'projects') {
        await saveCmsSection('projects', projects);
      } else if (activeTab === 'printed-matter') {
        await saveCmsSection('printed-matter', printedMatter);
      }

      // Make the public site reflect changes immediately (this tab + other open tabs).
      invalidateCache(activeTab);
      broadcastCmsUpdate(activeTab);

      setUnsaved(false);
      pushToast('success', 'Saved successfully');
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    if (CMS_AUTH_DISABLED) return;
    await logoutAdmin();
    window.location.href = '/admin/login';
  };

  if (!CMS_AUTH_DISABLED && authed === false) return <Navigate to="/admin/login" replace />;
  if (loading || authed === null) return <main className="admin-loading">Loading admin...</main>;

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <h1>CMS Admin</h1>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => switchTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        {!CMS_AUTH_DISABLED && (
          <button type="button" className="admin-logout" onClick={onLogout}>
            Logout
          </button>
        )}
      </aside>

      <section className="admin-content">
        <header className="admin-header">
          <h2>{tabs.find((t) => t.id === activeTab)?.label}</h2>
          <button type="button" onClick={saveCurrentTab} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </header>

        {activeTab === 'artist' && artist && (
          <div className="admin-form">
            <label>Name</label>
            <input
              value={artist.name}
              onChange={(e) => {
                setArtist({ ...artist, name: e.target.value });
                setUnsaved(true);
              }}
            />
            <label>Introduction</label>
            <textarea
              rows={6}
              value={artist.introduction}
              onChange={(e) => {
                setArtist({ ...artist, introduction: e.target.value });
                setUnsaved(true);
              }}
            />
            <label>Social links</label>
            {artist.socials.map((social, index) => (
              <div key={`${social.platform}-${index}`} className="admin-row">
                <input
                  value={social.platform}
                  placeholder="Platform"
                  onChange={(e) => {
                    const next = [...artist.socials];
                    next[index] = { ...next[index], platform: e.target.value };
                    setArtist({ ...artist, socials: next });
                    setUnsaved(true);
                  }}
                />
                <input
                  value={social.url}
                  placeholder="URL"
                  onChange={(e) => {
                    const next = [...artist.socials];
                    next[index] = { ...next[index], url: e.target.value };
                    setArtist({ ...artist, socials: next });
                    setUnsaved(true);
                  }}
                />
                <button
                  onClick={() => {
                    const next = artist.socials.filter((_, i) => i !== index);
                    setArtist({ ...artist, socials: next });
                    setUnsaved(true);
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                setArtist({ ...artist, socials: [...artist.socials, { platform: '', url: '' }] });
                setUnsaved(true);
              }}
            >
              Add social link
            </button>

            <div className="admin-file-row">
              <div>
                <strong>Artist Statement</strong>
                <p>{artist.artistStatement.url}</p>
              </div>
              <input
                type="file"
                accept="application/pdf"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const uploaded = await uploadToBlob(file, 'artist');
                    setArtist({
                      ...artist,
                      artistStatement: {
                        ...artist.artistStatement,
                        filename: file.name,
                        mimeType: file.type,
                        size: file.size,
                        url: uploaded.url,
                      },
                    });
                    setUnsaved(true);
                    pushToast('success', 'Artist statement uploaded');
                  } catch (err) {
                    pushToast('error', err instanceof Error ? err.message : 'Upload failed');
                  }
                }}
              />
            </div>

            <div className="admin-file-row">
              <div>
                <strong>Resume</strong>
                <p>{artist.resume.url}</p>
              </div>
              <input
                type="file"
                accept="application/pdf"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const uploaded = await uploadToBlob(file, 'artist');
                    setArtist({
                      ...artist,
                      resume: {
                        ...artist.resume,
                        filename: file.name,
                        mimeType: file.type,
                        size: file.size,
                        url: uploaded.url,
                      },
                    });
                    setUnsaved(true);
                    pushToast('success', 'Resume uploaded');
                  } catch (err) {
                    pushToast('error', err instanceof Error ? err.message : 'Upload failed');
                  }
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'exhibits' && (
          <div className="admin-two-pane">
            <div className="admin-list">
              {exhibits.map((item, i) => (
                <div
                  key={item.id}
                  className={`admin-list-item ${selectedExhibit === i ? 'selected' : ''}`}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/exhibit-index', String(i))}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const from = Number(e.dataTransfer.getData('text/exhibit-index'));
                    if (Number.isNaN(from)) return;
                    setExhibits(move(exhibits, from, i));
                    setUnsaved(true);
                  }}
                  onClick={() => setSelectedExhibit(i)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.status}</span>
                </div>
              ))}
              <button
                onClick={() => {
                  setExhibits([
                    ...exhibits,
                    {
                      id: `exhibit-${Date.now()}`,
                      title: 'New Exhibit',
                      venue: '',
                      location: '',
                      year: '',
                      image: '',
                      status: 'upcoming',
                    },
                  ]);
                  setSelectedExhibit(exhibits.length);
                  setUnsaved(true);
                }}
              >
                Add exhibit
              </button>
            </div>
            <div className="admin-editor">
              {selectedExhibit === null ? (
                <p>Select an exhibit to edit</p>
              ) : (
                <>
                  <label>Title</label>
                  <input
                    value={exhibits[selectedExhibit].title}
                    onChange={(e) => {
                      const next = [...exhibits];
                      next[selectedExhibit] = { ...next[selectedExhibit], title: e.target.value };
                      setExhibits(next);
                      setUnsaved(true);
                    }}
                  />
                  <label>Venue</label>
                  <input
                    value={exhibits[selectedExhibit].venue}
                    onChange={(e) => {
                      const next = [...exhibits];
                      next[selectedExhibit] = { ...next[selectedExhibit], venue: e.target.value };
                      setExhibits(next);
                      setUnsaved(true);
                    }}
                  />
                  <label>Location</label>
                  <input
                    value={exhibits[selectedExhibit].location}
                    onChange={(e) => {
                      const next = [...exhibits];
                      next[selectedExhibit] = { ...next[selectedExhibit], location: e.target.value };
                      setExhibits(next);
                      setUnsaved(true);
                    }}
                  />
                  <label>Year / Dates</label>
                  <input
                    value={exhibits[selectedExhibit].year}
                    onChange={(e) => {
                      const next = [...exhibits];
                      next[selectedExhibit] = { ...next[selectedExhibit], year: e.target.value };
                      setExhibits(next);
                      setUnsaved(true);
                    }}
                  />
                  <label>Status</label>
                  <select
                    value={exhibits[selectedExhibit].status}
                    onChange={(e) => {
                      const next = [...exhibits];
                      next[selectedExhibit] = {
                        ...next[selectedExhibit],
                        status: e.target.value as Exhibit['status'],
                      };
                      setExhibits(next);
                      setUnsaved(true);
                    }}
                  >
                    <option value="upcoming">upcoming</option>
                    <option value="ongoing">ongoing</option>
                    <option value="past">past</option>
                  </select>
                  <label>Local asset folder (optional)</label>
                  <input
                    placeholder="Exact name of folder under src/assets/media/Exhibits/"
                    value={exhibits[selectedExhibit].assetFolder ?? ''}
                    onChange={(e) => {
                      const next = [...exhibits];
                      const v = e.target.value.trim();
                      next[selectedExhibit] = {
                        ...next[selectedExhibit],
                        assetFolder: v || undefined,
                      };
                      setExhibits(next);
                      setUnsaved(true);
                    }}
                  />
                  <label>Cover image</label>
                  {exhibits[selectedExhibit].image && (
                    <img src={exhibits[selectedExhibit].image} className="admin-preview" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const uploaded = await uploadToBlob(file, 'exhibits');
                        const next = [...exhibits];
                        next[selectedExhibit] = { ...next[selectedExhibit], image: uploaded.url };
                        setExhibits(next);
                        setUnsaved(true);
                      } catch (err) {
                        pushToast('error', err instanceof Error ? err.message : 'Upload failed');
                      }
                    }}
                  />
                  <button
                    className="admin-danger"
                    onClick={() => {
                      const next = exhibits.filter((_, i) => i !== selectedExhibit);
                      setExhibits(next);
                      setSelectedExhibit(null);
                      setUnsaved(true);
                    }}
                  >
                    Delete exhibit
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="admin-two-pane">
            <div className="admin-list">
              {projects.map((project, i) => (
                <div
                  key={project.id}
                  className={`admin-list-item ${selectedProject === i ? 'selected' : ''}`}
                  onClick={() => setSelectedProject(i)}
                >
                  <strong>{project.name}</strong>
                  <span>{project.date}</span>
                </div>
              ))}
              <button
                onClick={() => {
                  const nextProject: Project = {
                    id: `project-${Date.now()}`,
                    name: 'New Project',
                    shortDescription: '',
                    date: new Date().toISOString().slice(0, 10),
                    coverImage: { id: `cover-${Date.now()}`, url: '' },
                    imageAltText: '',
                    studio: '',
                    media: [],
                  };
                  setProjects([...projects, nextProject]);
                  setSelectedProject(projects.length);
                  setUnsaved(true);
                }}
              >
                Add project
              </button>
            </div>
            <div className="admin-editor">
              {selectedProject === null ? (
                <p>Select a project to edit</p>
              ) : (
                <>
                  <label>Name</label>
                  <input
                    value={projects[selectedProject].name}
                    onChange={(e) => {
                      const next = [...projects];
                      next[selectedProject] = { ...next[selectedProject], name: e.target.value };
                      setProjects(next);
                      setUnsaved(true);
                    }}
                  />
                  <label>Short Description</label>
                  <textarea
                    rows={4}
                    value={projects[selectedProject].shortDescription}
                    onChange={(e) => {
                      const next = [...projects];
                      next[selectedProject] = {
                        ...next[selectedProject],
                        shortDescription: e.target.value,
                      };
                      setProjects(next);
                      setUnsaved(true);
                    }}
                  />
                  <label>Date</label>
                  <input
                    value={projects[selectedProject].date}
                    onChange={(e) => {
                      const next = [...projects];
                      next[selectedProject] = { ...next[selectedProject], date: e.target.value };
                      setProjects(next);
                      setUnsaved(true);
                    }}
                  />
                  <label>Studio</label>
                  <input
                    value={projects[selectedProject].studio}
                    onChange={(e) => {
                      const next = [...projects];
                      next[selectedProject] = { ...next[selectedProject], studio: e.target.value };
                      setProjects(next);
                      setUnsaved(true);
                    }}
                  />
                  <label>Cover image</label>
                  {projects[selectedProject].coverImage.url && (
                    <img src={projects[selectedProject].coverImage.url} className="admin-preview" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const uploaded = await uploadToBlob(file, 'projects');
                        const next = [...projects];
                        next[selectedProject] = {
                          ...next[selectedProject],
                          coverImage: {
                            ...next[selectedProject].coverImage,
                            url: uploaded.url,
                            alt: file.name,
                          },
                        };
                        setProjects(next);
                        setUnsaved(true);
                      } catch (err) {
                        pushToast('error', err instanceof Error ? err.message : 'Upload failed');
                      }
                    }}
                  />
                  <label>Project media</label>
                  {projects[selectedProject].media.map((media, mediaIndex) => (
                    <div key={media.id} className="admin-media-item">
                      <div className="admin-media-thumb-wrap" aria-hidden>
                        {media.type === 'image' && media.url ? (
                          <img
                            src={media.thumbnail || media.url}
                            alt=""
                            className="admin-media-thumb"
                            loading="lazy"
                          />
                        ) : media.type === 'video' && media.url ? (
                          <video
                            src={media.url}
                            className="admin-media-thumb"
                            muted
                            playsInline
                            preload="metadata"
                            poster={media.thumbnail}
                          />
                        ) : (
                          <div className="admin-media-thumb-placeholder" />
                        )}
                      </div>
                      <span className="admin-media-type">{media.type}</span>
                      <input
                        value={media.caption || ''}
                        placeholder="Caption"
                        onChange={(e) => {
                          const next = [...projects];
                          const mediaNext = [...next[selectedProject].media];
                          mediaNext[mediaIndex] = { ...mediaNext[mediaIndex], caption: e.target.value };
                          next[selectedProject] = { ...next[selectedProject], media: mediaNext };
                          setProjects(next);
                          setUnsaved(true);
                        }}
                      />
                      <input
                        value={media.alt || ''}
                        placeholder="Alt text"
                        onChange={(e) => {
                          const next = [...projects];
                          const mediaNext = [...next[selectedProject].media];
                          mediaNext[mediaIndex] = { ...mediaNext[mediaIndex], alt: e.target.value };
                          next[selectedProject] = { ...next[selectedProject], media: mediaNext };
                          setProjects(next);
                          setUnsaved(true);
                        }}
                      />
                      <button
                        onClick={() => {
                          const next = [...projects];
                          const mediaNext = next[selectedProject].media.filter((_, i) => i !== mediaIndex);
                          next[selectedProject] = { ...next[selectedProject], media: mediaNext };
                          setProjects(next);
                          setUnsaved(true);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const uploaded = await uploadToBlob(file, 'projects');
                        const mediaItem: MediaItem = {
                          id: `media-${Date.now()}`,
                          type: file.type.startsWith('video/') ? 'video' : 'image',
                          url: uploaded.url,
                          caption: '',
                          alt: '',
                        };
                        const next = [...projects];
                        next[selectedProject] = {
                          ...next[selectedProject],
                          media: [...next[selectedProject].media, mediaItem],
                        };
                        setProjects(next);
                        setUnsaved(true);
                      } catch (err) {
                        pushToast('error', err instanceof Error ? err.message : 'Upload failed');
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="admin-danger"
                    onClick={() => {
                      if (selectedProject === null) return;
                      setConfirmDeleteProjectIndex(selectedProject);
                    }}
                  >
                    Delete project
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'printed-matter' && (
          <div className="admin-printed-grid">
            {printedMatter.items.map((item, i) => (
              <div
                key={item.id}
                className="admin-printed-card"
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/printed-index', String(i))}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const from = Number(e.dataTransfer.getData('text/printed-index'));
                  if (Number.isNaN(from)) return;
                  setPrintedMatter({ items: move(printedMatter.items, from, i) });
                  setUnsaved(true);
                }}
              >
                {item.image && <img src={item.image} className="admin-preview" />}
                <input
                  value={item.title || ''}
                  placeholder="Title"
                  onChange={(e) => {
                    const next = [...printedMatter.items];
                    next[i] = { ...next[i], title: e.target.value };
                    setPrintedMatter({ items: next });
                    setUnsaved(true);
                  }}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const uploaded = await uploadToBlob(file, 'printed-matter');
                      const next = [...printedMatter.items];
                      next[i] = { ...next[i], image: uploaded.url };
                      setPrintedMatter({ items: next });
                      setUnsaved(true);
                    } catch (err) {
                      pushToast('error', err instanceof Error ? err.message : 'Upload failed');
                    }
                  }}
                />
                <button
                  className="admin-danger"
                  onClick={() => {
                    const next = printedMatter.items.filter((_, idx) => idx !== i);
                    setPrintedMatter({ items: next });
                    setUnsaved(true);
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
            <button
              className="admin-add-card"
              onClick={() => {
                setPrintedMatter({
                  items: [
                    ...printedMatter.items,
                    { id: `${Date.now()}`, title: 'New Item', image: '' },
                  ],
                });
                setUnsaved(true);
              }}
            >
              + Add printed matter item
            </button>
          </div>
        )}
      </section>

      {confirmDeleteProjectIndex !== null && projects[confirmDeleteProjectIndex] && (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onClick={() => setConfirmDeleteProjectIndex(null)}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-delete-project-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="admin-delete-project-title">Delete project?</h3>
            <p>
              Remove &quot;{projects[confirmDeleteProjectIndex].name}&quot; from the list? This cannot be
              undone.
            </p>
            <div className="admin-modal-actions">
              <button type="button" onClick={() => setConfirmDeleteProjectIndex(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="admin-danger"
                onClick={() => {
                  const idx = confirmDeleteProjectIndex;
                  setConfirmDeleteProjectIndex(null);
                  const next = projects.filter((_, i) => i !== idx);
                  setProjects(next);
                  setSelectedProject(null);
                  setUnsaved(true);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-toast-wrap">
        {toasts.map((toast) => (
          <div key={toast.id} className={`admin-toast ${toast.kind}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </main>
  );
}
