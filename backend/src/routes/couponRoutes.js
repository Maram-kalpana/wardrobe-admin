const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/couponController");
// const { verifyAdmin } = require("../middleware/authMiddleware"); // use your existing one

router.post("/validate", ctrl.validateCoupon); // public

router.get("/", /* verifyAdmin, */ ctrl.getCoupons);
router.post("/", /* verifyAdmin, */ ctrl.createCoupon);
router.put("/:id", /* verifyAdmin, */ ctrl.updateCoupon);
router.delete("/:id", /* verifyAdmin, */ ctrl.deleteCoupon);

module.exports = router;