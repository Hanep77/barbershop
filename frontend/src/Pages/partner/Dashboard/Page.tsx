"use client";

import { useEffect, useState } from "react";
import { partnerServices } from "@/services/partner";
import { authServices } from "@/services/auth";
import Fetcher from "@/lib/fetcher";
import { AxiosError } from "axios";
import { toast } from "sonner";

export default function PartnerDashboard() {
  const [partner, setPartner] = useState(null);

  const fetchPartner = async () => {
    const { url, method } = partnerServices.get();
    const { url: cookieurl, method: cookiemethod } = authServices.getCookie();

    await Fetcher({ url: cookieurl, method: cookiemethod }).then(async () => {
      await Fetcher({ url, method })
        .then((res) => {
          const { data } = res.data;
          setPartner(data);
        })
        .catch((err) => {
          if (err instanceof AxiosError) {
            toast.error(err?.response?.data.message);
            console.log(err);
          }
          console.log(err);
        });
    });
  };

  useEffect(() => {
    fetchPartner();
  }, []);

  return (
    <div>
      <h1>Partner Dashboard</h1>
      <p>Welcome to the admin dashboard!</p>
      <p>{JSON.stringify(partner, null, 2)}</p>
    </div>
  );
}
