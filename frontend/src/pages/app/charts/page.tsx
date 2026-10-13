import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useBirthProfilesQuery } from "@features/birth-profile/hooks/useBirthProfilesQuery";
import { useChartsQuery } from "@features/chart/hooks/useChartsQuery";
import {
  ChartList,
  type ChartProfileLookup,
} from "@features/chart/ui/ChartList";
import { Alert } from "@shared/ui/Alert";
import { Button } from "@shared/ui/Button";
import { Container } from "@shared/ui/Container";
import { EmptyState } from "@shared/ui/EmptyState";
import { Skeleton } from "@shared/ui/Skeleton";

const PAGE_SIZE = 12;
const PROFILE_LOOKUP_PAGE_SIZE = 100;

export default function ChartListPage() {
  const [page, setPage] = useState(1);

  const chartsQuery = useChartsQuery({
    page,
    pageSize: PAGE_SIZE,
  });

  const profilesQuery = useBirthProfilesQuery({
    page: 1,
    pageSize: PROFILE_LOOKUP_PAGE_SIZE,
  });

  const lookup: ChartProfileLookup = useMemo(() => {
    if (profilesQuery.isLoading && !profilesQuery.data) {
      return {
        status: "loading",
        labelsById: new Map(),
        isComplete: false,
      };
    }

    if (profilesQuery.isError && !profilesQuery.data) {
      return {
        status: "error",
        labelsById: new Map(),
        isComplete: false,
      };
    }

    const items = profilesQuery.data?.items ?? [];
    const total = profilesQuery.data?.total ?? 0;
    const labelsMap = new Map<string, string>();

    for (const p of items) {
      labelsMap.set(p.id, p.fullName ?? p.label);
    }

    return {
      status: "ready",
      labelsById: labelsMap,
      isComplete: total <= items.length,
    };
  }, [profilesQuery.isLoading, profilesQuery.isError, profilesQuery.data]);

  const renderContent = () => {
    // 1. Initial loading: exactly 6 skeleton cards
    if (chartsQuery.isLoading) {
      return (
        <div role="status" aria-busy="true">
          <span className="sr-only">Đang tải danh sách lá số…</span>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        </div>
      );
    }

    // 2. Initial error (no cached data)
    if (chartsQuery.isError && !chartsQuery.data) {
      return (
        <EmptyState
          variant="danger"
          title="Không thể tải danh sách lá số"
          description="Đã có lỗi xảy ra khi kết nối tới máy chủ. Vui lòng thử lại sau."
          action={
            <div className="flex items-center gap-2">
              <Button
                onClick={() => chartsQuery.refetch()}
                isLoading={chartsQuery.isFetching}
              >
                Thử lại
              </Button>
              {page > 1 && (
                <Button variant="secondary" onClick={() => setPage(1)}>
                  Về trang đầu
                </Button>
              )}
            </div>
          }
        />
      );
    }

    // 3. Empty state: total === 0
    if (chartsQuery.data && chartsQuery.data.total === 0) {
      return (
        <EmptyState
          title="Bạn chưa có lá số nào"
          description="Tính lá số từ một hồ sơ sinh để lưu và xem lại tại đây."
          action={
            <Button as={Link} to="/app/profiles">
              Đến hồ sơ sinh
            </Button>
          }
        />
      );
    }

    // 4. Out of range page: items is empty, but total > 0 and page > 1
    if (
      chartsQuery.data &&
      chartsQuery.data.items.length === 0 &&
      chartsQuery.data.total > 0 &&
      page > 1
    ) {
      const lastPage = Math.max(
        1,
        Math.ceil(
          chartsQuery.data.total / (chartsQuery.data.pageSize || PAGE_SIZE),
        ),
      );
      return (
        <EmptyState
          title="Không còn lá số ở trang này"
          description="Danh sách lá số có thể đã thay đổi. Vui lòng quay lại trang có dữ liệu."
          action={
            <Button onClick={() => setPage(lastPage)}>Về trang cuối</Button>
          }
        />
      );
    }

    // 5. Populated state
    if (chartsQuery.data) {
      const { items, total, pageSize: serverPageSize } = chartsQuery.data;
      const effectivePageSize = serverPageSize || PAGE_SIZE;
      const totalPages = Math.max(1, Math.ceil(total / effectivePageSize));
      const showPagination = total > effectivePageSize;

      return (
        <div>
          {/* Background refetch error with cached data */}
          {chartsQuery.isError && (
            <Alert
              variant="warning"
              title="Không thể cập nhật danh sách"
              description="Đã xảy ra lỗi khi đồng bộ dữ liệu mới nhất. Bạn đang xem dữ liệu từ bộ nhớ tạm."
              className="mb-6"
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => chartsQuery.refetch()}
                  isLoading={chartsQuery.isFetching}
                >
                  Thử lại
                </Button>
              }
            />
          )}

          <div aria-busy={chartsQuery.isPlaceholderData ? "true" : undefined}>
            <ChartList items={items} lookup={lookup} />
          </div>

          {showPagination && (
            <nav
              aria-label="Phân trang danh sách lá số"
              className="mt-8 flex items-center justify-between border-t border-subtle pt-6"
            >
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1 || chartsQuery.isPlaceholderData}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <span className="text-body-sm text-secondary">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages || chartsQuery.isPlaceholderData}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </nav>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Container className="py-8">
      <h1 className="text-display-sm mb-6 font-semibold text-primary">
        Lá số của tôi
      </h1>
      {renderContent()}
    </Container>
  );
}
