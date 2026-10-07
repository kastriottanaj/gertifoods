// What to tell a customer when POST /orders/ is rejected.
//
// Reporting every failure as "your account is not approved" sent people to
// sales asking about approval when the real problem was the order, so that
// message is kept for the one response that means it: a 403, which on this
// endpoint can only come from IsApprovedBusiness (authentication is JWT-only,
// so there is no CSRF 403, and a missing login is a 401).
//
// A rejected order line is reported under `items`, keyed by its position in
// the order as sent: {"1": {"product": [...]}} since DRF 3.18, a list with {}
// for each valid line before that. Those messages sit one level below the
// order-level ones (such as a quantity under the product's minimum), which is
// how a product withdrawn after it went into the cart used to fall through to
// the approval message.

function messagesIn(value) {
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') return Object.values(value).flatMap(messagesIn);
  return [];
}

// Names of the cart lines whose product the server no longer accepts.
function withdrawnProducts(itemErrors, items) {
  if (!itemErrors || typeof itemErrors !== 'object') return [];
  return Object.entries(itemErrors)
    .filter(([, errors]) => errors && typeof errors === 'object' && errors.product)
    .map(([index]) => items[Number(index)]?.product.name)
    .filter(Boolean);
}

export function orderErrorMessage(response, items, t) {
  if (response?.status === 403) return t('cart_not_approved');

  // No response at all, or a body that is not the API's JSON (nginx's own
  // error page while Gunicorn restarts, for one): nothing to show verbatim.
  const data = response?.data;
  if (!data || typeof data !== 'object') return t('cart_order_failed');
  if (data.detail) return data.detail;

  const withdrawn = withdrawnProducts(data.items, items);
  if (withdrawn.length) {
    const key = withdrawn.length === 1 ? 'cart_item_unavailable_one' : 'cart_item_unavailable_many';
    return t(key).replace('{products}', withdrawn.join(', '));
  }
  return messagesIn(data).join(' ') || t('cart_order_failed');
}
