import React from 'react';
import Select from 'react-select';
import './ProductSelector.css';

const ProductSelector = ({ products, selectedProduct, onSelectProduct }) => {
  const options = products.map(product => ({
    value: product.id,
    label: product.name
  }));

  const selectedOption = options.find(opt => opt.value === selectedProduct);

  return (
    <div className="product-selector">
      <label>Select Product</label>
      <Select
        value={selectedOption}
        onChange={(option) => onSelectProduct(option.value)}
        options={options}
        isSearchable={false}
      />
    </div>
  );
};

export default ProductSelector;

