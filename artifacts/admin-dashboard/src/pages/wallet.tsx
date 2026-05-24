import React, { useState } from "react";
import { 
  useListAllTransactions, 
  useAdminRefund,
  useGetWallet,
  getListAllTransactionsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet as WalletIcon, ArrowDownRight, ArrowUpRight, Filter, RefreshCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { formatEGP } from "@/lib/currency";
import { useTranslation } from "react-i18next";

const refundSchema = z.object({
  userId: z.coerce.number().min(1, "User ID is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().min(1, "Reason for refund is required"),
});

type RefundFormValues = z.infer<typeof refundSchema>;

export default function Wallet() {
  const [page, setPage] = useState(1);
  const [userIdFilter, setUserIdFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: walletData } = useGetWallet();

  const { data, isLoading } = useListAllTransactions({
    page,
    limit: 15,
    userId: userIdFilter ? parseInt(userIdFilter) : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  });

  const refundMutation = useAdminRefund();

  const form = useForm<RefundFormValues>({
    resolver: zodResolver(refundSchema),
    defaultValues: {
      userId: 0,
      amount: 0,
      description: "",
    },
  });

  const onSubmitRefund = (data: RefundFormValues) => {
    refundMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: t("wallet.refundIssued", "Refund issued successfully") });
        setIsRefundOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListAllTransactionsQueryKey() });
      }
    });
  };

  const clearFilters = () => {
    setUserIdFilter("");
    setTypeFilter("all");
    setPage(1);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("wallet.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("wallet.subtitle")}</p>
        </div>

        <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
              <RefreshCcw className="mr-2 h-4 w-4" /> {t("wallet.issueManualRefund", "Issue Manual Refund")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("wallet.issueManualRefund", "Issue Manual Refund")}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitRefund)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("wallet.userId", "User ID")}</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("wallet.amountEGP", "Amount (EGP)")}</FormLabel>
                      <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("wallet.reasonReference", "Reason / Reference")}</FormLabel>
                      <FormControl><Input placeholder={t("wallet.reasonPlaceholder", "Customer service compensation")} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={refundMutation.isPending}>{t("wallet.processRefund", "Process Refund")}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-xl border border-border">
        <div className="flex items-center gap-2 mr-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t("wallet.searchLedger", "Search Ledger")}:</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Input 
            placeholder={t("wallet.userIdFilter", "User ID...")} 
            value={userIdFilter} 
            onChange={(e) => { setUserIdFilter(e.target.value); setPage(1); }}
            className="w-[120px]"
            type="number"
          />
        </div>

        <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setPage(1); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t("wallet.allTypes", "All Types")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("wallet.allTypes", "All Types")}</SelectItem>
            <SelectItem value="deposit">{t("wallet.deposit", "Deposit")}</SelectItem>
            <SelectItem value="payment">{t("wallet.payment", "Payment")}</SelectItem>
            <SelectItem value="refund">{t("wallet.refund", "Refund")}</SelectItem>
          </SelectContent>
        </Select>

        {(userIdFilter || typeFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
            {t("bookings.clearFilters", "Clear Filters")}
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("wallet.txnId", "Txn ID")}</TableHead>
              <TableHead>{t("wallet.dateTime", "Date & Time")}</TableHead>
              <TableHead>{t("users.title")}</TableHead>
              <TableHead>{t("wallet.type")}</TableHead>
              <TableHead>{t("wallet.description", "Description")}</TableHead>
              <TableHead className="text-right">{t("wallet.amountEGP", "Amount (EGP)")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  {t("wallet.noTransactions", "No transactions found.")}
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="font-mono text-sm">TXN-{txn.id}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(txn.createdAt), "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{txn.user?.name || `User #${txn.userId}`}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {txn.type === 'deposit' || txn.type === 'refund' ? (
                        <ArrowDownRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-destructive" />
                      )}
                      <span className="capitalize font-medium text-sm">{txn.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm max-w-[300px] truncate">
                    {txn.description}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    <span className={txn.type === 'payment' ? 'text-destructive' : 'text-green-600 dark:text-green-500'}>
                      {txn.type === 'payment' ? '-' : '+'}{formatEGP(txn.amount)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {data && data.total > data.limit && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            <PaginationItem className="text-sm text-muted-foreground px-4">
              {t("common.page", "Page")} {page} {t("common.of", "of")} {Math.ceil(data.total / data.limit)}
            </PaginationItem>
            <PaginationItem>
              <PaginationNext 
                onClick={() => setPage(p => p + 1)}
                className={page >= Math.ceil(data.total / data.limit) ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
