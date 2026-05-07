import { useState, useEffect } from "react";
import { DollarSign, ArrowUpRight, Loader2, AlertCircle } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { AxiosError } from "axios";
import {
  getWithdrawals,
  submitWithdrawal,
  type Withdrawal,
} from "../../../services/withdrawal";
import api from "../../../lib/axios";

export function AdminWithdraw() {
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    amount: "",
    bank_name: "",
    account_name: "",
    account_number: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadWithdrawalData();
  }, []);

  const loadWithdrawalData = async () => {
    try {
      setLoading(true);
      // Fetch barbershop info for balance
      const barbershopRes = await api.get("/api/partner/barbershop");

      const barbershop = barbershopRes.data.barbershop;

      console.log(barbershop);

      if (barbershop) {
        setBalance(barbershop.balance || 0);
      }

      // Fetch withdrawals history
      const withdrawalsRes = await getWithdrawals();
      if (withdrawalsRes.data.data) {
        setWithdrawals(withdrawalsRes.data.data);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      if (err instanceof AxiosError) {
        console.log(err?.response?.data);
        toast.error(err.response?.data?.message || "Failed to load data");
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const amount = parseFloat(formData.amount);

    // Calculate available balance (excluding pending withdrawals)
    const pendingWithdrawal =
      withdrawals.length > 0 &&
      withdrawals
        .filter((w) => w.status === "pending")
        .reduce((sum, w) => sum + w.amount, 0);

    const availableBalance = balance - Number(pendingWithdrawal);

    if (!formData.amount) {
      newErrors.amount = "Nominal withdraw wajib diisi";
    } else if (isNaN(amount)) {
      newErrors.amount = "Nominal withdraw harus berupa angka";
    } else if (amount <= 0) {
      newErrors.amount = "Nominal withdraw harus lebih dari 0";
    } else if (amount > availableBalance) {
      newErrors.amount = `Saldo tersedia tidak mencukupi (${formatPrice(availableBalance)})`;
    } else if (amount < 10000) {
      newErrors.amount = "Minimal withdraw adalah 10.000";
    }

    if (!formData.bank_name) {
      newErrors.bank_name = "Nama bank wajib diisi";
    }

    if (!formData.account_name) {
      newErrors.account_name = "Nama pemilik rekening wajib diisi";
    }

    if (!formData.account_number) {
      newErrors.account_number = "Nomor rekening wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        amount: parseFloat(formData.amount),
        bank_name: formData.bank_name,
        account_name: formData.account_name,
        account_number: formData.account_number,
      };

      const res = await submitWithdrawal(payload);
      toast.success(res.data.message || "Withdraw berhasil diajukan!");

      // Reset form
      setFormData({
        amount: "",
        bank_name: "",
        account_name: "",
        account_number: "",
      });

      // Reload data
      await loadWithdrawalData();
    } catch (err) {
      console.error("Error submitting withdrawal:", err);
      if (err instanceof AxiosError) {
        const message = err.response?.data?.message;
        toast.error(message || "Gagal mengajukan withdraw");
      } else {
        toast.error("Gagal mengajukan withdraw");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-muted">
        <div className="p-6">
          <h1 className="text-foreground mb-1">Withdrawal</h1>
          <p className="text-sm text-muted-foreground">
            Kelola penarikan dana Anda
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Balance Card */}
        <Card className="bg-primary text-primary-foreground">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 mb-2">
                  Saldo Tersedia
                </p>
                <p className="text-4xl font-bold">{formatPrice(balance)}</p>
              </div>
              <DollarSign className="w-16 h-16 opacity-20" />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Withdrawal Form */}
          <Card className="lg:col-span-1 bg-card">
            <div className="p-6 border-b border-border">
              <h3 className="text-card-foreground font-bold">
                Pengajuan Withdraw
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Nominal Withdraw *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Minimal 10.000"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className={errors.amount ? "border-red-500" : ""}
                />
                {errors.amount && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.amount}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_name">Nama Bank *</Label>
                <Input
                  id="bank_name"
                  placeholder="BCA, BNI, Mandiri, dll"
                  value={formData.bank_name}
                  onChange={(e) =>
                    setFormData({ ...formData, bank_name: e.target.value })
                  }
                  className={errors.bank_name ? "border-red-500" : ""}
                />
                {errors.bank_name && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.bank_name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_name">Nama Pemilik Rekening *</Label>
                <Input
                  id="account_name"
                  placeholder="Nama lengkap"
                  value={formData.account_name}
                  onChange={(e) =>
                    setFormData({ ...formData, account_name: e.target.value })
                  }
                  className={errors.account_name ? "border-red-500" : ""}
                />
                {errors.account_name && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.account_name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_number">Nomor Rekening *</Label>
                <Input
                  id="account_number"
                  placeholder="Nomor rekening tujuan"
                  value={formData.account_number}
                  onChange={(e) =>
                    setFormData({ ...formData, account_number: e.target.value })
                  }
                  className={errors.account_number ? "border-red-500" : ""}
                />
                {errors.account_number && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.account_number}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Ajukan Withdraw
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Withdrawal History */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-card">
              <div className="p-6 border-b border-border">
                <h3 className="text-card-foreground font-bold">
                  Riwayat Withdraw
                </h3>
              </div>
              <div className="overflow-x-auto">
                {withdrawals.length > 0 ? (
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr className="text-sm text-muted-foreground">
                        <th className="text-left p-4 font-semibold">Tanggal</th>
                        <th className="text-left p-4 font-semibold">Nominal</th>
                        <th className="text-left p-4 font-semibold">Bank</th>
                        <th className="text-left p-4 font-semibold">Pemilik</th>
                        <th className="text-left p-4 font-semibold">
                          Rekening
                        </th>
                        <th className="text-left p-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((withdrawal) => (
                        <tr
                          key={withdrawal.id}
                          className="border-b border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="p-4 text-sm text-card-foreground">
                            {new Date(withdrawal.created_at).toLocaleDateString(
                              "id-ID",
                            )}
                          </td>
                          <td className="p-4 text-sm font-semibold text-primary">
                            {formatPrice(withdrawal.amount)}
                          </td>
                          <td className="p-4 text-sm text-card-foreground">
                            {withdrawal.bank_name}
                          </td>
                          <td className="p-4 text-sm text-card-foreground">
                            {withdrawal.account_name}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground font-mono">
                            {withdrawal.account_number}
                          </td>
                          <td className="p-4 text-sm">
                            <div className="space-y-1">
                              {getStatusBadge(withdrawal.status)}
                              {withdrawal.xendit_status && (
                                <p className="text-xs text-muted-foreground">
                                  {withdrawal.xendit_status}
                                </p>
                              )}
                              {withdrawal.failure_reason && (
                                <p className="text-xs text-red-600">
                                  {withdrawal.failure_reason}
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p className="mb-2">Belum ada riwayat withdraw</p>
                    <p className="text-sm">
                      Ajukan withdraw pertama Anda sekarang
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
