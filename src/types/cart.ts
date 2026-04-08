import { type Category, type ProductColor, type FrameSize } from "./adminTypes";

export interface CartItem {
 
  itemId: string;
  name: string;
  price: number;
  imageUrl: string;
  category: Category;
  quantity: number;
  selectedColor: ProductColor | null;
  selectedSize: FrameSize | null;
}