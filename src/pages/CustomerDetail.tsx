import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import { customerService, CustomerDetail } from "@/services/customers";
import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/usePermissions";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canRead } = usePermissions();

  // Fetch customer details
  const { data: customer, isLoading, error } = useQuery<CustomerDetail>({
    queryKey: ["customer", id],
    queryFn: () => customerService.getCustomerById(Number(id)),
    enabled: !!id && canRead("CUSTOMERS"),
  });

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Get customer name for display
  const getCustomerName = () => {
    if (!customer) return "N/A";
    if (customer.name) return customer.name;
    if (customer.firstName || customer.lastName) {
      return `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
    }
    return customer.email || "N/A";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/customers")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Loading...</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/customers")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Customer Not Found</h1>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">The customer you're looking for doesn't exist or you don't have permission to view it.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/customers")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{getCustomerName()}</h1>
            <p className="text-muted-foreground mt-1">{customer.email}</p>
          </div>
        </div>
        {customer.type && (
          <Badge variant="outline">{customer.type}</Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer ID</span>
              <span className="font-medium text-foreground">#{customer.customerId}</span>
            </div>
            {customer.swellCustomerId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Swell Customer ID</span>
                <span className="font-medium text-foreground text-sm">{customer.swellCustomerId}</span>
              </div>
            )}
            {customer.firstName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">First Name</span>
                <span className="font-medium text-foreground">{customer.firstName}</span>
              </div>
            )}
            {customer.lastName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Name</span>
                <span className="font-medium text-foreground">{customer.lastName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {customer.email}
              </span>
            </div>
            {customer.type && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="outline">{customer.type}</Badge>
              </div>
            )}
            {customer.currency && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-medium text-foreground">{customer.currency}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email Opt-In</span>
              <Badge variant={customer.emailOptIn ? "default" : "secondary"}>
                {customer.emailOptIn ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created Date</span>
              <span className="font-medium text-foreground">{formatDate(customer.createdDate)}</span>
            </div>
            {customer.editDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-medium text-foreground">{formatDate(customer.editDate)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Orders</span>
              <span className="font-medium text-foreground text-lg">{customer.orderCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Order Value</span>
              <span className="font-medium text-foreground text-lg">
                {formatCurrency(customer.orderValue, customer.currency || "USD")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance</span>
              <span className="font-medium text-foreground">
                {formatCurrency(customer.balance, customer.currency || "USD")}
              </span>
            </div>
            {customer.dateFirstOrder && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">First Order</span>
                <span className="font-medium text-foreground">{formatDate(customer.dateFirstOrder)}</span>
              </div>
            )}
            {customer.dateLastOrder && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Order</span>
                <span className="font-medium text-foreground">{formatDate(customer.dateLastOrder)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Addresses */}
      {customer.addresses && customer.addresses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Addresses ({customer.addresses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {customer.addresses.map((address) => (
                <div key={address.addressId} className="p-4 bg-secondary/50 rounded-lg space-y-2">
                  {address.isDefault && (
                    <Badge variant="default" className="mb-2">Default</Badge>
                  )}
                  {address.addressType && (
                    <div className="text-sm text-muted-foreground">Type: {address.addressType}</div>
                  )}
                  <div className="font-medium text-foreground">
                    {address.name || `${address.firstName || ""} ${address.lastName || ""}`.trim()}
                  </div>
                  {address.address1 && (
                    <div className="text-sm text-foreground">{address.address1}</div>
                  )}
                  {address.address2 && (
                    <div className="text-sm text-foreground">{address.address2}</div>
                  )}
                  <div className="text-sm text-foreground">
                    {[address.city, address.state, address.zip].filter(Boolean).join(", ")}
                  </div>
                  {address.country && (
                    <div className="text-sm text-foreground">{address.country}</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

