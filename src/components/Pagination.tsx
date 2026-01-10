import { Button } from "@/components/ui/button";
import {
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({
  totalPages,
  currentPage,
  loading,
  onPageChange,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1);
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1 || loading}
        variant="outline"
        size="icon"
        title="First page"
        className="rounded-full cursor-pointer"
      >
        <ChevronsLeft className="size-4" />
      </Button>
      <Button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1 || loading}
        variant="outline"
        size="icon"
        title="Previous page"
        className="rounded-full cursor-pointer"
      >
        <ChevronLeft className="size-4" />
      </Button>

      {getPageNumbers().map((page, idx) =>
        page === -1 ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
            ...
          </span>
        ) : (
          <Button
            key={page}
            onClick={() => onPageChange(page)}
            disabled={loading}
            variant={currentPage === page ? "default" : "outline"}
            size="icon"
            className="rounded-full cursor-pointer"
          >
            {page}
          </Button>
        )
      )}

      <Button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages || loading}
        variant="outline"
        size="icon"
        title="Next page"
        className="rounded-full cursor-pointer"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages || loading}
        variant="outline"
        size="icon"
        title="Last page"
        className="rounded-full cursor-pointer"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
