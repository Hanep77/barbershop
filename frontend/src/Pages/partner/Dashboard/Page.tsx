"use client";

import { useEffect, useState } from "react";
import { partnerServices } from "@/services/partner";
import { authServices } from "@/services/auth";
import Fetcher from "@/lib/fetcher";
import { AxiosError } from "axios";
import { toast } from "sonner";
import Sidebar from "./components/Sidebar";

export default function PartnerDashboard() {
  const [partner, setPartner] = useState(null);

  const fetchPartner = async () => {
    const { url, method } = partnerServices.get();

    await Fetcher({ url, method })
      .then((res) => {
        const { data } = res;
        console.log(res);
        setPartner(data);
      })
      .catch((err) => {
        if (err instanceof AxiosError) {
          toast.error(err?.response?.data.message);
          console.log(err);
        }
        console.log(err);
      });
  };

  useEffect(() => {
    fetchPartner();
  }, []);

  return <Sidebar />;
}
