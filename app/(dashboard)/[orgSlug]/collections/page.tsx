import Link from "next/link";
import { getCollections } from "@/src/actions/collections";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Database, Plus, ArrowRight, TableProperties } from "lucide-react";
import { DeleteCollectionButton } from "./delete-collection-button";

interface CollectionsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function CollectionsPage({
  params,
}: CollectionsPageProps) {
  const { orgSlug } = await params;
  const collections = await getCollections(orgSlug);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Colecciones</h1>
          <p className="text-muted-foreground">
            Crea tablas de datos personalizadas para tu organizacion
          </p>
        </div>
        <Button asChild>
          <Link href={`/${orgSlug}/collections/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva coleccion
          </Link>
        </Button>
      </div>

      {collections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Database className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              No hay colecciones
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea tu primera coleccion de datos personalizada
            </p>
            <Button asChild className="mt-4">
              <Link href={`/${orgSlug}/collections/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Crear coleccion
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {collections.map((collection) => (
            <Card key={collection.id} className="group relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {collection.icon ? (
                        <span className="text-lg">{collection.icon}</span>
                      ) : (
                        <TableProperties className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {collection.name}
                      </CardTitle>
                      {collection.description && (
                        <CardDescription>
                          {collection.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Creada{" "}
                    {new Date(collection.createdAt).toLocaleDateString("es-MX")}
                  </p>
                  <div className="flex items-center gap-2">
                    <DeleteCollectionButton
                      orgSlug={orgSlug}
                      collectionId={collection.id}
                      collectionName={collection.name}
                    />
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${orgSlug}/collections/${collection.id}`}>
                        Abrir
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
