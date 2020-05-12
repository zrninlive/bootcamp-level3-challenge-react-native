import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

async function cartSaveStorage(products: Product[]): Promise<void> {
  await AsyncStorage.setItem('@GoMarketPlace:cart', JSON.stringify(products));
}

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsCart = await AsyncStorage.getItem('@GoMarketPlace:cart');
      setProducts(JSON.parse(productsCart || '[]'));
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const productAlreadyOnCart = products.find(
        productCart => product.id === productCart.id,
      );

      if (productAlreadyOnCart) {
        const productsUpdated = products.map(productCart => {
          if (productCart.id === product.id) {
            return { ...productCart, quantity: productCart.quantity + 1 };
          }

          return productCart;
        });

        cartSaveStorage(productsUpdated);
        setProducts(productsUpdated);
        return;
      }

      const productsUpdated = [...products, { ...product, quantity: 1 }];

      cartSaveStorage(productsUpdated);
      setProducts(productsUpdated);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productsUpdated = products.map(product => {
        if (product.id === id) {
          return { ...product, quantity: product.quantity + 1 };
        }

        return product;
      });

      setProducts(productsUpdated);
      cartSaveStorage(productsUpdated);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productsUpdated = products
        .map(product => {
          if (product.id === id) {
            return { ...product, quantity: product.quantity - 1 };
          }

          return product;
        })
        .filter(product => product.quantity > 0);

      setProducts(productsUpdated);

      cartSaveStorage(productsUpdated);
    },
    [products],
  );

  const value = useMemo(() => ({ addToCart, increment, decrement, products }), [
    products,
    addToCart,
    increment,
    decrement,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
