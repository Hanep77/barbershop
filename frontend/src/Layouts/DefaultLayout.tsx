import { Outlet } from "react-router";

export default function DefaultLayout() {
  return <>
    <main className="container m-auto">
      <Outlet />
    </main>
  </>
}
