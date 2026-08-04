/**
 * Computes subscription lifecycle notifications from an already-
 * loaded `access.subscription` object (see getMyAccessContext() in
 * db.js) — pure function, no DB call, so it can't drift from what's
 * actually stored and doesn't need its own table or persistence.
 *
 * Returns an array (newest/most-urgent first) rather than a single
 * notification, since a trial and a renewal reminder never overlap
 * (a company is only ever in one lifecycle at a time) but this
 * keeps the shape consistent for the notification bell to render.
 */
const TRIAL_MILESTONES = [15, 7, 3, 1];
const RENEWAL_MILESTONES = [30, 15, 7, 3, 1];

function closestMilestone(daysRemaining, milestones) {
  const passed = milestones.filter((m) => daysRemaining <= m);
  return passed.length ? Math.min(...passed) : null;
}

export function getSubscriptionNotifications(subscription) {
  if (!subscription) return [];
  const notifications = [];

  if (subscription.effectiveStatus === 'Trial' && subscription.trialDaysRemaining != null) {
    const days = subscription.trialDaysRemaining;
    const milestone = closestMilestone(days, TRIAL_MILESTONES);
    if (milestone != null) {
      notifications.push({
        id: 'trial-reminder',
        severity: days <= 1 ? 'urgent' : days <= 3 ? 'warning' : 'info',
        title: `Trial: ${days} day${days === 1 ? '' : 's'} remaining`,
        message: `Your TextileIE trial ends on ${formatDate(subscription.trialEndsAt)}. Contact TextileIE Sales to activate your subscription before then.`,
        expiryDate: subscription.trialEndsAt,
      });
    }
  }

  if (subscription.effectiveStatus === 'Expired' && subscription.isTrialExpired) {
    notifications.push({
      id: 'trial-expired',
      severity: 'urgent',
      title: 'Trial expired',
      message: 'Your workspace is now read-only. Your data is completely safe — contact TextileIE Sales to activate your subscription.',
      expiryDate: subscription.trialEndsAt,
    });
  }

  if (subscription.effectiveStatus === 'Active' && subscription.renewalDaysRemaining != null) {
    const days = subscription.renewalDaysRemaining;
    const milestone = closestMilestone(days, RENEWAL_MILESTONES);
    if (milestone != null && days > 0) {
      notifications.push({
        id: 'renewal-reminder',
        severity: days <= 3 ? 'warning' : 'info',
        title: `Renewal in ${days} day${days === 1 ? '' : 's'}`,
        message: `Your subscription renews on ${formatDate(subscription.expiresAt)}. Contact the TextileIE team to confirm or update your plan.`,
        expiryDate: subscription.expiresAt,
      });
    }
  }

  if (subscription.effectiveStatus === 'Pending Renewal') {
    notifications.push({
      id: 'pending-renewal',
      severity: 'warning',
      title: 'Subscription renewal pending',
      message: `Your renewal date (${formatDate(subscription.expiresAt)}) has passed. TextileIE is still fully usable — our team will follow up to renew, extend, or update your plan.`,
      expiryDate: subscription.expiresAt,
    });
  }

  return notifications;
}

function formatDate(value) {
  if (!value) return 'soon';
  try {
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return 'soon';
  }
}
