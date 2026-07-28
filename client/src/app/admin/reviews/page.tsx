"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Star, Search, Filter, CheckCircle, XCircle, Pin, EyeOff, Eye,
  MessageSquare, Trash2, ShieldCheck, ThumbsUp, ThumbsDown, RefreshCw, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Reply modal state
  const [replyingReview, setReplyingReview] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const loadReviews = () => {
    setIsLoading(true);
    let url = `/admin/reviews?limit=100&sortBy=${sortBy}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    if (ratingFilter) url += `&rating=${ratingFilter}`;
    if (verifiedFilter !== '') url += `&verified=${verifiedFilter}`;
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

    fetchApi(url)
      .then(res => setReviews(res.reviews || []))
      .catch(() => toast.error('Failed to load reviews'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadReviews();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, ratingFilter, verifiedFilter, sortBy]);

  const handleApprove = async (id: number) => {
    try {
      await fetchApi(`/admin/reviews/${id}/approve`, { method: 'PUT' });
      toast.success('Review approved & published');
      setReviews(reviews.map(r => r.id === id ? { ...r, is_approved: 1, is_hidden: 0 } : r));
    } catch {
      toast.error('Failed to approve review');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await fetchApi(`/admin/reviews/${id}/reject`, { method: 'PUT' });
      toast.success('Review rejected');
      setReviews(reviews.map(r => r.id === id ? { ...r, is_approved: 0 } : r));
    } catch {
      toast.error('Failed to reject review');
    }
  };

  const handleTogglePin = async (id: number) => {
    try {
      const res = await fetchApi(`/admin/reviews/${id}/pin`, { method: 'PUT' });
      toast.success(res.message);
      setReviews(reviews.map(r => r.id === id ? { ...r, is_pinned: res.is_pinned } : r));
    } catch {
      toast.error('Failed to toggle pin');
    }
  };

  const handleToggleHide = async (id: number) => {
    try {
      const res = await fetchApi(`/admin/reviews/${id}/hide`, { method: 'PUT' });
      toast.success(res.message);
      setReviews(reviews.map(r => r.id === id ? { ...r, is_hidden: res.is_hidden } : r));
    } catch {
      toast.error('Failed to toggle hide');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      await fetchApi(`/admin/reviews/${id}`, { method: 'DELETE' });
      toast.success('Review deleted');
      setReviews(reviews.filter(r => r.id !== id));
    } catch {
      toast.error('Failed to delete review');
    }
  };

  const handleOpenReplyModal = (review: any) => {
    setReplyingReview(review);
    setReplyText(review.admin_reply || '');
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview || !replyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      await fetchApi(`/admin/reviews/${replyingReview.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply_text: replyText.trim() }),
      });
      toast.success('Official admin reply published');
      setReviews(reviews.map(r => r.id === replyingReview.id ? { ...r, admin_reply: replyText.trim() } : r));
      setReplyingReview(null);
    } catch {
      toast.error('Failed to save reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Customer Reviews & Ratings</h1>
          <p className="text-dark-400 text-sm">Moderate user reviews, pin top testimonials, and post official responses.</p>
        </div>
        <button
          onClick={loadReviews}
          className="btn-secondary py-2 px-4 text-xs rounded-xl flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-4 bg-dark-900/50">
        <div className="relative flex-grow max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Search by customer name, review title, comment, or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-950 border border-dark-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-dark-950 border border-dark-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500"
        >
          <option value="">All Moderation Statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending Approval</option>
          <option value="hidden">Hidden</option>
        </select>

        {/* Rating Filter */}
        <select
          value={ratingFilter}
          onChange={e => setRatingFilter(e.target.value)}
          className="bg-dark-950 border border-dark-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500"
        >
          <option value="">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>

        {/* Verified Filter */}
        <select
          value={verifiedFilter}
          onChange={e => setVerifiedFilter(e.target.value)}
          className="bg-dark-950 border border-dark-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500"
        >
          <option value="">All Buyers</option>
          <option value="1">Verified Purchases Only</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="bg-dark-950 border border-dark-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500 ml-auto"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest_rating">Highest Rating</option>
          <option value="lowest_rating">Lowest Rating</option>
        </select>
      </div>

      {/* Reviews Cards List */}
      <div className="space-y-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))
        ) : reviews.length > 0 ? (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className={`glass-card p-6 transition-all border ${
                rev.is_pinned ? 'border-amber-500/40 bg-amber-500/5' : 'border-dark-800'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dark-800/80 pb-4 mb-4">
                {/* User & Product Info */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-glow-sm">
                    {rev.user_avatar ? (
                      <img src={rev.user_avatar} alt={rev.user_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      rev.user_name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-sm">{rev.user_name}</h3>
                      {rev.verified_purchase === 1 && (
                        <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3" />
                          Verified Buyer
                        </span>
                      )}
                      {rev.is_pinned === 1 && (
                        <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <Pin className="w-3 h-3" />
                          Pinned
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-dark-400 mt-0.5">
                      Reviewed product:{' '}
                      <Link href={`/product/${rev.product_slug}`} className="text-primary-400 hover:underline font-medium">
                        {rev.product_name_en}
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Rating & Status Badges */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-dark-600'}`}
                      />
                    ))}
                  </div>

                  {rev.is_hidden === 1 ? (
                    <Badge variant="default" className="bg-rose-500/20 text-rose-300">
                      <EyeOff className="w-3 h-3 mr-1 inline" /> Hidden
                    </Badge>
                  ) : rev.is_approved === 1 ? (
                    <Badge variant="success">
                      <CheckCircle className="w-3 h-3 mr-1 inline" /> Approved
                    </Badge>
                  ) : (
                    <Badge variant="warning">
                      <AlertCircle className="w-3 h-3 mr-1 inline" /> Pending Approval
                    </Badge>
                  )}
                </div>
              </div>

              {/* Review Content */}
              <div className="space-y-2">
                {rev.title && <h4 className="font-bold text-white text-base">{rev.title}</h4>}
                <p className="text-dark-200 text-sm leading-relaxed">{rev.comment}</p>

                {/* Vote stats */}
                <div className="flex items-center gap-4 text-xs text-dark-400 pt-2">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" /> {rev.helpful_count || 0} Helpful
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsDown className="w-3.5 h-3.5 text-rose-400" /> {rev.unhelpful_count || 0} Unhelpful
                  </span>
                  <span className="ml-auto">{new Date(rev.created_at).toLocaleString()}</span>
                </div>

                {/* Admin Reply Display */}
                {rev.admin_reply && (
                  <div className="mt-4 p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-xs space-y-1">
                    <div className="flex items-center justify-between text-primary-300 font-bold">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> Official GiftVault Support Reply
                      </span>
                    </div>
                    <p className="text-dark-200">{rev.admin_reply}</p>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-dark-800/80 pt-4 mt-4">
                {rev.is_approved === 0 ? (
                  <button
                    onClick={() => handleApprove(rev.id)}
                    className="btn-primary py-1.5 px-3 text-xs rounded-xl flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleReject(rev.id)}
                    className="btn-secondary py-1.5 px-3 text-xs rounded-xl flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}

                <button
                  onClick={() => handleTogglePin(rev.id)}
                  className={`py-1.5 px-3 text-xs rounded-xl flex items-center gap-1 font-semibold transition-all ${
                    rev.is_pinned ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'btn-secondary'
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>{rev.is_pinned ? 'Unpin' : 'Pin to Top'}</span>
                </button>

                <button
                  onClick={() => handleToggleHide(rev.id)}
                  className="btn-secondary py-1.5 px-3 text-xs rounded-xl flex items-center gap-1"
                >
                  {rev.is_hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{rev.is_hidden ? 'Unhide' : 'Hide'}</span>
                </button>

                <button
                  onClick={() => handleOpenReplyModal(rev)}
                  className="btn-secondary py-1.5 px-3 text-xs rounded-xl flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{rev.admin_reply ? 'Edit Reply' : 'Reply'}</span>
                </button>

                <button
                  onClick={() => handleDelete(rev.id)}
                  className="p-2 text-dark-400 hover:text-rose-400 hover:bg-white/10 rounded-xl transition-colors"
                  title="Delete Review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-12 text-center text-dark-400">
            No reviews match your filters.
          </div>
        )}
      </div>

      {/* Admin Reply Modal */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-900 border border-dark-700 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-400" />
              <span>Official Support Reply</span>
            </h3>
            <p className="text-xs text-dark-400">
              Replying to review by <strong className="text-white">{replyingReview.user_name}</strong> on product <strong className="text-white">{replyingReview.product_name_en}</strong>.
            </p>

            <form onSubmit={handleSaveReply} className="space-y-4">
              <textarea
                rows={4}
                required
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Type your official support reply here..."
                className="w-full bg-dark-950 border border-dark-700 rounded-2xl p-3 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReplyingReview(null)}
                  className="btn-secondary py-2 px-4 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReply}
                  className="btn-primary py-2 px-5 text-xs font-semibold rounded-xl"
                >
                  {isSubmittingReply ? 'Publishing Reply...' : 'Publish Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
