import { notFound } from "next/navigation";
import { getOrganizationBySlug } from "@/src/actions/organizations";
import { getActiveServices, getResources } from "@/src/actions/services";
import { getCustomers } from "@/src/actions/customers";
import { NewReservationForm } from "./reservation-form";

interface NewReservationPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function NewReservationPage({
  params,
}: NewReservationPageProps) {
  const { orgSlug } = await params;
  const org = await getOrganizationBySlug(orgSlug);

  if (!org) {
    notFound();
  }

  const [servicesList, resourcesList, customersList] = await Promise.all([
    getActiveServices(orgSlug),
    getResources(orgSlug),
    getCustomers(orgSlug),
  ]);

  return (
    <NewReservationForm
      orgSlug={orgSlug}
      services={servicesList}
      resources={resourcesList}
      customers={customersList}
    />
  );
}
