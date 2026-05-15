'use client'

import { useEffect, useState } from 'react'
import { useT, useLocale } from '../../lib/i18n/TranslationProvider'

export default function OrderMessagesSection({ quoteId }) {
  const t = useT()
  const locale = useLocale()
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(true)
  const [messageBody, setMessageBody] = useState('')
  const [messageInternalOnly, setMessageInternalOnly] = useState(false)
  const [messageSending, setMessageSending] = useState(false)
  const [messageError, setMessageError] = useState('')
  const [unreadCustomerCount, setUnreadCustomerCount] = useState(0)
  const [markingMessagesRead, setMarkingMessagesRead] = useState(false)

  useEffect(() => {
    let ignore = false

    fetch(`/admin/api/quotes/${quoteId}/messages`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((result) => {
        if (!ignore && result.ok) {
          setMessages(result.messages || [])
          setUnreadCustomerCount(result.unreadCustomerCount || 0)
        }
      })
      .catch(() => {})
      .finally(() => { if (!ignore) setMessagesLoading(false) })

    return () => { ignore = true }
  }, [quoteId])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageBody.trim()) return
    setMessageSending(true)
    setMessageError('')
    try {
      const res = await fetch(`/admin/api/quotes/${quoteId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: messageBody, senderRole: 'admin', internalOnly: messageInternalOnly }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || t('adminRepairOrder.messagesErrorSend'))
      setMessages((prev) => [...prev, result.message])
      setMessageBody('')
    } catch (err) {
      setMessageError(err.message || t('adminRepairOrder.messagesErrorSend'))
    } finally {
      setMessageSending(false)
    }
  }

  const handleMarkCustomerRepliesRead = async () => {
    setMarkingMessagesRead(true)
    setMessageError('')
    try {
      const res = await fetch(`/admin/api/quotes/${quoteId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_customer_read' }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || t('adminRepairOrder.messagesErrorMarkRead'))
      const now = new Date().toISOString()
      setUnreadCustomerCount(0)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender_role === 'customer' && msg.staff_read_at == null
            ? { ...msg, staff_read_at: now }
            : msg
        )
      )
    } catch (err) {
      setMessageError(err.message || t('adminRepairOrder.messagesErrorMarkRead'))
    } finally {
      setMarkingMessagesRead(false)
    }
  }

  const unreadSuffix = unreadCustomerCount > 0
    ? (unreadCustomerCount === 1
        ? ` · ${t('adminRepairOrder.messagesUnreadOne', { count: String(unreadCustomerCount) })}`
        : ` · ${t('adminRepairOrder.messagesUnreadOther', { count: String(unreadCustomerCount) })}`)
    : ''

  return (
    <div className='policy-card'>
      <div className='kicker'>{t('adminRepairOrder.messagesKicker')}</div>
      <h3>
        {t('adminRepairOrder.messagesHeading')}
        {unreadSuffix}
      </h3>
      <p style={{ marginBottom: 18 }}>
        {t('adminRepairOrder.messagesIntro')}
      </p>

      <div className='preview-meta' style={{ marginTop: 0 }}>
        {messagesLoading ? (
          <div className='preview-meta-row'>
            <span>{t('adminRepairOrder.messagesLoading')}</span>
            <span>—</span>
          </div>
        ) : messages.length ? (
          messages.map((msg) => (
            <div key={msg.id} className='preview-meta-row'>
              <span>
                <strong>{msg.sender_role}</strong>
                {msg.internal_only ? ` (${t('adminRepairOrder.messagesInternalSuffix')})` : ''}: {msg.body}
              </span>
              <span style={{ whiteSpace: 'nowrap' }}>
                {new Date(msg.created_at).toLocaleString(locale || 'en-US')}
              </span>
            </div>
          ))
        ) : (
          <div className='preview-meta-row'>
            <span>{t('adminRepairOrder.messagesEmpty')}</span>
            <span>—</span>
          </div>
        )}
      </div>

      {unreadCustomerCount > 0 && (
        <div className='inline-actions' style={{ marginTop: 14 }}>
          <button
            type='button'
            className='button button-secondary'
            onClick={handleMarkCustomerRepliesRead}
            disabled={markingMessagesRead}
          >
            {markingMessagesRead ? t('adminRepairOrder.messagesMarking') : t('adminRepairOrder.messagesMarkRead')}
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} style={{ marginTop: 18 }}>
        <div className='field'>
          <label htmlFor='message-body'>{t('adminRepairOrder.messagesNewLabel')}</label>
          <textarea
            id='message-body'
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder={t('adminRepairOrder.messagesNewPlaceholder')}
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, cursor: 'pointer', fontSize: 14 }}>
          <input
            type='checkbox'
            checked={messageInternalOnly}
            onChange={(e) => setMessageInternalOnly(e.target.checked)}
          />
          {t('adminRepairOrder.messagesInternalCheckbox')}
        </label>
        {messageError && <div className='notice' style={{ marginTop: 10 }}>{messageError}</div>}
        <div className='inline-actions' style={{ marginTop: 12 }}>
          <button
            type='submit'
            className='button button-primary'
            disabled={messageSending || !messageBody.trim()}
          >
            {messageSending ? t('adminRepairOrder.messagesSending') : t('adminRepairOrder.messagesSend')}
          </button>
        </div>
      </form>
    </div>
  )
}
