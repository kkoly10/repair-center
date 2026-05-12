'use client'

import { useEffect, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'

export default function AdminTeamPage() {
  return (
    <AdminAuthGate>
      {(authState) => <AdminTeamPageInner currentUserId={authState.profile.id} />}
    </AdminAuthGate>
  )
}

function AdminTeamPageInner({ currentUserId }) {
  const [members, setMembers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('tech')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteLink, setInviteLink] = useState('')

  // Remove/cancel state
  const [removingId, setRemovingId] = useState(null)
  const [removeError, setRemoveError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [cancelError, setCancelError] = useState('')

  async function fetchTeam() {
    try {
      const res = await fetch('/admin/api/team')
      if (!res.ok) throw new Error('Failed to load team data.')
      const json = await res.json()
      setMembers(json.members || [])
      setInvitations(json.invitations || [])
      setLoading(false)
    } catch (err) {
      setError(err.message || 'Unable to load team.')
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/admin/api/team')
        if (!res.ok) throw new Error('Failed to load team data.')
        const json = await res.json()
        if (!cancelled) {
          setMembers(json.members || [])
          setInvitations(json.invitations || [])
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load team.')
          setLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  async function handleRemove(memberId) {
    setRemovingId(memberId)
    setRemoveError('')
    try {
      const res = await fetch('/admin/api/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Failed to remove member.')
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    } catch (err) {
      setRemoveError(err.message || 'Failed to remove member.')
    } finally {
      setRemovingId(null)
    }
  }

  async function handleCancelInvite(invitationId) {
    setCancellingId(invitationId)
    setCancelError('')
    try {
      const res = await fetch('/admin/api/team/invite', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Failed to cancel invitation.')
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId))
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel invitation.')
    } finally {
      setCancellingId(null)
    }
  }

  async function handleSendInvite(e) {
    e.preventDefault()
    setSendingInvite(true)
    setInviteError('')
    setInviteLink('')
    try {
      const res = await fetch('/admin/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Failed to send invitation.')
      if (json.token) {
        setInviteLink(`${window.location.origin}/invite/${json.token}`)
      }
      setInviteEmail('')
      setInviteRole('tech')
      // Refresh invitations list
      const teamRes = await fetch('/admin/api/team')
      if (teamRes.ok) {
        const teamJson = await teamRes.json()
        setInvitations(teamJson.invitations || [])
      }
    } catch (err) {
      setInviteError(err.message || 'Failed to send invitation.')
    } finally {
      setSendingInvite(false)
    }
  }

  if (loading) {
    return (
      <main className='page-hero'>
        <div className='site-shell page-stack'>
          <div className='policy-card'>Loading team...</div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className='page-hero'>
        <div className='site-shell page-stack'>
          <div className='notice'>{error}</div>
        </div>
      </main>
    )
  }

  return (
    <main className='page-hero'>
      <div className='site-shell page-stack'>

        {/* Current Members */}
        <div className='policy-card'>
          <h2>Team Members</h2>
          {removeError && <div className='notice' style={{ marginTop: 12 }}>{removeError}</div>}
          {members.length === 0 ? (
            <p className='muted' style={{ marginTop: 12 }}>No team members found.</p>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={tdStyle}>
                        {member.full_name || member.email || 'Unknown'}
                        {member.user_id === currentUserId && (
                          <span className='muted' style={{ marginLeft: 8, fontSize: '0.8rem' }}>(you)</span>
                        )}
                      </td>
                      <td style={tdStyle}>{formatRole(member.role)}</td>
                      <td style={tdStyle}>{formatStatus(member.status)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <button
                          className='button button-secondary button-compact'
                          disabled={removingId === member.id}
                          onClick={() => handleRemove(member.id)}
                          style={{ fontSize: '0.82rem' }}
                        >
                          {removingId === member.id ? 'Removing...' : 'Remove'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending Invitations */}
        <div className='policy-card'>
          <h2>Pending Invitations</h2>
          {cancelError && <div className='notice' style={{ marginTop: 12 }}>{cancelError}</div>}
          {invitations.length === 0 ? (
            <p className='muted' style={{ marginTop: 12 }}>No pending invitations.</p>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Expires</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={tdStyle}>{inv.email}</td>
                      <td style={tdStyle}>{formatRole(inv.role)}</td>
                      <td style={tdStyle}>
                        {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <button
                          className='button button-secondary button-compact'
                          disabled={cancellingId === inv.id}
                          onClick={() => handleCancelInvite(inv.id)}
                          style={{ fontSize: '0.82rem' }}
                        >
                          {cancellingId === inv.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Invite New Member */}
        <div className='policy-card'>
          <h2>Invite a Team Member</h2>
          <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type='email'
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={inputStyle}
                placeholder='staff@yourshop.com'
              />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                style={inputStyle}
              >
                <option value='tech'>Technician</option>
                <option value='admin'>Admin</option>
              </select>
            </div>
            {inviteError && <div className='notice'>{inviteError}</div>}
            <div>
              <button type='submit' className='button' disabled={sendingInvite}>
                {sendingInvite ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
            {inviteLink && (
              <div>
                <label style={{ ...labelStyle, color: '#16a34a' }}>Invite link (share with the new team member):</label>
                <input
                  type='text'
                  readOnly
                  value={inviteLink}
                  onClick={(e) => e.target.select()}
                  style={{ ...inputStyle, background: 'var(--surface-alt, #f8f9fa)', cursor: 'text' }}
                />
              </div>
            )}
          </form>
        </div>

      </div>
    </main>
  )
}

const thStyle = {
  textAlign: 'left',
  padding: '8px 12px',
  fontWeight: 700,
  fontSize: '0.82rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--muted)',
}

const tdStyle = {
  padding: '8px 12px',
}

const labelStyle = {
  display: 'block',
  fontWeight: 600,
  fontSize: '0.9rem',
  marginBottom: 6,
}

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontSize: '0.95rem',
  boxSizing: 'border-box',
}

function formatRole(role) {
  const map = { owner: 'Owner', admin: 'Admin', tech: 'Technician', viewer: 'Viewer' }
  return map[role] || role || 'Unknown'
}

function formatStatus(status) {
  if (!status) return 'Unknown'
  return status.charAt(0).toUpperCase() + status.slice(1)
}
