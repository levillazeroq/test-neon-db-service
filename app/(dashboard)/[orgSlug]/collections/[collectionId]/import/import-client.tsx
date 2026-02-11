"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { bulkImportRecords } from "@/src/actions/collections";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import type { CustomField } from "@/src/types";

interface ImportClientProps {
  orgSlug: string;
  collectionId: string;
  fields: CustomField[];
}

type ImportStep = "upload" | "mapping" | "preview" | "result";

interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
}

const IGNORE_VALUE = "__ignore__";

export const ImportClient = ({
  orgSlug,
  collectionId,
  fields,
}: ImportClientProps) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>("upload");
  const [fileName, setFileName] = useState<string>("");
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported?: number;
    error?: string;
  } | null>(null);

  // Parse CSV file
  const parseCSV = useCallback((file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields ?? [];
          const rows = results.data as Record<string, string>[];
          resolve({ headers, rows });
        },
        error: (err) => reject(err),
      });
    });
  }, []);

  // Parse Excel file
  const parseExcel = useCallback((file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(
            firstSheet,
            { raw: false },
          );

          if (jsonData.length === 0) {
            reject(new Error("El archivo esta vacio"));
            return;
          }

          const headers = Object.keys(jsonData[0]);
          resolve({ headers, rows: jsonData });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Error al leer el archivo"));
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    try {
      let data: ParsedData;
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "csv") {
        data = await parseCSV(file);
      } else if (ext === "xlsx" || ext === "xls") {
        data = await parseExcel(file);
      } else {
        alert("Formato no soportado. Usa CSV o Excel (.xlsx, .xls)");
        return;
      }

      if (data.rows.length === 0) {
        alert("El archivo no contiene datos");
        return;
      }

      setParsedData(data);

      // Auto-map by name similarity
      const autoMapping: Record<string, string> = {};
      for (const header of data.headers) {
        const match = fields.find(
          (f) => f.name.toLowerCase() === header.toLowerCase(),
        );
        if (match) {
          autoMapping[header] = match.id;
        }
      }
      setMapping(autoMapping);
      setStep("mapping");
    } catch (err) {
      alert(
        `Error al procesar el archivo: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleMappingChange = (header: string, fieldId: string) => {
    setMapping((prev) => {
      const next = { ...prev };
      if (fieldId === IGNORE_VALUE) {
        delete next[header];
      } else {
        next[header] = fieldId;
      }
      return next;
    });
  };

  const handlePreview = () => {
    if (Object.keys(mapping).length === 0) {
      alert("Mapea al menos una columna a un campo");
      return;
    }
    setStep("preview");
  };

  const transformedRecords = (): Record<string, unknown>[] => {
    if (!parsedData) return [];

    return parsedData.rows.map((row) => {
      const record: Record<string, unknown> = {};
      for (const [header, fieldId] of Object.entries(mapping)) {
        const field = fields.find((f) => f.id === fieldId);
        const rawValue = row[header];

        if (!field || rawValue === undefined || rawValue === "") continue;

        // Type coercion
        switch (field.fieldType) {
          case "number":
            record[fieldId] = Number(rawValue) || 0;
            break;
          case "boolean":
            record[fieldId] =
              rawValue.toLowerCase() === "true" ||
              rawValue.toLowerCase() === "si" ||
              rawValue === "1";
            break;
          default:
            record[fieldId] = rawValue;
        }
      }
      return record;
    });
  };

  const handleImport = async () => {
    setIsImporting(true);
    const records = transformedRecords();

    const result = await bulkImportRecords(orgSlug, collectionId, records);

    setImportResult({
      success: result.success,
      imported: result.data?.imported,
      error: result.error,
    });
    setStep("result");
    setIsImporting(false);
  };

  const handleReset = () => {
    setStep("upload");
    setFileName("");
    setParsedData(null);
    setMapping({});
    setImportResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Subir archivo</CardTitle>
            <CardDescription>
              Soporta archivos CSV y Excel (.xlsx, .xls)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors hover:border-primary/50 hover:bg-muted/50"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Seleccionar archivo"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">
                Haz clic para seleccionar un archivo
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                CSV, XLSX o XLS
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Input de archivo"
            />
          </CardContent>
        </Card>
      )}

      {/* Step 2: Column Mapping */}
      {step === "mapping" && parsedData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mapeo de columnas</CardTitle>
                <CardDescription>
                  Archivo: {fileName} &middot; {parsedData.rows.length} filas
                  encontradas
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                aria-label="Cancelar"
                tabIndex={0}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Asigna cada columna del archivo a un campo de la coleccion
            </p>
            <div className="space-y-3">
              {parsedData.headers.map((header) => (
                <div
                  key={header}
                  className="flex items-center gap-4 rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <Label className="text-sm font-medium">{header}</Label>
                    <p className="text-xs text-muted-foreground">
                      Ej: &quot;{parsedData.rows[0]?.[header] ?? ""}&quot;
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">→</span>
                    <Select
                      value={mapping[header] ?? IGNORE_VALUE}
                      onValueChange={(val) =>
                        handleMappingChange(header, val)
                      }
                    >
                      <SelectTrigger className="w-[200px]" aria-label={`Mapeo para ${header}`}>
                        <SelectValue placeholder="Ignorar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={IGNORE_VALUE}>
                          Ignorar columna
                        </SelectItem>
                        {fields.map((field) => (
                          <SelectItem key={field.id} value={field.id}>
                            {field.name} ({field.fieldType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleReset}
                tabIndex={0}
                aria-label="Cancelar"
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePreview}
                disabled={Object.keys(mapping).length === 0}
                tabIndex={0}
                aria-label="Vista previa"
              >
                Vista previa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && parsedData && (
        <Card>
          <CardHeader>
            <CardTitle>Vista previa de importacion</CardTitle>
            <CardDescription>
              {parsedData.rows.length} registros listos para importar (mostrando
              primeros 10)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    {Object.entries(mapping).map(([header, fieldId]) => {
                      const field = fields.find((f) => f.id === fieldId);
                      return (
                        <TableHead key={header}>
                          {field?.name ?? header}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.rows.slice(0, 10).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      {Object.entries(mapping).map(([header]) => (
                        <TableCell key={header}>
                          {row[header] || "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep("mapping")}
                tabIndex={0}
                aria-label="Volver al mapeo"
              >
                Volver al mapeo
              </Button>
              <Button
                onClick={handleImport}
                disabled={isImporting}
                tabIndex={0}
                aria-label="Importar datos"
              >
                {isImporting
                  ? "Importando..."
                  : `Importar ${parsedData.rows.length} registros`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Result */}
      {step === "result" && importResult && (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            {importResult.success ? (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <h3 className="mt-4 text-lg font-semibold">
                  Importacion exitosa
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Se importaron {importResult.imported} registros correctamente
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h3 className="mt-4 text-lg font-semibold">
                  Error en la importacion
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {importResult.error}
                </p>
              </>
            )}
            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={handleReset} tabIndex={0} aria-label="Importar otro archivo">
                Importar otro archivo
              </Button>
              <Button
                onClick={() =>
                  router.push(`/${orgSlug}/collections/${collectionId}`)
                }
                tabIndex={0}
                aria-label="Ver coleccion"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Ver coleccion
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info card showing collection fields */}
      {step !== "result" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campos de la coleccion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="rounded-full border px-3 py-1 text-sm"
                >
                  <span className="font-medium">{field.name}</span>
                  <span className="ml-1 text-muted-foreground">
                    ({field.fieldType})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
