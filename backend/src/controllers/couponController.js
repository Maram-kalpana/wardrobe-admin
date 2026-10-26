const pool = require("../config/db");
const { getCouponDiscount } = require("../utils/applyCoupon");

const clean = (body) => ({
  code: String(body.code || "").trim().toUpperCase(),
  discount_type: body.discount_type === "flat" ? "flat" : "percent",
  discount_value: Number(body.discount_value),
  min_order: Number(body.min_order) || 0,
  expiry_date: body.expiry_date || null,
  is_active: body.is_active ? 1 : 0,
});

const validate = (c) => {
  if (!c.code) return "Coupon code is required";
  if (!(c.discount_value > 0)) return "Enter a valid discount value";
  if (c.discount_type === "percent" && c.discount_value > 100)
    return "Percentage cannot be more than 100";
  return null;
};

exports.getCoupons = async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM coupons ORDER BY id DESC");
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.createCoupon = async (req, res, next) => {
  const c = clean(req.body);
  const error = validate(c);
  if (error) return res.status(400).json({ success: false, message: error });

  try {
    const [result] = await pool.query("INSERT INTO coupons SET ?", [c]);
    res.status(201).json({ success: true, data: { id: result.insertId, ...c } });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ success: false, message: "Coupon code already exists" });
    next(err);
  }
};

exports.updateCoupon = async (req, res, next) => {
  const c = clean(req.body);
  const error = validate(c);
  if (error) return res.status(400).json({ success: false, message: error });

  try {
    const [result] = await pool.query("UPDATE coupons SET ? WHERE id = ?", [c, req.params.id]);
    if (!result.affectedRows)
      return res.status(404).json({ success: false, message: "Coupon not found" });
    res.json({ success: true, data: { id: Number(req.params.id), ...c } });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ success: false, message: "Coupon code already exists" });
    next(err);
  }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    const [result] = await pool.query("DELETE FROM coupons WHERE id = ?", [req.params.id]);
    if (!result.affectedRows)
      return res.status(404).json({ success: false, message: "Coupon not found" });
    res.json({ success: true, message: "Coupon deleted" });
  } catch (err) {
    next(err);
  }
};

// Public, for checkout: POST /api/coupons/validate { code, subtotal }
exports.validateCoupon = async (req, res, next) => {
  try {
    const subtotal = Number(req.body.subtotal) || 0;
    const result = await getCouponDiscount(req.body.code, subtotal);

    if (!result.valid)
      return res.status(400).json({ success: false, message: result.message });

    res.json({ success: true, data: { code: result.code, discount: result.discount } });
  } catch (err) {
    next(err);
  }
};