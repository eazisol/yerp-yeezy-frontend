import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Eye, Download } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const orders = [
  {
    id: "#ORD-1284",
    customer: "John Smith",
    email: "john@example.com",
    date: "2025-11-25",
    payment: "paid",
    paymentMethod: "paypal",
    fulfillment: "fulfilled",
    total: "$489",
  },
  {
    id: "#ORD-1283",
    customer: "Emma Wilson",
    email: "emma@example.com",
    date: "2025-11-25",
    payment: "paid",
    paymentMethod: "applepay",
    fulfillment: "unfulfilled",
    total: "$712",
  },
  {
    id: "#ORD-1282",
    customer: "Michael Brown",
    email: "michael@example.com",
    date: "2025-11-24",
    payment: "pending",
    paymentMethod: "visa",
    fulfillment: "fulfilled",
    total: "$298",
  },
  {
    id: "#ORD-1281",
    customer: "Sarah Davis",
    email: "sarah@example.com",
    date: "2025-11-24",
    payment: "paid",
    paymentMethod: "mastercard",
    fulfillment: "partial",
    total: "$1,024",
  },
  {
    id: "#ORD-1280",
    customer: "Robert Johnson",
    email: "robert@example.com",
    date: "2025-11-23",
    payment: "refunded",
    paymentMethod: "paypal",
    fulfillment: "fulfilled",
    total: "$560",
  },
];

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { canRead, canModify } = usePermissions();

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Extract order number from order ID (e.g., "#ORD-1284" -> "1284")
  const getOrderNumber = (orderId: string) => {
    // Extract numbers from the order ID
    const match = orderId.match(/\d+$/);
    return match ? match[0] : orderId;
  };

  // Format payment method name for display
  const formatPaymentMethodName = (method: string) => {
    if (!method) return "";
    return method
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Get payment method icon (small icons)
  const getPaymentMethodIcon = (method: string) => {
    if (!method) return null;
    
    switch (method?.toLowerCase()) {
      case "paypal":
        return (
          <div className="flex items-center justify-center w-8 h-5 rounded bg-[#0070ba]">
            <span className="text-[8px] font-bold text-white">PP</span>
          </div>
        );
      case "applepay":
      case "apple pay":
        return (
          <div className="flex items-center justify-center w-8 h-5 rounded bg-black">
            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
          </div>
        );
      case "visa":
        return (
          <div className="flex items-center justify-center w-8 h-5 rounded bg-[#1434CB]">
            <span className="text-[7px] font-bold text-white">VISA</span>
          </div>
        );
      case "mastercard":
        return (
          <div className="flex items-center justify-center w-8 h-5 rounded relative overflow-hidden bg-gradient-to-r from-[#EB001B] to-[#F79E1B]">
            <div className="absolute left-0 w-3 h-3 rounded-full bg-white opacity-80"></div>
            <div className="absolute right-0 w-3 h-3 rounded-full bg-white opacity-80"></div>
            <span className="text-[6px] font-semibold text-white relative z-10">MC</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-8 h-5 rounded bg-gray-200">
            <span className="text-[7px] font-medium text-gray-600">{method?.substring(0, 2).toUpperCase()}</span>
          </div>
        );
    }
  };

  // Get payment status colors
  const getPaymentStatus = (payment: string) => {
    switch (payment) {
      case "paid":
        return { 
          bgColor: "bg-green-100", 
          textColor: "text-green-700", 
          dotColor: "bg-green-600",
          label: "Paid" 
        };
      case "pending":
        return { 
          bgColor: "bg-yellow-100", 
          textColor: "text-yellow-700", 
          dotColor: "bg-yellow-600",
          label: "Pending" 
        };
      case "refunded":
        return { 
          bgColor: "bg-red-100", 
          textColor: "text-red-700", 
          dotColor: "bg-red-600",
          label: "Refunded" 
        };
      default:
        return { 
          bgColor: "bg-gray-100", 
          textColor: "text-gray-600", 
          dotColor: "bg-gray-500",
          label: payment 
        };
    }
  };

  // Get fulfillment status colors
  const getFulfillmentStatus = (fulfillment: string) => {
    switch (fulfillment) {
      case "fulfilled":
        return { 
          bgColor: "bg-green-100", 
          textColor: "text-green-700", 
          dotColor: "bg-green-600",
          label: "Fulfilled" 
        };
      case "unfulfilled":
        return { 
          bgColor: "bg-orange-100", 
          textColor: "text-orange-700", 
          dotColor: "bg-orange-600",
          label: "Unfulfilled" 
        };
      case "partial":
        return { 
          bgColor: "bg-blue-100", 
          textColor: "text-blue-700", 
          dotColor: "bg-blue-600",
          label: "Partial" 
        };
      default:
        return { 
          bgColor: "bg-gray-100", 
          textColor: "text-gray-600", 
          dotColor: "bg-gray-500",
          label: fulfillment 
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Auto-imported orders from Swell with routing status
          </p>
        </div>
        {canRead("ORDERS") && (
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CN Routed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">642</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              US Routed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">587</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mixed Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">55</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by order ID or customer..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order List ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead>Fulfillment</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const paymentStatus = getPaymentStatus(order.payment);
                const fulfillmentStatus = getFulfillmentStatus(order.fulfillment);
                return (
                  <TableRow key={order.id} className="cursor-pointer hover:bg-secondary/50">
                    {/* Order Column */}
                    <TableCell className="font-medium">{getOrderNumber(order.id)}</TableCell>
                    
                    {/* Date Column */}
                    <TableCell className="text-muted-foreground">
                      {formatDate(order.date)}
                    </TableCell>
                    
                    {/* Customer Column */}
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{order.customer}</div>
                        <div className="text-xs text-muted-foreground">{order.email}</div>
                      </div>
                    </TableCell>
                    
                    {/* Payment Column */}
                    <TableCell>
                      <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentStatus.bgColor} ${paymentStatus.textColor}`}>
                        <div className={`h-2 w-2 rounded-full ${paymentStatus.dotColor}`} />
                        <span>{paymentStatus.label}</span>
                      </div>
                    </TableCell>
                    
                    {/* Payment Method Column */}
                    <TableCell className="w-12">
                      {order.paymentMethod ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help inline-block">
                                {getPaymentMethodIcon(order.paymentMethod)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{formatPaymentMethodName(order.paymentMethod)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <div className="inline-block">
                          {getPaymentMethodIcon(order.paymentMethod)}
                        </div>
                      )}
                    </TableCell>
                    
                    {/* Fulfillment Column */}
                    <TableCell>
                      <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${fulfillmentStatus.bgColor} ${fulfillmentStatus.textColor}`}>
                        <div className={`h-2 w-2 rounded-full ${fulfillmentStatus.dotColor}`} />
                        <span>{fulfillmentStatus.label}</span>
                      </div>
                    </TableCell>
                    
                    {/* Total Column */}
                    <TableCell className="text-right font-medium">{order.total}</TableCell>
                    
                    {/* Actions Column */}
                    <TableCell className="text-right">
                      {canRead("ORDERS") && (
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/orders/${order.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
