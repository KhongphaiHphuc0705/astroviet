import { useRef } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ChartViewerSkeleton,
  isValidChartId,
  useChartQuery,
} from "@features/chart";
import type { ApiError } from "@shared/api/client";
import { getErrorMessage } from "@shared/lib/error-messages";
import { Button } from "@shared/ui/Button";
import { Container } from "@shared/ui/Container";
import { EmptyState } from "@shared/ui/EmptyState";

type ChartViewErrorKind = "not-found" | "forbidden" | "connection" | "server";

function classifyChartError(error: ApiError | null): ChartViewErrorKind {
  if (!error) return "server";
  if (error.status === 404 || error.errorCode === "RESOURCE_NOT_FOUND") {
    return "not-found";
  }
  if (error.status === 403 || error.errorCode === "FORBIDDEN") {
    return "forbidden";
  }
  if (error.errorCode === "MALFORMED_REQUEST") {
    return "not-found";
  }
  if (error.errorCode === "UNKNOWN_ERROR") {
    return "connection";
  }
  return "server";
}

export default function ChartDetailPage() {
  const { chartId } = useParams<{ chartId: string }>();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isValidId = isValidChartId(chartId);
  const query = useChartQuery(chartId);

  let content: React.ReactNode;

  if (!isValidId) {
    content = (
      <EmptyState
        title="Không tìm thấy lá số"
        description="Lá số này không tồn tại hoặc bạn không có quyền xem."
        action={
          <Button as={Link} to="/app/profiles">
            Về danh sách hồ sơ
          </Button>
        }
      />
    );
  } else if (query.data) {
    content = (
      <div data-testid="chart-ready-view" className="space-y-4">
        {/* Placeholder for M3.4 ChartViewerShell */}
        <p className="text-body-base text-subtle">Lá số: {query.data.id}</p>
      </div>
    );
  } else if (query.isLoading) {
    content = <ChartViewerSkeleton />;
  } else if (query.isError) {
    const errorKind = classifyChartError(query.error);

    if (errorKind === "not-found" || errorKind === "forbidden") {
      content = (
        <EmptyState
          title="Không tìm thấy lá số"
          description="Lá số này không tồn tại hoặc bạn không có quyền xem."
          action={
            <Button as={Link} to="/app/profiles">
              Về danh sách hồ sơ
            </Button>
          }
        />
      );
    } else if (errorKind === "connection") {
      content = (
        <EmptyState
          variant="danger"
          title="Không thể kết nối"
          description="Không thể tải lá số. Vui lòng kiểm tra kết nối mạng và thử lại."
          action={
            <Button
              variant="primary"
              onClick={() => query.refetch()}
              isLoading={query.isFetching}
            >
              Thử lại
            </Button>
          }
        />
      );
    } else {
      content = (
        <EmptyState
          variant="danger"
          title="Không thể tải lá số"
          description={getErrorMessage(
            query.error?.errorCode ?? "INTERNAL_SERVER_ERROR",
          )}
          action={
            <Button
              variant="primary"
              onClick={() => query.refetch()}
              isLoading={query.isFetching}
            >
              Thử lại
            </Button>
          }
        />
      );
    }
  } else {
    content = <ChartViewerSkeleton />;
  }

  return (
    <Container className="space-y-6 py-8">
      <div>
        <Link
          to="/app/profiles"
          className="hover:text-foreground inline-flex items-center text-body-sm text-subtle"
        >
          ← Hồ sơ sinh
        </Link>
      </div>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-display-sm font-semibold outline-none ring-focus focus-visible:ring-2"
      >
        Lá số sinh
      </h1>
      {content}
    </Container>
  );
}
