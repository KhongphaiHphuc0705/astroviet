import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { type BirthProfile } from "@features/birth-profile/api/types";
import { useBirthProfilesQuery } from "@features/birth-profile/hooks/useBirthProfilesQuery";
import { Button } from "@shared/ui/Button";
import { Card } from "@shared/ui/Card";
import { Container } from "@shared/ui/Container";
import { EmptyState } from "@shared/ui/EmptyState";
import { Grid } from "@shared/ui/Grid";
import { Skeleton } from "@shared/ui/Skeleton";
import { Stack } from "@shared/ui/Stack";

const PAGE_SIZE = 20;

const formatDate = (dateStr: string) => {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const formatTime = (timeStr: string) => {
  return timeStr.slice(0, 5);
};

export default function BirthProfilesPage() {
  const [page] = useState(1);
  const [, setDeletingProfile] = useState<BirthProfile | null>(null);
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useBirthProfilesQuery({
    page,
    pageSize: PAGE_SIZE,
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <EmptyState
          variant="danger"
          title="Không thể tải danh sách hồ sơ"
          description="Đã có lỗi xảy ra khi kết nối tới máy chủ. Vui lòng thử lại sau."
          action={<Button onClick={() => refetch()}>Thử lại</Button>}
        />
      );
    }

    if (!data || data.items.length === 0) {
      return (
        <EmptyState
          title="Bạn chưa có hồ sơ sinh nào"
          description="Tạo hồ sơ sinh đầu tiên để bắt đầu trải nghiệm các tính năng giải mã lá số."
          action={
            <Button onClick={() => navigate("/app/profiles/new")}>
              Tạo hồ sơ mới
            </Button>
          }
        />
      );
    }

    return (
      <Grid columns={{ xs: "1", md: "2", lg: "3" }} className="gap-6">
        {data.items.map((profile) => (
          <Card key={profile.id} className="flex flex-col">
            <div className="mb-4 flex-1">
              <h3
                className="truncate text-heading-sm font-semibold"
                title={profile.label}
              >
                {profile.label}
              </h3>
              {profile.fullName && (
                <p className="mt-1 truncate text-body-sm text-subtle">
                  {profile.fullName}
                </p>
              )}
              <div className="mt-4 space-y-2 text-body-sm text-subtle">
                <p>
                  📅 {formatDate(profile.birthDate)}
                  {profile.isBirthTimeKnown &&
                    profile.birthTime &&
                    ` lúc ${formatTime(profile.birthTime)}`}
                </p>
                <p className="truncate" title={profile.placeName}>
                  📍 {profile.placeName}
                </p>
              </div>
            </div>
            <Stack
              direction="horizontal"
              className="mt-auto justify-end border-t border-subtle pt-4"
              gap="2"
            >
              <Button
                as={Link}
                href={`/app/profiles/${profile.id}/edit`}
                variant="secondary"
                size="sm"
                aria-label={`Sửa hồ sơ ${profile.label}`}
              >
                Sửa
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeletingProfile(profile)}
                aria-label={`Xóa hồ sơ ${profile.label}`}
              >
                Xóa
              </Button>
            </Stack>
          </Card>
        ))}
      </Grid>
    );
  };

  return (
    <Container className="py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-display-sm font-semibold">Hồ sơ sinh của tôi</h1>
        <Button as={Link} href="/app/profiles/new">
          Tạo hồ sơ mới
        </Button>
      </div>
      {renderContent()}
    </Container>
  );
}
