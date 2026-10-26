import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import {
  getCouponsApi,
  createCouponApi,
  updateCouponApi,
  deleteCouponApi,
} from "../api/couponApi";

const emptyForm = {
  code: "",
  discount_type: "percent", // "percent" | "flat"
  discount_value: "",
  min_order: "",
  expiry_date: "",
  is_active: true,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await getCouponsApi();
      setCoupons(res?.data?.data || res?.data || []);
    } catch (err) {
      console.error("Load coupons error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code || "",
      discount_type: coupon.discount_type || "percent",
      discount_value: coupon.discount_value ?? "",
      min_order: coupon.min_order ?? "",
      expiry_date: coupon.expiry_date ? coupon.expiry_date.slice(0, 10) : "",
      is_active: !!coupon.is_active,
    });
    setError("");
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.code.trim()) return setError("Coupon code is required");
    if (!form.discount_value || Number(form.discount_value) <= 0)
      return setError("Enter a valid discount value");
    if (form.discount_type === "percent" && Number(form.discount_value) > 100)
      return setError("Percentage cannot be more than 100");

    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      discount_value: Number(form.discount_value),
      min_order: form.min_order ? Number(form.min_order) : 0,
      expiry_date: form.expiry_date || null,
    };

    try {
      setSaving(true);
      if (editingId) await updateCouponApi(editingId, payload);
      else await createCouponApi(payload);
      setModalOpen(false);
      loadCoupons();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;
    try {
      await deleteCouponApi(coupon.id);
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete coupon");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#ee027e]";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Coupons</h1>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-[#ee027e] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus size={18} /> Add Coupon
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Min Order</th>
              <th className="px-4 py-3">Expiry</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No coupons yet
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold">{c.code}</td>
                  <td className="px-4 py-3">
                    {c.discount_type === "percent"
                      ? `${c.discount_value}%`
                      : `₹${c.discount_value}`}
                  </td>
                  <td className="px-4 py-3">₹{c.min_order || 0}</td>
                  <td className="px-4 py-3">
                    {c.expiry_date
                      ? new Date(c.expiry_date).toLocaleDateString()
                      : "No expiry"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        c.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl bg-white p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingId ? "Edit Coupon" : "Add Coupon"}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="Coupon code (e.g. SAVE10)"
                className={`${inputClass} uppercase`}
              />

              <div className="flex gap-3">
                <select
                  name="discount_type"
                  value={form.discount_type}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
                <input
                  name="discount_value"
                  type="number"
                  min="0"
                  value={form.discount_value}
                  onChange={handleChange}
                  placeholder="Value"
                  className={inputClass}
                />
              </div>

              <input
                name="min_order"
                type="number"
                min="0"
                value={form.min_order}
                onChange={handleChange}
                placeholder="Minimum order amount (optional)"
                className={inputClass}
              />

              <input
                name="expiry_date"
                type="date"
                value={form.expiry_date}
                onChange={handleChange}
                className={inputClass}
              />

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                Active
              </label>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#ee027e] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : editingId ? "Update" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}