import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../../db/index.js'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useConnectivity } from '../../services/connectivity.service.js'
import syncEngine from '../../sync/syncEngine.js'
import api from '../../api/client.js'
import { contentService } from '../../services/data.service.js'

export default function ParentDashboard() {
  const { user, logout } = useAuth()
  const { status, isOnline } = useConnectivity()
  const navigate = useNavigate()
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const children = useLiveQuery(() => db.childProfiles.toArray(), [])
  const modules = useLiveQuery(() => db.learningModules.orderBy('order').toArray(), [])
  const pendingSync = useLiveQuery(() => db.syncQueue.where('status').anyOf(['PENDING', 'FAILED']).count(), [])
  const downloaded = useLiveQuery(() => db.downloadedModules.toArray(), [])

  const handleManualSync = async () => {
    setSyncing(true); setSyncMsg('')
    try {
      const result = await syncEngine.push()
      setSyncMsg(`✓ Synced ${result.synced} items${result.failed ? `, ${result.failed} failed` : ''}`)
    } catch { setSyncMsg('✗ Sync failed - check connection') }
    finally { setSyncing(false) }
  }

  const handleDownloadModule = async (mod) => {
    try {
      await db.learningModules.where('slug').equals(mod.slug).modify({ downloadStatus: 'downloading' })
      const [lessonsRes, gamesRes] = await Promise.all([
        api.get(`/modules/${mod.slug}/lessons/`),
        api.get(`/games/?module=${mod.serverId}`),
      ])
      await contentService.seedLessonsFromApi(mod.localId, lessonsRes.data)
      await contentService.seedGamesFromApi(gamesRes.data.results || gamesRes.data)
      await contentService.markModuleDownloaded(mod.slug, mod.version, mod.sizeBytes)
    } catch (err) {
      await db.learningModules.where('slug').equals(mod.slug).modify({ downloadStatus: 'not_downloaded' })
    }
  }

  const handleDeleteModule = async (mod) => {
    await db.lessons.where('moduleId').equals(mod.localId).delete()
    await contentService.removeModule(mod.slug)
  }

  const TABS = ['overview', 'children', 'modules', 'sync']

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--color-card)', borderBottom: '1px solid var(--color-border)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 22 }}>📊 Parent Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{user?.name} · {user?.email}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" style={{ padding: '8px 16px', minHeight: 'auto', fontSize: 14 }} onClick={() => navigate('/child/home')}>
            🏠 Go to Home
          </button>
          <button className="btn btn-secondary" style={{ padding: '8px 16px', minHeight: 'auto', fontSize: 14 }} onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', padding: '0 24px', gap: 4 }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '14px 20px', background: 'none', color: activeTab === tab ? 'var(--color-primary)' : 'var(--text-secondary)', borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent', fontWeight: 700, fontSize: 14, textTransform: 'capitalize', transition: '0.2s' }}>
            {tab === 'overview' ? '📈 Overview' : tab === 'children' ? '👶 Children' : tab === 'modules' ? '📥 Modules' : '🔄 Sync'}
          </button>
        ))}
      </div>

      <div className="parent-layout" style={{ paddingTop: 24 }}>
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div className="stats-grid" style={{ marginBottom: 24 }}>
              {[
                { icon: '👶', value: children?.length || 0, label: 'Children', color: '#6C63FF' },
                { icon: '📥', value: downloaded?.length || 0, label: 'Downloaded Modules', color: '#4ECDC4' },
                { icon: '🔄', value: pendingSync || 0, label: 'Pending Sync', color: pendingSync > 0 ? '#FF9F43' : '#55EFC4' },
                { icon: '🌐', value: isOnline ? 'Online' : 'Offline', label: 'Connection', color: isOnline ? '#4ECDC4' : '#FF6B6B' },
              ].map(s => (
                <div key={s.label} className="stat-card" style={{ borderColor: `${s.color}33` }}>
                  <div style={{ fontSize: 28 }}>{s.icon}</div>
                  <div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {children?.map(child => (
              <ChildProgressCard key={child.localId} child={child} />
            ))}
          </div>
        )}

        {/* CHILDREN */}
        {activeTab === 'children' && (
          <div>
            <h2 className="subheading" style={{ marginBottom: 16 }}>Children Profiles</h2>
            {children?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No children added yet. Go to Select Child to add one.</p>
            ) : children?.map(child => (
              <div key={child.localId} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '16px 20px', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', marginBottom: 12 }}>
                <div style={{ fontSize: 40 }}>{AVATAR_EMOJI[child.avatar] || '🐻'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800 }}>{child.name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    {child.serverId ? 'Synced ✓' : 'Local only'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODULES DOWNLOAD MANAGER */}
        {activeTab === 'modules' && (
          <div>
            <h2 className="subheading" style={{ marginBottom: 16 }}>📥 Offline Module Manager</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
              Download modules so children can learn without internet.
            </p>
            {!isOnline && (
              <div style={{ background: 'rgba(255,159,67,0.1)', border: '1px solid rgba(255,159,67,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16, color: '#FF9F43', fontSize: 14, fontWeight: 700 }}>
                ⚠ You are offline. Downloaded modules are still available.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {modules?.map(mod => {
                const dl = downloaded?.find(d => d.moduleSlug === mod.slug)
                const isDownloaded = dl?.status === 'downloaded'
                const isDownloading = mod.downloadStatus === 'downloading'
                return (
                  <div key={mod.localId} className="module-download-card">
                    <div style={{ fontSize: 32 }}>{mod.iconEmoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800 }}>{mod.title}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        {(mod.sizeBytes / 1_000_000).toFixed(0)} MB
                        {isDownloaded && <span style={{ color: '#4ECDC4', marginLeft: 8 }}>✓ Downloaded</span>}
                      </div>
                    </div>
                    {isDownloaded ? (
                      <button className="btn btn-danger" style={{ padding: '8px 14px', minHeight: 'auto', fontSize: 13 }} onClick={() => handleDeleteModule(mod)}>
                        Delete
                      </button>
                    ) : (
                      <button className="btn btn-primary" style={{ padding: '8px 14px', minHeight: 'auto', fontSize: 13 }} disabled={!isOnline || isDownloading} onClick={() => handleDownloadModule(mod)}>
                        {isDownloading ? '⏳' : '⬇ Download'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* SYNC */}
        {activeTab === 'sync' && (
          <div>
            <h2 className="subheading" style={{ marginBottom: 16 }}>🔄 Data Synchronization</h2>
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 800 }}>Pending operations: <span style={{ color: pendingSync > 0 ? '#FF9F43' : '#4ECDC4' }}>{pendingSync || 0}</span></div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Connection: {isOnline ? '🟢 Online' : '🔴 Offline'}</div>
                </div>
                <button className="btn btn-primary" style={{ padding: '10px 20px', minHeight: 'auto' }} disabled={!isOnline || syncing} onClick={handleManualSync}>
                  {syncing ? '⏳ Syncing…' : '🔄 Sync Now'}
                </button>
              </div>
              {syncMsg && <p style={{ color: syncMsg.startsWith('✓') ? '#4ECDC4' : '#FF6B6B', fontWeight: 700 }}>{syncMsg}</p>}
            </div>
            <div style={{ background: 'rgba(108,99,255,0.05)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 'var(--radius-md)', padding: '16px 20px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--text-primary)' }}>How offline sync works:</strong><br/>
              All activity is saved locally on this device first. When you connect to the internet, it automatically syncs to the cloud. Progress scores never go backwards - they are additive.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ChildProgressCard({ child }) {
  const badges = useLiveQuery(() => db.badges.where('childId').equals(child.localId).count(), [child.localId])
  const lessons = useLiveQuery(() => db.lessonCompletions.where('childId').equals(child.localId).count(), [child.localId])
  const scores = useLiveQuery(() => db.gameScores.where('childId').equals(child.localId).count(), [child.localId])

  return (
    <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 36 }}>{AVATAR_EMOJI[child.avatar] || '🐻'}</div>
        <div>
          <h3 style={{ fontWeight: 800, fontSize: 18 }}>{child.name}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Learning progress</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: 22, color: 'var(--color-primary)' }}>{lessons || 0}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Lessons</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: 22, color: '#FFE66D' }}>{badges || 0}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Badges</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: 22, color: '#4ECDC4' }}>{scores || 0}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Games</div>
        </div>
      </div>
    </div>
  )
}

const AVATAR_EMOJI = { bear:'🐻', cat:'🐱', dog:'🐶', elephant:'🐘', fox:'🦊', lion:'🦁', owl:'🦉', penguin:'🐧' }
