import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster, toast } from "sonner";

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster expand position={"top-right"} richColors />
    </>
  );
}
