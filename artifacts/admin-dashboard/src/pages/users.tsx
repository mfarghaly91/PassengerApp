import React, { useState } from "react";
import { useListAdminUsers, useToggleBlockUser } from "@workspace/api-client-react";
import { getListAdminUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, MoreHorizontal, Ban, UserCheck, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useTranslation } from "react-i18next";

export default function Users() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [role, setRole] = useState<string>("all");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data, isLoading } = useListAdminUsers({
    page,
    limit: 10,
    search: search || undefined,
    role: role !== "all" ? role : undefined
  });

  const toggleBlockMutation = useToggleBlockUser();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleToggleBlock = (id: number) => {
    toggleBlockMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: t("users.statusUpdated", "User status updated") });
        queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
      }
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("users.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("users.subtitle")}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2 w-full max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t("users.searchUsers")} 
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary">{t("common.search")}</Button>
        </form>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={role} onValueChange={(val) => { setRole(val); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("users.filterByRole", "Filter by role")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("users.allRoles", "All Roles")}</SelectItem>
              <SelectItem value="user">{t("users.roleUser", "User")}</SelectItem>
              <SelectItem value="driver">{t("drivers.title")}</SelectItem>
              <SelectItem value="admin">{t("common.superAdmin")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("users.title")}</TableHead>
              <TableHead>{t("staff.role")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead>{t("users.joined", "Joined")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  {t("users.noUsers")}
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                      <span className="text-xs text-muted-foreground">{user.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.isBlocked ? (
                      <Badge variant="destructive">{t("users.blocked")}</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 hover:bg-green-100 dark:hover:bg-green-900">{t("common.active")}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">{t("users.openMenu", "Open menu")}</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/users/${user.id}`} className="flex w-full items-center cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            {t("common.details")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleBlock(user.id)}
                          className={user.isBlocked ? "text-green-600" : "text-destructive"}
                        >
                          {user.isBlocked ? (
                            <><UserCheck className="mr-2 h-4 w-4" /> {t("users.unblockUser", "Unblock User")}</>
                          ) : (
                            <><Ban className="mr-2 h-4 w-4" /> {t("users.blockUser", "Block User")}</>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
