"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteRecord } from "@/src/actions/collections";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, FileSpreadsheet } from "lucide-react";
import type { CustomField, CustomRecord } from "@/src/types";

interface CollectionTableProps {
  orgSlug: string;
  collectionId: string;
  fields: CustomField[];
  records: CustomRecord[];
}

const formatCellValue = (
  value: unknown,
  fieldType: string,
): string => {
  if (value === null || value === undefined || value === "") return "—";

  switch (fieldType) {
    case "boolean":
      return value === true || value === "true" ? "Si" : "No";
    case "date":
      try {
        return new Date(String(value)).toLocaleDateString("es-MX");
      } catch {
        return String(value);
      }
    case "datetime":
      try {
        return new Date(String(value)).toLocaleString("es-MX");
      } catch {
        return String(value);
      }
    case "number":
      return String(value);
    case "multi_select":
      if (Array.isArray(value)) return value.join(", ");
      return String(value);
    default:
      return String(value);
  }
};

export const CollectionTable = ({
  orgSlug,
  collectionId,
  fields,
  records,
}: CollectionTableProps) => {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteRecord = async (recordId: string) => {
    setDeletingId(recordId);
    await deleteRecord(orgSlug, collectionId, recordId);
    router.refresh();
    setDeletingId(null);
  };

  if (fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Sin campos definidos</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Agrega campos para empezar a crear registros
        </p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Sin registros</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Agrega registros manualmente o importa desde CSV/Excel
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            {fields.map((field) => (
              <TableHead key={field.id}>
                <div className="flex items-center gap-1">
                  <span>{field.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({field.fieldType})
                  </span>
                </div>
              </TableHead>
            ))}
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, idx) => {
            const data = record.data as Record<string, unknown>;
            return (
              <TableRow key={record.id}>
                <TableCell className="text-muted-foreground">
                  {idx + 1}
                </TableCell>
                {fields.map((field) => (
                  <TableCell key={field.id}>
                    {formatCellValue(data[field.id], field.fieldType)}
                  </TableCell>
                ))}
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteRecord(record.id)}
                    disabled={deletingId === record.id}
                    aria-label="Eliminar registro"
                    tabIndex={0}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
