import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { 
  fetchNotifications, 
  markNotificationsRead, 
  markSingleNotificationRead,
  markAllLocalRead,
  markLocalRead
} from '../../redux/slices/notificationSlice';
import { useLanguage } from '../../context/LanguageContext';

const Notifications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { items: notifications, total, loading } = useSelector((state) => state.notifications);
  const [page, setPage] = useState(1);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const limit = 10;

  useEffect(() => {
    dispatch(fetchNotifications({ page, limit }));
    window.scrollTo(0, 0);
  }, [dispatch, page]);

  const unreadCount = notifications.filter(item => item.status === 1 || !item.isRead).length;

  const handleMarkAllRead = async () => {
    if (isMarkingAll) return;
    try {
      setIsMarkingAll(true);
      // Optimistic update for instant UI feedback
      dispatch(markAllLocalRead());
      await dispatch(markNotificationsRead()).unwrap();
      dispatch(fetchNotifications({ page, limit }));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleNotificationClick = (item) => {
    // If unread, mark as read
    if (item.status === 1 || !item.isRead) {
      dispatch(markLocalRead(item._id));
      dispatch(markSingleNotificationRead(item._id));
    }

    // Redirect if notification has a target
    const targetUrl = item.data?.webPushLink || item.data?.link || item.data?.url;
    const courseId = item.data?.courseId || item.course_id;

    if (targetUrl) {
      if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      } else {
        navigate(targetUrl);
      }
    } else if (courseId) {
      navigate(`/dashboard/course/${courseId}`);
    }
  };

  const handleMarkSingle = (e, item) => {
    e.stopPropagation();
    dispatch(markLocalRead(item._id));
    dispatch(markSingleNotificationRead(item._id));
  };

  const handleNextPage = () => {
    if (page * limit < total) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-amber-100 selection:text-amber-900 font-inter">
      {/* 1. Dashboard Navbar */}
      <DashboardHeader />

      {/* 2. Main Page Content */}
      <main className="pt-24 pb-16 px-4 lg:px-8 max-w-5xl mx-auto relative z-10">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow transition-all group"
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="transform group-hover:-translate-x-1 transition-transform"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 px-1">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {t('notifications') || 'Notifications'}
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Stay updated with course announcements, assignments, and platform alerts
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleMarkAllRead}
              disabled={isMarkingAll || unreadCount === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isMarkingAll ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-slate-600" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Marking Read...</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>{t('markAllRead') || 'Mark All Read'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Notifications List Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
          {loading && (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <svg className="animate-spin h-8 w-8 text-amber-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <p className="font-medium text-sm">Loading notifications...</p>
            </div>
          )}
          
          {!loading && notifications.length === 0 && (
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">No notifications yet</h3>
              <p className="text-slate-500 text-sm max-w-sm">
                When you receive assignments, course announcements, or platform alerts, they will appear right here.
              </p>
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <div className="divide-y divide-slate-100">
              {notifications.map((item, index) => {
                const isUnread = item.status === 1 || !item.isRead;
                const hasDestination = item.data?.webPushLink || item.data?.link || item.data?.url || item.data?.courseId || item.course_id;

                return (
                  <div 
                    key={item._id || index} 
                    onClick={() => handleNotificationClick(item)}
                    className={`p-5 sm:p-6 transition-all duration-150 flex items-start gap-4 cursor-pointer group ${
                      isUnread 
                        ? 'bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-l-amber-500' 
                        : 'bg-white hover:bg-slate-50/80 border-l-4 border-l-transparent'
                    }`}
                  >
                    {/* Notification Icon */}
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      isUnread 
                        ? 'bg-amber-100 text-amber-600 shadow-sm' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {isUnread ? (
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        ) : (
                          <polyline points="20 6 9 17 4 12"></polyline>
                        )}
                      </svg>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1.5 gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-base font-bold ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                            {item.data?.title || item.title || 'Notification'}
                          </h4>
                          {isUnread && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 uppercase tracking-wider">
                              New
                            </span>
                          )}
                          {item.data?.type && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
                              {item.data.type.replace('_', ' ')}
                            </span>
                          )}
                        </div>

                        {/* Mark single as read button */}
                        {isUnread && (
                          <button
                            type="button"
                            title="Mark as read"
                            onClick={(e) => handleMarkSingle(e, item)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-600 p-1 rounded-lg hover:bg-amber-100/50 transition-all"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </button>
                        )}
                      </div>

                      <p className="text-sm text-slate-600 leading-relaxed mb-2.5">
                        {item.data?.description || item.data?.body || item.description || ''}
                      </p>

                      {/* Optional Image Thumbnail */}
                      {item.data?.image && (
                        <div className="mb-3">
                          <img
                            src={item.data.image}
                            alt="Notification attachment"
                            className="w-full max-w-sm max-h-48 object-cover rounded-xl border border-slate-200"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span>
                          {new Date(item.created_at || item.createdAt || Date.now()).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>

                        {hasDestination && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 group-hover:underline">
                            <span>Open details</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M5 12h14"></path>
                              <path d="M12 5l7 7-7 7"></path>
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && total > limit && (
            <div className="px-6 py-4 border-t border-slate-200/90 bg-slate-50 flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-600 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={page * limit >= total}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-600 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notifications;
