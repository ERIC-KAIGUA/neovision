import { type Category, type ProductColor, type FrameSize } from "./adminTypes";

export interface CartItem {
  /** Firestore document ID */
  itemId: string;
  /** Snapshot of name at time of adding */
  name: string;
  /** Snapshot of price at time of adding (Ksh) */
  price: number;
  /** Snapshot of image URL */
  imageUrl: string;
  /** Product category */
  category: Category;
  /** How many of this variant the customer wants */
  quantity: number;
  /** Selected color — null for contact lenses */
  selectedColor: ProductColor | null;
  /** Selected size — frames only, null otherwise */
  selectedSize: FrameSize | null;
}