import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchReviews,
  fetchMyReview,
  fetchReviewEligibility,
  submitReview,
  updateReview,
  type Review,
} from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Real customer reviews for a product. Only a customer with a delivered
 * order_item for this product can write one (enforced again server-side by
 * RLS — see 20260902120000_reviews.sql). The eligibility check only fires
 * once we know the customer hasn't already reviewed, so this is a two-step
 * sequential fetch rather than parallel: cheap trade-off for a section that
 * isn't on the page's critical path.
 */
export function ReviewSection({ productId }: { productId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: reviews } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => fetchReviews(productId),
  });

  const { data: myReview } = useQuery({
    queryKey: ["my-review", productId, user?.id],
    enabled: Boolean(user),
    queryFn: () => fetchMyReview(productId, user!.id),
  });

  const { data: eligibleOrderItemId } = useQuery({
    queryKey: ["review-eligibility", productId, user?.id],
    enabled: Boolean(user) && myReview === null,
    queryFn: () => fetchReviewEligibility(productId, user!.id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
    queryClient.invalidateQueries({ queryKey: ["my-review", productId, user?.id] });
    // The aggregate rating/rating_count shown above live on catalog_variants.
    queryClient.invalidateQueries({ queryKey: ["product"] });
  };

  const showCreateForm = Boolean(user) && !myReview && Boolean(eligibleOrderItemId);
  const showEditForm = Boolean(user) && Boolean(myReview) && editing;

  return (
    <section className="mt-12">
      <h2 className="font-display text-lg font-bold">Customer reviews</h2>

      {user && myReview && !editing && (
        <div className="mt-4 rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your review
          </p>
          <ReviewRow review={myReview} />
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm font-semibold text-gold hover:underline"
          >
            Edit your review
          </button>
        </div>
      )}

      {showCreateForm && eligibleOrderItemId && (
        <ReviewForm
          mode="create"
          productId={productId}
          customerId={user!.id}
          orderItemId={eligibleOrderItemId}
          onDone={() => invalidate()}
        />
      )}

      {showEditForm && myReview && (
        <ReviewForm
          mode="edit"
          productId={productId}
          customerId={user!.id}
          reviewId={myReview.id}
          initial={myReview}
          onDone={() => {
            setEditing(false);
            invalidate();
          }}
        />
      )}

      {user && !myReview && !eligibleOrderItemId && (
        <p className="mt-3 text-xs text-muted-foreground">
          Only customers who have received this product can leave a review.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {reviews?.length ? (
          reviews.map((r) => <ReviewRow key={r.id} review={r} />)
        ) : (
          <p className="text-sm text-muted-foreground">
            No reviews yet — be the first to review this product.
          </p>
        )}
      </div>
    </section>
  );
}

function ReviewForm({
  mode,
  productId,
  customerId,
  orderItemId,
  reviewId,
  initial,
  onDone,
}: {
  mode: "create" | "edit";
  productId: string;
  customerId: string;
  orderItemId?: string;
  reviewId?: string;
  initial?: Pick<Review, "rating" | "title" | "body">;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      if (mode === "create" && orderItemId) {
        await submitReview({
          productId,
          customerId,
          orderItemId,
          rating,
          title: title.trim() || null,
          body: body.trim() || null,
        });
      } else if (mode === "edit" && reviewId) {
        await updateReview(reviewId, {
          rating,
          title: title.trim() || null,
          body: body.trim() || null,
        });
      }
      toast.success("Thanks — your review is live.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your review");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-border p-4">
      <p className="text-sm font-semibold">
        {mode === "create" ? "Write a review" : "Edit your review"}
      </p>

      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star`}>
            <Star
              className={cn(
                "h-6 w-6",
                n <= rating ? "fill-gold text-gold" : "text-muted-foreground",
              )}
            />
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        placeholder="Review title (optional)"
        className="mt-3 w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="What did you think of this product?"
        className="mt-2 w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold"
      />

      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="mt-3 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving..." : "Submit review"}
      </button>
    </div>
  );
}

function ReviewRow({ review }: { review: Review }) {
  return (
    <div className="border-b border-border pb-4 last:border-0">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-gold">
          {review.rating}
          <Star className="h-3.5 w-3.5 fill-current" />
        </span>
        <span className="text-xs text-muted-foreground">
          Verified buyer &middot; {formatDate(review.created_at)}
        </span>
      </div>
      {review.title && <p className="mt-1 text-sm font-semibold">{review.title}</p>}
      {review.body && <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>}
    </div>
  );
}
