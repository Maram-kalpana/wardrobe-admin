/* =========================================
   ORDER PDF HELPERS
   jspdf is loaded only when the button is
   clicked, so it does not slow down the app.
========================================= */

// Your BACKEND address (where /uploads is served from).
// Change the port to the one your API uses.
const IMAGE_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

const IMAGE_ROW_HEIGHT = 120; // pt, height of the image row
const IMAGE_PADDING = 8; // pt, space around the image inside the cell

export const formatOrderDate = (date) => {
  if (!date) return "-";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "-";

  return value.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// The default PDF font cannot print the rupee symbol, so "Rs." is used.
const formatPdfAmount = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

/* Load an image URL and convert it to a JPEG data URL (works for
   PNG / JPG / WebP). Returns null on any failure so the PDF still
   downloads without the image. */
const loadImage = async (url) => {
  if (!url) return null;

  const fullUrl = /^(https?:|data:|blob:)/i.test(url)
    ? url
    : `${IMAGE_BASE_URL.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;

  try {
    const res = await fetch(fullUrl, { mode: "cors" });

    if (!res.ok) {
      console.warn("PDF image fetch failed:", res.status, fullUrl);
      return null;
    }

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    return await new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff"; // transparent areas become white
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        URL.revokeObjectURL(objectUrl);

        resolve({
          data: canvas.toDataURL("image/jpeg", 0.85),
          w: img.naturalWidth,
          h: img.naturalHeight,
        });
      };

      img.onerror = () => {
        console.warn("PDF image decode failed:", fullUrl);
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };

      img.src = objectUrl;
    });
  } catch (err) {
    console.warn("PDF image load error (likely CORS):", fullUrl, err);
    return null;
  }
};

/* Build the PDF document (one detail table per selected order row) */
export const buildOrdersPdf = async (rows) => {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  // Load all images first (in parallel; same image is fetched only once)
  const uniqueUrls = [...new Set(rows.map((row) => row.image).filter(Boolean))];
  console.log("PDF image URLs:", uniqueUrls);

  const loaded = await Promise.all(uniqueUrls.map((url) => loadImage(url)));
  const imageMap = new Map(uniqueUrls.map((url, i) => [url, loaded[i]]));

  const doc = new jsPDF({ unit: "pt", format: "a4" });

  doc.setFontSize(18);
  doc.setTextColor(191, 0, 0);
  doc.text("Wardrobe - Order Details", 40, 50);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `Generated: ${formatOrderDate(new Date())}   |   Orders: ${rows.length}`,
    40,
    68
  );

  let y = 90;

  rows.forEach((row) => {
    const image = imageMap.get(row.image) || null;

    const body = [
      ["Order ID", String(row.orderId)],
      ["Customer", row.customerName],
      ["Mobile", row.mobile],
      ["Address", row.address],
      ["Order Item", row.itemName],
    ];

    // Image row always present; shows a note if the image is unavailable
    const imageRowIndex = body.length;
    body.push(["Product Image", image ? "" : "Image not available"]);

       body.push(
      ["Portion", row.portion],
      ["Quantity", String(row.quantity)],
      ["Item Total", formatPdfAmount(row.totalAmount)],
      [
        "Amount Paid",
        row.paidAmount !== null && row.paidAmount !== undefined
          ? `${formatPdfAmount(row.paidAmount)} (incl. delivery${
              row.couponCode
                ? `, coupon ${row.couponCode} -${formatPdfAmount(row.discountAmount)}`
                : ""
            })`
          : "-",
      ],
      ["Payment Method", row.paymentMethod],
      ["Order Date", formatOrderDate(row.createdAt)]
    );

    autoTable(doc, {
      startY: y,
      theme: "grid",
      head: [[{ content: `Order ${row.orderId}`, colSpan: 2 }]],
      body,
      headStyles: { fillColor: [191, 0, 0], textColor: 255, fontSize: 11 },
      styles: { fontSize: 10, cellPadding: 6, overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 120, fontStyle: "bold", fillColor: [248, 250, 252] },
      },
      margin: { left: 40, right: 40 },
      pageBreak: "avoid",

      // Make the image row tall enough (only when there is an image)
      didParseCell: (data) => {
        if (
          image &&
          data.section === "body" &&
          data.row.index === imageRowIndex
        ) {
          data.cell.styles.minCellHeight = IMAGE_ROW_HEIGHT;
        }
      },

      // Draw the image inside the value cell of the image row
      didDrawCell: (data) => {
        if (
          image &&
          data.section === "body" &&
          data.row.index === imageRowIndex &&
          data.column.index === 1
        ) {
          const maxW = data.cell.width - IMAGE_PADDING * 2;
          const maxH = data.cell.height - IMAGE_PADDING * 2;
          const ratio = Math.min(maxW / image.w, maxH / image.h);
          const w = image.w * ratio;
          const h = image.h * ratio;

          doc.addImage(
            image.data,
            "JPEG",
            data.cell.x + IMAGE_PADDING,
            data.cell.y + (data.cell.height - h) / 2,
            w,
            h
          );
        }
      },
    });

    y = doc.lastAutoTable.finalY + 20;
  });

  return doc;
};

export const downloadOrdersPdf = async (rows) => {
  const doc = await buildOrdersPdf(rows);
  const date = new Date().toISOString().slice(0, 10);

  doc.save(`orders-${date}.pdf`);
};