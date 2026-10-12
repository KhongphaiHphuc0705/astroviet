import { useEffect, useMemo, useRef } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ChartViewerShell,
  ChartViewerSkeleton,
  ChartViewModelError,
  isValidChartId,
  toChartViewModel,
  useChartQuery,
} from "@features/chart";
import type { ApiError } from "@shared/api/client";
import { getErrorMessage } from "@shared/lib/error-messages";
import { reportError } from "@shared/lib/report-error";
import { Button } from "@shared/ui/Button";
import { Container } from "@shared/ui/Container";
import { EmptyState } from "@shared/ui/EmptyState";

type ChartViewErrorKind = "not-found" | "forbidden" | "connection" | "server";

type ChartViewKind =
  | "loading"
  | "not-found"
  | "forbidden"
  | "connection"
  | "server"
  | "invalid-data"
  | "ready";

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

  const mapping = useMemo(() => {
    if (!query.data) return null;
    try {
      return { ok: true as const, vm: toChartViewModel(query.data) };
    } catch (error) {
      if (error instanceof ChartViewModelError) {
        return { ok: false as const, error };
      }
      throw error;
    }
  }, [query.data]);

  const serverErrorMessage = useMemo(() => {
    if (!query.error) return "";
    return getErrorMessage(query.error.errorCode);
  }, [query.error]);

  useEffect(() => {
    if (mapping && !mapping.ok) {
      reportError(mapping.error, "chart-view-model");
    }
  }, [mapping]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Lá số sinh — AstroViet";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  let viewKind: ChartViewKind;
  if (!isValidId) {
    viewKind = "not-found";
  } else if (mapping) {
    viewKind = mapping.ok ? "ready" : "invalid-data";
  } else if (query.isLoading) {
    viewKind = "loading";
  } else if (query.isError) {
    viewKind = classifyChartError(query.error);
  } else {
    viewKind = "loading";
  }

  useEffect(() => {
    if (viewKind !== "loading") {
      headingRef.current?.focus();
    }
  }, [viewKind, chartId]);

  let content: React.ReactNode;

  if (viewKind === "loading") {
    content = <ChartViewerSkeleton />;
  } else if (viewKind === "ready" && mapping?.ok) {
    content = <ChartViewerShell vm={mapping.vm} />;
  } else if (viewKind === "invalid-data") {
    content = (
      <EmptyState
        variant="danger"
        title="Dữ liệu lá số không hợp lệ"
        description="Lá số được tải về nhưng không thể hiển thị. Vui lòng thử lại sau."
        action={
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => query.refetch()}
              isLoading={query.isFetching}
            >
              Thử lại
            </Button>
            <Button as={Link} to="/app/profiles">
              Về danh sách hồ sơ
            </Button>
          </div>
        }
      />
    );
  } else if (viewKind === "not-found" || viewKind === "forbidden") {
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
  } else if (viewKind === "connection") {
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
        description={serverErrorMessage}
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

  return (
    <Container className="space-y-6 py-8">
      <div>
        <Link
          to="/app/profiles"
          className="inline-flex items-center text-body-sm text-subtle hover:text-primary"
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
