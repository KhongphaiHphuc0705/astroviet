import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useController, type Control } from "react-hook-form";

import { usePosition } from "@shared/hooks/usePosition";
import { Alert } from "@shared/ui/Alert";
import { Button } from "@shared/ui/Button";
import { Input } from "@shared/ui/Input";
import { Spinner } from "@shared/ui/Spinner";

import { useLocationSearchQuery } from "../../hooks/useLocationSearchQuery";

import type { BirthProfileFormValues } from "./types";

export interface LocationSearchFieldProps {
  control: Control<BirthProfileFormValues>;
  birthDate: string;
}

export function LocationSearchField({
  control,
  birthDate,
}: LocationSearchFieldProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const positionStyles = usePosition(containerRef, isOpen);

  const {
    field,
    fieldState: { error },
  } = useController({
    name: "birthLocation",
    control,
  });

  const isBirthDateValid =
    Boolean(birthDate) && /^\d{4}-\d{2}-\d{2}$/.test(birthDate);

  const { data, isFetching, isError, refetch } = useLocationSearchQuery({
    query,
    date: isBirthDateValid ? birthDate : undefined,
    enabled: isBirthDateValid,
  });

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        popupRef.current &&
        !popupRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (
    suggestion: NonNullable<BirthProfileFormValues["birthLocation"]>,
  ) => {
    field.onChange(suggestion);
    setQuery("");
    setIsOpen(false);
  };

  const selectedLocation = field.value;

  if (selectedLocation) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-body-sm font-medium">Nơi sinh</span>
        <div className="flex items-center justify-between rounded-md border border-strong bg-surface px-4 py-2">
          <span className="truncate text-body-md">
            {selectedLocation.placeName}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              field.onChange(null);
              setQuery("");
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
          >
            Đổi địa điểm
          </Button>
        </div>
        {error && <p className="text-body-sm text-danger">{error.message}</p>}
      </div>
    );
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen && query.trim().length >= 2) setIsOpen(true);
    }
  };

  return (
    <div className="relative flex w-full flex-col gap-1.5">
      <div className="flex w-full flex-col gap-1.5">
        <label
          htmlFor="birthLocation-input"
          className={
            isBirthDateValid
              ? "flex items-center gap-1 text-body-sm font-medium uppercase text-primary"
              : "flex cursor-not-allowed items-center gap-1 text-body-sm font-medium uppercase text-primary opacity-50"
          }
        >
          Nơi sinh
        </label>
        <div ref={containerRef} className="relative w-full">
          <Input
            id="birthLocation-input"
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim().length >= 2) {
                setIsOpen(true);
              } else {
                setIsOpen(false);
              }
            }}
            onFocus={() => {
              if (query.trim().length >= 2) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isBirthDateValid
                ? "Nhập địa điểm (vd: Ho Chi Minh)..."
                : "Vui lòng nhập ngày sinh trước"
            }
            disabled={!isBirthDateValid}
            error={error?.message}
            autoComplete="off"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={isOpen ? "location-suggestions" : undefined}
            aria-haspopup="listbox"
          />
        </div>
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={popupRef}
            className="absolute z-dropdown"
            style={{
              top: positionStyles.top,
              left: positionStyles.left,
              width: positionStyles.width,
            }}
          >
            <div
              id="location-suggestions"
              role="listbox"
              className="max-h-60 flex flex-col overflow-hidden rounded-md border border-subtle bg-surface-raised py-1 shadow-level-3"
            >
              {isError ? (
                <div className="p-2">
                  <Alert
                    variant="danger"
                    title="Lỗi tra cứu"
                    description="Không thể kết nối đến máy chủ."
                    actions={
                      <Button type="button" size="sm" onClick={() => refetch()}>
                        Thử lại
                      </Button>
                    }
                  />
                </div>
              ) : isFetching ? (
                <div className="flex items-center justify-center p-4">
                  <Spinner size="xs" />
                  <span className="ml-2 text-body-sm">Đang tìm kiếm...</span>
                </div>
              ) : data && data.length === 0 && query.trim().length >= 2 ? (
                <div className="py-4 text-center text-body-sm text-muted">
                  Không tìm thấy địa điểm phù hợp
                </div>
              ) : data && data.length > 0 ? (
                <ul className="flex-1 overflow-auto focus:outline-none">
                  {data.map((suggestion) => (
                    <li
                      key={`${suggestion.latitude}-${suggestion.longitude}`}
                      role="option"
                      aria-selected={false}
                      onClick={() => handleSelect(suggestion)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelect(suggestion);
                        }
                      }}
                      tabIndex={0}
                      className="cursor-pointer px-4 py-2 text-body-md text-primary transition-colors hover:bg-surface-hover"
                    >
                      {suggestion.placeName}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
