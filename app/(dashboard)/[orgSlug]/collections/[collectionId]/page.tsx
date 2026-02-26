import { notFound } from "next/navigation";
import Link from "next/link";
import { getCollectionWithFields, getRecords } from "@/src/actions/collections";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload } from "lucide-react";
import { CollectionTable } from "./collection-table";
import { AddRecordDialog } from "./add-record-dialog";
import { AddFieldDialog } from "./add-field-dialog";
import { EmbeddingFieldsConfig } from "./embedding-fields-config";

interface CollectionDetailPageProps {
  params: Promise<{ orgSlug: string; collectionId: string }>;
}

export default async function CollectionDetailPage({
  params,
}: CollectionDetailPageProps) {
  const { orgSlug, collectionId } = await params;
  const result = await getCollectionWithFields(orgSlug, collectionId);

  if (!result) {
    notFound();
  }

  const { collection, fields } = result;
  const records = await getRecords(orgSlug, collectionId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${orgSlug}/collections`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              {collection.icon && (
                <span className="text-xl">{collection.icon}</span>
              )}
              <h1 className="text-3xl font-bold tracking-tight">
                {collection.name}
              </h1>
            </div>
            {collection.description && (
              <p className="text-muted-foreground">{collection.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AddFieldDialog orgSlug={orgSlug} collectionId={collectionId} />
          <AddRecordDialog
            orgSlug={orgSlug}
            collectionId={collectionId}
            fields={fields}
          />
          <Button variant="outline" asChild>
            <Link href={`/${orgSlug}/collections/${collectionId}/import`}>
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Link>
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {records.length} registro{records.length !== 1 ? "s" : ""} &middot;{" "}
        {fields.length} campo{fields.length !== 1 ? "s" : ""}
      </div>

      <CollectionTable
        orgSlug={orgSlug}
        collectionId={collectionId}
        fields={fields}
        records={records}
      />

      <EmbeddingFieldsConfig
        orgSlug={orgSlug}
        collection={collection}
        fields={fields}
        recordCount={records.length}
      />
    </div>
  );
}
