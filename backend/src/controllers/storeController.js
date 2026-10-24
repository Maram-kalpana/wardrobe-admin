
const db = require("../config/db");

const FIELDS = [
  "store_name",
  "mobile_number",
  "whatsapp_number",
  "email",
  "store_address",
  "city",
  "state",
  "country",
  "postal_code",
];


const getStoreInformation = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM store_information WHERE id = 1"
    );

    res.json({
      success: true,
      data: rows[0] || null,
    });
  } catch (error) {
    next(error);
  }
};

const saveStoreInformation = async (req, res, next) => {
  try {
    const data = {};

    for (const field of FIELDS) {
      data[field] = String(req.body[field] ?? "").trim();
    }

    if (!data.store_name) {
      return res.status(400).json({
        message: "Store name is required",
      });
    }

    if (!data.mobile_number) {
      return res.status(400).json({
        message: "Mobile number is required",
      });
    }

    if (!/^[0-9]{10,15}$/.test(data.mobile_number)) {
      return res.status(400).json({
        message: "Enter a valid mobile number",
      });
    }

   
if (
  data.email &&
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
) {
  return res.status(400).json({
    success: false,
    message: "Enter a valid email address",
  });
}


    const [existing] = await db.query(
      "SELECT store_logo FROM store_information WHERE id = 1"
    );


    
const logo = req.file
  ? `/uploads/store/${req.file.filename}`
  : existing[0]?.store_logo ?? null;

console.log("Request Content-Type:", req.headers["content-type"]);
console.log("Uploaded logo:", req.file?.filename);
console.log("Logo database path:", logo);


    await db.query(
      `INSERT INTO store_information
      (
        id, store_name, store_logo, mobile_number,
        whatsapp_number, email, store_address,
        city, state, country, postal_code
      )
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        store_name = VALUES(store_name),
        store_logo = VALUES(store_logo),
        mobile_number = VALUES(mobile_number),
        whatsapp_number = VALUES(whatsapp_number),
        email = VALUES(email),
        store_address = VALUES(store_address),
        city = VALUES(city),
        state = VALUES(state),
        country = VALUES(country),
        postal_code = VALUES(postal_code)`,
      [
        data.store_name,
        logo,
        data.mobile_number,
        data.whatsapp_number,
        data.email,
        data.store_address,
        data.city,
        data.state,
        data.country,
        data.postal_code,
      ]
    );

    const [rows] = await db.query(
      "SELECT * FROM store_information WHERE id = 1"
    );

    res.json({
      success: true,
      message: "Store information saved successfully",
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStoreInformation,
  saveStoreInformation,
};
