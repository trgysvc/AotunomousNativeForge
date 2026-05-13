import { useState, useEffect, useCallback } from 'react';

type Category = {
  id: string;
  name: string;
  children?: Category[];
};

type Product = {
  id: string;
  name: string;
  categoryId: string;
  price: number;
};

const ProductSearch = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/menu/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(console.error);
  }, []);

  // Fetch products when selected category changes
  useEffect(() => {
    let url = '/api/menu/products';
    if (selectedCategoryId) {
      url += `?categoryId=${selectedCategoryId}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(console.error);
  }, [selectedCategoryId]);

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleCategorySelect = (id: string | null) => {
    setSelectedCategoryId(id);
  };

  return (
    <div className="flex gap-4 p-4">
      {/* Category Tree */}
      <nav className="w-64">
        <h2 className="font-semibold mb-2">Kategoriler</h2>
        <ul>
          {renderCategoryTree(categories, handleCategorySelect, selectedCategoryId)}
        </ul>
      </nav>

      {/* Product List */}
      <section className="flex-1">
        <div className="mb-2">
          <input
            type="text"
            placeholder="Ürün ara..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border rounded px-3 py-1 w-full"
          />
        </div>
        <ul className="space-y-2">
          {filteredProducts.map(p => (
            <li key={p.id} className="border p-2">
              <strong>{p.name}</strong> - {p.price} TL
            </li>
          ))}
          {filteredProducts.length === 0 && (
            <li className="text-gray-500">Ürün bulunamadı.</li>
          )}
        </ul>
      </section>
    </div>
  );
};

function renderCategoryTree(
  cats: Category[],
  onSelect: (id: string | null) => void,
  selectedId: string | null
) {
  return cats.map(cat => (
    <li key={cat.id} className="flex items-start">
      <label>
        <input
          type="radio"
          name="category"
          value={cat.id}
          checked={selectedId === cat.id}
          onChange={() => onSelect(cat.id)}
          className="mr-2"
        />
        {cat.name}
      </label>
      {cat.children && cat.children.length > 0 && (
        <ul className="ml-4 mt-1">{renderCategoryTree(cat.children, onSelect, selectedId)}</ul>
      )}
    </li>
  ));
};

export default ProductSearch;