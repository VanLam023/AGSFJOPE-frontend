import React from 'react';
import { ChevronRight } from 'lucide-react';
import { formatRelativeTime } from './notificationHelpers';
import styles from './NotificationBell.module.css';

/**
 * One notification row.
 * Kept separate so future design tweaks do not bloat the bell container file.
 */
export default function NotificationItem({ notification, onClick }) {
  const unread = notification?.isRead === false;

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className={`group w-full text-left px-5 py-4 transition-colors ${
        unread ? styles.notificationCardUnread : styles.notificationCard
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="pt-1">
          <span
            className={`flex h-2.5 w-2.5 rounded-full ${
              unread ? 'bg-[#F37021]' : 'bg-slate-200'
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm leading-5 truncate ${
                  unread ? 'font-extrabold text-slate-900' : 'font-bold text-slate-700'
                }`}
              >
                {notification.title}
              </p>

              <p className={`mt-1 text-[13px] leading-5 text-slate-500 ${styles.bodyClamp}`}>
                {notification.body}
              </p>
            </div>

            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#F37021] transition-colors shrink-0 mt-0.5" />
          </div>

          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
            <span>{formatRelativeTime(notification.createdAt)}</span>

            {notification.relatedEntityType && (
              <>
                <span>•</span>
                <span className="uppercase tracking-wide">
                  {String(notification.relatedEntityType).replaceAll('_', ' ')}
                </span>
              </>
            )}

            {unread && (
              <>
                <span>•</span>
                <span className="font-semibold text-[#F37021]">Mới</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}