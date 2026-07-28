"use client";

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Star, ShieldCheck, ThumbsUp, ThumbsDown, MessageSquare, Pin, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProductReviewsProps {
  productId: number;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  
  // Write Review Modal & Eligibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eligibility, setEligibility] = useState<any>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);

  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReviews = () => {
    setIsLoading(true);
    fetchApi(`/reviews/${productId}?sortBy=${sortBy}`)
      .then(res => {
        setReviews(res.reviews || []);
        setStats(res.stats || null);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadReviews();
  }, [productId, sortBy]);

  const handleOpenWriteReview = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to leave a review.');
      return;
    }

    setIsCheckingEligibility(true);
    try {
      const res = await fetchApi(`/reviews/eligibility/${productId}`);
      setEligibility(res);
      setIsModalOpen(true);
    } catch {
      toast.error('Failed to check review eligibility.');
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !comment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetchApi('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          product_id: productId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      });
      toast.success(res.message || 'Review published!');
      setIsModalOpen(false);
      setTitle('');
      setComment('');
      loadReviews();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (reviewId: number, vote: 'helpful' | 'unhelpful') => {
    if (!isAuthenticated) {
      toast.error('Please sign in to vote on reviews.');
      return;
    }

    try {
      const res = await fetchApi(`/reviews/${reviewId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ vote }),
      });
      
      setReviews(reviews.map(r => {
        if (r.id === reviewId) {
          const userVote = r.user_vote === vote ? null : vote;
          return {
            ...r,
            helpful_count: res.helpful_count,
            unhelpful_count: res.unhelpful_count,
            user_vote: userVote,
          };
        }
        return r;
      }));
    } catch {
      toast.error('Failed to record vote');
    }
  };

  const total = stats?.total_reviews || 0;

  return (
    <div className="space-y-8">
      {/* Header & Stats Overview */}
      <div className="glass-card p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-dark-800 pb-6">
          
          {/* Average Rating Display */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-extrabold text-white font-mono">{stats?.avg_rating || '0.0'}</div>
              <div className="flex items-center justify-center text-amber-400 my-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= Math.round(stats?.avg_rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-dark-600'}`}
                  />
                ))}
              </div>
              <div className="text-xs text-dark-400">{total} Verified {total === 1 ? 'Review' : 'Reviews'}</div>
            </div>

            {/* Rating Breakdown Bars */}
            <div className="w-48 md:w-64 space-y-1.5 text-xs">
              {[5, 4, 3, 2, 1].map((star) => {
                const countKey = star === 5 ? 'five_star' : star === 4 ? 'four_star' : star === 3 ? 'three_star' : star === 2 ? 'two_star' : 'one_star';
                const count = stats?.[countKey] || 0;
                const percent = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="w-3 text-dark-400 font-mono">{star}</span>
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <div className="flex-grow h-2 bg-dark-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="w-6 text-right text-dark-400 text-[11px] font-mono">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Button */}
          <div>
            <button
              onClick={handleOpenWriteReview}
              disabled={isCheckingEligibility}
              className="btn-primary py-3 px-6 rounded-xl font-bold text-xs flex items-center gap-2 shadow-glow-sm hover:shadow-glow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isCheckingEligibility ? 'Checking Eligibility...' : 'Write a Verified Review'}</span>
            </button>
          </div>

        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-dark-400 font-medium">Customer Reviews ({total})</span>
          <div className="flex items-center gap-2">
            <span className="text-dark-400">Sort By:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-dark-900 border border-dark-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
              <option value="most_helpful">Most Helpful</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-dark-400 text-sm">Loading reviews...</div>
        ) : reviews.length > 0 ? (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className={`glass-card p-6 space-y-3 transition-all border ${
                rev.is_pinned ? 'border-amber-500/40 bg-amber-500/5' : 'border-dark-800/80'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center font-bold text-white text-sm shrink-0">
                    {rev.user_avatar ? (
                      <img src={rev.user_avatar} alt={rev.user_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      rev.user_name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{rev.user_name}</span>
                      {rev.verified_purchase === 1 && (
                        <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3" />
                          Verified Buyer
                        </span>
                      )}
                      {rev.is_pinned === 1 && (
                        <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <Pin className="w-3 h-3" />
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-dark-400 mt-0.5">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-dark-600'}`}
                    />
                  ))}
                </div>
              </div>

              {rev.title && <h4 className="font-bold text-white text-base">{rev.title}</h4>}
              <p className="text-dark-200 text-sm leading-relaxed">{rev.comment}</p>

              {/* Helpful Votes Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-dark-800/60 text-xs">
                <span className="text-dark-400">Was this review helpful?</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleVote(rev.id, 'helpful')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all ${
                      rev.user_vote === 'helpful'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-dark-900 border-dark-700 text-dark-300 hover:text-white'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{rev.helpful_count || 0}</span>
                  </button>

                  <button
                    onClick={() => handleVote(rev.id, 'unhelpful')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all ${
                      rev.user_vote === 'unhelpful'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-dark-900 border-dark-700 text-dark-300 hover:text-white'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>{rev.unhelpful_count || 0}</span>
                  </button>
                </div>
              </div>

              {/* Admin Reply */}
              {rev.admin_reply && (
                <div className="mt-3 p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-primary-300 font-bold">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>GiftVault Support Team</span>
                  </div>
                  <p className="text-dark-200">{rev.admin_reply}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="glass-card p-12 text-center text-dark-400">
            No reviews yet for this product. Be the first verified buyer to leave a review!
          </div>
        )}
      </div>

      {/* Write Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-900 border border-dark-700 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-dark-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span>Write a Review</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-dark-400 hover:text-white">✕</button>
            </div>

            {eligibility && !eligibility.canReview ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Review Restrictions</span>
                </div>
                <p>{eligibility.reason}</p>
                <div className="pt-2 text-right">
                  <button onClick={() => setIsModalOpen(false)} className="btn-secondary py-1.5 px-4 text-xs rounded-xl">Close</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Verified Purchase: Verified buyer check passed.</span>
                </div>

                {/* Rating Input */}
                <div>
                  <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Overall Rating</label>
                  <div className="flex items-center gap-2 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-7 h-7 ${(hoverRating || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-dark-700'}`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-bold text-white text-sm">{hoverRating || rating} / 5</span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1.5">Review Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Fast delivery & great value!"
                    className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1.5">Your Experience</label>
                  <textarea
                    rows={4}
                    required
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Share details about your purchase and redemption experience..."
                    className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-secondary py-2 px-4 text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary py-2.5 px-6 text-xs font-bold rounded-xl shadow-glow-sm"
                  >
                    {isSubmitting ? 'Publishing...' : 'Publish Verified Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
