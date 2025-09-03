import React, { useState } from 'react';
import './ModelsExplorer.css';

function ModelsExplorer({ models, providers }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('all');

  const categories = [
    { id: 'all', label: 'All Models', count: models.length },
    { id: 'free', label: 'Free Models', count: models.filter(m => m.pricing_tier === 'free').length },
    { id: 'pro', label: 'Pro Models', count: models.filter(m => m.pricing_tier === 'pro').length },
    { id: 'text', label: 'Text Generation', count: models.filter(m => m.category === 'text').length },
    { id: 'image', label: 'Image Generation', count: models.filter(m => m.category === 'image').length },
    { id: 'audio', label: 'Audio Processing', count: models.filter(m => m.category === 'audio').length },
    { id: 'video', label: 'Video Generation', count: models.filter(m => m.category === 'video').length },
    { id: 'code', label: 'Code & Development', count: models.filter(m => m.category === 'code').length },
    { id: 'multimodal', label: 'Multimodal', count: models.filter(m => m.category === 'multimodal').length },
    { id: 'embeddings', label: 'Embeddings', count: models.filter(m => m.category === 'embeddings').length }
  ];

  const filteredModels = models.filter(model => {
    let categoryMatch = selectedCategory === 'all';

    if (selectedCategory === 'free') {
      categoryMatch = model.pricing_tier === 'free';
    } else if (selectedCategory === 'pro') {
      categoryMatch = model.pricing_tier === 'pro';
    } else {
      categoryMatch = model.category === selectedCategory;
    }

    const searchMatch = model.id.toLowerCase().includes(searchQuery.toLowerCase());
    const providerMatch = selectedProvider === 'all' || model.owned_by === selectedProvider;
    return categoryMatch && searchMatch && providerMatch;
  });

  const getProviderLogo = (providerId) => {
    const provider = providers.find(p => p.id === providerId);
    return provider ? provider.logo : '/logos/default.svg';
  };

  const getModelBadgeColor = (category) => {
    const colors = {
      text: '#10b981',
      image: '#8b5cf6',
      audio: '#f59e0b',
      video: '#ef4444',
      code: '#06b6d4',
      multimodal: '#ec4899',
      embeddings: '#6366f1'
    };
    return colors[category] || '#6b7280';
  };

  const getPricingTierColor = (tier) => {
    return tier === 'free' ? '#10b981' : '#f59e0b';
  };

  const formatPricing = (model) => {
    if (model.pricing_tier === 'free') {
      return 'Free';
    }

    if (model.pricing && model.pricing.input) {
      return `$${model.pricing.input}/1K tokens`;
    }

    return 'Pro';
  };

  return (
    <div className="models-explorer">
      <div className="explorer-header">
        <h1 className="page-title">AI Models</h1>
        <p className="page-description">
          Explore 700+ AI models from 500+ providers. Access cutting-edge AI through a unified API.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input search-input"
          />
        </div>
        <div className="filter-controls">
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="select provider-select"
          >
            <option value="all">All Providers</option>
            {providers.map(provider => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`category-tab ${selectedCategory === category.id ? 'active' : ''} ${
              category.id === 'free' ? 'free-tab' : category.id === 'pro' ? 'pro-tab' : ''
            }`}
          >
            {category.label}
            <span className="count-badge">{category.count}</span>
          </button>
        ))}
      </div>

      {/* Models Grid */}
      <div className="models-grid">
        {filteredModels.map(model => (
          <div key={model.id} className="model-card">
            <div className="model-header">
              <div className="model-info">
                <img
                  src={getProviderLogo(model.owned_by)}
                  alt={model.owned_by}
                  className="provider-logo"
                />
                <div className="model-details">
                  <h3 className="model-name">{model.id}</h3>
                  <p className="model-provider">{model.owned_by}</p>
                </div>
              </div>
              <div className="model-badges">
                <span
                  className="pricing-badge"
                  style={{ backgroundColor: getPricingTierColor(model.pricing_tier) }}
                >
                  {model.pricing_tier === 'free' ? 'FREE' : 'PRO'}
                </span>
                <span
                  className="category-badge"
                  style={{ backgroundColor: getModelBadgeColor(model.category) }}
                >
                  {model.category}
                </span>
              </div>
              <div className="model-pricing">
                <span className="pricing-text">{formatPricing(model)}</span>
              </div>
            </div>
            <div className="model-actions">
              <button className="button button-primary">Try in Playground</button>
              <button className="button button-secondary">View Docs</button>
            </div>
          </div>
        ))}
      </div>

      {/* Results Count */}
      <div className="results-info">
        Showing {filteredModels.length} of {models.length} models
      </div>
    </div>
  );
}

export default ModelsExplorer;