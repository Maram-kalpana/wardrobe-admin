const pool = require("../config/db");

exports.getCouponDiscount = async (rawCode, subtotal) => {
  const code = String(rawCode || "").trim().toUpperCase();
  if (!code) return { valid: false, message: "Enter a coupon code" };

  const [rows] = await pool.query(
    "SELECT * FROM coupons WHERE code = ? AND is_active = 1",
    [code]
  );
  const c = rows[0];

  if (!c) return { valid: false, message: "Invalid coupon" };
  if (c.expiry_date && new Date(c.expiry_date) < new Date(new Date().toDateString()))
    return { valid: false, message: "Coupon has expired" };
  if (subtotal < Number(c.min_order))
    return { valid: false, message: `Minimum order is ₹${c.min_order}` };

  const discount =
    c.discount_type === "percent"
      ? (subtotal * Number(c.discount_value)) / 100
      : Math.min(Number(c.discount_value), subtotal);

  return { valid: true, code: c.code, discount: Math.round(discount * 100) / 100 };
};