import { type Category, type ProductColor, type FrameSize } from "./adminTypes";



export type OrderStatus =
  | "pending"     
  | "processing"  
  | "completed"   
  | "dispatched"  
  | "delivered"; 



export type PaymentMethod = "mpesa";

export type PaymentStatus =
  | "pending"    
  | "completed"  
  | "failed";    



export interface OrderItem {
  itemId:        string;
  name:          string;
  price:         number;        
  imageUrl:      string;
  category:      Category;
  quantity:      number;
  selectedColor: ProductColor | null;
  selectedSize:  FrameSize | null;
  subtotal:      number;        
}



export interface DeliveryDetails {
  customerName:    string;
  customerPhone:   string;
  deliveryAddress: string;
  deliveryNotes:   string;  
}



export interface FulfillingBranch {
  branchId:   string;
  branchName: string;
}



export interface Order {
  id:               string;
  customerId:       string;         
  customerEmail:    string;
  delivery:         DeliveryDetails;
  items:            OrderItem[];
  fulfillingBranch: FulfillingBranch;
  paymentMethod:    PaymentMethod;
  paymentStatus:    PaymentStatus;
  mpesaReceiptNo:   string | null;  
  checkoutRequestId: string | null; 
  total:            number;
  status:           OrderStatus;
  createdAt?:       { seconds: number; nanoseconds: number };
  updatedAt?:       { seconds: number; nanoseconds: number };
}



export interface CheckoutFormData {
  customerName:    string;
  customerPhone:   string;
  deliveryAddress: string;
  deliveryNotes:   string;
}

export const EMPTY_CHECKOUT_FORM: CheckoutFormData = {
  customerName:    "",
  customerPhone:   "",
  deliveryAddress: "",
  deliveryNotes:   "",
};


export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; bg: string }
> = {
  pending:    { label: "Pending",    color: "text-amber-600",  bg: "bg-amber-50 border-amber-200"  },
  processing: { label: "Processing", color: "text-blue-600",   bg: "bg-blue-50 border-blue-200"    },
  completed:  { label: "Completed",  color: "text-green-600",  bg: "bg-green-50 border-green-200"  },
  dispatched: { label: "Dispatched", color: "text-purple-600", bg: "bg-purple-50 border-purple-200"},
  delivered:  { label: "Delivered",  color: "text-gray-600",   bg: "bg-gray-50 border-gray-200"    },
};