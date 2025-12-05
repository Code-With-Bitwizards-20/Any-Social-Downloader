import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { memo } from "react";

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default memo(Layout);
