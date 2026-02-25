"use client";

import { useEffect, useState } from "react";
import { partnerServices } from "@/services/partner";
import Fetcher from "@/lib/fetcher";
import { AxiosError } from "axios";
import { toast } from "sonner";

// interface IProps {
//   success: number;
//   pending: number;
//   cancelled: number;
// }

export default function PartnerDashboard() {
  // const [data, setData] = useState(null);

  const fetchPartner = async () => {
    const { url, method } = partnerServices.get();

    await Fetcher({ url, method })
      .then((res) => {
        // const { data } = res;
        console.log(res);
        // setData(data);
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

  return (
    <div className="w-full h-full flex flex-col">
      <div className="grid grid-cols-4">
        {/* {data?.transaction?.map((transaction) => (
          <div
            key={transaction.id}
            className="bg-[#151820]/70 rounded-lg p-4 flex flex-col items-center justify-center"
          >
            <h3 className="text-sm text-gray-400">Transaction ID</h3>
            <p className="text-2xl font-bold">{transaction.id}</p>
          </div>
        ))} */}
      </div>
    </div>
  );
}
