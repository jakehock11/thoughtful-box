import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProduct } from '@/hooks/useProducts';
import type { Product } from '@/lib/types';

interface ProductContextValue {
  currentProductId: string | null;
  currentProduct: Product | null | undefined;
  isLoading: boolean;
  setCurrentProduct: (id: string | null) => void;
  enterProduct: (id: string) => void;
  exitProduct: () => void;
}

const ProductContext = createContext<ProductContextValue | null>(null);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: currentProduct, isLoading } = useProduct(currentProductId ?? undefined);

  const setCurrentProduct = useCallback((id: string | null) => {
    setCurrentProductId(id);
  }, []);

  const enterProduct = useCallback(
    (id: string) => {
      setCurrentProductId(id);
      navigate(`/product/${id}/home`);
    },
    [navigate]
  );

  const exitProduct = useCallback(() => {
    setCurrentProductId(null);
    navigate('/products');
  }, [navigate]);

  return (
    <ProductContext.Provider
      value={{
        currentProductId,
        currentProduct,
        isLoading,
        setCurrentProduct,
        enterProduct,
        exitProduct,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProductContext() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProductContext must be used within ProductProvider');
  }
  return context;
}
