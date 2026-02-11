import { notFound } from "next/navigation";
import Link from "next/link";
import { getCollectionWithFields } from "@/src/actions/collections";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ImportClient } from "./import-client";

interface ImportPageProps {
  params: Promise<{ orgSlug: string; collectionId: string }>;
}

export default async function ImportPage({ params }: ImportPageProps) {
  const { orgSlug, collectionId } = await params;
  const result = await getCollectionWithFields(orgSlug, collectionId);

  if (!result) {
    notFound();
  }

  const { collection, fields } = result;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${orgSlug}/collections/${collectionId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Importar datos
          </h1>
          <p className="text-muted-foreground">
            Importa registros a &quot;{collection.name}&quot; desde un archivo
            CSV o Excel
          </p>
        </div>
      </div>

      <ImportClient
        orgSlug={orgSlug}
        collectionId={collectionId}
        fields={fields}
      />
    </div>
  );
}
