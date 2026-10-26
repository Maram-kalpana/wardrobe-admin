import {
  ClipboardList,
  Package,
  Settings,
  Tags,
  Ticket,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";
import { getStoreInformationApi } from "../api/settingsApi";


export default function Sidebar({
  activePage,
  setActivePage,
  sidebarOpen,
  setSidebarOpen,
}) {

  
  const [storeLogo, setStoreLogo] = useState("/vaibhavi.png");
  const [storeName, setStoreName] = useState("Wardrobe");

  useEffect(() => {
    let active = true;

    const loadStoreLogo = async () => {
      try {
        const response = await getStoreInformationApi();
        const store = response?.data;

        if (!active) return;

        if (store?.store_name) {
          setStoreName(store.store_name);
        }

        if (store?.store_logo) {
          const path = store.store_logo;

          const apiBase =
            import.meta.env.VITE_API_BASE_URL ||
            "http://localhost:5000/api";

          const origin = apiBase.replace(/\/api\/?$/, "");

          const logoUrl = /^https?:\/\//i.test(path)
            ? path
            : `${origin.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

          setStoreLogo(logoUrl);
        }
      } catch (error) {
        console.error("Store logo fetch error:", error);
      }
    };

    loadStoreLogo();

    return () => {
      active = false;
    };
  }, []);


  const openPage = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  const navClass = (page) =>
    `mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
      activePage === page
        ? "bg-[#ee027e]/10 text-[#ee027e]"
        : "text-slate-600 hover:bg-[#ee027e]/5 hover:text-[#ee027e]"
    }`;

  return (
    <>
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed left-0 top-0 z-50
          h-screen w-[240px]
          border-r border-slate-200
          bg-white
          transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* LOGO AREA */}
        <div className="flex h-[72px] items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-3">
            {/* <img
              src="/vaibhavi.png"
              alt="Wardrobe"
              className="h-[68px] w-auto max-w-[230px] object-contain"
            /> */}
            <img
  src={storeLogo}
  alt={storeName}
  className="h-[68px] w-auto max-w-[230px] object-contain"
  onError={(event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = "/vaibhavi.png";
  }}
/>
          </div>

          {/* MOBILE CLOSE */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* SIDEBAR MENU */}
        <nav className="p-4">
          {/* CATEGORY */}
          <button type="button" onClick={() => openPage("category")} className={navClass("category")}>
            <Tags size={19} />
            Category
          </button>

          {/* PRODUCTS */}
          <button type="button" onClick={() => openPage("products")} className={navClass("products")}>
            <Package size={19} />
            Products
          </button>

          {/* ORDERS */}
          <button type="button" onClick={() => openPage("orders")} className={navClass("orders")}>
            <ClipboardList size={19} />
            Orders
          </button>
          {/* COUPONS */}
<button type="button" onClick={() => openPage("coupons")} className={navClass("coupons")}>
  <Ticket size={19} />
  Coupons
</button>
          <button
            type="button"
            onClick={() =>
              openPage("settings")
            }
            className={
              navClass("settings")
            }
          >
            <Settings size={19} />

            Settings
          </button>
        </nav>
      </aside>
    </>
  );
}